import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

function num(name, fallback) {
  const v = process.env[name];
  if (v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  PORT: num('PORT', 3000),
  NODE_ENV: process.env.NODE_ENV || 'development',

  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

  JSON_LIMIT: process.env.JSON_LIMIT || '1mb',

  RATE_LIMIT_WINDOW_MS: num('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  RATE_LIMIT_MAX: num('RATE_LIMIT_MAX', 500),

  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: num('DB_PORT', 3306),
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'lamar_db',
  DB_SSL: process.env.DB_SSL === 'true',

  JWT_SECRET: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? required('JWT_SECRET') : crypto.randomBytes(32).toString('hex')),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',

  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  API_URL: process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`,

  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: num('SMTP_PORT', 587),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@lamarapp.com',
};
