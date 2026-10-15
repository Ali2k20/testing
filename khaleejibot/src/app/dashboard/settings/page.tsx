import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/dashboard/page-header";
import { InviteForm, OrganizationForm, WhatsAppForm } from "@/components/settings/settings-forms";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isAdmin, requireOrgContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const ctx = await requireOrgContext();
  const t = await getTranslations("settings");
  const canEdit = isAdmin(ctx.role);
  const supabase = await createClient();
  const admin = createAdminClient();

  // Whether a token exists is read server-side; the token itself never leaves the server.
  const [{ data: tokenRow }, { data: members }] = await Promise.all([
    admin.from("organizations").select("whatsapp_access_token").eq("id", ctx.org.id).single(),
    supabase.from("organization_members").select("user_id, role, created_at").eq("org_id", ctx.org.id).order("created_at"),
  ]);

  const emails = new Map<string, string>();
  if (canEdit) {
    await Promise.all(
      (members ?? []).map(async (member) => {
        const { data } = await admin.auth.admin.getUserById(member.user_id);
        if (data.user?.email) emails.set(member.user_id, data.user.email);
      }),
    );
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <>
      <PageHeader title={t("title")} />
      <div className="grid max-w-4xl gap-6 p-4 sm:p-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("org.title")}</CardTitle>
            <CardDescription>
              {t("org.plan")}: <Badge variant="secondary">{t(`org.plans.${ctx.org.plan_tier}`)}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrganizationForm name={ctx.org.name} canEdit={canEdit} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("whatsapp.title")}</CardTitle>
            <CardDescription>{t("whatsapp.help")}</CardDescription>
          </CardHeader>
          <CardContent>
            <WhatsAppForm
              phoneNumberId={ctx.org.whatsapp_phone_number_id}
              hasToken={Boolean(tokenRow?.whatsapp_access_token)}
              webhookUrl={`${appUrl}/api/whatsapp/webhook`}
              canEdit={canEdit}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("team.title")}</CardTitle>
            <CardDescription>{t("team.help")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <ul className="divide-y">
              {(members ?? []).map((member) => (
                <li key={member.user_id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span dir="ltr" className="truncate">
                    {emails.get(member.user_id) ?? member.user_id.slice(0, 8)}
                    {member.user_id === ctx.userId ? (
                      <span className="text-muted-foreground"> ({t("team.you")})</span>
                    ) : null}
                  </span>
                  <Badge variant="outline">{t(`team.roles.${member.role}`)}</Badge>
                </li>
              ))}
            </ul>
            {canEdit ? <InviteForm /> : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
