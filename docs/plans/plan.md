---
title: Villagers Digital - Gleam Fullstack Mobile & PC Tabletop Host
description: ''
status: completed
priority: P2
branch: ''
tags: []
blockedBy: []
blocks: []
created: '2026-09-16T03:54:21.735Z'
createdBy: 'ck:plan'
source: skill
---

# Villagers Digital - Gleam Fullstack Mobile & PC Tabletop Host

## Overview

Dự án phát triển nền tảng kỹ thuật số cho trò chơi thẻ bài chiến thuật **Villagers** dành cho **2-4 người chơi trên thiết bị di động** và **1 máy tính làm Host**.

- **Hệ sinh thái Gleam**: Lõi luật chơi thuần khiết (Type-safe Pure Functional Engine) và giao diện người dùng tương tác xây dựng bằng Gleam Lustre (Elm Architecture).
- **Cơ chế Tabletop Simulator**: Tích hợp cơ chế Rewind (tua ngược thời gian bất kỳ bước nào), Tráo bài ngẫu nhiên có hạt giống (Seeded Fisher-Yates Shuffle), Chia bài (Deal) và bảng điều khiển trọng tài tối cao cho PC Host.
- **Trải nghiệm Mobile 0-Install**: Người chơi mobile kết nối trực tiếp qua mạng Wi-Fi/LAN bằng mã QR hiển thị trên màn hình Host; giao diện PWA tối ưu cho màn hình cảm ứng, có rung và âm thanh chân thực.
- **Tài nguyên hình ảnh hoàn chỉnh**: Toàn bộ 164 ảnh PNG gốc (115 thẻ bài, 20 biểu tượng bộ bài, 29 sơ đồ luật chơi) và dữ liệu 110 thẻ đã được trích xuất và chuẩn hóa sẵn sàng.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Asset & Data Pipeline](./phase-01-asset-data-pipeline.md) | Completed |
| 2 | [Gleam Core Game Engine](./phase-02-gleam-core-game-engine.md) | Completed |
| 3 | [Tabletop Sandbox Mechanics](./phase-03-tabletop-sandbox-mechanics.md) | Completed |
| 4 | [PC Host Tabletop UI](./phase-04-pc-host-tabletop-ui.md) | Completed |
| 5 | [Mobile Player Client UI](./phase-05-mobile-player-client-ui.md) | Completed |
| 6 | [Real-time Sync & Networking](./phase-06-real-time-sync-networking.md) | Completed |
| 7 | [E2E Testing & Rulebook Validation](./phase-07-e2e-testing-rulebook-validation.md) | Completed |

## Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    PC HOST (Erlang/Node)                    │
│  ┌─────────────────────────┐    ┌────────────────────────┐  │
│  │   PC Host Tabletop UI   │    │  Gleam Game Engine     │  │
│  │   - Lustre Elm Frontend │◄───┤  - Pure State Reducer  │  │
│  │   - Timeline Rewind Bar │    │  - Seeded Shuffle      │  │
│  │   - Tabletop Controls   │    │  - Market Scoring      │  │
│  └─────────────────────────┘    └───────────┬────────────┘  │
│                                             │               │
│                                 ┌───────────┴────────────┐  │
│                                 │ WebSocket Relay Server │  │
│                                 │ - LAN IP & QR Service  │  │
│                                 │ - Real-time Broadcast  │  │
│                                 └───────────┬────────────┘  │
└─────────────────────────────────────────────┼───────────────┘
                     (LAN Wi-Fi Connection)   │
           ┌──────────────────────────────────┴──────────────────┐
           ▼                                                     ▼
┌─────────────────────────────┐               ┌─────────────────────────────┐
│    Mobile Player 1 (PWA)    │      ...      │    Mobile Player 4 (PWA)    │
│  - Lustre Touch UI          │               │  - Lustre Touch UI          │
│  - Swipe Hand & Village Map │               │  - Swipe Hand & Village Map │
│  - Haptic & Audio Feedback  │               │  - Haptic & Audio Feedback  │
└─────────────────────────────┘               └─────────────────────────────┘
```

## Dependencies

- **Môi trường**: Gleam 1.18.1, Erlang OTP 29, Node.js v24.14.0, Python 3.11.
- **Tài nguyên**: 164 ảnh PNG tại `Villagers/assets/`, dữ liệu thẻ `Villagers/data/cards.json`.

