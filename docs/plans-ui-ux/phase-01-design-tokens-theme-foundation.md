---
phase: 1
title: "Design Tokens & Theme Foundation"
status: pending
priority: P1
effort: "4h"
dependencies: []
---

# Phase 1: Design Tokens & Theme Foundation

## Overview
Xây dựng nền tảng Design System chuẩn mực "Dark Medieval Luxury" cho Villagers Digital trong file `client/style.css`, thiết lập bộ Token toàn diện cho màu sắc, typography, tỷ lệ khoảng cách 4dp/8dp, độ nổi (elevation), và chuyển động spring mượt mà, loại bỏ triệt để giao diện nghiệp dư ("phèn").

## Requirements
- **Functional**:
  - Toàn bộ màu sắc, kích thước, bo góc, bóng mờ và transition phải được tham chiếu qua CSS Custom Properties (`var(--...)`).
  - Tích hợp font chữ hiển thị cổ điển sang trọng (`Cinzel`) và font chữ nội dung/giao diện hiện đại, siêu rõ nét (`Outfit` / `Inter`) với chế độ số hiển thị dạng Tabular (`font-feature-settings: 'tnum'`).
  - Hỗ trợ đầy đủ Safe Area Inset trên iPhone (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`) và đơn vị động `100dvh`.
- **Non-functional**:
  - Độ tương phản văn bản đạt chuẩn WCAG AAA (≥ 7:1 cho tiêu đề, ≥ 4.5:1 cho văn bản thường).
  - Tối ưu hiệu năng render GPU bằng cách định nghĩa các timing function `cubic-bezier(0.16, 1, 0.3, 1)`.

## Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                   DESIGN SYSTEM TOKENS                      │
├──────────────────────────────┬──────────────────────────────┤
│ Surface & Canvas:            │ Typography & Numbers:        │
│ --bg-canvas: #0c0a09         │ --font-heading: 'Cinzel'     │
│ --bg-surface: #171412        │ --font-ui: 'Outfit', sans    │
│ --bg-elevated: #241e1a       │ font-variant-numeric: tabular│
│ --bg-glass: rgba(28,23,19,.8)│                              │
├──────────────────────────────┼──────────────────────────────┤
│ Metallic Accents:            │ Motion & Springs:            │
│ --gold-primary: #d4af37      │ --ease-spring: cubic-bezier  │
│ --gold-bright: #ffd700       │ --duration-fast: 160ms       │
│ --gold-glow: rgba(...)       │ --duration-normal: 240ms     │
│ --border-hairline: rgba(...) │ --duration-exit: 120ms       │
└──────────────────────────────┴──────────────────────────────┘
```

## Related Code Files
- Modify: `Villagers/client/style.css`
- Modify: `Villagers/client/index.html`
- Modify: `Villagers/client/host.html`

## Implementation Steps
1. **Thiết lập bảng màu Dark Medieval Luxury**:
   - Thay thế màu nền đen thuần và nâu đất xỉn bằng hệ màu đa tầng: Obsidian Canvas (`#0c0a09`), Smoked Oak Surface (`#171412`), Timber Elevated (`#241e1a`), Frosted Smoked Glass (`rgba(28, 23, 19, 0.82)` kèm `backdrop-filter: blur(16px)`).
   - Thiết lập bảng màu 9 bộ nghề (Suits) chuẩn: Gỗ (Wood `#8b5a2b`), Thóc (Grain `#e6b800`), Cỏ khô (Hay `#d4a017`), Quặng (Ore `#708090`), Nho (Grapes `#8e44ad`), Len (Wool `#3498db`), Da (Leather `#a0522d`), Độc hành (Solitary `#2ecc71`), Đặc biệt (Special `#e74c3c`).
2. **Typography & Tabular Numbers**:
   - Nhúng Google Fonts `Cinzel:wght@600;700;900` cho tiêu đề hoàng gia và `Outfit:wght@400;500;600;700` cho UI/body.
   - Bật thuộc tính `font-variant-numeric: tabular-nums` cho toàn bộ các chỉ số (Gold, Food, Builder, Round, Step) để tránh hiện tượng chữ số bị giật/nhảy layout khi đếm.
3. **Thước đo khoảng cách 4dp/8dp & Bo góc**:
   - Quy chuẩn `--space-1` (4px), `--space-2` (8px), `--space-3` (12px), `--space-4` (16px), `--space-6` (24px).
   - Quy chuẩn bo góc: thẻ bài (`--radius-card: 8px`), nút bấm (`--radius-btn: 10px`), container/sheet (`--radius-sheet: 16px`).
4. **Hệ thống Nút bấm & Hiệu ứng Chạm**:
   - Nâng cấp `.btn`, `.btn-primary`, `.btn-danger`: Viền kim loại hairline (`border: 1px solid rgba(212, 175, 55, 0.4)`), gradient ánh kim dập nổi, phản hồi cảm ứng khi nhấn `transform: scale(0.96)`.

## Success Criteria
- [ ] File `client/style.css` được cấu trúc lại hoàn toàn với đầy đủ design tokens.
- [ ] Không còn bất kỳ mã màu hex tùy tiện phân tán trong inline styles.
- [ ] Các chỉ số số liệu không còn bị co giật khi giá trị thay đổi.
- [ ] Hiển thị hoàn hảo trên các màn hình có tai thỏ / Dynamic Island và Home Indicator bar.

## Risk Assessment
- *Rủi ro*: Một số style cũ có thể bị mất nếu tên class thay đổi.
- *Giải pháp*: Giữ nguyên các class interface cốt lõi (`.villager-card`, `.btn`, `.panel`, `.badge-*`) và nâng cấp visual style trực tiếp bên trong.
