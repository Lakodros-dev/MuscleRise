import dotenv from 'dotenv';
import path from 'path';
// Load environment variables FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { MongoClient } from 'mongodb';

async function testConnection() {
  console.log('Testing MongoDB connection...');
  console.log('MONGO_URI:', process.env.MONGO_URI);
  console.log('DB_NAME:', process.env.DB_NAME);
  
  if (!process.env.MONGO_URI || !process.env.DB_NAME) {
    console.log('Missing environment variables');
    return;
  }
  
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    console.log('✅ Connected successfully!');
    
    const db = client.db(process.env.DB_NAME);
    console.log('Database name:', db.databaseName);
    
    await client.close();
    console.log('✅ Disconnected successfully!');
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testConnection();