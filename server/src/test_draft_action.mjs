import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/TSC/.gemini/antigravity-ide/brain/32e7f1fe-199f-4749-98d9-5a87f86bbe46';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 414, height: 820, deviceScaleFactor: 2, isMobile: true });
    await mobilePage.goto('http://localhost:3000/?p=p1', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    console.log('Clicking the first card in market (Sawmill) to draft...');
    const firstCard = await mobilePage.$('.road-card-slot .mobile-card');
    if (firstCard) {
      await firstCard.click();
      await new Promise(r => setTimeout(r, 1000));
    }

    const screenshotPath = path.join(ARTIFACTS_DIR, 'mobile_after_draft_action.png');
    await mobilePage.screenshot({ path: screenshotPath });
    console.log('✓ After-draft screenshot saved:', screenshotPath);

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await browser.close();
  }
}

run();
