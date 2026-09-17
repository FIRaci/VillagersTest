import gleam/list
import gleam/option.{type Option, None, Some}
import villagers/chains
import villagers/market
import villagers/models.{
  type GameAction, type GameError, type GameState, type Player,
  type PlayerAction, type RoadState, type TabletopAction, type VillagerCard,
  AdjustGoldArbitrary, BuildPhase, BuildVillager, CardNotFound, DraftFaceDown,
  DraftFaceUp, DraftPhase, ExceededBuildLimit, ExceededDraftLimit, ForcePhase,
  GameEnded, InvalidTurn, PassTurn, PayOther, PlayerAct, Redo, Rewind,
  TabletopAct, Undo,
}
import villagers/padlock
import villagers/tabletop

pub fn init_game(
  players_info: List(#(String, String, String)),
  deck_cards: List(VillagerCard),
  seed: Int,
) -> GameState {
  let num_players = list.length(players_info)
  let cards_per_stack = case num_players {
    2 -> 4
    3 -> 6
    4 -> 8
    _ -> 10
  }

  // Shuffle deck
  let shuffled = tabletop.seeded_shuffle(deck_cards, seed)

  // Deal starting 6 road face-up cards
  let #(starting_road, after_road) = tabletop.deal_cards(shuffled, 6)

  // Deal 6 stacks
  let #(stacks, after_stacks) =
    list.repeat(cards_per_stack, 6)
    |> list.fold(#([], after_road), fn(acc, count) {
      let #(acc_stacks, rem) = acc
      let #(stack_cards, new_rem) = tabletop.deal_cards(rem, count)
      #(list.append(acc_stacks, [stack_cards]), new_rem)
    })

  // Deal 5 cards each to players and initialize players
  let #(players, remaining_reserve) =
    list.fold(players_info, #([], after_stacks), fn(acc, info) {
      let #(acc_players, rem) = acc
      let #(pid, pname, pcolor) = info
      let #(hand, new_rem) = tabletop.deal_cards(rem, 5)

      let founders_card =
        models.VillagerCard(
          id: pid <> "_founders",
          code: "Founders",
          name: "Founders",
          suit: models.Grain,
          gold: 2,
          food: 0,
          builder: 0,
          silver_formula: None,
          placed_on: [],
          precedes: [],
          has_padlock: False,
          unlocked_by: None,
          unlocks: [],
          primary_image: "assets/cards/1f1_1.png",
          coins: 0,
          parent_instance_id: None,
        )

      let p =
        models.Player(
          id: pid,
          name: pname,
          color: pcolor,
          supply_gold: 8,
          hand: hand,
          village: [founders_card],
          village_square: [],
          founders_flipped_to_food: False,
          is_connected: True,
        )
      #(list.append(acc_players, [p]), new_rem)
    })

  models.GameState(
    id: "game_1",
    step: 0,
    round: 1,
    phase: DraftPhase(round: 1, active_player_index: 0, drafted_this_round: 0),
    first_player_index: 0,
    players: players,
    road: models.RoadState(
      face_up: starting_road,
      stacks: stacks,
      first_market_exhausted: False,
      second_market_exhausted: False,
    ),
    reserve: remaining_reserve,
    discard: [],
    history: [],
  )
}

fn save_history(state: GameState) -> List(GameState) {
  let clean_state = models.GameState(..state, history: [])
  let updated_hist = [clean_state, ..state.history]
  list.take(updated_hist, 100)
}

pub fn apply_action(
  state: GameState,
  action: GameAction,
) -> Result(GameState, GameError) {
  case action {
    TabletopAct(table_act) -> apply_tabletop_action(state, table_act)
    PlayerAct(player_act) -> {
      let history_snapshot = save_history(state)
      case apply_player_action(state, player_act) {
        Ok(new_state) ->
          Ok(
            models.GameState(
              ..new_state,
              step: state.step + 1,
              history: history_snapshot,
            ),
          )
        Error(err) -> Error(err)
      }
    }
  }
}

fn apply_tabletop_action(
  state: GameState,
  action: TabletopAction,
) -> Result(GameState, GameError) {
  case action {
    Rewind(step) -> tabletop.rewind(state, step)
    Undo -> tabletop.undo(state)
    Redo -> Ok(state)
    AdjustGoldArbitrary(pid, delta) ->
      Ok(tabletop.adjust_player_gold(state, pid, delta))
    ForcePhase(new_phase) ->
      Ok(models.GameState(..state, phase: new_phase))
    _ -> Ok(state)
  }
}

fn apply_player_action(
  state: GameState,
  action: PlayerAction,
) -> Result(GameState, GameError) {
  case state.phase {
    DraftPhase(round, active_idx, drafted) ->
      handle_draft_action(state, action, round, active_idx, drafted)
    BuildPhase(round, active_idx, built, trades) ->
      handle_build_action(state, action, round, active_idx, built, trades)
    _ -> Error(InvalidTurn("Game is not in an interactive player phase"))
  }
}

fn handle_draft_action(
  state: GameState,
  action: PlayerAction,
  round: Int,
  active_idx: Int,
  drafted: Int,
) -> Result(GameState, GameError) {
  let active_player = case list.drop(state.players, active_idx) {
    [p, ..] -> p
    [] -> panic as "Active player index out of bounds"
  }

  let draft_limit = chains.calculate_food_limit(active_player)

  case action {
    DraftFaceUp(pid, cid) -> {
      case pid == active_player.id {
        False -> Error(InvalidTurn("Not your turn to draft"))
        True -> {
          case drafted >= draft_limit {
            True -> Error(ExceededDraftLimit(drafted, draft_limit))
            False -> {
              case list.find(state.road.face_up, fn(c) { c.id == cid }) {
                Error(_) -> Error(CardNotFound(cid))
                Ok(chosen_card) -> {
                  // Collect coin on card into player's supply
                  let coin_bonus = chosen_card.coins
                  let updated_player =
                    models.Player(
                      ..active_player,
                      supply_gold: active_player.supply_gold + coin_bonus,
                      village_square: [
                        models.VillagerCard(..chosen_card, coins: 0),
                        ..active_player.village_square
                      ],
                    )

                  // Remove card from road and refill
                  let #(new_road_face_up, new_road_stacks, new_reserve) =
                    refill_road_slot(state.road, chosen_card.id, state.reserve)

                  let new_players =
                    list.map(state.players, fn(p) {
                      case p.id == active_player.id {
                        True -> updated_player
                        False -> p
                      }
                    })

                  let new_drafted = drafted + 1
                  let next_state =
                    models.GameState(
                      ..state,
                      players: new_players,
                      road: models.RoadState(
                        ..state.road,
                        face_up: new_road_face_up,
                        stacks: new_road_stacks,
                      ),
                      reserve: new_reserve,
                    )

                  advance_draft_turn(
                    next_state,
                    round,
                    active_idx,
                    new_drafted,
                    draft_limit,
                  )
                }
              }
            }
          }
        }
      }
    }
    DraftFaceDown(pid, stack_idx) -> {
      case pid == active_player.id {
        False -> Error(InvalidTurn("Not your turn to draft"))
        True -> {
          case drafted >= draft_limit {
            True -> Error(ExceededDraftLimit(drafted, draft_limit))
            False -> {
              let num_stacks = list.length(state.road.stacks)
              case stack_idx >= 0 && stack_idx < num_stacks {
                False -> Error(InvalidTurn("Invalid stack index"))
                True -> {
                  case list.drop(state.road.stacks, stack_idx) {
                    [[top_card, ..rest_cards], ..] -> {
                      let updated_player =
                        models.Player(
                          ..active_player,
                          village_square: [
                            models.VillagerCard(..top_card, coins: 0),
                            ..active_player.village_square,
                          ],
                        )

                      let updated_stacks =
                        list.index_map(state.road.stacks, fn(stack, i) {
                          case i == stack_idx {
                            True -> rest_cards
                            False -> stack
                          }
                        })

                      let new_players =
                        list.map(state.players, fn(p) {
                          case p.id == active_player.id {
                            True -> updated_player
                            False -> p
                          }
                        })

                      let new_drafted = drafted + 1
                      let next_state =
                        models.GameState(
                          ..state,
                          players: new_players,
                          road: models.RoadState(
                            ..state.road,
                            stacks: updated_stacks,
                          ),
                        )

                      advance_draft_turn(
                        next_state,
                        round,
                        active_idx,
                        new_drafted,
                        draft_limit,
                      )
                    }
                    _ -> Error(CardNotFound("Stack is empty"))
                  }
                }
              }
            }
          }
        }
      }
    }
    PassTurn(pid) -> {
      case pid == active_player.id {
        False -> Error(InvalidTurn("Not your turn to pass"))
        True ->
          // Force advance to next player or build phase
          advance_draft_turn(state, round, active_idx, draft_limit, draft_limit)
      }
    }
    _ -> Error(InvalidTurn("Only draft actions allowed during Draft Phase"))
  }
}

fn advance_draft_turn(
  state: GameState,
  round: Int,
  active_idx: Int,
  current_drafted: Int,
  draft_limit: Int,
) -> Result(GameState, GameError) {
  let num_players = list.length(state.players)

  case current_drafted >= draft_limit {
    False ->
      // Same player still drafting
      Ok(
        models.GameState(
          ..state,
          phase: DraftPhase(round, active_idx, current_drafted),
        ),
      )
    True -> {
      // Current player finished drafting!
      let next_idx = active_idx + 1
      case next_idx >= num_players {
        False ->
          // Next player's turn to draft
          Ok(models.GameState(..state, phase: DraftPhase(round, next_idx, 0)))
        True -> {
          // All players finished drafting! Move to Build Phase!
          // 1. Move all cards in village_square to hand
          let players_with_hands =
            list.map(state.players, fn(p) {
              models.Player(
                ..p,
                hand: list.append(p.hand, p.village_square),
                village_square: [],
              )
            })

          // 2. Put 1 Gold coin on each remaining face-up card on the road
          let road_with_coins =
            list.map(state.road.face_up, fn(c) {
              models.VillagerCard(..c, coins: c.coins + 1)
            })

          Ok(
            models.GameState(
              ..state,
              players: players_with_hands,
              road: models.RoadState(..state.road, face_up: road_with_coins),
              phase: BuildPhase(
                round: round,
                active_player_index: state.first_player_index,
                built_this_round: 0,
                basic_trades_this_round: 0,
              ),
            ),
          )
        }
      }
    }
  }
}

fn handle_build_action(
  state: GameState,
  action: PlayerAction,
  round: Int,
  active_idx: Int,
  built: Int,
  trades: Int,
) -> Result(GameState, GameError) {
  let active_player = case list.drop(state.players, active_idx) {
    [p, ..] -> p
    [] -> panic as "Active player index out of bounds"
  }

  let build_limit = chains.calculate_build_limit(active_player)

  case action {
    BuildVillager(pid, cid, parent_opt) -> {
      case pid == active_player.id {
        False -> Error(InvalidTurn("Not your turn to build"))
        True -> {
          case built >= build_limit {
            True -> Error(ExceededBuildLimit(built, build_limit))
            False -> {
              case list.find(active_player.hand, fn(c) { c.id == cid }) {
                Error(_) -> Error(CardNotFound(cid))
                Ok(card_to_build) -> {
                  // Validate chain
                  case
                    chains.validate_placement(
                      card_to_build,
                      parent_opt,
                      active_player.village,
                    )
                  {
                    Error(err) -> Error(err)
                    Ok(Nil) -> {
                      // Validate and resolve padlock
                      case
                        padlock.resolve_padlock(
                          card_to_build,
                          active_player,
                          state.players,
                        )
                      {
                        Error(err) -> Error(err)
                        Ok(resolution) -> {
                          // Deduct cost and place card
                          let card_with_parent =
                            models.VillagerCard(
                              ..card_to_build,
                              parent_instance_id: parent_opt,
                            )

                          let updated_active_player =
                            models.Player(
                              ..active_player,
                              supply_gold: active_player.supply_gold
                              - resolution.cost_from_supply,
                              hand: list.filter(active_player.hand, fn(c) {
                                c.id != cid
                              }),
                              village: list.append(active_player.village, [
                                card_with_parent,
                              ]),
                            )

                          // Update all players (e.g. if padlock paid to opponent or self)
                          let updated_players =
                            list.map(state.players, fn(p) {
                              case p.id == active_player.id {
                                True -> updated_active_player
                                False -> {
                                  case resolution.target {
                                    PayOther(target_pid, target_cid) if target_pid == p.id -> {
                                      let new_village =
                                        list.map(p.village, fn(vc) {
                                          case vc.id == target_cid {
                                            True ->
                                              models.VillagerCard(
                                                ..vc,
                                                coins: vc.coins
                                                + resolution.gold_to_place,
                                              )
                                            False -> vc
                                          }
                                        })
                                      models.Player(..p, village: new_village)
                                    }
                                    _ -> p
                                  }
                                }
                              }
                            })

                          Ok(
                            models.GameState(
                              ..state,
                              players: updated_players,
                              phase: BuildPhase(
                                round,
                                active_idx,
                                built + 1,
                                trades,
                              ),
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
        }
      }
    }
    PassTurn(pid) -> {
      case pid == active_player.id {
        False -> Error(InvalidTurn("Not your turn to pass"))
        True -> advance_build_turn(state, round, active_idx)
      }
    }
    _ -> Error(InvalidTurn("Action not allowed in Build Phase"))
  }
}

fn advance_build_turn(
  state: GameState,
  round: Int,
  active_idx: Int,
) -> Result(GameState, GameError) {
  let num_players = list.length(state.players)
  let next_idx = active_idx + 1

  case next_idx >= num_players {
    False ->
      // Next player's turn to build
      Ok(
        models.GameState(
          ..state,
          phase: BuildPhase(
            round: round,
            active_player_index: next_idx,
            built_this_round: 0,
            basic_trades_this_round: 0,
          ),
        ),
      )
    True -> {
      // All players finished building this round!
      // 1. Check founders flip for players with 0 Food
      let updated_players =
        list.map(state.players, fn(p) {
          let has_food =
            list.any(chains.get_top_villagers(p.village), fn(c) { c.food > 0 })
          case has_food || p.founders_flipped_to_food {
            True -> p
            False -> models.Player(..p, founders_flipped_to_food: True)
          }
        })

      // 2. Check Market triggers
      let empty_stacks_count = list.count(state.road.stacks, list.is_empty)

      case empty_stacks_count >= 6 && !state.road.second_market_exhausted {
        True ->
          // Trigger Market 2 and End Game
          trigger_second_market(state, updated_players)
        False -> {
          case empty_stacks_count >= 2 && !state.road.first_market_exhausted {
            True ->
              // Trigger Market 1
              trigger_first_market(state, updated_players, round)
            False -> {
              // Standard next round: shift first player to the left
              let next_first = { state.first_player_index + 1 } % num_players
              Ok(
                models.GameState(
                  ..state,
                  players: updated_players,
                  round: round + 1,
                  first_player_index: next_first,
                  phase: DraftPhase(
                    round: round + 1,
                    active_player_index: next_first,
                    drafted_this_round: 0,
                  ),
                ),
              )
            }
          }
        }
      }
    }
  }
}

fn trigger_first_market(
  state: GameState,
  players: List(Player),
  round: Int,
) -> Result(GameState, GameError) {
  let num_players = list.length(players)
  let scored_players =
    list.map(players, fn(p) {
      let score = market.evaluate_first_market(p)
      models.Player(..p, supply_gold: p.supply_gold + score.total_gained)
    })

  let next_first = { state.first_player_index + 1 } % num_players
  Ok(
    models.GameState(
      ..state,
      players: scored_players,
      road: models.RoadState(..state.road, first_market_exhausted: True),
      round: round + 1,
      first_player_index: next_first,
      phase: DraftPhase(
        round: round + 1,
        active_player_index: next_first,
        drafted_this_round: 0,
      ),
    ),
  )
}

fn trigger_second_market(
  state: GameState,
  players: List(Player),
) -> Result(GameState, GameError) {
  let scored_players =
    list.map(players, fn(p) {
      let score = market.evaluate_second_market(p)
      models.Player(..p, supply_gold: p.supply_gold + score.total_gained)
    })

  let winner = market.determine_winner(scored_players)

  Ok(
    models.GameState(
      ..state,
      players: scored_players,
      road: models.RoadState(..state.road, second_market_exhausted: True),
      phase: GameEnded(winner_id: winner),
    ),
  )
}

fn refill_road_slot(
  road: RoadState,
  taken_card_id: String,
  reserve: List(VillagerCard),
) -> #(List(VillagerCard), List(List(VillagerCard)), List(VillagerCard)) {
  // Try to take from leftmost non-empty stack
  let #(refill_card, new_stacks, new_reserve) =
    take_top_card_from_stacks(road.stacks, reserve)

  let new_face_up =
    list.map(road.face_up, fn(c) {
      case c.id == taken_card_id {
        True ->
          case refill_card {
            Some(rc) -> rc
            None -> c
          }
        False -> c
      }
    })
    |> list.filter(fn(c) { c.id != taken_card_id || refill_card != None })

  #(new_face_up, new_stacks, new_reserve)
}

fn take_top_card_from_stacks(
  stacks: List(List(VillagerCard)),
  reserve: List(VillagerCard),
) -> #(Option(VillagerCard), List(List(VillagerCard)), List(VillagerCard)) {
  let found =
    list.fold(stacks, #(None, []), fn(acc, stack) {
      let #(card_opt, processed) = acc
      case card_opt {
        Some(_) -> #(card_opt, list.append(processed, [stack]))
        None ->
          case stack {
            [] -> #(None, list.append(processed, [[]]))
            [top, ..rest] -> #(Some(top), list.append(processed, [rest]))
          }
      }
    })

  case found.0 {
    Some(c) -> #(Some(c), found.1, reserve)
    None ->
      case reserve {
        [top_res, ..rest_res] -> #(Some(top_res), stacks, rest_res)
        [] -> #(None, stacks, [])
      }
  }
}
