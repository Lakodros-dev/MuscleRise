#!/usr/bin/env tsx

/**
 * Simple migration script to move data from JSON files to MongoDB
 * 
 * Usage:
 *   npx tsx server/scripts/migrate-json-to-mongodb.ts
 */

import dotenv from 'dotenv';
import path from 'path';
// Load environment variables FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { MongoClient } from 'mongodb';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateUsers() {
  console.log('🚀 Starting user data migration from JSON to MongoDB...');
  
  try {
    // Get MongoDB configuration from environment
    const MONGO_URI = process.env.MONGO_URI;
    const DB_NAME = process.env.DB_NAME;
    
    if (!MONGO_URI || !DB_NAME) {
      console.error('❌ Missing MongoDB configuration in environment variables');
      process.exit(1);
    }
    
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    const client = new MongoClient(MONGO_URI, {
      tls: true,
      connectTimeoutMS: 15000,
      serverSelectionTimeoutMS: 15000,
    });
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Read users from JSON file
    console.log('📂 Reading users from JSON file...');
    const DATA_PATH = path.join(__dirname, "..", "data", "users.json");
    const txt = await fs.readFile(DATA_PATH, "utf-8");
    const users = JSON.parse(txt);
    
    console.log(`📊 Found ${users.length} users in JSON file`);
    
    // Clear existing data in MongoDB (if any)
    console.log('🗑️  Clearing existing user data in MongoDB...');
    const deleteResult = await usersCollection.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing user documents`);
    
    // Insert users into MongoDB
    if (users.length > 0) {
      console.log('💾 Inserting users into MongoDB...');
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
    console.log('✅ User data migration completed successfully!');
    
  } catch (error: any) {
    console.error('❌ User data migration failed:', error.message);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

async function migrateAdmin() {
  console.log('🚀 Starting admin data migration from JSON to MongoDB...');
  
  try {
    // Get MongoDB configuration from environment
    const MONGO_URI = process.env.MONGO_URI;
    const DB_NAME = process.env.DB_NAME;
    
    if (!MONGO_URI || !DB_NAME) {
      console.error('❌ Missing MongoDB configuration in environment variables');
      process.exit(1);
    }
    
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    const client = new MongoClient(MONGO_URI, {
      tls: true,
      connectTimeoutMS: 15000,
      serverSelectionTimeoutMS: 15000,
    });
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const adminCollection = db.collection('admin');
    
    // Read admin data from JSON file
    console.log('📂 Reading admin data from JSON file...');
    const ADMIN_PATH = path.join(__dirname, "..", "data", "admin.json");
    const txt = await fs.readFile(ADMIN_PATH, "utf-8");
    const adminData = JSON.parse(txt);
    
    // Add a timestamp to indicate when it was migrated
    adminData.migratedAt = new Date().toISOString();
    
    console.log('💾 Inserting admin data into MongoDB...');
    // Clear existing admin data
    await adminCollection.deleteMany({});
    // Insert new admin data
    const result = await adminCollection.insertOne(adminData);
    console.log(`✅ Successfully migrated admin data to MongoDB with ID: ${result.insertedId}`);
    
    // Close connection
    await client.close();
    console.log('✅ Admin data migration completed successfully!');
    
  } catch (error: any) {
    console.error('❌ Admin data migration failed:', error.message);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

async function main() {
  console.log('🚀 Starting complete data migration from JSON to MongoDB...');
  
  // Check if MongoDB is enabled
  if (process.env.ENABLE_MONGODB !== 'true') {
    console.log('⏭️  MongoDB is disabled. No migration needed.');
    return;
  }
  
  try {
    console.log('Starting user migration...');
    await migrateUsers();
    console.log('User migration completed. Starting admin migration...');
    await migrateAdmin();
    console.log('🎉 All data migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    process.exit(1);
  }
}

// Run migration if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { migrateUsers, migrateAdmin, main };