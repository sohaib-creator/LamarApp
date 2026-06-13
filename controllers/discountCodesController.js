import { getPool } from '../db.js';

function success(res, message = '', data = []) { res.json({ success: true, message, data }); }
function failure(res, message = 'Request failed', status = 400) { res.status(status).json({ success: false, message, data: [] }); }

export async function getDiscountCodes(req, res) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM discount_codes ORDER BY created_at DESC');
    success(res, 'Discount codes loaded', rows);
  } catch { failure(res, 'Failed to load discount codes', 500); }
}

export async function getDiscountCode(req, res) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM discount_codes WHERE id = ?', [req.params.id]);
    if (!rows.length) return failure(res, 'كود الخصم غير موجود', 404);
    success(res, '', rows[0]);
  } catch { failure(res, 'Failed to load discount code', 500); }
}

export async function createDiscountCode(req, res) {
  try {
    const pool = getPool();
    const { code, discount_type, discount_value, max_uses, min_purchase, is_active, expires_at } = req.body;
    if (!code || !discount_type || discount_value === undefined) return failure(res, 'الكود ونوع الخصم وقيمة الخصم مطلوبة');
    if (!['fixed', 'percentage'].includes(discount_type)) return failure(res, 'نوع خصم غير صالح');
    const [existing] = await pool.execute('SELECT id FROM discount_codes WHERE code = ?', [code]);
    if (existing.length) return failure(res, 'كود الخصم موجود مسبقاً');
    await pool.execute(
      `INSERT INTO discount_codes (code, discount_type, discount_value, max_uses, min_purchase, is_active, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [code, discount_type, discount_value, max_uses || null, min_purchase || null, is_active !== undefined ? is_active : 1, expires_at || null]
    );
    success(res, 'تمت إضافة كود الخصم');
  } catch { failure(res, 'Failed to create discount code', 500); }
}

export async function updateDiscountCode(req, res) {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { code, discount_type, discount_value, max_uses, min_purchase, is_active, expires_at } = req.body;
    const [existing] = await pool.execute('SELECT * FROM discount_codes WHERE id = ?', [id]);
    if (!existing.length) return failure(res, 'كود الخصم غير موجود', 404);
    if (code) {
      const [dup] = await pool.execute('SELECT id FROM discount_codes WHERE code = ? AND id != ?', [code, id]);
      if (dup.length) return failure(res, 'كود الخصم موجود مسبقاً');
    }
    await pool.execute(
      `UPDATE discount_codes SET code=?, discount_type=?, discount_value=?, max_uses=?, min_purchase=?, is_active=?, expires_at=? WHERE id=?`,
      [
        code || existing[0].code,
        discount_type || existing[0].discount_type,
        discount_value !== undefined ? discount_value : existing[0].discount_value,
        max_uses !== undefined ? max_uses : existing[0].max_uses,
        min_purchase !== undefined ? min_purchase : existing[0].min_purchase,
        is_active !== undefined ? is_active : existing[0].is_active,
        expires_at !== undefined ? expires_at : existing[0].expires_at,
        id
      ]
    );
    success(res, 'تم تحديث كود الخصم');
  } catch { failure(res, 'Failed to update discount code', 500); }
}

export async function deleteDiscountCode(req, res) {
  try {
    const pool = getPool();
    const [existing] = await pool.execute('SELECT id FROM discount_codes WHERE id = ?', [req.params.id]);
    if (!existing.length) return failure(res, 'كود الخصم غير موجود', 404);
    await pool.execute('DELETE FROM discount_codes WHERE id = ?', [req.params.id]);
    success(res, 'تم حذف كود الخصم');
  } catch { failure(res, 'Failed to delete discount code', 500); }
}

export async function validateDiscountCode(req, res) {
  try {
    const pool = getPool();
    const { code, order_total } = req.body;
    if (!code) return failure(res, 'الكود مطلوب');
    const [rows] = await pool.execute('SELECT * FROM discount_codes WHERE code = ?', [code]);
    if (!rows.length) return res.json({ success: true, valid: false, message: 'كود خصم غير صالح', data: {} });
    const dc = rows[0];
    if (!dc.is_active) return res.json({ success: true, valid: false, message: 'كود الخصم غير نشط', data: {} });
    if (dc.expires_at && new Date(dc.expires_at) < new Date()) return res.json({ success: true, valid: false, message: 'انتهت صلاحية كود الخصم', data: {} });
    if (dc.max_uses && dc.used_count >= dc.max_uses) return res.json({ success: true, valid: false, message: 'تم استنفاذ استخدامات كود الخصم', data: {} });
    if (dc.min_purchase && order_total && order_total < parseFloat(dc.min_purchase)) return res.json({ success: true, valid: false, message: `الحد الأدنى للطلب ${dc.min_purchase} ريال`, data: {} });
    let discountAmount = 0;
    if (dc.discount_type === 'fixed') discountAmount = parseFloat(dc.discount_value);
    else discountAmount = (order_total || 0) * parseFloat(dc.discount_value) / 100;
    return res.json({ success: true, valid: true, message: 'كود خصم صالح', data: { discount: dc, discount_amount: discountAmount } });
  } catch { failure(res, 'Failed to validate code', 500); }
}
