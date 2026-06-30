/* =========================================================================
   Numora — animated testimonials marquee + live activation feed.
   ========================================================================= */
(function () {
  'use strict';

  const { TESTIMONIALS } = window.NUMORA_DATA;
  const SERVICE_ICON = { tiktok: '🎵', instagram: '📸', whatsapp: '💬' };
  const SERVICE_NAME = { tiktok: 'TikTok', instagram: 'Instagram', whatsapp: 'WhatsApp' };

  function cardHTML(t) {
    return `
      <figure class="t-card">
        <img class="t-avatar" src="${t.avatar}" alt="${t.name}" loading="lazy"
             onerror="this.style.visibility='hidden'" />
        <figcaption>
          <div class="t-head">
            <strong>${t.name}</strong>
            <span class="t-badge">${SERVICE_ICON[t.service]} ${SERVICE_NAME[t.service]}</span>
          </div>
          <p class="t-text">${t.text}</p>
          <span class="t-verified">✅ Verified · ${t.verifiedAt}</span>
        </figcaption>
      </figure>`;
  }

  /* ---- two marquee rows, looping seamlessly (content duplicated) -------- */
  function buildMarquees() {
    const a = document.getElementById('marquee-a');
    const b = document.getElementById('marquee-b');
    if (!a || !b) return;
    const half1 = TESTIMONIALS.slice(0, 25);
    const half2 = TESTIMONIALS.slice(25);
    a.innerHTML = (half1.map(cardHTML).join('')).repeat(2);
    b.innerHTML = (half2.map(cardHTML).join('')).repeat(2);
  }

  /* ---- live activation feed (hero) — items animate in --------------------*/
  function feedItem(t) {
    return `
      <li class="feed-item">
        <img src="${t.avatar}" alt="" loading="lazy" onerror="this.style.visibility='hidden'" />
        <div>
          <span><strong>${t.name}</strong> activated <strong>${SERVICE_NAME[t.service]}</strong></span>
          <small>with a ${t.origin} number · ${t.verifiedAt}</small>
        </div>
        <span class="feed-tick">✓</span>
      </li>`;
  }

  function startLiveFeed() {
    const feed = document.getElementById('live-feed');
    if (!feed) return;
    const pool = TESTIMONIALS.slice();
    let i = 0;

    function seed() {
      feed.innerHTML = pool.slice(0, 5).map(feedItem).join('');
      i = 5;
    }
    seed();

    setInterval(() => {
      const t = pool[i % pool.length];
      i++;
      const li = document.createElement('div');
      li.innerHTML = feedItem(t).trim();
      const node = li.firstChild;
      node.classList.add('feed-enter');
      feed.prepend(node);
      // keep the list short
      while (feed.children.length > 5) feed.lastChild.remove();
      requestAnimationFrame(() => node.classList.remove('feed-enter'));
    }, 2600);
  }

  document.addEventListener('DOMContentLoaded', () => {
    buildMarquees();
    startLiveFeed();
  });
})();
