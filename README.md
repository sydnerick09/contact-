# Numora — verified numbers & social activation

A no-login storefront for selling phone numbers (USA, Canada, Kenya, UK, China) and
activation services (TikTok, Instagram, WhatsApp). Checkout is powered by **Paystack**,
and numbers are promised within **30–60 minutes** of payment.

## What's inside

```
contacts/
├── server.js              Express server: serves the site + Paystack verify + orders
├── package.json
├── .env.example           copy to .env and add your keys
└── public/
    ├── index.html         landing page: number listings, filters, live feed
    ├── activation.html    TikTok / Instagram / WhatsApp activation
    ├── terms.html         Terms & Conditions
    ├── css/styles.css
    └── js/
        ├── data.js        generated catalog + 50 testimonials
        ├── payment.js     Paystack + currency (KES/USD) + checkout modal
        ├── app.js         number grid, filters, search, live feed
        ├── activation.js  activation page
        └── testimonials.js animated marquee + hero live feed
```

## How pricing works

| Number country | Buyable how | Currency | Amount |
|----------------|-------------|----------|--------|
| 🇰🇪 Kenya | Bought instantly | **KES** (converted from USD) | the number's price ($1.30–$1.70) × rate |
| 🇺🇸🇨🇦🇬🇧🇨🇳 Others | Pro / Premium — requires unlock | **USD** | flat **Premium unlock** ($2 by default) |

The conversion rate and premium price live in `.env` (`USD_TO_KES`, `PREMIUM_PRICE_USD`).

**Activation rules**

- TikTok → American, Kenyan, Canadian numbers
- Instagram → Kenyan, American, Canadian numbers
- WhatsApp → USA, Kenyan, Canadian **or Chinese** numbers (China is WhatsApp-only)

## Setup

```bash
npm install
cp .env.example .env      # then edit .env and add your Paystack keys
npm start                 # → http://localhost:3000
```

Without keys the site still runs in **demo mode** (checkout simulates success, no charge),
so you can preview everything before plugging in Paystack.

### Adding your Paystack keys

Edit `.env`:

```env
PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxx   # safe in the browser
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxx   # SERVER ONLY — never commit this
USD_TO_KES=129
PREMIUM_PRICE_USD=2
SUPPORT_EMAIL=you@yourdomain.com
WHATSAPP_CONTACT=+254700000000
```

> ⚠️ The **secret key** is only ever read by `server.js`. It is never sent to the browser.
> `.env` and `orders.json` are git-ignored.
>
> For KES charges, your Paystack account must have **KES** enabled (a Kenyan Paystack account).

## Deploying

The app is a normal Node/Express server, so it deploys anywhere that runs Node:

- **Render / Railway / Fly / Heroku** — set the env vars in the dashboard, start command `npm start`.
- Push the repo to GitHub, connect it to your host, add the env vars there.

(GitHub Pages alone won't work because it can't run the Node verification server.)

## Notes

- Orders are stored in `orders.json` (simple file store). Swap for a database in production.
- Numbers are masked (last 3 digits hidden) until purchase.
- This project does not handle the actual SMS/number provisioning — wire your provider
  into the `/api/verify` success path (where each paid order is recorded).
