import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { getPool } from '../db.js';

export async function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized', data: [] });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = payload;

    // Upgrade old tokens that lack permissions
    if (!payload.permissions && payload.role === 'admin') {
      try {
        const pool = getPool();
        const [rows] = await pool.execute('SELECT permissions FROM users WHERE id = ?', [payload.id]);
        if (rows[0]) {
          let p = rows[0].permissions;
          if (p === '[*]') p = '["*"]';
          req.user.permissions = (() => { try { return JSON.parse(p); } catch { return []; } })();
        }
      } catch { req.user.permissions = []; }
    }

    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token', data: [] });
  }
}
