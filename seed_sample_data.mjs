import mysql from 'mysql2/promise';
import { env } from './config/env.js';

const pool = mysql.createPool({host:env.DB_HOST,port:env.DB_PORT,user:env.DB_USER,password:env.DB_PASSWORD,database:env.DB_NAME,charset:'utf8mb4',ssl:env.DB_SSL?{rejectUnauthorized:true}:undefined});

// Get or create sample driver
let [drivers] = await pool.execute("SELECT id FROM users WHERE role = 'driver' LIMIT 2");
const driverIds = drivers.map(d => d.id);

// Get delivered orders
let [orders] = await pool.execute("SELECT id FROM orders WHERE status = 'delivered'");

if (orders.length > 0 && driverIds.length > 0) {
  // Assign drivers to some delivered orders
  for (let i = 0; i < orders.length; i++) {
    const driverId = driverIds[i % driverIds.length];
    await pool.execute('UPDATE orders SET driver_id = ? WHERE id = ?', [driverId, orders[i].id]);
  }
  console.log(`Assigned drivers to ${orders.length} orders`);
}

// Create some sample delivered orders for each category/product if none exist
let [cats] = await pool.execute('SELECT id FROM categories LIMIT 3');
let [prods] = await pool.execute('SELECT id, price FROM products LIMIT 5');

if (cats.length > 0 && prods.length > 0 && driverIds.length > 0) {
  // Check if we have recent orders
  let [recent] = await pool.execute("SELECT COUNT(*) AS cnt FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
  if (recent[0].cnt < 3) {
    const customerIds = [2, 4, 6]; // existing customer IDs
    const statuses = ['delivered', 'delivered', 'delivered', 'pending', 'out_for_delivery'];
    for (let i = 0; i < 8; i++) {
      const userId = customerIds[i % customerIds.length];
      const driverId = driverIds[i % driverIds.length];
      const status = statuses[i % statuses.length];
      const prod = prods[i % prods.length];
      const qty = Math.floor(Math.random() * 5) + 1;
      const total = prod.price * qty;
      const orderNum = `LMR-SEED-${String(Date.now()).slice(-4)}-${i}`;
      const daysAgo = i * 2;
      const [res] = await pool.execute(
        `INSERT INTO orders (order_number, user_id, driver_id, status, payment_method, subtotal, delivery_fee, total, created_at)
         VALUES (?, ?, ?, ?, 'cash', ?, 5, ?, DATE_SUB(NOW(), INTERVAL ? DAY))`,
        [orderNum, userId, driverId, status, total, total + 5, daysAgo]
      );
      await pool.execute(
        'INSERT INTO order_items (order_id, product_id, quantity, price, total) VALUES (?, ?, ?, ?, ?)',
        [res.insertId, prod.id, qty, prod.price, total]
      );
      await pool.execute(
        'INSERT INTO order_status_history (order_id, status, created_by, created_at) VALUES (?, ?, ?, NOW())',
        [res.insertId, status, userId]
      );
    }
    console.log('Seeded 8 sample orders');
  }
}

// Also seed a customer with multiple orders for "أفضل عميل"
let [cust] = await pool.execute("SELECT id FROM users WHERE role = 'customer' LIMIT 1");
if (cust.length > 0 && driverIds.length > 0 && prods.length > 0) {
  let [cnt] = await pool.execute("SELECT COUNT(*) AS c FROM orders WHERE user_id = ? AND status = 'delivered'", [cust[0].id]);
  if (cnt[0].c < 2) {
    for (let i = 0; i < 3; i++) {
      const prod = prods[i % prods.length];
      const qty = Math.floor(Math.random() * 3) + 1;
      const total = prod.price * qty;
      const orderNum = `LMR-SEED-C-${i}`;
      const [res] = await pool.execute(
        `INSERT INTO orders (order_number, user_id, driver_id, status, payment_method, subtotal, delivery_fee, total, created_at)
         VALUES (?, ?, ?, 'delivered', 'cash', ?, 5, ?, DATE_SUB(NOW(), INTERVAL ? DAY))`,
        [orderNum, cust[0].id, driverIds[0], total, total + 5, i * 3]
      );
      await pool.execute(
        'INSERT INTO order_items (order_id, product_id, quantity, price, total) VALUES (?, ?, ?, ?, ?)',
        [res.insertId, prod.id, qty, prod.price, total]
      );
    }
    console.log('Seeded extra orders for top customer');
  }
}

console.log('Done seeding sample data');
await pool.end();
