import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3399';
const DIR = './screenshots';

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // 1. Hero section
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${DIR}/01-hero.png` });
  console.log('01-hero.png');

  // 2. Scrollytelling — chapter 1 (Weight of Silence)
  await page.evaluate(() => {
    const section = document.querySelector('[aria-label="Interactive documentary: African languages"]');
    if (section) section.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${DIR}/02-documentary-intro.png` });
  console.log('02-documentary-intro.png');

  // 3. Scrollytelling — mid scroll (chapter 2/3)
  await page.evaluate(() => window.scrollBy({ top: 1200, behavior: 'instant' }));
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${DIR}/03-documentary-chapter2.png` });
  console.log('03-documentary-chapter2.png');

  // 4. Scrollytelling — chapter 3 (Izon)
  await page.evaluate(() => window.scrollBy({ top: 900, behavior: 'instant' }));
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${DIR}/04-documentary-chapter3-izon.png` });
  console.log('04-documentary-chapter3-izon.png');

  // 5. Full section — fullpage snapshot of the documentary block
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  const section = page.locator('[aria-label="Interactive documentary: African languages"]');
  await section.screenshot({ path: `${DIR}/05-documentary-fullsection.png` });
  console.log('05-documentary-fullsection.png');

  await browser.close();
  console.log('Done.');
}

main().catch(console.error);
