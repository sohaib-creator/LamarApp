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

export async function likesToggle(req, res) {
  try {
    const pool = getPool();
    const userId = req.user?.id;
    if (!userId) return failure(res, 'Unauthorized', 401);

    const storyId = toInt(req.body?.storyId || req.query?.storyId, null);
    if (!storyId) return failure(res, 'Invalid story id', 400);

    const [existing] = await pool.execute(
      `SELECT id, status 
       FROM story_likes 
       WHERE story_id = ? AND user_id = ?
       LIMIT 1`,
      [storyId, userId]
    );

    let action = 'liked';
    let newStatus = 'active';

    if (existing[0]) {
      if (existing[0].status === 'active') {
        newStatus = 'inactive';
        action = 'unliked';
      } else {
        newStatus = 'active';
        action = 'liked';
      }

      await pool.execute(
        `UPDATE story_likes SET status = ? WHERE id = ?`,
        [newStatus, existing[0].id]
      );
    } else {
      await pool.execute(
        `INSERT INTO story_likes (story_id, user_id, status, created_at)
         VALUES (?, ?, 'active', NOW())`,
        [storyId, userId]
      );
    }

    const [counts] = await pool.execute(
      `SELECT COUNT(*) AS like_count 
       FROM story_likes 
       WHERE story_id = ? AND status = 'active'`,
      [storyId]
    );

    success(res, 'Like updated', [{
      storyId,
      action,
      likeCount: counts[0]?.like_count ?? 0,
    }]);
  } catch {
    failure(res, 'Failed to toggle like', 500);
  }
}
