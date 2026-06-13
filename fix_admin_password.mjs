import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'lamar_db',
  charset: 'utf8mb4',
});

const hash = await bcrypt.hash('admin123', 12);
await pool.execute('UPDATE users SET password_hash = ? WHERE email = ?', [hash, 'admin@lamar.app']);
const [rows] = await pool.execute('SELECT email, password_hash FROM users WHERE email = ?', ['admin@lamar.app']);
console.log('Updated:', rows[0].email, rows[0].password_hash.substring(0, 20));
await pool.end();
