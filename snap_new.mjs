import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const DIR = 'C:/Users/sohaib/Desktop/lamar App/test_screenshots';
mkdirSync(DIR, { recursive: true });

async function snap(p, name) {
  await p.screenshot({ path: `${DIR}/${name}.png`, fullPage: true });
  console.log('  ' + name + '.png');
}

(async () => {
  const b = await chromium.launch({ headless: true });

  // ── WEBSITE FULL SESSION ──
  const wp = await b.newPage({ viewport: { width: 1280, height: 900 } });

  // Home
  await wp.goto('http://localhost:5174', { waitUntil: 'networkidle', timeout: 15000 });
  await wp.waitForTimeout(500);
  await snap(wp, 'web-01-home');

  // Login
  await wp.goto('http://localhost:5174/login', { waitUntil: 'networkidle', timeout: 15000 });
  await wp.waitForTimeout(500);
  await snap(wp, 'web-02-login');

  // Submit login form
  await wp.evaluate(() => {
    document.querySelector('input[type="email"], input[placeholder*="بريد"]').value = 'test@test.com';
    document.querySelector('input[type="password"]').value = '123456';
  });
  await wp.click('button[type="submit"]');
  await wp.waitForTimeout(2000);
  await snap(wp, 'web-03-after-login');

  // Checkout with map
  await wp.goto('http://localhost:5174/checkout', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await wp.waitForTimeout(2500);
  await snap(wp, 'web-04-checkout-map');

  // Orders
  await wp.goto('http://localhost:5174/orders', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await wp.waitForTimeout(2000);
  await snap(wp, 'web-05-orders-map');

  // Product detail
  await wp.goto('http://localhost:5174/product/1', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await wp.waitForTimeout(1000);
  await snap(wp, 'web-06-product');

  // Cart
  await wp.goto('http://localhost:5174/cart', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await wp.waitForTimeout(1000);
  await snap(wp, 'web-07-cart');

  // Register
  await wp.goto('http://localhost:5174/register', { waitUntil: 'networkidle', timeout: 15000 });
  await wp.waitForTimeout(500);
  await snap(wp, 'web-08-register');

  await wp.close();

  // ── DASHBOARD ──
  const dp = await b.newPage({ viewport: { width: 1280, height: 900 } });

  await dp.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 15000 });
  await dp.waitForTimeout(500);
  await snap(dp, 'dash-01-login');

  // Login to dashboard
  await dp.evaluate(() => {
    document.querySelector('input[type="email"]').value = 'admin@lamar.app';
    document.querySelector('input[type="password"]').value = 'admin123';
  });
  await dp.click('button[type="submit"]');
  await dp.waitForTimeout(3000);
  await snap(dp, 'dash-02-stats');

  const dashPages = [
    ['/orders', 'dash-03-orders'],
    ['/products', 'dash-04-products'],
    ['/categories', 'dash-05-categories'],
    ['/users', 'dash-06-users'],
    ['/drivers', 'dash-07-drivers'],
    ['/support', 'dash-08-support'],
  ];
  for (const [path, name] of dashPages) {
    await dp.goto('http://localhost:5173' + path, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await dp.waitForTimeout(1000);
    await snap(dp, name);
  }

  await dp.close();
  await b.close();
  console.log('\nDone! All screenshots in ' + DIR);
})();
