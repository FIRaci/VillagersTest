---
phase: 7
title: E2E Testing & Rulebook Validation
status: completed
priority: P1
effort: 4h
dependencies:
  - phase-01-asset-data-pipeline
  - phase-02-gleam-core-game-engine
  - phase-03-tabletop-sandbox-mechanics
  - phase-04-pc-host-tabletop-ui
  - phase-05-mobile-player-client-ui
  - phase-06-real-time-sync-networking
---

# Phase 7: E2E Testing & Rulebook Validation

## Overview
Tiến hành kiểm thử toàn diện từ đầu đến cuối (End-to-End Testing): đối soát 100% luật chơi với sách luật gốc (Rulebook PDF), kiểm tra độ trễ mạng thực tế, kiểm tra khả năng phục hồi khi mất kết nối, và hoàn thiện tài liệu hướng dẫn vận hành.

## Requirements
- Functional:
  - **Bộ kiểm thử tự động (Automated Integration Tests)**:
    - Giả lập kịch bản hoàn chỉnh một ván chơi 3 người từ Thiết lập -> Vòng nháp 1 -> Vòng xây 1 -> Giai đoạn Chợ 1 -> Đến khi cạn các chồng bài -> Giai đoạn Chợ 2 -> Tính điểm và công bố người chiến thắng.
    - Kiểm tra các thẻ bài đặc biệt (Special cards, Silver scoring, Basic Villager exchanges).
  - **Kiểm thử hành vi Tabletop (Tabletop Invariant Tests)**:
    - Kéo lùi Rewind 5 bước rồi bấm Redo 5 bước -> Bàn cờ phải khớp từng bit dữ liệu với trạng thái ban đầu.
    - Thao tác tráo bài với cùng 1 seed phải cho ra kết quả phân bố thẻ bài giống hệt nhau.
  - **Kiểm thử trải nghiệm thực tế trên thiết bị di động (Mobile QA)**:
    - Kiểm tra trên iOS Safari (iPhone) và Android Chrome.
    - Đảm bảo các nút bấm cảm ứng đủ lớn (>44px), không bị zoom vô tình khi chạm 2 lần.
    - Hiệu ứng âm thanh và rung phản hồi hoạt động mượt mà.
  - **Tài liệu hướng dẫn (Documentation)**:
    - Viết tệp `README.md` hướng dẫn chạy Server 1 lệnh duy nhất, cách kết nối điện thoại qua Wi-Fi, và bảng tra cứu phím tắt cho Host.
- Non-functional:
  - Tỷ lệ vượt qua kiểm thử: 100% test cases pass.
  - Không có bất kỳ lỗi JavaScript runtime hoặc rò rỉ bộ nhớ (memory leak) khi chạy liên tục 2 giờ.

## Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    E2E TEST PIPELINE                        │
├──────────────────────────┬──────────────────────────────────┤
│  Gleam Unit Tests        │ - Test chains, padlocks, scoring │
│  (gleam test)            │ - Test rewind & seeded shuffle   │
├──────────────────────────┼──────────────────────────────────┤
│  Simulation Tests        │ - 3-player simulated match       │
│  (scripts/simulate.js)   │ - Full game lifecycle validation │
├──────────────────────────┼──────────────────────────────────┤
│  Network & Reconnect     │ - Packet drop & screen sleep     │
│  (test/network_test.js)  │ - Auto-recovery under 1 second   │
└──────────────────────────┴──────────────────────────────────┘
```

## Related Code Files
- Create: `d:/Test some Game/Villagers/engine/test/simulation_test.gleam`
- Create: `d:/Test some Game/Villagers/scripts/simulate_game.js`
- Create: `d:/Test some Game/Villagers/README.md`
- Create: `d:/Test some Game/Villagers/run_host.bat`

## Implementation Steps
1. Viết kịch bản kiểm thử giả lập `simulate_game.js` chạy tự động 1 ván đấu 3 bot chơi với nhau.
2. Kiểm tra tính chính xác của thuật toán tính điểm Chợ lần 1 và lần 2 đối chiếu với ví dụ trong sách luật trang 8-10.
3. Chạy thử nghiệm kiểm tra tính năng Rewind nhiều lần trong ván đấu giả lập xem có phát sinh desync giữa các client hay không.
4. Kiểm thử giao diện thực tế trên điện thoại thật bằng cách quét mã QR từ màn hình máy tính.
5. Tạo tệp thực thi nhanh `run_host.bat` để người dùng có thể nhấp đúp là khởi động ngay toàn bộ hệ thống.
6. Soạn thảo tệp `README.md` hướng dẫn chi tiết cách chơi và các mẹo sử dụng thanh Tabletop.

## Success Criteria
- [ ] Ván đấu giả lập 3 người chạy hoàn tất từ đầu đến cuối không bị dừng hoặc nghẽn trạng thái.
- [ ] Điểm số cuối trận được tính chính xác tuyệt đối theo rulebook.
- [ ] Trọng tài có thể can thiệp bất kỳ lúc nào (Rewind, Deal, Shuffle, thêm Vàng) mà không làm sập phòng.
- [ ] Tệp `run_host.bat` khởi chạy máy chủ thành công chỉ với 1 click.

## Risk Assessment
- Xung đột địa chỉ IP khi máy tính đổi mạng Wi-Fi: Máy chủ có cơ chế tự động cập nhật IP mới và làm mới mã QR ngay trên màn hình Host.
