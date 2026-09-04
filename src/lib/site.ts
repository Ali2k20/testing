export const site = {
  name: "FRS",
  legalName: "FRS Atelier LLC",
  tagline: "Abayas & Mukhawar, made in the UAE",
  description:
    "FRS is a Dubai atelier crafting abayas and mukhawar in Japanese crepe, silk and hand-worked talli. Free UAE delivery over AED 300, cash on delivery, 14-day returns.",
  url: "https://frs.ae",
  email: "hello@frs.ae",
  phoneDisplay: "+971 4 555 0110",
  whatsapp: "971555550110",
  addressLines: ["Studio 04, Alserkal Avenue", "Al Quoz 1, Dubai", "United Arab Emirates"],
  instagram: "https://instagram.com/frs.ae",
  tiktok: "https://tiktok.com/@frs.ae",
  currency: "AED",
  /** UAE VAT, already included in every displayed price. */
  vatRate: 0.05,
  /** Order subtotal (AED) at which UAE delivery becomes free. */
  freeShippingThreshold: 300,
  standardShipping: 25,
  expressShipping: 45,
  codFee: 10,
  /** Number of interest-free instalments offered at checkout. */
  instalments: 4,
  returnWindowDays: 14,
  newsletterDiscount: 50,
  newsletterCode: "FRS50",
} as const;

export const emirates = [
  "Abu Dhabi",
  "Dubai",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah",
] as const;

export type Emirate = (typeof emirates)[number];

/** Working-day delivery estimate per emirate, used on the PDP and at checkout. */
export const deliveryDays: Record<Emirate, string> = {
  "Abu Dhabi": "1-2 working days",
  Dubai: "Next day",
  Sharjah: "1-2 working days",
  Ajman: "1-2 working days",
  "Umm Al Quwain": "2-3 working days",
  "Ras Al Khaimah": "2-3 working days",
  Fujairah: "2-3 working days",
};

export function whatsappLink(message: string) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}
