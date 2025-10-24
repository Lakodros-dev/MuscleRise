#!/usr/bin/env tsx

/**
 * Script to check admin data in MongoDB
 */

import dotenv from 'dotenv';
import path from 'path';
// Load environment variables FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { MongoClient } from 'mongodb';

async function checkAdminData() {
  console.log('Checking MongoDB admin data...');
  
  try {
    // Get MongoDB configuration from environment
    const MONGO_URI = process.env.MONGO_URI;
    const DB_NAME = process.env.DB_NAME;
    
    if (!MONGO_URI || !DB_NAME) {
      console.error('❌ Missing MongoDB configuration in environment variables');
      process.exit(1);
    }
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(MONGO_URI, {
      tls: true,
      connectTimeoutMS: 15000,
      serverSelectionTimeoutMS: 15000,
    });
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const adminCollection = db.collection('admin');
    
    // Check admin data
    const adminData = await adminCollection.findOne({});
    if (adminData) {
      console.log('✅ Admin data found in MongoDB');
      console.log('Admin last updated:', adminData.lastUpdated);
      console.log('Admin last login:', adminData.lastLoginAt);
      console.log('Global muscle boost enabled:', adminData.globalMuscleBoostEnabled);
      if (adminData.migratedAt) {
        console.log('Migrated at:', adminData.migratedAt);
      }
    } else {
      console.log('❌ No admin data found in MongoDB');
    }
    
    // Close connection
    await client.close();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error: any) {
    console.error('❌ Error checking admin data:', error.message);
    process.exit(1);
  }
}

checkAdminData();