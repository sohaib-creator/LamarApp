import { getPool } from '../db.js';

function success(res, message = '', data = []) {
  res.json({ success: true, message, data });
}

function failure(res, message = 'Request failed', status = 400) {
  res.status(status).json({ success: false, message, data: [] });
}

function generateOrderNumber() {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LMR-${y}${m}${d}-${rand}`;
}

export async function createOrder(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return failure(res, 'Unauthorized', 401);

    const { address_id, payment_method, items, notes } = req.body;

    if (!address_id) return failure(res, 'Address required', 400);
    if (!items || !items.length) return failure(res, 'Order items required', 400);

    const pool = getPool();

    // Calculate totals
    let subtotal = 0;
    const productIds = items.map(i => i.product_id);
    const placeholders = productIds.map(() => '?').join(',');
    const [products] = await pool.execute(
      `SELECT id, price FROM products WHERE id IN (${placeholders})`,
      productIds
    );

    const priceMap = {};
    for (const p of products) {
      priceMap[p.id] = p.price;
    }

    const orderItems = [];
    for (const item of items) {
      const price = priceMap[item.product_id];
      if (!price) return failure(res, `Product ${item.product_id} not found`, 400);
      const total = price * item.quantity;
      subtotal += total;
      orderItems.push({ ...item, price, total });
    }

    const deliveryFee = parseFloat(req.body?.delivery_fee) || 0;
    const discount = parseFloat(req.body?.discount) || 0;
    const total = subtotal + deliveryFee - discount;

    // Create order
    const orderNumber = generateOrderNumber();
    const [orderResult] = await pool.execute(
      `INSERT INTO orders (order_number, user_id, address_id, status, payment_method, subtotal, delivery_fee, discount, total, notes, created_at)
       VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, NOW())`,
      [orderNumber, userId, address_id, payment_method || 'cash', subtotal, deliveryFee, discount, total, notes || null]
    );

    const orderId = orderResult.insertId;

    // Insert order items
    for (const item of orderItems) {
      await pool.execute(
        'INSERT INTO order_items (order_id, product_id, quantity, price, total) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price, item.total]
      );
    }

    // Record status history
    await pool.execute(
      'INSERT INTO order_status_history (order_id, status, note, created_by, created_at) VALUES (?, ?, ?, ?, NOW())',
      [orderId, 'pending', 'Order created', userId]
    );

    const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [orderId]);
    success(res, 'Order created', [rows[0]]);
  } catch (err) {
    failure(res, 'Failed to create order', 500);
  }
}

export async function getOrders(req, res) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId) return failure(res, 'Unauthorized', 401);

    const pool = getPool();
    let sql = 'SELECT o.* FROM orders o';
    const params = [];

    if (role === 'customer') {
      sql += ' WHERE o.user_id = ?';
      params.push(userId);
    } else if (role === 'driver') {
      sql += " WHERE o.driver_id = ? OR (o.driver_id IS NULL AND o.status IN ('pending', 'confirmed', 'preparing'))";
      params.push(userId);
    }

    sql += ' ORDER BY o.created_at DESC';

    const [rows] = await pool.execute(sql, params);
    success(res, 'Orders loaded', rows);
  } catch {
    failure(res, 'Failed to load orders', 500);
  }
}

export async function getOrder(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return failure(res, 'Invalid order ID', 400);

    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT o.* FROM orders o WHERE o.id = ? LIMIT 1',
      [id]
    );

    if (!rows[0]) return failure(res, 'Order not found', 404);

    const [items] = await pool.execute(
      'SELECT oi.*, p.name_ar AS product_name_ar, p.name_en AS product_name_en FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?',
      [id]
    );

    const [history] = await pool.execute(
      'SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC',
      [id]
    );

    success(res, 'Order loaded', [{ ...rows[0], items, status_history: history }]);
  } catch {
    failure(res, 'Failed to load order', 500);
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return failure(res, 'Invalid order ID', 400);

    const { status, note } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
    if (!validStatuses.includes(status)) return failure(res, 'Invalid status', 400);

    const pool = getPool();
    const [existing] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
    if (!existing[0]) return failure(res, 'Order not found', 404);

    let extraFields = '';
    const params = [status];

    if (status === 'delivered') {
      extraFields = ', delivered_at = NOW()';
    }
    if (status === 'cancelled') {
      extraFields = ', cancelled_at = NOW()';
    }

    await pool.execute(
      `UPDATE orders SET status = ?${extraFields} WHERE id = ?`,
      [...params, id]
    );

    await pool.execute(
      'INSERT INTO order_status_history (order_id, status, note, created_by, created_at) VALUES (?, ?, ?, ?, NOW())',
      [id, status, note || null, req.user?.id || null]
    );

    const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
    success(res, 'Order status updated', [rows[0]]);
  } catch {
    failure(res, 'Failed to update order status', 500);
  }
}

export async function assignDriver(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const driverId = parseInt(req.body?.driver_id, 10);
    if (!id || !driverId) return failure(res, 'Order ID and driver ID required', 400);

    const pool = getPool();
    const [existing] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
    if (!existing[0]) return failure(res, 'Order not found', 404);

    await pool.execute('UPDATE orders SET driver_id = ? WHERE id = ?', [driverId, id]);
    success(res, 'Driver assigned', []);
  } catch {
    failure(res, 'Failed to assign driver', 500);
  }
}
