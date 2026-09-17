import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/TSC/.gemini/antigravity-ide/brain/32e7f1fe-199f-4749-98d9-5a87f86bbe46';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function run() {
  console.log('Launching Edge for Pastel Linen Theme screenshots...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // 1. Mobile Lobby Screen (Landscape 844x390)
    console.log('1. Capturing Mobile Lobby Screen...');
    const lobbyPage = await browser.newPage();
    await lobbyPage.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true });
    await lobbyPage.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const lobbyScreenshotPath = path.join(ARTIFACTS_DIR, 'pastel_mobile_lobby.png');
    await lobbyPage.screenshot({ path: lobbyScreenshotPath });
    console.log('✓ Mobile Lobby saved:', lobbyScreenshotPath);
    await lobbyPage.close();

    // 2. Mobile In-Game Duel Mat (844x390)
    console.log('2. Capturing Mobile Duel Mat...');
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true });
    await mobilePage.goto('http://localhost:3000/?player=p1&name=LinhChi', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    // Join lobby if needed
    await mobilePage.evaluate(() => {
      const lobby = document.getElementById('lobby-screen');
      if (lobby && lobby.style.display !== 'none') {
        const btn = document.getElementById('btn-join-lobby');
        if (btn) btn.click();
      }
    });
    await new Promise(r => setTimeout(r, 1200));

    const duelMatPath = path.join(ARTIFACTS_DIR, 'pastel_mobile_duel_mat.png');
    await mobilePage.screenshot({ path: duelMatPath });
    console.log('✓ Mobile Duel Mat saved:', duelMatPath);

    // 3. Select a hand card to show Snap Target
    console.log('3. Selecting hand card for snap targets...');
    await mobilePage.evaluate(() => {
      const cards = document.querySelectorAll('.duel-hand-cards-rack .villager-card');
      if (cards.length > 0) cards[0].click();
    });
    await new Promise(r => setTimeout(r, 600));
    const snapPath = path.join(ARTIFACTS_DIR, 'pastel_mobile_snap_target.png');
    await mobilePage.screenshot({ path: snapPath });
    console.log('✓ Mobile Snap Target saved:', snapPath);

    // 4. Village Production Chains tab
    console.log('4. Capturing Village Production Tree...');
    await mobilePage.evaluate(() => {
      const villageTab = document.getElementById('tab-village');
      if (villageTab) villageTab.click();
    });
    await new Promise(r => setTimeout(r, 700));

    const villageTreePath = path.join(ARTIFACTS_DIR, 'pastel_mobile_village_tree.png');
    await mobilePage.screenshot({ path: villageTreePath });
    console.log('✓ Mobile Village Tree saved:', villageTreePath);

    // 5. Open AI Tactical Advisor
    console.log('5. Capturing AI Tactical Advisor Modal...');
    await mobilePage.evaluate(() => {
      const aiBtn = document.getElementById('btn-ai-advisor');
      if (aiBtn) aiBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const aiAdvisorPath = path.join(ARTIFACTS_DIR, 'pastel_mobile_ai_advisor.png');
    await mobilePage.screenshot({ path: aiAdvisorPath });
    console.log('✓ AI Tactical Advisor saved:', aiAdvisorPath);

    // Close AI Advisor
    await mobilePage.evaluate(() => {
      const closeAi = document.getElementById('btn-close-ai-advisor');
      if (closeAi) closeAi.click();
    });
    await new Promise(r => setTimeout(r, 500));



    await mobilePage.close();

    // 7. Host PC Tabletop Dashboard (1550x850)
    console.log('7. Capturing Host PC Tabletop Dashboard...');
    const hostPage = await browser.newPage();
    await hostPage.setViewport({ width: 1550, height: 850, deviceScaleFactor: 1 });
    await hostPage.goto('http://localhost:3000/host', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    const hostDashboardPath = path.join(ARTIFACTS_DIR, 'pastel_host_dashboard.png');
    await hostPage.screenshot({ path: hostDashboardPath });
    console.log('✓ Host PC Dashboard saved:', hostDashboardPath);

    // 8. Open Host Control Panel modal
    console.log('8. Capturing Host Control Panel...');
    await hostPage.evaluate(() => {
      const btnCP = document.getElementById('btn-open-control-panel');
      if (btnCP) btnCP.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const hostControlPanelPath = path.join(ARTIFACTS_DIR, 'pastel_host_control_panel.png');
    await hostPage.screenshot({ path: hostControlPanelPath });
    console.log('✓ Host Control Panel saved:', hostControlPanelPath);

    // Close Host Control Panel
    await hostPage.evaluate(() => {
      const closeBtn = document.getElementById('btn-close-control-panel-x');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 700));

    // 9. Inspect a card on Host Tabletop
    console.log('9. Capturing Card Inspector on Host...');
    await hostPage.evaluate(() => {
      const firstCard = document.querySelector('.tabletop-well .villager-card');
      if (firstCard) firstCard.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const inspectorPath = path.join(ARTIFACTS_DIR, 'pastel_card_inspector.png');
    await hostPage.screenshot({ path: inspectorPath });
    console.log('✓ Card Inspector saved:', inspectorPath);

    await hostPage.close();
    console.log('All Pastel Screenshots captured successfully!');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('Error capturing pastel screenshots:', err);
  process.exit(1);
});
