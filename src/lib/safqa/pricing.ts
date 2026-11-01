import { findSku, type CatalogItem } from "./catalog";

/**
 * Pricing engine and commercial guardrails. These limits are enforced here, in
 * code, so they hold no matter what the model says or what a customer types.
 */
export const POLICY = {
  /** Discount the agent may grant straight away to volume orders or repeat/key clients. */
  autoDiscountCapPct: 5,
  /** Hard floor. No quote may go further below list than this, ever. */
  floorDiscountPct: 12,
  /** An order counts as volume at this ex-VAT list subtotal (AED)... */
  volumeSubtotalAed: 2000,
  /** ...or at this many units across all lines. */
  volumeUnits: 50,
  /** UAE orders over this subtotal ship free without having to be negotiated. */
  freeDeliveryOverAed: 7500,
  quoteValidityDays: 7,
} as const;

export const destinations = [
  "Dubai",
  "Sharjah",
  "Ajman",
  "Abu Dhabi",
  "Al Ain",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah",
  "Saudi Arabia",
  "Kuwait",
  "Qatar",
  "Bahrain",
  "Oman",
] as const;
export type Destination = (typeof destinations)[number];

export const clientTiers = ["new", "repeat", "key_account"] as const;
export type ClientTier = (typeof clientTiers)[number];

export const incentiveKinds = ["free_delivery", "expedited_delivery", "net_30"] as const;
export type Incentive = (typeof incentiveKinds)[number];

type Zone = "uae_core" | "uae_capital" | "uae_north" | "gcc";

const zoneOf: Record<Destination, Zone> = {
  Dubai: "uae_core",
  Sharjah: "uae_core",
  Ajman: "uae_core",
  "Abu Dhabi": "uae_capital",
  "Al Ain": "uae_capital",
  "Umm Al Quwain": "uae_north",
  "Ras Al Khaimah": "uae_north",
  Fujairah: "uae_north",
  "Saudi Arabia": "gcc",
  Kuwait: "gcc",
  Qatar: "gcc",
  Bahrain: "gcc",
  Oman: "gcc",
};

/** Courier fee for parcels, and flatbed truck fee when building materials are on the order. */
const deliveryFees: Record<Destination, { parcel: number; truck: number; days: [number, number] }> = {
  Dubai: { parcel: 35, truck: 350, days: [1, 1] },
  Sharjah: { parcel: 35, truck: 350, days: [1, 1] },
  Ajman: { parcel: 35, truck: 380, days: [1, 1] },
  "Abu Dhabi": { parcel: 60, truck: 650, days: [1, 2] },
  "Al Ain": { parcel: 60, truck: 700, days: [1, 2] },
  "Umm Al Quwain": { parcel: 50, truck: 450, days: [1, 2] },
  "Ras Al Khaimah": { parcel: 50, truck: 500, days: [2, 2] },
  Fujairah: { parcel: 50, truck: 550, days: [2, 2] },
  "Saudi Arabia": { parcel: 220, truck: 2400, days: [3, 5] },
  Kuwait: { parcel: 260, truck: 3800, days: [4, 6] },
  Qatar: { parcel: 240, truck: 3200, days: [4, 6] },
  Bahrain: { parcel: 240, truck: 3000, days: [4, 6] },
  Oman: { parcel: 200, truck: 1900, days: [3, 5] },
};

export type OrderLineInput = { sku: string; quantity: number };

export type PricedLine = {
  sku: string;
  name: string;
  nameAr: string;
  brand: string;
  partNumber?: string;
  condition: CatalogItem["condition"];
  unit: string;
  quantity: number;
  unitList: number;
  unitNet: number;
  lineNet: number;
  inStock: number;
  shortfall: number;
  warehouse: string;
  etaDays: [number, number];
};

export type GuardrailStatus = "no_discount" | "auto_approved" | "negotiated" | "rejected_below_floor";

export type PricingResult = {
  currency: "AED";
  clientTier: ClientTier;
  destination: Destination;
  lines: PricedLine[];
  unknownSkus: string[];
  subtotalList: number;
  discount: {
    requestedPct: number;
    approvedPct: number;
    amount: number;
    status: GuardrailStatus;
    autoCapPct: number;
    floorPct: number;
    volumeOrder: boolean;
    note: string;
  };
  netSubtotal: number;
  delivery: {
    mode: "courier" | "truck";
    fee: number;
    standardFee: number;
    waived: boolean;
    expedited: boolean;
    etaDays: [number, number];
  };
  vat: { ratePct: number; amount: number; note: string };
  total: number;
  paymentTerms: string;
  incentivesApplied: Incentive[];
  /** For the agent only — never shown to the customer. */
  internal: { grossMarginPct: number; marginAtFloorPct: number };
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function priceOrder(input: {
  lines: OrderLineInput[];
  clientTier: ClientTier;
  destination: Destination;
  requestedDiscountPct?: number;
  incentives?: Incentive[];
}): PricingResult {
  const incentives = [...new Set(input.incentives ?? [])].filter((i) =>
    (incentiveKinds as readonly string[]).includes(i),
  );
  const unknownSkus: string[] = [];
  const items: { item: CatalogItem; quantity: number }[] = [];
  for (const line of input.lines) {
    const item = findSku(line.sku);
    const quantity = Math.max(1, Math.round(Number(line.quantity) || 0));
    if (!item) unknownSkus.push(line.sku);
    else items.push({ item, quantity });
  }

  const route = deliveryFees[input.destination];
  const subtotalList = round2(items.reduce((s, { item, quantity }) => s + item.list * quantity, 0));
  const units = items.reduce((s, { quantity }) => s + quantity, 0);
  const volumeOrder = subtotalList >= POLICY.volumeSubtotalAed || units >= POLICY.volumeUnits;
  const autoCapPct = volumeOrder || input.clientTier !== "new" ? POLICY.autoDiscountCapPct : 0;

  const requestedPct = Math.max(0, Number(input.requestedDiscountPct) || 0);
  const approvedPct = round2(Math.min(requestedPct, POLICY.floorDiscountPct));
  let status: GuardrailStatus;
  let note: string;
  if (requestedPct === 0) {
    status = "no_discount";
    note = autoCapPct
      ? `Eligible for up to ${autoCapPct}% without negotiation (${volumeOrder ? "volume order" : `${input.clientTier} client`}).`
      : "New client, small order: list price. Any discount must be negotiated (max 12%).";
  } else if (requestedPct <= autoCapPct) {
    status = "auto_approved";
    note = `${approvedPct}% is inside the ${autoCapPct}% auto-approval band.`;
  } else if (requestedPct <= POLICY.floorDiscountPct) {
    status = "negotiated";
    note = `${approvedPct}% is above the auto band but within the 12% floor — allowed as a negotiated concession.`;
  } else {
    status = "rejected_below_floor";
    note = `${requestedPct}% breaches the 12% floor. Priced at the floor (12%) instead. Hold this price and offer incentives (free_delivery, expedited_delivery, net_30); if the customer still refuses, call flag_for_human_review.`;
  }

  const factor = 1 - approvedPct / 100;
  const lines: PricedLine[] = items.map(({ item, quantity }) => {
    const unitNet = round2(item.list * factor);
    const shortfall = Math.max(0, quantity - item.stock);
    const etaDays: [number, number] = shortfall
      ? [route.days[0] + item.supplierLeadDays, route.days[1] + item.supplierLeadDays]
      : route.days;
    return {
      sku: item.sku,
      name: item.name,
      nameAr: item.nameAr,
      brand: item.brand,
      partNumber: item.partNumber,
      condition: item.condition,
      unit: item.unit,
      quantity,
      unitList: item.list,
      unitNet,
      lineNet: round2(unitNet * quantity),
      inStock: item.stock,
      shortfall,
      warehouse: item.warehouse,
      etaDays,
    };
  });

  const netSubtotal = round2(lines.reduce((s, l) => s + l.lineNet, 0));
  const discountAmount = round2(subtotalList - netSubtotal);

  const truck = items.some(({ item }) => item.category === "construction");
  const zone = zoneOf[input.destination];
  const standardFee = truck ? route.truck : route.parcel;
  const expedited = incentives.includes("expedited_delivery");
  const autoFree = zone !== "gcc" && netSubtotal >= POLICY.freeDeliveryOverAed;
  const waived = autoFree || incentives.includes("free_delivery");
  const fee = waived ? 0 : standardFee;
  const etaMax = Math.max(...lines.map((l) => l.etaDays[1]), route.days[1]);
  const etaMin = Math.max(...lines.map((l) => l.etaDays[0]), route.days[0]);
  const etaDays: [number, number] = expedited
    ? [Math.max(0, etaMin - 1), Math.max(0, etaMax - 1)]
    : [etaMin, etaMax];

  const vatRatePct = zone === "gcc" ? 0 : 5;
  const vatAmount = round2(((netSubtotal + fee) * vatRatePct) / 100);

  const paymentTerms = incentives.includes("net_30") || input.clientTier === "key_account"
    ? "Net 30 days from invoice date"
    : input.clientTier === "repeat"
      ? "Payment on delivery (bank transfer, card or cheque)"
      : "50% advance on confirmation, balance on delivery";

  const cost = items.reduce((s, { item, quantity }) => s + item.cost * quantity, 0);
  const listCostMargin = subtotalList ? (subtotalList * (1 - POLICY.floorDiscountPct / 100) - cost) / (subtotalList * (1 - POLICY.floorDiscountPct / 100)) : 0;

  return {
    currency: "AED",
    clientTier: input.clientTier,
    destination: input.destination,
    lines,
    unknownSkus,
    subtotalList,
    discount: {
      requestedPct,
      approvedPct,
      amount: discountAmount,
      status,
      autoCapPct,
      floorPct: POLICY.floorDiscountPct,
      volumeOrder,
      note,
    },
    netSubtotal,
    delivery: { mode: truck ? "truck" : "courier", fee, standardFee, waived, expedited, etaDays },
    vat: {
      ratePct: vatRatePct,
      amount: vatAmount,
      note: zone === "gcc"
        ? "Export from UAE — zero-rated. Import duties and destination VAT are paid by the consignee."
        : "UAE VAT 5%.",
    },
    total: round2(netSubtotal + fee + vatAmount),
    paymentTerms,
    incentivesApplied: incentives.filter((i) => i !== "free_delivery" || !autoFree),
    internal: {
      grossMarginPct: netSubtotal ? round2(((netSubtotal - cost) / netSubtotal) * 100) : 0,
      marginAtFloorPct: round2(listCostMargin * 100),
    },
  };
}
