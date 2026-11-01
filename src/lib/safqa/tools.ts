import type Anthropic from "@anthropic-ai/sdk";
import { randomBytes } from "node:crypto";
import { searchCatalog } from "./catalog";
import {
  POLICY,
  clientTiers,
  destinations,
  incentiveKinds,
  priceOrder,
  type ClientTier,
  type Destination,
  type Incentive,
  type OrderLineInput,
} from "./pricing";
import { encodeQuote, newQuoteId, type Quote } from "./quote";

export type ClientProfile = {
  tier: ClientTier;
  name?: string;
  company?: string;
  phone?: string;
};

export type ToolContext = { origin: string; profile: ClientProfile };

/** What the chat UI renders next to a tool call. */
export type ToolCard =
  | { kind: "inventory"; matches: { sku: string; name: string; inStock: number; condition: string }[] }
  | { kind: "pricing"; total: number; discountPct: number; status: string }
  | { kind: "quote"; id: string; url: string; total: number }
  | { kind: "whatsapp"; link: string; phone: string }
  | { kind: "escalation"; ticket: string; reason: string };

export type ToolOutcome = { output: unknown; isError?: boolean; card?: ToolCard };

const lineSchema = {
  type: "array",
  minItems: 1,
  items: {
    type: "object",
    properties: {
      sku: { type: "string", description: "SKU exactly as returned by search_inventory." },
      quantity: { type: "integer", minimum: 1 },
    },
    required: ["sku", "quantity"],
    additionalProperties: false,
  },
} as const;

const destinationSchema = {
  type: "string",
  enum: [...destinations],
  description: "Delivery emirate (UAE) or GCC country. Map districts to their emirate: المصفح/مصفح → Abu Dhabi, القوز → Dubai, الصناعية/Industrial Area in Sharjah → Sharjah, الرياض/جدة/الدمام → Saudi Arabia.",
} as const;

export const toolDefinitions: Anthropic.Beta.BetaTool[] = [
  {
    name: "search_inventory",
    description:
      "Search the live inventory and supplier catalogue. Call once per distinct item the customer asked for, after normalising Khaleeji terms (e.g. كتاوت → relay, سفايف → brake pads, دينمو → alternator, بلك → concrete block, شينكو → corrugated sheet). Returns matching SKUs with stock on hand, condition (OEM/aftermarket), fitment, list price and lead time. Never invents items: if nothing matches, say so to the customer.",
    input_schema: {
      type: "object",
      properties: {
        item_name: { type: "string", description: "Normalised item name, Arabic or English, e.g. 'rear brake pads' or 'كتاوت'." },
        specs: { type: "string", description: "Vehicle make/model/year, size, grade, part number, OEM vs aftermarket — anything that narrows the match." },
        quantity: { type: "integer", minimum: 1 },
      },
      required: ["item_name", "quantity"],
      additionalProperties: false,
    },
  },
  {
    name: "calculate_pricing",
    description: `Price a set of lines through the pricing engine. The client tier comes from the CRM and is applied automatically. Pass requested_discount_pct when testing a discount: the engine enforces the guardrails — up to ${POLICY.autoDiscountCapPct}% is auto-approved for volume orders or repeat/key clients, up to ${POLICY.floorDiscountPct}% only as a negotiated concession, and anything beyond ${POLICY.floorDiscountPct}% is refused and priced at the floor. Also returns delivery fee/ETA, VAT and total. Call again whenever quantities, destination, discount or incentives change.`,
    input_schema: {
      type: "object",
      properties: {
        lines: lineSchema,
        destination: destinationSchema,
        requested_discount_pct: { type: "number", minimum: 0, description: "Discount off list you intend to offer (0 for list price)." },
        incentives: {
          type: "array",
          items: { type: "string", enum: [...incentiveKinds] },
          description: "Non-price sweeteners: free_delivery, expedited_delivery, net_30.",
        },
      },
      required: ["lines", "destination"],
      additionalProperties: false,
    },
  },
  {
    name: "generate_quote_pdf",
    description:
      "Issue a formal quotation document. Prices are recomputed by the pricing engine from the SKUs, so the quote always matches the guardrails; a discount above the floor is rejected. Returns quote_id and pdf_url. Only call once the customer has the numbers and wants the quote (or asks for it in writing).",
    input_schema: {
      type: "object",
      properties: {
        lines: lineSchema,
        destination: destinationSchema,
        discount_pct: { type: "number", minimum: 0 },
        incentives: { type: "array", items: { type: "string", enum: [...incentiveKinds] } },
        language: { type: "string", enum: ["ar", "en"], description: "Language of the quotation document." },
        client_name: { type: "string" },
        company: { type: "string" },
        notes: { type: "string", description: "Short notes printed on the quote, e.g. fitment confirmation or partial-delivery plan." },
      },
      required: ["lines", "destination", "discount_pct", "language"],
      additionalProperties: false,
    },
  },
  {
    name: "dispatch_whatsapp_quote",
    description:
      "Send an issued quotation to the customer on WhatsApp Business. Requires a quote_id and pdf_url from generate_quote_pdf and the customer's phone number in international format.",
    input_schema: {
      type: "object",
      properties: {
        client_phone: { type: "string", description: "International format, e.g. +971501234567." },
        quote_id: { type: "string" },
        pdf_url: { type: "string" },
        message: { type: "string", description: "Short cover message in the customer's language and dialect." },
      },
      required: ["client_phone", "quote_id", "pdf_url", "message"],
      additionalProperties: false,
    },
  },
  {
    name: "flag_for_human_review",
    description:
      "Escalate the deal to a human sales rep. Use when the customer still refuses after you held the 12% floor and offered incentives, or for anything outside your authority (custom credit lines, items not in the catalogue, disputes).",
    input_schema: {
      type: "object",
      properties: {
        reason: { type: "string" },
        customer_target_pct: { type: "number", description: "Discount the customer is insisting on, if any." },
        best_offer_pct: { type: "number", description: "Best discount you offered." },
        summary: { type: "string", description: "One-paragraph deal summary for the rep: items, quantities, destination, what was offered." },
      },
      required: ["reason", "summary"],
      additionalProperties: false,
    },
  },
];

// ── Input validation ─────────────────────────────────────────────────────
// Tool inputs come from the model, so validate them like any untrusted input.

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

function parseLines(v: unknown): OrderLineInput[] {
  if (!Array.isArray(v) || v.length === 0) throw new Error("lines must be a non-empty array");
  return v.map((l) => {
    if (!isObj(l) || typeof l.sku !== "string") throw new Error("each line needs a sku");
    const quantity = Number(l.quantity);
    if (!Number.isFinite(quantity) || quantity < 1) throw new Error(`bad quantity for ${l.sku}`);
    return { sku: l.sku, quantity: Math.round(quantity) };
  });
}

function parseDestination(v: unknown): Destination {
  if (typeof v === "string" && (destinations as readonly string[]).includes(v)) return v as Destination;
  throw new Error(`destination must be one of: ${destinations.join(", ")}`);
}

function parseIncentives(v: unknown): Incentive[] {
  if (v == null) return [];
  if (!Array.isArray(v)) throw new Error("incentives must be an array");
  return v.filter((i): i is Incentive => (incentiveKinds as readonly string[]).includes(i as string));
}

export function parseProfile(v: unknown): ClientProfile {
  const o = isObj(v) ? v : {};
  const tier = (clientTiers as readonly string[]).includes(o.tier as string) ? (o.tier as ClientTier) : "new";
  const str = (x: unknown) => (typeof x === "string" && x.trim() ? x.trim().slice(0, 80) : undefined);
  return { tier, name: str(o.name), company: str(o.company), phone: str(o.phone) };
}

// ── Executors ─────────────────────────────────────────────────────────────

export function runTool(name: string, rawInput: unknown, ctx: ToolContext): ToolOutcome {
  const input = isObj(rawInput) ? rawInput : {};
  try {
    switch (name) {
      case "search_inventory": {
        const itemName = String(input.item_name ?? "").trim();
        if (!itemName) throw new Error("item_name is required");
        const quantity = Math.max(1, Math.round(Number(input.quantity) || 1));
        const matches = searchCatalog(itemName, String(input.specs ?? ""));
        const output = {
          query: { item_name: itemName, specs: input.specs ?? null, quantity },
          matches: matches.map((m) => ({
            sku: m.sku,
            name: m.name,
            name_ar: m.nameAr,
            brand: m.brand,
            part_number: m.partNumber ?? null,
            condition: m.condition,
            fitment: m.fitment ?? null,
            unit: m.unit,
            list_price_aed: m.list,
            in_stock: m.stock,
            can_fulfil_from_stock: m.stock >= quantity,
            warehouse: m.warehouse,
            restock_lead_days: m.supplierLeadDays,
          })),
          note: matches.length ? undefined : "No catalogue match. Do not invent an item; tell the customer and offer to source it via a sales rep.",
        };
        return {
          output,
          card: {
            kind: "inventory",
            matches: matches.map((m) => ({ sku: m.sku, name: m.name, inStock: m.stock, condition: m.condition })),
          },
        };
      }

      case "calculate_pricing": {
        const result = priceOrder({
          lines: parseLines(input.lines),
          destination: parseDestination(input.destination),
          clientTier: ctx.profile.tier,
          requestedDiscountPct: Number(input.requested_discount_pct ?? 0),
          incentives: parseIncentives(input.incentives),
        });
        return {
          output: result,
          card: { kind: "pricing", total: result.total, discountPct: result.discount.approvedPct, status: result.discount.status },
        };
      }

      case "generate_quote_pdf": {
        const discountPct = Number(input.discount_pct ?? 0);
        if (!Number.isFinite(discountPct) || discountPct < 0) throw new Error("discount_pct must be ≥ 0");
        if (discountPct > POLICY.floorDiscountPct) {
          return {
            isError: true,
            output: {
              error: "GUARDRAIL_VIOLATION",
              message: `Refused: ${discountPct}% is below the ${POLICY.floorDiscountPct}% floor. Re-issue at ${POLICY.floorDiscountPct}% or less, offer incentives, or flag_for_human_review.`,
            },
          };
        }
        const pricing = priceOrder({
          lines: parseLines(input.lines),
          destination: parseDestination(input.destination),
          clientTier: ctx.profile.tier,
          requestedDiscountPct: discountPct,
          incentives: parseIncentives(input.incentives),
        });
        if (pricing.unknownSkus.length) throw new Error(`unknown SKUs: ${pricing.unknownSkus.join(", ")}`);
        const { internal: _internal, ...customerPricing } = pricing;
        void _internal;
        const now = new Date();
        const quote: Quote = {
          id: newQuoteId(now),
          issuedAt: now.toISOString(),
          validUntil: new Date(now.getTime() + POLICY.quoteValidityDays * 864e5).toISOString(),
          language: input.language === "en" ? "en" : "ar",
          client: {
            name: typeof input.client_name === "string" ? input.client_name : ctx.profile.name,
            company: typeof input.company === "string" ? input.company : ctx.profile.company,
            phone: ctx.profile.phone,
          },
          pricing: customerPricing,
          notes: typeof input.notes === "string" ? input.notes.slice(0, 500) : undefined,
        };
        const url = `${ctx.origin}/safqa/quote?q=${encodeQuote(quote)}`;
        return {
          output: {
            quote_id: quote.id,
            pdf_url: url,
            valid_until: quote.validUntil.slice(0, 10),
            total_aed: pricing.total,
            discount_pct: pricing.discount.approvedPct,
          },
          card: { kind: "quote", id: quote.id, url, total: pricing.total },
        };
      }

      case "dispatch_whatsapp_quote": {
        const phone = String(input.client_phone ?? "").replace(/[^\d+]/g, "");
        if (!/^\+?\d{9,15}$/.test(phone)) throw new Error("client_phone must be an international number, e.g. +971501234567");
        const url = String(input.pdf_url ?? "");
        if (!url.startsWith(`${ctx.origin}/safqa/quote?q=`)) throw new Error("pdf_url must come from generate_quote_pdf");
        const text = `${String(input.message ?? "").slice(0, 600)}\n\n${input.quote_id}: ${url}`;
        const link = `https://wa.me/${phone.replace(/^\+/, "")}?text=${encodeURIComponent(text)}`;
        return {
          output: {
            status: "queued",
            channel: "whatsapp_business",
            to: phone,
            quote_id: input.quote_id,
            note: "Demo environment: the message is prepared, and the operator sends it with one tap.",
          },
          card: { kind: "whatsapp", link, phone },
        };
      }

      case "flag_for_human_review": {
        const ticket = `HR-${randomBytes(3).toString("hex").toUpperCase()}`;
        const reason = String(input.reason ?? "");
        return {
          output: {
            ticket,
            status: "assigned",
            assigned_to: "Senior sales desk",
            sla: "Call-back within 2 working hours",
          },
          card: { kind: "escalation", ticket, reason },
        };
      }

      default:
        return { isError: true, output: { error: `Unknown tool ${name}` } };
    }
  } catch (err) {
    return { isError: true, output: { error: err instanceof Error ? err.message : String(err) } };
  }
}
