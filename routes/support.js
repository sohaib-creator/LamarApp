import express from 'express';
import { getPool } from '../db.js';
import { authRequired } from '../middleware/authRequired.js';

function isSupportAdmin(user) {
  if (user.role !== 'admin') return false;
  const perms = user.permissions || [];
  return perms.includes('*') || perms.includes('support.manage');
}

export const supportRouter = express.Router();

// Create a ticket
supportRouter.post('/tickets', authRequired, async (req, res) => {
  try {
    const { subject, message, order_id } = req.body;
    const user_id = req.user.id;
    if (!subject || !message) return res.status(400).json({ success: false, message: 'Subject and message are required', data: [] });

    const pool = getPool();
    const [result] = await pool.execute(
      'INSERT INTO support_tickets (user_id, order_id, subject, status, created_at, updated_at) VALUES (?,?,?,?,NOW(),NOW())',
      [user_id, order_id || null, subject, 'open']
    );
    const ticketId = result.insertId;

    // Add initial message as first reply
    await pool.execute(
      'INSERT INTO support_replies (ticket_id, user_id, message, created_at) VALUES (?,?,?,NOW())',
      [ticketId, user_id, message]
    );

    res.json({ success: true, message: 'Ticket created', data: [{ id: ticketId }] });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to create ticket', data: [] });
  }
});

// Get user's tickets
supportRouter.get('/tickets', authRequired, async (req, res) => {
  try {
    const pool = getPool();
    let tickets;
    if (isSupportAdmin(req.user)) {
      [tickets] = await pool.execute('SELECT * FROM support_tickets ORDER BY created_at DESC');
    } else {
      [tickets] = await pool.execute('SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    }
    res.json({ success: true, message: 'Tickets loaded', data: tickets });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to load tickets', data: [] });
  }
});

// Get ticket replies
supportRouter.get('/tickets/:id', authRequired, async (req, res) => {
  try {
    const pool = getPool();
    const [tickets] = await pool.execute('SELECT * FROM support_tickets WHERE id = ?', [req.params.id]);
    if (tickets.length === 0) return res.status(404).json({ success: false, message: 'Ticket not found', data: [] });

    if (!isSupportAdmin(req.user) && tickets[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden', data: [] });
    }

    const [replies] = await pool.execute(
      'SELECT r.*, u.name AS user_name FROM support_replies r LEFT JOIN users u ON r.user_id = u.id WHERE r.ticket_id = ? ORDER BY r.created_at ASC',
      [req.params.id]
    );

    res.json({ success: true, message: 'Ticket loaded', data: [{ ...tickets[0], replies }] });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to load ticket', data: [] });
  }
});

// Reply to ticket
supportRouter.post('/tickets/:id/reply', authRequired, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required', data: [] });

    const pool = getPool();
    const [tickets] = await pool.execute('SELECT * FROM support_tickets WHERE id = ?', [req.params.id]);
    if (tickets.length === 0) return res.status(404).json({ success: false, message: 'Ticket not found', data: [] });

    if (!isSupportAdmin(req.user) && tickets[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden', data: [] });
    }

    const [result] = await pool.execute(
      'INSERT INTO support_replies (ticket_id, user_id, message, created_at) VALUES (?,?,?,NOW())',
      [req.params.id, req.user.id, message]
    );

    const newStatus = isSupportAdmin(req.user) ? 'resolved' : 'open';
    await pool.execute('UPDATE support_tickets SET status = ?, updated_at = NOW() WHERE id = ?', [newStatus, req.params.id]);

    res.json({ success: true, message: 'Reply added', data: [{ id: result.insertId }] });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to reply', data: [] });
  }
});

// Update ticket status (admin)
supportRouter.put('/tickets/:id/status', authRequired, async (req, res) => {
  try {
    if (!isSupportAdmin(req.user)) return res.status(403).json({ success: false, message: 'Forbidden', data: [] });
    const { status } = req.body;
    if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status', data: [] });

    const pool = getPool();
    await pool.execute('UPDATE support_tickets SET status = ?, updated_at = NOW() WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: 'Status updated', data: [] });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update status', data: [] });
  }
});
