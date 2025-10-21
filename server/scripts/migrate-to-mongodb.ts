#!/usr/bin/env tsx

/**
 * Migration script to move data from JSON files to MongoDB
 * 
 * Usage:
 *   npx tsx server/scripts/migrate-to-mongodb.ts
 */

import dotenv from 'dotenv';
import path from 'path';
// Load environment variables FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('Environment variables loaded:');
console.log('- ENABLE_MONGODB:', process.env.ENABLE_MONGODB);
console.log('- MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');
console.log('- DB_NAME:', process.env.DB_NAME);

import { MongoClient } from 'mongodb';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { DATABASE_CONFIG } from '../config/database';

console.log('Database config loaded:');
console.log('- ENABLE_MONGODB:', DATABASE_CONFIG.ENABLE_MONGODB);
console.log('- MONGO_URI:', DATABASE_CONFIG.MONGO_URI ? 'Set' : 'Not set');
console.log('- DB_NAME:', DATABASE_CONFIG.DB_NAME);

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateData() {
  console.log('🚀 Starting data migration from JSON to MongoDB...');
  
  // Check if MongoDB is enabled
  if (!DATABASE_CONFIG.ENABLE_MONGODB) {
    console.log('⏭️  MongoDB is disabled. No migration needed.');
    return;
  }
  
  try {
    // Connect to MongoDB with enhanced options
    console.log('🔗 Connecting to MongoDB...');
    const client = new MongoClient(DATABASE_CONFIG.MONGO_URI, {
      tls: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true,
      connectTimeoutMS: 15000,
      serverSelectionTimeoutMS: 15000,
    });
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DATABASE_CONFIG.DB_NAME);
    const usersCollection = db.collection('users');
    
    // Read data from JSON file
    console.log('📂 Reading data from JSON file...');
    const DATA_PATH = path.join(__dirname, "..", "data", "users.json");
    console.log('Data path:', DATA_PATH);
    
    const txt = await fs.readFile(DATA_PATH, "utf-8");
    const users = JSON.parse(txt);
    
    console.log(`📊 Found ${users.length} users in JSON file`);
    
    // Clear existing data in MongoDB (if any)
    console.log('🗑️  Clearing existing data in MongoDB...');
    const deleteResult = await usersCollection.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing documents`);
    
    // Insert data into MongoDB
    if (users.length > 0) {
      console.log('💾 Inserting data into MongoDB...');
      const result = await usersCollection.insertMany(users);
      console.log(`✅ Successfully migrated ${result.insertedCount} users to MongoDB`);
    } else {
      console.log('✅ No users to migrate');
    }
    
    // Verify the migration
    const count = await usersCollection.countDocuments();
    console.log(`🔍 Verification: ${count} users now in MongoDB`);
    
    // Close connection
    await client.close();
    console.log('✅ Migration completed successfully!');
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error details:', error);
    
    // Check if it's a credential issue
    if (error.message && error.message.includes('authentication')) {
      console.error('🔐 This might be an authentication issue. Please check your username and password.');
    }
    
    // Check if it's a network/SSL issue
    if (error.message && (error.message.includes('SSL') || error.message.includes('ssl') || error.message.includes('certificate'))) {
      console.error('🔒 This appears to be an SSL/TLS issue. Try the following:');
      console.log('1. Check your firewall and antivirus settings');
      console.log('2. Ensure your system time is correct');
      console.log('3. Try connecting from a different network');
      console.log('4. Check if your IP address is whitelisted in MongoDB Atlas');
    }
    
    process.exit(1);
  }
}

// Run migration if script is executed directly
console.log('Running migration directly...');
migrateData();

export { migrateData };