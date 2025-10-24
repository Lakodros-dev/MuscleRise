import "dotenv/config";
import { MongoClient } from 'mongodb';

async function testMongoDBConnection() {
  console.log('🔍 Testing MongoDB connection...');
  console.log('📍 Environment variables:');
  console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}`);
  console.log(`   ENABLE_MONGODB: ${process.env.ENABLE_MONGODB}`);

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/musclerise';
  console.log(`🔗 Connecting to: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`);

  try {
    const client = new MongoClient(mongoUri, {
      tls: mongoUri.includes('mongodb+srv'),
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });

    console.log('⏳ Attempting connection...');
    await client.connect();

    console.log('✅ Connected successfully!');

    // Test database operations
    const db = client.db('musclerise');
    console.log('📊 Testing database operations...');

    // Test collection access
    const testCollection = db.collection('test');
    await testCollection.insertOne({ test: true, timestamp: new Date() });
    console.log('✅ Insert operation successful');

    const count = await testCollection.countDocuments();
    console.log(`📈 Document count: ${count}`);

    // Clean up test document
    await testCollection.deleteOne({ test: true });
    console.log('🧹 Cleanup successful');

    await client.close();
    console.log('🔐 Connection closed');

    console.log('\n🎉 MongoDB connection test PASSED!');

  } catch (error) {
    console.error('❌ MongoDB connection test FAILED:');
    console.error('Error details:', error);

    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND')) {
        console.log('\n💡 Suggestions:');
        console.log('   - Check if MongoDB is running locally');
        console.log('   - Verify the connection string');
        console.log('   - Check network connectivity');
      } else if (error.message.includes('authentication')) {
        console.log('\n💡 Suggestions:');
        console.log('   - Check username and password');
        console.log('   - Verify database user permissions');
      } else if (error.message.includes('timeout')) {
        console.log('\n💡 Suggestions:');
        console.log('   - Check network connectivity');
        console.log('   - Verify firewall settings');
        console.log('   - Check if MongoDB Atlas IP whitelist is configured');
      }
    }

    process.exit(1);
  }
}

// Run the test
testMongoDBConnection();