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

  // ── DASHBOARD NEW PAGES ──
  const dp = await b.newPage({ viewport: { width: 1280, height: 900 } });

  await dp.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 15000 });
  await dp.waitForTimeout(500);

  await dp.evaluate(() => {
    document.querySelector('input[type="email"]').value = 'admin@lamar.app';
    document.querySelector('input[type="password"]').value = 'admin123';
  });
  await dp.click('button[type="submit"]');
  await dp.waitForTimeout(3000);

  await dp.goto('http://localhost:5173/payment-methods', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await dp.waitForTimeout(1500);
  await snap(dp, 'new-payment-methods');

  await dp.goto('http://localhost:5173/delivery-cities', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await dp.waitForTimeout(1500);
  await snap(dp, 'new-delivery-cities');

  await dp.close();

  // ── WEBSITE NEW CHECKOUT ──
  const wp = await b.newPage({ viewport: { width: 1280, height: 900 } });

  await wp.goto('http://localhost:5174/login', { waitUntil: 'networkidle', timeout: 15000 });
  await wp.waitForTimeout(500);
  await wp.evaluate(() => {
    const e = document.querySelector('input[type="email"], input[placeholder*="بريد"]');
    const p = document.querySelector('input[type="password"]');
    if (e) e.value = 'test@test.com';
    if (p) p.value = '123456';
  });
  await wp.click('button[type="submit"]');
  await wp.waitForTimeout(2000);

  await wp.goto('http://localhost:5174/checkout', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await wp.waitForTimeout(2500);
  await snap(wp, 'new-checkout-dynamic');

  await wp.close();

  await b.close();
  console.log('\nDone!');
})();
