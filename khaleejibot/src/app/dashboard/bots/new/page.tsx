import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { CreateBotForm } from "@/components/bots/create-bot-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { isAdmin, requireOrgContext } from "@/lib/auth";

export default async function NewBotPage() {
  const ctx = await requireOrgContext();
  if (!isAdmin(ctx.role)) redirect("/dashboard/bots");
  const t = await getTranslations("bots");

  return (
    <>
      <PageHeader title={t("newTitle")} />
      <div className="p-4 sm:p-8">
        <CreateBotForm />
      </div>
    </>
  );
}
