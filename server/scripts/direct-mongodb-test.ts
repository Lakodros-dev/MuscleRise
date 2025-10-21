import dotenv from 'dotenv';
import path from 'path';
import { MongoClient } from 'mongodb';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testDirectMongoDBConnection() {
  console.log('Testing direct MongoDB connection...');
  console.log('ENABLE_MONGODB:', process.env.ENABLE_MONGODB);
  console.log('MONGO_URI:', process.env.MONGO_URI ? '***' : 'Not set');
  console.log('DB_NAME:', process.env.DB_NAME);

  if (!process.env.MONGO_URI || !process.env.DB_NAME) {
    console.log('Missing MongoDB configuration');
    return;
  }

  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    console.log('✅ Successfully connected to MongoDB');
    
    const db = client.db(process.env.DB_NAME);
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    const usersCollection = db.collection('users');
    const usersCount = await usersCollection.countDocuments();
    console.log('Users collection count:', usersCount);
    
    if (usersCount > 0) {
      const firstUser = await usersCollection.findOne();
      console.log('First user username:', firstUser?.username);
    }
    
    await client.close();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
  }
}

testDirectMongoDBConnection().catch(console.error);