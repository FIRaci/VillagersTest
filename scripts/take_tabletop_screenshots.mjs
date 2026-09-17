import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = 'C:/Users/TSC/.gemini/antigravity-ide/brain/32e7f1fe-199f-4749-98d9-5a87f86bbe46';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function run() {
  console.log('Launching Edge via Puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // 1. Capture PC Host Dashboard
    console.log('Capturing PC Host Dashboard (1550x850)...');
    const hostPage = await browser.newPage();
    await hostPage.setViewport({ width: 1550, height: 850, deviceScaleFactor: 1 });
    await hostPage.goto('http://localhost:3000/host', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    const hostScreenshotPath = path.join(ARTIFACTS_DIR, 'host_tabletop_luxury_verified.png');
    await hostPage.screenshot({ path: hostScreenshotPath });
    console.log('✓ Host screenshot saved:', hostScreenshotPath);

    // 2. Capture Mobile Player UI (414x820)
    console.log('Capturing Mobile Player UI (414x820)...');
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 414, height: 820, deviceScaleFactor: 2, isMobile: true });
    await mobilePage.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    // Fill player name and join
    const nameInput = await mobilePage.$('#player-name');
    if (nameInput) {
      await nameInput.type('Hiệp Sĩ Bàn Tròn');
      await mobilePage.click('#btn-join');
      await new Promise(r => setTimeout(r, 1000));
    }

    const mobileScreenshotPath = path.join(ARTIFACTS_DIR, 'mobile_tabletop_luxury_verified.png');
    await mobilePage.screenshot({ path: mobileScreenshotPath });
    console.log('✓ Mobile screenshot saved:', mobileScreenshotPath);

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

run();
