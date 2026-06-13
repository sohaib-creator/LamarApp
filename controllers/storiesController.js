import { getPool } from '../db.js';

function success(res, message = '', data = []) {
  res.json({ success: true, message, data });
}

function failure(res, message = 'Request failed', status = 400) {
  res.status(status).json({ success: false, message, data: [] });
}

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function safeTrim(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeCategory(v) {
  const s = safeTrim(v);
  return s || null;
}

export async function storiesList(req, res) {
  try {
    const pool = getPool();

    const [rows] = await pool.execute(
      `SELECT 
         s.id, s.title, s.description, s.content, s.cover_url, s.category,
         s.author_id, s.created_at, s.updated_at, s.status,
         s.views,
         (SELECT COUNT(*) FROM story_likes sl WHERE sl.story_id = s.id AND sl.status = 'active') AS likes_count,
         u.name AS author_name
       FROM stories s
       LEFT JOIN users u ON u.id = s.author_id
       WHERE s.status = 'published'
       ORDER BY s.created_at DESC
       LIMIT 60`
    );

    success(res, 'Stories fetched', rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      content: r.content,
      cover: r.cover_url,
      category: r.category,
      author: { id: r.author_id, name: r.author_name },
      date: r.created_at,
      views: r.views,
      likes: r.likes_count,
      status: r.status
    })));
  } catch (err) {
    failure(res, 'Failed to fetch stories', 500);
  }
}

export async function storiesGetById(req, res) {
  try {
    const pool = getPool();
    const id = toInt(req.params.id, 0);
    if (!id) return failure(res, 'Invalid story id', 400);

    // Increment views
    await pool.execute('UPDATE stories SET views = views + 1 WHERE id = ? AND status = ?', [id, 'published']);

    const [rows] = await pool.execute(
      `SELECT 
         s.id, s.title, s.description, s.content, s.cover_url, s.category,
         s.author_id, s.created_at, s.updated_at, s.status,
         s.views,
         (SELECT COUNT(*) FROM story_likes sl WHERE sl.story_id = s.id AND sl.status = 'active') AS likes_count,
         u.name AS author_name
       FROM stories s
       LEFT JOIN users u ON u.id = s.author_id
       WHERE s.id = ? AND s.status = ?
       LIMIT 1`,
      [id, 'published']
    );

    const r = rows[0];
    if (!r) return failure(res, 'Story not found', 404);

    success(res, 'Story loaded', [{
      id: r.id,
      title: r.title,
      description: r.description,
      content: r.content,
      cover: r.cover_url,
      category: r.category,
      author: { id: r.author_id, name: r.author_name },
      date: r.created_at,
      views: r.views,
      likes: r.likes_count,
      status: r.status
    }]);
  } catch {
    failure(res, 'Failed to load story', 500);
  }
}

export async function storiesCreate(req, res) {
  try {
    const pool = getPool();

    const userId = req.user?.id;
    if (!userId) return failure(res, 'Unauthorized', 401);

    const title = safeTrim(req.body?.title);
    const description = safeTrim(req.body?.description);
    const content = typeof req.body?.content === 'string' ? req.body.content : '';
    const category = normalizeCategory(req.body?.category);
    const coverUrl = safeTrim(req.body?.cover); // secure_url only expected from Cloudinary

    if (!title || title.length < 2) return failure(res, 'Invalid title', 400);
    if (!description || description.length < 5) return failure(res, 'Invalid description', 400);
    if (!content || content.length < 20) return failure(res, 'Invalid content', 400);
    if (!category) return failure(res, 'Invalid category', 400);
    if (!coverUrl) return failure(res, 'Invalid cover', 400);

    const [result] = await pool.execute(
      `INSERT INTO stories 
        (title, description, content, cover_url, category, author_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [title, description, content, coverUrl, category, userId, 'published']
    );

    const id = result.insertId;
    const created = await pool.execute(
      `SELECT 
         s.id, s.title, s.description, s.content, s.cover_url, s.category,
         s.author_id, s.created_at, s.status, s.views,
         (SELECT COUNT(*) FROM story_likes sl WHERE sl.story_id = s.id AND sl.status='active') AS likes_count
       FROM stories s WHERE s.id=?`,
      [id]
    );

    success(res, 'Story created', [{
      id,
      title,
      description,
      content,
      cover: coverUrl,
      category,
      author: { id: userId },
      date: new Date().toISOString(),
      views: 0,
      likes: 0,
      status: 'published'
    }]);
  } catch {
    failure(res, 'Failed to create story', 500);
  }
}

export async function storiesUpdate(req, res) {
  try {
    const pool = getPool();
    const userId = req.user?.id;
    if (!userId) return failure(res, 'Unauthorized', 401);

    const id = toInt(req.params.id, 0);
    if (!id) return failure(res, 'Invalid story id', 400);

    // Ensure ownership or allow author update
    const [ownerRows] = await pool.execute(
      'SELECT id FROM stories WHERE id = ? AND author_id = ?',
      [id, userId]
    );
    if (!ownerRows[0]) return failure(res, 'Forbidden', 403);

    const title = safeTrim(req.body?.title);
    const description = safeTrim(req.body?.description);
    const content = typeof req.body?.content === 'string' ? req.body.content : null;
    const category = normalizeCategory(req.body?.category);
    const coverUrl = typeof req.body?.cover === 'string' ? safeTrim(req.body.cover) : null;
    const status = safeTrim(req.body?.status) || 'published';

    if (!title || title.length < 2) return failure(res, 'Invalid title', 400);
    if (!description || description.length < 5) return failure(res, 'Invalid description', 400);
    if (!content || content.length < 20) return failure(res, 'Invalid content', 400);
    if (!category) return failure(res, 'Invalid category', 400);
    if (!coverUrl) return failure(res, 'Invalid cover', 400);

    await pool.execute(
      `UPDATE stories
       SET title=?, description=?, content=?, cover_url=?, category=?, status=?, updated_at=NOW()
       WHERE id=? AND author_id=?`,
      [title, description, content, coverUrl, category, status, id, userId]
    );

    success(res, 'Story updated', []);
  } catch {
    failure(res, 'Failed to update story', 500);
  }
}

export async function storiesDelete(req, res) {
  try {
    const pool = getPool();
    const userId = req.user?.id;
    if (!userId) return failure(res, 'Unauthorized', 401);

    const id = toInt(req.params.id, 0);
    if (!id) return failure(res, 'Invalid story id', 400);

    await pool.execute('DELETE FROM stories WHERE id = ? AND author_id = ?', [id, userId]);

    success(res, 'Story deleted', []);
  } catch {
    failure(res, 'Failed to delete story', 500);
  }
}
