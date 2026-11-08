/* Hiệu ứng "wow" cho phần show sản phẩm.
   Tất cả đều tắt khi người xem bật "giảm chuyển động"; các hiệu ứng theo chuột chỉ bật trên máy có chuột. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const projects = window.PORTFOLIO_PROJECTS || [];
  const GH = 'https://github.com/HungNguyen3205/';
  const STATUS = { live: 'Đang chạy', source: 'Mã nguồn', demo: 'Bản demo' };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

  /* ---------- 1. Showreel: dựng các thẻ ---------- */
  const reel = document.getElementById('reel');
  const track = reel && reel.querySelector('.sc-reel__track');
  if (track) {
    projects.forEach((p, i) => {
      const a = el('a', 'sc-reel__item');
      a.href = p.url || (p.featured ? '#feature-' + p.id : GH + p.repo);
      if (p.id === 'work') a.href = '#review';
      if (!a.href.includes('#')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      a.style.setProperty('--accent', p.accent);
      a.dataset.cursor = p.url ? 'Mở web ↗' : 'Xem ↗';
      const media = el('div', 'sc-reel__media');
      if (p.image) {
        const img = el('img'); img.src = p.image; img.alt = 'Giao diện ' + p.name; img.loading = 'lazy'; img.decoding = 'async';
        media.append(img);
      } else {
        const c = el('div', 'sc-cover'); c.style.setProperty('--cbg', p.cover.bg); c.style.setProperty('--cfg', p.cover.fg);
        c.append(el('strong', '', p.cover.mark), el('span', '', p.cover.line)); media.append(c);
      }
      media.append(el('span', 'sc-status sc-status--' + p.status, STATUS[p.status]));
      const cap = el('div', 'sc-reel__cap');
      cap.append(el('b', '', String(i + 1).padStart(2, '0')));
      const txt = el('div'); txt.append(el('strong', '', p.name), el('span', '', p.kicker)); cap.append(txt);
      a.append(media, cap);
      track.append(a);
    });
    const total = reel.querySelector('[data-reel-total]'); if (total) total.textContent = String(projects.length).padStart(2, '0');
  }

  /* ---------- 2. Tiêu đề hiện từng chữ ---------- */
  function splitWords(root) {
    let index = 0;
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(document.createTextNode(' ')); return; }
            const w = el('span', 'sc-w'); const inner = el('span', 'sc-w__i', part);
            inner.style.setProperty('--i', index++); w.append(inner); frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') walk(child);
      });
    };
    walk(root);
    root.classList.add('sc-split');
  }
  if (!reduce) {
    document.querySelectorAll('.sc-h2, .sc-feature__body h3, .sc-contact h2, .sc-interlude h2, .sc-reel__title').forEach(splitWords);
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-split-in'); io.unobserve(e.target); }
    }), { threshold: .3 });
    document.querySelectorAll('.sc-split').forEach(n => io.observe(n));
  }

  /* ---------- 3. Thẻ dự án bay vào lần lượt ---------- */
  document.querySelectorAll('.sc-card').forEach((card, i) => card.style.setProperty('--stagger', (i % 3) * 110 + 'ms'));

  /* ---------- 4. Vòng lặp cuộn: showreel, khung tiêu biểu, dải chữ chạy ---------- */
  const features = [...document.querySelectorAll('.sc-feature__media')];
  if (!reduce) features.forEach(m => m.classList.remove('sc-reveal')); // hiệu ứng cuộn 3D thay cho hiện dần
  const marquee = document.querySelector('.sc-marquee__track');
  const marqueeAnim = marquee && marquee.getAnimations ? marquee.getAnimations()[0] : null;
  const reelCount = reel && reel.querySelector('[data-reel-current]');
  const reelBar = reel && reel.querySelector('.sc-reel__bar i');
  const pinned = () => reel && innerWidth > 760 && !reduce;
  let reelMax = 0, lastY = scrollY, velocity = 0, ticking = false;

  function measureReel() {
    if (!reel) return;
    if (!pinned()) { reel.style.height = ''; track.style.transform = ''; return; }
    reelMax = Math.max(0, track.scrollWidth - innerWidth + 80);
    reel.style.height = (innerHeight + reelMax) + 'px';
  }

  function frame() {
    ticking = false;
    const y = scrollY;
    velocity += ((y - lastY) - velocity) * 0.2;
    lastY = y;

    if (pinned()) {
      const top = reel.offsetTop;
      const p = clamp((y - top) / (reel.offsetHeight - innerHeight), 0, 1);
      track.style.transform = `translate3d(${-p * reelMax}px,0,0)`;
      reel.style.setProperty('--p', p.toFixed(4));
      track.style.setProperty('--skew', clamp(velocity * -0.05, -4, 4).toFixed(2) + 'deg');
      if (reelBar) reelBar.style.transform = `scaleX(${p})`;
      if (reelCount) reelCount.textContent = String(Math.min(projects.length, 1 + Math.floor(p * projects.length))).padStart(2, '0');
    }

    if (!reduce) {
      features.forEach(m => {
        const r = m.getBoundingClientRect();
        // Bắt đầu dựng khi mép trên chạm đáy màn hình, đứng thẳng hẳn khi lên tới ~40% chiều cao
        // (trước đây phải lên tới 15% mới rõ → ảnh/video mờ và nghiêng suốt lúc đang đọc chữ bên cạnh).
        const p = clamp((innerHeight - r.top) / (innerHeight * 0.6), 0, 1);
        m.style.setProperty('--sp', p.toFixed(3));
      });
      if (marqueeAnim) marqueeAnim.playbackRate = 1 + clamp(Math.abs(velocity) / 12, 0, 5);
    }

    if (Math.abs(velocity) > 0.05) request();
  }
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', () => { measureReel(); request(); });
  addEventListener('load', () => { measureReel(); request(); });
  measureReel(); request();

  if (reduce || !finePointer) return;

  /* ---------- 5. Thẻ dự án nghiêng 3D + vệt sáng ---------- */
  function tilt(selector, strength) {
    document.querySelectorAll(selector).forEach(card => {
      let raf = 0, ev = null;
      card.addEventListener('pointermove', e => {
        ev = e; if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const r = card.getBoundingClientRect();
          const x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
          card.style.setProperty('--rx', ((0.5 - y) * strength).toFixed(2) + 'deg');
          card.style.setProperty('--ry', ((x - 0.5) * strength).toFixed(2) + 'deg');
          card.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
          card.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
        });
      });
      card.addEventListener('pointerleave', () => {
        cancelAnimationFrame(raf); raf = 0;
        card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
      });
    });
  }
  tilt('.sc-card', 9);
  tilt('.sc-feature__media', 6);
  tilt('.sc-reel__item', 8);

  /* ---------- 6. Nút hút nam châm ---------- */
  document.querySelectorAll('.sc-btn, .hero-centered-actions .btn, .sc-contact__links a').forEach(btn => {
    btn.classList.add('sc-magnet');
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.25).toFixed(1) + 'px');
      btn.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1) + 'px');
    });
    btn.addEventListener('pointerleave', () => { btn.style.setProperty('--mx', '0px'); btn.style.setProperty('--my', '0px'); });
  });

  /* ---------- 7. Đèn rọi theo chuột ở phần liên hệ ---------- */
  const contact = document.querySelector('.sc-contact');
  if (contact) contact.addEventListener('pointermove', e => {
    const r = contact.getBoundingClientRect();
    contact.style.setProperty('--cx', (e.clientX - r.left) + 'px');
    contact.style.setProperty('--cy', (e.clientY - r.top) + 'px');
  });

  /* ---------- 8. Con trỏ tùy biến ---------- */
  document.querySelectorAll('.sc-card__media').forEach(n => n.dataset.cursor = n.href && n.href.includes('github.com') ? 'Mã nguồn ↗' : 'Mở web ↗');
  document.querySelectorAll('a.sc-frame').forEach(n => n.dataset.cursor = 'Mở web ↗');
  const video = document.getElementById('work-video'); if (video) video.dataset.cursor = 'Phát ▶';
  const cursor = el('div', 'sc-cursor'); cursor.setAttribute('aria-hidden', 'true');
  const label = el('span'); cursor.append(label); document.body.append(cursor);
  let tx = -100, ty = -100, cx = -100, cy = -100, curRaf = 0;
  const follow = () => {
    cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
    cursor.style.transform = `translate3d(${cx}px,${cy}px,0)`;
    curRaf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.3 ? requestAnimationFrame(follow) : 0;
  };
  addEventListener('pointermove', e => {
    tx = e.clientX; ty = e.clientY;
    const target = e.target.closest && e.target.closest('[data-cursor]');
    cursor.classList.toggle('is-active', !!target);
    cursor.classList.add('is-on');
    if (target) label.textContent = target.dataset.cursor;
    if (!curRaf) curRaf = requestAnimationFrame(follow);
  }, { passive: true });
  document.addEventListener('mouseleave', () => cursor.classList.remove('is-on'));
})();
