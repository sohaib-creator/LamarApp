import { getPool } from '../db.js';

function success(res, data = []) { res.json({ success: true, message: 'ok', data }); }
function failure(res, msg = 'Failed', status = 500) { res.status(status).json({ success: false, message: msg, data: [] }); }

/* ─── Sales by Category ─── */
export async function salesByCategory(req, res) {
  try {
    const pool = getPool();
    const { start, end } = req.query;
    let sql = `
      SELECT c.id, c.name_ar, COUNT(DISTINCT o.id) AS orders_count,
        SUM(oi.quantity) AS items_sold, SUM(oi.total) AS total_sales
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'delivered'
    `;
    const params = [];
    if (start && end) { sql += ' AND o.created_at >= ? AND o.created_at <= ?'; params.push(start, end); }
    sql += ' GROUP BY c.id, c.name_ar ORDER BY total_sales DESC';
    const [rows] = await pool.execute(sql, params);
    success(res, rows);
  } catch { failure(res); }
}

/* ─── Sales by Product ─── */
export async function salesByProduct(req, res) {
  try {
    const pool = getPool();
    const { start, end } = req.query;
    let sql = `
      SELECT p.id, p.name_ar, c.name_ar AS category_name,
        SUM(oi.quantity) AS items_sold, SUM(oi.total) AS total_sales
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'delivered'
    `;
    const params = [];
    if (start && end) { sql += ' AND o.created_at >= ? AND o.created_at <= ?'; params.push(start, end); }
    sql += ' GROUP BY p.id, p.name_ar ORDER BY total_sales DESC';
    const [rows] = await pool.execute(sql, params);
    success(res, rows);
  } catch { failure(res); }
}

/* ─── Sales by Driver ─── */
export async function salesByDriver(req, res) {
  try {
    const pool = getPool();
    const { start, end } = req.query;
    let sql = `
      SELECT COALESCE(u.id, 0) AS id, COALESCE(u.name, 'بدون مندوب') AS name, '' AS email,
        COUNT(o.id) AS deliveries_count, COALESCE(SUM(o.total), 0) AS total_delivered
      FROM orders o
      LEFT JOIN users u ON o.driver_id = u.id AND u.role = 'driver'
      WHERE o.status = 'delivered'
    `;
    const params = [];
    if (start && end) { sql += ' AND o.created_at >= ? AND o.created_at <= ?'; params.push(start, end); }
    sql += ' GROUP BY u.id ORDER BY total_delivered DESC';
    const [rows] = await pool.execute(sql, params);
    success(res, rows);
  } catch { failure(res); }
}

/* ─── Top Customers ─── */
export async function topCustomers(req, res) {
  try {
    const pool = getPool();
    const { start, end } = req.query;
    let sql = `
      SELECT u.id, u.name, u.email, u.phone, COUNT(o.id) AS orders_count,
        COALESCE(SUM(o.total), 0) AS total_spent
      FROM users u
      JOIN orders o ON o.user_id = u.id AND o.status = 'delivered'
      WHERE u.role = 'customer'
    `;
    const params = [];
    if (start && end) { sql += ' AND o.created_at >= ? AND o.created_at <= ?'; params.push(start, end); }
    sql += ' GROUP BY u.id, u.name ORDER BY total_spent DESC LIMIT 20';
    const [rows] = await pool.execute(sql, params);
    success(res, rows);
  } catch { failure(res); }
}

/* ─── Driver of the Month ─── */
export async function driverOfTheMonth(req, res) {
  try {
    const pool = getPool();
    const { year, month } = req.query;
    const y = year || new Date().getFullYear();
    const m = month || String(new Date().getMonth() + 1).padStart(2, '0');
    const [rows] = await pool.execute(`
      SELECT u.id, u.name, u.email, u.phone,
        COUNT(o.id) AS deliveries_count,
        COALESCE(SUM(o.total), 0) AS total_delivered
      FROM users u
      JOIN orders o ON o.driver_id = u.id AND o.status = 'delivered'
        AND YEAR(o.created_at) = ? AND MONTH(o.created_at) = ?
      WHERE u.role = 'driver'
      GROUP BY u.id, u.name
      ORDER BY deliveries_count DESC LIMIT 5
    `, [y, m]);
    success(res, rows);
  } catch { failure(res); }
}

/* ─── Customer of the Month ─── */
export async function customerOfTheMonth(req, res) {
  try {
    const pool = getPool();
    const { year, month } = req.query;
    const y = year || new Date().getFullYear();
    const m = month || String(new Date().getMonth() + 1).padStart(2, '0');
    const [rows] = await pool.execute(`
      SELECT u.id, u.name, u.email, u.phone,
        COUNT(o.id) AS orders_count,
        COALESCE(SUM(o.total), 0) AS total_spent
      FROM users u
      JOIN orders o ON o.user_id = u.id AND o.status = 'delivered'
        AND YEAR(o.created_at) = ? AND MONTH(o.created_at) = ?
      WHERE u.role = 'customer'
      GROUP BY u.id, u.name
      ORDER BY total_spent DESC LIMIT 5
    `, [y, m]);
    success(res, rows);
  } catch { failure(res); }
}

/* ─── Sales Overview (daily for chart) ─── */
export async function salesOverview(req, res) {
  try {
    const pool = getPool();
    const { days, start, end } = req.query;

    let sql = `SELECT DATE(created_at) AS date,
        COUNT(id) AS orders_count,
        COALESCE(SUM(total), 0) AS revenue
      FROM orders
      WHERE status = 'delivered'`;
    const params = [];

    if (start && end) {
      sql += ' AND created_at >= ? AND created_at <= ?';
      params.push(start, end + ' 23:59:59');
    } else {
      const d = parseInt(days) || 30;
      sql += ' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)';
      params.push(d);
    }

    sql += ' GROUP BY DATE(created_at) ORDER BY date ASC';
    const [rows] = await pool.execute(sql, params);
    success(res, rows);
  } catch { failure(res); }
}
