import mysql from 'mysql2/promise';
import { env } from './config/env.js';

const pool = mysql.createPool({
  host: env.DB_HOST, port: env.DB_PORT,
  user: env.DB_USER, password: env.DB_PASSWORD, database: env.DB_NAME,
  charset: 'utf8mb4',
});

let [r] = await pool.execute('SELECT * FROM payment_methods');
console.log('Payment methods:', JSON.stringify(r, null, 2));

let [c] = await pool.execute('SELECT * FROM delivery_cities');
console.log('Cities:', JSON.stringify(c, null, 2));

await pool.end();
