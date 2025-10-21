import { MongoClient, Db, Collection } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { DATABASE_CONFIG } from '../config/database';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection
let db: Db | null = null;
let usersCollection: Collection | null = null;

// JSON file path
const DATA_PATH = path.join(__dirname, "..", "data", "users.json");

// Initialize MongoDB connection
export async function initDatabase() {
  // Only initialize MongoDB if it's enabled in the configuration
  if (!DATABASE_CONFIG.ENABLE_MONGODB) {
    console.log('⏭️  MongoDB is disabled, using JSON files only');
    return;
  }
  
  try {
    console.log('🔗 Attempting to connect to MongoDB...');
    
    // Enhanced connection options for better compatibility
    const client = new MongoClient(DATABASE_CONFIG.MONGO_URI, {
      // SSL/TLS options
      tls: true,
      // Connection options
      connectTimeoutMS: 15000,
      serverSelectionTimeoutMS: 15000,
      // Retry options
      retryWrites: true,
      // Remove deprecated options that might cause conflicts
    });
    
    await client.connect();
    db = client.db(DATABASE_CONFIG.DB_NAME);
    usersCollection = db.collection('users');
    console.log('✅ Connected to MongoDB successfully');
    
    // Test the connection by performing a simple operation
    await usersCollection.countDocuments();
    console.log('✅ MongoDB connection verified');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    // Fallback to JSON files if MongoDB connection fails
    console.log('⏭️  Falling back to JSON files only');
    db = null;
    usersCollection = null;
  }
}

// Check if MongoDB is available
export function isMongoDBAvailable(): boolean {
  return DATABASE_CONFIG.ENABLE_MONGODB && db !== null && usersCollection !== null;
}

// Read users from either MongoDB or JSON file
export async function readUsers() {
  try {
    // If MongoDB is available, read from MongoDB
    if (isMongoDBAvailable() && usersCollection) {
      const users = await usersCollection.find({}).toArray();
      return users;
    }
    
    // Otherwise, read from JSON file
    const txt = await fs.readFile(DATA_PATH, "utf-8");
    return JSON.parse(txt);
  } catch (error) {
    console.error('Error reading users:', error);
    return [];
  }
}

// Write users to either MongoDB or JSON file
export async function writeUsers(users: any[]) {
  try {
    // If MongoDB is available, write to MongoDB
    if (isMongoDBAvailable() && usersCollection) {
      // For MongoDB, we need to replace the entire collection
      // In a production environment, you would want to use upsert operations
      await usersCollection.deleteMany({});
      if (users.length > 0) {
        await usersCollection.insertMany(users);
      }
      return;
    }
    
    // Otherwise, write to JSON file
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(users, null, 2), "utf-8");
  } catch (error) {
    console.error('Error writing users:', error);
  }
}

// Update a single user
export async function updateUser(userId: string, updates: any) {
  try {
    // If MongoDB is available, update in MongoDB
    if (isMongoDBAvailable() && usersCollection) {
      await usersCollection.updateOne({ id: userId }, { $set: updates });
      return;
    }
    
    // Otherwise, update in JSON file
    const users = await readUsers();
    const userIndex = users.findIndex((u: any) => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updates };
      await writeUsers(users);
    }
  } catch (error) {
    console.error('Error updating user:', error);
  }
}