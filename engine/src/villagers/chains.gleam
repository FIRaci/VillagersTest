import gleam/list
import gleam/option.{type Option, None, Some}
import villagers/models.{
  type GameError, type Player, type VillagerCard, InvalidProductionChain,
  Solitary, Special,
}

pub fn is_starter_card(code: String) -> Bool {
  code == "Founders"
  || code == "Lumberjack"
  || code == "Hayer"
  || code == "Miner"
}

pub fn count_children(
  village: List(VillagerCard),
  parent_instance_id: String,
) -> Int {
  list.count(village, fn(card) {
    card.parent_instance_id == Some(parent_instance_id)
  })
}

pub fn is_top_villager(
  village: List(VillagerCard),
  card: VillagerCard,
) -> Bool {
  count_children(village, card.id) == 0
}

pub fn get_top_villagers(village: List(VillagerCard)) -> List(VillagerCard) {
  list.filter(village, fn(c) { is_top_villager(village, c) })
}

pub fn calculate_food_limit(player: Player) -> Int {
  let base = 2
  let food_from_top =
    get_top_villagers(player.village)
    |> list.fold(0, fn(acc, c) { acc + c.food })
  let founders_food = case player.founders_flipped_to_food {
    True -> 1
    False -> 0
  }
  let total = base + food_from_top + founders_food
  case total > 5 {
    True -> 5
    False -> total
  }
}

pub fn calculate_build_limit(player: Player) -> Int {
  let base = 2
  let builder_from_top =
    get_top_villagers(player.village)
    |> list.fold(0, fn(acc, c) { acc + c.builder })
  let total = base + builder_from_top
  case total > 5 {
    True -> 5
    False -> total
  }
}

pub fn validate_placement(
  card: VillagerCard,
  target_parent_id: Option(String),
  village: List(VillagerCard),
) -> Result(Nil, GameError) {
  case card.suit {
    Solitary | Special ->
      case target_parent_id {
        None -> Ok(Nil)
        Some(_) ->
          Error(InvalidProductionChain(
            "Solitary / Special villagers cannot be placed on top of other cards",
          ))
      }
    _ -> {
      case card.placed_on {
        [] ->
          case target_parent_id {
            None -> Ok(Nil)
            Some(_) ->
              Error(InvalidProductionChain(
                "This card does not require a parent card",
              ))
          }
        required_parents -> {
          case target_parent_id {
            None ->
              Error(InvalidProductionChain(
                "This card must be placed on: "
                <> list.fold(required_parents, "", fn(acc, p) { acc <> " " <> p }),
              ))
            Some(pid) -> {
              case list.find(village, fn(c) { c.id == pid }) {
                Error(_) ->
                  Error(InvalidProductionChain(
                    "Target parent card does not exist in your Village",
                  ))
                Ok(parent_card) -> {
                  let matches_parent =
                    list.contains(required_parents, parent_card.code)
                  case matches_parent {
                    False ->
                      Error(InvalidProductionChain(
                        "Parent "
                        <> parent_card.name
                        <> " is not a valid parent for "
                        <> card.name,
                      ))
                    True -> {
                      let current_children = count_children(village, parent_card.id)
                      let max_allowed = case is_starter_card(parent_card.code) {
                        True -> 2
                        False -> 1
                      }
                      case current_children >= max_allowed {
                        True ->
                          Error(InvalidProductionChain(
                            "Parent card "
                            <> parent_card.name
                            <> " already has max children ("
                            <> "limit: "
                            <> case max_allowed {
                              1 -> "1"
                              _ -> "2"
                            }
                            <> ")",
                          ))
                        False -> Ok(Nil)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
