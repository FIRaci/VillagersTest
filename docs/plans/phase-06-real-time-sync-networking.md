---
phase: 6
title: Real-time Sync & Networking
status: completed
priority: P1
effort: 4h
dependencies:
  - phase-02-gleam-core-game-engine
  - phase-04-pc-host-tabletop-ui
  - phase-05-mobile-player-client-ui
---

# Phase 6: Real-time Sync & Networking

## Overview
Xây dựng máy chủ đồng bộ thời gian thực hai chiều qua WebSocket, phục vụ đồng thời giao diện PC Host và Mobile Client, hỗ trợ tự động tìm kiếm IP mạng LAN, tạo mã QR, tự động kết nối lại khi mất mạng (Auto-reconnect), và sao lưu nhật ký ván đấu.

## Requirements
- Functional:
  - **WebSocket Relay & State Sync**:
    - Quản lý phiên kết nối (Sessions) cho Host và 2-4 người chơi Mobile.
    - Nhận lệnh `PlayerAction` từ Mobile -> chuyển qua Gleam Engine thẩm định -> Cập nhật State -> Phát sóng (Broadcast) `GameState` mới đến tất cả thiết bị trong vòng <15ms.
    - Nhận lệnh `HostAction` (Rewind, Shuffle, Deal, Arbitrator) -> Cập nhật State -> Đồng bộ lại toàn bộ client.
  - **Tự động nhận diện mạng nội bộ (LAN Auto-Discovery)**:
    - Máy chủ tự động quét các card mạng đang hoạt động, phát hiện địa chỉ IPv4 nội bộ (ví dụ: `192.168.1.105:3000`).
    - Cung cấp API `/api/network-info` trả về IP và dữ liệu chuỗi mã QR.
  - **Cơ chế Tự động kết nối lại (Auto-Reconnect & Session Recovery)**:
    - Lưu token định danh người chơi vào `localStorage` trên điện thoại.
    - Khi điện thoại tắt màn hình hoặc chuyển vùng sóng Wi-Fi, khi mở lại sẽ tự gửi bản tin `Reconnect` và nhận lại nguyên vẹn trạng thái bàn cờ hiện tại mà không làm văng khỏi phòng.
  - **Lưu trữ & Khôi phục trận đấu (Persistence & Replay)**:
    - Tự động ghi lại `history` vào file `data/autosave.json` sau mỗi lượt đi.
    - Hỗ trợ nút tải file `export-log.json` và tải lên file log cũ để chiếu lại toàn bộ ván đấu.
- Non-functional:
  - Phục vụ tĩnh (Static file server) toàn bộ 164 ảnh PNG trong thư mục `assets/` với HTTP caching headers tối ưu.
  - Khả năng xử lý mất gói tin (heartbeat ping-pong mỗi 5 giây).

## Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                      PC HOST SERVER                         │
│  ┌────────────────────────┐    ┌─────────────────────────┐  │
│  │  HTTP Static Server    │    │  WebSocket Hub (WS)     │  │
│  │  - Serves assets/cards │    │  - Broadcast GameState  │  │
│  │  - Serves Lustre App   │    │  - Player Session Map   │  │
│  └───────────┬────────────┘    └────────────┬────────────┘  │
│              │                              │               │
│              ▼                              ▼               │
│       [PC Host Web UI]            [Gleam Core Engine]       │
└──────────────┬──────────────────────────────┬───────────────┘
               │ (LAN Wi-Fi)                  │
     ┌─────────┴──────────────┬───────────────┴─────────┐
     ▼                        ▼                         ▼
[Mobile Player 1]        [Mobile Player 2]        [Mobile Player 3]
```

## Related Code Files
- Create: `d:/Test some Game/Villagers/server/package.json`
- Create: `d:/Test some Game/Villagers/server/src/server.js`
- Create: `d:/Test some Game/Villagers/server/src/network.js`
- Create: `d:/Test some Game/Villagers/server/src/rooms.js`
- Create: `d:/Test some Game/Villagers/server/src/storage.js`
- Create: `d:/Test some Game/Villagers/client/src/common/socket.js`

## Implementation Steps
1. Xây dựng module phát hiện IP nội bộ `network.js` dùng thư viện `os.networkInterfaces()`.
2. Viết WebSocket hub quản lý phòng chơi, phân biệt quyền giữa Host (có quyền tabletop) và Player (chỉ gửi action hợp lệ).
3. Thiết lập static file server với mime-type chuẩn cho `.png`, `.js`, `.css`, `.json`.
4. Viết logic Heartbeat và Reconnect tự động ở phía client `socket.js`.
5. Tích hợp tính năng tự động ghi nhận file `data/autosave.json` mỗi khi có thay đổi trạng thái.
6. Kiểm tra truyền nhận bản tin giữa 1 máy tính Host và 2-4 tab mobile / thiết bị điện thoại thực tế qua Wi-Fi.

## Success Criteria
- [ ] Điện thoại kết nối vào máy tính qua mã QR không cần cấu hình phức tạp.
- [ ] Khi 1 người chơi nháp bài, toàn bộ máy còn lại và máy Host cập nhật tức thời (<50ms).
- [ ] Tắt Wi-Fi trên điện thoại rồi bật lại -> Ứng dụng tự kết nối và giữ nguyên ván đấu.
- [ ] File `autosave.json` được cập nhật liên tục sau mỗi action.

## Risk Assessment
- Tường lửa Windows Defender Firewall chặn cổng 3000: Hướng dẫn người chơi bật quyền cho phép Node/App truy cập qua mạng Private hoặc hỗ trợ đổi port linh hoạt.
