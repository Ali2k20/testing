# FRS design system

Source of truth for every FRS page. Page-specific rules go in `pages/<page>.md` and override this file.

## Idea

The brand is the cream and black of the FRS wordmark (`public/brand/frs-wordmark.svg`,
`src/components/frs-logo.tsx`). The garments are shot low-key on dark grounds, so on the cream page
each one reads like a framed photograph, and in the hero strip only the centred piece is lit while
the rest fade into the cream. The Arabic display lettering carries the logo's weight.

## Colour (tokens in `src/app/globals.css`)

| Token | Value | Use |
| --- | --- | --- |
| `ground` | `#ebe3d6` | Page background, the brand cream |
| `panel` / `panel-deep` | `#e3d9c9` / `#d9cdba` | A step down in tone for bands, drawers and the scrolled header. No lines between surfaces. |
| `fg` | `#111010` | All running text, the logo, and primary buttons |
| `fg-soft` / `fg-muted` | `#2b2724` / `#5e564d` | Supporting sentences, then secondary notes only |
| `talli` | `#7e6331` | A deep gold for the few lit details: the matched size, stars, stock warnings |
| `line` | `#c9bca8` | Form fields and real tables only |

Inverted pairs (`bg-fg text-ground`) are used for one light card per screen at most.

## Type

- **Display:** Bodoni Moda, regular, tracking -0.02em, leading 0.96–1.04. Sentence case. No italic accent words.
- **Text:** Hanken Grotesk. Body 16–18px, leading 1.5–1.6. Small text never below 13px. No spaced capitals.
- **Arabic display:** Badeen Display, 48px and up only (hero, collection titles).
- **Arabic text:** Noto Naskh Arabic below 48px (product and collection names). Always `lang="ar" dir="rtl"`.

## Pictures

Garments are drawn as low-key studio shots (`src/components/product-art.tsx`): a dark backdrop with
one pool of light behind each piece. Replace them with real photography shot the same way, on a
dark ground with one light, when it exists.

The favicon is the swash R from the wordmark on cream (`src/app/icon.svg`).

## Components

- Buttons: square corners, flat fill. `solid` is black on cream; `outline` is a muted border. 44px minimum height.
- Navigation: a plain bar with the wordmark, a few links and icons. No blur and no hairline.
- The footer ends with the name at full width.

## Signature moments

- **Lit strip** (`src/components/lit-strip.tsx`): a sideways row of garments where the centred one is lit.
- **Size finder** (`src/components/size-finder.tsx`): height in, Gulf size out, with the six sizes in a row and the match lit.

## Never

Gradients on surfaces, shadows on things at rest, glass or blur, icon-topped card rows, tiny
letter-spaced capitals, emoji, and gold on labels.
