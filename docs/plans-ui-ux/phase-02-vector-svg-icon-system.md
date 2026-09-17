---
phase: 2
title: "Vector SVG Icon System"
status: pending
priority: P1
effort: "3h"
dependencies: [1]
---

# Phase 2: Vector SVG Icon System

## Overview
Loại bỏ 100% biểu tượng cảm xúc (Emoji) ra khỏi thanh điều hướng, bảng trạng thái (HUD), huy hiệu tài nguyên và nút bấm hành động. Xây dựng thư viện icon vector SVG đồng nhất (`client/icons.js`), độ dày nét nét mảnh tinh tế (1.75px stroke), hỗ trợ tô màu động (`currentColor`) và gradient kim loại dập nổi.

## Requirements
- **Functional**:
  - Tạo mô-đun `client/icons.js` xuất các hàm tạo SVG an toàn hoặc chuỗi SVG template.
  - Thay thế toàn bộ các icon emoji hiện tại:
    - `🪙` → `icon-coin` (Đồng tiền xu đúc viền dập nổi sắc nét với ánh vàng kim).
    - `🌾` → `icon-food` (Bó lúa mạch nông trại uốn lượn mềm mại).
    - `🔨` → `icon-builder` (Búa thợ xây trung cổ đầu thép cán gỗ).
    - `👑` → `icon-crown` (Vương miện nguyệt quế dành cho First Player).
    - `🛣️` → `icon-road` (Cột mốc ngã rẽ con đường phiêu lưu).
    - `🏡` → `icon-village` (Mái nhà gỗ làng mạc thời trung cổ).
    - `👥` → `icon-users` (Khiên gia huy đại diện người chơi / đối thủ).
    - `🃏` → `icon-deck` (Xấp bài thẻ xếp tầng).
    - `🔒 / 🔓` → `icon-lock / icon-unlock` (Ổ khóa rèn chỉ thị điều kiện ổ khóa mở khóa thẻ).
    - `🎲 / 📱 / 💾 / ◀ / ▶` → Bộ icon điều khiển giao diện PC Host (Xúc xắc, Mã QR, Đĩa lưu, Điều hướng tua bước).
- **Non-functional**:
  - Kích thước chuẩn hóa theo token: `icon-sm` (16px), `icon-md` (20px), `icon-lg` (24px).
  - Khả năng scale vector vô hạn không bị vỡ hạt trên màn hình Retina / AMOLED.
  - Có thuộc tính `aria-hidden="true"` và nhãn văn bản đi kèm để đảm bảo khả năng tiếp cận (A11y).

## Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                      ICONS MODULE                           │
├─────────────────────────────────────────────────────────────┤
│ client/icons.js                                             │
│ ├── getIconSvg(name, size, className)                       │
│ ├── Icons.coin, Icons.food, Icons.builder                   │
│ ├── Icons.crown, Icons.road, Icons.village, Icons.opponents │
│ ├── Icons.padlockLocked, Icons.padlockUnlocked              │
│ └── Icons.undo, Icons.redo, Icons.shuffle, Icons.qr         │
└─────────────────────────────────────────────────────────────┘
```

## Related Code Files
- Create: `Villagers/client/icons.js`
- Modify: `Villagers/client/index.html`
- Modify: `Villagers/client/mobile.js`
- Modify: `Villagers/client/host.html`
- Modify: `Villagers/client/host.js`
- Modify: `Villagers/client/style.css`

## Implementation Steps
1. **Thiết kế & Tích hợp Bộ SVG Icon Cốt Lõi (`client/icons.js`)**:
   - Viết các hàm helper trả về SVG inline sạch, tối ưu hóa kích thước path, loại bỏ thuộc tính rác.
   - Thêm bộ icon tài nguyên và biểu tượng điều hướng với viewBox `0 0 24 24`.
2. **Cập nhật Giao diện Mobile HUD & Tabs**:
   - Thay thế các đoạn code sinh emoji trong `index.html` và `mobile.js`:
     - Huy hiệu Vàng: `<span class="badge-coin">${getIconSvg('coin')} <span>8</span></span>`.
     - Huy hiệu Lương thực: `<span class="badge-food">${getIconSvg('food')} <span>2</span></span>`.
     - Huy hiệu Thợ xây: `<span class="badge-builder">${getIconSvg('builder')} <span>2</span></span>`.
     - Tabs thanh điều hướng: Nhúng SVG sắc sảo trước tên tab.
3. **Cập nhật Bảng điều khiển PC Host (`host.html` & `host.js`)**:
   - Thay thế emoji trên thanh điều khiển bottom dock: Undo/Redo, Shuffle, Deal, Adjust Gold, Force Phase, Show QR.
4. **Tích hợp Biểu Tượng Ổ Khóa Thông Minh (Smart Padlock Glyphs)**:
   - Thêm icon ổ khóa đóng/mở trực tiếp lên góc thẻ bài và trong modal giải thích nhánh nghề.

## Success Criteria
- [ ] Không còn bất kỳ emoji nào xuất hiện trong các thành phần layout, HUD, Tabs hay Buttons.
- [ ] Tất cả icon hiển thị sắc nét với tỷ lệ đồng nhất và màu sắc ăn khớp với theme.
- [ ] Không tăng tải trang (tất cả SVG nhúng trực tiếp hoặc qua file JS nhẹ ~4KB, không tải thư viện font cồng kềnh ngoài).

## Risk Assessment
- *Rủi ro*: Kích thước icon không đều nếu không set viewbox hoặc height/width rõ ràng.
- *Giải pháp*: Quy định style `.svg-icon` chung trong `style.css` với `display: inline-block; vertical-align: middle; flex-shrink: 0; fill: currentColor;`.
