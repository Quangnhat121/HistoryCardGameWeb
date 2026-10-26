# Kế hoạch chuyển trạng thái realtime Cards sang Redis

> Trạng thái: tài liệu chuẩn bị, chưa triển khai.
>
> Phạm vi: chỉ game **Dòng Thời Gian / Cards**. Không thay đổi module CATAN, luật chơi, dữ liệu thẻ hoặc dữ liệu production trong quá trình lập kế hoạch.

## 1. Lý do cần chuyển

Backend hiện giữ `GameRoom`, `GameEngine` và timer trong `Map`/RAM của một Node process. Khi Vercel tạo nhiều instance, hai người chơi có thể kết nối vào hai instance khác nhau. Instance của người tham gia sẽ không nhìn thấy phòng được tạo ở instance còn lại, hoặc không có cùng trạng thái trận đấu.

Client hiện tự reconnect và thử join lại tối đa 3 lần khi nhận `ROOM_NOT_FOUND`. Đây chỉ là biện pháp giảm lỗi tạm thời, không phải giải pháp đảm bảo tính nhất quán.

Mục tiêu của migration:

- Mọi instance đọc và ghi cùng một trạng thái phòng/trận.
- Socket.IO có thể phát sự kiện tới người chơi đang kết nối ở instance khác.
- Hành động game được xử lý nguyên tử, không ghi đè lẫn nhau.
- Reconnect, timeout và rematch không phụ thuộc vào vòng đời một instance.

## 2. Thành phần giữ nguyên

- React, TypeScript, Vite và giao diện Cards.
- Luật trong `server/src/game/GameEngine.ts`.
- MongoDB/Mongoose cho thẻ, lịch sử trận và leaderboard.
- Socket event công khai hiện tại nếu không thực sự cần thay đổi contract.
- Voice WebRTC; Socket.IO vẫn chỉ làm signaling.
- Cơ chế che bài của người khác trong `viewFor`.

## 3. Thành phần cần bổ sung

- Một dịch vụ Redis dùng chung, ví dụ Upstash Redis hoặc Redis Cloud.
- Redis client cho backend.
- Socket.IO Redis adapter với hai kết nối publish/subscribe riêng.
- Repository/service quản lý room state thay cho việc truy cập trực tiếp `rooms: Map`.
- Cơ chế khóa phân tán hoặc optimistic concurrency bằng `version`.
- Cơ chế xử lý deadline/timeout có thể phục hồi sau restart.

Không ghi URL, token hoặc password Redis vào source code. Chỉ cấu hình bằng biến môi trường server.

## 4. Dữ liệu cần lưu trong Redis

### Room state

Khóa gợi ý: `cards:room:{roomCode}`.

- `code`
- `hostId`
- `players`: ID, tên, trạng thái kết nối, thời điểm disconnect, trạng thái rematch
- `startedAt`
- `recordSaved`
- `version`
- trạng thái game đã serialize

Không lưu `socketId` như định danh bền vững. Socket ID chỉ dùng cho kết nối hiện tại và được ánh xạ riêng.

### Session và kết nối

- `cards:session:{playerId}` → room code, TTL reconnect
- `cards:socket:{playerId}` → socket ID hiện tại, TTL ngắn
- Presence phải cập nhật khi connect, disconnect, leave và reconnect.

### TTL

- Phòng chờ/trận đang chơi cần TTL được gia hạn mỗi khi có hoạt động.
- Session disconnect giữ tối thiểu bằng thời gian reconnect hiện tại.
- Phòng rỗng phải được xóa ngay hoặc hết hạn nhanh.
- Không để room/game key tồn tại vô hạn sau khi mọi người đã rời.

## 5. Serialize `GameEngine`

Không lưu trực tiếp class instance vào Redis. Cần thêm API rõ ràng:

- `GameEngine.fromState(state, dependencies)` để phục hồi engine.
- `engine.exportState()` trả về dữ liệu JSON thuần.
- Kiểm tra schema/version trước khi phục hồi.
- Không serialize `NodeJS.Timeout`, function hoặc socket.

Các trường ngày giờ phải lưu dạng epoch milliseconds. Mọi deadline tiếp tục do server quyết định.

## 6. Đồng thời và tính nguyên tử

Mỗi hành động thay đổi phòng/trận phải theo chu trình:

1. Khóa room hoặc đọc kèm `version`.
2. Đọc state mới nhất từ Redis.
3. Xác thực membership, lượt và payload.
4. Phục hồi `GameEngine` và thực thi đúng một action.
5. Ghi state mới với `version + 1`.
6. Nhả khóa.
7. Phát room/game view cho người chơi.

Các action cần bảo vệ:

- create/join/leave/reconnect;
- start/rematch;
- place/challenge/skip challenge;
- timeout;
- host transfer;
- disconnect cleanup.

Không được giữ distributed lock trong lúc gọi API chậm hoặc ghi MongoDB nếu có thể tách công việc ra sau khi đã commit state.

## 7. Socket.IO Redis adapter

Adapter giải quyết việc broadcast giữa các instance nhưng không tự đồng bộ `GameEngine`. Cần cả hai phần:

- Redis adapter cho `io.to(roomCode).emit(...)` và socket room membership.
- Redis room/game repository làm nguồn sự thật của trạng thái.

Không chỉ cài adapter rồi tiếp tục dùng `rooms: Map`, vì handler ở instance khác vẫn không tìm thấy phòng.

## 8. Timer lượt chơi

Không lưu `setTimeout` trong Redis. Lưu `turnDeadline` trong game state.

Phương án đề xuất cho giai đoạn đầu:

- Sau mỗi action, lập lịch timer local dựa trên deadline.
- Callback timer phải lấy lock, đọc state Redis và kiểm tra deadline/version lại.
- Chỉ instance thắng lock được xử lý timeout.
- Khi instance restart hoặc reconnect, nếu deadline đã quá hạn thì xử lý timeout ngay trong lần đọc/action tiếp theo.

Giai đoạn nâng cao có thể dùng delayed job/queue, nhưng chưa cần thêm nếu tải còn thấp.

## 9. Lưu lịch sử trận

- Redis giữ cờ/idempotency key để chỉ ghi `GameRecord` một lần.
- Ghi MongoDB sau khi state đã chuyển sang `finished`.
- Nếu MongoDB lỗi, không được làm hỏng room state; cần retry có giới hạn.
- Có unique/idempotency identifier cho mỗi ván để tránh record trùng khi nhiều instance cùng quan sát kết thúc.

## 10. Biến môi trường dự kiến

Tên chính xác chọn theo Redis provider, nhưng nên chuẩn hóa phía ứng dụng:

```text
REDIS_URL
REDIS_TOKEN          # chỉ khi provider yêu cầu
REDIS_KEY_PREFIX     # ví dụ history-card-game:production
```

- Không commit giá trị thật.
- Tách prefix local/staging/production.
- Validate cấu hình khi server khởi động.
- Không gửi credential Redis xuống frontend.

## 11. Lộ trình triển khai an toàn

### Giai đoạn 1 — Chuẩn bị engine

- Thêm export/import state có test round-trip.
- Thêm `version` và game ID.
- Không đổi hành vi socket hiện tại.

### Giai đoạn 2 — Redis repository

- Tạo interface room repository.
- Viết bản Redis và bản in-memory cho test/local fallback.
- Chuyển create/join/leave/reconnect trước.

### Giai đoạn 3 — Socket adapter

- Cấu hình Redis adapter.
- Kiểm tra broadcast giữa hai server process local.
- Kiểm tra voice signaling qua hai process.

### Giai đoạn 4 — Game actions và timer

- Chuyển start/place/challenge/skip/timeout/rematch.
- Thêm lock/version và idempotency.
- Không cho frontend tự quyết định state.

### Giai đoạn 5 — Staging và rollout

- Deploy lên môi trường staging/prefix Redis riêng.
- Chạy test nhiều process và test reconnect.
- Chỉ chuyển production sau khi staging ổn định.
- Giữ khả năng rollback về commit cũ; không xóa dữ liệu MongoDB.

## 12. Kiểm thử bắt buộc

- Người A tạo phòng ở process 1, người B join từ process 2.
- Tạo nhầm phòng, leave, rồi join phòng khác.
- Host disconnect/reconnect và host transfer.
- Hai action đồng thời trên cùng một lượt: chỉ một action thành công.
- Timeout chỉ chạy một lần dù hai process cùng lập lịch.
- Đặt thẻ, khui, skip challenge và kết thúc trận qua hai process.
- Rematch khi người chơi ở nhiều process.
- Instance restart giữa trận rồi phục hồi state.
- Phòng rỗng và session hết hạn được dọn đúng TTL.
- Voice offer/answer/ICE đi qua hai process.
- Không lộ tay bài, secret hoặc Redis credential.

## 13. Tiêu chí hoàn thành

- Không còn phụ thuộc vào `rooms: Map` trong production path.
- Hai backend process chạy đồng thời vẫn dùng chung phòng/trận.
- Không cần client retry để tìm đúng instance; có thể giữ retry chỉ cho lỗi mạng tạm thời.
- Tất cả test engine cũ vẫn đạt.
- Có integration test multi-process cho create/join/game/reconnect/rematch.
- Có tài liệu env, staging, rollback và quy trình kiểm tra sau deploy.

## 14. Việc không làm trong migration này

- Không thay luật Cards.
- Không thay dữ liệu thẻ hoặc leaderboard hiện có.
- Không thay đổi CATAN.
- Không seed/xóa dữ liệu production.
- Không hardcode secret.
- Không deploy production trước khi có Redis staging và test multi-process.
