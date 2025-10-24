import { MongoClient } from 'mongodb';

// MongoDB connection URI from your .env file
const uri = "mongodb+srv://lordlakodros_db_user:Lakodros01@base.wu36gsc.mongodb.net/?retryWrites=true&w=majority&appName=Base";
const dbName = "musclerise";

async function testConnection() {
  console.log('Testing MongoDB connection...');
  console.log('URI:', uri);
  console.log('Database:', dbName);
  
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    // Connect to the MongoDB cluster
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Access the database
    const db = client.db(dbName);
    console.log('Database name:', db.databaseName);
    
    // List collections to verify database access
    const collections = await db.listCollections().toArray();
    console.log('Collections in database:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
  } finally {
    // Close the connection
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

testConnection();