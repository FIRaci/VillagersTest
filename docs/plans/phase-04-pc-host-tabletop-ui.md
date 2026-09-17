---
phase: 4
title: PC Host Tabletop UI
status: completed
priority: P1
effort: 6h
dependencies:
  - phase-03-tabletop-sandbox-mechanics
---

# Phase 4: PC Host Tabletop UI

## Overview
Xây dựng giao diện máy chủ quản trị bàn cờ (PC Host Tabletop UI) tối ưu cho màn hình Desktop độ phân giải cao bằng framework Gleam Lustre, cung cấp góc nhìn toàn cảnh trận đấu, bảng điều khiển Tabletop đầy đủ quyền năng và mã QR kết nối nhanh cho người chơi Mobile.

## Requirements
- Functional:
  - **Màn hình bàn cờ trung tâm (Central Board)**:
    - Hiển thị Con đường (Road): 6 chồng bài úp (kèm bộ đếm số lượng lá) và 6 thẻ ngửa kèm số đồng xu Vàng tích lũy trên mỗi thẻ.
    - Vùng Chồng bài Dự trữ (Reserve) và Chồng bài bỏ (Discard Pile) kèm số lượng bài.
    - Vùng Ngân hàng tiền xu (Bank Coins).
  - **Khu vực hiển thị Người chơi (Players Tableau)**:
    - Bố trí dạng lưới từ 2 đến 4 người chơi: Tên, trạng thái kết nối (Ping xanh/đỏ), số Vàng dự trữ, số Food (giới hạn nháp), số Builder (giới hạn xây).
    - Cây làng (Village Tableau): Hiển thị trực quan các chuỗi sản xuất xếp chồng theo đúng quy tắc (thẻ bên dưới chỉ lộ tên và icon, thẻ đỉnh lộ toàn bộ hình minh họa).
    - Quyền xem bài trên tay của người chơi (Admin Peek Hand) phục vụ giám sát và hỗ trợ người chơi.
  - **Bảng điều khiển Tabletop (Control Toolbar)**:
    - Thanh trượt dòng thời gian (Rewind Timeline Scrubber): Hiển thị danh sách các bước đã diễn ra trong ván kèm nút `[⏪ Tua về bước N]`, `[◀ Undo]`, `[▶ Redo]`.
    - Nút thao tác nhanh: `[🎲 Tráo bài (Shuffle)]`, `[🃏 Chia bài (Deal)]`, `[🪙 Chỉnh Vàng (+/-)]`, `[⏩ Ép đổi Phase]`, `[⏸️ Tạm dừng trận đấu]`, `[💾 Xuất Log JSON]`.
  - **Mã QR kết nối nội bộ (LAN QR Code)**:
    - Tự động lấy IP mạng nội bộ của máy tính (ví dụ `http://192.168.1.15:8080`) và hiển thị mã QR kích thước lớn ngay tại màn hình chờ và góc bảng điều khiển để người chơi Mobile quét và tham gia ván đấu trong 2 giây.
- Non-functional:
  - Thiết kế sang trọng, phong cách đồ họa bảng gỗ thời Trung Cổ kết hợp dark mode cao cấp.
  - Tốc độ phản hồi 60 FPS, cập nhật giao diện mượt mà qua Lustre Model-View-Update.

## Architecture
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  VILLAGERS HOST (PC)               [Phase: DRAFT] [Round: 2] [IP: 192.168..]│
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────── ROAD & DECKS ───────────────────────────────┐   │
│  │ [Stack 1] [Stack 2] [Stack 3] [Stack 4] [Stack 5] [Stack 6] [Reserve]│   │
│  │ [Card+2c] [Card   ] [Card+1c] [Card   ] [Card   ] [Card   ] [Discard]│   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────── PLAYERS TABLEAU ──────────────────────────────┐   │
│  │ [P1 Village Tree]   [P2 Village Tree]   [P3 Village Tree]   [P4 ...] │   │
│  │ Gold: 12 | Food: 3  Gold: 8  | Food: 2  Gold: 15 | Food: 4          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│  [⏪ Rewind Slider ━━━━━━●━━] [◀ Undo] [▶ Redo] [🎲 Shuffle] [🃏 Deal]      │
│  [🪙 +/- Coin] [⏩ Next Phase] [QR Code Connect] [Export Game Log]          │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Related Code Files
- Create: `d:/Test some Game/Villagers/client/src/host/main.gleam`
- Create: `d:/Test some Game/Villagers/client/src/host/view.gleam`
- Create: `d:/Test some Game/Villagers/client/src/host/board.gleam`
- Create: `d:/Test some Game/Villagers/client/src/host/tableau.gleam`
- Create: `d:/Test some Game/Villagers/client/src/host/timeline.gleam`
- Create: `d:/Test some Game/Villagers/client/src/host/controls.gleam`
- Create: `d:/Test some Game/Villagers/client/src/host/qr_modal.gleam`
- Create: `d:/Test some Game/Villagers/client/src/common/theme.css`

## Implementation Steps
1. Xây dựng theme CSS với bảng màu trung cổ sang trọng (gỗ sồi, vàng kim, nhung đỏ, viền bạc).
2. Viết Lustre component `board.gleam` vẽ Road 6 chồng bài và hàng thẻ ngửa có huy hiệu coin.
3. Viết Lustre component `tableau.gleam` vẽ cây phân nhánh Làng của các người chơi, tính toán vị trí thẻ đè tự nhiên.
4. Viết Lustre component `timeline.gleam` tích hợp thanh trượt dòng thời gian liên kết với cơ chế Rewind của Gleam engine.
5. Viết Lustre component `controls.gleam` với hộp thoại tráo bài (chọn deck cần tráo), chia bài (chọn số lá và người nhận) và can thiệp tiền tệ.
6. Tích hợp thư viện sinh mã QR code động hiển thị địa chỉ IP kết nối của Host.
7. Đóng gói giao diện Host thành ứng dụng Web chạy trên PC qua trình duyệt hoặc cửa sổ Desktop.

## Success Criteria
- [ ] Giao diện Host hiển thị sắc nét toàn cảnh Road, Decks và Làng của 2-4 người chơi.
- [ ] Kéo thanh trượt Rewind làm toàn bộ bàn cờ cập nhật lùi lại đúng trạng thái quá khứ.
- [ ] Nút Shuffle hiển thị hiệu ứng tráo bài và cập nhật lại thứ tự bài trong Gleam state.
- [ ] Quét mã QR trên điện thoại mở đúng địa chỉ máy chủ nội bộ.

## Risk Assessment
- Màn hình nhỏ trên laptop: Sử dụng CSS Grid tự co giãn (responsive scale) và chế độ thu phóng bản đồ bàn cờ (zoom/pan).
