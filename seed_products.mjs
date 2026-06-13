import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'lamar_db',
  charset: 'utf8mb4',
});

async function seed() {
  // Categories
  await pool.execute(`INSERT INTO categories (id, name_ar, name_en, description, sort_order, status) VALUES
    (1, 'مياه معدنية', 'Mineral Water', 'مياه معدنية طبيعية غنية بالمعادن', 1, 1),
    (2, 'مياه نقية', 'Purified Water', 'مياه نقية خالية من الشوائب', 2, 1),
    (3, 'مياه مكعبات', 'Ice Cubes', 'مكعبات ثلج نقية وصالحة للشرب', 3, 1)
  ON DUPLICATE KEY UPDATE name_ar=VALUES(name_ar);`);

  // Products
  await pool.execute(`INSERT INTO products (id, category_id, name_ar, name_en, description, price, old_price, size_liters, stock, status) VALUES
    (1, 1, 'مياه معدنية 250 مل', 'Mineral Water 250ml', 'عبوة مياه معدنية 250 مل', 2.00, 2.50, 0.25, 500, 1),
    (2, 1, 'مياه معدنية 500 مل', 'Mineral Water 500ml', 'عبوة مياه معدنية 500 مل', 3.00, 3.50, 0.50, 500, 1),
    (3, 1, 'مياه معدنية 1.5 لتر', 'Mineral Water 1.5L', 'عبوة مياه معدنية 1.5 لتر', 5.00, 6.00, 1.50, 500, 1),
    (4, 2, 'مياه نقية 500 مل', 'Purified Water 500ml', 'عبوة مياه نقية 500 مل', 2.50, NULL, 0.50, 500, 1),
    (5, 2, 'مياه نقية 1.5 لتر', 'Purified Water 1.5L', 'عبوة مياه نقية 1.5 لتر', 4.50, 5.50, 1.50, 500, 1),
    (6, 2, 'مياه نقية 5 جالون', 'Purified Water 5 Gallon', 'جالون مياه نقية 5 جالون', 15.00, 18.00, 5.00, 200, 1),
    (7, 3, 'مكعبات ثلج 2 كجم', 'Ice Cubes 2kg', 'كيس مكعبات ثلج 2 كجم', 8.00, 10.00, NULL, 100, 1),
    (8, 3, 'مكعبات ثلج 5 كجم', 'Ice Cubes 5kg', 'كيس مكعبات ثلج 5 كجم', 15.00, NULL, NULL, 100, 1)
  ON DUPLICATE KEY UPDATE name_ar=VALUES(name_ar);`);

  console.log('Categories and products added successfully!');
  await pool.end();
}

seed().catch(console.error);
