# 🏰 Villagers Digital (Gleam Fullstack Ecosystem)

Nền tảng kỹ thuật số hoàn chỉnh cho board game chiến thuật **Villagers** (tác giả Haakon Hoel Gaarder, phát hành bởi Sinister Fish Games).

Hệ thống được thiết kế chuyên biệt cho mô hình:
- **1 Máy tính làm Host**: Màn hình lớn hiển thị bàn cờ toàn cảnh, bảng điều khiển Tabletop Simulator đầy đủ quyền năng (Rewind timeline, tráo bài có hạt giống Seeded Shuffle, chia bài, can thiệp Vàng, xuất/nhập log ván đấu).
- **2-4 Người chơi trên Mobile**: Giao diện Web PWA di động tối ưu cho màn hình cảm ứng, vuốt lướt mượt mà, hỗ trợ rung phản hồi (Haptic) và âm thanh chân thực tổng hợp qua Web Audio API. **Không cần cài đặt ứng dụng từ App Store** – chỉ cần quét mã QR trên màn hình Host bằng camera điện thoại!

---

## 🚀 Hướng Dẫn Khởi Chạy Nhanh

### Cách 1: Nhấp đúp chuột (Khuyên dùng trên Windows)
1. Nhấp đúp vào tệp `run_host.bat` trong thư mục `Villagers`.
2. Màn hình console sẽ hiển thị:
   ```
   =============================================================
     🏰 VILLAGERS DIGITAL - PC HOST & MOBILE SERVER IS READY!  
   =============================================================
     💻 PC Host Tabletop UI:   http://localhost:3000/host
     📱 Mobile Player Web App: http://192.168.1.xxx:3000
     📡 WebSocket Sync:        ws://192.168.1.xxx:3000/ws
   =============================================================
   ```
3. Mở trình duyệt trên máy tính truy cập: [http://localhost:3000/host](http://localhost:3000/host).
4. Nhấp nút **"📱 Quét QR Di Động"** trên màn hình Host.
5. Người chơi lấy điện thoại mở Camera quét mã QR để tham gia ván đấu ngay lập tức!

### Cách 2: Bằng dòng lệnh terminal
```bash
cd Villagers/server
node src/server.mjs
```

---

## 🛠️ Kiến Trúc Công Nghệ & Hệ Sinh Thái Gleam

```
┌─────────────────────────────────────────────────────────────┐
│                    PC HOST SERVER                           │
│  ┌─────────────────────────┐    ┌────────────────────────┐  │
│  │   PC Host Tabletop UI   │    │  Gleam Game Engine     │  │
│  │   - Bàn cờ trung tâm    │◄───┤  - 100% Pure Functional│  │
│  │   - Thanh tua Rewind    │    │  - Immutable Reducer   │  │
│  │   - Bảng trọng tài      │    │  - Seeded Shuffle      │  │
│  └─────────────────────────┘    └───────────┬────────────┘  │
│                                             │               │
│                                 ┌───────────┴────────────┐  │
│                                 │ WebSocket Relay Server │  │
│                                 │ - LAN IP & QR Service  │  │
│                                 │ - Đồng bộ thời gian thực│  │
│                                 └───────────┬────────────┘  │
└─────────────────────────────────────────────┼───────────────┘
                     (Kết nối Wi-Fi LAN)      │
           ┌──────────────────────────────────┴──────────────────┐
           ▼                                                     ▼
┌─────────────────────────────┐               ┌─────────────────────────────┐
│    Mobile Player 1 (PWA)    │      ...      │    Mobile Player 4 (PWA)    │
│  - Giao diện cảm ứng 1-tap  │               │  - Giao diện cảm ứng 1-tap  │
│  - Xem Làng & chuỗi sản xuất│               │  - Xem Làng & chuỗi sản xuất│
│  - Rung & Âm thanh xu/bài   │               │  - Rung & Âm thanh xu/bài   │
└─────────────────────────────┘               └─────────────────────────────┘
```

1. **Gleam Core Game Engine (`engine/src/villagers/`)**:
   - `models.gleam`: Toàn bộ Algebraic Data Types định nghĩa 9 Bộ bài (Suits), Thẻ bài, Người chơi, Trạng thái Road, và các Action.
   - `chains.gleam`: Kiểm tra tính hợp lệ của chuỗi sản xuất (Production Chains), phân nhánh tối đa 2 nhánh từ Founders, xác định các thẻ trên đỉnh (Top Villagers).
   - `padlock.gleam`: Giải quyết quy tắc mở khóa Ổ khóa (trả 2 Vàng cho người sở hữu thẻ chìa khóa hoặc trả cho ngân hàng).
   - `market.gleam`: Thuật toán tính điểm Chợ 1 (Gold in + xu tích lũy) và Chợ 2 (kèm công thức thẻ Bạc Silver).
   - `tabletop.gleam`: Cơ chế Rewind (tua ngược bước bất kỳ), Seeded Shuffle (xáo trộn ngẫu nhiên có hạt giống tái lập), và chia bài.
   - `codec.gleam`: Bộ tuần tự hóa dữ liệu Gleam sang JSON và ngược lại.
2. **PC Host Tabletop UI (`client/host.html`, `client/host.js`)**:
   - Giao diện phong cách thời Trung Cổ kết hợp Dark Mode cao cấp.
   - Thanh trượt dòng thời gian **Rewind Slider** cho phép kéo lùi về bất kỳ bước nào trong quá khứ.
   - Nút **Undo / Redo** hỗ trợ hoàn tác nhanh khi người chơi đi nhầm.
   - Nút **Tráo bài (Shuffle)**, **Chia bài (Deal)**, **Chỉnh Vàng (+/-)** dành cho trọng tài.
   - Modal hiển thị mã QR kèm URL IP mạng nội bộ.
3. **Mobile Player Web App (`client/index.html`, `client/mobile.js`)**:
   - Tab chuyển đổi giữa **Con đường (Road)**, **Ngôi làng của tôi**, và **Xem làng đối thủ**.
   - Khay bài trên tay (Bottom Sheet) vuốt lướt trực quan, chạm vào thẻ để mở cửa sổ kiểm tra chi tiết, tự động gợi ý vị trí xây dựng và chi phí mở khóa ổ khóa.
   - Hiệu ứng âm thanh chân thực tổng hợp trực tiếp bằng Web Audio API (không phụ thuộc file ngoài).
4. **Tài nguyên hình ảnh & Dữ liệu (`assets/`, `data/`)**:
   - Toàn bộ **164 file ảnh PNG** chất lượng cao từ Yucata (115 thẻ bài, 20 icon, 29 sơ đồ luật chơi).
   - `cards.json`: 110 bản ghi thẻ bài chi tiết.
   - `game_rules.json`: Cấu hình thiết lập bàn chơi theo số lượng 2-4 người.

---

## 🎮 Tóm Tắt Luật Chơi Nhanh

- **Giai đoạn Nháp (Draft Phase)**:
  - Giới hạn nháp: `2 + số biểu tượng Food` (tối đa 5 thẻ).
  - Có thể nháp thẻ ngửa từ Road (lấy kèm các đồng xu nằm trên thẻ) hoặc nháp thẻ úp từ các chồng bài.
  - Hết vòng nháp: Mỗi thẻ còn lại trên Road được đặt thêm 1 đồng xu Vàng.
- **Giai đoạn Xây dựng (Build Phase)**:
  - Giới hạn xây: `2 + số biểu tượng Builder` (tối đa 5 thẻ).
  - Đặt thẻ vào chuỗi sản xuất theo đúng thứ tự (ví dụ: Lumberjack -> Wheeler -> Cartwright).
  - Có thể đổi bài trên tay lấy Dân làng cơ bản (Lumberjack / Hayer / Miner) tối đa 3 lần/vòng.
  - Nếu thẻ có ổ khóa: trả 2 Vàng cho người có chìa khóa (hoặc cho ngân hàng nếu không ai có).
  - Cuối lượt xây: Nếu làng không có Food nào, lật mặt thẻ Founders sang mặt 1 Food.
- **Giai đoạn Chợ lần 1 (Market 1)**:
  - Kích hoạt khi **2 chồng bài đầu tiên** trên Road cạn kiệt.
  - Người chơi nhận Vàng bằng tổng số Vàng in trên các thẻ đỉnh (Top cards) + số xu đặt trên thẻ.
- **Giai đoạn Chợ lần 2 (Market 2)**:
  - Kích hoạt khi **tất cả 6 chồng bài** trên Road cạn kiệt.
  - Nhận Vàng như Chợ 1 + điểm thưởng từ các thẻ Bạc (Silver cards).
  - Người có nhiều Vàng nhất sau Chợ 2 là người chiến thắng!

---

## 🧪 Chạy Kiểm Thử Tự Động

- **Kiểm thử logic Gleam**:
  ```bash
  cd Villagers/engine
  gleam test
  ```
- **Kiểm thử mô phỏng toàn diện (E2E Integration Test)**:
  ```bash
  cd Villagers
  node scripts/simulate_game.js
  ```
