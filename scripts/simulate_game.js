import pkg from '../server/node_modules/ws/index.js';
const { WebSocket } = pkg;

const WS_URL = 'ws://localhost:3000/ws';

async function delay(ms) {
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
        async waitForMessage(predicate, timeout = 3000) {
          const start = Date.now();
          while (Date.now() - start < timeout) {
            for (let i = 0; i < messages.length; i++) {
              if (predicate(messages[i])) {
                const matched = messages[i];
                return matched;
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

async function runSimulation() {
  console.log('=== STARTING VILLAGERS E2E SIMULATION ===');

  // 1. Connect Host
  const host = await createClient('Host');
  host.send({ type: 'HOST_CONNECT' });
  const initialHostState = await host.waitForMessage(m => m.type === 'GAME_STATE');
  console.log('✓ Host connected! Initial Step:', initialHostState.state.step);

  // 2. Connect Players Alice and Bob
  const p1 = await createClient('Alice');
  p1.send({
    type: 'PLAYER_JOIN',
    player: { id: 'p1', name: 'Alice', color: '#3498db' }
  });

  const p2 = await createClient('Bob');
  p2.send({
    type: 'PLAYER_JOIN',
    player: { id: 'p2', name: 'Bob', color: '#e74c3c' }
  });

  await delay(200);

  // 3. Check Initial State
  const stateMsg = await p1.waitForMessage(m => m.type === 'GAME_STATE');
  const state = stateMsg.state;
  console.log('✓ Players joined! Active Phase:', state.phase.type);
  console.log('✓ Road face-up cards count:', state.road.face_up.length);
  console.log('✓ Stacks count:', state.road.stacks.length);

  // 4. Player 1 drafts a face-up card from road
  const cardToDraft = state.road.face_up[0];
  console.log(`\n--- Action: Alice drafting face-up card: ${cardToDraft.name} (id: ${cardToDraft.id}) ---`);
  
  p1.send({
    type: 'PLAYER_ACTION',
    action: {
      type: 'draft_face_up',
      playerId: 'p1',
      cardId: cardToDraft.id
    }
  });

  const draftedState = await host.waitForMessage(m => m.type === 'GAME_STATE' && m.state.step > state.step);
  console.log('✓ Draft action accepted! New Step:', draftedState.state.step);
  const p1Updated = draftedState.state.players.find(p => p.id === 'p1');
  console.log('✓ Alice village_square card count:', p1Updated.village_square.length);

  // 4b. Player 1 drafts a face-down card from Stack 0 (testing suit card back draft)
  const initialStack0Count = draftedState.state.road.stacks[0].length;
  const topCardStack0 = draftedState.state.road.stacks[0][0];
  console.log(`\n--- Action: Alice drafting face-down card from Stack 0 (Top card suit: ${topCardStack0 ? topCardStack0.suit : 'N/A'}) ---`);
  
  p1.send({
    type: 'PLAYER_ACTION',
    action: {
      type: 'draft_face_down',
      playerId: 'p1',
      stackIndex: 0
    }
  });

  const draftedStackState = await host.waitForMessage(m => m.type === 'GAME_STATE' && m.state.step > draftedState.state.step);
  console.log('✓ Draft face-down from Stack 0 accepted! New Step:', draftedStackState.state.step);
  const p1AfterStack = draftedStackState.state.players.find(p => p.id === 'p1');
  console.log('✓ Alice village_square card count after stack draft:', p1AfterStack.village_square.length);
  console.log('✓ Stack 0 count went from', initialStack0Count, 'to', draftedStackState.state.road.stacks[0].length);
  if (draftedStackState.state.road.stacks[0].length > 0) {
    console.log('✓ Revealed next card on Stack 0 back suit:', draftedStackState.state.road.stacks[0][0].suit);
  }

  // 5. Test Tabletop Action: Adjust Gold
  console.log('\n--- Tabletop Action: Host adding 5 Gold to Bob ---');
  host.send({
    type: 'TABLETOP_ACTION',
    action: {
      type: 'adjust_gold',
      playerId: 'p2',
      delta: 5
    }
  });

  const goldState = await p2.waitForMessage(m => {
    if (m.type === 'GAME_STATE') {
      const bob = m.state.players.find(p => p.id === 'p2');
      return bob && bob.supply_gold === 13;
    }
    return false;
  });
  console.log('✓ Host Gold adjustment verified! Bob now has 13 Gold 🪙');

  // 6. Test Tabletop Action: Rewind to step 0
  console.log('\n--- Tabletop Action: Host rewinding to Step 0 ---');
  host.send({
    type: 'TABLETOP_ACTION',
    action: {
      type: 'rewind',
      step: 0
    }
  });

  const rewoundState = await host.waitForMessage(m => m.type === 'GAME_STATE' && m.state.step === 0);
  console.log('✓ Rewind to Step 0 successful! Current Step:', rewoundState.state.step);

  // Clean up
  host.close();
  p1.close();
  p2.close();

  console.log('\n=== ALL E2E SIMULATION TESTS PASSED PERFECTLY! ===');
  process.exit(0);
}

runSimulation().catch(err => {
  console.error('Simulation FAILED:', err);
  process.exit(1);
});
