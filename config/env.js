import dotenv from 'dotenv';

dotenv.config();

function num(name, fallback) {
  const v = process.env[name];
  if (v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export const env = {
  PORT: num('PORT', 3000),
  NODE_ENV: process.env.NODE_ENV || 'development',

  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

  JSON_LIMIT: process.env.JSON_LIMIT || '1mb',

  RATE_LIMIT_WINDOW_MS: num('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  RATE_LIMIT_MAX: num('RATE_LIMIT_MAX', 500),

  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: num('DB_PORT', 3306),
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'lamar_db',

  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  API_URL: process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`,
};
