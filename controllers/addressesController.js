import { getPool } from '../db.js';

function success(res, message = '', data = []) {
  res.json({ success: true, message, data });
}

function failure(res, message = 'Request failed', status = 400) {
  res.status(status).json({ success: false, message, data: [] });
}

function safeTrim(v) {
  return typeof v === 'string' ? v.trim() : '';
}

export async function getAddresses(req, res) {
  try {
    const userId = req.user?.id;
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC',
      [userId]
    );
    success(res, 'Addresses loaded', rows);
  } catch {
    failure(res, 'Failed to load addresses', 500);
  }
}

export async function getAddress(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return failure(res, 'Invalid address ID', 400);

    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM addresses WHERE id = ? AND user_id = ? LIMIT 1',
      [id, req.user?.id]
    );

    if (!rows[0]) return failure(res, 'Address not found', 404);
    success(res, 'Address loaded', [rows[0]]);
  } catch {
    failure(res, 'Failed to load address', 500);
  }
}

export async function createAddress(req, res) {
  try {
    const userId = req.user?.id;
    const { street, city, district, building, floor_number, apartment, label, latitude, longitude } = req.body;

    if (!street || !city) return failure(res, 'Street and city required', 400);

    const pool = getPool();

    // If this is the first address or marked as default, unset other defaults
    if (req.body?.is_default) {
      await pool.execute('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
    }

    const [result] = await pool.execute(
      `INSERT INTO addresses (user_id, label, street, district, city, building, floor_number, apartment, latitude, longitude, is_default, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        safeTrim(label || ''),
        safeTrim(street),
        safeTrim(district || ''),
        safeTrim(city),
        safeTrim(building || ''),
        safeTrim(floor_number || ''),
        safeTrim(apartment || ''),
        latitude || null,
        longitude || null,
        req.body?.is_default ? 1 : 0,
      ]
    );

    const [rows] = await pool.execute('SELECT * FROM addresses WHERE id = ?', [result.insertId]);
    success(res, 'Address created', [rows[0]]);
  } catch {
    failure(res, 'Failed to create address', 500);
  }
}

export async function updateAddress(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return failure(res, 'Invalid address ID', 400);

    const pool = getPool();
    const [existing] = await pool.execute('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [id, req.user?.id]);
    if (!existing[0]) return failure(res, 'Address not found', 404);

    if (req.body?.is_default) {
      await pool.execute('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user?.id]);
    }

    await pool.execute(
      `UPDATE addresses SET label=?, street=?, district=?, city=?, building=?, floor_number=?, apartment=?, latitude=?, longitude=?, is_default=? WHERE id=?`,
      [
        safeTrim(req.body?.label ?? existing[0].label),
        safeTrim(req.body?.street ?? existing[0].street),
        safeTrim(req.body?.district ?? existing[0].district),
        safeTrim(req.body?.city ?? existing[0].city),
        safeTrim(req.body?.building ?? existing[0].building),
        safeTrim(req.body?.floor_number ?? existing[0].floor_number),
        safeTrim(req.body?.apartment ?? existing[0].apartment),
        req.body?.latitude !== undefined ? req.body.latitude : existing[0].latitude,
        req.body?.longitude !== undefined ? req.body.longitude : existing[0].longitude,
        req.body?.is_default !== undefined ? (req.body.is_default ? 1 : 0) : existing[0].is_default,
        id,
      ]
    );

    const [rows] = await pool.execute('SELECT * FROM addresses WHERE id = ?', [id]);
    success(res, 'Address updated', [rows[0]]);
  } catch {
    failure(res, 'Failed to update address', 500);
  }
}

export async function deleteAddress(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return failure(res, 'Invalid address ID', 400);

    const pool = getPool();
    await pool.execute('DELETE FROM addresses WHERE id = ? AND user_id = ?', [id, req.user?.id]);
    success(res, 'Address deleted', []);
  } catch {
    failure(res, 'Failed to delete address', 500);
  }
}
