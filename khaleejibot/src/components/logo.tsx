import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/** Speech bubble with a dhow sail — the KhaleejiBot mark. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M8 9.5h16a2.5 2.5 0 0 1 2.5 2.5v8a2.5 2.5 0 0 1-2.5 2.5h-9l-5 4v-4H8A2.5 2.5 0 0 1 5.5 20v-8A2.5 2.5 0 0 1 8 9.5Z"
        className="fill-primary-foreground/95"
      />
      <path d="M16.5 11.5v8.5h5.5c-1-3.4-2.9-6.2-5.5-8.5Z" className="fill-primary" />
      <path d="M15 13.5c-2 1.7-3.3 3.9-3.8 6.5H15v-6.5Z" className="fill-primary/60" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  const t = useTranslations("common");
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark />
      <span>{t("appName")}</span>
    </span>
  );
}
