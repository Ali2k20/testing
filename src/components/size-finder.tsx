"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonClass } from "./ui";
import { abayaSizeChart, abayaSizeForHeight } from "@/lib/sizing";
import { whatsappLink } from "@/lib/site";

const MIN_HEIGHT = 145;
const MAX_HEIGHT = 185;

/** Height in, Gulf abaya size out: the six sizes in a row with the match lit. */
export function SizeFinder({ initialHeight = 163 }: { initialHeight?: number }) {
  const [height, setHeight] = useState(initialHeight);
  const match = abayaSizeForHeight(height);

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-20 lg:gap-y-10">
      <div className="lg:col-start-1 lg:row-start-1">
        <div className="flex items-baseline justify-between gap-4">
          <label htmlFor="finder-height" className="text-lg text-fg">
            Your height, in the shoes you usually wear
          </label>
          <output htmlFor="finder-height" className="shrink-0 text-lg tabular-nums text-fg">
            {height} cm
          </output>
        </div>
        <div className="mt-4">
          <input
            id="finder-height"
            type="range"
            min={MIN_HEIGHT}
            max={MAX_HEIGHT}
            step={1}
            value={height}
            onChange={(event) => setHeight(Number(event.target.value))}
            aria-valuetext={`${height} centimetres`}
            className="h-11 w-full cursor-pointer accent-[var(--color-talli)]"
          />
        </div>
      </div>

      <ol className="grid grid-cols-3 gap-x-4 gap-y-10 sm:grid-cols-6 sm:gap-x-5 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center" aria-label="Abaya sizes">
        {abayaSizeChart.map((row) => {
          const lit = row.size === match.size;
          return (
            <li
              key={row.size}
              aria-current={lit ? "true" : undefined}
              className={`transition-colors duration-300 ${lit ? "text-fg" : "text-fg-muted"}`}
            >
              <span
                className={`block font-display leading-none tracking-[-0.03em] tabular-nums text-[clamp(3.25rem,5vw,4.75rem)] transition-colors duration-300 ${
                  lit ? "text-talli" : "text-fg-muted/70"
                }`}
              >
                {row.size}
              </span>
              <span className="mt-3 block text-[0.9375rem] tabular-nums">{row.length} cm long</span>
              <span className="block text-[0.9375rem] tabular-nums">{row.height}</span>
            </li>
          );
        })}
      </ol>

      <div className="lg:col-start-1 lg:row-start-2">
        <p className="text-lg leading-relaxed text-fg" aria-live="polite">
          Take a <strong className="font-medium">size {match.size}</strong>:{" "}
          {match.length} cm from shoulder to hem, usually {match.uk.replace(" – ", " to ")}.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
          <Link
            href={`/shop?category=abaya&size=${match.size}`}
            className={buttonClass("solid", "lg")}
          >
            Shop abayas in size {match.size}
          </Link>
          <a
            href={whatsappLink(
              `Hi FRS, I am ${height} cm tall and the size finder says ${match.size}. Can you confirm?`,
            )}
            className="link-underline text-base text-fg-soft hover:text-fg"
            target="_blank"
            rel="noopener noreferrer"
          >
            Check with a stylist on WhatsApp
          </a>
        </div>
      </div>

    </div>
  );
}
