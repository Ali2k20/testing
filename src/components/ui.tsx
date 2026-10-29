import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type ButtonTone = "solid" | "outline" | "ghost" | "gold";
type ButtonSize = "sm" | "md" | "lg";

const toneClasses: Record<ButtonTone, string> = {
  solid: "bg-talli text-ground hover:bg-talli-soft",
  outline: "border border-fg-muted text-fg hover:border-fg hover:bg-fg hover:text-ground",
  ghost: "text-fg hover:bg-panel",
  gold: "bg-talli text-ground hover:bg-talli-soft",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-10 px-4 py-2 text-sm",
  md: "min-h-11 px-6 py-3 text-[0.9375rem]",
  lg: "min-h-12 px-8 py-3.5 text-base",
};

export function buttonClass(tone: ButtonTone = "solid", size: ButtonSize = "md", extra = "") {
  return [
    "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40",
    toneClasses[tone],
    sizeClasses[size],
    extra,
  ].join(" ");
}

export function ButtonLink({
  tone = "solid",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { tone?: ButtonTone; size?: ButtonSize }) {
  return <Link {...props} className={buttonClass(tone, size, className)} />;
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`eyebrow text-fg-muted ${className}`}>{children}</p>;
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "center",
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "center" | "left";
  action?: ReactNode;
}) {
  const alignment = align === "center" ? "items-center text-center" : "items-start text-left";
  return (
    <div
      className={`flex flex-col gap-4 ${alignment} ${
        action ? "md:flex-row md:items-end md:justify-between md:text-left" : ""
      }`}
    >
      <div className={`flex flex-col gap-3 ${alignment}`}>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 className="font-display text-4xl leading-[1.04] tracking-[-0.02em] text-balance text-fg sm:text-5xl">
          {title}
        </h2>
        {intro && <p className="max-w-xl text-base leading-relaxed text-fg-soft">{intro}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-hidden>
      {[1, 2, 3, 4, 5].map((step) => (
        <svg key={step} viewBox="0 0 20 20" className="h-3.5 w-3.5">
          <defs>
            <linearGradient id={`star-${step}-${Math.round(rating * 10)}`}>
              <stop offset={`${Math.max(0, Math.min(1, rating - step + 1)) * 100}%`} stopColor="#CFAB62" />
              <stop offset={`${Math.max(0, Math.min(1, rating - step + 1)) * 100}%`} stopColor="#4A443D" />
            </linearGradient>
          </defs>
          <path
            fill={`url(#star-${step}-${Math.round(rating * 10)})`}
            d="M10 1.6l2.4 5.2 5.6.7-4.1 3.9 1.1 5.6L10 14.3 4.9 17l1.1-5.6L1.9 7.5l5.6-.7z"
          />
        </svg>
      ))}
    </span>
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return <hr className={`border-0 border-t border-line-soft ${className}`} />;
}

export function Badge({
  children,
  tone = "ink",
}: {
  children: ReactNode;
  tone?: "ink" | "gold" | "sale" | "quiet";
}) {
  const tones = {
    ink: "bg-fg text-ground",
    gold: "bg-talli text-ground",
    sale: "bg-[#9E3A42] text-fg",
    quiet: "bg-ground/90 text-fg border border-line",
  } as const;
  return (
    <span className={`px-2.5 py-1 text-[13px] font-medium ${tones[tone]}`}>{children}</span>
  );
}
