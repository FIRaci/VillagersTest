import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/TSC/.gemini/antigravity-ide/brain/32e7f1fe-199f-4749-98d9-5a87f86bbe46';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function test() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 414, height: 820, deviceScaleFactor: 2, isMobile: true });
    await page.goto('http://localhost:3000/?p=p1', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    // Click on the first stack card to draft face down
    const stackCards = await page.$$('.mobile-stack-card');
    console.log('Found stack cards:', stackCards.length);
    if (stackCards.length > 0) {
      console.log('Clicking first stack card to draft from stack...');
      await stackCards[0].click();
      await new Promise(r => setTimeout(r, 1500));
    }

    const outPath = path.join(ARTIFACTS_DIR, 'mobile_after_draft_stack.png');
    await page.screenshot({ path: outPath });
    console.log('✓ Captured mobile_after_draft_stack.png');
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
}

test();
