# FRS — Abaya & Mukhawar Storefront

A production-ready e-commerce storefront for **FRS**, a Dubai atelier selling abayas,
mukhawar, kaftans and accessories in the UAE.

Built with Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS v4.
Every page is statically prerendered; the cart, wishlist and checkout run entirely
in the browser, so the whole site deploys as static output with no server or
database required to demo it.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run build && npm start   # production build
npm run test:e2e             # end-to-end check of the buying path (needs the build running)
npm run lint
npm run typecheck
```

`test:e2e` drives a real Chromium through the full purchase journey — size
validation, add to bag, the cart, promo codes, placing an order, cart persistence
across reload, wishlist, filters and search — and fails on any browser console
error. Set `E2E_BASE_URL` to point it at a deployed origin.

## What is here

**Shopping**
- 24 products across abayas, mukhawar, kaftans/jalabiya, sets and accessories,
  with real colourways, Gulf sizing (50–60), per-size stock, fabrics, care notes
  and verified-buyer reviews
- Shop page with filters for category, collection, colour, in-stock size and price
  band, plus five sort orders — all reflected in the URL so filtered views are
  shareable and linkable
- Product pages with a four-view gallery (front, detail, back, fabric), colour and
  size selection, live per-size stock warnings, per-emirate delivery estimates,
  "complete the look", reviews with a rating histogram, and recently viewed
- Search dialog, wishlist, and a cart drawer with a free-shipping progress meter
- Checkout with UAE emirate selection, standard/express delivery, card, Apple Pay,
  Tabby/Tamara instalments and cash on delivery, promo codes, and an order receipt

**Built for the UAE market**
- AED pricing throughout, with 5% VAT shown as included and broken out on receipts
- Cash on delivery in all seven emirates, with the handling fee in the totals
- Per-emirate delivery estimates on both the product page and at checkout
- Instalment pricing ("4 × AED 188") next to every price, as Tabby and Tamara
  shoppers expect
- WhatsApp as a first-class channel: a floating contact button, an "order on
  WhatsApp" path on every product, and prefilled messages for sizing help and
  order queries
- Arabic product and collection names alongside the English, set right-to-left

**Conversion**
- Free-shipping threshold meter in the cart drawer and on the cart page
- Low-stock and limited-run badges driven by real stock numbers
- Verified reviews with an aggregate rating, surfaced on the homepage and PDP
- Newsletter capture offering AED 50 off, with a working promo code at checkout
- Sticky add-to-bag bar on mobile, and cross-sell rails in the cart, on the
  confirmation page and on 404

**Technical**
- Product artwork is generated as SVG from each product's fit, colourway and
  decorative motif — no photography, no image assets, and every colourway renders
  instantly at any size. `src/components/product-art.tsx` holds the garment
  geometry, drape, embroidery motifs, talli, pearls and fabric weaves.
- Per-product JSON-LD (`Product`, `AggregateRating`, `Review`), plus
  `ClothingStore` and `FAQPage` schemas, a generated sitemap and robots rules
- Cart, wishlist and recently-viewed persist to `localStorage`, guarded so the
  site still works where storage is blocked
- Accessible by default: skip link, focus-visible rings, labelled controls,
  `aria-pressed` on every toggle, and `prefers-reduced-motion` honoured

## Structure

```
src/
  app/                    routes — home, shop, product, collections, cart,
                          checkout, order confirmation, wishlist, content pages
  components/             UI — header, footer, cart drawer, product card,
                          product art, checkout form, filters
  lib/
    products.ts           the catalogue
    collections.ts        collection definitions
    palette.ts            shared fabric colourways
    site.ts               brand config: contact, VAT, shipping rules, emirates
    format.ts             AED formatting, VAT, shipping and instalment maths
    store.tsx             cart, wishlist and recently-viewed context
    types.ts              domain types
scripts/e2e.mjs           end-to-end purchase-path test
```

## Taking it live

The storefront is complete and shoppable, but three integrations are deliberately
left as clearly marked seams:

1. **Payments** — `src/components/checkout-form.tsx` records the order and routes
   to the confirmation page. Swap that for Stripe, Checkout.com or Network
   International (the UAE incumbent). Tabby and Tamara each have a drop-in SDK.
2. **Orders and inventory** — the catalogue is a typed module in
   `src/lib/products.ts`. Point `getProduct` and `products` at a CMS or commerce
   backend and nothing else in the app changes.
3. **Email and newsletter** — the newsletter and contact forms validate and
   confirm client-side; each needs a single `fetch` to your provider.

Brand details — phone, WhatsApp number, address, VAT rate, shipping thresholds and
the returns window — all live in `src/lib/site.ts`.
