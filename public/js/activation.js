/* =========================================================================
   Numora — activation services page: pick platform → pick country → checkout.
   ========================================================================= */
(function () {
  'use strict';

  const { SERVICE_RULES, COUNTRIES } = window.NUMORA_DATA;

  const PLATFORMS = {
    tiktok: { name: 'TikTok', icon: '🎵', cls: 'tiktok', baseUsd: 1.6 },
    instagram: { name: 'Instagram', icon: '📸', cls: 'instagram', baseUsd: 1.6 },
    whatsapp: { name: 'WhatsApp', icon: '💬', cls: 'whatsapp', baseUsd: 1.5 },
  };

  function countryOption(service, countryKey, baseUsd) {
    const c = COUNTRIES[countryKey];
    const price = window.Numora.priceInfo({ country: countryKey, priceUsd: baseUsd });
    return `
      <button class="act-country buy-act"
              data-service="${service}" data-country="${countryKey}" data-usd="${baseUsd}">
        <span class="ac-flag">${c.flag}</span>
        <span class="ac-name">${countryKey} number</span>
        <span class="ac-price">${price.display}<small>${price.secondary}</small></span>
      </button>`;
  }

  function platformSection(service) {
    const p = PLATFORMS[service];
    const countries = SERVICE_RULES[service];
    const note =
      service === 'whatsapp'
        ? 'WhatsApp is the only service that accepts Chinese numbers.'
        : `Activate ${p.name} with a verified number from any of these countries.`;

    return `
      <section class="act-block ${p.cls}" id="${service}">
        <div class="act-head">
          <span class="act-ico">${p.icon}</span>
          <div>
            <h2>${p.name} activation</h2>
            <p>${note}</p>
          </div>
        </div>
        <div class="act-countries">
          ${countries.map((ck) => countryOption(service, ck, p.baseUsd)).join('')}
        </div>
      </section>`;
  }

  function render() {
    const root = document.getElementById('activation-root');
    if (!root) return;
    root.innerHTML = Object.keys(PLATFORMS).map(platformSection).join('');

    root.querySelectorAll('.buy-act').forEach((btn) => {
      btn.addEventListener('click', () => {
        const service = btn.dataset.service;
        const country = btn.dataset.country;
        const usd = Number(btn.dataset.usd);
        const p = PLATFORMS[service];
        const c = COUNTRIES[country];
        window.Numora.openCheckout({
          kind: 'activation',
          title: `${p.icon} ${p.name} activation`,
          subtitle: `${c.flag} ${country} number`,
          country,
          priceUsd: usd,
        });
      });
    });
  }

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
  }

  document.addEventListener('DOMContentLoaded', () => {
    render();
    wireFooter();
    // Smooth-scroll to a platform if linked via #hash.
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 200);
    }
  });
})();
