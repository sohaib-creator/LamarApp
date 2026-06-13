import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getPool } from '../db.js';
import { env } from '../config/env.js';

const SALT_ROUNDS = 12;

function success(res, message = '', data = []) {
  res.json({ success: true, message, data });
}

function failure(res, message = 'Request failed', status = 400) {
  res.status(status).json({ success: false, message, data: [] });
}

function safeTrim(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function parsePermissions(user) {
  if (!user || !user.permissions) return [];
  let str = user.permissions;
  if (str === '[*]') str = '["*"]';
  try { return JSON.parse(str); } catch { return []; }
}

async function findUserByEmail(email) {
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT id, name, email, phone, password_hash, role, permissions, avatar, status FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

async function findUserById(id) {
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT id, name, email, phone, role, permissions, avatar, status FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

export async function authRegister(req, res) {
  try {
    const name = safeTrim(req.body?.name);
    const email = safeTrim(req.body?.email)?.toLowerCase();
    const phone = safeTrim(req.body?.phone);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const role = req.body?.role === 'driver' ? 'driver' : 'customer';

    if (!name || name.length < 2) return failure(res, 'Invalid name', 400);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return failure(res, 'Invalid email', 400);
    if (!password || password.length < 6) return failure(res, 'Invalid password', 400);

    const existing = await findUserByEmail(email);
    if (existing) return failure(res, 'Email already exists', 409);

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const pool = getPool();
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, phone, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [name, email, phone || null, password_hash, role]
    );

    const userId = result.insertId;
    const perms = [];
    const token = jwt.sign({ id: userId, role, permissions: perms }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

    success(res, 'Registered', [{
      token,
      user: { id: userId, name, email, phone, role, permissions: perms }
    }]);
  } catch (err) {
    failure(res, 'Registration failed', 500);
  }
}

export async function authLogin(req, res) {
  try {
    const email = safeTrim(req.body?.email)?.toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return failure(res, 'Invalid email', 400);
    if (!password) return failure(res, 'Invalid password', 400);

    const user = await findUserByEmail(email);
    if (!user) return failure(res, 'Invalid credentials', 401);
    if (user.status !== 'active') return failure(res, 'Account is not active', 403);

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return failure(res, 'Invalid credentials', 401);

    const permissions = parsePermissions(user);
    const token = jwt.sign({ id: user.id, role: user.role, permissions }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

    success(res, 'Logged in', [{
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatar: user.avatar, permissions }
    }]);
  } catch {
    failure(res, 'Login failed', 500);
  }
}

export async function authLogout(req, res) {
  success(res, 'Logged out', []);
}

export async function authProfile(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return failure(res, 'Unauthorized', 401);

    const user = await findUserById(userId);
    if (!user) return failure(res, 'User not found', 404);

    user.permissions = parsePermissions(user);
    success(res, 'Profile loaded', [user]);
  } catch {
    failure(res, 'Profile failed', 500);
  }
}
