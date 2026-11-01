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

---

# Safqa (صفقة) — B2B quoting & negotiation agent

Lives at **`/safqa`** in this app, outside the storefront chrome. Safqa takes Gulf Arabic
(Khaleeji) voice-note transcriptions or informal chat, normalises the dialect
(كتاوت → relays, سفايف → brake pads, بلك → blocks…), checks stock, prices the order
through hard margin guardrails, negotiates, and issues a signed quotation it can send
on WhatsApp.

## Try it

```bash
echo 'ANTHROPIC_API_KEY=sk-ant-...' > .env.local
npm install
npm run dev            # open http://localhost:3000/safqa
```

On Vercel, add `ANTHROPIC_API_KEY` under Project → Settings → Environment Variables
and redeploy. Optional: `SAFQA_MODEL` (default `claude-opus-5-5`) and
`SAFQA_QUOTE_SECRET` (signs quote links; falls back to the API key).

Things worth testing:
- The sample openers (Emirati, Saudi, Kuwaiti, English, and one that's ambiguous enough to need a clarifying question)
- The quick pushback chips once a conversation is going: "من الآخر؟", a 20% competitor demand,
  "let's double the quantity", "send me the quote on WhatsApp", and a prompt-injection attempt for 30%
- The voice button (Chrome, Arabic, UAE) to dictate like a real voice note
- Switching the client tier (new / repeat / key account) in the deal desk, which changes what is auto-approved

## How it works

| Piece | File |
|---|---|
| Agent loop (Claude tool use, streamed to the UI as NDJSON) | `src/app/api/safqa/route.ts` |
| System prompt: dialect, extraction, negotiation strategy, tone | `src/lib/safqa/prompt.ts` |
| Tools: `search_inventory`, `calculate_pricing`, `generate_quote_pdf`, `dispatch_whatsapp_quote`, `flag_for_human_review` | `src/lib/safqa/tools.ts` |
| Pricing engine and guardrails | `src/lib/safqa/pricing.ts` |
| Demo catalogue (auto parts, construction, industrial hardware, with Khaleeji aliases) | `src/lib/safqa/catalog.ts` |
| Signed, stateless quotations (`/safqa/quote?q=…`, print to PDF) | `src/lib/safqa/quote.ts`, `src/app/safqa/quote/page.tsx` |
| Console UI: chat, tool trace, live deal desk | `src/components/safqa/console.tsx` |

**The guardrails live in code, not just in the prompt.** `calculate_pricing` auto-approves up to
5% only for volume orders (≥ AED 2,000 or ≥ 50 units) or repeat/key clients. It allows
5–12% as a negotiated concession and clamps anything beyond 12% to the floor with status
`rejected_below_floor`. `generate_quote_pdf` recomputes every price from the SKUs and
refuses a discount above 12%, so no conversation can produce an out-of-policy quote.
The client tier comes from the CRM profile, not from anything the customer claims.

UAE deliveries carry 5% VAT. GCC exports are zero-rated. Building materials go by truck,
everything else by courier. UAE orders over AED 7,500 ship free.

WhatsApp dispatch is simulated: it prepares a `wa.me` link with the message and quote, and
the operator sends it with one tap. To go live, swap it for the WhatsApp Business API.
