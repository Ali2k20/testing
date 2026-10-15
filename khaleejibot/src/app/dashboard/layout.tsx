import { LogOutIcon } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { signOut } from "@/app/(auth)/actions";
import { DashboardNav } from "@/components/dashboard/nav";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { requireOrgContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireOrgContext();
  const t = await getTranslations("common");
  const supabase = await createClient();
  const { count: pendingCount } = await supabase
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("status", "HUMAN_PENDING");

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="bg-card flex flex-col gap-4 border-b p-4 md:sticky md:top-0 md:h-dvh md:w-60 md:shrink-0 md:border-e md:border-b-0">
        <div className="flex items-center justify-between gap-2">
          <Link href="/dashboard">
            <Logo />
          </Link>
          <div className="flex items-center md:hidden">
            <LocaleSwitcher />
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="icon" aria-label={t("signOut")}>
                <LogOutIcon aria-hidden className="rtl:-scale-x-100" />
              </Button>
            </form>
          </div>
        </div>
        <div className="text-muted-foreground hidden truncate text-xs font-medium md:block">{ctx.org.name}</div>
        <DashboardNav pendingCount={pendingCount ?? 0} />
        <div className="mt-auto hidden flex-col gap-1 md:flex">
          <div className="text-muted-foreground truncate px-3 text-xs" dir="ltr">
            {ctx.email}
          </div>
          <LocaleSwitcher className="justify-start" />
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
              <LogOutIcon aria-hidden className="rtl:-scale-x-100" />
              {t("signOut")}
            </Button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
