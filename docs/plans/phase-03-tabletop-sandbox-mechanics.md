---
phase: 3
title: Tabletop Sandbox Mechanics
status: completed
priority: P1
effort: 4h
dependencies:
  - phase-02-gleam-core-game-engine
---

# Phase 3: Tabletop Sandbox Mechanics

## Overview
Hiện thực hóa đầy đủ các cơ chế thao tác mô phỏng bàn cờ vật lý (Tabletop Simulator) bằng Gleam: Rewind / Time Travel (quay ngược thời gian bất kỳ bước nào), Tráo bài Seeded Shuffle, Chia bài linh hoạt (Deal), và các công cụ can thiệp trọng tài (Arbitrator overrides).

## Requirements
- Functional:
  - **Cơ chế Rewind (Tua lại)**:
    - Lưu lại toàn bộ lịch sử biến đổi của trận đấu dưới dạng snapshot `history: List(GameState)`.
    - Hàm `rewind(state: GameState, target_step: Int) -> GameState`: Tua lùi hoặc tiến tới bất kỳ thời điểm nào trong trận đấu.
    - Hàm `undo(state)`: Hủy thao tác vừa thực hiện.
    - Hàm `redo(state)`: Khôi phục thao tác đã hủy.
  - **Cơ chế Tráo bài (Seeded Shuffle)**:
    - Thuật toán Fisher-Yates thuần túy trong Gleam sử dụng PRNG với seed nguyên số (`seed: Int`), đảm bảo tính xác định và có thể tái lập (replayable).
    - Hỗ trợ tráo riêng biệt: Tráo chồng Dự trữ (Reserve), tráo 1 trong 6 chồng trên Road, tráo chồng bài bỏ (Discard).
  - **Cơ chế Chia bài (Deal)**:
    - Chia 5 lá khởi đầu cho mỗi người chơi.
    - Chia bù bài lên Road từ Reserve khi bắt đầu hoặc sau vòng nháp.
    - Chia thủ công (Manual Deal): Cho phép Host chia N lá bài từ bất kỳ chồng nào trực tiếp vào tay người chơi được chọn.
  - **Công cụ trọng tài Tabletop (Host Arbitrator Powers)**:
    - Di chuyển thẻ bài tự do giữa các khu vực: Road <-> Hand <-> Village <-> Reserve <-> Discard.
    - Thêm / bớt Vàng trực tiếp trên bất kỳ thẻ bài nào hoặc trong kho tiền của người chơi.
    - Lật úp / lật ngửa thẻ bài (Flip card).
    - Chuyển giao thẻ Người chơi đầu tiên (First Player marker).
    - Ép chuyển đổi giai đoạn (Force Phase Jump: Draft -> Build -> Market 1 -> Market 2).
    - Xuất và nhập nhật ký ván đấu (Export/Import Action Log JSON) để phục vụ xem lại (Replay).
- Non-functional:
  - Thời gian tua ngược trạng thái gần như tức thời (<2ms) nhờ tính chất cấu trúc dữ liệu chia sẻ của ngôn ngữ hàm Gleam.

## Architecture
```
                  ┌─────────────────────────────────┐
                  │       Tabletop Engine           │
                  └────────────────┬────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
  [Rewind / Undo]          [Seeded Shuffle]            [Host Overrides]
- History Snapshot List  - Fisher-Yates PRNG       - Free Card Transfer
- Jump to step N         - Per-deck shuffle        - Coin Adjust (+/-)
- Step-by-step scrubber  - Seed sync across LAN    - Flip / Force Phase
```

## Related Code Files
- Create: `d:/Test some Game/Villagers/engine/src/villagers/tabletop.gleam`
- Create: `d:/Test some Game/Villagers/engine/src/villagers/shuffle.gleam`
- Create: `d:/Test some Game/Villagers/engine/src/villagers/history.gleam`
- Modify: `d:/Test some Game/Villagers/engine/src/villagers/engine.gleam`
- Create: `d:/Test some Game/Villagers/engine/test/tabletop_test.gleam`

## Implementation Steps
1. Thiết kế module `history.gleam` lưu trữ chuỗi state snapshots và con trỏ timeline `current_step`.
2. Viết module `shuffle.gleam` thực hiện xáo trộn ngẫu nhiên có hạt giống (Linear Congruential Generator / XorShift trong Gleam).
3. Viết module `tabletop.gleam` cung cấp các hàm nghiệp vụ trọng tài: `rewind`, `undo`, `redo`, `deal_cards`, `move_card_arbitrary`, `adjust_coins_arbitrary`.
4. Tích hợp các hành động tabletop vào `Action` enum chính của engine để mọi can thiệp đều được ghi log minh bạch.
5. Viết bộ kiểm thử `tabletop_test.gleam` chứng minh:
   - Thực hiện 10 lượt chơi -> Rewind về lượt 4 -> State quay lại chính xác 100%.
   - Redo từ lượt 4 lên lượt 7 hoạt động hoàn hảo.
   - Shuffle với cùng seed cho ra thứ tự bài trùng khớp 100%.

## Success Criteria
- [ ] Hàm `rewind(state, step)` khôi phục nguyên vẹn toàn bộ bài trên tay, trên road và trong làng.
- [ ] Nút `undo` và `redo` hoạt động trơn tru không gây mất dữ liệu.
- [ ] Host có thể di chuyển bài thủ công giữa các vùng bàn cờ.
- [ ] Export file log JSON và import khôi phục lại ván chơi thành công.

## Risk Assessment
- Bộ nhớ phình to nếu ván đấu có hàng trăm action: Áp dụng chiến lược lưu delta hoặc giới hạn snapshot sâu (max 200 states) kết hợp action replay.
