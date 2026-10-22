// Năm lấy từ Wikipedia, dữ liệu có thể không chính xác tuyệt đối

export interface CardSeedData {
  cardId: number;
  image: string;
  event: string;
  year: number;
  month?: number;
}

export const cardsData: CardSeedData[] = [
  { cardId: 1, image: "/cards/Ba Tư chiếm Babylon – 539 TCN.png", event: "Ba Tư chiếm Babylon", year: -539 },
  { cardId: 2, image: "/cards/Bức tường Berlin sụp đổ - 1989.png", event: "Bức tường Berlin sụp đổ", year: 1989, month: 11 },
  { cardId: 3, image: "/cards/Cách mạng Pháp bùng nổ (Phá ngục Bastille) - 1789.png", event: "Cách mạng Pháp bùng nổ (Phá ngục Bastille)", year: 1789 },
  { cardId: 4, image: "/cards/Cách mạng Tháng Mười Nga thành công - 1917.png", event: "Cách mạng Tháng Mười Nga thành công", year: 1917 },
  { cardId: 5, image: "/cards/Chiến tranh thế giới thứ hai bùng nổ 1939.png", event: "Chiến tranh thế giới thứ hai bùng nổ", year: 1939 },
  { cardId: 6, image: "/cards/Chiến tranh thế giới thứ nhất bùng nổ - 1914.png", event: "Chiến tranh thế giới thứ nhất bùng nổ", year: 1914, month: 7 },
  { cardId: 7, image: "/cards/Christopher Columbus tìm ra châu Mỹ - 1492.png", event: "Christopher Columbus đến châu Mỹ", year: 1492 },
  { cardId: 8, image: "/cards/Cuộc chinh phục nước Anh của người Norman - 1066.png", event: "Cuộc chinh phục nước Anh của người Norman", year: 1066 },
  // Đại suy thoái kéo dài nhiều năm; lấy năm bắt đầu.
  { cardId: 9, image: "/cards/Cuộc đại suy thoái kinh tế toàn cầu bắt đầu.png", event: "Cuộc Đại suy thoái kinh tế toàn cầu bắt đầu", year: 1929 },
  { cardId: 10, image: "/cards/Cuộc Minh Trị Duy tân bắt đầu tại Nhật Bản - 1868.png", event: "Cuộc Minh Trị Duy tân bắt đầu tại Nhật Bản", year: 1868 },
  // Thời kỳ Angkor kéo dài nhiều thế kỷ; lấy năm bắt đầu.
  { cardId: 11, image: "/cards/Đế quốc Khmer bắt đầu thời Angkor – 802.png", event: "Đế quốc Khmer bắt đầu thời Angkor", year: 802 },
  { cardId: 12, image: "/cards/Đế quốc La Mã chia Đông – Tây – 395.png", event: "Đế quốc La Mã chia Đông – Tây", year: 395 },
  { cardId: 13, image: "/cards/Đế quốc Ottoman đánh chiếm Constantinople, Byzantine sụp đổ - 1453.png", event: "Đế quốc Ottoman đánh chiếm Constantinople, Byzantine sụp đổ", year: 1453 },
  { cardId: 14, image: "/cards/Đế quốc Tây La Mã sụp đổ - 476.png", event: "Đế quốc Tây La Mã sụp đổ", year: 476 },
  { cardId: 15, image: "/cards/Galileo Galilei lần đầu dùng kính viễn vọng quan sát thiên văn - 1609.png", event: "Galileo Galilei lần đầu dùng kính viễn vọng quan sát thiên văn", year: 1609 },
  { cardId: 16, image: "/cards/Hoa Kỳ công bố Tuyên ngôn Độc lập - 1776.png", event: "Hoa Kỳ công bố Tuyên ngôn Độc lập", year: 1776 },
  { cardId: 17, image: "/cards/Julius Caesar bị ám sát tại La Mã - 44 TCN.png", event: "Julius Caesar bị ám sát tại La Mã", year: -44 },
  { cardId: 18, image: "/cards/Kim tự tháp Khufu hoàn thành – 2560 TCN.png", event: "Kim tự tháp Khufu hoàn thành", year: -2560 },
  { cardId: 19, image: "/cards/Liên bang Xô viết (Liên Xô) chính thức tan rã - 1991.png", event: "Liên bang Xô viết (Liên Xô) chính thức tan rã", year: 1991 },
  { cardId: 20, image: "/cards/Liên Xô phóng vệ tinh nhân tạo đầu tiên (Sputnik 1) - 1957.png", event: "Liên Xô phóng vệ tinh nhân tạo đầu tiên (Sputnik 1)", year: 1957 },
  { cardId: 21, image: "/cards/Magellan bắt đầu chuyến đi vòng quanh thế giới – 1519.png", event: "Magellan bắt đầu chuyến đi vòng quanh thế giới", year: 1519 },
  { cardId: 22, image: "/cards/Martin Luther khởi xướng phong trào Cải cách Kháng nghị - 1517.png", event: "Martin Luther khởi xướng phong trào Cải cách Kháng nghị", year: 1517 },
  { cardId: 23, image: "/cards/Mỹ ném hai quả bom nguyên tử xuống Nhật Bản - 1945.png", event: "Mỹ ném hai quả bom nguyên tử xuống Nhật Bản", year: 1945, month: 8 },
  { cardId: 24, image: "/cards/Napoleon Bonaparte thất bại tại trận Waterloo - 1815.png", event: "Napoleon Bonaparte thất bại tại trận Waterloo", year: 1815 },
  { cardId: 25, image: "/cards/Nhà tiên tri Muhammad di cư đến Medina - 622.png", event: "Nhà tiên tri Muhammad di cư đến Medina", year: 622 },
  { cardId: 26, image: "/cards/Nội chiến Hoa Kỳ bùng nổ - 1861.png", event: "Nội chiến Hoa Kỳ bùng nổ", year: 1861 },
  { cardId: 27, image: "/cards/Sự kiện khủng bố 11-9 tại Hoa Kỳ - 2001.png", event: "Sự kiện khủng bố 11-9 tại Hoa Kỳ", year: 2001 },
  { cardId: 28, image: "/cards/Tàu Apollo 11 đưa con người lần đầu tiên đặt chân lên Mặt trăng - 1969.png", event: "Tàu Apollo 11 đưa con người lần đầu tiên đặt chân lên Mặt trăng", year: 1969 },
  // Thập tự chinh thứ nhất kéo dài từ 1096 đến 1099; lấy năm bắt đầu.
  { cardId: 29, image: "/cards/Thập tự chinh thứ nhất – 1096.png", event: "Thập tự chinh thứ nhất", year: 1096 },
  { cardId: 30, image: "/cards/Thế vận hội Olympic đầu tiên được tổ chức tại Hy Lạp - 776 TCN.png", event: "Thế vận hội Olympic đầu tiên được tổ chức tại Hy Lạp", year: -776 },
  // Văn minh Sumer hình thành qua một giai đoạn dài; lấy mốc xấp xỉ 3500 TCN.
  { cardId: 31, image: "/cards/Văn minh Sumer xuất hiện ở Lưỡng Hà – khoảng 3500 TCN.png", event: "Văn minh Sumer xuất hiện ở Lưỡng Hà", year: -3500 },
  { cardId: 32, image: "/cards/Vasco da Gama đến Ấn Độ – 1498.png", event: "Vasco da Gama đến Ấn Độ", year: 1498 },
  { cardId: 33, image: "/cards/Vua John của Anh ký Đại Tự chương (Magna Carta) - 1215.png", event: "Vua John của Anh ký Đại Tự chương (Magna Carta)", year: 1215 },
  // Vương triều thứ nhất có niên đại ước tính; lấy mốc khoảng 3150 TCN.
  { cardId: 34, image: "/cards/Vương triều thứ nhất của Ai Cập cổ đại được thành lập - 3150 TCN.png", event: "Vương triều thứ nhất của Ai Cập cổ đại được thành lập", year: -3150 },
  { cardId: 35, image: "/cards/Alexander Graham Bell phát minh ra điện thoại-1876.png", event: "Alexander Graham Bell phát minh ra điện thoại", year: 1876 },
  { cardId: 36, image: "/cards/Apple ra mắt chiếc iPhone đầu tiên - 2007.png", event: "Apple ra mắt chiếc iPhone đầu tiên", year: 2007 },
  { cardId: 37, image: "/cards/Đại dịch COVID-19 bùng phát toàn cầu-2019.png", event: "Đại dịch COVID-19 bùng phát toàn cầu", year: 2019 },
  { cardId: 38, image: "/cards/Đế quốc Aztec bị Tây Ban Nha (Hernán Cortés) chinh phục-1521.png", event: "Đế quốc Aztec bị Tây Ban Nha (Hernán Cortés) chinh phục", year: 1521 },
  { cardId: 39, image: "/cards/Đế quốc Inca bị Tây Ban Nha (Francisco Pizarro) chinh phục-1533.png", event: "Đế quốc Inca bị Tây Ban Nha (Francisco Pizarro) chinh phục", year: 1533 },
  { cardId: 40, image: "/cards/Hiệp ước Versailles được ký kết (Chính thức kết thúc Thế chiến I)-1919.png", event: "Hiệp ước Versailles được ký kết (chính thức kết thúc Thế chiến I)", year: 1919 },
  { cardId: 41, image: "/cards/Hòa ước Westphalia (Kết thúc Chiến tranh 30 năm ở châu Âu)-1648.png", event: "Hòa ước Westphalia kết thúc Chiến tranh Ba Mươi Năm ở châu Âu", year: 1648 },
  { cardId: 42, image: "/cards/Isaac Newton xuất bản cuốn Principia (Định luật vạn vật hấp dẫn)-1687.png", event: "Isaac Newton xuất bản cuốn Principia", year: 1687 },
  { cardId: 43, image: "/cards/Kênh đào Panama chính thức khánh thành-1914.png", event: "Kênh đào Panama chính thức khánh thành", year: 1914, month: 8 },
  { cardId: 44, image: "/cards/Mạng World Wide Web (WWW) được phát minh-1989.png", event: "Mạng World Wide Web (WWW) được phát minh", year: 1989, month: 3 },
  { cardId: 45, image: "/cards/Nhà du hành vũ trụ Yuri Gagarin bay vào không gian-1961.png", event: "Nhà du hành vũ trụ Yuri Gagarin bay vào không gian", year: 1961 },
  { cardId: 46, image: "/cards/Tàu Titanic chìm-1912.png", event: "Tàu Titanic chìm", year: 1912 },
  { cardId: 47, image: "/cards/Tàu tự hành Curiosity hạ cánh thành công xuống sao Hỏa-2012.png", event: "Tàu tự hành Curiosity hạ cánh thành công xuống sao Hỏa", year: 2012 },
  { cardId: 48, image: "/cards/Thỏa thuận Paris về Biến đổi Khí hậu được ký kết-2015.png", event: "Thỏa thuận Paris về biến đổi khí hậu được ký kết", year: 2015 },
  { cardId: 49, image: "/cards/Trạm Vũ trụ Quốc tế (ISS) đón phi hành đoàn đầu tiên-2000.png", event: "Trạm Vũ trụ Quốc tế (ISS) đón phi hành đoàn đầu tiên", year: 2000 },
  { cardId: 50, image: "/cards/Trận Trafalgar (Hải quân Anh đánh bại Pháp - Tây Ban Nha)-1805.png", event: "Trận Trafalgar: Hải quân Anh đánh bại liên quân Pháp – Tây Ban Nha", year: 1805 },
  { cardId: 51, image: "/cards/Vương quốc Anh chính thức rời khỏi Liên minh Châu Âu (Brexit)-2020.png", event: "Vương quốc Anh chính thức rời khỏi Liên minh Châu Âu (Brexit)", year: 2020 },
  { cardId: 52, image: "/cards/Phát minh ra máy in chữ thập (Johannes Gutenberg)-1440.png", event: "Johannes Gutenberg phát minh ra máy in chữ rời", year: 1440 },
  { cardId: 53, image: "/cards/Dịch hạch Cái chết Đen tấn công châu Âu-1347.png", event: "Dịch hạch Cái chết Đen tấn công châu Âu", year: 1347 },
  { cardId: 54, image: "/cards/Thomas Edison phát minh ra bóng đèn sợi đốt thương mại-1879.png", event: "Thomas Edison phát minh ra bóng đèn sợi đốt thương mại", year: 1879 },
  { cardId: 55, image: "/cards/Anh em nhà Wright thực hiện chuyến bay đầu tiên-1903.png", event: "Anh em nhà Wright thực hiện chuyến bay đầu tiên", year: 1903 },
  { cardId: 56, image: "/cards/Alexander Fleming khám phá ra penicillin-1928.png", event: "Alexander Fleming khám phá ra penicillin", year: 1928 },
  { cardId: 57, image: "/cards/Máy tính điện tử ENIAC ra đời-1945.png", event: "Máy tính điện tử ENIAC ra đời", year: 1945, month: 12 },
  { cardId: 58, image: "/cards/Tàu vũ trụ Voyager 1 được phóng lên-1977.png", event: "Tàu vũ trụ Voyager 1 được phóng lên", year: 1977 },
  { cardId: 59, image: "/cards/Khánh thành tháp Eiffel tại Paris-1889.png", event: "Khánh thành tháp Eiffel tại Paris", year: 1889 },
  { cardId: 60, image: "/cards/Khánh thành tượng Nữ thần Tự do tại Mỹ-1886.png", event: "Khánh thành tượng Nữ thần Tự do tại Mỹ", year: 1886 },
];
