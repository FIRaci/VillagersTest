import gleam/list
import gleam/option.{None, Some}
import gleam/string
import gleeunit
import gleeunit/should
import villagers/chains
import villagers/codec
import villagers/engine
import villagers/models.{type VillagerCard, Grain, Wood}
import villagers/padlock
import villagers/tabletop

pub fn main() {
  gleeunit.main()
}

fn make_card(
  id: String,
  code: String,
  suit: models.Suit,
  gold: Int,
  food: Int,
  builder: Int,
  placed_on: List(String),
  has_padlock: Bool,
  unlocked_by: option.Option(String),
) -> VillagerCard {
  models.VillagerCard(
    id: id,
    code: code,
    name: code,
    suit: suit,
    gold: gold,
    food: food,
    builder: builder,
    silver_formula: None,
    placed_on: placed_on,
    precedes: [],
    has_padlock: has_padlock,
    unlocked_by: unlocked_by,
    unlocks: [],
    primary_image: "assets/cards/" <> id <> ".png",
    coins: 0,
    parent_instance_id: None,
  )
}

pub fn game_init_test() {
  let deck = [
    make_card("c1", "Brewer", Grain, 0, 1, 1, ["Founders"], True, Some("Cooper")),
    make_card("c2", "Poulterer", Grain, 3, 1, 0, ["Founders"], True, Some("Carpenter")),
    make_card("c3", "Swineherd", Grain, 2, 1, 0, ["Founders"], False, None),
    make_card("c4", "Truffler", Grain, 8, 1, 0, ["Swineherd"], True, Some("Hunter")),
    make_card("c5", "Carpenter", Wood, 0, 0, 1, ["Lumberjack"], False, None),
    make_card("c6", "Cartwright", Wood, 9, 0, 0, ["Wheeler"], False, None),
    make_card("c7", "Wheeler", Wood, 3, 0, 0, ["Lumberjack"], False, None),
    make_card("c8", "Cooper", Wood, 4, 0, 0, ["Lumberjack"], False, None),
    make_card("c9", "Mason", Grain, 2, 0, 0, ["Founders"], False, None),
    make_card("c10", "Peddler", Wood, 0, 0, 0, ["Cartwright"], False, None),
    make_card("c11", "Hunter", Grain, 0, 1, 0, ["Founders"], False, None),
    make_card("c12", "Fisherman", Grain, 2, 1, 0, ["Founders"], False, None),
    make_card("c13", "Baker", Grain, 4, 1, 0, ["Miller"], False, None),
    make_card("c14", "Miller", Grain, 2, 1, 0, ["Founders"], False, None),
    make_card("c15", "Shepherd", Grain, 0, 1, 0, ["Founders"], False, None),
    make_card("c16", "Weaver", Grain, 4, 0, 0, ["Shepherd"], False, None),
    make_card("c17", "Tailor", Grain, 6, 0, 0, ["Weaver"], False, None),
    make_card("c18", "Tanner", Grain, 0, 0, 0, ["Founders"], False, None),
    make_card("c19", "Cobbler", Grain, 4, 0, 0, ["Tanner"], False, None),
    make_card("c20", "Saddler", Grain, 5, 0, 0, ["Tanner"], False, None),
    make_card("c21", "Blacksmith", Grain, 2, 0, 1, ["Miner"], False, None),
    make_card("c22", "OreRefiner", Grain, 3, 0, 0, ["Miner"], False, None),
    make_card("c23", "Goldsmith", Grain, 8, 0, 0, ["Blacksmith"], False, None),
    make_card("c24", "Jeweler", Grain, 10, 0, 0, ["Goldsmith"], False, None),
    make_card("c25", "Armorer", Grain, 6, 0, 0, ["Blacksmith"], False, None),
    make_card("c26", "Swordsmith", Grain, 7, 0, 0, ["Blacksmith"], False, None),
    make_card("c27", "Locksmith", Grain, 5, 0, 0, ["Blacksmith"], False, None),
    make_card("c28", "IronMiner", Grain, 3, 0, 0, ["Miner"], False, None),
    make_card("c29", "CopperMiner", Grain, 3, 0, 0, ["Miner"], False, None),
    make_card("c30", "TinMiner", Grain, 3, 0, 0, ["Miner"], False, None),
    make_card("c31", "Glassblower", Grain, 4, 0, 0, ["Miner"], False, None),
    make_card("c32", "Potter", Grain, 3, 0, 0, ["Miner"], False, None),
    make_card("c33", "Bricklayer", Grain, 2, 0, 1, ["Miner"], False, None),
    make_card("c34", "Roofer", Grain, 3, 0, 1, ["Bricklayer"], False, None),
    make_card("c35", "Tiler", Grain, 3, 0, 0, ["Bricklayer"], False, None),
    make_card("c36", "HayMerchant", Grain, 3, 0, 0, ["Hayer"], False, None),
    make_card("c37", "HorseTrader", Grain, 4, 0, 0, ["Hayer"], False, None),
    make_card("c38", "Groom", Grain, 2, 0, 0, ["Hayer"], False, None),
    make_card("c39", "Farrier", Grain, 3, 0, 0, ["Hayer"], False, None),
    make_card("c40", "Stablehand", Grain, 2, 0, 0, ["Hayer"], False, None),
  ]

  let players = [#("p1", "Alice", "#3498db"), #("p2", "Bob", "#e74c3c")]
  let state = engine.init_game(players, deck, 12_345)

  list.length(state.players) |> should.equal(2)
  list.length(state.road.face_up) |> should.equal(6)
  list.length(state.road.stacks) |> should.equal(6)

  // Each player starts with 8 gold
  let assert [p1, ..] = state.players
  p1.supply_gold |> should.equal(8)
  list.length(p1.hand) |> should.equal(5)
  list.length(p1.village) |> should.equal(1)
  let assert [founders] = p1.village
  founders.code |> should.equal("Founders")
}

pub fn chains_validation_test() {
  let founders = make_card("f1", "Founders", Grain, 2, 0, 0, [], False, None)
  let brewer = make_card("b1", "Brewer", Grain, 0, 1, 1, ["Founders"], False, None)
  let cartwright = make_card("cw1", "Cartwright", Wood, 9, 0, 0, ["Wheeler"], False, None)

  // Placing Brewer on Founders -> Ok!
  chains.validate_placement(brewer, Some("f1"), [founders])
  |> should.be_ok

  // Placing Cartwright on Founders -> Error! (Cartwright requires Wheeler)
  chains.validate_placement(cartwright, Some("f1"), [founders])
  |> should.be_error
}

pub fn padlock_test() {
  let player1 =
    models.Player(
      id: "p1",
      name: "Alice",
      color: "#3498db",
      supply_gold: 8,
      hand: [],
      village: [
        make_card("coop1", "Cooper", Wood, 4, 0, 0, ["Lumberjack"], False, None),
      ],
      village_square: [],
      founders_flipped_to_food: False,
      is_connected: True,
    )

  let player2 =
    models.Player(
      id: "p2",
      name: "Bob",
      color: "#e74c3c",
      supply_gold: 8,
      hand: [],
      village: [],
      village_square: [],
      founders_flipped_to_food: False,
      is_connected: True,
    )

  let brewer = make_card("b1", "Brewer", Grain, 0, 1, 1, ["Founders"], True, Some("Cooper"))

  // Player 1 has Cooper in own village -> PaySelf! (0 cost from supply, 2 gold placed from Bank)
  let assert Ok(res1) = padlock.resolve_padlock(brewer, player1, [player1, player2])
  res1.cost_from_supply |> should.equal(0)
  res1.gold_to_place |> should.equal(2)

  // Player 2 does NOT have Cooper, but Player 1 has Cooper -> PayOther! (2 gold from P2's supply to P1's Cooper)
  let assert Ok(res2) = padlock.resolve_padlock(brewer, player2, [player1, player2])
  res2.cost_from_supply |> should.equal(2)
  res2.gold_to_place |> should.equal(2)
}

pub fn rewind_and_shuffle_test() {
  let cards = [
    make_card("1", "A", Grain, 1, 0, 0, [], False, None),
    make_card("2", "B", Grain, 2, 0, 0, [], False, None),
    make_card("3", "C", Grain, 3, 0, 0, [], False, None),
    make_card("4", "D", Grain, 4, 0, 0, [], False, None),
  ]

  // Seeded shuffle test (deterministic)
  let s1 = tabletop.seeded_shuffle(cards, 42)
  let s2 = tabletop.seeded_shuffle(cards, 42)
  s1 |> should.equal(s2)

  // Rewind test
  let base_state =
    models.GameState(
      id: "test",
      step: 1,
      round: 1,
      phase: models.DraftPhase(1, 0, 0),
      first_player_index: 0,
      players: [],
      road: models.RoadState([], [], False, False),
      reserve: [],
      discard: [],
      history: [],
    )

  let next_state =
    models.GameState(..base_state, step: 2, history: [base_state])

  let assert Ok(rewound) = tabletop.rewind(next_state, 1)
  rewound.step |> should.equal(1)
}

pub fn json_serialization_test() {
  let base_state =
    models.GameState(
      id: "test_json",
      step: 1,
      round: 1,
      phase: models.DraftPhase(1, 0, 0),
      first_player_index: 0,
      players: [],
      road: models.RoadState([], [], False, False),
      reserve: [],
      discard: [],
      history: [],
    )

  let json_str = codec.game_state_to_json_string(base_state)
  let len = string.length(json_str)
  { len > 20 } |> should.be_true
}

