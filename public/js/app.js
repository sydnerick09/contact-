/* =========================================================================
   Numora — landing page logic: number grid, filters, search, live feed.
   ========================================================================= */
(function () {
  'use strict';

  const { NUMBERS } = window.NUMORA_DATA;
  const SERVICE_ICON = { tiktok: '🎵', instagram: '📸', whatsapp: '💬' };
  const SERVICE_NAME = { tiktok: 'TikTok', instagram: 'Instagram', whatsapp: 'WhatsApp' };
  const TIER_LABEL = { standard: 'Standard', pro: 'Pro ⭐', premium: 'Premium 👑' };

  const state = { country: 'all', service: 'all', search: '' };

  /* ---- render one number card ------------------------------------------ */
  function card(n) {
    const price = window.Numora.priceInfo(n);
    const sold = n.status === 'sold';

    const svcBadges = n.services
      .map(
        (s) =>
          `<span class="svc" title="Activates ${SERVICE_NAME[s]}">${SERVICE_ICON[s]} ${SERVICE_NAME[s]}</span>`
      )
      .join('');

    let action;
    if (sold) {
      action = `<button class="btn btn-disabled" disabled>Sold out</button>`;
    } else if (n.directBuy) {
      action = `<button class="btn btn-primary btn-sm buy" data-id="${n.id}">Buy now</button>`;
    } else {
      action = `<button class="btn btn-gold btn-sm buy" data-id="${n.id}">Unlock · ${price.display}</button>`;
    }

    return `
      <article class="num-card ${sold ? 'is-sold' : ''}">
        ${sold ? '<span class="sold-ribbon">SOLD</span>' : ''}
        <header class="num-top">
          <span class="flag">${n.flag}</span>
          <div class="num-loc">
            <strong>${n.city}</strong>
            <span>${n.area} · ${n.country}</span>
          </div>
          <span class="tier tier-${n.tier}">${TIER_LABEL[n.tier]}</span>
        </header>
        <div class="num-value">${n.masked}</div>
        <div class="num-svcs">${svcBadges || '<span class="svc muted">General use</span>'}</div>
        <footer class="num-foot">
          <div class="num-price">
            <strong>${price.display}</strong>
            <span>${price.secondary}</span>
          </div>
          ${action}
        </footer>
      </article>`;
  }

  /* ---- filtering ------------------------------------------------------- */
  function applyFilters() {
    const q = state.search.toLowerCase();
    return NUMBERS.filter((n) => {
      if (state.country !== 'all' && n.country !== state.country) return false;
      if (state.service === 'available') {
        if (n.status !== 'available') return false;
      } else if (state.service !== 'all') {
        if (!n.services.includes(state.service)) return false;
      }
      if (q) {
        const hay = `${n.city} ${n.area} ${n.country} ${n.display}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function render() {
    const list = applyFilters();
    const grid = document.getElementById('numbers-grid');
    const empty = document.getElementById('numbers-empty');
    grid.innerHTML = list.map(card).join('');
    empty.hidden = list.length !== 0;

    grid.querySelectorAll('.buy').forEach((btn) => {
      btn.addEventListener('click', () => {
        const n = NUMBERS.find((x) => x.id === Number(btn.dataset.id));
        if (!n) return;
        window.Numora.openCheckout({
          kind: 'number',
          title: `${n.flag} ${n.city} ${n.masked}`,
          subtitle: `${n.area} · ${n.country} · ${TIER_LABEL[n.tier]}`,
          country: n.country,
          priceUsd: n.priceUsd,
        });
      });
    });
  }

  /* ---- filter UI ------------------------------------------------------- */
  function wireFilters() {
    document.querySelectorAll('#country-filters .chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#country-filters .chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        state.country = chip.dataset.country;
        render();
      });
    });
    document.querySelectorAll('#service-filters .chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#service-filters .chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        state.service = chip.dataset.service;
        render();
      });
    });
    const search = document.getElementById('search');
    if (search) {
      search.addEventListener('input', () => {
        state.search = search.value;
        render();
      });
    }
  }

  /* ---- footer + misc --------------------------------------------------- */
  function wireFooter() {
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();

    window.Numora.ready.then((cfg) => {
      const mail = document.getElementById('footer-mail');
      if (mail) mail.href = 'mailto:' + cfg.supportEmail;
      const wa = document.getElementById('footer-wa');
      if (wa && cfg.whatsappContact) {
        wa.href = 'https://wa.me/' + cfg.whatsappContact.replace(/[^0-9]/g, '');
      } else if (wa) {
        wa.style.display = 'none';
      }
    });

    const stat = document.getElementById('stat-count');
    if (stat) stat.textContent = NUMBERS.filter((n) => n.status === 'available').length;
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('numbers-grid')) return;
    wireFilters();
    wireFooter();
    render();
  });
})();
