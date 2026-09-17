import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/TSC/.gemini/antigravity-ide/brain/32e7f1fe-199f-4749-98d9-5a87f86bbe46';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function run() {
  console.log('Launching Edge for Landscape TCG screenshots...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // 1. Capture Mobile Portrait Rotation Hint (390x844)
    console.log('Capturing Portrait Rotation Hint (390x844)...');
    const portraitPage = await browser.newPage();
    await portraitPage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
    await portraitPage.goto('http://localhost:3000/?player=p1&name=Kaiba', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const portraitScreenshotPath = path.join(ARTIFACTS_DIR, 'mobile_portrait_rotation_hint.png');
    await portraitPage.screenshot({ path: portraitScreenshotPath });
    console.log('✓ Portrait rotation hint saved:', portraitScreenshotPath);
    await portraitPage.close();

    // 2. Capture Landscape Yu-Gi-Oh! TCG Duel Mat (844x390)
    console.log('Capturing Landscape Yu-Gi-Oh! TCG Duel Mat (844x390)...');
    const landscapePage = await browser.newPage();
    await landscapePage.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true });
    await landscapePage.goto('http://localhost:3000/?player=p1&name=Yugi', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    // Join lobby if needed
    await landscapePage.evaluate(() => {
      const lobby = document.getElementById('lobby-screen');
      if (lobby && lobby.style.display !== 'none') {
        const btn = document.getElementById('btn-join-lobby');
        if (btn) btn.click();
      }
    });
    await new Promise(r => setTimeout(r, 1000));

    const duelMatScreenshotPath = path.join(ARTIFACTS_DIR, 'mobile_landscape_duel_mat.png');
    await landscapePage.screenshot({ path: duelMatScreenshotPath });
    console.log('✓ Landscape Duel Mat saved:', duelMatScreenshotPath);

    // 3. Open Village tab and select a hand card to trigger One-Tap Snap Target Zone
    console.log('Testing Hand Card Selection & Snap Target Zones...');
    await landscapePage.evaluate(() => {
      const villageTab = document.getElementById('tab-village');
      if (villageTab) villageTab.click();
      const firstHandCard = document.querySelector('.duel-hand-cards-rack .villager-card');
      if (firstHandCard) firstHandCard.click();
    });
    await new Promise(r => setTimeout(r, 700));

    const snapTargetScreenshotPath = path.join(ARTIFACTS_DIR, 'mobile_landscape_snap_target.png');
    await landscapePage.screenshot({ path: snapTargetScreenshotPath });
    console.log('✓ Landscape Snap Target Zone saved:', snapTargetScreenshotPath);

    // 3b. Scroll and capture the village production tree
    console.log('Capturing Village Production Chains in Landscape...');
    await landscapePage.evaluate(() => {
      const chainContainer = document.getElementById('my-village-chains');
      if (chainContainer) chainContainer.scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 500));
    const chainsScreenshotPath = path.join(ARTIFACTS_DIR, 'mobile_landscape_chains_tree.png');
    await landscapePage.screenshot({ path: chainsScreenshotPath });
    console.log('✓ Landscape Chains Tree saved:', chainsScreenshotPath);

    // 4. Open AI Tactical Advisor modal
    console.log('Opening AI Tactical Advisor Modal in Landscape...');
    await landscapePage.evaluate(() => {
      const aiBtn = document.getElementById('btn-ai-advisor');
      if (aiBtn) aiBtn.click();
    });
    await new Promise(r => setTimeout(r, 900));

    const aiAdvisorScreenshotPath = path.join(ARTIFACTS_DIR, 'mobile_landscape_ai_advisor.png');
    await landscapePage.screenshot({ path: aiAdvisorScreenshotPath });
    console.log('✓ AI Tactical Advisor modal saved:', aiAdvisorScreenshotPath);

    // 5. Close AI Advisor and open Live Scoreboard in Landscape
    console.log('Opening Live Scoreboard in Landscape...');
    await landscapePage.evaluate(() => {
      const closeAi = document.getElementById('btn-close-ai-advisor');
      if (closeAi) closeAi.click();
      const scorePill = document.getElementById('hud-live-score');
      if (scorePill) scorePill.click();
    });
    await new Promise(r => setTimeout(r, 700));

    const landscapeScoreScreenshotPath = path.join(ARTIFACTS_DIR, 'mobile_landscape_live_score.png');
    await landscapePage.screenshot({ path: landscapeScoreScreenshotPath });
    console.log('✓ Landscape Live Scoreboard saved:', landscapeScoreScreenshotPath);

    await landscapePage.close();
    console.log('All landscape screenshots captured successfully!');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('Error capturing landscape screenshots:', err);
  process.exit(1);
});
