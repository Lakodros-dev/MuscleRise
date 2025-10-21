import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { MongoClient } from 'mongodb';
import fs from 'fs/promises';

async function migrate() {
  console.log('Starting migration...');
  
  try {
    const MONGO_URI = process.env.MONGO_URI;
    const DB_NAME = process.env.DB_NAME;
    
    if (!MONGO_URI || !DB_NAME) {
      throw new Error('Missing MongoDB configuration');
    }
    
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Migrate users
    console.log('Migrating users...');
    const usersCollection = db.collection('users');
    const usersData = JSON.parse(await fs.readFile('server/data/users.json', 'utf-8'));
    await usersCollection.deleteMany({});
    if (usersData.length > 0) {
      await usersCollection.insertMany(usersData);
    }
    console.log(`Migrated ${usersData.length} users`);
    
    // Migrate admin
    console.log('Migrating admin...');
    const adminCollection = db.collection('admin');
    const adminData = JSON.parse(await fs.readFile('server/data/admin.json', 'utf-8'));
    await adminCollection.deleteMany({});
    await adminCollection.insertOne(adminData);
    console.log('Migrated admin data');
    
    await client.close();
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();