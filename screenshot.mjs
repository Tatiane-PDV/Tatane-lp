import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';

const URL = 'http://127.0.0.1:5500/landing-page-template/index.html';
const DIR = 'screenshots/progress';
const W = 1440;
const H = 900;

await mkdir(DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: W, height: H });
await page.goto(URL, { waitUntil: 'networkidle' });

// Trigger all reveal animations immediately
await page.evaluate(() => {
  document.querySelectorAll('.rv').forEach(el => el.classList.add('vis'));
});
await page.waitForTimeout(500);

// Get total page height
const totalHeight = await page.evaluate(() => document.body.scrollHeight);
const sections = Math.ceil(totalHeight / H);

for (let i = 0; i < sections; i++) {
  const y = i * H;
  await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
  await page.evaluate(() => {
    document.querySelectorAll('.rv').forEach(el => el.classList.add('vis'));
  });
  await page.waitForTimeout(300);
  const name = String(i + 1).padStart(2, '0');
  await page.screenshot({ path: `${DIR}/${name}-viewport.png` });
  console.log(`Saved ${name}-viewport.png (scroll ${y}px)`);
}

// Also one full-page for reference
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await page.screenshot({ path: `${DIR}/full-page.png`, fullPage: true });
console.log('Saved full-page.png');

await browser.close();
console.log(`Done! ${sections} viewport screenshots + 1 full-page.`);
