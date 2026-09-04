import { site } from "./site";

const aed = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  maximumFractionDigits: 0,
});

const aedPrecise = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPrice(amount: number) {
  return Number.isInteger(amount) ? aed.format(amount) : aedPrecise.format(amount);
}

export function formatPriceExact(amount: number) {
  return aedPrecise.format(amount);
}

/** Instalment amount shown next to the price, rounded up to the nearest dirham. */
export function instalmentOf(amount: number) {
  return Math.ceil(amount / site.instalments);
}

export function discountPercent(price: number, compareAt?: number) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

/** VAT already included in displayed prices — this is the portion, for the receipt. */
export function vatPortion(grossTotal: number) {
  return Math.round(grossTotal * (site.vatRate / (1 + site.vatRate)) * 100) / 100;
}

export function shippingFor(subtotal: number, express: boolean) {
  if (express) return site.expressShipping;
  return subtotal >= site.freeShippingThreshold ? 0 : site.standardShipping;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function orderReference() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const noise = Math.floor(Math.random() * 46656)
    .toString(36)
    .toUpperCase()
    .padStart(3, "0");
  return `FRS-${stamp}${noise}`;
}
