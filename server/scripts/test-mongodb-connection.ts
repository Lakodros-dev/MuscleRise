import dotenv from 'dotenv';
import path from 'path';
// Load environment variables FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { MongoClient } from 'mongodb';
import { DATABASE_CONFIG } from '../config/database';

async function testConnection() {
  console.log('Testing MongoDB connection with enhanced SSL options...');
  console.log('MONGO_URI:', process.env.MONGO_URI);
  console.log('DB_NAME:', process.env.DB_NAME);
  console.log('ENABLE_MONGODB:', process.env.ENABLE_MONGODB);
  
  if (!process.env.MONGO_URI || !process.env.DB_NAME) {
    console.log('Missing environment variables');
    return;
  }
  
  try {
    console.log('Connecting to MongoDB with enhanced SSL options...');
    const client = new MongoClient(process.env.MONGO_URI, {
      tls: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true,
      // Additional connection options to handle connection issues
      directConnection: false,
      connectTimeoutMS: 15000,
      serverSelectionTimeoutMS: 15000,
    });
    await client.connect();
    console.log('✅ Connected successfully!');
    
    const db = client.db(process.env.DB_NAME);
    console.log('Database name:', db.databaseName);
    
    // Try to access the users collection
    const usersCollection = db.collection('users');
    const count = await usersCollection.countDocuments();
    console.log(`Found ${count} users in the database`);
    
    await client.close();
    console.log('✅ Disconnected successfully!');
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testConnection();