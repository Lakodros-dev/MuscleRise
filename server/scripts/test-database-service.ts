import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('Environment variables:');
console.log('- ENABLE_MONGODB:', process.env.ENABLE_MONGODB);
console.log('- MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');
console.log('- DB_NAME:', process.env.DB_NAME);

// Import after loading environment variables
import { initDatabase, readUsers, writeUsers } from '../services/database';

async function testDatabaseService() {
  console.log('Testing database service...');
  
  try {
    // Initialize database
    await initDatabase();
    
    // Read users
    const users = await readUsers();
    console.log(`Found ${users.length} users`);
    
    if (users.length > 0) {
      console.log('First user:', users[0].username);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testDatabaseService();