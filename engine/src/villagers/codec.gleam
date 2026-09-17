import gleam/json
import gleam/list
import gleam/option.{None, Some}
import villagers/models.{
  type GameState, type Phase, type Player, type RoadState, type VillagerCard,
  BuildPhase, DraftPhase, FirstMarketPhase, GameEnded, SecondMarketPhase,
}

pub fn card_to_json(card: VillagerCard) -> json.Json {
  json.object([
    #("id", json.string(card.id)),
    #("code", json.string(card.code)),
    #("name", json.string(card.name)),
    #("suit", json.string(models.suit_to_string(card.suit))),
    #("gold", json.int(card.gold)),
    #("food", json.int(card.food)),
    #("builder", json.int(card.builder)),
    #(
      "silver_formula",
      case card.silver_formula {
        Some(s) -> json.string(s)
        None -> json.null()
      },
    ),
    #("placed_on", json.array(card.placed_on, json.string)),
    #("precedes", json.array(card.precedes, json.string)),
    #("has_padlock", json.bool(card.has_padlock)),
    #(
      "unlocked_by",
      case card.unlocked_by {
        Some(u) -> json.string(u)
        None -> json.null()
      },
    ),
    #("unlocks", json.array(card.unlocks, json.string)),
    #("primary_image", json.string(card.primary_image)),
    #("coins", json.int(card.coins)),
    #(
      "parent_instance_id",
      case card.parent_instance_id {
        Some(p) -> json.string(p)
        None -> json.null()
      },
    ),
  ])
}

pub fn player_to_json(player: Player) -> json.Json {
  json.object([
    #("id", json.string(player.id)),
    #("name", json.string(player.name)),
    #("color", json.string(player.color)),
    #("supply_gold", json.int(player.supply_gold)),
    #("hand", json.array(player.hand, card_to_json)),
    #("village", json.array(player.village, card_to_json)),
    #("village_square", json.array(player.village_square, card_to_json)),
    #("founders_flipped_to_food", json.bool(player.founders_flipped_to_food)),
    #("is_connected", json.bool(player.is_connected)),
  ])
}

pub fn phase_to_json(phase: Phase) -> json.Json {
  case phase {
    DraftPhase(round, active_idx, drafted) ->
      json.object([
        #("type", json.string("draft")),
        #("round", json.int(round)),
        #("active_player_index", json.int(active_idx)),
        #("drafted_this_round", json.int(drafted)),
      ])
    BuildPhase(round, active_idx, built, trades) ->
      json.object([
        #("type", json.string("build")),
        #("round", json.int(round)),
        #("active_player_index", json.int(active_idx)),
        #("built_this_round", json.int(built)),
        #("basic_trades_this_round", json.int(trades)),
      ])
    FirstMarketPhase ->
      json.object([#("type", json.string("first_market"))])
    SecondMarketPhase ->
      json.object([#("type", json.string("second_market"))])
    GameEnded(winner_id) ->
      json.object([
        #("type", json.string("ended")),
        #("winner_id", json.string(winner_id)),
      ])
  }
}

pub fn road_to_json(road: RoadState) -> json.Json {
  json.object([
    #("face_up", json.array(road.face_up, card_to_json)),
    #(
      "stacks",
      json.array(road.stacks, fn(stack) { json.array(stack, card_to_json) }),
    ),
    #("first_market_exhausted", json.bool(road.first_market_exhausted)),
    #("second_market_exhausted", json.bool(road.second_market_exhausted)),
  ])
}

pub fn game_state_to_json(state: GameState) -> json.Json {
  json.object([
    #("id", json.string(state.id)),
    #("step", json.int(state.step)),
    #("round", json.int(state.round)),
    #("phase", phase_to_json(state.phase)),
    #("first_player_index", json.int(state.first_player_index)),
    #("players", json.array(state.players, player_to_json)),
    #("road", road_to_json(state.road)),
    #("reserve_count", json.int(list.length(state.reserve))),
    #("discard_count", json.int(list.length(state.discard))),
    #("history_length", json.int(list.length(state.history))),
  ])
}

pub fn game_state_to_json_string(state: GameState) -> String {
  json.to_string(game_state_to_json(state))
}
