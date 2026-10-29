# FRS design system: the dark room

Source of truth for every FRS page. Page-specific rules go in `pages/<page>.md` and override this file.

## Idea

The black of the abaya is the room. The whole site sits on a soft black, and the only light comes
from the clothes: the gold of hand-worked talli and the colours of the mukhawar. Most abaya shops
are cream, beige and gold on white; FRS is the opposite.

## Colour (tokens in `src/app/globals.css`)

| Token | Value | Use |
| --- | --- | --- |
| `ground` | `#0e0d0c` | Page background |
| `panel` / `panel-deep` | `#181614` / `#221f1b` | A step up in tone for bands, drawers and the scrolled header. No lines between surfaces. |
| `fg` | `#e8e6e3` | All running text, at full strength |
| `fg-soft` / `fg-muted` | `#d5d1ca` / `#aaa59d` | Supporting sentences, then secondary notes only |
| `talli` | `#cfab62` | **Actions only**: primary buttons, the lit size, stock warnings |
| `line` | `#3a352f` | Form fields and real tables only |

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

## Components

- Buttons: square corners, flat fill. `solid` is talli gold; `outline` is a muted border. 44px minimum height.
- Navigation: a plain bar with the wordmark, a few links and icons. No blur and no hairline.
- The footer ends with the name at full width.

## Signature moments

- **Lit strip** (`src/components/lit-strip.tsx`): a sideways row of garments where the centred one is lit.
- **Size finder** (`src/components/size-finder.tsx`): height in, Gulf size out, with the six sizes in a row and the match lit.

## Never

Gradients on surfaces, shadows on things at rest, glass or blur, icon-topped card rows, tiny
letter-spaced capitals, emoji, cream or beige grounds, and gold on labels.
