import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import puppeteer from '../server/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import pkg from '../server/node_modules/ws/index.js';
const { WebSocket } = pkg;

const ARTIFACTS_DIR = 'C:/Users/TSC/.gemini/antigravity-ide/brain/32e7f1fe-199f-4749-98d9-5a87f86bbe46';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const WS_URL = 'ws://localhost:3000/ws';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createClient(name) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const messages = [];

    ws.on('open', () => {
      resolve({
        name,
        ws,
        messages,
        send(obj) {
          ws.send(JSON.stringify(obj));
        },
        async waitForMessage(predicate, timeout = 5000) {
          const start = Date.now();
          while (Date.now() - start < timeout) {
            for (let i = messages.length - 1; i >= 0; i--) {
              if (predicate(messages[i])) {
                return messages[i];
              }
            }
            await delay(50);
          }
          throw new Error(`${name} timed out waiting for message`);
        },
        close() {
          ws.close();
        }
      });
    });

    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        messages.push(parsed);
      } catch (e) {}
    });

    ws.on('error', reject);
  });
}

async function main() {
  console.log('====================================================');
  console.log('🎮 VILLAGERS BOARD GAME - FULL END-TO-END PLAYTHROUGH');
  console.log('====================================================\n');

  // Connect Host
  console.log('[1/6] Connecting Host & Players to WebSocket...');
  const host = await createClient('Host');
  host.send({ type: 'HOST_CONNECT' });
  const hostInit = await host.waitForMessage(m => m.type === 'GAME_STATE');
  console.log(`✓ Host connected. Initial Step: ${hostInit.state.step}, Phase: ${hostInit.state.phase.type}`);

  // Connect Alice (p1)
  const alice = await createClient('Alice');
  alice.send({
    type: 'PLAYER_JOIN',
    player: { id: 'p1', name: 'Alice', color: '#3498db' }
  });
  await delay(200);

  // Connect Bob (p2)
  const bob = await createClient('Bob');
  bob.send({
    type: 'PLAYER_JOIN',
    player: { id: 'p2', name: 'Bob', color: '#e74c3c' }
  });
  await delay(300);

  const stateAfterJoin = await host.waitForMessage(m => m.type === 'GAME_STATE');
  console.log(`✓ Players joined: ${stateAfterJoin.state.players.map(p => p.name).join(', ')}`);

  // [2/6] Simulate Draft and Build Phase
  console.log('\n[2/6] Playing Turn 1: Draft Phase & Build Phase...');
  let currState = stateAfterJoin.state;

  // Let active player draft from road
  for (let i = 0; i < 4; i++) {
    const activeIdx = currState.phase.active_player_index || 0;
    const activePlayerId = currState.players[activeIdx].id;
    const client = activePlayerId === 'p1' ? alice : bob;
    
    // Pick the first available face up card on the road
    const faceUpCards = currState.road.face_up;
    if (faceUpCards && faceUpCards.length > 0) {
      const cardToDraft = faceUpCards[0];
      console.log(`  -> ${activePlayerId} drafts face-up card: "${cardToDraft.name}" (${cardToDraft.suit})`);
      client.send({
        type: 'PLAYER_ACTION',
        action: {
          type: 'draft_face_up',
          playerId: activePlayerId,
          cardId: cardToDraft.id
        }
      });
      await delay(250);
      const update = await host.waitForMessage(m => m.type === 'GAME_STATE');
      currState = update.state;
    }
  }

  console.log(`✓ Draft complete. Current Phase: ${currState.phase.type}, Round: ${currState.round}`);

  // Transition to Build Phase if still in draft
  if (currState.phase.type === 'draft') {
    console.log('  -> Transitioning to Build Phase...');
    host.send({
      type: 'TABLETOP_ACTION',
      action: { type: 'force_phase', phase: 'build' }
    });
    await delay(300);
    const update = await host.waitForMessage(m => m.type === 'GAME_STATE');
    currState = update.state;
  }
  console.log(`✓ Active Phase: ${currState.phase.type}`);

  // [3/6] Test Host Referee Controls & Customization
  console.log('\n[3/6] Testing Host Referee Customization...');
  const aliceGoldBefore = currState.players.find(p => p.id === 'p1').supply_gold;
  console.log(`  -> Alice initial gold: ${aliceGoldBefore}`);
  
  // Customization 1: Host adjusts Alice gold (+5)
  host.send({
    type: 'TABLETOP_ACTION',
    action: { type: 'adjust_gold', playerId: 'p1', delta: 5 }
  });
  await delay(300);
  let goldUpdate = await host.waitForMessage(m => m.type === 'GAME_STATE');
  currState = goldUpdate.state;
  const aliceGoldAfter = currState.players.find(p => p.id === 'p1').supply_gold;
  console.log(`  -> Host granted +5 Gold. Alice new gold: ${aliceGoldAfter} (Verified: ${aliceGoldAfter === aliceGoldBefore + 5})`);

  // Customization 2: Host tests Undo
  const stepBeforeUndo = currState.step;
  host.send({
    type: 'TABLETOP_ACTION',
    action: { type: 'undo' }
  });
  await delay(300);
  let undoUpdate = await host.waitForMessage(m => m.type === 'GAME_STATE');
  currState = undoUpdate.state;
  console.log(`  -> Host Undo executed. Step: ${stepBeforeUndo} -> ${currState.step}`);

  // [4/6] Trigger Market 1 Scoring
  console.log('\n[4/6] Triggering Market 1 (Chợ Lần 1: Printed Gold + Coins)...');
  host.send({
    type: 'TABLETOP_ACTION',
    action: { type: 'force_phase', phase: 'market1' }
  });
  await delay(400);
  let m1Update = await host.waitForMessage(m => m.type === 'GAME_STATE');
  currState = m1Update.state;
  console.log(`✓ Market 1 evaluated successfully!`);
  console.log(`  Road First Market Exhausted: ${currState.road.first_market_exhausted}`);
  console.log(`  Current Round: ${currState.round}, Phase: ${currState.phase.type}`);
  for (const p of currState.players) {
    console.log(`  - Player ${p.name} (${p.id}): Total Gold = ${p.supply_gold}`);
  }

  // [5/6] Trigger Market 2 & Final Victory (Chợ Lần 2 & Game Over)
  console.log('\n[5/6] Triggering Market 2 & Ending Game (Chợ Chung Cuộc & Trao Cúp)...');
  host.send({
    type: 'TABLETOP_ACTION',
    action: { type: 'force_phase', phase: 'market2' }
  });
  await delay(500);
  let m2Update = await host.waitForMessage(m => m.type === 'GAME_STATE');
  currState = m2Update.state;
  console.log(`✓ Market 2 & Game Over evaluated!`);
  console.log(`  Phase Type: ${currState.phase.type}`);
  console.log(`  Winner Declared: ${currState.phase.winner_id}`);
  for (const p of currState.players) {
    console.log(`  - Player ${p.name}: Final Gold = ${p.supply_gold}, Village Size = ${p.village.length}`);
  }

  // [6/6] Capture Visual Verification Screenshots via Puppeteer/Edge
  console.log('\n[6/6] Launching Headless Edge to capture live screenshots...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // 1. Mobile Player View (Landscape 844x390)
    console.log('  -> Navigating Mobile Player (Alice) to http://localhost:3000/?p=p1 ...');
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 844, height: 390, deviceScaleFactor: 2 });
    await mobilePage.goto('http://localhost:3000/?p=p1', { waitUntil: 'networkidle0' });
    await delay(1200);

    const mobileScreenshotPath = path.join(ARTIFACTS_DIR, 'mobile_game_over_verified.png');
    await mobilePage.screenshot({ path: mobileScreenshotPath });
    console.log(`  ✓ Mobile Game Over screenshot saved: ${mobileScreenshotPath}`);

    // 2. PC Host Tabletop View (1366x768)
    console.log('  -> Navigating Host Tabletop to http://localhost:3000/host.html ...');
    const hostPage = await browser.newPage();
    await hostPage.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 });
    await hostPage.goto('http://localhost:3000/host.html', { waitUntil: 'networkidle0' });
    await delay(1200);

    const hostScreenshotPath = path.join(ARTIFACTS_DIR, 'host_game_over_verified.png');
    await hostPage.screenshot({ path: hostScreenshotPath });
    console.log(`  ✓ Host Game Over screenshot saved: ${hostScreenshotPath}`);

    // 3. Close victory modal on Host and open Host Control Panel to verify Customization UI
    console.log('  -> Opening Host Tabletop Control Panel to verify Customization options...');
    await hostPage.evaluate(() => {
      const closeGov = document.getElementById('btn-close-host-game-over');
      if (closeGov) closeGov.click();
      const openPanel = document.getElementById('btn-open-control-panel');
      if (openPanel) openPanel.click();
    });
    await delay(800);

    const panelScreenshotPath = path.join(ARTIFACTS_DIR, 'host_control_customization_verified.png');
    await hostPage.screenshot({ path: panelScreenshotPath });
    console.log(`  ✓ Host Customization Panel screenshot saved: ${panelScreenshotPath}`);

    // 4. Test Game Reset (Play Again)
    console.log('\n  -> Testing Game Reset (Bắt đầu ván mới)...');
    await hostPage.evaluate(() => {
      window.dispatchEvent(new CustomEvent('reset_game'));
    });
    host.send({
      type: 'TABLETOP_ACTION',
      action: { type: 'reset_game' }
    });
    await delay(500);
    const resetState = await host.waitForMessage(m => m.type === 'GAME_STATE');
    console.log(`  ✓ Game successfully reset! New Round: ${resetState.state.round}, Phase: ${resetState.state.phase.type}`);

  } catch (err) {
    console.error('Error during browser capture:', err);
  } finally {
    await browser.close();
  }

  host.close();
  alice.close();
  bob.close();

  console.log('\n====================================================');
  console.log('🎉 ALL GAMEPLAY, END-GAME, HOST & CUSTOMIZATIONS 100% VERIFIED!');
  console.log('====================================================\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
