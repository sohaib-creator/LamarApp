import { chromium } from 'playwright';
const DIR = 'C:/Users/sohaib/Desktop/lamar App/test_screenshots';

(async () => {
  const b = await chromium.launch({ headless: true });
  const dp = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await dp.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 30000 });
  await dp.waitForTimeout(500);
  await dp.evaluate(() => {
    document.querySelector('input[type="email"]').value = 'admin@lamar.app';
    document.querySelector('input[type="password"]').value = 'admin123';
  });
  await dp.click('button[type="submit"]');
  await dp.waitForTimeout(3000);

  // Orders page with driver column
  await dp.goto('http://localhost:5173/orders', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await dp.waitForTimeout(2000);
  await dp.screenshot({ path: `${DIR}/dash-orders-drivers.png`, fullPage: true });
  console.log('dash-orders-drivers.png');

  // Click first "عرض" button to open modal
  const viewBtn = dp.locator('table button', { hasText: 'عرض' }).first();
  await viewBtn.click().catch(() => {});
  await dp.waitForTimeout(2000);
  await dp.screenshot({ path: `${DIR}/dash-order-detail-assign.png`, fullPage: true });
  console.log('dash-order-detail-assign.png');

  await dp.close();
  await b.close();
  console.log('Done!');
})();
