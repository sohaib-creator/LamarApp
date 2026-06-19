import mysql from 'mysql2/promise';
import { env } from './config/env.js';

const conn = await mysql.createConnection({
  host: env.DB_HOST, port: env.DB_PORT,
  user: env.DB_USER, password: env.DB_PASSWORD, database: env.DB_NAME,
  charset: 'utf8mb4',
  ssl: env.DB_SSL ? { rejectUnauthorized: true } : undefined,
});

// Payment methods table
await conn.execute(`
  CREATE TABLE IF NOT EXISTS payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name_slug VARCHAR(50) NOT NULL UNIQUE,
    display_name_ar VARCHAR(100) NOT NULL,
    icon VARCHAR(20) DEFAULT '💳',
    is_active TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);

// Seed payment methods
const [existing] = await conn.execute('SELECT COUNT(*) AS cnt FROM payment_methods');
if (existing[0].cnt === 0) {
  await conn.execute(`INSERT INTO payment_methods (name_slug, display_name_ar, icon, sort_order) VALUES
    ('cash', 'نقداً عند الاستلام', '💰', 1),
    ('card', 'بطاقة ائتمان', '💳', 2),
    ('tabby', 'تابي - دفع بالتقسيط', '💜', 3),
    ('tamara', 'تمارا - اشتر الآن وادفع لاحقاً', '💙', 4)
  `);
  console.log('Payment methods seeded.');
}

// Delivery cities table
await conn.execute(`
  CREATE TABLE IF NOT EXISTS delivery_cities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name_ar VARCHAR(100) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);

const [existingCities] = await conn.execute('SELECT COUNT(*) AS cnt FROM delivery_cities');
if (existingCities[0].cnt === 0) {
  await conn.execute(`INSERT INTO delivery_cities (name_ar, sort_order) VALUES
    ('الرياض', 1), ('جدة', 2), ('مكة المكرمة', 3), ('المدينة المنورة', 4),
    ('الدمام', 5), ('الخبر', 6), ('الظهران', 7), ('بريدة', 8),
    ('تبوك', 9), ('حائل', 10), ('جازان', 11), ('أبها', 12),
    ('خميس مشيط', 13), ('الطائف', 14), ('الأحساء', 15), ('القطيف', 16),
    ('ينبع', 17), ('عرعر', 18), ('سكاكا', 19), ('نجران', 20),
    ('الباحة', 21)
  `);
  console.log('Delivery cities seeded.');
}

console.log('Tables created successfully.');
await conn.end();
