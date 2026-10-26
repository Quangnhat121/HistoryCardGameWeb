# PROJECT CONTEXT — History Card Game Web

> Đây là tài liệu bàn giao chính của dự án. Khi bắt đầu một phiên làm việc mới, hãy đọc toàn bộ file này trước khi sửa mã. Sau mỗi thay đổi về kiến trúc, tính năng, event, biến môi trường hoặc deploy, phải cập nhật lại file này.

## 1. Tổng quan nhanh

- Tên hiển thị: **Dòng Thời Gian**.
- Loại dự án: game thẻ lịch sử nhiều người chơi thời gian thực trên web.
- Ngôn ngữ giao diện: tiếng Việt.
- GitHub: `https://github.com/Quangnhat121/HistoryCardGameWeb.git`.
- Nhánh triển khai: `main`.
- Workspace Windows: `E:\Project\HistoryCardGameWeb`.
- Frontend và backend nằm chung repository nhưng được deploy thành hai Vercel Project riêng.
- Frontend Vercel dashboard: `https://vercel.com/quang-nhats-projects/history-card-game-web`.
- Backend Vercel dashboard: `https://vercel.com/quang-nhats-projects/history-card-game-web-h4s5`.

### Công nghệ chính

| Phần | Công nghệ |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, TypeScript, Express, Socket.IO |
| Database | MongoDB Atlas qua Mongoose |
| Realtime game | Socket.IO/WebSocket |
| Voice | WebRTC mesh, Socket.IO signaling, STUN và Metered TURN |
| Hiệu ứng thẻ | `ascii-reveal`, canvas particles, CSS animation |
| Hosting | Hai project Vercel dùng chung Git repository |
| Test | Vitest cho game engine |

## 2. Phân vùng theo game và nhánh

Trước khi sửa mã, chạy `git branch --show-current` và xác định game được yêu cầu trong prompt. Không mang thay đổi của game này sang game kia nếu người dùng không yêu cầu tích hợp.

### Game 1 — Dòng Thời Gian / Cards

- Là game đang có trên nhánh `main` và đang được deploy production.
- Frontend chính: `client/src/pages/`, `client/src/components/`, `client/src/hooks/useGame.ts` và `client/src/types.ts`.
- Backend luật chơi: `server/src/game/`; phòng, realtime, reconnect, rematch và voice nằm tại `server/src/socket/index.ts`.
- Khi prompt ghi **chỉ sửa Dòng Thời Gian/Cards**, không tạo hoặc chỉnh `client/src/games/catan/`, `server/src/catan/` hay contract socket CATAN.

### Game 2 — CATAN

- CATAN được phát triển riêng trên nhánh `feature/game-hub-catan-local`; source CATAN không có trên `main` tại thời điểm tài liệu này được cập nhật.
- Module riêng trên nhánh đó nằm tại `client/src/games/catan/` và `server/src/catan/`.
- Khi prompt ghi **chỉ sửa CATAN**, không thay đổi luật trong `server/src/game/`, hook `client/src/hooks/useGame.ts` hay các event `room:*`/`game:*` của Dòng Thời Gian.
- Các file tích hợp dùng chung như `client/src/App.tsx`, `client/src/styles.css`, `PROJECT_CONTEXT.md` và `server/src/socket/index.ts` có thể phát sinh conflict khi nhập thay đổi giữa hai nhánh; phải đọc diff và giữ hành vi của cả hai game.

## 3. Cấu trúc thư mục

```text
HistoryCardGameWeb/
├─ client/                         # React/Vite frontend
│  ├─ public/audio/                # Nhạc nền sảnh và trong game
│  ├─ src/
│  │  ├─ components/               # UI dùng lại, thẻ, voice, timer, hiệu ứng
│  │  ├─ hooks/useGame.ts          # State client và Socket.IO game events
│  │  ├─ pages/                    # Lobby, phòng chờ, game, kết quả, luật, kho thẻ
│  │  ├─ App.tsx                   # Điều phối màn hình và component toàn cục
│  │  ├─ socket.ts                 # Socket client, session và URL ảnh
│  │  ├─ sounds.ts                 # Nhạc và hiệu ứng âm thanh
│  │  ├─ styles.css                # Style toàn ứng dụng
│  │  └─ types.ts                  # Kiểu dữ liệu frontend
│  ├─ package.json
│  ├─ vite.config.ts
│  └─ vercel.json
├─ server/                         # Express + Socket.IO backend
│  ├─ public/cards/                # Ảnh WebP/PNG đầy đủ và thumbs
│  ├─ scripts/                     # Socket smoke test, tối ưu ảnh
│  ├─ src/
│  │  ├─ config/                   # Env, MongoDB, cấu hình timer
│  │  ├─ game/                     # GameEngine, viewFor, types và tests
│  │  ├─ models/                   # Card và GameRecord Mongoose models
│  │  ├─ routes/                   # REST API cards và leaderboard
│  │  ├─ seed/                     # Dữ liệu và script seed thẻ
│  │  ├─ services/turn.ts          # Lấy ICE credentials từ Metered
│  │  ├─ socket/index.ts           # Phòng, game, reconnect, rematch, voice signaling
│  │  ├─ createApp.ts              # Express middleware/routes/static files
│  │  └─ server.ts                 # HTTP server + Socket.IO entry point
│  ├─ package.json
│  └─ vercel.json
├─ card/                           # Ảnh nguồn ban đầu, chủ yếu PNG
├─ outputs/                        # File dữ liệu/đầu ra hỗ trợ nội dung
├─ DEPLOY_VERCEL.md                # Hướng dẫn deploy chi tiết
├─ SERVER_PROGRESS.md              # Ghi chú tiến độ backend cũ
└─ PROJECT_CONTEXT.md              # File đang đọc
```

### File cần đọc theo loại công việc

- Sửa luật game: `server/src/game/GameEngine.ts`, `server/src/game/GameEngine.test.ts`.
- Sửa luồng phòng/realtime/rematch: `server/src/socket/index.ts`, `client/src/hooks/useGame.ts`, `client/src/App.tsx`.
- Sửa voice: `client/src/components/VoiceChat.tsx`, `server/src/socket/index.ts`, `server/src/services/turn.ts`.
- Sửa giao diện trận: `client/src/pages/GamePage.tsx` và các component `Card`, `Hand`, `PlayerBar`, `TurnTimer`, `TurnOrderOverlay`.
- Sửa kho thẻ/ASCII: `client/src/pages/CardsPage.tsx`, `client/src/styles.css`.
- Sửa dữ liệu thẻ: `server/src/seed/cards.data.ts`, `server/src/seed/cards.seed.ts`, `server/public/cards/`.
- Sửa deploy/env: `DEPLOY_VERCEL.md`, `client/vercel.json`, `server/src/config/env.ts`.

## 4. Dòng Thời Gian — màn hình và chức năng frontend

### `LobbyPage`

- Nhập tên để tạo phòng mới.
- Nhập tên và mã phòng để tham gia phòng.
- Mở trang luật chơi.
- Mở thư viện thẻ.
- Hiển thị bảng xếp hạng lấy từ backend.

### `WaitingRoomPage`

- Hiển thị mã phòng 5 ký tự.
- Bấm mã để sao chép.
- Nút con mắt dùng để che/hiện mã phòng trên máy hiện tại.
- Hiển thị tối đa 4 người, trạng thái kết nối và nhãn chủ phòng.
- Chỉ chủ phòng được bắt đầu; cần 2–4 người và tất cả đang kết nối.
- Sau một ván, mỗi người tự bấm **Về phòng chờ**.
- Trong lúc chờ rematch:
  - người đã quay về hiển thị `Đã về`;
  - người chưa quay về hiển thị `...`;
  - khi tất cả đã về, backend reset ván và chủ phòng có thể bắt đầu lại.
- Hiệu ứng sáng/viền cho người đang nói qua voice.
- Có nút rời phòng.

### `GamePage`

- Hiển thị timeline thẻ, tay bài, thứ tự lượt và danh sách người chơi.
- Người đến lượt có thể kéo thẻ trên tay và thả trực tiếp vào khe trên timeline; thao tác chọn thẻ/chọn khe bằng nút vẫn được giữ cho bàn phím và accessibility.
- Khu bài trên tay hỗ trợ kéo ngang bằng chuột hoặc cảm ứng để cuộn danh sách, có quán tính giảm dần sau khi thả.
- Timeline bám trực tiếp theo con trỏ khi giữ và kéo ngang; sau khi thả mới tiếp tục trượt theo quán tính giảm dần. Timeline không tự cuộn khi bắt đầu hoặc chuyển lượt và không bắt buộc dùng thanh cuộn.
- Có hành động khui/thách thức thẻ vừa đặt.
- Hiển thị kết quả khui bằng overlay.
- Có timer theo lượt và thông báo người chơi hết giờ.
- Người đang nói qua voice được làm sáng trong thanh người chơi.
- Thẻ có thể phóng to; trên mobile có thể nhấn giữ.
- Thẻ gốc vẫn được gắn nhãn làm mốc tham chiếu chính nhưng bàn không tự động đưa thẻ gốc hoặc thẻ vừa đặt vào giữa màn hình.
- Thẻ mới nhất có hiệu ứng xuất hiện, viền sáng và icon kèm tên người đặt. Client giữ dấu hiệu này qua cả bước khui và chỉ chuyển nó khi một thẻ mới được đặt; quyền khui vẫn lấy từ `game.lastPlaced` của backend nên không thay đổi luật game.

### `ResultPage`

- Hiển thị người thắng, âm thanh thắng/thua và particle effect.
- Mỗi người chơi đều có nút **Về phòng chờ**.
- Không tự động rời phòng khi kết thúc ván.
- Có nút rời phòng nếu người chơi không muốn tiếp tục.

### `CardsPage`

- Tải danh sách thẻ từ `GET /api/cards`.
- Hiển thị thumbnail, tìm kiếm sự kiện không phân biệt dấu tiếng Việt.
- Mốc năm không hiển thị trong thư viện để giữ tính thử thách.
- Khi bấm vào một thẻ, modal lớn dùng `AsciiReveal` với:
  - preset: `dither`;
  - origin/wave from: `center`;
  - duration: `cinematic`.
- Có điều hướng thẻ trước/sau bằng nút và phím mũi tên; ESC để đóng.
- Lưới thẻ bình thường không dùng hiệu ứng ASCII.

### Thành phần toàn cục

- `VoiceChat`: luôn tồn tại khi người dùng còn ở trong phòng, kể cả phòng chờ và màn hình kết quả.
- `ConnectionBanner`: báo khi mất kết nối/đang reconnect.
- `SoundToggle`: bật/tắt âm thanh.
- Nhạc nền đổi giữa chế độ home và game.

## 5. Dòng Thời Gian — luật game hiện tại

- Phòng có từ 2 đến 4 người.
- Khi bắt đầu, thứ tự người chơi được xáo trộn.
- Mỗi người nhận 5 thẻ; một thẻ gốc được lật sẵn trên timeline.
- Mặt trước thẻ cho người chơi biết hình và sự kiện nhưng giấu năm.
- Đến lượt, người chơi đặt một thẻ vào vị trí mà họ cho là đúng theo thời gian.
- Sau khi đặt, lượt chuyển sang người tiếp theo.
- Người đến lượt có thể khui tối đa một lần và chỉ được khui thẻ vừa đặt.
- So sánh thời gian dùng `year`, sau đó dùng `month` nếu cùng năm.
- Nếu khui đúng:
  - thẻ được lật và giữ trên timeline;
  - người thách thức phải bốc một thẻ.
- Nếu khui sai:
  - thẻ bị lấy khỏi timeline;
  - người đã đặt nhận lại thẻ đó và bốc thêm một thẻ.
- Khi một người hết bài sau khi đặt, game chuyển sang `awaiting_verdict`:
  - người kế tiếp khui đúng thì người hết bài thắng;
  - chọn không khui hoặc hết thời gian thì người hết bài thắng;
  - khui sai thì ván tiếp tục.
- Các phase: `turn`, `awaiting_verdict`, `finished`.
- Thời gian lượt thay đổi theo độ dài timeline:
  - tối đa 7 thẻ: 15 giây;
  - 8–16 thẻ: 25 giây;
  - trên 16 thẻ: 35 giây;
  - sau challenge được cộng thêm 3 giây nếu ván chưa kết thúc.
- Kết quả ván được lưu vào MongoDB để tính bảng xếp hạng.

## 6. Dòng Thời Gian — phòng, session, reconnect và rematch

- Backend giữ các phòng trong `Map<string, GameRoom>` tại `server/src/socket/index.ts`.
- Mã phòng dài 5 ký tự, bỏ các ký tự dễ nhầm.
- Frontend lưu `history-player-id` và `history-room-code` trong `localStorage`.
- Hai giá trị này được gửi trong Socket.IO handshake để reconnect.
- Thời gian chờ reconnect hiện là 60 giây. Sau đó người chơi bị xóa khỏi phòng.
- Nếu chủ phòng rời, quyền chủ phòng chuyển cho người đầu tiên còn lại.
- Nếu phòng không còn ai, phòng và timer bị xóa.
- Khi reconnect vào ván đã kết thúc, server gửi lại cả game state và kết quả thắng nếu người đó chưa bấm về phòng.

### Luồng rematch

1. Ván kết thúc nhưng `GameRoom` và danh sách người chơi vẫn tồn tại.
2. Mỗi người bấm `Về phòng chờ`, client emit `room:rematch`.
3. Backend đặt `returnedToRoom = true` cho riêng người đó.
4. Người đó thấy `WaitingRoomPage`; những người khác có thể vẫn ở `ResultPage`.
5. Phòng chờ hiển thị `Đã về` hoặc `...` cho từng thành viên.
6. Khi mọi thành viên còn trong phòng đều đã về, backend xóa engine/timer cũ và trả phòng về trạng thái sẵn sàng.
7. Chủ phòng có thể bắt đầu ván tiếp theo với cùng mã phòng.

## 7. Dòng Thời Gian — Socket.IO contract

### Client → server

| Event | Payload | Ý nghĩa |
| --- | --- | --- |
| `room:create` | `{ name }` | Tạo phòng |
| `room:join` | `{ code, name }` | Vào phòng chưa bắt đầu |
| `room:start` | không | Chủ phòng bắt đầu ván |
| `room:rematch` | không | Người hiện tại quay về phòng chờ |
| `room:leave` | không | Rời phòng |
| `game:place` | `{ cardId, index }` | Đặt thẻ vào timeline |
| `game:challenge` | `{ cardId }` | Khui thẻ vừa đặt |
| `game:skipChallenge` | không | Không khui thẻ cuối |
| `voice:getConfig` | không | Yêu cầu ICE servers |
| `voice:ready` | không | Báo sẵn sàng thiết lập peer |
| `voice:offer` | `{ targetPlayerId, description }` | Chuyển SDP offer |
| `voice:answer` | `{ targetPlayerId, description }` | Chuyển SDP answer |
| `voice:ice` | `{ targetPlayerId, candidate }` | Chuyển ICE candidate |

### Server → client

| Event | Dữ liệu/ý nghĩa |
| --- | --- |
| `room:update` | Mã phòng, host, self ID, trạng thái bắt đầu, danh sách người chơi và `returnedToRoom` |
| `game:state` | Game view đã che bài của người khác |
| `game:challengeResult` | Kết quả đúng/sai, năm/tháng và người phải bốc |
| `game:over` | Tên người thắng |
| `game:turnTimeout` | Người vừa hết giờ |
| `error` | Lỗi phòng/game cho UI |
| `voice:config` | Danh sách ICE servers |
| `voice:ready/offer/answer/ice/left` | WebRTC signaling |
| `voice:error` | Lỗi riêng của voice |

## 8. Hạ tầng chung — voice chat

- Voice dùng WebRTC dạng mesh: mỗi trình duyệt tạo `RTCPeerConnection` với từng người còn lại.
- Socket.IO chỉ làm signaling; audio đi trực tiếp hoặc qua TURN.
- Voice tắt mặc định khi vào phòng; trình duyệt chỉ xin quyền microphone bằng `getUserMedia` sau khi người chơi chủ động bấm **Bật voice**.
- Hai nút luôn hiển thị trong phòng:
  - microphone: mute/unmute local track;
  - tai nghe: bật/tắt tiếng remote audio trên máy hiện tại.
- Trước khi voice được bật, nút microphone hiển thị trạng thái tắt và nút tai nghe chưa hoạt động.
- Khi không được cấp quyền microphone, nút mic báo trạng thái lỗi.
- Speaking detection dùng Web Audio API phân tích mức âm lượng local và remote stream.
- ID người đang nói được truyền lên `App`, sau đó dùng để làm sáng người tương ứng trong phòng chờ và trận đấu.
- ICE ưu tiên credentials động từ Metered. Nếu gọi Metered thất bại, backend fallback về cấu hình STUN/TURN tĩnh.

## 9. Dòng Thời Gian — REST API và dữ liệu

### Endpoints

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| GET | `/health` | Trả `{ "status": "ok" }` |
| GET | `/api/cards` | Danh sách thẻ gồm `cardId`, `image`, `event`; không trả năm |
| GET | `/api/leaderboard` | Top 10 người thắng theo số ván |
| GET | `/cards/...` | Static card images từ `server/public/cards` |

### MongoDB collections

- `Card`:
  - `cardId`: số duy nhất;
  - `image`: đường dẫn ảnh;
  - `event`: tên sự kiện;
  - `year`: số, năm TCN dùng số âm;
  - `month`: tùy chọn, từ 1 đến 12.
- `GameRecord`:
  - `roomCode`, `players`, `winner`, `startedAt`, `endedAt`, `totalTurns`.

### Ảnh thẻ

- Ảnh nguồn nằm trong `card/`.
- Ảnh phục vụ web nằm trong `server/public/cards/`.
- Bản đầy đủ ưu tiên WebP; thumbnail nằm trong `server/public/cards/thumbs/`.
- `client/src/socket.ts` tự đổi đường dẫn `.png` thành `.webp` khi tải.
- Script tối ưu: `npm run optimize:images` trong thư mục `server`.

## 10. Hạ tầng chung — biến môi trường

Không ghi giá trị secret thật vào Git hoặc file này.

### Backend

| Biến | Bắt buộc | Mục đích |
| --- | --- | --- |
| `MONGO_URI` | Có | MongoDB Atlas connection string |
| `CLIENT_ORIGIN` | Có khi deploy | Một hoặc nhiều frontend origin, phân cách bằng dấu phẩy |
| `PORT` | Local | Mặc định 3000 |
| `METERED_TURN_DOMAIN` | Khuyên dùng | Domain dạng `*.metered.live` |
| `METERED_TURN_API_KEY` | Khuyên dùng | API key lấy credentials động |
| `METERED_TURN_REGION` | Không | Mặc định `global` |
| `STUN_URLS` | Không | Danh sách STUN fallback, phân cách dấu phẩy |
| `TURN_URLS` | Không | TURN tĩnh fallback |
| `TURN_USERNAME` | Khi dùng TURN tĩnh | Username TURN |
| `TURN_CREDENTIAL` | Khi dùng TURN tĩnh | Credential TURN |

### Frontend

| Biến | Mục đích |
| --- | --- |
| `VITE_SERVER_URL` | Public URL của backend |
| `VITE_SOCKET_PATH` | Thường là `/socket.io` |

## 11. Chạy local

Yêu cầu Node.js phù hợp với `package.json` và MongoDB URI hợp lệ.

```powershell
# Terminal 1 — backend
cd E:\Project\HistoryCardGameWeb\server
npm install
$env:MONGO_URI="<MongoDB URI>"
$env:CLIENT_ORIGIN="http://localhost:5173"
npm run dev

# Terminal 2 — frontend
cd E:\Project\HistoryCardGameWeb\client
npm install
$env:VITE_SERVER_URL="http://localhost:3000"
$env:VITE_SOCKET_PATH="/socket.io"
npm run dev
```

Mở frontend Vite, thường là `http://localhost:5173`. Để test multiplayer/voice, dùng hai profile trình duyệt hoặc hai thiết bị.

### Seed dữ liệu thẻ

```powershell
cd E:\Project\HistoryCardGameWeb\server
$env:MONGO_URI="<MongoDB URI>"
npm run seed
```

Lưu ý: seed thay toàn bộ collection thẻ.

## 12. Kiểm tra trước khi push

```powershell
cd E:\Project\HistoryCardGameWeb\client
npm run build

cd E:\Project\HistoryCardGameWeb\server
npm test -- --run
npm run build
```

- Client build gồm TypeScript và Vite production build.
- Backend hiện có 12 test cho `GameEngine`.
- Có thể chạy socket smoke test bằng `npm run test:socket` khi backend/database test đã sẵn sàng; script này có thể tạo game record nên không chạy bừa trên production.
- Sau khi build frontend, `client/tsconfig.app.tsbuildinfo` có thể bị thay đổi. Đây là build artifact đang được Git track; không đưa thay đổi ngoài ý muốn vào commit.

## 13. Deploy

- Push lên `main` kích hoạt hai Vercel deployments.
- Backend project dùng root directory `server`.
- Frontend project dùng root directory `client`.
- Frontend build: `npm run build`, output `dist`.
- Sau deploy phải kiểm tra cả hai Vercel status, không chỉ một project.
- Health check backend: `https://<backend-domain>/health`.
- Hướng dẫn đầy đủ nằm trong `DEPLOY_VERCEL.md`.

### Hạn chế production quan trọng

- Room state, `GameEngine` và timer hiện nằm trong RAM của một Node process.
- Vercel có thể tạo nhiều Function instance hoặc thay instance khi reconnect.
- Vì vậy kiến trúc hiện tại phù hợp demo/lưu lượng thấp nhưng chưa bảo đảm đồng nhất ở quy mô production.
- Hướng nâng cấp đúng: lưu room/game state và timer trong Redis, dùng Socket.IO Redis adapter/pub-sub, và chạy realtime backend trên môi trường hỗ trợ WebSocket lâu dài.
- WebRTC mesh phù hợp tối đa 4 người hiện tại; nếu tăng số người đáng kể nên cân nhắc SFU.

## 14. Quy ước và lưu ý khi sửa

- Backend là nguồn sự thật cho luật game; không tin dữ liệu hành động từ client.
- `viewFor` phải tiếp tục che tay bài của người chơi khác.
- Không đưa `year/month` vào API thư viện thẻ nếu vẫn muốn giữ bí mật mốc thời gian.
- Không làm ASCII reveal cho toàn bộ lưới `CardsPage`; chỉ dùng khi mở ảnh/thẻ lớn.
- Voice controls phải tồn tại trong toàn bộ thời gian người dùng còn ở phòng.
- Khi sửa danh sách người chơi, phải xét host transfer, disconnect grace, voice peer cleanup và rematch status.
- Khi sửa rematch, không gọi `leaveRoom`; phải giữ nguyên room code và player list.
- Không hardcode TURN secret/API key vào frontend: frontend chỉ nhận ICE config qua `voice:config`.
- Giữ UI responsive và hỗ trợ bàn phím/ARIA cho modal, nút và điều khiển voice.
- Không xóa hoặc ghi đè thay đổi không liên quan trong working tree.

## 15. Dòng Thời Gian — trạng thái tính năng hiện tại

- [x] Tạo/vào/rời phòng bằng mã 5 ký tự.
- [x] 2–4 người chơi, chủ phòng bắt đầu game.
- [x] Luật đặt thẻ theo dòng thời gian, khui đúng/sai và chiến thắng.
- [x] Timer động và xử lý hết giờ phía server.
- [x] Reconnect bằng session lưu trong localStorage.
- [x] MongoDB cards và game records.
- [x] Leaderboard top 10.
- [x] Kho thẻ, tìm kiếm, thumbnail và modal lớn.
- [x] ASCII reveal `dither`, wave từ `center` khi mở thẻ trong kho.
- [x] Nhạc nền, sound effects, particle effects.
- [x] WebRTC voice, mic/headphone controls, Metered TURN fallback.
- [x] Làm sáng người đang nói ở phòng chờ và trong trận.
- [x] Kết thúc ván vẫn giữ phòng để chơi tiếp.
- [x] Mỗi người tự quay về phòng; trạng thái `Đã về`/`...`.
- [x] Che/hiện mã phòng trong phòng chờ.
- [ ] Redis/shared state cho production nhiều instance.
- [ ] Test tự động cấp socket/UI cho toàn bộ luồng multiplayer và rematch.

## 16. Mốc Git gần nhất khi tạo tài liệu

- `0aa246c feat: let each player return for rematch`
- `b11fed0 feat: keep room open for rematches`
- `47b3663 feat: highlight active voice speakers`
- `fb447f2 feat: switch voice relay to Metered TURN`

Mục này chỉ là mốc tham khảo. Luôn dùng `git log -5 --oneline` và `git status --short --branch` để biết trạng thái thật trước khi làm việc.
