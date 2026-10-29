import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ButtonLink } from "@/components/ui";
import { site, whatsappLink } from "@/lib/site";
import { abayaSizeChart } from "@/lib/sizing";

export const metadata: Metadata = {
  title: "Size guide",
  description:
    "Gulf abaya sizing explained — how 50 to 60 maps to height, how to measure shoulder to hem, and what to do if you are between sizes.",
  alternates: { canonical: "/size-guide" },
};

const abayaRows = abayaSizeChart;

const letterRows = [
  { size: "S", bust: "82 – 88 cm", hip: "88 – 94 cm", uk: "UK 8 – 10" },
  { size: "M", bust: "88 – 96 cm", hip: "94 – 102 cm", uk: "UK 10 – 12" },
  { size: "L", bust: "96 – 104 cm", hip: "102 – 110 cm", uk: "UK 14 – 16" },
  { size: "XL", bust: "104 – 114 cm", hip: "110 – 120 cm", uk: "UK 18 – 20" },
];

export default function SizeGuidePage() {
  return (
    <>
      <PageHeader
        eyebrow="Fit, honestly"
        title="Size guide"
        intro="Gulf abaya sizing is a length system, not a body-width system. The number is roughly your height, not your dress size — which is why a 54 fits a range of shapes."
      />

      <div className="mx-auto max-w-4xl px-5 py-16 lg:px-10">
        <section>
          <h2 className="font-display text-3xl">Abayas — sizes 50 to 60</h2>
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">
            Pick by height first. Every product page lists the exact shoulder-to-hem measurement for
            the size you have selected, so you can check before you buy.
          </p>
          <div className="mt-7 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-fg text-left">
                  <Th>Size</Th>
                  <Th>Shoulder to hem</Th>
                  <Th>Best for height</Th>
                  <Th>Roughly</Th>
                </tr>
              </thead>
              <tbody>
                {abayaRows.map((row) => (
                  <tr key={row.size} className="border-b border-line-soft">
                    <Td className="font-display text-xl">{row.size}</Td>
                    <Td>{row.length} cm</Td>
                    <Td>{row.height}</Td>
                    <Td className="text-fg-muted">{row.uk}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-3xl">Mukhawar, kaftans and sets</h2>
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">
            These are cut loose by design, so letter sizing is generous. If you are between two,
            take the smaller one — our relaxed fits run wide.
          </p>
          <div className="mt-7 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-fg text-left">
                  <Th>Size</Th>
                  <Th>Bust</Th>
                  <Th>Hip</Th>
                  <Th>Roughly</Th>
                </tr>
              </thead>
              <tbody>
                {letterRows.map((row) => (
                  <tr key={row.size} className="border-b border-line-soft">
                    <Td className="font-display text-xl">{row.size}</Td>
                    <Td>{row.bust}</Td>
                    <Td>{row.hip}</Td>
                    <Td className="text-fg-muted">{row.uk}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-3xl">How to measure at home</h2>
          <ol className="mt-6 space-y-5 text-sm leading-relaxed text-fg-muted">
            {[
              "Put on the shoes you will usually wear with the abaya. Height changes with heels, and length is what matters most.",
              "Stand straight against a wall and measure from the top of your shoulder, straight down to where you want the hem to sit — for most customers that is 2 cm above the floor.",
              "Compare that number to the shoulder-to-hem column above. Take the closest size, and round up if you are between two.",
              "For mukhawar and kaftans, measure your bust and hip loosely over a t-shirt, then use the second table.",
            ].map((step, index) => (
              <li key={index} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-[13px] text-fg">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16 border border-line bg-panel p-8">
          <h2 className="font-display text-3xl">Still between sizes?</h2>
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">
            Send us your height and the abaya size you normally wear. A person in the studio will
            reply, usually within the hour during working days. If it still arrives wrong, we collect
            it and send the right size free of charge within {site.returnWindowDays} days.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={whatsappLink(
                "Hi FRS, I am between sizes. My height is ___ cm and I usually wear a size ___.",
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="eyebrow inline-flex items-center justify-center gap-2 bg-fg px-6 py-3 text-ground transition-colors hover:bg-fg-soft"
            >
              Ask on WhatsApp
            </a>
            <ButtonLink href="/shipping-and-returns" tone="outline">
              Read the returns policy
            </ButtonLink>
          </div>
        </section>
      </div>
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="py-3 pr-4 text-[13px] text-fg-muted">{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-4 pr-4 ${className}`}>{children}</td>;
}
