/**
 * MongoDB Connection Diagnostics
 */

// Load environment variables
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });

const dns = require('dns');
const { promisify } = require('util');

const resolve4 = promisify(dns.resolve4);

async function runDiagnostics() {
  console.log('🔍 MongoDB Connection Diagnostics');
  console.log('================================');
  
  const uri = process.env.MONGO_URI || '';
  const dbName = process.env.DB_NAME || 'musclerise';
  
  console.log('1. Environment Variables Check');
  console.log(`   MONGO_URI: ${uri ? '✅ Set' : '❌ Not set'}`);
  console.log(`   DB_NAME: ${dbName ? '✅ Set' : '❌ Not set'}`);
  console.log(`   ENABLE_MONGODB: ${process.env.ENABLE_MONGODB ? '✅ Set' : '❌ Not set'}`);
  
  if (!uri) {
    console.log('❌ MONGO_URI is not set. Please check your .env file.');
    return;
  }
  
  // Extract hostname from URI
  try {
    const match = uri.match(/mongodb\+srv:\/\/[^@]+@([^\/]+)/);
    if (!match) {
      console.log('❌ Could not parse hostname from MONGO_URI');
      return;
    }
    
    const hostname = match[1];
    console.log(`\n2. Hostname Extraction`);
    console.log(`   Hostname: ${hostname}`);
    
    // DNS Resolution Test
    console.log(`\n3. DNS Resolution Test`);
    try {
      console.log(`   Resolving ${hostname}...`);
      const addresses = await resolve4(hostname);
      console.log(`   ✅ DNS Resolution Successful: ${addresses.join(', ')}`);
    } catch (dnsError) {
      console.log(`   ❌ DNS Resolution Failed: ${dnsError.message}`);
      console.log('   This suggests network connectivity issues or DNS configuration problems.');
    }
    
    // Check for common URI issues
    console.log(`\n4. URI Format Check`);
    if (uri.includes('<')) {
      console.log('   ❌ URI contains placeholders (<>). Please replace with actual values.');
    } else {
      console.log('   ✅ URI format appears correct');
    }
    
    // Check if password might be exposed
    const passwordMatch = uri.match(/:(.+?)@/);
    if (passwordMatch && passwordMatch[1] && passwordMatch[1].length > 5) {
      console.log('   ⚠️  Password is visible in URI. Consider changing it for security.');
    }
    
  } catch (error) {
    console.log(`❌ Error parsing URI: ${error.message}`);
  }
  
  console.log(`\n5. MongoDB Atlas Troubleshooting Steps`);
  console.log(`   1. Log in to MongoDB Atlas at https://cloud.mongodb.com`);
  console.log(`   2. Go to your cluster's "Network Access" settings`);
  console.log(`   3. Ensure your current IP address is whitelisted`);
  console.log(`   4. Try adding 0.0.0.0/0 temporarily for testing (remove after)`);
  console.log(`   5. Check that your database user has proper permissions`);
  console.log(`   6. Verify your system time is correct`);
  console.log(`   7. Try connecting from a different network`);
  console.log(`   8. Check firewall/antivirus settings`);
  
  console.log(`\n6. Fallback Information`);
  console.log(`   Your application is currently working with JSON file storage`);
  console.log(`   Data is stored in: server/data/users.json`);
  console.log(`   The application automatically falls back to JSON when MongoDB is unavailable`);
}

runDiagnostics().catch(console.error);