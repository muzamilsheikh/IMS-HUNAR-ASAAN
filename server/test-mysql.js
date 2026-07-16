const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
  console.log('Testing MySQL connection...');
  try {
    const conn = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      socketPath: '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock'
    });
    console.log('Connected successfully!');
    const [rows] = await conn.execute('SHOW DATABASES');
    console.log('Databases:', rows.map(r => Object.values(r)[0]).join(', '));
    await conn.end();
  } catch (err) {
    console.error('Connection error:', err);
  }
}
test();
