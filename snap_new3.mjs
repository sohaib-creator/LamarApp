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

  const wp = await b.newPage({ viewport: { width: 1280, height: 900 } });

  // Login
  await wp.goto('http://localhost:5174/login', { waitUntil: 'networkidle', timeout: 30000 });
  await wp.waitForTimeout(1000);
  await wp.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      const t = inp.type;
      if (t === 'email' || t === 'text' || !t) inp.value = 'test@test.com';
      else if (t === 'password') inp.value = '123456';
    }
  });
  await wp.click('button[type="submit"]');
  await wp.waitForTimeout(3000);

  // Checkout
  await wp.goto('http://localhost:5174/checkout', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await wp.waitForTimeout(3000);
  await snap(wp, 'new-checkout-dynamic');

  await wp.close();
  await b.close();
  console.log('Done!');
})();
