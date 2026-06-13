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

  await dp.goto('http://localhost:5173/users', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await dp.waitForTimeout(1500);
  await dp.screenshot({ path: `${DIR}/dash-customers2.png`, fullPage: true });
  console.log('dash-customers2.png');

  // Test export generates file
  await dp.evaluate(() => {
    // Hijack createObjectURL to capture blob
    window.__lastBlob = null;
    const orig = URL.createObjectURL;
    URL.createObjectURL = function(b) { window.__lastBlob = b; return orig.call(this, b); };
  });
  await dp.click('button:has-text("تصدير")');
  await dp.waitForTimeout(2000);

  await dp.close();
  await b.close();
  console.log('Done!');
})();
