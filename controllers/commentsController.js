import { getPool } from '../db.js';

function success(res, message = '', data = []) {
  res.json({ success: true, message, data });
}

function failure(res, message = 'Request failed', status = 400) {
  res.status(status).json({ success: false, message, data: [] });
}

function toInt(v, fallback = null) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function safeTrim(v) {
  return typeof v === 'string' ? v.trim() : '';
}

export async function commentsListForStory(req, res) {
  try {
    const pool = getPool();
    const storyId = toInt(req.params.storyId, null);
    if (!storyId) return failure(res, 'Invalid story id', 400);

    const [rows] = await pool.execute(
      `SELECT 
        c.id, c.story_id, c.text, c.created_at,
        u.id AS user_id, u.name AS user_name
       FROM story_comments c
       LEFT JOIN users u ON u.id = c.user_id
       WHERE c.story_id = ?
       ORDER BY c.created_at DESC
       LIMIT 200`,
      [storyId]
    );

    success(res, 'Comments loaded', rows.map((r) => ({
      id: r.id,
      storyId: r.story_id,
      text: r.text,
      createdAt: r.created_at,
      user: { id: r.user_id, name: r.user_name },
    })));
  } catch {
    failure(res, 'Failed to fetch comments', 500);
  }
}

export async function commentCreate(req, res) {
  try {
    const pool = getPool();
    const userId = req.user?.id;
    if (!userId) return failure(res, 'Unauthorized', 401);

    const storyId = toInt(req.body?.storyId || req.query?.storyId, null);
    const text = safeTrim(req.body?.text);

    if (!storyId) return failure(res, 'Invalid story id', 400);
    if (!text || text.length < 2) return failure(res, 'Invalid comment', 400);

    const [result] = await pool.execute(
      `INSERT INTO story_comments (story_id, user_id, text, created_at)
       VALUES (?, ?, ?, NOW())`,
      [storyId, userId, text]
    );

    const [rows] = await pool.execute(
      `SELECT 
        c.id, c.story_id, c.text, c.created_at,
        u.id AS user_id, u.name AS user_name
       FROM story_comments c
       LEFT JOIN users u ON u.id = c.user_id
       WHERE c.id = ?
       LIMIT 1`,
      [result.insertId]
    );

    const r = rows[0];
    success(res, 'Comment created', [{
      id: r.id,
      storyId: r.story_id,
      text: r.text,
      createdAt: r.created_at,
      user: { id: r.user_id, name: r.user_name },
    }]);
  } catch {
    failure(res, 'Failed to create comment', 500);
  }
}

export async function commentDelete(req, res) {
  try {
    const pool = getPool();
    const userId = req.user?.id;
    if (!userId) return failure(res, 'Unauthorized', 401);

    const commentId = toInt(req.params.id, null);
    if (!commentId) return failure(res, 'Invalid comment id', 400);

    // Allow deletion only by comment owner (or future admin role)
    const [result] = await pool.execute(
      `DELETE FROM story_comments 
       WHERE id = ? AND user_id = ?`,
      [commentId, userId]
    );

    if (result.affectedRows === 0) return failure(res, 'Forbidden', 403);

    success(res, 'Comment deleted', []);
  } catch {
    failure(res, 'Failed to delete comment', 500);
  }
}
