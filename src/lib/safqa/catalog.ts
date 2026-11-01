/**
 * Safqa demo catalogue. Stands in for the ERP / inventory database a real
 * deployment would query. All money is AED, ex-VAT.
 *
 * `cost` is the landed cost and never leaves the server-side tools in a form the
 * customer sees; `list` is the catalogue price the guardrails are measured from.
 * `aliases` carries the Khaleeji, Saudi and trade words customers actually use.
 */

export type Category = "automotive" | "construction" | "industrial";

export type CatalogItem = {
  sku: string;
  name: string;
  nameAr: string;
  category: Category;
  aliases: string[];
  brand: string;
  partNumber?: string;
  condition: "OEM" | "Aftermarket" | "Genuine-equivalent" | "Standard";
  /** Vehicle fitment, e.g. "Toyota Land Cruiser 300 (2022–2025)". */
  fitment?: string;
  /** Vehicle years this part fits, inclusive. */
  years?: [number, number];
  unit: string;
  cost: number;
  list: number;
  stock: number;
  warehouse: "Dubai – Al Quoz" | "Sharjah – Industrial 6" | "Jebel Ali FZ";
  /** Days to restock from the supplier when stock is short. */
  supplierLeadDays: number;
};

export const catalog: CatalogItem[] = [
  // ── Automotive: Toyota Land Cruiser 300 ─────────────────────────────────
  {
    sku: "TY-LC300-BPR-OEM",
    name: "Rear brake pad set — Toyota Land Cruiser 300",
    nameAr: "سفايف فرامل خلفية — لاندكروزر ٣٠٠",
    category: "automotive",
    aliases: ["سفايف", "سفايف خلفية", "قماشات", "فحمات", "brake pads", "rear pads", "فرامل"],
    brand: "Toyota Genuine",
    partNumber: "04466-60200",
    condition: "OEM",
    fitment: "Toyota Land Cruiser 300 (2022–2025)",
    years: [2022, 2025],
    unit: "set",
    cost: 182,
    list: 265,
    stock: 38,
    warehouse: "Sharjah – Industrial 6",
    supplierLeadDays: 6,
  },
  {
    sku: "TY-LC300-BPF-OEM",
    name: "Front brake pad set — Toyota Land Cruiser 300",
    nameAr: "سفايف فرامل أمامية — لاندكروزر ٣٠٠",
    category: "automotive",
    aliases: ["سفايف", "سفايف قدام", "سفايف أمامية", "قماشات", "فحمات", "brake pads", "front pads"],
    brand: "Toyota Genuine",
    partNumber: "04465-60380",
    condition: "OEM",
    fitment: "Toyota Land Cruiser 300 (2022–2025)",
    years: [2022, 2025],
    unit: "set",
    cost: 214,
    list: 310,
    stock: 22,
    warehouse: "Sharjah – Industrial 6",
    supplierLeadDays: 6,
  },
  {
    sku: "TY-LC300-BPR-AFM",
    name: "Rear brake pad set (aftermarket, Akebono) — Land Cruiser 300",
    nameAr: "سفايف خلفية تجاري (أكيبونو) — لاندكروزر ٣٠٠",
    category: "automotive",
    aliases: ["سفايف", "سفايف خلفية", "تجاري", "brake pads", "rear pads"],
    brand: "Akebono",
    partNumber: "ACT2348",
    condition: "Aftermarket",
    fitment: "Toyota Land Cruiser 300 (2022–2025)",
    years: [2022, 2025],
    unit: "set",
    cost: 96,
    list: 150,
    stock: 64,
    warehouse: "Dubai – Al Quoz",
    supplierLeadDays: 4,
  },
  {
    sku: "TY-RLY-4P-OEM",
    name: "4-pin relay (35A) — Toyota Land Cruiser / Hilux / Prado",
    nameAr: "كتاوت (ريليه ٤ أرجل ٣٥ أمبير) — تويوتا",
    category: "automotive",
    aliases: ["كتاوت", "كتوت", "كت اوت", "ريليه", "ريلاي", "relay", "cutout", "cut-out"],
    brand: "Toyota Genuine (Denso)",
    partNumber: "90987-02027",
    condition: "OEM",
    fitment: "Toyota Land Cruiser 200/300, Hilux, Prado (2016–2025)",
    years: [2016, 2025],
    unit: "piece",
    cost: 41,
    list: 64,
    stock: 120,
    warehouse: "Sharjah – Industrial 6",
    supplierLeadDays: 5,
  },
  {
    sku: "TY-LC300-OF-OEM",
    name: "Oil filter — Land Cruiser 300 (3.5L V6 twin-turbo)",
    nameAr: "فلتر زيت — لاندكروزر ٣٠٠",
    category: "automotive",
    aliases: ["فلتر زيت", "فلتر الزيت", "oil filter", "فلتر"],
    brand: "Toyota Genuine",
    partNumber: "04152-YZZA1",
    condition: "OEM",
    fitment: "Toyota Land Cruiser 300 3.5L (2022–2025)",
    years: [2022, 2025],
    unit: "piece",
    cost: 22,
    list: 38,
    stock: 300,
    warehouse: "Dubai – Al Quoz",
    supplierLeadDays: 3,
  },
  {
    sku: "TY-LC300-SP-OEM",
    name: "Spark plug (iridium) — Land Cruiser 300 3.5L",
    nameAr: "بواجي (إريديوم) — لاندكروزر ٣٠٠",
    category: "automotive",
    aliases: ["بواجي", "بوجيه", "بواجيه", "spark plug", "plugs"],
    brand: "Denso (Toyota Genuine)",
    partNumber: "90919-01289",
    condition: "OEM",
    fitment: "Toyota Land Cruiser 300 3.5L (2022–2025)",
    years: [2022, 2025],
    unit: "piece",
    cost: 48,
    list: 75,
    stock: 96,
    warehouse: "Dubai – Al Quoz",
    supplierLeadDays: 5,
  },
  {
    sku: "TY-HLX-ALT-AFM",
    name: "Alternator 130A — Toyota Hilux 2.7L (2016–2023)",
    nameAr: "دينمو ١٣٠ أمبير — هايلكس ٢.٧",
    category: "automotive",
    aliases: ["دينمو", "دينامو", "دينموه", "alternator", "دينمو شحن"],
    brand: "Bosch",
    partNumber: "0986UR0458",
    condition: "Aftermarket",
    fitment: "Toyota Hilux 2.7L petrol (2016–2023)",
    years: [2016, 2023],
    unit: "piece",
    cost: 610,
    list: 890,
    stock: 7,
    warehouse: "Jebel Ali FZ",
    supplierLeadDays: 9,
  },
  {
    sku: "TY-HLX-ALT-OEM",
    name: "Alternator 130A — Toyota Hilux 2.7L (2016–2023)",
    nameAr: "دينمو أصلي — هايلكس ٢.٧",
    category: "automotive",
    aliases: ["دينمو", "دينامو", "alternator", "أصلي"],
    brand: "Toyota Genuine (Denso)",
    partNumber: "27060-0C130",
    condition: "OEM",
    fitment: "Toyota Hilux 2.7L petrol (2016–2023)",
    years: [2016, 2023],
    unit: "piece",
    cost: 1180,
    list: 1640,
    stock: 3,
    warehouse: "Jebel Ali FZ",
    supplierLeadDays: 12,
  },
  {
    sku: "NS-PTL-BAT-100",
    name: "Battery 12V 100Ah — Nissan Patrol Y62 / heavy SUVs",
    nameAr: "بطارية ١٠٠ أمبير — نيسان باترول",
    category: "automotive",
    aliases: ["بطارية", "بيتري", "بطاريه", "battery"],
    brand: "Varta Silver Dynamic",
    partNumber: "610402092",
    condition: "Standard",
    fitment: "Nissan Patrol Y62 (2010–2025), Land Cruiser, large SUVs",
    years: [2010, 2025],
    unit: "piece",
    cost: 395,
    list: 560,
    stock: 45,
    warehouse: "Dubai – Al Quoz",
    supplierLeadDays: 4,
  },
  {
    sku: "GEN-TYR-2656018",
    name: "Tyre 265/60 R18 all-terrain",
    nameAr: "كفرات ٢٦٥/٦٠ مقاس ١٨",
    category: "automotive",
    aliases: ["كفر", "كفرات", "تواير", "تاير", "إطار", "tyre", "tire"],
    brand: "Bridgestone Dueler A/T 001",
    condition: "Standard",
    fitment: "Land Cruiser 200, Prado, Hilux, Fortuner (R18)",
    unit: "piece",
    cost: 520,
    list: 745,
    stock: 60,
    warehouse: "Jebel Ali FZ",
    supplierLeadDays: 7,
  },

  // ── Construction supplies ─────────────────────────────────────────────
  {
    sku: "CN-OPC-50",
    name: "Ordinary Portland Cement 42.5N — 50 kg bag",
    nameAr: "إسمنت بورتلاندي عادي — كيس ٥٠ كيلو",
    category: "construction",
    aliases: ["اسمنت", "إسمنت", "سمنت", "اسمنت عادي", "cement", "OPC", "كيس اسمنت"],
    brand: "Emirates Cement",
    condition: "Standard",
    unit: "bag",
    cost: 13.5,
    list: 19.5,
    stock: 6000,
    warehouse: "Sharjah – Industrial 6",
    supplierLeadDays: 2,
  },
  {
    sku: "CN-SRC-50",
    name: "Sulphate-Resisting Cement — 50 kg bag",
    nameAr: "إسمنت مقاوم للأملاح — كيس ٥٠ كيلو",
    category: "construction",
    aliases: ["اسمنت مقاوم", "سمنت مقاوم", "SRC", "sulphate resisting", "اسمنت ضد الملح"],
    brand: "Emirates Cement",
    condition: "Standard",
    unit: "bag",
    cost: 16,
    list: 23,
    stock: 2500,
    warehouse: "Sharjah – Industrial 6",
    supplierLeadDays: 3,
  },
  {
    sku: "CN-RBR-12",
    name: "Rebar B500B 12 mm (12 m length) — per tonne",
    nameAr: "حديد تسليح ١٢ ملي — بالطن",
    category: "construction",
    aliases: ["حديد", "حديد تسليح", "سيخ", "اسياخ", "rebar", "steel bar", "١٢ ملي", "12mm"],
    brand: "Emirates Steel",
    condition: "Standard",
    unit: "tonne",
    cost: 2280,
    list: 2950,
    stock: 85,
    warehouse: "Jebel Ali FZ",
    supplierLeadDays: 5,
  },
  {
    sku: "CN-RBR-16",
    name: "Rebar B500B 16 mm (12 m length) — per tonne",
    nameAr: "حديد تسليح ١٦ ملي — بالطن",
    category: "construction",
    aliases: ["حديد", "حديد تسليح", "سيخ", "rebar", "١٦ ملي", "16mm"],
    brand: "Emirates Steel",
    condition: "Standard",
    unit: "tonne",
    cost: 2250,
    list: 2920,
    stock: 60,
    warehouse: "Jebel Ali FZ",
    supplierLeadDays: 5,
  },
  {
    sku: "CN-BLK-20H",
    name: "Hollow concrete block 20 cm (400×200×200)",
    nameAr: "بلك مفرغ ٢٠ سم",
    category: "construction",
    aliases: ["بلك", "بلوك", "طابوق", "طوب", "block", "blocks", "بلك ٨ انش", "8 inch"],
    brand: "Al Ghurair Blocks",
    condition: "Standard",
    unit: "piece",
    cost: 2.6,
    list: 3.9,
    stock: 40000,
    warehouse: "Sharjah – Industrial 6",
    supplierLeadDays: 3,
  },
  {
    sku: "CN-PLY-18",
    name: "Marine plywood 18 mm (1220×2440)",
    nameAr: "أبلكاش بحري ١٨ ملي",
    category: "construction",
    aliases: ["بليود", "ابلكاش", "أبلكاش", "خشب", "plywood", "خشب صبات", "شدة"],
    brand: "Indonesian Meranti",
    condition: "Standard",
    unit: "sheet",
    cost: 88,
    list: 128,
    stock: 900,
    warehouse: "Sharjah – Industrial 6",
    supplierLeadDays: 6,
  },
  {
    sku: "CN-SHK-3M",
    name: "Galvanised corrugated sheet (shinko) 0.5 mm × 3 m",
    nameAr: "شينكو مجلفن ٣ متر",
    category: "construction",
    aliases: ["شينكو", "صاج", "زنك", "corrugated sheet", "roofing sheet"],
    brand: "Gulf Steel Sheets",
    condition: "Standard",
    unit: "sheet",
    cost: 34,
    list: 52,
    stock: 1400,
    warehouse: "Sharjah – Industrial 6",
    supplierLeadDays: 4,
  },

  // ── Industrial hardware ───────────────────────────────────────────────
  {
    sku: "IN-BLT-M12-SS",
    name: "Hex bolt M12×60 stainless A2-70 with nut & washer",
    nameAr: "براغي ستانلس M12 مع صامولة ووردة",
    category: "industrial",
    aliases: ["براغي", "برغي", "مسامير", "صواميل", "صامولة", "bolt", "bolts", "nut", "ستانلس"],
    brand: "Fastenal",
    partNumber: "M12X60-A2-SET",
    condition: "Standard",
    unit: "set",
    cost: 3.1,
    list: 4.9,
    stock: 8000,
    warehouse: "Dubai – Al Quoz",
    supplierLeadDays: 7,
  },
  {
    sku: "IN-CBL-4C16",
    name: "Armoured cable 4-core 16 mm² (XLPE/SWA) — per metre",
    nameAr: "كيبل مسلح ٤ خطوط ١٦ ملي — بالمتر",
    category: "industrial",
    aliases: ["كيبل", "كيبلات", "وايرات", "واير", "سلك", "cable", "armoured cable", "SWA"],
    brand: "Ducab",
    condition: "Standard",
    unit: "metre",
    cost: 46,
    list: 68,
    stock: 3500,
    warehouse: "Jebel Ali FZ",
    supplierLeadDays: 6,
  },
  {
    sku: "IN-WLD-E6013",
    name: "Welding electrode E6013 3.2 mm — 5 kg pack",
    nameAr: "أسياخ لحام E6013 مقاس ٣.٢ — باكيت ٥ كيلو",
    category: "industrial",
    aliases: ["لحام", "اسياخ لحام", "سلك لحام", "welding rods", "electrodes", "E6013"],
    brand: "ESAB",
    condition: "Standard",
    unit: "pack",
    cost: 42,
    list: 64,
    stock: 420,
    warehouse: "Dubai – Al Quoz",
    supplierLeadDays: 5,
  },
  {
    sku: "IN-PPR-25",
    name: "PPR pipe PN20 25 mm (4 m length)",
    nameAr: "بايب PPR مقاس ٢٥ — ٤ متر",
    category: "industrial",
    aliases: ["بايب", "بايبات", "ماسورة", "مواسير", "pipe", "PPR"],
    brand: "Cosmoplast",
    condition: "Standard",
    unit: "length",
    cost: 11,
    list: 17,
    stock: 2600,
    warehouse: "Sharjah – Industrial 6",
    supplierLeadDays: 4,
  },
  {
    sku: "IN-DRL-18V",
    name: "Cordless hammer drill 18V (2× 5Ah batteries)",
    nameAr: "دريل شحن ١٨ فولت مع بطاريتين",
    category: "industrial",
    aliases: ["دريل", "دريل شحن", "drill", "مثقاب"],
    brand: "DeWalt DCD996P2",
    condition: "Standard",
    unit: "kit",
    cost: 1090,
    list: 1490,
    stock: 18,
    warehouse: "Dubai – Al Quoz",
    supplierLeadDays: 8,
  },
];

export function findSku(sku: string) {
  return catalog.find((item) => item.sku === sku);
}

/** Arabic-Indic and Persian digits → ASCII, strip diacritics, unify alef/yaa/taa marbuta. */
export function normalise(text: string) {
  return text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .toLowerCase();
}

function tokens(text: string) {
  return normalise(text)
    .split(/[^\p{L}\p{N}.]+/u)
    .filter((t) => t.length > 1);
}

/**
 * Score every item against the query. A phrase match on an alias or the name
 * counts most; single shared tokens and a fitment/year match add to it.
 */
export function searchCatalog(query: string, specs = "") {
  const q = normalise(`${query} ${specs}`);
  const qTokens = new Set(tokens(`${query} ${specs}`));
  const years = [...q.matchAll(/\b(19|20)\d{2}\b/g)].map((m) => Number(m[0]));

  return catalog
    .map((item) => {
      let score = 0;
      const haystack = [item.name, item.nameAr, ...item.aliases].map(normalise);
      for (const phrase of haystack) {
        if (phrase.length > 2 && q.includes(phrase)) score += 6;
      }
      const itemTokens = new Set(
        tokens([item.name, item.nameAr, item.brand, item.fitment ?? "", item.partNumber ?? "", ...item.aliases].join(" ")),
      );
      for (const t of qTokens) if (itemTokens.has(t)) score += 2;
      if (item.partNumber && q.includes(normalise(item.partNumber))) score += 20;
      if (item.years && years.length) {
        const fits = years.some((y) => y >= item.years![0] && y <= item.years![1]);
        score += fits ? 3 : -6;
      }
      return { item, score };
    })
    .filter((r) => r.score >= 6)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((r) => r.item);
}
