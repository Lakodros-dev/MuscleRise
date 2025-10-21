const fetch = require('node-fetch');

async function testLogin() {
  try {
    const response = await fetch('http://localhost:7075/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'test',
        password: 'test'
      })
    });
    
    console.log('Status:', response.status);
    console.log('Response:', await response.text());
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();