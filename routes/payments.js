import express from 'express';
import { getPool } from '../db.js';
import { authRequired } from '../middleware/authRequired.js';

export const paymentsRouter = express.Router();

// Initiate payment - creates a payment record and returns redirect URL
paymentsRouter.post('/initiate', authRequired, async (req, res) => {
  try {
    const { order_id, payment_method, amount } = req.body;
    const user_id = req.user.id;
    if (!order_id || !payment_method || !amount) return res.status(400).json({ success: false, message: 'Missing required fields', data: [] });

    const pool = getPool();
    const [order] = await pool.execute('SELECT id, total, status FROM orders WHERE id = ? AND user_id = ?', [order_id, user_id]);
    if (order.length === 0) return res.status(404).json({ success: false, message: 'Order not found', data: [] });

    // Create payment record
    const now = new Date();
    const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 min expiry
    const [result] = await pool.execute(
      'INSERT INTO payments (order_id, user_id, amount, payment_method, status, created_at, expires_at) VALUES (?,?,?,?,?,?,?)',
      [order_id, user_id, amount, payment_method, 'pending', now, expiry]
    );

    const paymentId = result.insertId;

    // Simulate redirect URL for each provider
    let redirectUrl = `http://localhost:5173/orders/${order_id}`;
    if (payment_method === 'tabby') {
      redirectUrl = `https://checkout.tabby.ai/payments/${paymentId}`;
    } else if (payment_method === 'tamara') {
      redirectUrl = `https://checkout.tamara.co/payments/${paymentId}`;
    } else if (payment_method === 'card') {
      // Simulated card gateway
      redirectUrl = `http://localhost:3000/api/payments/card-redirect/${paymentId}`;
    }

    res.json({ success: true, message: 'Payment initiated', data: [{ payment_id: paymentId, redirect_url: redirectUrl }] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Payment initiation failed', data: [] });
  }
});

// Verify payment status
paymentsRouter.get('/status/:paymentId', authRequired, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM payments WHERE id = ?', [req.params.paymentId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Payment not found', data: [] });
    res.json({ success: true, message: 'Payment status', data: rows });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to get payment status', data: [] });
  }
});

// Webhook receiver for payment gateways to call
paymentsRouter.post('/webhook', async (req, res) => {
  try {
    const { payment_id, status, transaction_id } = req.body;
    if (!payment_id || !status) return res.status(400).json({ success: false, message: 'Missing fields' });

    const pool = getPool();
    await pool.execute('UPDATE payments SET status = ?, transaction_id = ?, updated_at = NOW() WHERE id = ?', [status, transaction_id || null, payment_id]);

    // If paid, update order status to confirmed
    if (status === 'paid' || status === 'completed') {
      const [payment] = await pool.execute('SELECT order_id FROM payments WHERE id = ?', [payment_id]);
      if (payment.length > 0 && payment[0].order_id) {
        await pool.execute("UPDATE orders SET status = 'confirmed', updated_at = NOW() WHERE id = ? AND status = 'pending'", [payment[0].order_id]);
      }
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch {
    res.status(500).json({ success: false, message: 'Webhook failed' });
  }
});

// Simulated card redirect page (simple HTML render)
paymentsRouter.get('/card-redirect/:paymentId', async (req, res) => {
  res.send(`
    <html dir="rtl"><head><meta charset="utf-8"><title>بوابة الدفع</title>
    <style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f0f0;margin:0}
    .card{background:#fff;padding:2rem;border-radius:12px;text-align:center;max-width:400px;width:100%}
    input{display:block;width:100%;padding:0.7rem;margin-bottom:0.8rem;border:1px solid #ddd;border-radius:8px;font-size:1rem}
    button{background:#2563eb;color:#fff;border:0;padding:0.8rem 2rem;border-radius:8px;font-size:1rem;cursor:pointer}
    </style></head>
    <body><div class="card"><h2>💳 الدفع ببطاقة</h2>
    <p>بيانات تجريبية - لن تتم أي خصومات حقيقية</p>
    <input placeholder="رقم البطاقة" value="4111 1111 1111 1111" />
    <input placeholder="تاريخ الانتهاء" value="12/28" />
    <input placeholder="CVV" value="123" />
    <button onclick="alert('تمت عملية الدفع بنجاح! (محاكاة)');window.location.href='http://localhost:5173/orders'">دفع</button>
    </div></body></html>
  `);
});
