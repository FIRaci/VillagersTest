import gleam/option.{type Option}

pub type Suit {
  Grain
  Wood
  Hay
  Ore
  Grapes
  Wool
  Leather
  Solitary
  Special
  Development
  SoloEvent
  UnknownSuit
}

pub fn suit_to_string(suit: Suit) -> String {
  case suit {
    Grain -> "Grain"
    Wood -> "Wood"
    Hay -> "Hay"
    Ore -> "Ore"
    Grapes -> "Grapes"
    Wool -> "Wool"
    Leather -> "Leather"
    Solitary -> "Solitary"
    Special -> "Special"
    Development -> "Development"
    SoloEvent -> "SoloEvent"
    UnknownSuit -> "Unknown"
  }
}

pub fn suit_from_string(str: String) -> Suit {
  case str {
    "Grain" -> Grain
    "Wood" -> Wood
    "Hay" -> Hay
    "Ore" -> Ore
    "Grapes" -> Grapes
    "Wool" -> Wool
    "Leather" -> Leather
    "Solitary" -> Solitary
    "Special" -> Special
    "Development" -> Development
    "SoloEvent" -> SoloEvent
    _ -> UnknownSuit
  }
}

pub type VillagerCard {
  VillagerCard(
    id: String,
    code: String,
    name: String,
    suit: Suit,
    gold: Int,
    food: Int,
    builder: Int,
    silver_formula: Option(String),
    placed_on: List(String),
    precedes: List(String),
    has_padlock: Bool,
    unlocked_by: Option(String),
    unlocks: List(String),
    primary_image: String,
    coins: Int,
    parent_instance_id: Option(String),
  )
}

pub type Player {
  Player(
    id: String,
    name: String,
    color: String,
    supply_gold: Int,
    hand: List(VillagerCard),
    village: List(VillagerCard),
    village_square: List(VillagerCard),
    founders_flipped_to_food: Bool,
    is_connected: Bool,
  )
}

pub type RoadState {
  RoadState(
    face_up: List(VillagerCard),
    stacks: List(List(VillagerCard)),
    first_market_exhausted: Bool,
    second_market_exhausted: Bool,
  )
}

pub type Phase {
  DraftPhase(round: Int, active_player_index: Int, drafted_this_round: Int)
  BuildPhase(
    round: Int,
    active_player_index: Int,
    built_this_round: Int,
    basic_trades_this_round: Int,
  )
  FirstMarketPhase
  SecondMarketPhase
  GameEnded(winner_id: String)
}

pub type PadlockPaymentTarget {
  PayBank
  PaySelf(card_id: String)
  PayOther(player_id: String, card_id: String)
}

pub type TabletopAction {
  Rewind(target_step: Int)
  Undo
  Redo
  ShuffleDeck(deck_target: String, seed: Int)
  DealCard(to_player_id: String, from_deck: String, count: Int)
  MoveCardArbitrary(card_id: String, from_zone: String, to_zone: String)
  AdjustGoldArbitrary(target_player_id: String, delta: Int)
  ForcePhase(new_phase: Phase)
}

pub type PlayerAction {
  DraftFaceUp(player_id: String, card_id: String)
  DraftFaceDown(player_id: String, stack_index: Int)
  BuildVillager(
    player_id: String,
    card_id: String,
    target_parent_id: Option(String),
  )
  TradeBasicVillager(
    player_id: String,
    returned_card_id: String,
    basic_type: String,
  )
  PassTurn(player_id: String)
}

pub type GameAction {
  PlayerAct(PlayerAction)
  TabletopAct(TabletopAction)
}

pub type GameState {
  GameState(
    id: String,
    step: Int,
    round: Int,
    phase: Phase,
    first_player_index: Int,
    players: List(Player),
    road: RoadState,
    reserve: List(VillagerCard),
    discard: List(VillagerCard),
    history: List(GameState),
  )
}

pub type GameError {
  InvalidTurn(message: String)
  CardNotFound(card_id: String)
  InvalidProductionChain(message: String)
  ExceededDraftLimit(current: Int, limit: Int)
  ExceededBuildLimit(current: Int, limit: Int)
  InsufficientGold(current: Int, required: Int)
  PadlockLocked(unlocker: String)
  GenericError(message: String)
}
