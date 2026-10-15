import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";

import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase.from("organization_members").select("org_id").limit(1).maybeSingle();
  if (membership) redirect("/dashboard");

  const t = await getTranslations("onboarding");
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <LocaleSwitcher />
      </header>
      <main className="flex flex-1 justify-center px-4 pt-10 sm:pt-16">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
          <OnboardingForm />
        </div>
      </main>
    </div>
  );
}
