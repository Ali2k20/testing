"use client";

import { BotIcon, InboxIcon, LayoutDashboardIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", key: "overview", icon: LayoutDashboardIcon, exact: true },
  { href: "/dashboard/inbox", key: "inbox", icon: InboxIcon },
  { href: "/dashboard/bots", key: "bots", icon: BotIcon },
  { href: "/dashboard/settings", key: "settings", icon: SettingsIcon },
] as const;

export function DashboardNav({ pendingCount }: { pendingCount: number }) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {ITEMS.map(({ href, key, icon: Icon, ...item }) => {
        const active = "exact" in item ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            <span>{t(key)}</span>
            {key === "inbox" && pendingCount > 0 ? (
              <span className="bg-destructive ms-auto rounded-full px-1.5 py-0.5 text-[11px] leading-none font-semibold text-white tabular-nums">
                {pendingCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
