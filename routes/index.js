import { authRouter } from './auth.js';
import { categoriesRouter } from './categories.js';
import { productsRouter } from './products.js';
import { uploadsRouter } from './uploads.js';
import { ordersRouter } from './orders.js';
import { addressesRouter } from './addresses.js';
import { adminRouter } from './admin.js';
import { paymentsRouter } from './payments.js';
import { supportRouter } from './support.js';
import { settingsRouter } from './settings.js';
import { reportsRouter } from './reports.js';
import { promotionsRouter } from './promotions.js';
import { discountCodesRouter } from './discountCodes.js';
import { reviewsRouter } from './reviews.js';
import { dashboardUsersRouter } from './dashboardUsers.js';

export function registerRoutes(app) {
  app.use('/api/auth', authRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/uploads', uploadsRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/addresses', addressesRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/payments', paymentsRouter);
  app.use('/api/support', supportRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/promotions', promotionsRouter);
  app.use('/api/discount-codes', discountCodesRouter);
  app.use('/api', reviewsRouter);
  app.use('/api/admin/dashboard-users', dashboardUsersRouter);
  // Alias for frontend compatibility
  app.get('/api/public-settings', async (req, res) => {
    try {
      const { getPool } = await import('../db.js');
      const pool = getPool();
      const [rows] = await pool.execute("SELECT `key`, `value` FROM settings");
      const s = {};
      for (const r of rows) s[r.key] = r.value;
      res.json({ success: true, message: 'Public settings', data: [s] });
    } catch {
      res.status(500).json({ success: false, message: 'Failed', data: [] });
    }
  });
}
