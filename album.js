/* Album — mỗi THƯ MỤC ảnh là một bàn ảnh riêng, xếp từ trên xuống:
     01 Gia đình → 02 Hùng → 03 Bé iu → 04 Cún cưng (mỗi bé một nhóm: Bi em, Bông, Đậu)
   - Máy tính: ảnh bay ra từ một xấp khi cuộn tới; RÊ CHUỘT vào tấm nào thì tấm đó sáng, phóng to,
     xoay thẳng và nổi lên trên tất cả (các tấm khác trong bàn tối đi). Kéo thả để sắp xếp.
   - Điện thoại: mỗi bàn là một dải vuốt ngang; tấm ở GIỮA màn hình tự sáng & phóng to.
   - Bấm ảnh: xem lớn, ← → / vuốt để chuyển trong cùng bàn, Esc để đóng.

   THÊM ẢNH: chép ảnh vào assets/album/ rồi thêm vào đúng bàn trong BOARDS.
     wide: true → khung NẰM NGANG (ảnh ngang / nhiều người, không cắt ai) */
(() => {
  const P = (src, caption, extra = {}) => ({ src: 'assets/album/' + src, caption, year: '', ...extra });
  const BOARDS = [
    { id: 'family', no: '01', title: 'Gia đình', sub: 'Nơi mọi hành trình bắt đầu', mark: 'heart', photos: [
      P('gia-dinh.webp', 'Cả nhà mình', { wide: true }),
    ] },
    { id: 'hung', no: '02', title: 'Hùng', sub: 'Những khoảnh khắc của riêng tôi', photos: [
      P('hung-01.webp', 'Góc tường đầy những mảnh giấy'),
      P('hung-02.webp', 'Ống kính hướng lên bầu trời'),
      P('hung-03.webp', 'Nắng chiều & dải ruy băng'),
      P('hung-04.webp', 'Đêm hội đèn, khăn ca rô'),
      P('hung-05.webp', 'Mùa lạnh & chiếc khăn quàng'),
      P('hung-06.webp', 'Tà áo trắng giữa sân chùa'),
      P('hung-07.webp', 'Kính râm & một buổi chiều chậm'),
      P('hung-08.webp', 'Những bước chân trên sân cỏ'),
      P('hung-09.webp', 'Hoàng hôn bên bờ sông'),
      P('hung-10.webp', 'Vòng quay & gió chiều'),
      P('hung-11.webp', 'Biển, đá & ly cà phê'),
      P('hung-12.webp', 'Gió biển, kính râm'),
      P('hung-13.webp', 'Ánh chiều cuối ngày'),
      P('hung-14.webp', 'Con phố đèn lồng'),
      P('hung-16.webp', 'Nắng biển xanh'),
      P('hung-17.webp', 'Một đêm thành phố'),
      P('hung-18.webp', 'Ngược nắng'),
    ] },
    { id: 'love', no: '03', title: 'Bé iu', sub: 'Người thương của tôi', mark: 'heart', photos: [
      P('nguoi-thuong.webp', 'Người thương của tôi'),
      P('love-cafe.webp', 'Một buổi cà phê xinh'),
      P('hai-dua-1.webp', 'Khoanh tay tạo dáng', { wide: true, year: '2025' }),
      P('hai-dua-2.webp', 'Một cái thơm lên tóc', { wide: true, year: '2025' }),
      P('hai-dua-3.webp', 'Khoác vai cười thật tươi', { wide: true, year: '2025' }),
      P('hai-dua-4.webp', 'Nháy mắt tinh nghịch', { wide: true, year: '2025' }),
    ] },
    { id: 'pet', no: '04', title: 'Cún cưng', sub: 'Ba bé bốn chân của nhà', mark: 'paw', groups: [
      { name: 'Bi em', photos: [
        P('bi-1.webp', 'Bi em đón Noel'),
        P('bi-2.webp', 'Cười tươi bên cây thông'),
        P('bi-3.webp', 'Ngồi ngoan chụp hình'),
        P('bi-4.webp', 'Nghiêng đầu dễ thương'),
        P('bi-5.webp', 'Nằm dài thư giãn'),
        P('bi-6.webp', 'Lè lưỡi chờ quà'),
      ] },
      { name: 'Bông', photos: [
        P('bong-1.webp', 'Nhìn thẳng ống kính'),
        P('bong-2.webp', 'Lim dim trong vòng tay', { wide: true }),
        P('bong-3.webp', 'Ánh mắt tròn xoe'),
        P('bong-4.webp', 'Nằm ngắm trời đất', { wide: true }),
        P('bong-5.webp', 'Ngủ say sưa', { wide: true }),
        P('bong-6.webp', 'Hai đứa nhỏ trên sàn'),
      ] },
      { name: 'Đậu', photos: [
        P('dau-1.webp', 'Nằm gọn trong lòng', { wide: true }),
        P('dau-2.webp', 'Lông xù buổi tối'),
        P('dau-3.webp', 'Áo vàng điệu đà'),
        P('dau-4.webp', 'Hai anh em mặc áo mới'),
        P('dau-5.webp', 'Ngước nhìn chờ cưng'),
      ] },
    ] },
  ];

  const root = document.getElementById('album-boards');
  if (!root) return;
  const tabsBox = document.getElementById('album-tabs');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const mobile = () => innerWidth <= 760;
  const rand = (a, b) => a + Math.random() * (b - a);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const TAPES = { heart: ['#e0a8d6cc', '#f3c6e6cc'], paw: ['#f2c58fcc', '#e8b07acc', '#f6d6a8cc'], none: ['#c98bc099', '#7fc4d499', '#e2b6d999'] };
  const BADGE = { heart: '♥', paw: '🐾' };

  /* ---------- Một bàn ảnh ---------- */
  const tables = [];
  function makeTable(photos, mark) {
    const table = el('div', 'sc-album__table');
    table.setAttribute('role', 'list');
    const cards = photos.map((p, i) => {
      const card = el('button', 'sc-polaroid' + (p.wide ? ' sc-polaroid--wide' : '') + (mark ? ' sc-polaroid--' + mark : ''));
      card.type = 'button';
      card.setAttribute('role', 'listitem');
      card.setAttribute('aria-label', (p.year ? p.year + ' — ' : '') + p.caption + ' (bấm để xem lớn)');
      const tapes = TAPES[mark || 'none'];
      card.style.setProperty('--tape', tapes[i % tapes.length]);
      card.append(el('span', 'sc-polaroid__tape'));
      if (mark) { const b = el('span', 'sc-polaroid__heart', BADGE[mark]); b.setAttribute('aria-hidden', 'true'); card.append(b); }
      const img = el('img'); img.src = p.src; img.alt = p.caption; img.loading = 'lazy'; img.decoding = 'async'; img.draggable = false;
      const cap = el('span', 'sc-polaroid__cap');
      if (p.year) cap.append(el('b', '', p.year));
      cap.append(document.createTextNode(p.caption));
      card.append(img, cap);
      table.append(card);
      return card;
    });
    const t = { table, cards, photos, dealt: false, spread: new Map(), settleTimer: 0 };
    tables.push(t);
    return t;
  }

  /* ---------- Dựng các bàn theo thư mục ---------- */
  let total = 0;
  BOARDS.forEach(b => {
    const count = b.groups ? b.groups.reduce((s, g) => s + g.photos.length, 0) : b.photos.length;
    total += count;
    const board = el('article', 'sc-board sc-board--' + b.id);
    board.id = 'album-' + b.id;
    board.setAttribute('aria-labelledby', 'album-' + b.id + '-title');
    const head = el('div', 'sc-board__head');
    head.append(el('span', 'sc-board__no', b.no));
    const h = el('h3', 'sc-board__title', b.title); h.id = 'album-' + b.id + '-title';
    const meta = el('div', 'sc-board__meta');
    meta.append(h, el('p', 'sc-board__sub', b.sub));
    head.append(meta, el('span', 'sc-board__count', count + ' ảnh'));
    board.append(head);
    if (b.groups) {
      b.groups.forEach(g => {
        const sec = el('section', 'sc-board__group');
        const gh = el('h4', 'sc-board__group-title');
        gh.append(el('span', 'sc-board__group-mark', BADGE[b.mark] || '•'), document.createTextNode(g.name), el('small', '', g.photos.length + ' ảnh'));
        sec.append(gh, makeTable(g.photos, b.mark).table);
        board.append(sec);
      });
    } else {
      board.append(makeTable(b.photos, b.mark).table);
    }
    root.append(board);

    // Nút nhảy nhanh tới bàn
    if (tabsBox) {
      const a = el('a', 'sc-album__tab');
      a.href = '#album-' + b.id;
      a.dataset.board = b.id;
      a.innerHTML = `<span>${b.no} · ${b.title}</span><small>${count}</small>`;
      tabsBox.append(a);
    }
  });
  const counter = document.getElementById('album-total');
  if (counter) counter.textContent = total;

  // Đánh dấu bàn đang xem trên thanh mục
  if (tabsBox && 'IntersectionObserver' in window) {
    const tabIO = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      const id = e.target.id.replace('album-', '');
      tabsBox.querySelectorAll('.sc-album__tab').forEach(a => a.setAttribute('aria-current', String(a.dataset.board === id)));
    }), { rootMargin: '-45% 0px -50% 0px' });
    root.querySelectorAll('.sc-board').forEach(b => tabIO.observe(b));
  }

  /* ---------- Bố cục từng bàn ---------- */
  const place = (card, x, y, r) => {
    card.style.setProperty('--x', x.toFixed(1) + 'px');
    card.style.setProperty('--y', y.toFixed(1) + 'px');
    card.style.setProperty('--r', r.toFixed(2) + 'deg');
  };
  const baseSize = t => {
    const ref = t.cards.find(c => !c.classList.contains('sc-polaroid--wide')) || t.cards[0];
    return { cw: ref.offsetWidth || 220, ch: ref.offsetHeight || 300 };
  };
  function computeSpread(t) {
    const W = t.table.clientWidth, { cw, ch } = baseSize(t);
    const n = t.cards.length, pad = 10;
    const perRow = Math.max(Math.min(n, 2), Math.min(n, Math.floor((W - cw - pad * 2) / (cw * 0.78)) + 1));
    const rows = Math.ceil(n / perRow);
    const tallest = Math.max(...t.cards.map(c => c.offsetHeight || ch));
    const rowH = ch * 0.78;
    t.table.style.height = Math.round((rows - 1) * rowH + tallest + 46) + 'px';
    t.spread = new Map();
    t.cards.forEach((card, i) => {
      const row = Math.floor(i / perRow), col = i % perRow;
      const usable = n <= perRow ? Math.min(W - cw - pad * 2, cw * 1.08 * (n - 1)) : W - cw - pad * 2;
      const step = perRow > 1 ? usable / ((n <= perRow ? n : perRow) - 1 || 1) : 0;
      const left = n <= perRow ? (W - cw - usable) / 2 : pad;      // ít ảnh → căn giữa bàn
      const offset = row % 2 && n > perRow ? step * 0.5 : 0;        // hàng so le như ảnh rải trên bàn
      const own = card.offsetWidth || cw;
      t.spread.set(card, {
        x: Math.max(pad, Math.min(W - own - pad, left + col * step + offset - (own - cw) / 2 + rand(-10, 10))),
        y: row * rowH + 18 + (col % 2 ? 18 : 0) + rand(-10, 10),
        r: rand(-8, 8),
      });
    });
  }
  function stack(t) {
    const W = t.table.clientWidth, { cw } = baseSize(t);
    t.table.classList.remove('is-settled');
    t.cards.forEach(c => place(c, (W - cw) / 2 + rand(-6, 6), 30 + rand(-6, 6), rand(-12, 12)));
  }
  function deal(t, stagger = 85) {
    t.table.classList.remove('is-settled');
    t.cards.forEach((c, i) => {
      c.style.transitionDelay = (reduce ? 0 : i * stagger) + 'ms';
      c.style.zIndex = String(i + 1);
      const s = t.spread.get(c); if (s) place(c, s.x, s.y, s.r);
    });
    clearTimeout(t.settleTimer);
    t.settleTimer = setTimeout(() => {
      t.cards.forEach(c => { c.style.transitionDelay = ''; });
      t.table.classList.add('is-settled');   // rải xong → rê chuột nổi lên tức thì
    }, t.cards.length * stagger + 1000);
  }
  function layout(t, animate) {
    if (mobile()) {
      t.table.style.height = '';
      t.cards.forEach(c => { c.style.removeProperty('--x'); c.style.removeProperty('--y'); c.style.setProperty('--r', rand(-3, 3).toFixed(2) + 'deg'); });
      t.table.classList.add('is-settled');
      updateCenter(t);
      return;
    }
    computeSpread(t);
    if (animate && !reduce) { stack(t); requestAnimationFrame(() => requestAnimationFrame(() => deal(t))); }
    else deal(t, 0);
  }

  // Tung ảnh khi cuộn tới từng bàn
  tables.forEach(t => {
    if (!('IntersectionObserver' in window)) { t.dealt = true; layout(t, false); return; }
    stack(t);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect(); t.dealt = true; layout(t, true);
    }, { threshold: 0.12 });
    io.observe(t.table);
  });

  let lastW = innerWidth;
  addEventListener('resize', () => {
    if (Math.abs(innerWidth - lastW) < 40) return;
    lastW = innerWidth;
    tables.forEach(t => { if (t.dealt) layout(t, false); else if (!mobile()) stack(t); });
  });

  // Nút "Tung lại ảnh": rải lại mọi bàn đã hiện
  const shuffleBtn = document.getElementById('album-shuffle');
  if (shuffleBtn) shuffleBtn.addEventListener('click', () => {
    tables.forEach(t => {
      if (!t.dealt) return;
      if (mobile()) { t.table.scrollTo({ left: 0, behavior: reduce ? 'auto' : 'smooth' }); return; }
      computeSpread(t);
      if (reduce) { deal(t, 0); return; }
      stack(t);
      setTimeout(() => deal(t, 70), 380);
    });
  });

  /* ---------- Điện thoại: tấm ở giữa màn hình tự sáng & phóng to ---------- */
  function updateCenter(t) {
    if (!mobile()) { t.cards.forEach(c => c.classList.remove('is-center')); return; }
    const box = t.table.getBoundingClientRect();
    const mid = box.left + t.table.clientWidth / 2;
    let best = null, bestD = Infinity;
    t.cards.forEach(c => {
      const r = c.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - mid);
      if (d < bestD) { bestD = d; best = c; }
    });
    t.cards.forEach(c => c.classList.toggle('is-center', c === best));
  }
  tables.forEach(t => {
    let raf = 0;
    t.table.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; updateCenter(t); }); }, { passive: true });
  });

  /* ---------- Kéo thả (máy tính) + bấm để xem lớn ---------- */
  let z = 1000, drag = null, justDragged = false;
  tables.forEach(t => t.cards.forEach((card, i) => {
    card.addEventListener('pointerdown', e => {
      if (mobile() || e.button !== 0) return;
      const x = parseFloat(card.style.getPropertyValue('--x')) || 0;
      const y = parseFloat(card.style.getPropertyValue('--y')) || 0;
      drag = { t, card, sx: e.clientX, sy: e.clientY, x, y, moved: false, id: e.pointerId };
      card.style.zIndex = String(++z);
    });
    card.addEventListener('click', () => {
      if (justDragged) { justDragged = false; return; }
      // Điện thoại: chạm tấm chưa ở giữa → cuộn vào giữa trước; chạm lần nữa mới mở xem lớn
      if (mobile() && !card.classList.contains('is-center')) {
        card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
        return;
      }
      openLightbox(t, i);
    });
  }));
  addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    if (!drag.moved) { drag.moved = true; drag.card.classList.add('is-dragging'); try { drag.card.setPointerCapture(drag.id); } catch {} }
    const W = drag.t.table.clientWidth, H = drag.t.table.clientHeight, cw = drag.card.offsetWidth, ch = drag.card.offsetHeight;
    drag.card.style.setProperty('--x', Math.max(-cw * 0.3, Math.min(W - cw * 0.7, drag.x + dx)) + 'px');
    drag.card.style.setProperty('--y', Math.max(-ch * 0.25, Math.min(H - ch * 0.6, drag.y + dy)) + 'px');
    drag.card.style.setProperty('--r', Math.max(-14, Math.min(14, dx * 0.04)).toFixed(2) + 'deg');
  });
  const endDrag = () => {
    if (!drag) return;
    if (drag.moved) { justDragged = true; drag.card.classList.remove('is-dragging'); setTimeout(() => { justDragged = false; }, 0); }
    drag = null;
  };
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', endDrag);

  /* ---------- Chiều sâu: ảnh trôi nhẹ theo chuột ---------- */
  if (fine && !reduce) {
    tables.forEach(t => {
      let raf = 0, mx = 0, my = 0;
      const depth = t.cards.map(() => rand(4, 12));
      t.table.addEventListener('pointermove', e => {
        const r = t.table.getBoundingClientRect();
        mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          t.cards.forEach((c, i) => {
            if (drag && drag.card === c) return;
            c.style.setProperty('--px', (mx * depth[i]).toFixed(1) + 'px');
            c.style.setProperty('--py', (my * depth[i]).toFixed(1) + 'px');
          });
        });
      }, { passive: true });
      t.table.addEventListener('pointerleave', () => t.cards.forEach(c => { c.style.setProperty('--px', '0px'); c.style.setProperty('--py', '0px'); }));
    });
  }

  /* ---------- Xem ảnh lớn (chuyển ảnh trong cùng bàn) ---------- */
  const box = document.getElementById('album-lightbox');
  const bImg = document.getElementById('album-lightbox-img');
  const bYear = document.getElementById('album-lightbox-year');
  const bCap = document.getElementById('album-lightbox-cap');
  const bCount = document.getElementById('album-lightbox-count');
  let cur = null, current = 0;
  function show(k) {
    current = (k + cur.photos.length) % cur.photos.length;
    const p = cur.photos[current];
    box.classList.toggle('is-wide', !!p.wide);
    box.classList.toggle('is-special', !!cur.mark);
    box.classList.remove('is-swap'); void box.offsetWidth; box.classList.add('is-swap');
    bImg.src = p.src; bImg.alt = p.caption;
    bYear.textContent = p.year || ''; bYear.hidden = !p.year;
    bCap.textContent = p.caption;
    bCount.textContent = String(current + 1).padStart(2, '0') + ' / ' + String(cur.photos.length).padStart(2, '0');
  }
  function openLightbox(t, i) {
    if (!box || typeof box.showModal !== 'function') return;
    cur = { photos: t.photos, mark: t.cards[0].className.includes('--heart') || t.cards[0].className.includes('--paw') };
    show(i);
    box.showModal();
    document.body.style.overflow = 'hidden';
  }
  if (box) {
    box.addEventListener('close', () => { document.body.style.overflow = ''; });
    box.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => show(current + Number(b.dataset.step))));
    box.querySelector('.sc-lightbox__close').addEventListener('click', () => box.close());
    box.addEventListener('click', e => { if (e.target === box) box.close(); });
    box.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
    });
    let tx = null;
    box.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', e => {
      if (tx == null) return;
      const dx = e.changedTouches[0].clientX - tx; tx = null;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    });
  }
})();
