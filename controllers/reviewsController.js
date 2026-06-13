import { getPool } from '../db.js';

function success(res, message = '', data = []) {
  res.json({ success: true, message, data });
}

function failure(res, message = 'Request failed', status = 400) {
  res.status(status).json({ success: false, message, data: [] });
}

export async function getProductReviews(req, res) {
  try {
    const productId = parseInt(req.params.productId, 10);
    if (!productId) return failure(res, 'Invalid product ID', 400);

    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT pr.*, u.name AS user_name
       FROM product_reviews pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.product_id = ? AND pr.status = 'approved'
       ORDER BY pr.created_at DESC`,
      [productId]
    );
    success(res, 'Reviews loaded', rows);
  } catch {
    failure(res, 'Failed to load reviews', 500);
  }
}

export async function createReview(req, res) {
  try {
    const productId = parseInt(req.params.productId, 10);
    if (!productId) return failure(res, 'Invalid product ID', 400);

    const userId = req.user.id;
    const rating = parseInt(req.body?.rating, 10) || 0;
    const comment = typeof req.body?.comment === 'string' ? req.body.comment.trim() : '';

    if (!comment && rating === 0) return failure(res, 'يرجى إضافة تقييم أو تعليق', 400);
    if (rating > 5) return failure(res, 'التقييم يجب أن يكون بين 1 و 5', 400);

    const pool = getPool();

    const [existing] = await pool.execute(
      'SELECT id FROM product_reviews WHERE product_id = ? AND user_id = ? LIMIT 1',
      [productId, userId]
    );
    if (existing[0]) return failure(res, 'لقد قمت بتقييم هذا المنتج مسبقاً', 400);

    if (rating > 0) {
      const [orders] = await pool.execute(
        `SELECT 1 FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE oi.product_id = ? AND o.user_id = ? AND o.status IN ('delivered','out_for_delivery','preparing','confirmed')
         LIMIT 1`,
        [productId, userId]
      );
      if (!orders[0]) return failure(res, 'يمكنك التقييم فقط بعد طلب المنتج', 400);
    }

    const [result] = await pool.execute(
      'INSERT INTO product_reviews (product_id, user_id, rating, comment, status) VALUES (?, ?, ?, ?, ?)',
      [productId, userId, rating, comment, 'pending']
    );

    const [rows] = await pool.execute(
      `SELECT pr.*, u.name AS user_name
       FROM product_reviews pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.id = ?`,
      [result.insertId]
    );
    success(res, 'تم إرسال تقييمك بانتظار المراجعة', [rows[0]]);
  } catch (err) {
    failure(res, 'فشل إرسال التقييم', 500);
  }
}

export async function updateReview(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return failure(res, 'Invalid review ID', 400);

    const pool = getPool();
    const [existing] = await pool.execute('SELECT * FROM product_reviews WHERE id = ?', [id]);
    if (!existing[0]) return failure(res, 'Review not found', 404);

    if (existing[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return failure(res, 'غير مصرح لك بتعديل هذا التقييم', 403);
    }

    const rating = parseInt(req.body?.rating, 10) || existing[0].rating;
    const comment = req.body?.comment !== undefined ? req.body.comment.trim() : existing[0].comment;

    if (rating < 1 || rating > 5) return failure(res, 'التقييم يجب أن يكون بين 1 و 5', 400);

    await pool.execute(
      'UPDATE product_reviews SET rating = ?, comment = ?, status = ? WHERE id = ?',
      [rating, comment, req.user.role === 'admin' ? existing[0].status : 'pending', id]
    );

    const [rows] = await pool.execute(
      `SELECT pr.*, u.name AS user_name
       FROM product_reviews pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.id = ?`,
      [id]
    );
    success(res, 'تم تحديث التقييم', [rows[0]]);
  } catch {
    failure(res, 'فشل تحديث التقييم', 500);
  }
}

export async function deleteReview(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return failure(res, 'Invalid review ID', 400);

    const pool = getPool();
    const [existing] = await pool.execute('SELECT * FROM product_reviews WHERE id = ?', [id]);
    if (!existing[0]) return failure(res, 'Review not found', 404);

    if (existing[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return failure(res, 'غير مصرح لك بحذف هذا التقييم', 403);
    }

    await pool.execute('DELETE FROM product_reviews WHERE id = ?', [id]);
    success(res, 'تم حذف التقييم', []);
  } catch {
    failure(res, 'فشل حذف التقييم', 500);
  }
}

export async function getAllReviews(req, res) {
  try {
    const pool = getPool();
    const { status } = req.query;
    let sql = `SELECT pr.*, u.name AS user_name, p.name_ar AS product_name
               FROM product_reviews pr
               JOIN users u ON pr.user_id = u.id
               JOIN products p ON pr.product_id = p.id`;
    const params = [];
    if (status && ['approved', 'pending', 'rejected'].includes(status)) {
      sql += ' WHERE pr.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY pr.created_at DESC';
    const [rows] = await pool.execute(sql, params);
    success(res, 'All reviews loaded', rows);
  } catch {
    failure(res, 'Failed to load reviews', 500);
  }
}

export async function moderateReview(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return failure(res, 'Invalid review ID', 400);

    const { status } = req.body;
    if (!status || !['approved', 'rejected'].includes(status)) {
      return failure(res, 'يجب تحديد حالة الموافقة أو الرفض', 400);
    }

    const pool = getPool();
    const [existing] = await pool.execute('SELECT * FROM product_reviews WHERE id = ?', [id]);
    if (!existing[0]) return failure(res, 'Review not found', 404);

    await pool.execute('UPDATE product_reviews SET status = ? WHERE id = ?', [status, id]);

    const [rows] = await pool.execute(
      `SELECT pr.*, u.name AS user_name, p.name_ar AS product_name
       FROM product_reviews pr
       JOIN users u ON pr.user_id = u.id
       JOIN products p ON pr.product_id = p.id
       WHERE pr.id = ?`,
      [id]
    );
    success(res, status === 'approved' ? 'تم قبول التقييم' : 'تم رفض التقييم', [rows[0]]);
  } catch {
    failure(res, 'فشل تحديث حالة التقييم', 500);
  }
}

export async function canRateProduct(req, res) {
  try {
    const productId = parseInt(req.params.productId, 10);
    if (!productId) return failure(res, 'Invalid product ID', 400);
    if (!req.user) return success(res, '', [{ can_rate: false }]);

    const userId = req.user.id;
    const pool = getPool();
    const [orders] = await pool.execute(
      `SELECT 1 FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.product_id = ? AND o.user_id = ? AND o.status IN ('delivered','out_for_delivery','preparing','confirmed')
       LIMIT 1`,
      [productId, userId]
    );
    success(res, '', [{ can_rate: !!orders[0], user_id: userId }]);
  } catch {
    failure(res, 'Failed to check', 500);
  }
}

export async function getProductRatingSummary(req, res) {
  try {
    const productId = parseInt(req.params.productId, 10);
    if (!productId) return failure(res, 'Invalid product ID', 400);

    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS review_count, COALESCE(ROUND(AVG(rating), 1), 0) AS avg_rating
       FROM product_reviews
       WHERE product_id = ? AND status = 'approved'`,
      [productId]
    );
    success(res, 'Rating summary loaded', rows);
  } catch {
    failure(res, 'Failed to load rating', 500);
  }
}
