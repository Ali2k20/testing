import type { Metadata } from "next";
import { PrintButton } from "@/components/safqa/print-button";
import { decodeQuote } from "@/lib/safqa/quote";

export const metadata: Metadata = { title: { absolute: "Quotation — Safqa" }, robots: { index: false } };

const t = {
  ar: {
    title: "عرض سعر",
    quoteNo: "رقم العرض",
    issued: "تاريخ الإصدار",
    valid: "صالح حتى",
    to: "إلى",
    deliverTo: "التوصيل إلى",
    item: "الصنف",
    qty: "الكمية",
    unit: "سعر الوحدة",
    total: "الإجمالي",
    list: "الإجمالي قبل الخصم",
    discount: "الخصم",
    net: "الصافي",
    delivery: "التوصيل",
    free: "مجاني",
    vat: "ضريبة القيمة المضافة",
    grand: "الإجمالي المستحق",
    eta: "مدة التوريد",
    days: "يوم عمل",
    terms: "شروط الدفع",
    notes: "ملاحظات",
    print: "تحميل PDF / طباعة",
    stockNote: "جزء من الكمية يورَّد من المورّد",
    tampered: "تنبيه: لم يتم التحقق من توقيع هذا العرض — قد يكون الرابط معدّلاً.",
    expedited: "توصيل مستعجل",
    sameDay: "نفس اليوم",
  },
  en: {
    title: "Quotation",
    quoteNo: "Quote no.",
    issued: "Issued",
    valid: "Valid until",
    to: "To",
    deliverTo: "Deliver to",
    item: "Item",
    qty: "Qty",
    unit: "Unit price",
    total: "Total",
    list: "Subtotal at list",
    discount: "Discount",
    net: "Net",
    delivery: "Delivery",
    free: "Free",
    vat: "VAT",
    grand: "Total due",
    eta: "Lead time",
    days: "working days",
    terms: "Payment terms",
    notes: "Notes",
    print: "Download PDF / Print",
    stockNote: "part of the quantity ships from supplier",
    tampered: "Warning: this quotation's signature could not be verified — the link may have been altered.",
    expedited: "Expedited delivery",
    sameDay: "Same day",
  },
};

const unitsAr: Record<string, string> = {
  set: "طقم",
  piece: "حبة",
  bag: "كيس",
  tonne: "طن",
  sheet: "لوح",
  metre: "متر",
  pack: "باكيت",
  length: "قطعة",
  kit: "عدة",
};

const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { q } = await searchParams;
  const decoded = typeof q === "string" ? decodeQuote(q) : null;
  if (!decoded) {
    return <p className="p-10 text-center">Quotation not found.</p>;
  }
  const { quote, verified } = decoded;
  const L = t[quote.language];
  const p = quote.pricing;
  const ar = quote.language === "ar";
  const date = (iso: string) => new Date(iso).toLocaleDateString(ar ? "ar-AE" : "en-GB", { dateStyle: "medium" });
  const [etaMin, etaMax] = p.delivery.etaDays;
  const eta =
    etaMax === 0
      ? L.sameDay
      : `${etaMin === etaMax ? etaMax : `${etaMin}–${etaMax}`} ${L.days}`;

  return (
    <div dir={ar ? "rtl" : "ltr"} className="mx-auto max-w-3xl px-4 py-8 print:max-w-none print:p-0">
      {!verified && (
        <p className="mb-4 rounded-md border border-[#f0c6bf] bg-[#fff4f2] p-3 text-[13px] text-[#7a271a]">{L.tampered}</p>
      )}
      <div className="rounded-xl border border-[#d5e0dc] bg-white p-6 shadow-sm sm:p-10 print:rounded-none print:border-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e1e8e5] pb-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#0c3a2f] text-xl font-bold text-[#d6b25e]">ص</div>
            <div>
              <p className="text-[17px] font-semibold">Safqa Trading · صفقة للتجارة</p>
              <p className="text-[12px] text-[#55706a]">Sharjah Industrial Area 6, UAE · Demo TRN 100000000000003</p>
            </div>
          </div>
          <div className="text-end">
            <h1 className="text-2xl font-semibold text-[#0c3a2f]">{L.title}</h1>
            <p className="mt-1 text-[12.5px] text-[#55706a]">
              {L.quoteNo}: <span dir="ltr" className="font-medium text-[#10201b]">{quote.id}</span>
            </p>
          </div>
        </header>

        <section className="grid gap-4 py-5 text-[13px] sm:grid-cols-3">
          <div>
            <p className="text-[11px] text-[#55706a]">{L.to}</p>
            <p className="font-medium">{quote.client.company || quote.client.name || "—"}</p>
            {quote.client.company && quote.client.name && <p>{quote.client.name}</p>}
            {quote.client.phone && <p dir="ltr" className="text-start">{quote.client.phone}</p>}
          </div>
          <div>
            <p className="text-[11px] text-[#55706a]">{L.deliverTo}</p>
            <p className="font-medium">{p.destination}</p>
            <p>
              {L.eta}: {eta}
              {p.delivery.expedited && ` · ${L.expedited}`}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[#55706a]">{L.issued}</p>
            <p className="font-medium">{date(quote.issuedAt)}</p>
            <p className="mt-1 text-[11px] text-[#55706a]">{L.valid}</p>
            <p className="font-medium">{date(quote.validUntil)}</p>
          </div>
        </section>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-y border-[#e1e8e5] bg-[#f7faf9] text-[11.5px] text-[#55706a]">
                <th className="px-2 py-2 text-start font-medium">{L.item}</th>
                <th className="px-2 py-2 text-end font-medium">{L.qty}</th>
                <th className="px-2 py-2 text-end font-medium">{L.unit}</th>
                <th className="px-2 py-2 text-end font-medium">{L.total}</th>
              </tr>
            </thead>
            <tbody>
              {p.lines.map((l) => (
                <tr key={l.sku} className="border-b border-[#eef2f0] align-top">
                  <td className="px-2 py-2.5">
                    <p className="font-medium">{ar ? l.nameAr : l.name}</p>
                    <p className="text-[11px] text-[#55706a]" dir="ltr" style={{ textAlign: ar ? "right" : "left" }}>
                      {l.brand} · {l.condition}
                      {l.partNumber && ` · P/N ${l.partNumber}`} · {l.sku}
                    </p>
                    {l.shortfall > 0 && (
                      <p className="text-[11px] text-[#9a4a1c]">
                        {l.shortfall} {L.stockNote}
                      </p>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-end tabular-nums">
                    {l.quantity} <span className="text-[11px] text-[#55706a]">{ar ? (unitsAr[l.unit] ?? l.unit) : l.unit}</span>
                  </td>
                  <td className="px-2 py-2.5 text-end tabular-nums">
                    {l.unitNet !== l.unitList && (
                      <span className="block text-[11px] text-[#8aa09a] line-through">{money(l.unitList)}</span>
                    )}
                    {money(l.unitNet)}
                  </td>
                  <td className="px-2 py-2.5 text-end tabular-nums">{money(l.lineNet)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex justify-end">
          <dl className="w-full max-w-xs space-y-1.5 text-[13px] tabular-nums">
            <div className="flex justify-between"><dt>{L.list}</dt><dd>{money(p.subtotalList)}</dd></div>
            {p.discount.amount > 0 && (
              <div className="flex justify-between text-[#0b6b52]">
                <dt>{L.discount} ({p.discount.approvedPct}%)</dt>
                <dd>−{money(p.discount.amount)}</dd>
              </div>
            )}
            <div className="flex justify-between"><dt>{L.net}</dt><dd>{money(p.netSubtotal)}</dd></div>
            <div className="flex justify-between">
              <dt>{L.delivery}</dt>
              <dd>{p.delivery.fee === 0 ? L.free : money(p.delivery.fee)}</dd>
            </div>
            <div className="flex justify-between"><dt>{L.vat} {p.vat.ratePct}%</dt><dd>{money(p.vat.amount)}</dd></div>
            <div className="flex justify-between border-t border-[#d5e0dc] pt-2 text-[15px] font-semibold">
              <dt>{L.grand}</dt>
              <dd>AED {money(p.total)}</dd>
            </div>
          </dl>
        </div>

        <section className="mt-6 space-y-1.5 border-t border-[#e1e8e5] pt-4 text-[12.5px]">
          <p><span className="text-[#55706a]">{L.terms}:</span> {p.paymentTerms}</p>
          <p className="text-[#55706a]">{p.vat.note}</p>
          {quote.notes && <p><span className="text-[#55706a]">{L.notes}:</span> {quote.notes}</p>}
        </section>
      </div>
      <div className="mt-5 flex justify-center">
        <PrintButton label={L.print} />
      </div>
    </div>
  );
}
