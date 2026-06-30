/* =========================================================================
   Numora — catalog + testimonial data (generated, deterministic).
   Attaches everything to window.NUMORA_DATA so plain <script> pages can use it.
   ========================================================================= */
(function () {
  'use strict';

  /* ---- tiny seeded RNG so the catalog is stable across reloads ---------- */
  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rng = mulberry32(20260630);
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const pad = (n, len) => String(n).padStart(len, '0');
  const randDigits = (len) => {
    let s = '';
    for (let i = 0; i < len; i++) s += Math.floor(rng() * 10);
    return s;
  };

  /* ---- which countries can activate which service ---------------------- */
  // WhatsApp is the only service that accepts Chinese numbers.
  const SERVICE_RULES = {
    tiktok: ['USA', 'Kenya', 'Canada'],
    instagram: ['Kenya', 'USA', 'Canada'],
    whatsapp: ['USA', 'Kenya', 'Canada', 'China'],
  };

  /* ---- country / city / area definitions ------------------------------- */
  const COUNTRIES = {
    USA: {
      name: 'USA',
      flag: '🇺🇸',
      dial: '+1',
      currency: 'USD',
      cities: [
        { city: 'New York', region: 'NY', codes: ['212', '646', '917'] },
        { city: 'Los Angeles', region: 'CA', codes: ['213', '310', '323'] },
        { city: 'Chicago', region: 'IL', codes: ['312', '773'] },
        { city: 'Houston', region: 'TX', codes: ['713', '281'] },
        { city: 'Miami', region: 'FL', codes: ['305', '786'] },
        { city: 'Atlanta', region: 'GA', codes: ['404', '470'] },
        { city: 'Dallas', region: 'TX', codes: ['214', '469'] },
        { city: 'Seattle', region: 'WA', codes: ['206', '425'] },
        { city: 'Boston', region: 'MA', codes: ['617', '857'] },
        { city: 'Phoenix', region: 'AZ', codes: ['602', '480'] },
        { city: 'Denver', region: 'CO', codes: ['303', '720'] },
        { city: 'Las Vegas', region: 'NV', codes: ['702', '725'] },
        { city: 'San Francisco', region: 'CA', codes: ['415', '628'] },
        { city: 'Washington', region: 'DC', codes: ['202'] },
        { city: 'Philadelphia', region: 'PA', codes: ['215', '267'] },
        { city: 'Nashville', region: 'TN', codes: ['615'] },
        { city: 'Charlotte', region: 'NC', codes: ['704'] },
        { city: 'Portland', region: 'OR', codes: ['503'] },
      ],
      format: (code) => `${code} ${randDigits(3)}-${randDigits(4)}`,
    },
    Canada: {
      name: 'Canada',
      flag: '🇨🇦',
      dial: '+1',
      currency: 'USD',
      cities: [
        { city: 'Toronto', region: 'ON', codes: ['416', '647'] },
        { city: 'Vancouver', region: 'BC', codes: ['604', '778'] },
        { city: 'Montreal', region: 'QC', codes: ['514', '438'] },
        { city: 'Calgary', region: 'AB', codes: ['403', '587'] },
        { city: 'Ottawa', region: 'ON', codes: ['613'] },
        { city: 'Edmonton', region: 'AB', codes: ['780'] },
      ],
      format: (code) => `${code} ${randDigits(3)}-${randDigits(4)}`,
    },
    Kenya: {
      name: 'Kenya',
      flag: '🇰🇪',
      dial: '+254',
      currency: 'KES',
      cities: [
        { city: 'Nairobi', region: 'Westlands', codes: ['712', '722', '701'] },
        { city: 'Nairobi', region: 'Kilimani', codes: ['729', '720', '110'] },
        { city: 'Nairobi', region: 'CBD', codes: ['748', '768', '758'] },
        { city: 'Mombasa', region: 'Nyali', codes: ['733', '738', '750'] },
        { city: 'Kisumu', region: 'Milimani', codes: ['790', '791', '792'] },
        { city: 'Nakuru', region: 'Section 58', codes: ['795', '796', '797'] },
        { city: 'Eldoret', region: 'Langas', codes: ['740', '741', '742'] },
        { city: 'Thika', region: 'Section 9', codes: ['115', '116', '117'] },
        { city: 'Nyeri', region: 'Town', codes: ['113', '114', '111'] },
      ],
      format: (code) => `${code} ${randDigits(3)} ${randDigits(3)}`,
    },
    UK: {
      name: 'UK',
      flag: '🇬🇧',
      dial: '+44',
      currency: 'USD',
      cities: [
        { city: 'London', region: 'Greater London', codes: ['7400', '7700', '7911'] },
        { city: 'Manchester', region: 'England', codes: ['7500', '7501'] },
        { city: 'Birmingham', region: 'England', codes: ['7800', '7801'] },
        { city: 'Liverpool', region: 'England', codes: ['7900', '7901'] },
        { city: 'Glasgow', region: 'Scotland', codes: ['7700', '7701'] },
        { city: 'Edinburgh', region: 'Scotland', codes: ['7702', '7703'] },
      ],
      format: (code) => `${code} ${randDigits(6)}`,
    },
    China: {
      name: 'China',
      flag: '🇨🇳',
      dial: '+86',
      currency: 'USD',
      cities: [
        { city: 'Beijing', region: 'Chaoyang', codes: ['131', '132', '133'] },
        { city: 'Shanghai', region: 'Pudong', codes: ['138', '139', '137'] },
        { city: 'Guangzhou', region: 'Tianhe', codes: ['150', '151', '152'] },
        { city: 'Shenzhen', region: 'Futian', codes: ['158', '159', '155'] },
      ],
      format: (code) => `${code} ${randDigits(4)} ${randDigits(4)}`,
    },
  };

  // How many numbers to generate per country.
  const COUNTS = { Kenya: 22, USA: 26, Canada: 14, UK: 12, China: 8 };

  function servicesFor(country) {
    return Object.keys(SERVICE_RULES).filter((svc) =>
      SERVICE_RULES[svc].includes(country)
    );
  }

  /* ---- build the number catalog ---------------------------------------- */
  const NUMBERS = [];
  let id = 1000;

  Object.keys(COUNTS).forEach((countryKey) => {
    const c = COUNTRIES[countryKey];
    for (let i = 0; i < COUNTS[countryKey]; i++) {
      const place = pick(c.cities);
      const code = pick(place.codes);
      const local = c.format(code);
      const priceUsd = +(1.3 + rng() * 0.4).toFixed(2); // 1.30 – 1.70

      const isKenya = countryKey === 'Kenya';
      // Only Kenyan numbers can be bought directly. Everything else is locked
      // behind the premium subscription and shown as Pro / Premium.
      let tier;
      if (isKenya) {
        tier = rng() < 0.18 ? 'pro' : 'standard';
      } else {
        tier = rng() < 0.45 ? 'premium' : 'pro';
      }

      // A slice of the catalog is already sold — social proof.
      const sold = rng() < 0.28;

      NUMBERS.push({
        id: id++,
        country: countryKey,
        flag: c.flag,
        dial: c.dial,
        city: place.city,
        area: place.region,
        display: `${c.dial} ${local}`,
        // Last 3 digits masked until purchase.
        masked: `${c.dial} ${local}`.slice(0, -3) + '•••',
        priceUsd,
        currency: c.currency,
        tier, // standard | pro | premium
        directBuy: isKenya, // only Kenya is instantly buyable
        status: sold ? 'sold' : 'available',
        services: servicesFor(countryKey), // tiktok / instagram / whatsapp
      });
    }
  });

  /* ---- testimonials: 50 happy customers -------------------------------- */
  const FIRST_NAMES = [
    'Brian', 'Aisha', 'Kevin', 'Mercy', 'Daniel', 'Wanjiru', 'James', 'Faith',
    'Michael', 'Grace', 'John', 'Cynthia', 'Samuel', 'Diana', 'Peter', 'Lucy',
    'David', 'Esther', 'Emmanuel', 'Joy', 'Tyler', 'Megan', 'Carlos', 'Sofia',
    'Liam', 'Olivia', 'Noah', 'Emma', 'Lucas', 'Ava', 'Chen', 'Wei', 'Mateo',
    'Isabella', 'Henry', 'Mia', 'Jackson', 'Amelia', 'Aiden', 'Chloe', 'Kwame',
    'Zainab', 'Omar', 'Leila', 'Ethan', 'Nora', 'Felix', 'Hannah', 'Victor', 'Ruth',
  ];
  const LAST_INITIAL = 'ABCDEFGHIJKLMNOPRSTW'.split('');
  const SERVICES = ['whatsapp', 'tiktok', 'instagram'];
  // Chinese numbers only activate WhatsApp; TikTok/Instagram exclude China.
  const ORIGIN_BY_SERVICE = {
    whatsapp: ['American', 'Kenyan', 'Canadian', 'Chinese'],
    tiktok: ['American', 'Kenyan', 'Canadian'],
    instagram: ['American', 'Kenyan', 'Canadian'],
  };
  const MESSAGES = {
    whatsapp: [
      'Activated my WhatsApp in minutes with a {origin} number. Smooth! 🙏',
      'My WhatsApp Business is finally verified using a {origin} number. Thank you!',
      'Got the code fast and WhatsApp went through. Highly recommend.',
    ],
    tiktok: [
      'My TikTok is live again thanks to a {origin} number. You guys are the best!',
      'Activated TikTok with a {origin} number — no stress at all. 💯',
      'New TikTok account verified instantly with a {origin} number.',
    ],
    instagram: [
      'Instagram verified with a {origin} number in one go. Amazing service!',
      'Got my Instagram activated using a {origin} number. So fast! ❤️',
      'Reactivated my IG with a {origin} number. Works perfectly.',
    ],
  };

  const TESTIMONIALS = [];
  for (let i = 0; i < 50; i++) {
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_INITIAL)}.`;
    const service = SERVICES[i % SERVICES.length];
    const origin = pick(ORIGIN_BY_SERVICE[service]);
    const tpl = pick(MESSAGES[service]);
    TESTIMONIALS.push({
      name,
      service,
      origin,
      text: tpl.replace('{origin}', origin),
      // DiceBear avatars (no key needed). Cached by the browser.
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        name + i
      )}&radius=50`,
      verifiedAt: `${1 + Math.floor(rng() * 58)} min ago`,
    });
  }

  window.NUMORA_DATA = {
    NUMBERS,
    TESTIMONIALS,
    SERVICE_RULES,
    COUNTRIES,
    servicesFor,
  };
})();
