import bcrypt from 'bcrypt';
import { getPool } from '../db.js';

const SALT_ROUNDS = 12;

function success(res, message = '', data = []) { res.json({ success: true, message, data }); }
function failure(res, message = 'Request failed', status = 400) { res.status(status).json({ success: false, message, data: [] }); }

export async function getDashboardUsers(req, res) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      "SELECT id, name, email, phone, role, permissions, status, created_at FROM users WHERE role IN ('admin','driver') ORDER BY created_at DESC"
    );
    const result = rows.map(r => {
      let p = r.permissions;
      if (p === '[*]') p = '["*"]';
      return {
        ...r,
        permissions: p ? (() => { try { return JSON.parse(p); } catch { return []; } })() : [],
      };
    });
    success(res, 'Dashboard users loaded', result);
  } catch {
    failure(res, 'Failed to load dashboard users', 500);
  }
}

export async function createDashboardUser(req, res) {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const role = req.body?.role === 'driver' ? 'driver' : 'admin';
    const rawPerms = req.body?.permissions;

    if (!name || name.length < 2) return failure(res, 'الاسم مطلوب', 400);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return failure(res, 'البريد الإلكتروني غير صحيح', 400);
    if (!password || password.length < 6) return failure(res, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', 400);

    const permissions = Array.isArray(rawPerms) ? rawPerms : [];

    const pool = getPool();
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing[0]) return failure(res, 'البريد الإلكتروني موجود مسبقاً', 409);

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, role, permissions, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [name, email, password_hash, role, JSON.stringify(permissions), 'active']
    );

    const [row] = await pool.execute(
      "SELECT id, name, email, phone, role, permissions, status, created_at FROM users WHERE id = ?",
      [result.insertId]
    );
    const u = row[0];
    u.permissions = permissions;

    success(res, 'تم إنشاء المستخدم', [u]);
  } catch {
    failure(res, 'فشل إنشاء المستخدم', 500);
  }
}

export async function updateDashboardUser(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return failure(res, 'Invalid user ID', 400);

    const pool = getPool();
    const [existing] = await pool.execute("SELECT * FROM users WHERE id = ? AND role IN ('admin','driver')", [id]);
    if (!existing[0]) return failure(res, 'المستخدم غير موجود', 404);

    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : existing[0].name;
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : existing[0].email;
    const rawPerms = req.body?.permissions;
    const status = req.body?.status || existing[0].status;

    const permissions = Array.isArray(rawPerms) ? rawPerms
      : (existing[0].permissions ? (() => { try { return JSON.parse(existing[0].permissions); } catch { return []; } })() : []);

    if (req.body?.password && req.body.password.length >= 6) {
      const password_hash = await bcrypt.hash(req.body.password, SALT_ROUNDS);
      await pool.execute(
        'UPDATE users SET name = ?, email = ?, password_hash = ?, permissions = ?, status = ? WHERE id = ?',
        [name, email, password_hash, JSON.stringify(permissions), status, id]
      );
    } else {
      await pool.execute(
        'UPDATE users SET name = ?, email = ?, permissions = ?, status = ? WHERE id = ?',
        [name, email, JSON.stringify(permissions), status, id]
      );
    }

    const [row] = await pool.execute(
      "SELECT id, name, email, phone, role, permissions, status, created_at FROM users WHERE id = ?",
      [id]
    );
    const u = row[0];
    u.permissions = permissions;

    success(res, 'تم تحديث المستخدم', [u]);
  } catch {
    failure(res, 'فشل تحديث المستخدم', 500);
  }
}

export async function deleteDashboardUser(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return failure(res, 'Invalid user ID', 400);

    const pool = getPool();
    const [existing] = await pool.execute("SELECT id, role FROM users WHERE id = ? AND role IN ('admin','driver')", [id]);
    if (!existing[0]) return failure(res, 'المستخدم غير موجود', 404);

    if (Number(id) === Number(req.user.id)) return failure(res, 'لا يمكن حذف نفسك', 400);

    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    success(res, 'تم حذف المستخدم', []);
  } catch {
    failure(res, 'فشل حذف المستخدم', 500);
  }
}
