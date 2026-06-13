import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function authOptional(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET);
      req.user = payload;
    } catch { /* ignore invalid tokens */ }
  }
  next();
}
