import gleam/int
import gleam/list
import gleam/option.{None, Some}
import gleam/order
import villagers/chains
import villagers/models.{type Player}

pub type MarketScoreDetail {
  MarketScoreDetail(
    player_id: String,
    printed_gold: Int,
    coin_gold: Int,
    silver_gold: Int,
    total_gained: Int,
  )
}

pub fn evaluate_first_market(player: Player) -> MarketScoreDetail {
  let top_cards = chains.get_top_villagers(player.village)
  let printed_gold = list.fold(top_cards, 0, fn(acc, c) { acc + c.gold })
  let coin_gold = list.fold(player.village, 0, fn(acc, c) { acc + c.coins })

  MarketScoreDetail(
    player_id: player.id,
    printed_gold: printed_gold,
    coin_gold: coin_gold,
    silver_gold: 0,
    total_gained: printed_gold + coin_gold,
  )
}

pub fn evaluate_silver_bonus(player: Player) -> Int {
  let top_cards = chains.get_top_villagers(player.village)
  let total_food = chains.calculate_food_limit(player) - 2
  let total_builders = chains.calculate_builder_limit(player) - 2
  let total_padlocks = list.count(player.village, fn(c) { c.has_padlock })
  let total_printed_gold_top = list.fold(top_cards, 0, fn(acc, c) { acc + c.gold })

  list.fold(player.village, 0, fn(acc, card) {
    case card.silver_formula {
      None -> acc
      Some(_) -> {
        case card.code {
          "LogRafter" -> {
            let wood_symbols = list.count(player.village, fn(c) { c.suit == models.Wood }) + 1
            acc + wood_symbols
          }
          "WoodCarver" -> {
            let wood_gold = list.fold(top_cards, 0, fn(w_acc, c) {
              case c.suit == models.Wood {
                True -> w_acc + c.gold
                False -> w_acc
              }
            })
            acc + wood_gold
          }
          "HorseTrader" -> {
            let hay_symbols = list.count(player.village, fn(c) { c.suit == models.Hay }) + 1
            acc + { hay_symbols / 2 } * 3
          }
          "OreMuler" -> {
            let ore_symbols = list.count(player.village, fn(c) { c.suit == models.Ore }) + 1
            acc + { ore_symbols / 2 } * 3
          }
          "Peddler" -> acc + { total_printed_gold_top / 2 } * 3
          "Locksmith" -> acc + total_padlocks * 2
          "Freemason" -> acc + total_builders * 3
          "Grocer" -> acc + total_food * 3
          "Priest" -> {
            let solitary_symbols = list.count(player.village, fn(c) { c.suit == models.Solitary })
            acc + { solitary_symbols / 2 } * 3
          }
          "Agent" -> {
            let max_coin = list.fold(player.village, 0, fn(m_acc, c) {
              case c.coins > m_acc {
                True -> c.coins
                False -> m_acc
              }
            })
            acc + max_coin
          }
          _ -> acc + 2
        }
      }
    }
  })
}

pub fn evaluate_second_market(player: Player) -> MarketScoreDetail {
  let top_cards = chains.get_top_villagers(player.village)
  let printed_gold = list.fold(top_cards, 0, fn(acc, c) { acc + c.gold })
  let coin_gold = list.fold(player.village, 0, fn(acc, c) { acc + c.coins })
  let silver_gold = evaluate_silver_bonus(player)

  MarketScoreDetail(
    player_id: player.id,
    printed_gold: printed_gold,
    coin_gold: coin_gold,
    silver_gold: silver_gold,
    total_gained: printed_gold + coin_gold + silver_gold,
  )
}

pub fn determine_winner(players: List(Player)) -> String {
  case players {
    [] -> ""
    [single] -> single.id
    _ -> {
      let sorted =
        list.sort(players, fn(a, b) {
          case int.compare(b.supply_gold, a.supply_gold) {
            order.Eq ->
              int.compare(list.length(a.village), list.length(b.village))
            other -> other
          }
        })
      case list.first(sorted) {
        Ok(winner) -> winner.id
        Error(_) -> ""
      }
    }
  }
}
