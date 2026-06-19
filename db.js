import mysql from 'mysql2/promise';
import { env } from './config/env.js';

let pool;

export async function connectDB() {
  if (pool) return pool;

  pool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: env.DB_SSL ? { rejectUnauthorized: true } : undefined,
  });

  await pool.query('SELECT 1 AS ok');
  return pool;
}

export function getPool() {
  if (!pool) throw new Error('DB pool not initialized. Call connectDB() first.');
  return pool;
}
