export type Category = "abaya" | "mukhawar" | "kaftan" | "set" | "accessory";

export type Fit = "straight" | "flared" | "kimono" | "butterfly" | "a-line" | "relaxed";

export interface ColorOption {
  /** Slug used in URLs and variant keys. */
  name: string;
  /** Human label shown to shoppers. */
  label: string;
  /** Base fabric colour. */
  hex: string;
  /** Highlight used for drape and sheen in the generated product art. */
  sheen: string;
}

export interface SizeOption {
  /** Gulf abaya sizing (50-60) or letter sizing for accessories. */
  label: string;
  /** Length in centimetres, shoulder to hem. */
  lengthCm?: number;
  stock: number;
}

export interface Review {
  author: string;
  emirate: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified: boolean;
}

export interface Product {
  slug: string;
  name: string;
  arabicName: string;
  category: Category;
  /** Price in AED, VAT inclusive. */
  price: number;
  /** Was-price in AED, when the item is on offer. */
  compareAtPrice?: number;
  tagline: string;
  description: string;
  fabric: string;
  care: string;
  origin: string;
  fit: Fit;
  /** Collection slugs this product belongs to. */
  collections: string[];
  colors: ColorOption[];
  sizes: SizeOption[];
  details: string[];
  /** Sort weight for "most loved" ordering; higher sells better. */
  popularity: number;
  releasedAt: string;
  reviews: Review[];
  /** Slugs of products shown in "Complete the look". */
  pairsWith: string[];
}

export interface Collection {
  slug: string;
  name: string;
  arabicName: string;
  headline: string;
  description: string;
  accent: string;
}

export interface CartLine {
  /** `${slug}:${color}:${size}` — one line per variant. */
  id: string;
  slug: string;
  color: string;
  size: string;
  quantity: number;
}
