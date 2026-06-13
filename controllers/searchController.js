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

function toInt(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : fallback;
}

function normalizeSort(v) {
  const s = safeTrim(v);
  if (!s) return 'latest';
  const allowed = new Set(['latest', 'popular', 'views', 'likes']);
  return allowed.has(s) ? s : 'latest';
}

export async function searchStories(req, res) {
  try {
    const pool = getPool();

    const q = safeTrim(req.query?.q);
    const category = safeTrim(req.query?.category);
    const sort = normalizeSort(req.query?.sort);
    const page = toInt(req.query?.page, 1);
    const limit = Math.min(Math.max(toInt(req.query?.limit, 12), 1), 48);
    const offset = (page - 1) * limit;

    const where = [`s.status = 'published'`];
    const params = [];

    if (q) {
      where.push(`(s.title LIKE ? OR s.description LIKE ? OR s.content LIKE ?)`);
      const like = `%${q}%`;
      params.push(like, like, like);
    }

    if (category && category !== 'all') {
      where.push('s.category = ?');
      params.push(category);
    }

    let orderBy = 's.created_at DESC';
    if (sort === 'latest') orderBy = 's.created_at DESC';
    if (sort === 'popular') orderBy = 's.views DESC, s.created_at DESC';
    if (sort === 'views') orderBy = 's.views DESC';
    if (sort === 'likes') orderBy = `(SELECT COUNT(*) FROM story_likes sl 
                                       WHERE sl.story_id = s.id AND sl.status='active') DESC`;

    const [rows] = await pool.execute(
      `SELECT 
         s.id, s.title, s.description, s.content, s.cover_url, s.category,
         s.author_id, s.created_at, s.updated_at, s.status,
         s.views,
         (SELECT COUNT(*) FROM story_likes sl WHERE sl.story_id = s.id AND sl.status='active') AS likes_count,
         u.name AS author_name
       FROM stories s
       LEFT JOIN users u ON u.id = s.author_id
       WHERE ${where.join(' AND ')}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    success(res, 'Search complete', rows.map((r) => ({
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
  } catch {
    failure(res, 'Search failed', 500);
  }
}
