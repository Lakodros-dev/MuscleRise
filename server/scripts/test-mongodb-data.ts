import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// NOW import the database service after environment variables are loaded
import { initDatabase, readUsers, writeUsers, updateUser } from '../services/database';

async function testMongoDBData() {
  console.log('Testing MongoDB data operations...');
  console.log('ENABLE_MONGODB:', process.env.ENABLE_MONGODB);
  console.log('MONGO_URI:', process.env.MONGO_URI ? '***' : 'Not set');
  console.log('DB_NAME:', process.env.DB_NAME);
  
  // Initialize database connection
  await initDatabase();
  
  // Read existing users
  const users = await readUsers();
  console.log('Current users count:', users.length);
  
  if (users.length > 0) {
    console.log('First user:', JSON.stringify(users[0].username, null, 2));
  } else {
    console.log('No users found in database');
  }
  
  console.log('Test completed successfully!');
}

testMongoDBData().catch(console.error);