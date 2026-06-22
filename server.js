import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

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

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ok', data: [] });
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

app.use(notFoundHandler);
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
