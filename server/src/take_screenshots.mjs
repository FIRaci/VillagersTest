import puppeteer from 'puppeteer-core';
import path from 'path';

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
    await new Promise(r => setTimeout(r, 1000));

    const hostScreenshotPath = path.join(ARTIFACTS_DIR, 'host_tts_tabletop_dashboard.png');
    await hostPage.screenshot({ path: hostScreenshotPath });
    console.log('✓ Host dashboard screenshot saved:', hostScreenshotPath);

    // 2. Open Host Control Panel modal and capture Live Scoreboard
    console.log('Opening Host Control Panel modal...');
    await hostPage.evaluate(() => document.getElementById('btn-open-control-panel').click());
    await new Promise(r => setTimeout(r, 600));

    const controlPanelScreenshotPath = path.join(ARTIFACTS_DIR, 'host_tts_control_panel.png');
    await hostPage.screenshot({ path: controlPanelScreenshotPath });
    console.log('✓ Host control panel screenshot saved:', controlPanelScreenshotPath);

    // Switch to Time Machine tab
    await hostPage.evaluate(() => {
      const tabs = document.querySelectorAll('.control-tab-btn');
      if (tabs[3]) tabs[3].click();
    });
    await new Promise(r => setTimeout(r, 500));
    const timeMachineScreenshotPath = path.join(ARTIFACTS_DIR, 'host_tts_time_machine.png');
    await hostPage.screenshot({ path: timeMachineScreenshotPath });
    console.log('✓ Host time machine tab saved:', timeMachineScreenshotPath);

    // Close control panel modal
    await hostPage.evaluate(() => document.getElementById('btn-close-control-panel-x').click());
    await new Promise(r => setTimeout(r, 400));

    // 3. Capture TTS Card Inspector on Host
    console.log('Opening TTS Card Inspector on Host...');
    await hostPage.evaluate(() => {
      const firstCard = document.querySelector('.road-well .villager-card');
      if (firstCard) firstCard.click();
    });
    await new Promise(r => setTimeout(r, 600));
    const inspectorScreenshotPath = path.join(ARTIFACTS_DIR, 'tts_card_inspector_verified.png');
    await hostPage.screenshot({ path: inspectorScreenshotPath });
    console.log('✓ Card inspector screenshot saved:', inspectorScreenshotPath);

    // 4. Capture Mobile Player UI (414x820)
    console.log('Capturing Mobile Player UI (414x820)...');
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 414, height: 820, deviceScaleFactor: 2, isMobile: true });
    await mobilePage.goto('http://localhost:3000/?player=p1&name=Arthur', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    // Join lobby if visible
    await mobilePage.evaluate(() => {
      const lobby = document.getElementById('lobby-screen');
      if (lobby && lobby.style.display !== 'none') {
        const btn = document.getElementById('btn-join-lobby');
        if (btn) btn.click();
      }
    });
    await new Promise(r => setTimeout(r, 1000));

    const mobileScreenshotPath = path.join(ARTIFACTS_DIR, 'mobile_tts_board_verified.png');
    await mobilePage.screenshot({ path: mobileScreenshotPath });
    console.log('✓ Mobile board screenshot saved:', mobileScreenshotPath);

    // 5. Open Mobile Live Scoreboard modal
    console.log('Opening Mobile Live Scoreboard modal...');
    await mobilePage.evaluate(() => {
      const pill = document.getElementById('hud-live-score');
      if (pill) pill.click();
    });
    await new Promise(r => setTimeout(r, 600));
    const mobileScorePath = path.join(ARTIFACTS_DIR, 'mobile_live_scoreboard_verified.png');
    await mobilePage.screenshot({ path: mobileScorePath });
    console.log('✓ Mobile live score screenshot saved:', mobileScorePath);

    // Close score modal and switch to village tab
    await mobilePage.evaluate(() => {
      const closeBtn = document.getElementById('btn-close-mobile-score');
      if (closeBtn) closeBtn.click();
      const villageTab = document.getElementById('tab-village');
      if (villageTab) villageTab.click();
    });
    await new Promise(r => setTimeout(r, 600));
    const mobileVillagePath = path.join(ARTIFACTS_DIR, 'mobile_village_tree_verified.png');
    await mobilePage.screenshot({ path: mobileVillagePath });
    console.log('✓ Mobile village tree screenshot saved:', mobileVillagePath);

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

run();
