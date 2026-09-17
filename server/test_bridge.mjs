import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const preludePath = path.resolve(__dirname, '../engine/build/dev/javascript/prelude.mjs');
const enginePath = path.resolve(__dirname, '../engine/build/dev/javascript/engine/villagers/engine.mjs');
const modelsPath = path.resolve(__dirname, '../engine/build/dev/javascript/engine/villagers/models.mjs');
const codecPath = path.resolve(__dirname, '../engine/build/dev/javascript/engine/villagers/codec.mjs');
const optionPath = path.resolve(__dirname, '../engine/build/dev/javascript/gleam_stdlib/gleam/option.mjs');

const { toList } = await import('file://' + preludePath.replace(/\\/g, '/'));
const engine = await import('file://' + enginePath.replace(/\\/g, '/'));
const models = await import('file://' + modelsPath.replace(/\\/g, '/'));
const codec = await import('file://' + codecPath.replace(/\\/g, '/'));
const { Some, None } = await import('file://' + optionPath.replace(/\\/g, '/'));

console.log('Gleam modules & stdlib loaded successfully!');

// Load cards.json
const cardsJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/cards.json'), 'utf8'));

// Convert cards into Gleam VillagerCard format
const gleamCards = [];
for (const c of cardsJson) {
  for (let i = 0; i < c.deck_count; i++) {
    const suitVal = models.suit_from_string(c.suit);
    const card = new models.VillagerCard(
      `${c.id}_${i+1}`,
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
console.log('Constructed', gleamCards.length, 'total cards for deck');

// Test init_game with 2 players
const playersInfo = toList([
  ['p1', 'Alice', '#3498db'],
  ['p2', 'Bob', '#e74c3c']
]);

const state = engine.init_game(playersInfo, toList(gleamCards), 12345);
console.log('Initialized game state: Round =', state.round, ', Step =', state.step);

const jsonStr = codec.game_state_to_json_string(state);
const parsed = JSON.parse(jsonStr);
console.log('Parsed JSON state from Gleam codec:');
console.log(' - Phase:', parsed.phase.type);
console.log(' - Road face-up cards:', parsed.road.face_up.length);
console.log(' - Player 1 Hand count:', parsed.players[0].hand.length);
console.log(' - Player 1 Gold:', parsed.players[0].supply_gold);
console.log('Bridge test SUCCESSFUL!');
