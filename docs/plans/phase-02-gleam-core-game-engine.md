---
phase: 2
title: Gleam Core Game Engine
status: completed
priority: P1
effort: 6h
dependencies:
  - phase-01-asset-data-pipeline
---

# Phase 2: Gleam Core Game Engine

## Overview
Xây dựng toàn bộ lõi quy tắc và trạng thái trò chơi Villagers thuần khiết bằng ngôn ngữ Gleam, đảm bảo tính toàn vẹn kiểu dữ liệu (type safety), tính bất biến (immutability), và không có ngoại lệ runtime (zero exceptions).

## Requirements
- Functional:
  - Khai báo đầy đủ các Algebraic Data Types (ADT) đại diện cho: 9 Suits, Card, Player, Road, Village Production Tree, Game Phase (Draft, Build, Market 1, Market 2, Ended).
  - Logic chuỗi sản xuất (Production Chains): kiểm tra tính hợp lệ khi đặt thẻ lên thẻ cha, quy tắc tối đa 2 nhánh rẽ từ thẻ khởi đầu, xác định danh sách các thẻ trên đỉnh (Top Villagers).
  - Logic Ổ khóa (Padlocks): tự động tính toán chi phí 2 Vàng và bên thụ hưởng (Ngân hàng vs Người chơi khác vs Bản thân).
  - Logic Nháp thẻ (Draft Phase): giới hạn nháp `2 + Food` (tối đa 5), tự động gom xu tích lũy trên thẻ vào Supply, cơ chế bổ sung thẻ lên Road sau vòng nháp (luật 3-4 người và luật đấu giá 2 người).
  - Logic Xây dựng (Build Phase): giới hạn đặt thẻ `2 + Builder` (tối đa 5), quyền đổi tối đa 3 Dân làng cơ bản (Lumberjack, Hayer, Miner), kiểm tra lật mặt thẻ Founders (1 Food) nếu không có Food cuối lượt.
  - Logic Chợ (Market 1 & 2): Thuật toán chấm điểm Chợ 1 (Vàng in trên Top card + xu tích lũy) và Chợ 2 (kèm công thức thẻ Bạc - Silver conditions).
- Non-functional:
  - 100% Pure Functional Gleam: Reducer `update(GameState, Action) -> Result(GameState, GameError)`.
  - Không sử dụng mutation, mọi biến đổi trạng thái sinh ra `GameState` mới.
  - Tương thích song song cho cả biên dịch BEAM (Erlang OTP) và JavaScript target (`gleam build --target javascript`).

## Architecture
```
┌────────────────────────────────────────────────────────┐
│                   Gleam Game Engine                    │
├─────────────────┬──────────────────┬───────────────────┤
│  models.gleam   │   chains.gleam   │   padlock.gleam   │
│  - Suit, Card   │   - Placeable?   │   - Payment calc  │
│  - Player, Road │   - Branch tree  │   - Unlock state  │
├─────────────────┼──────────────────┼───────────────────┤
│   draft.gleam   │   build.gleam    │   market.gleam    │
│  - Food limit   │   - Builder lim  │   - Market 1 calc │
│  - Refill road  │   - Basic trade  │   - Market 2 calc │
├─────────────────┴──────────────────┴───────────────────┤
│                      engine.gleam                      │
│            update(GameState, Action) -> Result         │
└────────────────────────────────────────────────────────┘
```

## Related Code Files
- Create: `d:/Test some Game/Villagers/engine/gleam.toml`
- Create: `d:/Test some Game/Villagers/engine/src/villagers/models.gleam`
- Create: `d:/Test some Game/Villagers/engine/src/villagers/chains.gleam`
- Create: `d:/Test some Game/Villagers/engine/src/villagers/padlock.gleam`
- Create: `d:/Test some Game/Villagers/engine/src/villagers/draft.gleam`
- Create: `d:/Test some Game/Villagers/engine/src/villagers/build.gleam`
- Create: `d:/Test some Game/Villagers/engine/src/villagers/market.gleam`
- Create: `d:/Test some Game/Villagers/engine/src/villagers/engine.gleam`
- Create: `d:/Test some Game/Villagers/engine/test/villagers_test.gleam`

## Implementation Steps
1. Cấu hình dự án `engine/gleam.toml` hỗ trợ cả 2 target (JavaScript & Erlang).
2. Định nghĩa hệ thống kiểu dữ liệu mẫu `models.gleam`: `Suit`, `Villager`, `ProductionNode`, `Player`, `Road`, `Phase`, `Action`, `GameError`.
3. Viết module `chains.gleam` giải quyết quan hệ phả hệ thẻ bài và tính toán top-villagers.
4. Viết module `padlock.gleam` phân loại 3 trường hợp mở khóa theo rulebook mục "Padlocks".
5. Viết module `draft.gleam` tính toán số lượng thẻ được nháp và xử lý road update.
6. Viết module `build.gleam` xử lý đặt thẻ, đổi basic villagers và kiểm tra food cuối lượt.
7. Viết module `market.gleam` tính toán điểm số vàng và bạc khi 2 chồng đầu hết (Chợ 1) và khi tất cả chồng hết (Chợ 2).
8. Viết reducer trung tâm `engine.gleam` tích hợp validation và cập nhật state bất biến.
9. Viết bộ unit tests `villagers_test.gleam` kiểm thử toàn bộ các tình huống đặt thẻ phức tạp.

## Success Criteria
- [ ] Lệnh kiểm thử `gleam test` chạy thành công 100% test cases.
- [ ] Chạy đúng chuỗi sản xuất mẫu: Lumberjack -> Wheeler -> Cartwright.
- [ ] Xử lý đúng trường hợp mở khóa Padlock trả tiền cho đối thủ hoặc ngân hàng.
- [ ] Tính toán chính xác điểm Chợ 1 và Chợ 2 (kèm Silver Formula).

## Risk Assessment
- Biểu diễn cây phân nhánh trong ngôn ngữ hàm: Giải quyết bằng cấu trúc dữ liệu đệ quy `ProductionTree(root: Villager, branches: List(ProductionTree))` hoặc mảng phẳng có quan hệ `parent_id`.
- Thời gian chạy trên JS target: Gleam sinh mã JavaScript tối ưu, thời gian thực thi cực nhanh (<1ms mỗi action).
