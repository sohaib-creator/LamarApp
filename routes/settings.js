import express from 'express';
import { getPool } from '../db.js';
import { authOptional } from '../middleware/authOptional.js';

export const settingsRouter = express.Router();

// Public - returns only active payment methods
settingsRouter.get('/payment-methods', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT name_slug, display_name_ar, icon FROM payment_methods WHERE is_active = 1 ORDER BY sort_order');
    res.json({ success: true, message: 'Payment methods', data: rows });
  } catch {
    res.status(500).json({ success: false, message: 'Failed', data: [] });
  }
});

// Public - returns only active delivery cities
settingsRouter.get('/delivery-cities', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT id, name_ar FROM delivery_cities WHERE is_active = 1 ORDER BY sort_order');
    res.json({ success: true, message: 'Cities', data: rows });
  } catch {
    res.status(500).json({ success: false, message: 'Failed', data: [] });
  }
});

// Returns first-order discount info + eligibility for logged-in users
settingsRouter.get('/first-order-discount', authOptional, async (req, res) => {
  try {
    const pool = getPool();
    const [settings] = await pool.execute("SELECT `key`, `value` FROM settings WHERE `key` LIKE 'first_order_discount_%'");
    const s = {};
    for (const r of settings) s[r.key] = r.value;

    if (s.first_order_discount_enabled === '1' && req.user?.id) {
      const [rows] = await pool.execute('SELECT COUNT(*) AS cnt FROM orders WHERE user_id = ?', [req.user.id]);
      s.eligible = rows[0].cnt === 0 ? '1' : '0';
    } else {
      s.eligible = s.first_order_discount_enabled === '1' ? '1' : '0';
    }

    res.json({ success: true, message: 'Discount settings', data: [s] });
  } catch {
    res.status(500).json({ success: false, message: 'Failed', data: [] });
  }
});

// Public - returns all public settings (social, banner, pixel, discount)
settingsRouter.get('/public', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute("SELECT `key`, `value` FROM settings");
    const s = {};
    for (const r of rows) s[r.key] = r.value;
    res.json({ success: true, message: 'Public settings', data: [s] });
  } catch {
    res.status(500).json({ success: false, message: 'Failed', data: [] });
  }
});
