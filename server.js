import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { env } from './config/env.js';
import { connectDB } from './db.js';
import { registerRoutes } from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { isBlacklisted } from './services/tokenBlacklist.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = env.CORS_ORIGIN === '*'
  ? '*'
  : env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: allowedOrigins !== '*',
}));

app.use(rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-6',
  legacyHeaders: false,
}));

app.use(express.json({ limit: env.JSON_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: env.JSON_LIMIT }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ok', data: [] });
});

// One-click deploy: download deploy.php, upload to PHP server, visit it
app.get('/deploy/download', (req, res) => {
  res.sendFile(path.join(__dirname, 'htdocs', 'deploy.php'));
});

app.get('/deploy', (req, res) => {
  res.send(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>Deploy Lamar</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Cairo,sans-serif;background:#f0fdf4;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}.card{background:#fff;border-radius:20px;padding:40px;max-width:600px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.1)}h1{color:#059669;font-size:28px;margin-bottom:12px}p{color:#6b7280;margin-bottom:24px;line-height:1.8}.step{background:#f9fafb;border-right:4px solid #059669;padding:16px;margin-bottom:16px;border-radius:8px}.step h3{color:#111827;font-size:15px;margin-bottom:4px}.step p{color:#6b7280;font-size:13px;margin:0}.btn{display:block;width:100%;padding:14px;background:#059669;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;text-align:center;text-decoration:none;margin-top:8px}.btn:hover{background:#047857}.success{background:#f0fdf4;color:#166534;padding:12px;border-radius:8px;margin-top:16px;text-align:center;font-weight:600;display:none}code{background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:13px}</style></head>
<body><div class="card"><h1>نشر التحديث</h1>
<p>حمّل ملف deploy.php وارفعه إلى السيرفر (lamarapp.site.je) عبر cPanel، ثم زر الموقع. هذا سينسخ ملف index.php المحدّث</p>
<div class="step"><h3>1. حمّل الملف</h3><p>اضغط الزر أدناه لتحميل deploy.php</p></div>
<div class="step"><h3>2. ارفعه</h3><p>استخدم cPanel File Manager أو FTP إلى <code>/public_html/</code> أو المسار الموجود فيه ملفات الموقع</p></div>
<div class="step"><h3>3. زر الموقع</h3><p>افتح <code>https://lamarapp.site.je/deploy.php?key=lamar123</code></p></div>
<div class="step"><h3>4. احذف الملف</h3><p>احذف <code>deploy.php</code> من السيرفر بعد التحديث</p></div>
<a class="btn" href="/deploy/download" download="deploy.php">تحميل deploy.php</a>
<a class="btn" href="/deploy/warmup" style="background:#047857;margin-top:8px">سخّن Cache Render (سريع)</a>
</div></body></html>`);
});

app.get('/deploy/warmup', async (req, res) => {
  try {
    const { getPool } = await import('./db.js');
    const { setCache } = await import('./services/cache.js');
    const pool = getPool();
    const [products] = await pool.execute('SELECT p.*, c.name_ar AS category_name_ar, c.name_en AS category_name_en FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.id DESC');
    setCache('products:all', products, 300);
    const [categories] = await pool.execute('SELECT * FROM categories ORDER BY sort_order ASC, id ASC');
    setCache('categories:all', categories, 300);
    res.send('<html dir="rtl"><body style="font-family:Cairo;background:#f0fdf4;display:flex;align-items:center;justify-content:center;min-height:100vh"><div style="background:#fff;padding:40px;border-radius:20px;text-align:center"><h1 style="color:#059669">✅ Cache ساخن!</h1><p style="color:#6b7280">' + products.length + ' منتجات، ' + categories.length + ' تصنيفات</p><a href="/deploy" style="display:inline-block;margin-top:16px;color:#059669">← رجوع</a></div></body></html>');
  } catch (err) {
    res.send('<html dir="rtl"><body style="font-family:Cairo"><h1>❌ خطأ: ' + err.message + '</h1></body></html>');
  }
});

app.post('/api/warmup', async (req, res) => {
  try {
    const { getPool } = await import('./db.js');
    const { setCache } = await import('./services/cache.js');
    const pool = getPool();

    const [products] = await pool.execute(
      'SELECT p.*, c.name_ar AS category_name_ar, c.name_en AS category_name_en FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.id DESC'
    );
    setCache('products:all', products, 300);

    const [categories] = await pool.execute(
      'SELECT * FROM categories ORDER BY sort_order ASC, id ASC'
    );
    setCache('categories:all', categories, 300);

    res.json({ success: true, message: 'Cache warmed', data: { products: products.length, categories: categories.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
});

app.use('/api', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (isBlacklisted(token)) {
      return res.status(401).json({ success: false, message: 'Token has been revoked', data: [] });
    }
  }
  next();
});

registerRoutes(app);

// SPA catch-all: serve index.html for non-API GET routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return notFoundHandler(req, res, next);
  if (fs.existsSync(distPath) && req.method === 'GET') {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    notFoundHandler(req, res, next);
  }
});
app.use(errorHandler);

const port = env.PORT;
app.listen(port, () => {
  console.log(`[Lamar App] API listening on http://localhost:${port}`);
});

connectDB().then(async () => {
  try {
    const { getPool } = await import('./db.js');
    const { setCache } = await import('./services/cache.js');

    const pool = getPool();
    const [products] = await pool.execute(
      'SELECT p.*, c.name_ar AS category_name_ar, c.name_en AS category_name_en FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.id DESC'
    );
    setCache('products:all', products, 300);
    console.log(`[Cache] Pre-warmed: ${products.length} products`);

    const [categories] = await pool.execute(
      'SELECT * FROM categories ORDER BY sort_order ASC, id ASC'
    );
    setCache('categories:all', categories, 300);
    console.log(`[Cache] Pre-warmed: ${categories.length} categories`);
  } catch (err) {
    console.warn('[Cache] Pre-warm skipped:', err.message);
  }
}).catch((err) => {
  console.error('Failed to connect to database:', err);
});
