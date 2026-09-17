import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/TSC/.gemini/antigravity-ide/brain/32e7f1fe-199f-4749-98d9-5a87f86bbe46';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function run() {
  console.log('=== STARTING AUTOMATED DOM MEASUREMENT & VISUAL AUDIT ===\n');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // ----------------------------------------------------
    // TEST 1: MOBILE LANDSCAPE VIEWPORT (844 x 390)
    // ----------------------------------------------------
    console.log('--- TEST 1: MOBILE LANDSCAPE (844 x 390) ---');
    const mobilePage = await browser.newPage();
    mobilePage.on('console', msg => console.log('[BROWSER CONSOLE]', msg.text()));
    mobilePage.on('pageerror', err => console.log('[BROWSER ERROR]', err.message));
    await mobilePage.setViewport({ width: 844, height: 390, deviceScaleFactor: 1, isLandscape: true });
    await mobilePage.goto('http://localhost:3000/?p=p1&name=Thanh%20Tung', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    // Auto-join via URL param, wait for WebSocket GAME_STATE
    console.log('Waiting for GAME_STATE from server...');
    await new Promise(r => setTimeout(r, 1500));

    // Measure Header Ribbon
    const headerMetrics = await mobilePage.evaluate(() => {
      const el = document.querySelector('.duel-header-ribbon');
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return { width: Math.round(rect.width), height: Math.round(rect.height), top: Math.round(rect.top), bottom: Math.round(rect.bottom) };
    });
    console.log('Header Ribbon:', headerMetrics);

    // Measure Viewport
    const viewportMetrics = await mobilePage.evaluate(() => {
      const el = document.getElementById('viewport');
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        clientHeight: el.clientHeight,
        scrollHeight: el.scrollHeight,
        hasVerticalScroll: el.scrollHeight > el.clientHeight
      };
    });
    console.log('Main Viewport:', viewportMetrics);

    // Measure 6-Station Road Layout
    const roadStationsMetrics = await mobilePage.evaluate(() => {
      const wrapper = document.querySelector('.mobile-road-stations-wrapper');
      const stationsGrid = document.getElementById('mobile-road-stations');
      if (!wrapper || !stationsGrid) return null;

      const wrapperRect = wrapper.getBoundingClientRect();
      const gridRect = stationsGrid.getBoundingClientRect();

      const stations = Array.from(stationsGrid.children).map((col, idx) => {
        const colRect = col.getBoundingClientRect();
        const stackCard = col.querySelector('.station-stack-card');
        const marketCard = col.querySelector('.station-market-card, .station-market-empty');

        return {
          station: idx,
          col: { width: Math.round(colRect.width), height: Math.round(colRect.height), top: Math.round(colRect.top), bottom: Math.round(colRect.bottom) },
          stack: stackCard ? { height: Math.round(stackCard.getBoundingClientRect().height), top: Math.round(stackCard.getBoundingClientRect().top), bottom: Math.round(stackCard.getBoundingClientRect().bottom) } : null,
          market: marketCard ? { height: Math.round(marketCard.getBoundingClientRect().height), top: Math.round(marketCard.getBoundingClientRect().top), bottom: Math.round(marketCard.getBoundingClientRect().bottom) } : null
        };
      });

      return {
        wrapper: { height: Math.round(wrapperRect.height), top: Math.round(wrapperRect.top), bottom: Math.round(wrapperRect.bottom) },
        grid: { height: Math.round(gridRect.height), top: Math.round(gridRect.top), bottom: Math.round(gridRect.bottom) },
        stationsCount: stations.length,
        stations
      };
    });
    console.log('6-Station Road System:', JSON.stringify(roadStationsMetrics, null, 2));

    // Measure Hand Dock
    const handMetrics = await mobilePage.evaluate(() => {
      const dock = document.getElementById('hand-sheet');
      const rack = document.getElementById('hand-carousel');
      if (!dock) return null;
      const dockRect = dock.getBoundingClientRect();
      const cards = Array.from(rack ? rack.querySelectorAll('.villager-card') : []).map(c => {
        const r = c.getBoundingClientRect();
        return { width: Math.round(r.width), height: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom) };
      });

      return {
        dock: { height: Math.round(dockRect.height), top: Math.round(dockRect.top), bottom: Math.round(dockRect.bottom) },
        cardsCount: cards.length,
        cards
      };
    });
    console.log('Hand Dock:', handMetrics);

    // Capture Mobile Road Tab
    const roadPic = path.join(ARTIFACTS_DIR, 'mobile_landscape_road_verified.png');
    await mobilePage.screenshot({ path: roadPic });
    console.log('✓ Saved:', roadPic);

    // Switch to Village Tab and measure
    await mobilePage.click('#tab-village');
    await new Promise(r => setTimeout(r, 600));

    const villageMetrics = await mobilePage.evaluate(() => {
      const view = document.getElementById('view-village');
      const container = document.getElementById('my-village-chains');
      if (!view) return null;
      return {
        viewRect: view.getBoundingClientRect(),
        containerRect: container ? container.getBoundingClientRect() : null,
        columnsCount: container ? container.querySelectorAll('.village-chain-column').length : 0
      };
    });
    console.log('Village View:', villageMetrics);

    const villagePic = path.join(ARTIFACTS_DIR, 'mobile_landscape_village_verified.png');
    await mobilePage.screenshot({ path: villagePic });
    console.log('✓ Saved:', villagePic);

    // Switch to Opponents Tab and measure
    await mobilePage.click('#tab-others');
    await new Promise(r => setTimeout(r, 600));
    const othersPic = path.join(ARTIFACTS_DIR, 'mobile_landscape_others_verified.png');
    await mobilePage.screenshot({ path: othersPic });
    console.log('✓ Saved:', othersPic);

    // Switch back to Road and open AI Advisor modal
    await mobilePage.click('#tab-road');
    await new Promise(r => setTimeout(r, 400));
    const aiBtn = await mobilePage.$('#btn-ai-advisor');
    if (aiBtn) {
      await aiBtn.click();
      await new Promise(r => setTimeout(r, 600));
      const aiPic = path.join(ARTIFACTS_DIR, 'mobile_landscape_ai_advisor_verified.png');
      await mobilePage.screenshot({ path: aiPic });
      console.log('✓ Saved AI Advisor modal:', aiPic);

      // Close modal
      const closeAiBtn = await mobilePage.$('#btn-close-ai-advisor-x, #btn-close-ai-advisor');
      if (closeAiBtn) await closeAiBtn.click();
      await new Promise(r => setTimeout(r, 400));
    }

    // Open Card Inspector Modal via station inspect button
    const inspectBtn = await mobilePage.$('.station-card-inspect-btn');
    if (inspectBtn) {
      console.log('Testing Card Inspector modal...');
      await inspectBtn.click();
      await new Promise(r => setTimeout(r, 600));
      const inspectPic = path.join(ARTIFACTS_DIR, 'mobile_landscape_inspector_verified.png');
      await mobilePage.screenshot({ path: inspectPic });
      console.log('✓ Saved Card Inspector modal:', inspectPic);

      const closeInspect = await mobilePage.$('#tts-inspector-close-x');
      if (closeInspect) await closeInspect.click();
      await new Promise(r => setTimeout(r, 400));
    }

    // Open Live Scoreboard Modal
    const scoreTrigger = await mobilePage.$('#hud-live-score');
    if (scoreTrigger) {
      console.log('Testing Live Score modal...');
      await scoreTrigger.click();
      await new Promise(r => setTimeout(r, 600));
      const scorePic = path.join(ARTIFACTS_DIR, 'mobile_landscape_score_modal_verified.png');
      await mobilePage.screenshot({ path: scorePic });
      console.log('✓ Saved Score modal:', scorePic);

      const closeScore = await mobilePage.$('#btn-close-mobile-score, #btn-close-mobile-score-x');
      if (closeScore) await closeScore.click();
      await new Promise(r => setTimeout(r, 400));
    }

    // Test Drafting a Card from Road Station 0
    console.log('Testing Draft Card action from Station 0...');
    const firstMarketCard = await mobilePage.$('.station-market-card');
    if (firstMarketCard) {
      await firstMarketCard.click();
      await new Promise(r => setTimeout(r, 1000));
      const postDraftMetrics = await mobilePage.evaluate(() => {
        const rack = document.getElementById('hand-carousel');
        return {
          handCardsCount: rack ? rack.querySelectorAll('.villager-card').length : 0
        };
      });
      console.log('Post-Draft Hand Cards Count:', postDraftMetrics.handCardsCount);
      const postDraftPic = path.join(ARTIFACTS_DIR, 'mobile_landscape_after_draft.png');
      await mobilePage.screenshot({ path: postDraftPic });
      console.log('✓ Saved Post-Draft screenshot:', postDraftPic);
    }


    // ----------------------------------------------------
    // TEST 2: PC HOST TABLETOP (1366 x 768)
    // ----------------------------------------------------
    console.log('\n--- TEST 2: PC HOST TABLETOP (1366 x 768) ---');
    const hostPage = await browser.newPage();
    await hostPage.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 });
    await hostPage.goto('http://localhost:3000/host', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    const hostMetrics = await hostPage.evaluate(() => {
      const header = document.querySelector('.host-header');
      const road = document.querySelector('.road-section');
      const players = document.querySelector('.players-grid');
      const bar = document.querySelector('.control-bar');

      return {
        header: header ? Math.round(header.getBoundingClientRect().height) : null,
        road: road ? { height: Math.round(road.getBoundingClientRect().height), top: Math.round(road.getBoundingClientRect().top), bottom: Math.round(road.getBoundingClientRect().bottom) } : null,
        players: players ? { height: Math.round(players.getBoundingClientRect().height), top: Math.round(players.getBoundingClientRect().top), bottom: Math.round(players.getBoundingClientRect().bottom) } : null,
        bar: bar ? { height: Math.round(bar.getBoundingClientRect().height), top: Math.round(bar.getBoundingClientRect().top), bottom: Math.round(bar.getBoundingClientRect().bottom) } : null
      };
    });
    console.log('PC Host Tabletop Metrics:', hostMetrics);

    const hostPic = path.join(ARTIFACTS_DIR, 'host_tabletop_1366x768_verified.png');
    await hostPage.screenshot({ path: hostPic });
    console.log('✓ Saved:', hostPic);

    // Open Host Control Panel modal
    const ctrlBtn = await hostPage.$('#btn-open-control-panel');
    if (ctrlBtn) {
      console.log('Testing Host Control Panel modal...');
      await ctrlBtn.click();
      await new Promise(r => setTimeout(r, 600));
      const ctrlPic = path.join(ARTIFACTS_DIR, 'host_control_panel_verified.png');
      await hostPage.screenshot({ path: ctrlPic });
      console.log('✓ Saved Host Control Panel modal:', ctrlPic);
    }

  } catch (err) {
    console.error('Audit failed with error:', err);
  } finally {
    await browser.close();
    console.log('\n=== DOM MEASUREMENT AUDIT COMPLETE ===');
  }
}

run();
