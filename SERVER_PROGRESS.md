# Tiến trình backend History Card Game

## Trạng thái hiện tại

- Đã khởi tạo backend Node.js + Express + TypeScript trong `server/`.
- Đã cấu hình MongoDB bằng Mongoose và biến môi trường `MONGO_URI`, `PORT`, `CLIENT_ORIGIN`.
- Đã tạo model `Card` gồm `cardId`, `image`, `event`, `year`.
- Đã tạo seed idempotent: xóa toàn bộ thẻ cũ rồi chèn lại dữ liệu từ `cards.data.ts`.
- Đã thêm kiểm tra/cảnh báo thẻ trùng năm hoặc cách nhau dưới 2 năm.
- Đã tạo `GET /api/cards`; kết quả chỉ có `cardId`, `image`, `event`, tuyệt đối không có `year`.
- Đã phục vụ ảnh trong `server/public/cards/` qua URL `/cards/<tên-file>`.
- Đã khởi tạo Socket.IO với CORS theo `CLIENT_ORIGIN`.
- Đã hoàn thiện phòng realtime trong bộ nhớ, mã phòng 5 ký tự, host/start/place/challenge/leave và reconnect trong 60 giây.
- Mọi `game:state` được lọc riêng bằng `viewFor`; server không phát state nội bộ chứa năm bí mật.
- Đã thêm model `GameRecord`, lưu kết quả khi kết thúc và API `GET /api/leaderboard`.
- Đã thêm `npm run test:socket` mô phỏng hai client chơi trọn ván; smoke test thành công ngày 20/10/2026.
- Đã khởi tạo frontend React + Vite + TypeScript + Tailwind trong `client/`.
- Frontend có sảnh, leaderboard, phòng chờ, bàn chơi responsive, lật thẻ CSS 3D, hiệu ứng khui đúng/sai, kết quả và tự reconnect bằng localStorage.
- Tương tác khui gồm chọn thẻ vừa đặt rồi bấm nút `Khui thẻ`; sau khi khui nút bị khóa và hiển thị yêu cầu đặt thẻ để kết thúc lượt.
- Khi khui sai, client trì hoãn áp dụng state mới để chạy hiệu ứng thẻ lật/bay khỏi hàng trước khi timeline khép lại.
- UI thẻ đã được phóng lớn; hệ font được thống nhất cho tiếng Việt. Timeline canh giữa thẻ gốc khi hàng ngắn và có scrollbar ngang rõ ràng khi hàng vượt màn hình.
- Thẻ được tăng kích thước thêm và có modal phóng to khi bấm; hỗ trợ đóng bằng nền tối, nút × hoặc phím ESC mà vẫn giữ hành động chọn thẻ.
- UX xem thẻ đã đổi: click vùng thẻ chỉ chọn để chơi; tên sự kiện luôn hiện bên dưới; desktop hover phóng nhẹ, nút kính lúp mở modal và mobile nhấn giữ 0,45 giây để xem lớn.
- Frontend `npm run typecheck` và `npm run build` đã chạy thành công ngày 20/10/2026; preview trả HTTP 200.
- `npm run typecheck` và `npm run build` đã chạy thành công ngày 20/10/2026.

## Dữ liệu thẻ

- Hiện có 34/50 ảnh được cung cấp trong thư mục gốc `card/`.
- Seed hiện chứa 34 thẻ, `cardId` từ 1 đến 34.
- Còn thiếu 16 thẻ. Khi có ảnh mới, chép chúng vào `server/public/cards/`, thêm dữ liệu vào `server/src/seed/cards.data.ts`, rồi chạy lại `npm run seed`.
- Quy ước năm TCN là số âm.
- Các sự kiện kéo dài nhiều năm dùng năm bắt đầu và có comment cạnh dữ liệu.
- Không có cặp thẻ nào trùng năm hoặc cách nhau dưới 2 năm trong 34 thẻ hiện tại.

## Nguồn năm đã đối chiếu

- Wikipedia: các trang sự kiện tương ứng và các trang niên biểu liên quan.
- Các mốc cổ đại được coi là xấp xỉ khi Wikipedia cũng chỉ đưa niên đại quy ước/ước tính, gồm Sumer khoảng 3500 TCN, Vương triều thứ nhất Ai Cập khoảng 3150 TCN và Kim tự tháp Khufu khoảng 2560 TCN.
- Olympic cổ đại dùng mốc truyền thống 776 TCN.
- Đại suy thoái dùng năm bắt đầu 1929.

## Chạy dự án

1. Vào thư mục `server/` và chạy `npm install`.
2. Sao chép `.env.example` thành `.env`, sau đó sửa `MONGO_URI` nếu cần.
3. Chạy `npm run seed` để nạp dữ liệu.
4. Chạy `npm run dev` để mở server phát triển.
5. Kiểm tra `GET http://localhost:3000/health` và `GET http://localhost:3000/api/cards`.

## Việc còn lại ở bước sau

- Bổ sung 16 ảnh và 16 bản ghi để đủ 50 thẻ.
- Logic game server-authoritative đã hoàn thành trong `server/src/game/`: chia bài, chèn thẻ theo vị trí, khui thẻ, bốc phạt, phán quyết thẻ cuối và lọc view theo người chơi.
- Logic lượt đã đổi sang 2 bước: tùy chọn khui rồi bắt buộc đặt; chỉ đặt mới chuyển lượt.
- Bàn chơi dùng một `timeline`, cho chèn thẻ bằng `index` ở mọi khe; khui không đổi `currentPlayerIndex`.
- Đã thêm phase `turn`, `awaiting_verdict`, `finished` và action `game:skipChallenge` cho thẻ cuối.
- Đã có 7 unit test Vitest cho luật mới; `npm test`, type-check/build server và client đều chạy thành công ngày 20/10/2026.
- Realtime đã nối với MongoDB và GameEngine; phòng hiện chỉ lưu trong RAM nên sẽ mất khi server khởi động lại.
- Chưa kiểm tra trực quan bằng browser vì phiên làm việc không có browser/UI surface khả dụng; build và HTTP preview đã được xác minh.
