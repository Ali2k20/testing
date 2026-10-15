"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import { setWhatsAppBot } from "@/app/dashboard/bots/actions";
import { CopyButton } from "@/components/copy-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function DeployPanel({
  botId,
  appUrl,
  isWhatsAppDefault,
  whatsappConnected,
  canEdit,
}: {
  botId: string;
  appUrl: string;
  isWhatsAppDefault: boolean;
  whatsappConnected: boolean;
  canEdit: boolean;
}) {
  const t = useTranslations("deploy");
  const root = useTranslations();
  const [pending, startTransition] = useTransition();
  const snippet = `<script src="${appUrl}/widget.js" data-bot-id="${botId}" data-lang="ar" async></script>`;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("widgetTitle")}</CardTitle>
          <CardDescription>{t("widgetHelp")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <pre dir="ltr" className="bg-muted overflow-x-auto rounded-lg p-4 text-start font-mono text-xs leading-relaxed">
            <code>{snippet}</code>
          </pre>
          <div>
            <CopyButton value={snippet} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("whatsappTitle")}</CardTitle>
          <CardDescription>{t("whatsappHelp")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {!whatsappConnected ? (
            <Alert variant="warning">
              <AlertDescription>
                <p>{t("notConnected")}</p>
                <Button asChild variant="link" className="h-auto p-0">
                  <Link href="/dashboard/settings">{t("goToSettings")}</Link>
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}
          <div className="flex items-center gap-3">
            <Switch
              id="whatsapp-default"
              checked={isWhatsAppDefault}
              disabled={!canEdit || pending}
              onCheckedChange={(checked) =>
                startTransition(async () => {
                  const result = await setWhatsAppBot(botId, checked);
                  if (result && !result.ok) toast.error(root(result.error));
                })
              }
            />
            <Label htmlFor="whatsapp-default">{t("makeDefault")}</Label>
          </div>
          {isWhatsAppDefault ? <p className="text-success text-sm">{t("isDefault")}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
