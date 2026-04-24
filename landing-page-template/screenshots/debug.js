const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:5500/index.html', { waitUntil: 'networkidle' });

  const info = await page.evaluate(() => {
    const sections = document.querySelectorAll('section, nav, footer, header');
    return Array.from(sections).map(el => ({
      tag: el.tagName,
      id: el.id,
      classes: el.className,
    }));
  });

  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
