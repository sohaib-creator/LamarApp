import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const DIR = 'C:/Users/sohaib/Desktop/lamar App/test_screenshots';
mkdirSync(DIR, { recursive: true });

async function snap(p, name) {
  await p.screenshot({ path: `${DIR}/${name}.png`, fullPage: true });
  console.log('  ' + name);
}

(async () => {
  const b = await chromium.launch({ headless: true });

  // ── DASHBOARD ──
  const dp = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await dp.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 30000 });
  await dp.waitForTimeout(500);
  await dp.evaluate(() => {
    document.querySelector('input[type="email"]').value = 'admin@lamar.app';
    document.querySelector('input[type="password"]').value = 'admin123';
  });
  await dp.click('button[type="submit"]');
  await dp.waitForTimeout(3000);

  const dashRoutes = [
    '/', '/orders', '/products', '/categories', '/users', '/drivers',
    '/payment-methods', '/delivery-cities', '/support',
  ];
  const dashNames = [
    'dash-stats', 'dash-orders', 'dash-products', 'dash-categories',
    'dash-users', 'dash-drivers', 'dash-payment-methods', 'dash-delivery-cities', 'dash-support',
  ];
  for (let i = 0; i < dashRoutes.length; i++) {
    await dp.goto('http://localhost:5173' + dashRoutes[i], { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await dp.waitForTimeout(1000);
    await snap(dp, dashNames[i]);
  }
  await dp.close();

  // ── WEBSITE ──
  const wp = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await wp.goto('http://localhost:5174/login', { waitUntil: 'networkidle', timeout: 30000 });
  await wp.waitForTimeout(500);
  await snap(wp, 'web-login');

  await wp.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      const t = inp.type;
      if (t === 'email' || t === 'text' || !t) inp.value = 'test@test.com';
      else if (t === 'password') inp.value = '123456';
    }
  });
  await wp.click('button[type="submit"]');
  await wp.waitForTimeout(2000);
  await snap(wp, 'web-home-loggedin');

  const webRoutes = ['/checkout', '/orders', '/product/1', '/cart', '/register', '/profile'];
  const webNames = ['web-checkout-dynamic', 'web-orders', 'web-product', 'web-cart', 'web-register', 'web-profile'];
  for (let i = 0; i < webRoutes.length; i++) {
    await wp.goto('http://localhost:5174' + webRoutes[i], { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await wp.waitForTimeout(1500);
    await snap(wp, webNames[i]);
  }
  await wp.close();

  await b.close();
  console.log('Done! All screenshots in ' + DIR);
})();
