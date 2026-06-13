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

  const tabs = [
    { url: '/reports', name: 'reports-overview' },
    { url: '/reports', name: 'reports-category', tab: 'حسب التصنيف' },
    { url: '/reports', name: 'reports-product', tab: 'حسب المنتج' },
    { url: '/reports', name: 'reports-driver', tab: 'حسب المندوب' },
    { url: '/reports', name: 'reports-customers', tab: 'العملاء' },
    { url: '/reports', name: 'reports-monthly', tab: 'الشهر' },
  ];

  for (const t of tabs) {
    await dp.goto('http://localhost:5173' + t.url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await dp.waitForTimeout(1500);
    if (t.tab) {
      const btn = dp.locator('button', { hasText: t.tab });
      await btn.click().catch(() => {});
      await dp.waitForTimeout(1000);
    }
    await dp.screenshot({ path: `${DIR}/${t.name}.png`, fullPage: true });
    console.log('  ' + t.name);
  }

  await dp.close();
  await b.close();
  console.log('Done!');
})();
