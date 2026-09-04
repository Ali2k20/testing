import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type ButtonTone = "solid" | "outline" | "ghost" | "gold";
type ButtonSize = "sm" | "md" | "lg";

const toneClasses: Record<ButtonTone, string> = {
  solid: "bg-ink text-ivory hover:bg-ink-soft",
  outline: "border border-ink text-ink hover:bg-ink hover:text-ivory",
  ghost: "text-ink hover:bg-sand",
  gold: "bg-gold text-ivory hover:bg-[#8f6d3d]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-[11px]",
  md: "px-6 py-3 text-[11px]",
  lg: "px-8 py-4 text-xs",
};

export function buttonClass(tone: ButtonTone = "solid", size: ButtonSize = "md", extra = "") {
  return [
    "inline-flex items-center justify-center gap-2 eyebrow transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40",
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
  return <p className={`eyebrow text-gold ${className}`}>{children}</p>;
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
        <h2 className="font-display text-4xl leading-[1.08] font-light text-ink sm:text-5xl">
          {title}
        </h2>
        {intro && <p className="max-w-xl text-sm leading-relaxed text-ink-muted">{intro}</p>}
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
              <stop offset={`${Math.max(0, Math.min(1, rating - step + 1)) * 100}%`} stopColor="#A8834F" />
              <stop offset={`${Math.max(0, Math.min(1, rating - step + 1)) * 100}%`} stopColor="#DED2C1" />
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
    ink: "bg-ink text-ivory",
    gold: "bg-gold text-ivory",
    sale: "bg-[#7A2E33] text-ivory",
    quiet: "bg-ivory/90 text-ink border border-line",
  } as const;
  return (
    <span className={`eyebrow px-2.5 py-1 ${tones[tone]}`}>{children}</span>
  );
}
