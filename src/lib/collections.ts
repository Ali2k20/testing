import type { Collection } from "./types";

export const collections: Collection[] = [
  {
    slug: "new-arrivals",
    name: "New Arrivals",
    arabicName: "وصل حديثاً",
    headline: "The pieces that just left the atelier",
    description:
      "Cut and finished this season in Al Quoz. Small runs, so sizes move quickly — most styles sell through within three weeks.",
    accent: "#B08D57",
  },
  {
    slug: "ramadan-nights",
    name: "Ramadan Nights",
    arabicName: "ليالي رمضان",
    headline: "For iftar tables and long, warm evenings",
    description:
      "Soft, forgiving cuts in breathable crepe and cotton — designed to sit comfortably through a four-hour gathering and still photograph beautifully.",
    accent: "#6B6B4E",
  },
  {
    slug: "eid-capsule",
    name: "Eid Capsule",
    arabicName: "مجموعة العيد",
    headline: "Quiet luxury for the morning of Eid",
    description:
      "Hand-worked zari, pearl trims and liquid satin. Our most photographed pieces, made in runs of forty or fewer.",
    accent: "#C98B84",
  },
  {
    slug: "everyday-luxe",
    name: "Everyday Luxe",
    arabicName: "الأناقة اليومية",
    headline: "School run, office, airport",
    description:
      "Crease-resistant fabrics, deep pockets and hems that clear the floor. The abayas our customers re-order in a second colour.",
    accent: "#2A241E",
  },
  {
    slug: "occasion",
    name: "Occasion & Bridal",
    arabicName: "المناسبات",
    headline: "Milkha, henna, walima",
    description:
      "Statement mukhawar and kaftans with hand embroidery that takes up to sixty hours. Made to order in your measurements at no extra cost.",
    accent: "#8A6A9E",
  },
  {
    slug: "best-sellers",
    name: "Best Sellers",
    arabicName: "الأكثر مبيعاً",
    headline: "What Dubai keeps buying",
    description:
      "Ranked by re-order rate, not margin. If a piece is on this list, at least one in five customers came back for a second colour.",
    accent: "#B08D57",
  },
];

export function getCollection(slug: string) {
  return collections.find((collection) => collection.slug === slug);
}
