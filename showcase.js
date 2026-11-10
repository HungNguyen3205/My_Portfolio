/* Dữ liệu dự án — mọi thông tin đã đối chiếu với README trên GitHub
   hoặc website đang chạy. Thêm dự án mới: chỉ cần thêm một object vào đây.
   ui    : 'polished' (giao diện đẹp) | 'dashboard' (dashboard bình thường) | 'none' (chưa có giao diện) — dùng để sắp xếp.
   admin : các màn hình quản trị. Ảnh chụp đặt tại assets/admin/<id>/<s>.webp (vd assets/admin/go/tong-quan.webp);
           chưa có ảnh thì khung xem tự hiện bản phác thảo giao diện thay thế. */
const GH = 'https://github.com/HungNguyen3205/';

window.PORTFOLIO_PROJECTS = [
  {
    id: 'glg', name: 'GLG — Cà phê 3D', kicker: 'Website + trang quản trị · Three.js', tags: ['landing', 'app'], status: 'live', ui: 'polished',
    url: 'https://glg.danava.com.vn/cafe/', repo: 'GLG', image: 'assets/shots/glg.webp?v=1', accent: '#8a5a2b',
    desc: 'Quán cà phê dựng bằng mô hình 3D: lướt chuột để quán tự lắp từ vỏ, quầy bar đến khi hoàn chỉnh — đi kèm trang quản trị cho từng mô hình kinh doanh.',
    features: ['Dựng quán 3D theo 5 bước khi cuộn, đổi góc nhìn và ánh sáng', 'Chuyển cảnh liền mạch giữa các trang bằng View Transition API', 'Trang quản trị: đơn hàng, thực đơn, đặt bàn, sơ đồ bàn, thành viên'],
    stack: ['Three.js', 'HTML', 'CSS', 'JavaScript', 'cPanel']
  },
  {
    id: 'omachi', name: 'Omachi — Concept Website', kicker: 'Website bán hàng · React', tags: ['landing'], status: 'source', ui: 'polished',
    repo: 'Web_omachi', image: 'assets/shots/omachi.webp?v=1', accent: '#d7141a',
    desc: 'Concept website thương mại điện tử cho mì Omachi: chọn hương vị, quy cách và cho vào giỏ ngay trên trang sản phẩm.',
    features: ['Lọc theo loại (gói, tô, ly) và hương vị', 'Chọn quy cách gói, lốc, thùng kèm giá giảm', 'Giỏ hàng, tìm kiếm nhanh, chế độ sáng/tối'],
    stack: ['React 19', 'Vite', 'Lucide']
  },
  {
    id: 'gold', name: 'Giá Vàng Today', kicker: 'Ứng dụng Next.js · Đang phát triển', tags: ['app'], status: 'source',
    repo: 'GiaVangToday', image: 'assets/shots/gold.webp?v=1', accent: '#d7bb70', cover: { bg: '#d7bb70', fg: '#3a2c08', mark: 'Au', line: 'GiaVangToday' },
    desc: 'Bảng theo dõi kim loại quý AURUM: giá vàng, bạc, đồng và tỷ giá trên một màn hình — đang trong giai đoạn phát triển.',
    features: ['Giá vàng 24K, bạc, đồng, tỷ giá USD cập nhật theo ngày', 'Biểu đồ biến động thị trường theo ngày, tuần, tháng, năm', 'Chỉ số tâm lý thị trường & danh sách theo dõi'],
    stack: ['Next.js', 'TypeScript', 'Recharts', 'Three.js'],
    ui: 'dashboard'
  },
  {
    id: 'car', name: 'Car Rental — Midnight Luxury', kicker: 'Ứng dụng thuê xe · AI', tags: ['app', 'ai'], status: 'source',
    repo: 'Car_Rental_Website', image: 'assets/shots/car.webp?v=1', accent: '#1c242c',
    desc: 'Nền tảng thuê xe trực tuyến tối giản, sang trọng, có trợ lý AI tự phát triển.',
    features: ['Đặt xe, chọn điểm đón/trả trên bản đồ, thanh toán QR', 'Trợ lý AI NLP tự huấn luyện, chạy trên FastAPI', 'Trang quản trị xe, đơn hàng, người dùng, phân quyền'],
    stack: ['Vue 3', 'Laravel', 'FastAPI', 'Python', 'MySQL'],
    ui: 'polished',
    admin: { host: 'driverent · /admin', area: 'DriveAdmin — trang quản trị Vue 3', modules: [
      { s: 'dashboard', n: 'Tổng quan vận hành', d: 'Đơn chờ duyệt, xe giao/nhận hôm nay, việc cần xử lý' },
      { s: 'cars', n: 'Quản lý kho xe', d: 'Giá thuê, khu vực, trạng thái vận hành và xuất bản' },
      { s: 'bookings', n: 'Đơn đặt xe', d: 'Duyệt đơn, tiền cọc, thanh toán, xuất CSV' },
      { s: 'calendar', n: 'Lịch xe & điều phối', d: 'Lịch từng xe theo tuần, tránh trùng lịch' },
      { s: 'contacts', n: 'Hỗ trợ & yêu cầu tư vấn', d: 'Phân công người phụ trách, theo dõi xử lý' },
      { s: 'permissions', n: 'Phân quyền & nhật ký', d: 'Vai trò, quyền chi tiết và lịch sử thao tác' }
    ] }
  },
  {
    id: 'go', name: 'DANAVA Go', kicker: 'Nền tảng đặt vé xe khách', tags: ['app'], status: 'live', featured: true,
    url: 'https://danavago.com', image: 'assets/shots/go.webp?v=2', accent: '#f39a3d',
    desc: 'Website đặt vé đa nhà xe, biến việc mua vé thành khởi đầu của một chuyến đi.',
    features: ['Tìm chuyến → chọn ghế → nhận vé điện tử', 'App riêng cho từng nhà xe theo thương hiệu', 'Phân vai chủ nhà xe, tài xế; quét vé theo chuyến'],
    stack: ['React 19', 'TypeScript', 'Framer Motion', 'Laravel 13'],
    ui: 'polished',
    admin: { host: 'danavago.com/manage', area: 'DANAVA GO Studio — quản trị nền tảng', modules: [
      { s: 'tong-quan', n: 'Tổng quan', d: 'Doanh thu, đơn đặt, phương tiện sẵn sàng, xu hướng 6 tháng' },
      { s: 'don-ve', n: 'Đơn vé', d: 'Lọc theo nhà xe, thanh toán, trạng thái; bán vé tại quầy' },
      { s: 'chuyen-chay', n: 'Chuyến chạy', d: 'Lịch chuyến theo ngày, ghế trống, giá vé, xuất bản' },
      { s: 'xe-so-do-ghe', n: 'Xe & sơ đồ ghế', d: 'Đội xe Limousine 9/11 chỗ và sơ đồ ghế từng xe' },
      { s: 'soat-ve-len-xe', n: 'Soát vé lên xe', d: 'Quét mã vé, theo dõi khách đã lên từng chuyến' },
      { s: 'bao-cao', n: 'Báo cáo', d: 'Doanh thu theo tuyến và theo nhà xe đối tác' },
      { s: 'app-ten-mien', n: 'App & tên miền', d: 'Mỗi nhà xe một app riêng trên tên miền thương hiệu' }
    ] }
  },
  {
    id: 'danava', name: 'DANAVA — Website thương hiệu', kicker: 'Website doanh nghiệp', tags: ['landing'], status: 'source',
    repo: 'DANAVA.COM.VN', image: 'assets/shots/danava.webp?v=1', accent: '#2b4294', cover: { bg: '#2b4294', fg: '#ffffff', mark: 'DANAVA', line: 'Công nghệ tạo khả năng. Con người tạo giá trị.' },
    desc: 'Website mới cho DANAVA Solutions — điểm kết nối của hệ sinh thái 6 mảng dịch vụ.',
    features: ['Hệ thống nhận diện màu thương hiệu chặt chẽ', 'CMS tự quản trị trên cơ sở dữ liệu SQLite', 'Chuyển động GSAP, tối ưu ảnh bằng Sharp'],
    stack: ['Next.js 16', 'React 19', 'TypeScript', 'GSAP', 'SQLite'],
    ui: 'polished',
    admin: { host: 'danava.com.vn/admin', area: 'CMS tự quản trị — Next.js', modules: [
      { s: 'tong-quan', n: 'Tổng quan', d: 'Khách mới, bài viết, dự án, lượt xem website' },
      { s: 'khach-hang', n: 'Khách hàng', d: 'Yêu cầu tư vấn: Mới → Phân công → Trao đổi → Hoàn tất' },
      { s: 'bai-viet', n: 'Bài viết', d: 'Soạn, xuất bản và quản lý tin tức' },
      { s: 'trang-chu', n: 'Trang chủ', d: 'Sửa nội dung trang chủ, xem trước trực tiếp' },
      { s: 'trinh-chieu', n: 'Trình chiếu', d: 'Các cảnh trình chiếu trong hệ sinh thái DANAVA' },
      { s: 'nhan-su', n: 'Nhân sự', d: 'Hồ sơ đội ngũ hiển thị trên website' }
    ] }
  },
  {
    id: 'touch', name: 'Touch Art — Slow Garden', kicker: 'Website song ngữ Việt – Anh', tags: ['landing'], status: 'source',
    repo: 'LandingPage_TouchArt', image: 'assets/shots/touch.webp?v=1', accent: '#384e41', cover: { bg: '#384e41', fg: '#f3ecd9', mark: 'Touch Art', line: 'Chạm sâu. Thả lỏng. Trở về mình.' },
    desc: 'Website thương hiệu cho studio trị liệu Touch Art tại Đà Nẵng, theo tinh thần “khu vườn chậm”.',
    features: ['14 trang chi tiết song ngữ Việt – Anh', 'Lá rơi, cành cây và nhạc nền nguyên bản 128 giây', 'Form đặt lịch tối giản chỉ với 3 trường'],
    stack: ['React', 'TypeScript', 'Vite'],
    ui: 'polished'
  },
  {
    id: 'bds', name: 'Landing Page Bất Động Sản', kicker: 'Landing page bất động sản', tags: ['landing'], status: 'live',
    url: 'https://landing-page-bds-psi.vercel.app', repo: 'LandingPage_BDS', image: 'assets/shots/bds.webp?v=2', accent: '#b8955a',
    desc: 'Landing page cho dự án nghỉ dưỡng ven biển Vinhomes Hải Vân Bay, Đà Nẵng.',
    features: ['Hero điện ảnh kèm các chỉ số nổi bật', 'Tổng quan, sản phẩm, tiện ích, vị trí, thư viện ảnh', 'Đăng ký tư vấn, chat và gọi luôn trong tầm tay'],
    stack: ['React', 'TypeScript', 'Vite', 'Vercel'],
    ui: 'polished'
  },
  {
    id: 'nq', name: 'Như Quỳnh — Portfolio', kicker: 'Portfolio thiết kế đồ họa', tags: ['landing'], status: 'live',
    url: 'https://phamvunhuquynh.vercel.app', repo: 'Portfolio_PhamVuNhuQuynh', image: 'assets/shots/nq.webp?v=2', accent: '#c2a051',
    desc: 'Portfolio cá nhân cho Phạm Vũ Như Quỳnh: 16 tác phẩm, kể chuyện bằng chuyển động.',
    features: ['16 tác phẩm lấy trực tiếp từ Google Drive', 'Bộ lọc, xem ảnh lớn, điều hướng bằng phím ← → Esc', 'Chữ hero, marquee, archive ghim theo cuộn'],
    stack: ['HTML', 'CSS', 'JavaScript', 'Vercel'],
    ui: 'polished'
  },
  {
    id: 'run', name: 'Bước Chạy Nhịp Sống', kicker: 'Landing page sự kiện', tags: ['landing'], status: 'live', featured: true,
    url: 'https://buoc-chay-nhip-song.vercel.app/', repo: 'BUOC-NHAY-NHIP-SONG', image: 'assets/shots/run.webp?v=2', accent: '#3a7bd5',
    desc: 'Trang đăng ký cho giải chạy marathon tại Đà Nẵng — mở đầu bằng minh họa cầu Rồng.',
    features: ['Màn mở đầu minh họa theo chủ đề thành phố', 'Thông tin sự kiện rõ ràng trên mọi màn hình', 'Form đăng ký kèm quy trình xác nhận'],
    stack: ['HTML', 'CSS', 'JavaScript', 'Vercel'],
    ui: 'polished'
  },
  {
    id: 'wello', name: 'Wellosophy', kicker: 'Landing page sản phẩm', tags: ['landing'], status: 'live',
    url: 'https://wellosophy.danava.com.vn', repo: 'LandingPage_Wellosophy', image: 'assets/shots/wello.webp?v=2', accent: '#16423c',
    desc: 'Landing page cho bộ 3 Cân bằng Trục Não – Da – Ruột của Wellosophy by Oriflame.',
    features: ['Phong cách Bắc Âu: xanh ngọc đậm và vàng champagne', 'Scroll reveal, bộ đếm số động, hiệu ứng shimmer', 'Ảnh được tách khỏi base64 để trang tải nhanh'],
    stack: ['HTML', 'CSS', 'JavaScript', 'cPanel'],
    ui: 'polished'
  },
  {
    id: 'work', name: 'DANAVA Work', kicker: 'Ứng dụng quản lý công việc', tags: ['app'], status: 'live', featured: true,
    url: 'https://workspace.danava.com.vn', image: 'assets/danava-work-poster.jpg', accent: '#b9a6ef', video: true,
    desc: 'Không gian làm việc chung: theo dõi công việc, thành viên và tiến độ trong cùng một hệ thống.',
    features: ['Bảng Kanban, danh sách và lịch trên cùng một nguồn dữ liệu', 'Phân quyền theo từng Board', 'Cài đặt như ứng dụng với PWA'],
    stack: ['React', 'TypeScript', 'Laravel', 'PWA'],
    ui: 'polished'
  },
  {
    id: 'vif', name: 'VIF — VisionFit Assistant', kicker: 'Trợ lý AI tập luyện · Demo', tags: ['ai'], status: 'demo',
    repo: 'Chatbox_AI', image: 'assets/shots/vif.webp?v=1', accent: '#9bb83a', cover: { bg: '#dce6b9', fg: '#2f3d22', mark: 'VIF', line: 'Người bạn đồng hành cho từng buổi tập.' },
    desc: 'Trợ lý tập luyện tiếng Việt, kết nối hệ thống phòng tập VisionFit qua API.',
    features: ['Đăng nhập theo vai trò: hội viên, PT, quản lý', 'Lịch sử chat riêng từng tài khoản, tự dọn theo hạn', 'Không gửi email, SĐT, mật khẩu tới mô hình AI'],
    stack: ['Node.js', 'SQLite', 'Laravel', 'OpenAI API'],
    ui: 'polished'
  },
  {
    id: 'studio', name: 'DANAVA Video Studio', kicker: 'Tự động dựng video · AI', tags: ['ai'], status: 'source',
    repo: 'Edit-Video-Automation', image: 'assets/shots/studio.webp?v=1', accent: '#d6a866', cover: { bg: '#151515', fg: '#f2d6a8', mark: 'Studio', line: 'Thêm video → Chọn phong cách → Xuất.' },
    desc: 'Thả một video, chọn phong cách, nhận về MP4 đã dựng hoàn chỉnh — không cần chỉnh timeline.',
    features: ['Tự nhận dạng lời nói tiếng Việt', 'Tự chọn cảnh, chữ và minh họa theo phong cách', 'AI chạy ngay trên máy với Ollama'],
    stack: ['Python', 'FastAPI', 'FFmpeg', 'Ollama'],
    ui: 'polished'
  },
  {
    id: 'news', name: 'News Reading Tracker', kicker: 'Chrome Extension · Dashboard', tags: ['app'], status: 'source',
    repo: 'DEMO_ExtensionReadingNews', image: 'assets/shots/news.webp?v=1', demo: 'https://youtu.be/XWSmBlwre5w', accent: '#4f7fbf', cover: { bg: '#1e2a3a', fg: '#e8eef6', mark: 'Read.', line: 'Extension → API → Dashboard.' },
    desc: 'Hệ thống thu thập và phân tích thời gian đọc báo thật của người dùng trên Chrome.',
    features: ['Tự nhận diện bài trên VnExpress, Dân Trí, Tuổi Trẻ', 'Đo thời gian đọc thật qua cuộn, chuột, trạng thái tab', 'Dashboard thống kê phiên đọc và timeline sự kiện'],
    stack: ['Chrome Extension', 'Laravel', 'Vue', 'SQLite'],
    ui: 'dashboard'
  },
  {
    id: 'mkt', name: 'TOOL MKT — AI Content', kicker: 'Công cụ marketing AI · MVP', tags: ['ai'], status: 'source',
    repo: 'TOOL-MKT', image: 'assets/shots/mkt.webp?v=1', accent: '#c47a3c', cover: { bg: '#e9d8c6', fg: '#4a2f1d', mark: 'MKT', line: 'Viết bằng AI · Duyệt · Lên lịch đăng.' },
    desc: 'Công cụ nội bộ tự sinh nội dung bằng AI và đăng bài lên Facebook Page.',
    features: ['Sinh nội dung bằng Ollama chạy local hoặc OpenAI', 'Quy trình duyệt bài giữa người viết và người duyệt', 'Lên lịch, đăng tự động qua Meta Graph API'],
    stack: ['React', 'Laravel 11', 'SQLite', 'Ollama'],
    ui: 'dashboard'
  },
  {
    id: 'coach', name: 'DANAVA AI Coach', kicker: 'Thị giác máy tính · AI', tags: ['ai'], status: 'source', featured: true,
    repo: 'CAMERA_PhanTichTuThe', accent: '#7fd3c6', cover: { bg: '#10201f', fg: '#a8eee3', mark: 'MOVE', line: 'Biến chuyển động thành dữ liệu.' },
    desc: 'Đếm hít đất qua camera bằng máy trạng thái chuyển động — chỉ tính khi làm đúng và đủ.',
    features: ['Tính góc Vai – Khuỷu – Cổ tay theo thời gian thực', 'Lọc nhiễu bằng EMA và vùng trễ hysteresis', '10/10 bài kiểm thử đạt, ổn định ở 15–60 FPS'],
    stack: ['JavaScript', 'MediaPipe', 'WebRTC'],
    ui: 'none'
  }
];

/* Thứ tự hiển thị: đang chạy → mã nguồn có giao diện đẹp → giao diện dashboard → chưa có giao diện.
   Trong cùng nhóm giữ nguyên thứ tự khai báo ở trên. */
const UI_RANK = { polished: 1, dashboard: 2, none: 3 };
window.PORTFOLIO_PROJECTS.sort((a, b) => (a.status === 'live' ? 0 : UI_RANK[a.ui]) - (b.status === 'live' ? 0 : UI_RANK[b.ui]));

const STATUS = { live: 'Đang chạy', source: 'Mã nguồn', demo: 'Bản demo' };
const projects = window.PORTFOLIO_PROJECTS;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('sc-js');

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

/* ---------- Thẻ dự án ---------- */
const grid = document.getElementById('project-grid');
projects.forEach((p, i) => {
  const card = el('article', 'sc-card sc-reveal');
  card.style.setProperty('--accent', p.accent);
  card.dataset.tags = p.tags.join(' ') + (p.status === 'live' ? ' live' : '') + (p.admin ? ' admin' : '');
  card.id = 'project-' + p.id;

  const primary = p.url || GH + p.repo;
  const media = el('a', 'sc-card__media');
  media.href = primary; media.target = '_blank'; media.rel = 'noopener noreferrer';
  media.setAttribute('aria-label', p.name + ' — ' + (p.url ? 'mở website' : 'xem mã nguồn'));
  if (p.image) {
    const img = el('img'); img.src = p.image; img.alt = 'Giao diện ' + p.name; img.loading = 'lazy'; img.decoding = 'async';
    media.append(img);
  } else {
    const cover = el('div', 'sc-cover');
    cover.style.setProperty('--cbg', p.cover.bg); cover.style.setProperty('--cfg', p.cover.fg);
    cover.append(el('strong', '', p.cover.mark), el('span', '', p.cover.line), el('small', '', 'Bìa đồ họa dự án'));
    media.append(cover);
  }
  media.append(el('span', 'sc-status sc-status--' + p.status, STATUS[p.status]));
  if (p.featured) media.append(el('span', 'sc-card__star', '★ Tiêu biểu'));
  if (p.admin) media.append(el('span', 'sc-card__admin', '⚙ Có trang quản trị'));
  card.append(media);

  const body = el('div', 'sc-card__body');
  const kicker = el('p', 'sc-card__kicker');
  kicker.append(el('b', '', String(i + 1).padStart(2, '0')), el('span', '', p.kicker));
  body.append(kicker, el('h3', '', p.name), el('p', 'sc-card__desc', p.desc));
  if (p.features.length) {
    const ul = el('ul', 'sc-card__features');
    p.features.forEach(f => ul.append(el('li', '', f)));
    body.append(ul);
  }
  const chips = el('ul', 'sc-chips');
  chips.setAttribute('aria-label', 'Công nghệ');
  p.stack.forEach(s => chips.append(el('li', '', s)));
  body.append(chips);

  const links = el('div', 'sc-card__links');
  const add = (href, label) => { const a = el('a', '', label); a.href = href; if (!href.startsWith('#')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } links.append(a); };
  if (p.url) add(p.url, 'Xem website ↗');
  if (p.repo) add(GH + p.repo, 'Mã nguồn ↗');
  if (p.video) add('#review', '▶ Video demo 21 giây');
  if (p.demo) add(p.demo, '▶ Video demo ↗');
  if (p.featured && !p.video) add('#feature-' + p.id, 'Đọc câu chuyện ↓');
  if (p.admin) {
    const b = el('button', 'sc-admin-open', '⚙ Xem trang quản trị');
    b.type = 'button'; b.dataset.admin = p.id; b.setAttribute('aria-haspopup', 'dialog');
    links.append(b);
  }
  body.append(links);
  card.append(body);
  grid.append(card);
});

/* ---------- Bộ lọc + tìm kiếm ---------- */
const search = document.getElementById('project-search');
const filterButtons = document.querySelectorAll('[data-filter]');
const normalize = v => v.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
let activeFilter = 'all';
filterButtons.forEach(btn => {
  const f = btn.dataset.filter;
  const count = f === 'all' ? projects.length : grid.querySelectorAll('[data-tags~="' + f + '"]').length;
  const badge = btn.querySelector('span'); if (badge) badge.textContent = count;
  btn.addEventListener('click', () => {
    activeFilter = f;
    filterButtons.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    applyFilter();
  });
});
// Lần chạy đầu không gắn "is-in": để thẻ tự bay vào khi cuộn tới (nếu gắn ngay, hiệu ứng đã chạy xong lúc thẻ còn ở ngoài màn hình).
function applyFilter(fromUser = true) {
  const q = normalize(search.value.trim());
  let shown = 0;
  grid.querySelectorAll('.sc-card').forEach(card => {
    const ok = (activeFilter === 'all' || card.dataset.tags.split(' ').includes(activeFilter)) && normalize(card.textContent).includes(q);
    card.hidden = !ok;
    if (ok) { shown++; if (fromUser) card.classList.add('is-in'); }
  });
  document.getElementById('result-status').textContent = 'Đang hiển thị ' + shown + ' / ' + projects.length + ' dự án';
  document.getElementById('empty-state').hidden = shown !== 0;
}
search.addEventListener('input', () => applyFilter());
applyFilter(false);

/* ---------- Phía sau sân khấu: xem trang quản trị ----------
   Mỗi dự án có `admin.modules`; ảnh từng màn hình lấy tại assets/admin/<id>/<s>.webp.
   Ảnh chưa có → hiện bản phác thảo giao diện quản trị (sidebar + thẻ số + bảng) theo màu dự án. */
const adminProjects = projects.filter(p => p.admin);
const shotSrc = (p, m) => 'assets/admin/' + p.id + '/' + m.s + '.webp';
const shotState = new Map(); // src → 'ok' | 'missing'
function probeShot(src) {
  if (shotState.has(src)) return Promise.resolve(shotState.get(src));
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => { shotState.set(src, 'ok'); resolve('ok'); };
    img.onerror = () => { shotState.set(src, 'missing'); resolve('missing'); };
    img.src = src;
  });
}

const backstage = document.getElementById('backstage-list');
if (backstage) adminProjects.forEach(p => {
  const b = el('button', 'sc-backstage__item');
  b.type = 'button'; b.dataset.admin = p.id; b.setAttribute('aria-haspopup', 'dialog');
  b.style.setProperty('--accent', p.accent);
  const thumb = el('span', 'sc-backstage__thumb');
  if (p.image) { const img = el('img'); img.src = p.image; img.alt = ''; img.loading = 'lazy'; thumb.append(img); }
  else { thumb.style.background = p.cover.bg; }
  thumb.append(el('span', 'sc-backstage__badge', '⚙ ' + p.admin.modules.length + ' màn hình'));
  const txt = el('span', 'sc-backstage__txt');
  txt.append(el('strong', '', p.name), el('small', '', p.admin.area));
  b.append(thumb, txt, el('span', 'sc-backstage__go', '→'));
  backstage.append(b);
});

const adminDlg = document.getElementById('admin-viewer');
if (adminDlg) {
  const $ = id => document.getElementById(id);
  const screen = $('admin-screen'), nav = $('admin-modules'), link = $('admin-link');
  let cur = null, idx = 0, token = 0;

  function mock(p, m) {
    const wrap = el('div', 'sc-mock');
    const side = el('div', 'sc-mock__side');
    side.append(el('b', 'sc-mock__brand', p.name.split(/\s[—–-]\s/)[0]));
    p.admin.modules.forEach((x, i) => side.append(el('span', i === idx ? 'is-on' : '', x.n)));
    const main = el('div', 'sc-mock__main');
    const top = el('div', 'sc-mock__top'); top.append(el('strong', '', m.n), el('i'));
    const kpis = el('div', 'sc-mock__kpis'); for (let i = 0; i < 4; i++) kpis.append(el('span'));
    const chart = el('div', 'sc-mock__chart');
    [42, 58, 50, 72, 66, 90, 76].forEach((h, i) => { const bar = el('i'); bar.style.height = ((h + idx * 7 * (i % 3)) % 60 + 35) + '%'; chart.append(bar); });
    const table = el('div', 'sc-mock__table'); for (let i = 0; i < 5; i++) table.append(el('span'));
    main.append(top, kpis, chart, table);
    wrap.append(side, main, el('p', 'sc-mock__note', 'Ảnh chụp màn hình đang được cập nhật'));
    return wrap;
  }

  function show(i) {
    const p = cur, m = p.admin.modules[i]; idx = i;
    nav.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
    $('admin-cap').textContent = String(i + 1).padStart(2, '0') + ' / ' + String(p.admin.modules.length).padStart(2, '0') + ' — ' + m.n + ': ' + m.d;
    const src = shotSrc(p, m), my = ++token;
    screen.replaceChildren(mock(p, m));
    screen.classList.add('is-loading');
    probeShot(src).then(state => {
      if (my !== token) return;
      screen.classList.remove('is-loading');
      if (state !== 'ok') return;
      const img = el('img'); img.src = src; img.alt = 'Màn hình quản trị ' + p.name + ' — ' + m.n;
      screen.replaceChildren(img);
    });
  }

  function open(id) {
    cur = adminProjects.find(p => p.id === id); if (!cur) return;
    adminDlg.style.setProperty('--accent', cur.accent);
    $('admin-title').textContent = cur.name;
    $('admin-area').textContent = cur.admin.area;
    $('admin-url').textContent = cur.admin.host || (cur.admin.url ? cur.admin.url.replace(/^https?:\/\//, '') : (cur.url ? cur.url.replace(/^https?:\/\//, '').replace(/\/.*$/, '') + '/admin' : 'admin · ' + cur.id));
    $('admin-note').textContent = cur.admin.note || (cur.admin.url ? '' : 'Ảnh chụp trực tiếp từ trang quản trị · dữ liệu demo, thông tin liên hệ đã được che');
    link.hidden = !cur.admin.url; if (cur.admin.url) link.href = cur.admin.url;
    nav.replaceChildren();
    cur.admin.modules.forEach((m, i) => {
      const b = el('button'); b.type = 'button';
      b.append(el('b', '', String(i + 1).padStart(2, '0')), el('strong', '', m.n), el('small', '', m.d));
      b.addEventListener('click', () => show(i));
      nav.append(b);
    });
    show(0);
    adminDlg.showModal(); document.body.style.overflow = 'hidden';
  }

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-admin]'); if (t) open(t.dataset.admin);
  });
  $('admin-close').addEventListener('click', () => adminDlg.close());
  adminDlg.addEventListener('click', e => { if (e.target === adminDlg) adminDlg.close(); });
  adminDlg.addEventListener('close', () => { document.body.style.overflow = ''; });
  adminDlg.addEventListener('keydown', e => {
    if (!cur || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    const n = cur.admin.modules.length;
    show((idx + (e.key === 'ArrowRight' ? 1 : -1) + n) % n);
    nav.querySelectorAll('button')[idx].focus();
    e.preventDefault();
  });
  adminDlg.querySelectorAll('[data-admin-step]').forEach(b => b.addEventListener('click', () => {
    const n = cur.admin.modules.length; show((idx + Number(b.dataset.adminStep) + n) % n);
  }));
}

/* ---------- Con số (tính từ dữ liệu thật) ---------- */
const techs = new Set(projects.flatMap(p => p.stack.map(s => s.replace(/\s\d+$/, ''))));
const totals = {
  total: projects.length,
  live: projects.filter(p => p.status === 'live').length,
  ai: projects.filter(p => p.tags.includes('ai')).length,
  tech: techs.size
};
document.querySelectorAll('[data-count]').forEach(node => {
  const target = totals[node.dataset.count];
  const pad = v => String(v).padStart(2, '0');
  node.textContent = pad(target);
  if (reduceMotion || !('IntersectionObserver' in window)) return;
  node.textContent = '00';
  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    io.disconnect();
    const start = performance.now(), dur = 1400;
    const tick = now => {
      const t = Math.min(1, (now - start) / dur);
      node.textContent = pad(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, { threshold: .4 });
  io.observe(node);
});

/* ---------- Xuất hiện khi cuộn ---------- */
if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.sc-reveal').forEach(n => { if (!n.classList.contains('is-in')) io.observe(n); });
} else {
  document.querySelectorAll('.sc-reveal').forEach(n => n.classList.add('is-in'));
}

/* ---------- Thanh tiến trình đọc ---------- */
const progress = document.querySelector('.progress');
let ticking = false;
function updateProgress() {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';
  ticking = false;
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); } }, { passive: true });
updateProgress();

/* ---------- Video DANAVA Work + phòng chiếu ---------- */
const workVideo = document.getElementById('work-video');
document.getElementById('play-review').addEventListener('click', () => {
  workVideo.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  workVideo.play().catch(() => workVideo.focus());
});
const cinema = document.getElementById('cinema');
const cinemaVideo = document.getElementById('cinema-video');
document.querySelector('.cinema-trigger').addEventListener('click', () => {
  workVideo.pause(); cinema.showModal(); document.body.style.overflow = 'hidden'; cinemaVideo.play().catch(() => {});
});
document.getElementById('close-cinema').addEventListener('click', () => cinema.close());
cinema.addEventListener('click', e => {
  if (e.target !== cinema) return;
  const r = cinema.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) cinema.close();
});
cinema.addEventListener('close', () => { cinemaVideo.pause(); document.body.style.overflow = ''; });

document.getElementById('year').textContent = new Date().getFullYear();
