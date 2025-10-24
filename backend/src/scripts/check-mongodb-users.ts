import dotenv from 'dotenv';
import path from 'path';
// Load environment variables FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { MongoClient } from 'mongodb';

async function checkUsers() {
  console.log('Checking MongoDB users...');
  
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(process.env.MONGO_URI!);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(process.env.DB_NAME);
    const usersCollection = db.collection('users');
    
    // Count users
    const count = await usersCollection.countDocuments();
    console.log(`Users count: ${count}`);
    
    if (count > 0) {
      // Get first user
      const firstUser = await usersCollection.findOne();
      console.log('First user:', firstUser?.username);
    } else {
      console.log('No users found in MongoDB');
    }
    
    await client.close();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUsers();