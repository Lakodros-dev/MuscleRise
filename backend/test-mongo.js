import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
    console.log('🔍 Testing MongoDB connection...');

    const uri = process.env.MONGODB_URI;
    console.log('URI exists:', !!uri);

    if (!uri) {
        console.error('❌ MONGODB_URI not found in environment variables');
        return;
    }

    try {
        const client = new MongoClient(uri);
        console.log('⏳ Connecting...');

        await client.connect();
        console.log('✅ Connected successfully!');

        const db = client.db('musclerise');
        const collections = await db.listCollections().toArray();
        console.log('📊 Collections:', collections.map(c => c.name));

        await client.close();
        console.log('🔐 Connection closed');

    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    }
}

testConnection();