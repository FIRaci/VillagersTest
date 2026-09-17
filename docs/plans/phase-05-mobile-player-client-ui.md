---
phase: 5
title: Mobile Player Client UI
status: completed
priority: P1
effort: 6h
dependencies:
  - phase-02-gleam-core-game-engine
  - phase-04-pc-host-tabletop-ui
---

# Phase 5: Mobile Player Client UI

## Overview
Phát triển ứng dụng Web tiến bộ (PWA) di động bằng Gleam Lustre dành riêng cho 2-4 người chơi, tối ưu hóa cho màn hình cảm ứng điện thoại (5.5" - 6.7"), không yêu cầu cài đặt kho ứng dụng, hỗ trợ vuốt chạm mượt mà, phản hồi rung và âm thanh sống động.

## Requirements
- Functional:
  - **Màn hình gia nhập (Lobby & Join)**:
    - Quét QR hoặc truy cập link LAN, nhập tên người chơi và chọn màu sắc nhận diện.
    - Xem danh sách người chơi đã vào phòng và trạng thái sẵn sàng.
  - **Thanh trạng thái trên đỉnh (Top HUD)**:
    - Hiển thị lượng Vàng dự trữ (Supply), số biểu tượng Food (giới hạn nháp `2 + Food`), số Builder (giới hạn xây `2 + Builder`).
    - Banner giai đoạn hiện tại (Đang Nháp / Đang Xây / Chợ 1 / Chợ 2) và thứ tự lượt chơi.
  - **Khu vực tương tác chính (Main Viewport)**:
    - Tab chuyển đổi linh hoạt: `[🛣️ Con đường (Road)]` | `[🏡 Làng của tôi (My Village)]` | `[👥 Làng đối thủ]`.
    - **Chế độ xem Road**: Hiển thị 6 thẻ ngửa với kích thước chạm ngón tay tối ưu. Chạm vào thẻ hiển thị bản xem trước, số coin nhận được kèm nút xác nhận "Nháp thẻ". Chạm vào chồng bài để nháp thẻ úp.
    - **Chế độ xem Làng (My Village)**: Cây chuỗi sản xuất có thể vuốt di chuyển và phóng to/thu nhỏ (pinch-to-zoom).
  - **Khay bài trên tay (Bottom Sheet Hand Tray)**:
    - Thanh trượt ngang hiển thị các thẻ trên tay.
    - Chạm vào thẻ mở cửa sổ chi tiết (Card Modal): Phóng to ảnh thẻ, hiển thị thông tin mở khóa Padlock (tự động tính phải trả 2 Vàng cho ai), và làm nổi bật các thẻ trong làng có thể đặt lên.
    - Nút hành động: `[Đặt vào Làng]` hoặc `[Đổi lấy Dân làng cơ bản (Lumberjack/Hayer/Miner)]`.
  - **Cơ chế phản hồi Tabletop**:
    - Hiệu ứng âm thanh chân thực (Web Audio API): tiếng xóc tiền xu, tiếng lật bài gỗ, tiếng gõ khóa.
    - Phản hồi xúc giác (Haptic Vibration API): rung nhẹ khi nháp bài hoặc hoàn thành chuỗi sản xuất.
    - Thông báo nổi (Toast Notification) khi Host thực hiện Rewind hoặc can thiệp bàn chơi.
- Non-functional:
  - Tải trang ban đầu < 2 giây qua mạng Wi-Fi cục bộ.
  - Hỗ trợ đầy đủ trình duyệt Safari iOS và Chrome Android.

## Architecture
```
┌─────────────────────────────────┐
│ [P1: Nam] 🪙 12  🌾 3  🔨 2    │
├─────────────────────────────────┤
│ [🛣️ Road]  [🏡 Làng]  [👥 Xem]   │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │        VÙNG ROAD          │  │
│  │  [Card 1]  [Card 2]       │  │
│  │  [Card 3]  [Card 4]       │  │
│  │  [Card 5]  [Card 6]       │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│ 🃏 BÀI TRÊN TAY (4 lá)          │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │
│ │Brewer│ │Wheeler│Carpenter│ ... │
│ └─────┘ └─────┘ └─────┘ └─────┘ │
│ [Kết thúc lượt Nháp / Xây]      │
└─────────────────────────────────┘
```

## Related Code Files
- Create: `d:/Test some Game/Villagers/client/src/mobile/main.gleam`
- Create: `d:/Test some Game/Villagers/client/src/mobile/view.gleam`
- Create: `d:/Test some Game/Villagers/client/src/mobile/hud.gleam`
- Create: `d:/Test some Game/Villagers/client/src/mobile/road_view.gleam`
- Create: `d:/Test some Game/Villagers/client/src/mobile/village_view.gleam`
- Create: `d:/Test some Game/Villagers/client/src/mobile/hand_tray.gleam`
- Create: `d:/Test some Game/Villagers/client/src/mobile/card_modal.gleam`
- Create: `d:/Test some Game/Villagers/client/src/common/audio.js`
- Create: `d:/Test some Game/Villagers/client/src/common/mobile.css`

## Implementation Steps
1. Xây dựng layout mobile CSS dạng bottom-sheet hiện đại, hỗ trợ safe-area-inset cho iPhone.
2. Viết module âm thanh `audio.js` sử dụng Web Audio API tổng hợp âm thanh click, coin clink và card slide mà không cần tải file MP3 nặng.
3. Viết Lustre component `hud.gleam` cập nhật tức thời số vàng, food và builder của người chơi.
4. Viết Lustre component `road_view.gleam` hỗ trợ chạm nháp bài 1-tap có xác nhận tránh chạm nhầm.
5. Viết Lustre component `village_view.gleam` hiển thị các chuỗi sản xuất với tỷ lệ thu nhỏ thích ứng màn hình điện thoại.
6. Viết Lustre component `hand_tray.gleam` và `card_modal.gleam` tính toán gợi ý vị trí xây hợp lệ trong Làng.
7. Xử lý thông báo Toast khi Host bấm tua lại (Rewind) để người chơi không bị bỡ ngỡ.

## Success Criteria
- [ ] Người chơi mở trình duyệt trên điện thoại tải ngay giao diện hoàn chỉnh không bị vỡ bố cục.
- [ ] Vuốt bài trên tay mượt mà, chạm vào thẻ xem được đầy đủ chi tiết và chuỗi sản xuất.
- [ ] Thao tác nháp và xây dựng diễn ra chuẩn xác, gửi action về máy chủ tức thì.
- [ ] Có âm thanh và rung phản hồi khi thao tác trên điện thoại.

## Risk Assessment
- Trình duyệt Safari iOS chặn tự động phát âm thanh: Kích hoạt AudioContext ngay lần chạm đầu tiên của người chơi vào màn hình (gesture unlock).
