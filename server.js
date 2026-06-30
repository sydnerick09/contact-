/**
 * Numora — backend server.
 *
 * Responsibilities:
 *   - Serve the static front-end in /public.
 *   - Expose non-secret config (Paystack PUBLIC key + currency rate) to the browser.
 *   - Verify Paystack transactions server-side using the SECRET key.
 *   - Persist orders to orders.json and assign a 30–60 min delivery window.
 *
 * The Paystack SECRET key is read from the environment and never sent to the client.
 */
require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || '';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const USD_TO_KES = Number(process.env.USD_TO_KES || 129);
const PREMIUM_PRICE_USD = Number(process.env.PREMIUM_PRICE_USD || 2);
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@numora.example';
const WHATSAPP_CONTACT = process.env.WHATSAPP_CONTACT || '';

// On serverless (Vercel) the project FS is read-only — only /tmp is writable.
const ORDERS_FILE = process.env.VERCEL
  ? path.join('/tmp', 'orders.json')
  : path.join(__dirname, 'orders.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ------------------------------------------------------------------ */
/*  Order storage (simple JSON file — swap for a DB in production)      */
/* ------------------------------------------------------------------ */
function readOrders() {
  try {
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  } catch (err) {
    // Don't fail the request if the platform FS is read-only.
    console.warn('Could not persist orders:', err.message);
  }
}

/* ------------------------------------------------------------------ */
/*  Public config (safe to expose)                                     */
/* ------------------------------------------------------------------ */
app.get('/api/config', (req, res) => {
  res.json({
    paystackPublicKey: PAYSTACK_PUBLIC_KEY,
    usdToKes: USD_TO_KES,
    premiumPriceUsd: PREMIUM_PRICE_USD,
    supportEmail: SUPPORT_EMAIL,
    whatsappContact: WHATSAPP_CONTACT,
    // Lets the front-end show a demo path when keys aren't configured yet.
    paymentConfigured: Boolean(PAYSTACK_PUBLIC_KEY && PAYSTACK_SECRET_KEY),
  });
});

/* ------------------------------------------------------------------ */
/*  Verify a Paystack transaction and record the order                 */
/* ------------------------------------------------------------------ */
app.get('/api/verify', async (req, res) => {
  const { reference } = req.query;
  if (!reference) {
    return res.status(400).json({ ok: false, error: 'Missing reference.' });
  }

  if (!PAYSTACK_SECRET_KEY) {
    return res.status(503).json({
      ok: false,
      error: 'Payment verification is not configured on the server yet.',
    });
  }

  try {
    const resp = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );
    const data = await resp.json();

    if (!data.status || data.data?.status !== 'success') {
      return res.status(402).json({
        ok: false,
        error: data.message || 'Transaction not successful.',
      });
    }

    const tx = data.data;
    const now = Date.now();
    const order = {
      reference: tx.reference,
      amount: tx.amount / 100, // back from subunits
      currency: tx.currency,
      email: tx.customer?.email || '',
      item: tx.metadata?.item || tx.metadata?.custom_fields || null,
      paidAt: tx.paid_at || new Date(now).toISOString(),
      // Delivery promise: 30 to 60 minutes after payment.
      deliveryFrom: new Date(now + 30 * 60 * 1000).toISOString(),
      deliveryTo: new Date(now + 60 * 60 * 1000).toISOString(),
      status: 'paid',
    };

    const orders = readOrders();
    // De-dupe by reference (verify can be called more than once).
    if (!orders.find((o) => o.reference === order.reference)) {
      orders.push(order);
      writeOrders(orders);
    }

    res.json({ ok: true, order });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ ok: false, error: 'Could not reach Paystack.' });
  }
});

/* ------------------------------------------------------------------ */
/*  Lightweight order lookup (e.g. a buyer checking status)            */
/* ------------------------------------------------------------------ */
app.get('/api/orders/:reference', (req, res) => {
  const order = readOrders().find((o) => o.reference === req.params.reference);
  if (!order) return res.status(404).json({ ok: false, error: 'Order not found.' });
  res.json({ ok: true, order });
});

// Export the app so Vercel can use it as a serverless handler.
module.exports = app;

// Only bind a port when run directly (local dev / `npm start`).
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n  Numora running → http://localhost:${PORT}`);
    if (!PAYSTACK_PUBLIC_KEY) {
      console.log('  ⚠  No Paystack keys set yet — checkout runs in DEMO mode.');
      console.log('     Copy .env.example to .env and add your keys.\n');
    } else {
      console.log('  ✓ Paystack keys loaded.\n');
    }
  });
}
