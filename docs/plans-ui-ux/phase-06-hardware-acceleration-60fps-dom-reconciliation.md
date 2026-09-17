---
phase: 6
title: "Hardware Acceleration & 60fps DOM Reconciliation"
status: pending
priority: P1
effort: "4h"
dependencies: [1, 2, 3, 4, 5]
---

# Phase 6: Hardware Acceleration & 60fps DOM Reconciliation

## Overview
Xóa bỏ triệt để hiện tượng giật lag, khựng hình ("không khựng"), chớp giật layout và mất vị trí cuộn trên thiết bị di động. Thay thế phương pháp xóa trắng DOM thô sơ (`innerHTML = ''`) bằng cơ chế đối soát DOM theo khóa (Keyed DOM Reconciliation), kích hoạt tối ưu hóa tăng tốc phần cứng GPU (Hardware Acceleration), đảm bảo toàn bộ tương tác đạt chuẩn 60fps mượt mà.

## Requirements
- **Functional**:
  - **Cơ chế Đối Soát DOM Thông Minh (Keyed DOM Reconciliation)**:
    - Nhận diện thẻ bài và thành phần UI qua thuộc tính khóa duy nhất (`data-card-id`, `data-player-id`).
    - Giữ nguyên các phần tử DOM đã tồn tại; chỉ cập nhật các giá trị biến đổi (như số đồng xu trên thẻ, trạng thái active, nhãn số lượng) thay vì phá hủy và dựng lại toàn bộ cây DOM.
    - Bảo toàn tuyệt đối vị trí cuộn (Scroll Position) của khay bài trên tay (`hand-carousel`), con đường (`view-road`) và làng (`village-container`) khi có gói tin WebSocket cập nhật từ server.
  - **Tăng Tốc Phần Cứng & Triệt Tiêu Layout Shifts (Zero CLS)**:
    - Quy định trước tỷ lệ khung hình cố định cho toàn bộ thẻ bài (`aspect-ratio: 5 / 8` hoặc `width/height` tường minh), ngăn chặn triệt để hiện tượng xô lệch màn hình khi ảnh đang tải (Cumulative Layout Shift < 0.1).
    - Mọi chuyển động (hover, active, trượt tab, mở modal) bắt buộc chỉ sử dụng thuộc tính `transform: translate3d(...)`, `scale(...)` và `opacity`. Cấm tuyệt đối animate các thuộc tính gây reflow nặng như `margin`, `top`, `left`, `width`, `height`.
  - **Phản Hồi Chạm Không Độ Trễ (< 100ms)**:
    - Áp dụng `touch-action: manipulation` trên toàn bộ phần tử tương tác để triệt tiêu độ trễ 300ms của trình duyệt di động.
    - Hiển thị phản hồi thị giác (Active State Ripple / Depress) ngay lập tức khi ngón tay vừa chạm vào màn hình.
- **Non-functional**:
  - Tốc độ khung hình duy trì ổn định 60fps trên cả iPhone thế hệ cũ và điện thoại Android tầm trung.
  - Bộ nhớ RAM trình duyệt không bị rò rỉ (memory leak) qua hàng trăm lượt chơi.

## Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                 60FPS PERFORMANCE PIPELINE                  │
├─────────────────────────────────────────────────────────────┤
│  WebSocket Message: GAME_STATE                              │
│         │                                                   │
│         ▼                                                   │
│  State Diff & Key Matching (data-card-id)                   │
│  ├── If Card Exists: Mutate in-place (coins, lock state)    │
│  ├── If New Card: Append with slide-in CSS transform        │
│  └── If Removed Card: Animate exit fade, then remove        │
│         │                                                   │
│         ▼                                                   │
│  Preserve Scroll Offset (carousel.scrollLeft untouched)     │
│         │                                                   │
│         ▼                                                   │
│  Compositor Thread Only (GPU Accelerated Transform/Opacity) │
│  └── 60fps Smooth Motion, Zero Layout Thrashing             │
└─────────────────────────────────────────────────────────────┘
```

## Related Code Files
- Modify: `Villagers/client/mobile.js`
- Modify: `Villagers/client/host.js`
- Modify: `Villagers/client/style.css`

## Implementation Steps
1. **Viết Hàm Cập Nhật DOM Theo Khóa (`reconcileCards`)**:
   - Thay thế việc gán `handCarousel.innerHTML = ''` và `viewRoad.innerHTML = ''`.
   - Viết thuật toán diffing nhẹ: duyệt danh sách thẻ mới, so khớp với các thẻ con hiện có bằng `data-card-id`. Thẻ nào còn thì giữ nguyên và update coin/class; thẻ nào mới thì thêm vào; thẻ nào không còn thì gỡ bỏ với hiệu ứng fade out.
2. **Khai Báo Kích Thước Thẻ Tường Minh**:
   - Thêm `aspect-ratio: 5 / 8` và `background-color: var(--bg-card)` vào `.villager-card` và `.mobile-card` để thẻ luôn giữ nguyên khung chiếm chỗ ngay cả khi ảnh chưa tải xong.
3. **Áp Dụng CSS Hardware Acceleration (`will-change`)**:
   - Thêm `transform: translateZ(0)` để đưa các container cuộn và thẻ bài lên Composite Layer riêng biệt trên GPU.
4. **Kiểm Tra & Đo Đạc Hiệu Năng (DevTools Profiling)**:
   - Sử dụng Performance Profiler của trình duyệt kiểm tra không có Long Tasks (> 50ms) trong quá trình người chơi thao tác, nháp bài, hoặc chuyển đổi giữa các tab.

## Success Criteria
- [ ] Vuốt lướt khay bài và chuyển tab mượt mà như ứng dụng Native (iOS/Android).
- [ ] Nhận gói tin đồng bộ thời gian thực từ server không gây chớp giật hay nhảy vị trí cuộn của người chơi.
- [ ] Không có bất kỳ lỗi giật khung hình (Frame Drop) nào khi thao tác liên tục.

## Risk Assessment
- *Rủi ro*: Thuật toán diffing DOM nếu quá phức tạp có thể gây tốn CPU.
- *Giải pháp*: Giữ thuật toán diffing ở mức cực kỳ đơn giản (dưới 30 dòng code), chỉ duyệt Map theo ID vì số lượng thẻ bài trên tay (3-10 lá) và trên con đường (6 lá) rất nhỏ.
