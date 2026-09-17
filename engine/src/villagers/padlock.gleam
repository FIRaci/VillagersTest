import gleam/list
import gleam/option.{None, Some}
import villagers/models.{
  type GameError, type PadlockPaymentTarget, type Player, type VillagerCard,
  InsufficientGold, PayBank, PayOther, PaySelf,
}

pub type PadlockResolution {
  PadlockResolution(
    target: PadlockPaymentTarget,
    cost_from_supply: Int,
    gold_to_place: Int,
  )
}

pub fn resolve_padlock(
  card: VillagerCard,
  active_player: Player,
  all_players: List(Player),
) -> Result(PadlockResolution, GameError) {
  case card.has_padlock, card.unlocked_by {
    False, _ | _, None ->
      Ok(PadlockResolution(target: PayBank, cost_from_supply: 0, gold_to_place: 0))

    True, Some(unlocker_name) -> {
      // 1. Check if active player has unlocker in own village
      let self_card =
        list.find(active_player.village, fn(c) { c.code == unlocker_name })

      case self_card {
        Ok(found_card) ->
          // Self has unlocker: Take 2 Gold from Bank onto own card!
          Ok(
            PadlockResolution(
              target: PaySelf(found_card.id),
              cost_from_supply: 0,
              gold_to_place: 2,
            ),
          )

        Error(_) -> {
          // Check if player has at least 2 gold in supply to pay
          case active_player.supply_gold < 2 {
            True -> Error(InsufficientGold(active_player.supply_gold, 2))
            False -> {
              // 2. Check other players
              let other_match =
                list.find_map(all_players, fn(p) {
                  case p.id == active_player.id {
                    True -> Error(Nil)
                    False -> {
                      case list.find(p.village, fn(c) { c.code == unlocker_name }) {
                        Ok(target_c) -> Ok(#(p.id, target_c.id))
                        Error(_) -> Error(Nil)
                      }
                    }
                  }
                })

              case other_match {
                Ok(#(other_pid, other_cid)) ->
                  // Opponent has unlocker: Pay 2 Gold from supply onto opponent's card!
                  Ok(
                    PadlockResolution(
                      target: PayOther(other_pid, other_cid),
                      cost_from_supply: 2,
                      gold_to_place: 2,
                    ),
                  )

                Error(_) ->
                  // Nobody has unlocker: Pay 2 Gold from supply to Bank!
                  Ok(
                    PadlockResolution(
                      target: PayBank,
                      cost_from_supply: 2,
                      gold_to_place: 0,
                    ),
                  )
              }
            }
          }
        }
      }
    }
  }
}
