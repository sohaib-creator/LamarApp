import { getPool } from '../db.js';

function success(res, message = '', data = []) { res.json({ success: true, message, data }); }
function failure(res, message = 'Request failed', status = 400) { res.status(status).json({ success: false, message, data: [] }); }

export async function getPromotions(req, res) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT p.*, pr.name_ar AS product_name, c.name_ar AS category_name FROM promotions p LEFT JOIN products pr ON p.product_id = pr.id LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC');
    success(res, 'Promotions loaded', rows);
  } catch { failure(res, 'Failed to load promotions', 500); }
}

export async function getActivePromotions(req, res) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute("SELECT * FROM promotions WHERE is_active = 1 AND (start_date IS NULL OR start_date <= CURDATE()) AND (end_date IS NULL OR end_date >= CURDATE()) ORDER BY created_at DESC");
    success(res, 'Active promotions', rows);
  } catch { failure(res, 'Failed to load promotions', 500); }
}

export async function createPromotion(req, res) {
  try {
    const pool = getPool();
    const {
      type, title, description,
      buy_quantity, free_quantity,
      discount_percent, max_discount_amount, min_purchase,
      applicable_to, product_id, category_id,
      start_date, end_date, is_active,
    } = req.body;

    if (!type || !title) return failure(res, 'النوع والعنوان مطلوبان');
    if (!['buy_x_get_y', 'percentage'].includes(type)) return failure(res, 'نغير صالح');

    await pool.execute(
      `INSERT INTO promotions (type, title, description, buy_quantity, free_quantity, discount_percent, max_discount_amount, min_purchase, applicable_to, product_id, category_id, start_date, end_date, is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [type, title, description || null, buy_quantity || null, free_quantity || null, discount_percent || null, max_discount_amount || null, min_purchase || null, applicable_to || 'all', product_id || null, category_id || null, start_date || null, end_date || null, is_active ?? 1]
    );
    success(res, 'تمت إضافة العرض');
  } catch { failure(res, 'Failed to create promotion', 500); }
}

export async function updatePromotion(req, res) {
  try {
    const pool = getPool();
    const { id } = req.params;
    const {
      type, title, description,
      buy_quantity, free_quantity,
      discount_percent, max_discount_amount, min_purchase,
      applicable_to, product_id, category_id,
      start_date, end_date, is_active,
    } = req.body;

    await pool.execute(
      `UPDATE promotions SET type=?, title=?, description=?, buy_quantity=?, free_quantity=?, discount_percent=?, max_discount_amount=?, min_purchase=?, applicable_to=?, product_id=?, category_id=?, start_date=?, end_date=?, is_active=? WHERE id=?`,
      [type, title, description || null, buy_quantity || null, free_quantity || null, discount_percent || null, max_discount_amount || null, min_purchase || null, applicable_to || 'all', product_id || null, category_id || null, start_date || null, end_date || null, is_active ?? 1, id]
    );
    success(res, 'تم تحديث العرض');
  } catch { failure(res, 'Failed to update promotion', 500); }
}

export async function deletePromotion(req, res) {
  try {
    const pool = getPool();
    await pool.execute('DELETE FROM promotions WHERE id = ?', [req.params.id]);
    success(res, 'تم حذف العرض');
  } catch { failure(res, 'Failed to delete promotion', 500); }
}
