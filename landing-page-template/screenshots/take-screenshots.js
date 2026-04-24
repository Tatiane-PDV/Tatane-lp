const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'http://127.0.0.1:5500/landing-page-template/index.html';
const OUTPUT_DIR = path.join(__dirname, 'progress');

const sections = [
  { name: '01-navbar',        selector: '#navbar',        file: '01-navbar.png' },
  { name: '02-hero',          selector: '#hero',          file: '02-hero.png' },
  { name: '03-especialidades',selector: '#especialidades', file: '03-especialidades.png' },
  { name: '04-sobre',         selector: '#sobre',         file: '04-sobre.png' },
  { name: '05-mentorias',     selector: '#mentorias',     file: '05-mentorias.png' },
  { name: '06-contato',       selector: '#contato',       file: '06-contato.png' },
  { name: '07-footer',        selector: 'footer',         file: '07-footer.png' },
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  // Full page screenshot
  await page.screenshot({
    path: path.join(OUTPUT_DIR, '00-full-page.png'),
    fullPage: true,
  });
  console.log('✓ 00-full-page.png');

  // Per section screenshots — scroll into view then clip
  for (const section of sections) {
    try {
      await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      }, section.selector);
      await page.waitForTimeout(600);

      const box = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: 0, y: r.top, width: 1440, height: Math.min(r.height, 2400) };
      }, section.selector);

      if (!box) { console.warn(`✗ ${section.file} — selector not found`); continue; }

      await page.screenshot({
        path: path.join(OUTPUT_DIR, section.file),
        clip: box,
      });
      console.log(`✓ ${section.file}`);
    } catch (e) {
      console.warn(`✗ ${section.file} — ${e.message}`);
    }
  }

  await browser.close();
  console.log('\nDone! Screenshots saved to screenshots/progress/');
})();
