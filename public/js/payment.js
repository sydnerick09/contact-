/* =========================================================================
   Numora — payment + currency module (shared by all pages).
   Exposes window.Numora with: config, priceInfo(), openCheckout().
   ========================================================================= */
(function () {
  'use strict';

  const Numora = {
    config: {
      paystackPublicKey: '',
      usdToKes: 129,
      premiumPriceUsd: 2,
      supportEmail: 'support@numora.example',
      whatsappContact: '',
      paymentConfigured: false,
    },
    ready: null,
  };

  /* ---- load non-secret config from the server -------------------------- */
  Numora.ready = fetch('/api/config')
    .then((r) => r.json())
    .then((cfg) => {
      Object.assign(Numora.config, cfg);
      return Numora.config;
    })
    .catch(() => Numora.config); // fall back to defaults (demo mode)

  /* ---- currency helpers ------------------------------------------------ */
  const fmtUSD = (n) =>
    '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtKES = (n) =>
    'KSh ' + Math.round(n).toLocaleString('en-KE');

  /**
   * Pricing rules:
   *   - Kenyan numbers are bought directly, charged in KES (price × rate).
   *   - All other countries are Pro/Premium: a flat Premium unlock in USD
   *     (default $2) approves and delivers the number.
   */
  Numora.priceInfo = function (item) {
    const isKenya = item.country === 'Kenya';
    if (isKenya) {
      const amount = item.priceUsd * Numora.config.usdToKes;
      return {
        currency: 'KES',
        amount,                       // major units
        subunits: Math.round(amount * 100),
        display: fmtKES(amount),
        secondary: fmtUSD(item.priceUsd),
        premium: false,
      };
    }
    const usd = Numora.config.premiumPriceUsd;
    return {
      currency: 'USD',
      amount: usd,
      subunits: Math.round(usd * 100),
      display: fmtUSD(usd),
      secondary: 'Premium unlock',
      premium: true,
    };
  };

  /* ---- checkout modal --------------------------------------------------- */
  let current = null;

  function $(sel) { return document.querySelector(sel); }

  function closeModals() {
    const co = $('#checkout-modal');
    const su = $('#success-modal');
    if (co) co.hidden = true;
    if (su) su.hidden = true;
  }

  /**
   * item = {
   *   kind: 'number' | 'activation',
   *   title, subtitle, country, priceUsd, ...passthrough metadata
   * }
   */
  Numora.openCheckout = function (item) {
    current = item;
    const modal = $('#checkout-modal');
    if (!modal) return;

    const price = Numora.priceInfo(item);
    $('#co-summary').innerHTML = `
      <div class="co-line">
        <span class="co-title">${item.title}</span>
        <span class="co-price">${price.display}</span>
      </div>
      <div class="co-sub">
        <span>${item.subtitle || ''}</span>
        <span>${price.premium ? '🔒 Premium · USD' : '🇰🇪 Charged in KES'}</span>
      </div>`;

    const note = $('#co-note');
    note.textContent = Numora.config.paymentConfigured
      ? 'Secured by Paystack. You will receive your number 30–60 minutes after payment.'
      : '⚠ Demo mode — no Paystack keys configured yet, so no real charge will happen.';

    $('#co-agree').checked = false;
    modal.hidden = false;
  };

  function generateRef() {
    return 'NUM-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  async function verify(reference) {
    try {
      const r = await fetch('/api/verify?reference=' + encodeURIComponent(reference));
      return await r.json();
    } catch {
      return { ok: false, error: 'Network error during verification.' };
    }
  }

  function showSuccess(item, price, reference, demo) {
    closeModals();
    const su = $('#success-modal');
    if (!su) return;
    const body = $('#success-body');
    body.innerHTML = `
      <strong>${item.title}</strong> — ${price.display}${demo ? ' <em>(demo)</em>' : ''}<br />
      Reference: <code>${reference}</code><br /><br />
      📦 Your number will be delivered within <strong>30–60 minutes</strong> to your email.
      Keep a separate active line ready to receive your service.`;
    su.hidden = false;
  }

  async function startPayment() {
    if (!current) return;
    const email = ($('#co-email').value || '').trim();
    const agreed = $('#co-agree').checked;
    const note = $('#co-note');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      note.textContent = '✋ Please enter a valid email address.';
      return;
    }
    if (!agreed) {
      note.textContent = '✋ Please accept the Terms & Conditions to continue.';
      return;
    }

    const price = Numora.priceInfo(current);
    const reference = generateRef();

    // Demo mode — no keys yet.
    if (!Numora.config.paymentConfigured || typeof PaystackPop === 'undefined') {
      $('#co-pay').disabled = true;
      $('#co-pay').textContent = 'Processing…';
      setTimeout(() => {
        $('#co-pay').disabled = false;
        $('#co-pay').textContent = 'Pay now';
        showSuccess(current, price, reference, true);
      }, 900);
      return;
    }

    const handler = PaystackPop.setup({
      key: Numora.config.paystackPublicKey,
      email,
      amount: price.subunits,
      currency: price.currency,
      ref: reference,
      metadata: {
        item: {
          kind: current.kind,
          title: current.title,
          country: current.country,
          subtitle: current.subtitle || '',
        },
        custom_fields: [
          { display_name: 'Item', variable_name: 'item', value: current.title },
          { display_name: 'Country', variable_name: 'country', value: current.country },
        ],
      },
      callback: function (response) {
        verify(response.reference).then((res) => {
          if (res.ok) {
            showSuccess(current, price, response.reference, false);
          } else {
            note.textContent = '⚠ ' + (res.error || 'Could not verify payment.');
          }
        });
      },
      onClose: function () {
        note.textContent = 'Payment window closed. You can try again anytime.';
      },
    });
    handler.openIframe();
  }

  /* ---- wire modal buttons (guarded — pages may not have the modal) ------ */
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) closeModals();
  });
  document.addEventListener('DOMContentLoaded', () => {
    const pay = $('#co-pay');
    if (pay) pay.addEventListener('click', startPayment);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModals();
    });
  });

  window.Numora = Numora;
})();
