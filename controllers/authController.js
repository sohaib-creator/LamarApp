import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getPool } from '../db.js';
import { env } from '../config/env.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { addToBlacklist } from '../services/tokenBlacklist.js';

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
    'SELECT id, name, email, phone, password_hash, role, permissions, avatar, status, email_verified FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

async function findUserById(id) {
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT id, name, email, phone, role, permissions, avatar, status, email_verified FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

function isValidPassword(password) {
  if (!password || password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

const PASSWORD_ERROR = 'Password must be at least 8 characters with uppercase, lowercase, and a number';

export async function authRegister(req, res) {
  try {
    const name = safeTrim(req.body?.name);
    const email = safeTrim(req.body?.email)?.toLowerCase();
    const phone = safeTrim(req.body?.phone);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const role = req.body?.role === 'driver' ? 'driver' : 'customer';

    if (!name || name.length < 2) return failure(res, 'Invalid name', 400);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return failure(res, 'Invalid email', 400);
    if (!isValidPassword(password)) return failure(res, PASSWORD_ERROR, 400);

    const existing = await findUserByEmail(email);
    if (existing) return failure(res, 'Email already exists', 409);

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const pool = getPool();
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, phone, password_hash, role, created_at,
        email_verified, verification_token, verification_token_expires)
       VALUES (?, ?, ?, ?, ?, NOW(), 0, ?, ?)`,
      [name, email, phone || null, password_hash, role, verificationToken, verificationExpires]
    );

    const userId = result.insertId;
    const perms = [];
    const token = jwt.sign({ id: userId, role, permissions: perms }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

    sendVerificationEmail(email, name, verificationToken).catch(err => {
      console.error('[Email] Failed to send verification:', err.message);
    });

    success(res, 'Registered. Please verify your email.', [{
      token,
      user: { id: userId, name, email, phone, role, permissions: perms, email_verified: false }
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

    if (!user.email_verified) {
      return failure(res, 'Please verify your email before logging in', 403);
    }

    const permissions = parsePermissions(user);
    const token = jwt.sign({ id: user.id, role: user.role, permissions }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

    success(res, 'Logged in', [{
      token,
      user: {
        id: user.id, name: user.name, email: user.email, phone: user.phone,
        role: user.role, avatar: user.avatar, permissions, email_verified: true
      }
    }]);
  } catch {
    failure(res, 'Login failed', 500);
  }
}

export async function authLogout(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        const ttl = decoded.exp * 1000 - Date.now();
        if (ttl > 0) addToBlacklist(token, ttl);
      }
    }
    success(res, 'Logged out', []);
  } catch {
    success(res, 'Logged out', []);
  }
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

export async function verifyEmail(req, res) {
  try {
    const token = safeTrim(req.query?.token || req.body?.token);
    if (!token) return failure(res, 'Verification token is required', 400);

    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, email, verification_token_expires FROM users WHERE verification_token = ? AND email_verified = 0 LIMIT 1',
      [token]
    );

    if (!rows[0]) return failure(res, 'Invalid or expired verification token', 400);
    if (new Date(rows[0].verification_token_expires) < new Date()) {
      return failure(res, 'Verification token has expired. Request a new one.', 400);
    }

    await pool.execute(
      'UPDATE users SET email_verified = 1, verification_token = NULL, verification_token_expires = NULL WHERE id = ?',
      [rows[0].id]
    );

    success(res, 'Email verified successfully', []);
  } catch {
    failure(res, 'Verification failed', 500);
  }
}

export async function resendVerification(req, res) {
  try {
    const email = safeTrim(req.body?.email)?.toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return failure(res, 'Invalid email', 400);

    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, name, email, email_verified, verification_token_expires FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (!rows[0]) return success(res, 'If this email exists, a verification link has been sent');
    if (rows[0].email_verified) return failure(res, 'Email is already verified', 400);

    const existingExpiry = rows[0].verification_token_expires
      ? new Date(rows[0].verification_token_expires).getTime()
      : 0;
    if (existingExpiry > Date.now() + 23 * 60 * 60 * 1000) {
      return success(res, 'A verification email was already sent recently. Check your inbox.');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.execute(
      'UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?',
      [verificationToken, verificationExpires, rows[0].id]
    );

    sendVerificationEmail(email, rows[0].name, verificationToken).catch(err => {
      console.error('[Email] Failed to resend verification:', err.message);
    });

    success(res, 'Verification email sent', []);
  } catch {
    failure(res, 'Failed to resend verification', 500);
  }
}

export async function forgotPassword(req, res) {
  try {
    const email = safeTrim(req.body?.email)?.toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return failure(res, 'Invalid email', 400);

    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, name, email, email_verified FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (!rows[0]) return success(res, 'If this email exists, a password reset link has been sent');
    if (!rows[0].email_verified) return failure(res, 'Please verify your email first', 400);

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await pool.execute(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [resetToken, resetExpires, rows[0].id]
    );

    sendPasswordResetEmail(email, rows[0].name, resetToken).catch(err => {
      console.error('[Email] Failed to send password reset:', err.message);
    });

    success(res, 'If this email exists, a password reset link has been sent');
  } catch {
    failure(res, 'Failed to process request', 500);
  }
}

export async function resetPassword(req, res) {
  try {
    const token = safeTrim(req.body?.token);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!token) return failure(res, 'Reset token is required', 400);
    if (!isValidPassword(password)) return failure(res, PASSWORD_ERROR, 400);

    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, email, reset_token_expires FROM users WHERE reset_token = ? LIMIT 1',
      [token]
    );

    if (!rows[0]) return failure(res, 'Invalid or expired reset token', 400);
    if (new Date(rows[0].reset_token_expires) < new Date()) {
      return failure(res, 'Reset token has expired. Request a new one.', 400);
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    await pool.execute(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [password_hash, rows[0].id]
    );

    success(res, 'Password reset successfully', []);
  } catch {
    failure(res, 'Password reset failed', 500);
  }
}

export async function changePassword(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return failure(res, 'Unauthorized', 401);

    const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

    if (!currentPassword) return failure(res, 'Current password is required', 400);
    if (!isValidPassword(newPassword)) return failure(res, PASSWORD_ERROR, 400);

    const pool = getPool();
    const [rows] = await pool.execute('SELECT id, password_hash FROM users WHERE id = ? LIMIT 1', [userId]);
    if (!rows[0]) return failure(res, 'User not found', 404);

    const ok = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!ok) return failure(res, 'Current password is incorrect', 401);

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

    success(res, 'Password changed successfully', []);
  } catch {
    failure(res, 'Failed to change password', 500);
  }
}
