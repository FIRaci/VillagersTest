---
phase: 4
title: "Village Map Visual Cascade & Chain Graph"
status: pending
priority: P1
effort: "4h"
dependencies: [1, 2, 3]
---

# Phase 4: Village Map Visual Cascade & Chain Graph

## Overview
Xóa bỏ hoàn toàn cách xếp đè thẻ bài thô sơ bằng margin âm (`margin-top: -115px`) vốn gây che khuất thông tin và xung đột thao tác bấm trên điện thoại. Xây dựng cấu trúc cây chuỗi sản xuất (Production Chain Tree) phân nhánh trực quan, hiển thị tiêu đề các tầng bài bậc thang rõ ràng, có đường nối phân cấp (branch connector lines), và hỗ trợ chế độ soi chi tiết từng nhánh dân làng.

## Requirements
- **Functional**:
  - **Cấu trúc Cột Chuỗi Phân Cấp (Hierarchical Chain Columns)**:
    - Thẻ gốc (Founders: Thợ Đốn Gỗ, Thợ Khai Thác, Thợ Làm Cỏ) đặt vững chãi ở chân chuỗi.
    - Các thẻ bậc 1, bậc 2, bậc 3 xếp tầng bậc thang (step cascade) với phần tiêu đề trên cùng luôn lộ rõ: Tên dân làng, Biểu tượng Bộ bài (Suit), Số lượng Vàng đặt trên thẻ, và Trạng thái Ổ khóa (Đã mở/Bị khóa).
  - **Đường Nối Phân Nhánh (Branch Connectors)**:
    - Khi một thẻ cha có nhiều thẻ con rẽ nhánh (ví dụ: Thợ Đốn Gỗ có thể nâng cấp thành Thợ Xẻ Gỗ hoặc Thợ Làm Bánh Xe), hiển thị các đường kết nối mảnh ánh vàng kim rõ ràng.
  - **Thao tác Chạm & Mở Rộng Thẻ (Tap-to-Expand)**:
    - Khi người chơi chạm vào một thẻ trong chuỗi làng, thẻ đó trượt nổi lên nhẹ nhàng kèm bóng đổ rực rỡ để đọc toàn bộ mô tả kỹ năng và năng lực tính điểm mà không làm biến dạng các cột xung quanh.
  - **Giao diện Xem Làng Đối Thủ (Opponents Tab)**:
    - Thiết kế các thẻ tóm tắt đối thủ dạng Card Carousel hoặc Accordion: hiển thị số vàng, số lượng thẻ dân làng đã xây, các thẻ đang giữ ổ khóa quan trọng mà đối thủ sở hữu.
- **Non-functional**:
  - Giữ vững tỷ lệ khung hình chuẩn của thẻ bài (`aspect-ratio: 5 / 8`), ngăn ngừa hiện tượng layout shift (CLS < 0.1).
  - Khả năng cuộn ngang dọc mượt mà với quán tính cảm ứng tự nhiên (`-webkit-overflow-scrolling: touch`).

## Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                  VILLAGE CHAIN VISUALIZER                   │
├─────────────────────────────────────────────────────────────┤
│  Chain 1 (Gỗ - Wood)           Chain 2 (Thóc - Grain)       │
│                                                             │
│  ┌────────────────────────┐    ┌────────────────────────┐   │
│  │ 🌲 [Lumberjack]  (Gốc) │    │ 🌾 [Hay Ward]   (Gốc)  │   │
│  └───────────┬────────────┘    └───────────┬────────────┘   │
│              │ (Branch Line)               │                │
│       ┌──────┴──────┐                      │                │
│       ▼             ▼                      ▼                │
│  ┌──────────┐ ┌──────────┐            ┌──────────┐          │
│  │ [Sawyer] │ │ [Wheeler]│            │[Miller]  │          │
│  │ (+1 🪙)  │ │ (Locked) │            │(Unlock)  │          │
│  └──────────┘ └──────────┘            └──────────┘          │
│       │                                    │                │
│       ▼                                    ▼                │
│  ┌──────────┐                         ┌──────────┐          │
│  │[Cooper]  │                         │[Baker]   │          │
│  └──────────┘                         └──────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## Related Code Files
- Modify: `Villagers/client/mobile.js`
- Modify: `Villagers/client/style.css`
- Modify: `Villagers/client/host.js`

## Implementation Steps
1. **Tái cấu trúc DOM của Chuỗi Làng (`renderChains`)**:
   - Thay vì dùng thẻ phẳng với margin âm, nhóm mỗi chuỗi thành một `.village-chain-column` chứa các node phân nhánh.
   - Thêm header tóm tắt đầu mỗi chuỗi (Tên bộ bài, tổng số điểm/vàng sản xuất trong chuỗi).
2. **Thiết kế Header Thẻ Thu Gọn Tự Nhiên (Card Header Strip)**:
   - Khi các thẻ xếp chồng lên nhau trong chuỗi tuyến tính, chỉ để hở 36px phần đầu chứa: Tên thẻ, icon nghề, và badge vàng.
   - Khi hover (trên PC) hoặc chạm (trên Mobile), thẻ tự động mở rộng (slide open) để hiển thị trọn vẹn chân dung và kỹ năng.
3. **Đồ họa Đường Nối Chuỗi (Branch Connectors)**:
   - Sử dụng CSS borders viền ánh kim với góc bo tròn mềm mại (`border-left`, `border-bottom`, `border-radius`) để tạo đường dẫn mạch lạc từ thẻ cha xuống các nhánh thẻ con.
4. **Nâng cấp Màn hình Đối thủ (Opponents Tab)**:
   - Hiển thị danh thiếp của từng đối thủ với ảnh đại diện, màu sắc đại diện, số vàng trên tay, điểm dự kiến, và danh sách các thẻ có biểu tượng chìa khóa mở khóa (Padlock Providers) giúp người chơi dễ dàng đưa ra chiến lược mua khóa.

## Success Criteria
- [ ] Làng của người chơi trông như một sa bàn chiến thuật tinh gọn, trật tự và đẹp mắt.
- [ ] Không còn tình trạng chạm nhầm thẻ do chồng lấn vô tổ chức.
- [ ] Dễ dàng kiểm tra các thẻ mở khóa của đối thủ mà không cần phải chạy lại bàn PC Host để xem.

## Risk Assessment
- *Rủi ro*: Khi một người chơi xây quá nhiều chuỗi bài (ví dụ 8-10 chuỗi), màn hình điện thoại có thể bị chật.
- *Giải pháp*: Cho phép cuộn ngang (horizontal scroll) mượt mà với thanh chỉ báo vị trí (scroll indicator dots) hoặc bộ lọc theo Bộ bài (Filter by Suit).
