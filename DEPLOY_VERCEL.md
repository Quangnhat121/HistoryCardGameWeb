# Deploy Dòng Thời Gian lên Vercel

Repo này được deploy thành **hai Vercel Project** dùng chung một Git repository.

## 1. Backend

1. Trong Vercel Dashboard, chọn **Add New → Project** và import repository.
2. Đặt **Root Directory** là `server`.
3. Vercel sẽ đọc `server/vercel.json` và nhận diện Express.
4. Thêm Environment Variables cho Production và Preview:

   - `MONGO_URI`: chuỗi kết nối MongoDB Atlas.
   - `CLIENT_ORIGIN`: URL frontend, không có dấu `/` cuối. Có thể khai báo nhiều URL cách nhau bằng dấu phẩy.

5. Bật **Fluid Compute** trong Settings → Functions nếu project Vercel cũ chưa bật.
6. Deploy và kiểm tra `https://<backend-domain>/health` trả về `{ "status": "ok" }`.
7. Seed 51 thẻ vào database production từ máy local:

   ```powershell
   $env:MONGO_URI="<MongoDB Atlas URI>"
   npm run seed
   ```

   Chạy lệnh trong thư mục `server`. Seed sẽ thay toàn bộ collection thẻ.

## 2. Frontend

1. Import lại cùng repository thành một Vercel Project mới.
2. Đặt **Root Directory** là `client`.
3. Thêm Environment Variables:

   - `VITE_SERVER_URL=https://<backend-domain>`
   - `VITE_SOCKET_PATH=/socket.io`

4. Deploy frontend.
5. Quay lại backend, cập nhật `CLIENT_ORIGIN` thành domain frontend thực tế rồi redeploy backend.

## 3. Kiểm tra sau deploy

- Mở frontend trên hai trình duyệt hoặc hai thiết bị.
- Tạo phòng ở thiết bị thứ nhất và vào phòng từ thiết bị thứ hai.
- Bắt đầu game, đặt/khui thẻ và chờ thử một lượt hết giờ.
- Kiểm tra ảnh thẻ được tải từ `https://<backend-domain>/cards/...`.

## Lưu ý về Socket.IO trên Vercel

Vercel hỗ trợ WebSocket nhưng mỗi kết nối chỉ tồn tại tối đa theo thời lượng Function; cấu hình hiện tại dùng 300 giây để tương thích Hobby. Client đã tự reconnect.

Hiện trạng phòng chơi và timer vẫn được giữ trong RAM (`rooms` Map). Vercel không đảm bảo các kết nối mới hoặc reconnect sẽ vào cùng một Function instance. Vì vậy cấu hình này phù hợp để deploy thử nghiệm/lưu lượng thấp, nhưng chưa bảo đảm nhiều instance. Muốn production ổn định cần chuyển room/game state và timer sang Redis, đồng thời dùng Redis adapter/pub-sub cho Socket.IO.
