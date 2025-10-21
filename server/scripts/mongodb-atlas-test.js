import { MongoClient } from 'mongodb';
import dns from 'dns';

// Force DNS resolution to use IPv4 only (sometimes helps with connection issues)
dns.setDefaultResultOrder('ipv4first');

// MongoDB connection URI from your .env file
const uri = "mongodb+srv://lordlakodros_db_user:Lakodros01@base.wu36gsc.mongodb.net/?retryWrites=true&w=majority&appName=Base";
const dbName = "musclerise";

async function testConnection() {
  console.log('Testing MongoDB Atlas connection...');
  console.log('URI:', uri);
  console.log('Database:', dbName);
  
  // Test DNS resolution first
  try {
    console.log('Testing DNS resolution...');
    const domain = 'base.wu36gsc.mongodb.net';
    const addresses = await dns.promises.resolve4(domain);
    console.log('DNS resolution successful:', addresses);
  } catch (dnsError) {
    console.error('DNS resolution failed:', dnsError);
  }
  
  const client = new MongoClient(uri, {
    // SSL/TLS options
    tls: true,
    // Connection options
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
    // Retry options
    retryWrites: true,
    // Remove deprecated options
  });

  try {
    // Connect to the MongoDB cluster
    console.log('Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected successfully to MongoDB Atlas!');

    // Access the database
    const db = client.db(dbName);
    console.log('Database name:', db.databaseName);
    
    // Try to list collections
    console.log('Listing collections...');
    const collections = await db.listCollections().toArray();
    console.log('Collections found:', collections.map(c => c.name));
    
    // Try to access users collection specifically
    console.log('Accessing users collection...');
    const usersCollection = db.collection('users');
    const count = await usersCollection.estimatedDocumentCount();
    console.log(`Users collection contains ${count} documents`);
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
    
    // Check if it's a credential issue
    if (error.message && error.message.includes('authentication')) {
      console.error('This might be an authentication issue. Please check your username and password.');
    }
    
    // Check if it's a network/SSL issue
    if (error.message && (error.message.includes('SSL') || error.message.includes('ssl'))) {
      console.error('This appears to be an SSL/TLS issue. Try the following:');
      console.log('1. Check your firewall and antivirus settings');
      console.log('2. Ensure your system time is correct');
      console.log('3. Try connecting from a different network');
      console.log('4. Check if your IP address is whitelisted in MongoDB Atlas');
    }
  } finally {
    // Close the connection
    try {
      await client.close();
      console.log('Disconnected from MongoDB Atlas');
    } catch (closeError) {
      console.error('Error closing connection:', closeError);
    }
  }
}

testConnection();