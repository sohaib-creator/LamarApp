import { getPool } from '../db.js';
import { withCache, delCachePrefix } from '../services/cache.js';

function success(res, message = '', data = []) {
  res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
  res.json({ success: true, message, data });
}

function failure(res, message = 'Request failed', status = 400) {
  res.status(status).json({ success: false, message, data: [] });
}

function safeTrim(v) {
  return typeof v === 'string' ? v.trim() : '';
}

export async function getCategories(req, res) {
  try {
    const rows = await withCache('categories:all', async () => {
      const pool = getPool();
      const [rows] = await pool.execute(
        'SELECT * FROM categories ORDER BY sort_order ASC, id ASC'
      );
      return rows;
    }, 300);

    success(res, 'Categories loaded', rows);
  } catch {
    failure(res, 'Failed to load categories', 500);
  }
}

export async function getCategory(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return failure(res, 'Invalid category ID', 400);

    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM categories WHERE id = ? LIMIT 1',
      [id]
    );

    if (!rows[0]) return failure(res, 'Category not found', 404);
    success(res, 'Category loaded', [rows[0]]);
  } catch {
    failure(res, 'Failed to load category', 500);
  }
}

export async function createCategory(req, res) {
  try {
    const name_ar = safeTrim(req.body?.name_ar);
    const name_en = safeTrim(req.body?.name_en);
    const description = safeTrim(req.body?.description || '');

    if (!name_ar || !name_en) return failure(res, 'Arabic and English names required', 400);

    const pool = getPool();
    const [result] = await pool.execute(
      'INSERT INTO categories (name_ar, name_en, description, sort_order, created_at) VALUES (?, ?, ?, ?, NOW())',
      [name_ar, name_en, description, req.body?.sort_order || 0]
    );

    const [rows] = await pool.execute('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    delCachePrefix('categories:');
    success(res, 'Category created', [rows[0]]);
  } catch {
    failure(res, 'Failed to create category', 500);
  }
}

export async function updateCategory(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return failure(res, 'Invalid category ID', 400);

    const name_ar = safeTrim(req.body?.name_ar);
    const name_en = safeTrim(req.body?.name_en);

    if (!name_ar || !name_en) return failure(res, 'Arabic and English names required', 400);

    const pool = getPool();
    await pool.execute(
      'UPDATE categories SET name_ar = ?, name_en = ?, description = ?, sort_order = ? WHERE id = ?',
      [name_ar, name_en, safeTrim(req.body?.description || ''), req.body?.sort_order || 0, id]
    );

    const [rows] = await pool.execute('SELECT * FROM categories WHERE id = ?', [id]);
    if (!rows[0]) return failure(res, 'Category not found', 404);
    delCachePrefix('categories:');
    success(res, 'Category updated', [rows[0]]);
  } catch {
    failure(res, 'Failed to update category', 500);
  }
}

export async function deleteCategory(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return failure(res, 'Invalid category ID', 400);

    const pool = getPool();
    await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
    delCachePrefix('categories:');
    success(res, 'Category deleted', []);
  } catch {
    failure(res, 'Failed to delete category', 500);
  }
}
