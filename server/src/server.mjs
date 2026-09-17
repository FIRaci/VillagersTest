import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { WebSocketServer } from 'ws';
import QRCode from 'qrcode';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const PORT = process.env.PORT || 3000;

// Load Gleam compiled engine and models
const preludePath = path.resolve(PROJECT_ROOT, 'engine/build/dev/javascript/prelude.mjs');
const enginePath = path.resolve(PROJECT_ROOT, 'engine/build/dev/javascript/engine/villagers/engine.mjs');
const modelsPath = path.resolve(PROJECT_ROOT, 'engine/build/dev/javascript/engine/villagers/models.mjs');
const codecPath = path.resolve(PROJECT_ROOT, 'engine/build/dev/javascript/engine/villagers/codec.mjs');
const optionPath = path.resolve(PROJECT_ROOT, 'engine/build/dev/javascript/gleam_stdlib/gleam/option.mjs');
const marketPath = path.resolve(PROJECT_ROOT, 'engine/build/dev/javascript/engine/villagers/market.mjs');
const chainsPath = path.resolve(PROJECT_ROOT, 'engine/build/dev/javascript/engine/villagers/chains.mjs');

const { toList } = await import('file://' + preludePath.replace(/\\/g, '/'));
const engine = await import('file://' + enginePath.replace(/\\/g, '/'));
const models = await import('file://' + modelsPath.replace(/\\/g, '/'));
const codec = await import('file://' + codecPath.replace(/\\/g, '/'));
const { Some, None } = await import('file://' + optionPath.replace(/\\/g, '/'));
const market = await import('file://' + marketPath.replace(/\\/g, '/'));
const chains = await import('file://' + chainsPath.replace(/\\/g, '/'));

console.log('✓ Gleam Core Game Engine & Market Scoring loaded into Server successfully!');

// Load Cards JSON
const cardsData = JSON.parse(fs.readFileSync(path.resolve(PROJECT_ROOT, 'data/cards.json'), 'utf8'));

// Build Gleam deck
function buildGleamDeck() {
  const gleamCards = [];
  for (const c of cardsData) {
    if (c.suit === 'SoloEvent' || c.suit === 'Development') continue;
    for (let i = 0; i < c.deck_count; i++) {
      const suitVal = models.suit_from_string(c.suit);
      const card = new models.VillagerCard(
        `${c.id}_${i + 1}`,
        c.code,
        c.name,
        suitVal,
        c.gold || 0,
        c.food || 0,
        c.builder || 0,
        c.silver_formula ? new Some(c.silver_formula) : new None(),
        toList(c.production_chain.placed_on || []),
        toList(c.production_chain.precedes || []),
        c.padlock.has_padlock,
        c.padlock.unlocked_by ? new Some(c.padlock.unlocked_by) : new None(),
        toList(c.padlock.unlocks || []),
        c.primary_image || '',
        0,
        new None()
      );
      gleamCards.push(card);
    }
  }
  return gleamCards;
}

// LAN IP Address detection
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIpAddress();
const serverUrl = `http://${localIp}:${PORT}`;
let qrCodeDataUrl = '';
QRCode.toDataURL(serverUrl, { margin: 1, scale: 6 }).then(url => {
  qrCodeDataUrl = url;
});

// Game Server State
let gameState = null;
let connectedPlayers = [
  ['p1', 'Người Chơi 1', '#3498db'],
  ['p2', 'Người Chơi 2', '#e74c3c']
];

function initGameSession() {
  const deck = buildGleamDeck();
  gameState = engine.init_game(toList(connectedPlayers), toList(deck), Math.floor(Math.random() * 100000));
  saveAutosave();
}

initGameSession();

function saveAutosave() {
  try {
    const jsonStr = codec.game_state_to_json_string(gameState);
    fs.writeFileSync(path.resolve(PROJECT_ROOT, 'data/autosave.json'), jsonStr, 'utf8');
  } catch (e) {
    console.error('Failed to save autosave:', e);
  }
}

// HTTP Static File Server
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];

  // API Route
  if (reqPath === '/api/network-info') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ip: localIp,
      port: PORT,
      url: serverUrl,
      qrCodeDataUrl
    }));
    return;
  }

  // Routing
  if (reqPath === '/' || reqPath === '/mobile') {
    reqPath = '/client/index.html';
  } else if (reqPath === '/host') {
    reqPath = '/client/host.html';
  } else if (fs.existsSync(path.join(PROJECT_ROOT, 'client', reqPath.replace(/^\//, '')))) {
    reqPath = '/client' + reqPath;
  }

  const filePath = path.join(PROJECT_ROOT, reqPath.replace(/^\//, ''));

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found: ' + reqPath);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.png' ? 'public, max-age=86400' : 'no-cache'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

// WebSocket Server
const wss = new WebSocketServer({ server, path: '/ws' });

// Live Scoring Engine for Tabletop Live Broadcast
function computeLiveScores() {
  if (!gameState || !gameState.players) return {};
  const scores = {};
  const playerList = gameState.players.toArray ? gameState.players.toArray() : gameState.players;
  for (const p of playerList) {
    try {
      const m1 = market.evaluate_first_market(p);
      const m2 = market.evaluate_second_market(p);
      const silverBreakdown = market.evaluate_silver_breakdown(p);
      scores[p.id] = {
        playerId: p.id,
        supplyGold: p.supply_gold,
        market1Printed: m1.printed_gold,
        market1Coins: m1.coin_gold,
        market1Total: m1.total_gained,
        market2Printed: m2.printed_gold,
        market2Coins: m2.coin_gold,
        silverGold: m2.silver_gold,
        market2Total: m2.total_gained,
        silverBreakdown: silverBreakdown,
        projectedFinalScore: p.supply_gold + m2.total_gained
      };
    } catch (err) {
      console.error(`Error computing live scores for player ${p.id}:`, err);
    }
  }
  return scores;
}

function broadcastState() {
  const jsonStr = codec.game_state_to_json_string(gameState);
  const stateObj = JSON.parse(jsonStr);
  stateObj.live_scores = computeLiveScores();
  const msg = JSON.stringify({ type: 'GAME_STATE', state: stateObj });

  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(msg);
    }
  });
}

function sendToast(wsClient, message) {
  if (wsClient && wsClient.readyState === 1) {
    wsClient.send(JSON.stringify({ type: 'TOAST', message }));
  }
}

wss.on('connection', (ws) => {
  // Send initial state with live scores
  const jsonStr = codec.game_state_to_json_string(gameState);
  const stateObj = JSON.parse(jsonStr);
  stateObj.live_scores = computeLiveScores();
  ws.send(JSON.stringify({ type: 'GAME_STATE', state: stateObj }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'HOST_CONNECT') {
        broadcastState();
      } else if (data.type === 'PLAYER_JOIN') {
        const playerInfo = data.player;
        const existingIdx = connectedPlayers.findIndex(p => p[0] === playerInfo.id);
        if (existingIdx >= 0) {
          connectedPlayers[existingIdx] = [playerInfo.id, playerInfo.name, playerInfo.color];
        } else if (connectedPlayers.length < 4) {
          connectedPlayers.push([playerInfo.id, playerInfo.name, playerInfo.color]);
          initGameSession();
        }
        broadcastState();
      } else if (data.type === 'PLAYER_ACTION') {
        const act = data.action;
        let gleamAction = null;

        if (act.type === 'draft_face_up') {
          gleamAction = new models.PlayerAct(new models.DraftFaceUp(act.playerId, act.cardId));
        } else if (act.type === 'draft_face_down') {
          gleamAction = new models.PlayerAct(new models.DraftFaceDown(act.playerId, Number(act.stackIndex)));
        } else if (act.type === 'build') {
          const parentOpt = act.targetParentId ? new Some(act.targetParentId) : new None();
          gleamAction = new models.PlayerAct(new models.BuildVillager(act.playerId, act.cardId, parentOpt));
        } else if (act.type === 'pass') {
          gleamAction = new models.PlayerAct(new models.PassTurn(act.playerId));
        }

        if (gleamAction) {
          const result = engine.apply_action(gameState, gleamAction);
          if (result.isOk()) {
            gameState = result[0];
            saveAutosave();
            broadcastState();
          } else {
            const err = result[0];
            const errMsg = err.message || err[0] || 'Nước đi không hợp lệ';
            sendToast(ws, `Lỗi: ${errMsg}`);
          }
        }
      } else if (data.type === 'TABLETOP_ACTION') {
        const act = data.action;
        let gleamAction = null;

        if (act.type === 'rewind') {
          gleamAction = new models.TabletopAct(new models.Rewind(act.step));
        } else if (act.type === 'undo') {
          gleamAction = new models.TabletopAct(new models.Undo());
        } else if (act.type === 'redo') {
          gleamAction = new models.TabletopAct(new models.Redo());
        } else if (act.type === 'adjust_gold') {
          gleamAction = new models.TabletopAct(new models.AdjustGoldArbitrary(act.playerId, act.delta));
        } else if (act.type === 'force_phase') {
          if (act.phase === 'market1') {
            // Evaluate Market 1 for all players, award gold, mark road.first_market_exhausted
            const playersArr = gameState.players.toArray();
            const updatedPlayers = playersArr.map(p => {
              const score = market.evaluate_first_market(p);
              return new models.Player(
                p.id, p.name, p.color,
                p.supply_gold + score.total_gained,
                p.hand, p.village, p.village_square,
                p.founders_flipped_to_food, p.is_connected
              );
            });
            const newPlayers = toList(updatedPlayers);
            const newRoad = new models.RoadState(
              gameState.road.face_up, gameState.road.stacks,
              true, gameState.road.second_market_exhausted
            );
            const nextRound = gameState.round + 1;
            const nextFirst = (gameState.first_player_index + 1) % (updatedPlayers.length || 1);
            const nextPhase = new models.DraftPhase(nextRound, nextFirst, 0);
            gameState = new models.GameState(
              gameState.id,
              gameState.step + 1,
              nextRound,
              nextPhase,
              nextFirst,
              newPlayers,
              newRoad,
              gameState.reserve,
              gameState.discard,
              toList([gameState, ...gameState.history.toArray()])
            );
            saveAutosave();
            broadcastState();
            return;
          } else if (act.phase === 'market2' || act.phase === 'ended') {
            // Evaluate Market 2 (printed + coins + silver formulas) for all players, award gold, determine winner, set GameEnded
            const playersArr = gameState.players.toArray();
            const updatedPlayers = playersArr.map(p => {
              const score = market.evaluate_second_market(p);
              return new models.Player(
                p.id, p.name, p.color,
                p.supply_gold + score.total_gained,
                p.hand, p.village, p.village_square,
                p.founders_flipped_to_food, p.is_connected
              );
            });
            const newPlayers = toList(updatedPlayers);
            const newRoad = new models.RoadState(
              gameState.road.face_up, gameState.road.stacks,
              gameState.road.first_market_exhausted, true
            );
            const winner = market.determine_winner(newPlayers);
            const nextPhase = new models.GameEnded(winner);
            gameState = new models.GameState(
              gameState.id,
              gameState.step + 1,
              gameState.round,
              nextPhase,
              gameState.first_player_index,
              newPlayers,
              newRoad,
              gameState.reserve,
              gameState.discard,
              toList([gameState, ...gameState.history.toArray()])
            );
            saveAutosave();
            broadcastState();
            return;
          } else {
            let targetPhase;
            if (act.phase === 'build') {
              targetPhase = new models.BuildPhase(gameState.round, 0, 0, 0);
            } else if (act.phase === 'draft') {
              targetPhase = new models.DraftPhase(gameState.round, 0, 0);
            } else {
              targetPhase = (gameState.phase instanceof models.DraftPhase)
                ? new models.BuildPhase(gameState.round, 0, 0, 0)
                : new models.DraftPhase(gameState.round + 1, 0, 0);
            }
            gleamAction = new models.TabletopAct(new models.ForcePhase(targetPhase));
          }
        } else if (act.type === 'reset_game') {
          initGameSession();
          broadcastState();
          return;
        }

        if (gleamAction) {
          const result = engine.apply_action(gameState, gleamAction);
          if (result.isOk()) {
            gameState = result[0];
            saveAutosave();
            broadcastState();
          } else {
            sendToast(ws, 'Không thể thực hiện thao tác tabletop');
          }
        }
      }
    } catch (err) {
      console.error('Error handling WS message:', err);
    }
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ LỖI: Cổng ${PORT} đang bị chiếm dụng bởi một tiến trình khác!`);
    console.error(`👉 Hãy chạy lại file "run_host.bat" (file này sẽ tự động giải phóng cổng 3000 giúp bạn).\n`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n=============================================================');
  console.log('  🏰 VILLAGERS DIGITAL - PC HOST & MOBILE SERVER IS READY!  ');
  console.log('=============================================================');
  console.log(`  💻 PC Host Tabletop UI:   http://localhost:${PORT}/host`);
  console.log(`  📱 Mobile Player Web App: ${serverUrl}`);
  console.log(`  📡 WebSocket Sync:        ws://${localIp}:${PORT}/ws`);
  console.log('=============================================================\n');
});
