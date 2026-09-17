---
phase: 1
title: Asset & Data Pipeline
status: completed
priority: P1
effort: 2h
dependencies: []
---

# Phase 1: Asset & Data Pipeline

## Overview
Thu thập toàn bộ dữ liệu thẻ bài, quy tắc trò chơi và tài nguyên đồ họa (164 ảnh PNG) từ Yucata và rulebook chính thức, chuẩn hóa thành cơ sở dữ liệu JSON sẵn sàng nạp vào Gleam Engine.

## Requirements
- Functional:
  - Tải về đầy đủ 164 ảnh PNG không thiếu sót (115 thẻ bài, 20 biểu tượng bộ bài & tài nguyên, 29 sơ đồ luật chơi).
  - Trích xuất 110 bản ghi thẻ bài chi tiết từ HTML Yucata và PDF rulebook: chỉ số Gold, Food, Builder, Silver formula, chuỗi sản xuất (placed_on, precedes), ổ khóa (unlocked_by, unlocks), số lượng thẻ trong bộ bài.
  - Tạo cấu hình luật chơi `game_rules.json` cho các chế độ 2, 3, 4, 5 người chơi và Solo Mode.
- Non-functional:
  - Ảnh PNG giữ nguyên tỷ lệ gốc (250x400), nền trong suốt, dung lượng tối ưu cho Mobile Web.
  - Schema JSON định kiểu chặt chẽ, tương thích trực tiếp với Gleam JSON Decoders (`gleam/json`).

## Architecture
```
https://www.yucata.de/game-plugins/villagers/1.1.13/images/
                 │
                 ▼
      [scripts/crawler.py]
                 │
   ┌─────────────┴─────────────┐
   ▼                           ▼
[Villagers/assets/]      [Villagers/data/]
├── cards/*.png (115)    ├── cards.json (110 records)
├── icons/*.png (20)     └── game_rules.json
└── rules/*.png (29)
```

## Related Code Files
- Create: `d:/Test some Game/Villagers/scripts/crawler.py`
- Create: `d:/Test some Game/Villagers/data/cards.json`
- Create: `d:/Test some Game/Villagers/data/game_rules.json`
- Create: `d:/Test some Game/Villagers/assets/cards/`
- Create: `d:/Test some Game/Villagers/assets/icons/`
- Create: `d:/Test some Game/Villagers/assets/rules/`

## Implementation Steps
1. Khảo sát cấu trúc DOM trang luật chơi Yucata (`/game-plugins/villagers/1.1.13/images/`).
2. Viết crawler script tải tự động toàn bộ 164 file PNG với retry và user-agent mô phỏng.
3. Phân loại tài nguyên ảnh vào các thư mục chuyên biệt: `cards/`, `icons/`, `rules/`.
4. Parse nội dung văn bản từng khối `<div id="..." class="paragraph">` để lấy tên, suit, gold, food, builder, chuỗi sản xuất, padlock, silver formula.
5. Tạo tệp `cards.json` với 110 thẻ (Base, Kickstarter expansions, Solo events).
6. Tạo tệp `game_rules.json` lưu trữ cấu hình số lượng thẻ mỗi chồng, loại bỏ suit cho 2-3 người, và cơ chế tính điểm chợ.
7. Chạy kiểm tra xác minh: bảo đảm 100% ảnh tồn tại và JSON hợp lệ.

## Success Criteria
- [x] Tải thành công 164/164 ảnh PNG (115 cards, 20 icons, 29 rules), 0 lỗi kết nối.
- [x] Tệp `data/cards.json` chứa 110 thẻ với đầy đủ thuộc tính và đường dẫn ảnh hợp lệ.
- [x] Tệp `data/game_rules.json` chứa cấu hình chuẩn cho 2-4 người chơi.

## Risk Assessment
- Rủi ro rate limit từ server Yucata: Đã giải quyết nhờ thêm delay 50ms và stream chunk tải về an toàn.
- Dữ liệu chuỗi sản xuất thiếu hoặc lệch tên: Đã chuẩn hóa qua danh sách regex đối chiếu với rulebook tiếng Việt.
