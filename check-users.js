const fs = require('fs');

try {
  const data = fs.readFileSync('server/data/users.json', 'utf8');
  const users = JSON.parse(data);
  console.log('Users count:', users.length);
  if (users.length > 0) {
    console.log('First user username:', users[0].username);
    console.log('First user ID:', users[0].id);
  }
} catch (error) {
  console.error('Error reading users file:', error.message);
}