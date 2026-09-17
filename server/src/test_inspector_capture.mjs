import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/TSC/.gemini/antigravity-ide/brain/32e7f1fe-199f-4749-98d9-5a87f86bbe46';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function testInspector() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err));

  await page.setViewport({ width: 1400, height: 800 });
  await page.goto('http://localhost:3000/host', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  console.log('Waiting for road cards to render...');
  await page.waitForSelector('.road-well .villager-card', { timeout: 10000 });

  console.log('Clicking first road card...');
  const cardFound = await page.evaluate(() => {
    const cards = document.querySelectorAll('.road-well .villager-card');
    console.log('Found cards:', cards.length);
    if (cards.length > 0) {
      cards[0].click();
      return true;
    }
    return false;
  });

  console.log('Card found and clicked:', cardFound);
  await new Promise(r => setTimeout(r, 1200));

  const modalOpen = await page.evaluate(() => {
    const modal = document.getElementById('tts-card-inspector-modal');
    return modal ? { exists: true, className: modal.className, display: window.getComputedStyle(modal).display } : { exists: false };
  });
  console.log('Modal status:', modalOpen);

  const screenshotPath = path.join(ARTIFACTS_DIR, 'pastel_card_inspector.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Screenshot saved to:', screenshotPath);

  await browser.close();
}

testInspector().catch(err => console.error('Test error:', err));
