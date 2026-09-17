import gleam/int
import gleam/list
import villagers/models.{
  type GameError, type GameState, type VillagerCard, GenericError,
}

// Pseudo-random number generator using Linear Congruential Generator
pub fn lcg_next(seed: Int) -> Int {
  // Common LCG parameters: a = 1103515245, c = 12345, m = 2^31 - 1
  let next = { seed * 1_103_515_245 + 12_345 } % 2_147_483_647
  case next < 0 {
    True -> -next
    False -> next
  }
}

// Seeded Fisher-Yates Shuffle
pub fn seeded_shuffle(
  cards: List(VillagerCard),
  seed: Int,
) -> List(VillagerCard) {
  let len = list.length(cards)
  case len <= 1 {
    True -> cards
    False -> {
      let #(_, shuffled) =
        list.index_fold(cards, #(seed, []), fn(acc, item, idx) {
          let #(current_seed, acc_list) = acc
          let next_s = lcg_next(current_seed)
          let insert_pos = next_s % { idx + 1 }
          let #(left, right) = list.split(acc_list, insert_pos)
          let new_list = list.append(left, [item, ..right])
          #(next_s, new_list)
        })
      shuffled
    }
  }
}

// Deal cards helper
pub fn deal_cards(
  deck: List(VillagerCard),
  count: Int,
) -> #(List(VillagerCard), List(VillagerCard)) {
  let dealt = list.take(deck, count)
  let remaining = list.drop(deck, count)
  #(dealt, remaining)
}

// Rewind to a target step
pub fn rewind(state: GameState, target_step: Int) -> Result(GameState, GameError) {
  case state.step == target_step {
    True -> Ok(state)
    False -> {
      let match_past = list.find(state.history, fn(s) { s.step == target_step })
      case match_past {
        Ok(historical_state) -> Ok(historical_state)
        Error(_) ->
          Error(GenericError(
            "Target step "
            <> int.to_string(target_step)
            <> " not found in game history",
          ))
      }
    }
  }
}

// Undo the last action
pub fn undo(state: GameState) -> Result(GameState, GameError) {
  case state.history {
    [] -> Error(GenericError("No past actions to undo"))
    [prev, ..] -> Ok(prev)
  }
}

// Adjust player gold (Referee tabletop tool)
pub fn adjust_player_gold(
  state: GameState,
  player_id: String,
  delta: Int,
) -> GameState {
  let updated_players =
    list.map(state.players, fn(p) {
      case p.id == player_id {
        True -> {
          let new_gold = case p.supply_gold + delta < 0 {
            True -> 0
            False -> p.supply_gold + delta
          }
          models.Player(..p, supply_gold: new_gold)
        }
        False -> p
      }
    })
  models.GameState(..state, players: updated_players)
}
