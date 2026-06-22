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

export async function getProducts(req, res) {
  try {
    const categoryId = parseInt(req.query.category_id, 10);
    const cacheKey = 'products:' + (categoryId || 'all');

    const rows = await withCache(cacheKey, async () => {
      const pool = getPool();
      let sql = 'SELECT p.*, c.name_ar AS category_name_ar, c.name_en AS category_name_en FROM products p LEFT JOIN categories c ON p.category_id = c.id';
      const params = [];

      if (categoryId) {
        sql += ' WHERE p.category_id = ?';
        params.push(categoryId);
      }

      sql += ' ORDER BY p.id DESC';
      const [rows] = await pool.execute(sql, params);
      return rows;
    }, 300);

    success(res, 'Products loaded', rows);
  } catch {
    failure(res, 'Failed to load products', 500);
  }
}

export async function getProduct(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return failure(res, 'Invalid product ID', 400);

    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT p.*, c.name_ar AS category_name_ar, c.name_en AS category_name_en FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ? LIMIT 1',
      [id]
    );

    if (!rows[0]) return failure(res, 'Product not found', 404);
    success(res, 'Product loaded', [rows[0]]);
  } catch {
    failure(res, 'Failed to load product', 500);
  }
}

export async function createProduct(req, res) {
  try {
    const name_ar = safeTrim(req.body?.name_ar);
    const name_en = safeTrim(req.body?.name_en);
    const price = parseFloat(req.body?.price);

    if (!name_ar || !name_en) return failure(res, 'Arabic and English names required', 400);
    if (isNaN(price) || price < 0) return failure(res, 'Valid price required', 400);

    const pool = getPool();
    const [result] = await pool.execute(
      `INSERT INTO products (category_id, name_ar, name_en, description, price, old_price, size_liters, unit, image, stock, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        parseInt(req.body?.category_id, 10) || null,
        name_ar,
        name_en,
        safeTrim(req.body?.description || ''),
        price,
        parseFloat(req.body?.old_price) || null,
        parseFloat(req.body?.size_liters) || null,
        safeTrim(req.body?.unit || 'piece'),
        safeTrim(req.body?.image || ''),
        parseInt(req.body?.stock, 10) || 0,
        req.body?.status !== undefined ? (req.body?.status ? 1 : 0) : 1,
      ]
    );

    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [result.insertId]);
    delCachePrefix('products:');
    success(res, 'Product created', [rows[0]]);
  } catch {
    failure(res, 'Failed to create product', 500);
  }
}

export async function updateProduct(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return failure(res, 'Invalid product ID', 400);

    const pool = getPool();
    const [existing] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing[0]) return failure(res, 'Product not found', 404);

    const name_ar = safeTrim(req.body?.name_ar ?? existing[0].name_ar);
    const name_en = safeTrim(req.body?.name_en ?? existing[0].name_en);
    const price = parseFloat(req.body?.price ?? existing[0].price);

    await pool.execute(
      `UPDATE products SET category_id = ?, name_ar = ?, name_en = ?, description = ?, price = ?, old_price = ?, size_liters = ?, unit = ?, image = ?, stock = ?, status = ? WHERE id = ?`,
      [
        req.body?.category_id !== undefined ? (parseInt(req.body.category_id, 10) || null) : existing[0].category_id,
        name_ar,
        name_en,
        safeTrim(req.body?.description ?? existing[0].description),
        price,
        req.body?.old_price !== undefined ? (parseFloat(req.body.old_price) || null) : existing[0].old_price,
        req.body?.size_liters !== undefined ? (parseFloat(req.body.size_liters) || null) : existing[0].size_liters,
        safeTrim(req.body?.unit ?? existing[0].unit),
        safeTrim(req.body?.image ?? existing[0].image),
        req.body?.stock !== undefined ? parseInt(req.body.stock, 10) : existing[0].stock,
        req.body?.status !== undefined ? (req.body.status ? 1 : 0) : existing[0].status,
        id,
      ]
    );

    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    delCachePrefix('products:');
    success(res, 'Product updated', [rows[0]]);
  } catch (err) {
    failure(res, 'Failed to update product', 500);
  }
}

export async function deleteProduct(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return failure(res, 'Invalid product ID', 400);

    const pool = getPool();
    await pool.execute('DELETE FROM products WHERE id = ?', [id]);
    delCachePrefix('products:');
    success(res, 'Product deleted', []);
  } catch {
    failure(res, 'Failed to delete product', 500);
  }
}
