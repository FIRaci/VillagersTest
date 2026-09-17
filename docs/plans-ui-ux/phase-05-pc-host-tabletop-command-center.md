---
phase: 5
title: "PC Host Tabletop Command Center"
status: pending
priority: P1
effort: "4h"
dependencies: [1, 2]
---

# Phase 5: PC Host Tabletop Command Center

## Overview
Nâng tầm giao diện PC Host thành một trung tâm điều khiển trọng tài tối cao (Tabletop Command Center) đẳng cấp phát sóng giải đấu: khu vực Con đường (Road) và 6 Chồng bài dự trữ dập nổi 3D, thanh công cụ tua thời gian (Timeline Scrubber) phong cách đồng hồ cổ điển mạ vàng, và các bảng điều khiển can thiệp luật chơi có hiệu ứng mờ nhạt nền (Backdrop Blur) sang trọng.

## Requirements
- **Functional**:
  - **Khu vực Con đường & Các Chồng bài (Road & Decks Tabletop)**:
    - 6 Chồng bài úp (Reserve Decks) có hiệu ứng chiều sâu 3D (xếp lớp shadow tạo cảm giác độ dày xấp bài thật) cùng số lượng thẻ còn lại.
    - 6 Ô bài ngửa mở rộng hiển thị các đồng tiền vàng đúc nổi đặt trên thẻ bài khi thẻ không được ai nháp ở vòng trước.
    - Hiệu ứng lật/trượt thẻ khi mở bài mới hoặc khi người chơi nháp bài.
  - **Thanh Công Cụ Trọng Tài Tối Cao (Tabletop Control Dock)**:
    - Thanh trượt dòng thời gian (Timeline Scrubber) với rãnh trượt mạ vàng, hiển thị tooltip mô tả bước đi (e.g. "Bước 12: Alice nháp Thợ Gỗ, nhận +1 vàng").
    - Cụm nút bấm Hoàn tác (Undo) và Làm lại (Redo) với phản hồi âm thanh gõ gỗ/thẻ bài chân thực.
    - Nút "Tráo bài (Seeded Shuffle)" kèm hiệu ứng xoay xấp bài vi mô (micro-animation).
    - Nút "Chia bài (Deal)", "Can thiệp Vàng", "Ép Đổi Phase" mở các cửa sổ modal chuyên dụng.
  - **Bàn Sa Bàn Người Chơi (Player Tableaus Grid)**:
    - Bố cục lưới 2-4 người chơi mô phỏng thảm nỉ nhung cao cấp (Velvet Felt Mat) với viền gỗ khắc hoa văn.
    - Hiển thị đầy đủ tổng tài sản vàng, giới hạn thợ xây/lương thực, bài trên tay và sa bàn thu nhỏ làng của từng người chơi.
  - **Cửa Sổ Kết Nối QR Code**:
    - Hiển thị mã QR trung tâm với khung viền ánh kim, nút bấm sao chép nhanh liên kết (Click-to-Copy URL kèm Toast), và danh sách người chơi đã kết nối thời gian thực.
- **Non-functional**:
  - Bố cục thích ứng linh hoạt từ màn hình laptop 1366x768 đến màn hình 4K 3840x2160, không xuất hiện thanh cuộn ngang khó chịu.
  - Sử dụng CSS Backdrop Filters và Shadows phân tầng để tạo chiều sâu thị giác chuẩn game cao cấp.

## Architecture
```
┌──────────────────────────────────────────────────────────────────────────┐
│                      PC HOST COMMAND CENTER TOP BAR                      │
│ [VILLAGERS]  Phase: [DRAFT PHASE]  Vòng: 1      [📱 QR Code] [💾 Log]   │
├──────────────────────────────────────────────────────────────────────────┤
│                       THE ROAD (CON ĐƯỜNG & CHỒNG BÀI)                   │
│  [Deck 1] [Deck 2] [Deck 3] [Deck 4] [Deck 5] [Deck 6]  (Reserve Stacks) │
│  [Card 1] [Card 2] [Card 3] [Card 4] [Card 5] [Card 6]  (Face-up Market) │
├──────────────────────────────────────────────────────────────────────────┤
│                       PLAYERS TABLEAUS (2-4 MATS)                        │
│ ┌───────────────────────────────┐   ┌────────────────────────────────┐   │
│ │ Alice (First Player 👑)       │   │ Bob                            │   │
│ │ Vàng: 12🪙  Lương thực: 4🌾  │   │ Vàng: 8🪙   Lương thực: 2🌾    │   │
│ │ [Village Chain Overview]      │   │ [Village Chain Overview]       │   │
│ └───────────────────────────────┘   └────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────────────┤
│                  FLOATING GLASS TABLETOP CONTROL DOCK                    │
│ [◀ Undo] ═══●════════════════ [Step 14] [Redo ▶]  [🎲 Tráo] [🃏 Chia]... │
└──────────────────────────────────────────────────────────────────────────┘
```

## Related Code Files
- Modify: `Villagers/client/host.html`
- Modify: `Villagers/client/host.js`
- Modify: `Villagers/client/style.css`

## Implementation Steps
1. **Thiết kế lại Khu vực Road & Decks**:
   - Thêm viền dập nổi và hiệu ứng bóng đổ nhiều lớp (`box-shadow: 1px 1px 0 #3a271c, 2px 2px 0 #2a1c14, 3px 3px 0 #1c130d, 0 10px 20px rgba(0,0,0,0.6)`) cho các cọc bài úp để tạo độ dày vật lý như một xấp bài thật trên bàn gỗ.
2. **Nâng cấp Thanh Trượt Timeline Scrubber**:
   - Tùy biến `input[type="range"]` với track mạ đồng sáng bóng, con trỏ (thumb) hình huy hiệu tròn mạ vàng có viền phát sáng.
   - Thêm tooltip nổi trên con trỏ hiển thị tóm tắt hành động của bước đi khi rê chuột.
3. **Modal Can Thiệp Vàng & Trọng Tài**:
   - Cải tạo giao diện modal can thiệp với các nút bấm tăng giảm nhanh (+1, +2, +5, -1, -5) thay vì chỉ gõ số chay, có hiển thị avatar và số dư hiện tại của người chơi được chọn.
4. **QR Code Modal & Danh Sách Lobby Trực Quan**:
   - Bổ sung hiệu ứng hào quang phát sáng sau mã QR, hiển thị ping kết nối và trạng thái sẵn sàng của từng điện thoại người chơi.

## Success Criteria
- [ ] Màn hình PC Host tạo ấn tượng choáng ngợp (WOW) ngay từ cái nhìn đầu tiên với phong cách bàn cờ sang trọng, đẳng cấp.
- [ ] Các thao tác trọng tài (Undo/Redo, Shuffle, Deal, Chỉnh Vàng) mượt mà, phản hồi tức thì dưới 100ms.
- [ ] Bố cục cân đối, hiển thị thông tin rõ ràng cho tất cả người ngồi quanh bàn quan sát.

## Risk Assessment
- *Rủi ro*: Có thể bị tràn giao diện nếu có 4 người chơi với số lượng thẻ bài trong làng quá lớn.
- *Giải pháp*: Áp dụng CSS Grid với `minmax(300px, 1fr)` và thanh cuộn ẩn tinh tế trong từng ô làng của người chơi.
