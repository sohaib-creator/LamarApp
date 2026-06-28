import bcrypt from 'bcrypt';
import { getPool } from '../db.js';

const SALT_ROUNDS = 12;

function success(res, message = '', data = []) { res.json({ success: true, message, data }); }
function failure(res, message = 'Request failed', status = 400) { res.status(status).json({ success: false, message, data: [] }); }

export async function getUsers(req, res) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT id, name, email, phone, role, status, created_at FROM users ORDER BY created_at DESC');
    success(res, 'Users loaded', rows);
  } catch { failure(res, 'Failed to load users', 500); }
}

export async function getCustomers(req, res) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute("SELECT id, name, email, phone, status, created_at FROM users WHERE role = 'customer' ORDER BY created_at DESC");
    success(res, 'Customers loaded', rows);
  } catch { failure(res, 'Failed to load customers', 500); }
}

export async function importCustomers(req, res) {
  try {
    const { customers } = req.body;
    if (!Array.isArray(customers) || customers.length === 0) return failure(res, 'No customer data provided', 400);
    const pool = getPool();
    let imported = 0;
    const errors = [];
    for (const c of customers) {
      if (!c.name || !c.email) { errors.push('Missing name or email'); continue; }
      try {
        const hashedPassword = await bcrypt.hash(c.password || '123456', SALT_ROUNDS);
        await pool.execute(
          'INSERT INTO users (name, email, password_hash, phone, role, status) VALUES (?,?,?,?,?,?)',
          [c.name, c.email, hashedPassword, c.phone || null, 'customer', c.status || 'active']
        );
        imported++;
      } catch (err) {
        errors.push(`${c.email}: ${err.message}`);
      }
    }
    success(res, `${imported}/${customers.length} imported`, [{ imported, errors }]);
  } catch { failure(res, 'Failed to import customers', 500); }
}

export async function getDrivers(req, res) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute("SELECT id, name, email, phone, status, created_at FROM users WHERE role = 'driver' ORDER BY created_at DESC");
    success(res, 'Drivers loaded', rows);
  } catch { failure(res, 'Failed to load drivers', 500); }
}

export async function createDriver(req, res) {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) return failure(res, 'Name, email and password are required', 400);
    const pool = getPool();
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return failure(res, 'Email already in use', 409);
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, phone, password_hash, role, status, created_at) VALUES (?, ?, ?, ?, "driver", "active", NOW())',
      [name, email, phone || null, password_hash]
    );
    success(res, 'Driver created', [{ id: result.insertId, name, email, phone, status: 'active' }]);
  } catch { failure(res, 'Failed to create driver', 500); }
}

export async function toggleUserStatus(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    if (!id || !['active', 'inactive', 'banned'].includes(status)) return failure(res, 'Invalid data', 400);
    const pool = getPool();
    await pool.execute('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    success(res, 'Status updated', []);
  } catch { failure(res, 'Failed to update status', 500); }
}

/* ─── Payment Methods ─── */
export async function getPaymentMethods(req, res) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM payment_methods ORDER BY sort_order');
    success(res, 'Payment methods loaded', rows);
  } catch { failure(res, 'Failed to load payment methods', 500); }
}

export async function togglePaymentMethod(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { is_active } = req.body;
    if (!id || (is_active !== 0 && is_active !== 1)) return failure(res, 'Invalid data', 400);
    const pool = getPool();
    await pool.execute('UPDATE payment_methods SET is_active = ? WHERE id = ?', [is_active, id]);
    success(res, 'Payment method updated');
  } catch { failure(res, 'Failed to update payment method', 500); }
}

/* ─── Delivery Cities ─── */
export async function getDeliveryCities(req, res) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM delivery_cities ORDER BY sort_order');
    success(res, 'Cities loaded', rows);
  } catch { failure(res, 'Failed to load cities', 500); }
}

export async function addDeliveryCity(req, res) {
  try {
    const { name_ar } = req.body;
    if (!name_ar) return failure(res, 'City name required', 400);
    const pool = getPool();
    const [result] = await pool.execute('INSERT INTO delivery_cities (name_ar) VALUES (?)', [name_ar]);
    success(res, 'City added', [{ id: result.insertId, name_ar }]);
  } catch { failure(res, 'Failed to add city', 500); }
}

export async function toggleDeliveryCity(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { is_active } = req.body;
    if (!id || (is_active !== 0 && is_active !== 1)) return failure(res, 'Invalid data', 400);
    const pool = getPool();
    await pool.execute('UPDATE delivery_cities SET is_active = ? WHERE id = ?', [is_active, id]);
    success(res, 'City updated');
  } catch { failure(res, 'Failed to update city', 500); }
}

export async function deleteDeliveryCity(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return failure(res, 'Invalid id', 400);
    const pool = getPool();
    await pool.execute('DELETE FROM delivery_cities WHERE id = ?', [id]);
    success(res, 'City deleted');
  } catch { failure(res, 'Failed to delete city', 500); }
}

/* ─── Settings (first-order discount etc.) ─── */
export async function getSettings(req, res) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT `key`, `value` FROM settings ORDER BY `key`');
    const obj = {};
    for (const r of rows) obj[r.key] = r.value;
    success(res, 'Settings loaded', [obj]);
  } catch { failure(res, 'Failed to load settings', 500); }
}

export async function updateSetting(req, res) {
  try {
    const { key, value } = req.body;
    if (!key) return failure(res, 'Key required', 400);
    const pool = getPool();
    await pool.execute('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?', [key, value, value]);
    success(res, 'Setting updated');
  } catch { failure(res, 'Failed to update setting', 500); }
}

export async function getStats(req, res) {
  try {
    const pool = getPool();
    const [users] = await pool.execute('SELECT COUNT(*) AS cnt FROM users');
    const [customers] = await pool.execute("SELECT COUNT(*) AS cnt FROM users WHERE role = 'customer'");
    const [drivers] = await pool.execute("SELECT COUNT(*) AS cnt FROM users WHERE role = 'driver'");
    const [orders] = await pool.execute('SELECT COUNT(*) AS cnt FROM orders');
    const [delivered] = await pool.execute("SELECT COUNT(*) AS cnt FROM orders WHERE status = 'delivered'");
    const [pending] = await pool.execute("SELECT COUNT(*) AS cnt FROM orders WHERE status IN ('pending','confirmed','preparing')");
    const [revenue] = await pool.execute("SELECT COALESCE(SUM(total),0) AS total FROM orders WHERE status = 'delivered'");
    const [products] = await pool.execute('SELECT COUNT(*) AS cnt FROM products WHERE status = 1');

    success(res, 'Stats loaded', [{
      total_users: users[0].cnt,
      total_customers: customers[0].cnt,
      total_drivers: drivers[0].cnt,
      total_orders: orders[0].cnt,
      total_delivered: delivered[0].cnt,
      total_pending: pending[0].cnt,
      total_revenue: revenue[0].total,
      total_products: products[0].cnt,
      total_reviews: 0,
    }]);
  } catch { failure(res, 'Failed to load stats', 500); }
}
