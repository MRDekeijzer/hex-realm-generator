const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://MRDekeijzer.github.io/hex-realm-generator/?tool=poi', {
    waitUntil: 'networkidle',
  });
  await page.waitForTimeout(1000);
  const result = await page.evaluate(() => ({
    icons: Array.from(document.querySelectorAll('img[alt$=" icon" ]')).map((img) => ({
      alt: img.alt,
      src: img.src,
    })),
    backdrops: Array.from(document.querySelectorAll('img[alt$="backdrop"]')).map((img) => ({
      alt: img.alt,
      src: img.src,
    })),
  }));
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
