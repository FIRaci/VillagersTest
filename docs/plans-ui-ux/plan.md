---
title: "Villagers UI/UX Pro Max Overhaul"
description: "Kế hoạch nâng cấp toàn diện giao diện & trải nghiệm người dùng cho Villagers Digital: thẩm mỹ Dark Medieval Luxury đẳng cấp, loại bỏ emoji và giao diện nghiệp dư, triệt tiêu giật lag 60fps và tối ưu hóa công thái học cảm ứng di động."
status: completed
priority: P1
branch: ""
tags: [ui, ux, design-system, mobile-pwa, tabletop, 60fps]
blockedBy: []
blocks: []
created: "2026-09-16T04:08:25.528Z"
createdBy: "ck:plan"
source: skill
---

# Villagers UI/UX Pro Max Overhaul

## Overview

Kế hoạch tái thiết kế và nâng cấp toàn diện giao diện người dùng (UI) cùng trải nghiệm tương tác (UX) cho dự án **Villagers Digital** (bao gồm cả **Mobile Web Client** và **PC Host Tabletop Command Center**). 

Đã hoàn thành xuất sắc 3 tiêu chí cốt lõi:
1. **"Không phèn" (Aesthetic Luxury)**: Xóa bỏ 100% biểu tượng cảm xúc (emoji) nghiệp dư; xây dựng Design System mang phong cách **Dark Medieval Luxury** (đá obsidian, gỗ hun khói, viền mạ đồng/vàng kim, huy hiệu kim loại đúc nổi); font chữ hoàng gia `Cinzel` kết hợp font giao diện sắc sảo `Outfit` với số liệu Tabular Numbers không xô lệch.
2. **"Không khựng" (Zero Jank & 60fps Fluidity)**: Triệt tiêu hoàn toàn hiện tượng chớp màn hình và giật khung hình do xóa trắng DOM (`innerHTML = ''`); áp dụng cơ chế Keyed DOM Reconciliation cập nhật theo khóa; 100% animation chạy trên GPU Compositor Thread (`transform: translate3d(...)` và `opacity`); triệt tiêu độ trễ chạm 300ms với `touch-action: manipulation`.
3. **"Clean & Gọn gàng" (Clean Layout & Ergonomics)**: Tái cấu trúc chuỗi sản xuất (Village Tree) phân tầng bậc thang rõ ràng thay cho việc đè thẻ bằng margin âm hỗn loạn; thanh điều hướng Segmented Pill bo tròn mượt mà; khay bài (Hand Drawer) có tay cầm vuốt và snap cuộn ngang tự nhiên.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Design Tokens & Theme Foundation](./phase-01-design-tokens-theme-foundation.md) | Completed |
| 2 | [Vector SVG Icon System](./phase-02-vector-svg-icon-system.md) | Completed |
| 3 | [Mobile Client Ergonomics & Hand Drawer](./phase-03-mobile-client-ergonomics-hand-drawer.md) | Completed |
| 4 | [Village Map Visual Cascade & Chain Graph](./phase-04-village-map-visual-cascade-chain-graph.md) | Completed |
| 5 | [PC Host Tabletop Command Center](./phase-05-pc-host-tabletop-command-center.md) | Completed |
| 6 | [Hardware Acceleration & 60fps DOM Reconciliation](./phase-06-hardware-acceleration-60fps-dom-reconciliation.md) | Completed |

## Architecture & Design System

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DARK MEDIEVAL LUXURY DESIGN SYSTEM                   │
├──────────────────────────────┬──────────────────────────────────────────┤
│ SURFACE PALETTE              │ METALLIC ACCENTS & TOKENS                │
│ • Obsidian Base: #0c0a09     │ • Gold Primary: #d4af37 (Brushed Brass)  │
│ • Smoked Oak: #171412        │ • Gold Bright: #ffd700 (Minted Coin)     │
│ • Timber Elevated: #241e1a   │ • Gold Glow: rgba(245, 197, 66, 0.25)    │
│ • Frosted Glass: rgba(28,...)│ • Hairline Border: rgba(255,255,255,0.07)│
├──────────────────────────────┼──────────────────────────────────────────┤
│ TYPOGRAPHY & NUMBERS         │ MOTION & COMPOSITOR                      │
│ • Display: 'Cinzel', serif   │ • Spring Curve: cubic-bezier(0.16,1,0.3,1│
│ • UI/Body: 'Outfit', sans    │ • Micro Timing: 160ms - 240ms (Exit: 120)│
│ • Tabular: font-feature tnum │ • GPU Layer: translate3d / opacity only  │
└──────────────────────────────┴──────────────────────────────────────────┘
```

## Dependencies & Scope

- **Scope**: Toàn bộ tầng giao diện Client (`Villagers/client/`): `style.css`, `index.html`, `mobile.js`, `host.html`, `host.js`, và thư viện mới `icons.js`.
- **Logic Core**: Giữ nguyên vẹn 100% lõi logic Gleam Engine và giao thức WebSocket Server đã được kiểm chứng ở giai đoạn trước.
- **Tài nguyên**: Sử dụng toàn bộ 164 ảnh PNG gốc sắc nét tại `Villagers/assets/` kết hợp với bộ Vector SVG Icons tùy biến.
