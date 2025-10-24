#!/usr/bin/env tsx

/**
 * Script to verify MongoDB connection when server starts
 */

import dotenv from 'dotenv';
import path from 'path';
// Load environment variables FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { initDatabase, isMongoDBAvailable, readUsers } from '../services/database';

async function verifyConnection() {
  console.log('🔍 Verifying MongoDB connection...');
  console.log('ENABLE_MONGODB:', process.env.ENABLE_MONGODB);
  
  // Initialize database connection
  await initDatabase();
  
  // Check if MongoDB is available
  const isAvailable = isMongoDBAvailable();
  console.log('MongoDB availability:', isAvailable ? '✅ Available' : '❌ Not available');
  
  if (isAvailable) {
    try {
      // Try to read users to verify functionality
      const users = await readUsers();
      console.log(`📊 Successfully read ${users.length} users from MongoDB`);
      console.log('✅ MongoDB connection is working properly');
    } catch (error) {
      console.error('❌ Error reading from MongoDB:', error);
    }
  } else {
    console.log('📝 Reading from JSON file instead...');
    try {
      const users = await readUsers();
      console.log(`📊 Successfully read ${users.length} users from JSON file`);
      console.log('ℹ️  Using JSON file storage as fallback');
    } catch (error) {
      console.error('❌ Error reading from JSON file:', error);
    }
  }
}

verifyConnection().then(() => {
  console.log('✅ Verification complete');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});