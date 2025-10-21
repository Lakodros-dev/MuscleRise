const fs = require('fs');
const path = require('path');

// Path to the users.json file
const DATA_PATH = path.join(__dirname, "..", "data", "users.json");

// Read the users.json file
fs.readFile(DATA_PATH, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  try {
    // Parse the JSON data
    const users = JSON.parse(data);
    
    // Filter out the user with username "Lakodros"
    const filteredUsers = users.filter(user => user.username !== 'Lakodros');
    
    // Check if the user was found and removed
    if (filteredUsers.length < users.length) {
      console.log(`✅ Found and removed user "Lakodros" from JSON file`);
      console.log(`📊 Users count before removal: ${users.length}`);
      console.log(`📊 Users count after removal: ${filteredUsers.length}`);
      
      // Write the updated users array back to the file
      fs.writeFile(DATA_PATH, JSON.stringify(filteredUsers, null, 2), 'utf8', (err) => {
        if (err) {
          console.error('Error writing file:', err);
          return;
        }
        console.log('✅ Successfully updated JSON file');
      });
    } else {
      console.log('⚠️ User "Lakodros" not found in JSON file');
    }
  } catch (parseError) {
    console.error('Error parsing JSON:', parseError);
  }
});