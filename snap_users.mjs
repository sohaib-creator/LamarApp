import { chromium } from 'playwright';
const DIR = 'C:/Users/sohaib/Desktop/lamar App/test_screenshots';

async function snap(p, name) {
  await p.screenshot({ path: `${DIR}/${name}.png`, fullPage: true });
  console.log('  ' + name);
}

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
  await snap(dp, 'dash-customers');

  await dp.goto('http://localhost:5173/drivers', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await dp.waitForTimeout(1000);
  await snap(dp, 'dash-drivers');

  await dp.close();
  await b.close();
  console.log('Done!');
})();
