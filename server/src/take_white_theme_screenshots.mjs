import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/TSC/.gemini/antigravity-ide/brain/32e7f1fe-199f-4749-98d9-5a87f86bbe46';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function run() {
  console.log('Launching Edge for White Theme screenshots...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // 1. Mobile Landscape in Studio White Theme (844x390)
    console.log('Capturing Mobile Landscape Studio White Mat (844x390)...');
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true });
    await mobilePage.goto('http://localhost:3000/?player=p1&name=Yugi', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    // Join lobby if needed
    await mobilePage.evaluate(() => {
      const lobby = document.getElementById('lobby-screen');
      if (lobby && lobby.style.display !== 'none') {
        const btn = document.getElementById('btn-join-lobby');
        if (btn) btn.click();
      }
      // Ensure white theme is active
      document.body.classList.add('theme-white');
    });
    await new Promise(r => setTimeout(r, 1000));

    const mobileWhiteMatPath = path.join(ARTIFACTS_DIR, 'mobile_landscape_white_theme.png');
    await mobilePage.screenshot({ path: mobileWhiteMatPath });
    console.log('✓ Mobile White Theme screenshot saved:', mobileWhiteMatPath);

    // 2. Mobile Village view in Studio White Theme
    console.log('Switching to Village tab in White Theme...');
    await mobilePage.evaluate(() => {
      const villageTab = document.getElementById('tab-village');
      if (villageTab) villageTab.click();
    });
    await new Promise(r => setTimeout(r, 700));

    const mobileVillageWhitePath = path.join(ARTIFACTS_DIR, 'mobile_village_white_theme.png');
    await mobilePage.screenshot({ path: mobileVillageWhitePath });
    console.log('✓ Mobile Village White Theme screenshot saved:', mobileVillageWhitePath);

    await mobilePage.close();

    // 3. Host Tabletop in Studio White Theme (1550x850)
    console.log('Capturing Host Tabletop in Studio White Theme (1550x850)...');
    const hostPage = await browser.newPage();
    await hostPage.setViewport({ width: 1550, height: 850, deviceScaleFactor: 1 });
    await hostPage.goto('http://localhost:3000/host', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    // Ensure white theme is active on Host
    await hostPage.evaluate(() => {
      document.body.classList.add('theme-white');
    });
    await new Promise(r => setTimeout(r, 700));

    const hostWhitePath = path.join(ARTIFACTS_DIR, 'host_white_theme.png');
    await hostPage.screenshot({ path: hostWhitePath });
    console.log('✓ Host White Theme screenshot saved:', hostWhitePath);

    await hostPage.close();
    console.log('All white theme screenshots captured successfully!');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('Error capturing white theme screenshots:', err);
  process.exit(1);
});
