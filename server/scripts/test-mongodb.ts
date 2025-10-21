#!/usr/bin/env tsx

/**
 * Test script to verify MongoDB connection and data
 * 
 * Usage:
 *   npx tsx server/scripts/test-mongodb.ts
 */

import { MongoClient } from 'mongodb';
import { DATABASE_CONFIG } from '../config/database';

async function testConnection() {
  console.log('🚀 Testing MongoDB connection...');
  
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    const client = new MongoClient(DATABASE_CONFIG.MONGO_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');
    
    const db = client.db(DATABASE_CONFIG.DB_NAME);
    const usersCollection = db.collection('users');
    
    // Count users in MongoDB
    const userCount = await usersCollection.countDocuments();
    console.log(`📊 Found ${userCount} users in MongoDB`);
    
    // Show first few users (without sensitive data)
    if (userCount > 0) {
      const users = await usersCollection.find({}).limit(5).toArray();
      console.log('\n📋 First 5 users:');
      users.forEach((user: any, index: number) => {
        console.log(`${index + 1}. ${user.username || 'No username'} (${user.id})`);
      });
    } else {
      console.log('\n📝 No users found in MongoDB');
    }
    
    // Close connection
    await client.close();
    console.log('\n✅ MongoDB connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ MongoDB connection test failed:', error);
    process.exit(1);
  }
}

testConnection();