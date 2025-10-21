#!/usr/bin/env node

/**
 * MongoDB Connection Test Script
 * Tests MongoDB Atlas connection and basic operations
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || 'musclerise';

async function testMongoConnection() {
    console.log('🔍 Testing MongoDB Connection...\n');

    if (!MONGO_URI) {
        console.error('❌ MONGO_URI not found in environment variables');
        return;
    }

    console.log('📋 Connection Details:');
    console.log(`   URI: ${MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    console.log(`   Database: ${DB_NAME}\n`);

    let client;

    try {
        console.log('🔗 Attempting to connect...');

        // Create client with enhanced options
        client = new MongoClient(MONGO_URI, {
            // Connection options
            connectTimeoutMS: 10000,
            serverSelectionTimeoutMS: 10000,
            // SSL/TLS
            tls: true,
            // Retry options
            retryWrites: true,
            // Monitoring
            monitorCommands: true
        });

        // Connect to MongoDB
        await client.connect();
        console.log('✅ Connected to MongoDB successfully');

        // Get database
        const db = client.db(DB_NAME);
        console.log(`✅ Database "${DB_NAME}" accessed`);

        // Test basic operations
        console.log('\n🧪 Testing basic operations...');

        // 1. List collections
        const collections = await db.listCollections().toArray();
        console.log(`📁 Collections found: ${collections.length}`);
        collections.forEach(col => {
            console.log(`   - ${col.name}`);
        });

        // 2. Test users collection
        const usersCollection = db.collection('users');

        // Count documents
        const userCount = await usersCollection.countDocuments();
        console.log(`👥 Users in database: ${userCount}`);

        // 3. Test write operation (insert a test document)
        const testDoc = {
            _testId: 'connection-test',
            timestamp: new Date(),
            message: 'MongoDB connection test successful'
        };

        await usersCollection.insertOne(testDoc);
        console.log('✅ Test document inserted');

        // 4. Test read operation
        const foundDoc = await usersCollection.findOne({ _testId: 'connection-test' });
        if (foundDoc) {
            console.log('✅ Test document retrieved');
        }

        // 5. Clean up test document
        await usersCollection.deleteOne({ _testId: 'connection-test' });
        console.log('✅ Test document cleaned up');

        // 6. Test aggregation
        const pipeline = [
            { $group: { _id: null, count: { $sum: 1 } } }
        ];
        const aggResult = await usersCollection.aggregate(pipeline).toArray();
        console.log(`📊 Aggregation test: ${aggResult.length > 0 ? 'Success' : 'No data'}`);

        console.log('\n🎉 All MongoDB tests passed!');

        // Connection info
        const admin = db.admin();
        const serverStatus = await admin.serverStatus();
        console.log('\n📊 Server Information:');
        console.log(`   MongoDB Version: ${serverStatus.version}`);
        console.log(`   Uptime: ${Math.floor(serverStatus.uptime / 3600)} hours`);
        console.log(`   Connections: ${serverStatus.connections.current}/${serverStatus.connections.available}`);

    } catch (error) {
        console.error('\n❌ MongoDB Connection Failed:');
        console.error(`   Error: ${error.message}`);

        if (error.name === 'MongoServerSelectionError') {
            console.error('\n🔧 Troubleshooting Tips:');
            console.error('   1. Check your internet connection');
            console.error('   2. Verify MongoDB Atlas cluster is running');
            console.error('   3. Check IP whitelist in MongoDB Atlas');
            console.error('   4. Verify username and password');
            console.error('   5. Check if cluster is paused');
        }

        if (error.name === 'MongoNetworkTimeoutError') {
            console.error('\n🔧 Network Timeout Solutions:');
            console.error('   1. Check firewall settings');
            console.error('   2. Try different network connection');
            console.error('   3. Increase timeout values');
        }

        if (error.message.includes('authentication')) {
            console.error('\n🔧 Authentication Issues:');
            console.error('   1. Check username and password');
            console.error('   2. Verify database user permissions');
            console.error('   3. Check if user has access to the database');
        }

    } finally {
        if (client) {
            await client.close();
            console.log('\n🔌 Connection closed');
        }
    }
}

// Network connectivity test
async function testNetworkConnectivity() {
    console.log('🌐 Testing network connectivity...');

    try {
        const response = await fetch('https://www.google.com', {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
            console.log('✅ Internet connection: OK');
        } else {
            console.log('⚠️  Internet connection: Limited');
        }
    } catch (error) {
        console.log('❌ Internet connection: Failed');
        console.log(`   Error: ${error.message}`);
    }
}

// MongoDB Atlas specific tests
async function testAtlasConnectivity() {
    console.log('\n🏗️  Testing MongoDB Atlas connectivity...');

    try {
        // Extract hostname from URI
        const uriMatch = MONGO_URI.match(/@([^/]+)/);
        if (uriMatch) {
            const hostname = uriMatch[1].split('?')[0];
            console.log(`   Atlas Hostname: ${hostname}`);

            // Test DNS resolution (basic check)
            try {
                const url = `https://${hostname}`;
                const response = await fetch(url, {
                    method: 'HEAD',
                    signal: AbortSignal.timeout(5000)
                });
                console.log('✅ Atlas hostname reachable');
            } catch (dnsError) {
                console.log('⚠️  Atlas hostname test inconclusive');
            }
        }
    } catch (error) {
        console.log('⚠️  Could not parse Atlas hostname');
    }
}

// Main execution
async function main() {
    console.log('🚀 MongoDB Connection Diagnostic Tool\n');

    await testNetworkConnectivity();
    await testAtlasConnectivity();
    await testMongoConnection();

    console.log('\n📋 Diagnostic Complete');
}

main().catch(console.error);