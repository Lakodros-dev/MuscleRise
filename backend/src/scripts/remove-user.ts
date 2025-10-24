#!/usr/bin/env tsx

/**
 * Script to remove a specific user from both MongoDB and JSON file
 * 
 * Usage:
 *   npx tsx server/scripts/remove-user.ts <username>
 */

import dotenv from 'dotenv';
import path from 'path';
// Load environment variables FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { MongoClient } from 'mongodb';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { DATABASE_CONFIG } from '../config/database';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.join(__dirname, "..", "data", "users.json");

async function removeUser(username: string) {
  console.log(`🚀 Removing user "${username}" from both MongoDB and JSON file...`);
  
  try {
    // Remove from MongoDB
    if (DATABASE_CONFIG.ENABLE_MONGODB && DATABASE_CONFIG.MONGO_URI) {
      console.log('🔗 Connecting to MongoDB...');
      const client = new MongoClient(DATABASE_CONFIG.MONGO_URI);
      await client.connect();
      console.log('✅ Connected to MongoDB');
      
      const db = client.db(DATABASE_CONFIG.DB_NAME);
      const usersCollection = db.collection('users');
      
      // Remove the user
      const result = await usersCollection.deleteOne({ username: username });
      
      if (result.deletedCount > 0) {
        console.log(`✅ Successfully removed user "${username}" from MongoDB`);
      } else {
        console.log(`⚠️  User "${username}" not found in MongoDB`);
      }
      
      // Close connection
      await client.close();
      console.log('✅ Disconnected from MongoDB');
    } else {
      console.log('⏭️  MongoDB is disabled, skipping MongoDB removal');
    }
    
    // Remove from JSON file
    console.log('📂 Reading data from JSON file...');
    const txt = await fs.readFile(DATA_PATH, "utf-8");
    const users = JSON.parse(txt);
    
    console.log(`📊 Found ${users.length} users in JSON file`);
    
    // Filter out the user to remove
    const filteredUsers = users.filter((user: any) => user.username !== username);
    
    if (filteredUsers.length < users.length) {
      console.log(`✅ Found and removed user "${username}" from JSON file`);
      
      // Write the updated users array back to the file
      console.log('💾 Writing updated data to JSON file...');
      await fs.writeFile(DATA_PATH, JSON.stringify(filteredUsers, null, 2), "utf-8");
      console.log('✅ Successfully updated JSON file');
      console.log(`📊 Users count after removal: ${filteredUsers.length}`);
    } else {
      console.log(`⚠️  User "${username}" not found in JSON file`);
    }
    
    console.log('\n✅ User removal completed successfully!');
    
  } catch (error) {
    console.error('❌ User removal failed:', error);
    process.exit(1);
  }
}

// Get username from command line arguments
const args = process.argv.slice(2);
const username = args[0];

if (!username) {
  console.error('❌ Please provide a username to remove');
  console.log('Usage: npx tsx server/scripts/remove-user.ts <username>');
  process.exit(1);
}

removeUser(username);