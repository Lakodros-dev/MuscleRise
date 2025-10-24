#!/usr/bin/env tsx

/**
 * Test different SSL configurations for MongoDB connection
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { MongoClient } from 'mongodb';

// Test different SSL configurations
const testConfigs = [
  {
    name: "Default SSL",
    options: {
      tls: true,
    }
  },
  {
    name: "Allow Invalid Certs",
    options: {
      tls: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true,
    }
  },
  {
    name: "Enhanced SSL Options",
    options: {
      tls: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true,
      connectTimeoutMS: 15000,
      serverSelectionTimeoutMS: 15000,
    }
  },
  {
    name: "DNS Resolved Connection",
    options: {
      tls: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true,
      connectTimeoutMS: 15000,
      serverSelectionTimeoutMS: 15000,
      directConnection: false,
    }
  }
];

async function testConnection(name: string, uri: string, options: any) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`🔗 URI: ${uri.substring(0, 50)}...`);
  
  try {
    const client = new MongoClient(uri, options);
    console.log(`⏳ Connecting...`);
    await client.connect();
    console.log(`✅ Success: ${name}`);
    
    const db = client.db(process.env.DB_NAME || 'musclerise');
    const collections = await db.listCollections().toArray();
    console.log(`📂 Collections found: ${collections.length}`);
    
    await client.close();
    return true;
  } catch (error: any) {
    console.log(`❌ Failed: ${name}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting MongoDB SSL Configuration Tests');
  console.log('=========================================');
  
  const uri = process.env.MONGO_URI || '';
  const dbName = process.env.DB_NAME || 'musclerise';
  
  if (!uri) {
    console.log('❌ MONGO_URI not found in environment variables');
    return;
  }
  
  console.log(`🗄️  Database: ${dbName}`);
  console.log(`🔗 Base URI: ${uri.substring(0, 60)}...`);
  
  let successCount = 0;
  
  for (const config of testConfigs) {
    const success = await testConnection(config.name, uri, config.options);
    if (success) successCount++;
  }
  
  console.log('\n=========================================');
  console.log(`📊 Results: ${successCount}/${testConfigs.length} configurations successful`);
  
  if (successCount === 0) {
    console.log('\n⚠️  All connection attempts failed. This suggests:');
    console.log('   1. Network/firewall issues');
    console.log('   2. MongoDB Atlas IP whitelist restrictions');
    console.log('   3. Incorrect credentials');
    console.log('   4. System time not synchronized');
  } else if (successCount < testConfigs.length) {
    console.log('\n⚠️  Some configurations worked. Use the successful one in your app.');
  } else {
    console.log('\n✅ All configurations worked! Use any in your application.');
  }
}

runAllTests().catch(console.error);