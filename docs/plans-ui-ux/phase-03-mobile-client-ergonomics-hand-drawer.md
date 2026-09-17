---
phase: 3
title: "Mobile Client Ergonomics & Hand Drawer"
status: pending
priority: P1
effort: "4h"
dependencies: [1, 2]
---

# Phase 3: Mobile Client Ergonomics & Hand Drawer

## Overview
Tái thiết kế toàn bộ trải nghiệm người dùng trên thiết bị di động (iPhone Safari & Android Chrome) theo tiêu chuẩn Touch & Interaction của Apple HIG và Google Material Design: ngăn kéo bài (Hand Drawer) trượt vuốt tự nhiên, thanh điều hướng dạng Segmented Pill bo tròn mượt mà, và modal chi tiết thẻ trực quan giải thích cây phả hệ (padlock tree) rõ ràng.

## Requirements
- **Functional**:
  - **Bottom Hand Sheet**: Thiết kế khay bài dưới đáy màn hình với tay cầm vuốt (drag handle pill), hiển thị số lượng bài trên tay, có bộ lọc/phân loại theo Bộ bài (Suit) hoặc Độ khả thi khi xây (Playable).
  - **Scroll-snap Hand Carousel**: Vuốt ngang xem bài với quán tính mượt mà (`scroll-snap-type: x mandatory`), hiệu ứng nổi nhẹ (`scale(1.05)`) khi lướt trúng tâm.
  - **Segmented Pill Navigation**: Thanh chuyển tab dạng iOS Pill (`[Con đường] [Làng của tôi] [Đối thủ]`) có vệt sáng trượt trơn tru (slide indicator) theo tab đang chọn.
  - **Card Inspector Modal**: Khi chạm vào thẻ, mở modal chi tiết với hình ảnh kích thước lớn, thông tin yêu cầu thẻ cha (Parent villager), điều kiện ổ khóa (Padlock info - ai đang giữ thẻ mở khóa, phải trả 2 vàng cho ai hay trả cho Ngân hàng), và danh sách thả xuống trực quan để chọn dân làng đích để đặt thẻ lên.
- **Non-functional**:
  - Toàn bộ vùng chạm (touch targets) đạt chuẩn tối thiểu 44×44pt / 48×48dp, khoảng cách tối thiểu 8px để tránh bấm nhầm.
  - Loại bỏ hoàn toàn độ trễ chạm 300ms với thuộc tính `touch-action: manipulation`.
  - Phản hồi rung haptic xúc giác (`navigator.vibrate`) tinh tế tại các điểm chạm quan trọng.

## Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                      MOBILE CLIENT HUD                      │
├─────────────────────────────────────────────────────────────┤
│ [Avatar] Player Name (Turn Badge)    [🪙 8] [🌾 2] [🔨 2]   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  (●) Con đường       ( ) Làng của tôi      ( ) Đối thủ  │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      VIEWPORT AREA                          │
│               (Road / Village Tree / Opponents)             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                  ERGONOMIC HAND DRAWER                      │
│ ┌───────────────────────────┬─────────────────────────────┐ │
│ │ ═ Drag Pill Handle        │ 🃏 4 lá  [ Bộ lọc Suit ▾ ]  │ │
│ ├───────────────────────────┴─────────────────────────────┤ │
│ │  [Card 1]  [Card 2]  [Card 3]  [Card 4]  (Scroll Snap)  │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ [ KẾT THÚC LƯỢT / THỰC HIỆN HÀNH ĐỘNG (Primary CTA) ]  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Related Code Files
- Modify: `Villagers/client/index.html`
- Modify: `Villagers/client/mobile.js`
- Modify: `Villagers/client/style.css`

## Implementation Steps
1. **Thiết kế lại Khung nhìn & Thanh HUD Top**:
   - Sử dụng CSS Glassmorphism cao cấp: viền mạ đồng mảnh, nền kính mờ hun khói, hiển thị trạng thái lượt ("LƯỢT CỦA BẠN" phát sáng xanh lục ngọc bảo vs "ĐANG CHỜ" màu trầm).
   - Chip tài nguyên với font số Tabular Numbers chống rung giật giao diện.
2. **Segmented Pill Tab Switcher**:
   - Thay thế các tab viền phẳng cũ bằng thanh trượt bo tròn hình viên thuốc (pill container).
   - Sử dụng CSS `transform: translateX()` để di chuyển vệt nền active mượt mà 200ms spring curve.
3. **Nâng cấp Khay bài Trên tay (Hand Drawer Sheet)**:
   - Thêm thanh trượt tay cầm (drag handle) trang nhã.
   - Thêm bộ hiển thị thẻ bài với chiều cao cố định, có bóng đổ đa tầng và viền sáng khi thẻ bài đó ĐỦ ĐIỀU KIỆN XÂY VÀO LÀNG.
   - Cung cấp nút CTA lớn "KẾT THÚC LƯỢT" hoặc "XÂY DỰNG" với vùng chạm rộng rãi ở đáy khay.
4. **Modal Soi Thẻ & Hướng dẫn Mở khóa (Card Inspector Modal)**:
   - Hiển thị ảnh chân dung thẻ bài sắc nét.
   - Trực quan hóa điều kiện chuỗi: "Thẻ này cần thẻ cha là: [Thợ đốn gỗ] - Bạn ĐÃ CÓ / CHƯA CÓ trong làng".
   - Trực quan hóa ổ khóa: "Cần ổ khóa từ [Thợ rèn]. Người chơi Bob đang giữ -> Trả 2 vàng cho Bob để mở khóa".

## Success Criteria
- [ ] Trải nghiệm vuốt chạm trên mobile không hề bị delay, không giật cục (60fps mượt mà).
- [ ] Người chơi mới nhìn vào thẻ bài biết ngay mình có thể xây thẻ nào và thiếu điều kiện gì.
- [ ] Thao tác chuyển tab và lướt khay bài đạt chuẩn thẩm mỹ cao như các game di động thương mại.

## Risk Assessment
- *Rủi ro*: Trên các màn hình điện thoại nhỏ (iPhone SE, width 375px), khay bài có thể chiếm quá nhiều diện tích màn hình.
- *Giải pháp*: Cho phép người chơi nhấn vào thanh header của khay bài để thu gọn (collapse/expand) khay xuống chỉ còn một dải nhỏ khi muốn xem toàn cảnh Làng.
