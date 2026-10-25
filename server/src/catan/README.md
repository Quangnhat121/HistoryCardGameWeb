# CATAN base-game engine

Nguồn luật chính: [CATAN - Game Rules](https://www.catan.com/understand-catan/game-rules), mục base game 3-4 players. Module này không chứa luật Seafarers, Cities & Knights, extension 5-6 người hoặc biến thể hai người.

## Quyết định luật đã mã hóa

- Board có 19 land hex, 54 intersections, 72 edges, 30 coastal edges và 9 harbors. ID logic dùng axial/corner coordinates, không dùng pixel.
- Random board luôn giữ đúng túi terrain/number token và không đặt 6 cạnh 8. Fixed board dùng topology và phân bố ổn định cho test.
- Setup dùng thứ tự tiến rồi ngược; settlement thứ hai cấp tài nguyên ban đầu.
- Sau khi roll, engine cho phép trade và build xen kẽ. Đây là Combined Trade/Build Phase được rulebook base game khuyến nghị cho người chơi có kinh nghiệm, không phải luật expansion.
- Khi ngân hàng thiếu một loại tài nguyên cho nhiều người, không ai nhận loại đó. Nếu chỉ một người bị ảnh hưởng, họ nhận phần ngân hàng còn lại.
- Domestic trade luôn phải có người đang tới lượt là một bên. Người khác có thể gửi counteroffer cho người đang tới lượt.
- Longest Road là longest edge trail, không tái sử dụng cạnh và không đi xuyên settlement/city đối thủ. Chủ danh hiệu hiện tại giữ khi hòa; nếu chủ cũ không còn đồng hạng dẫn đầu và nhiều người mới hòa nhau, danh hiệu được đặt sang bên.
- Victory-point development cards luôn ẩn trong public view. Engine chỉ tuyên bố thắng khi người đạt ít nhất 10 điểm đang trong lượt của mình.

## Ranh giới hiện tại

- `CatanEngine` là nguồn sự thật và trả state clone; caller không sửa trực tiếp state nội bộ.
- Action sai ném `CatanRuleError` có `code` ổn định và optional `details`.
- Socket namespace `/catan` hiện chỉ tạo phòng, khởi tạo engine và phát view. Chưa ánh xạ các action engine thành multiplayer events.
- Frontend CATAN hiện là màn hình nền tảng; không được xem là UI hoàn chỉnh cho toàn bộ luật engine.
