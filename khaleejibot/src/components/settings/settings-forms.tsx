"use client";

import { useTranslations } from "next-intl";
import { useActionState, useCallback, useRef } from "react";

import { inviteMember, saveWhatsAppSettings, updateOrganization } from "@/app/dashboard/settings/actions";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import type { ActionResult } from "@/lib/action-result";

export function OrganizationForm({ name, canEdit }: { name: string; canEdit: boolean }) {
  const t = useTranslations("settings.org");
  const common = useTranslations("common");
  const [state, action, pending] = useActionState<ActionResult, FormData>(updateOrganization, undefined);
  useActionFeedback(state);

  return (
    <form action={action} className="grid max-w-md gap-4">
      <fieldset disabled={!canEdit || pending} className="grid gap-2">
        <Label htmlFor="org-name">{t("name")}</Label>
        <Input id="org-name" name="name" defaultValue={name} required maxLength={120} />
      </fieldset>
      {canEdit ? (
        <div>
          <Button type="submit" disabled={pending}>
            {common("save")}
          </Button>
        </div>
      ) : null}
    </form>
  );
}

export function WhatsAppForm({
  phoneNumberId,
  hasToken,
  webhookUrl,
  canEdit,
}: {
  phoneNumberId: string | null;
  hasToken: boolean;
  webhookUrl: string;
  canEdit: boolean;
}) {
  const t = useTranslations("settings.whatsapp");
  const common = useTranslations("common");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<ActionResult, FormData>(saveWhatsAppSettings, undefined);
  useActionFeedback(
    state,
    useCallback(() => {
      const token = formRef.current?.elements.namedItem("accessToken");
      if (token instanceof HTMLInputElement) token.value = "";
    }, []),
  );

  return (
    <div className="grid gap-6">
      <form ref={formRef} action={action} className="grid max-w-md gap-4">
        <fieldset disabled={!canEdit || pending} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="phoneNumberId">{t("phoneNumberId")}</Label>
            <Input
              id="phoneNumberId"
              name="phoneNumberId"
              inputMode="numeric"
              dir="ltr"
              required
              pattern="\d{5,30}"
              defaultValue={phoneNumberId ?? ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="accessToken">{t("accessToken")}</Label>
            <Input
              id="accessToken"
              name="accessToken"
              type="password"
              dir="ltr"
              autoComplete="off"
              placeholder={t("tokenPlaceholder")}
              required={!hasToken}
            />
            {hasToken ? <p className="text-muted-foreground text-xs">{t("tokenSet")}</p> : null}
          </div>
        </fieldset>
        {canEdit ? (
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? common("saving") : common("save")}
            </Button>
          </div>
        ) : null}
      </form>

      <div className="grid max-w-2xl gap-2">
        <Label>{t("webhookUrl")}</Label>
        <div className="flex flex-wrap items-center gap-2">
          <code dir="ltr" className="bg-muted rounded-md px-3 py-2 font-mono text-xs break-all">
            {webhookUrl}
          </code>
          <CopyButton value={webhookUrl} />
        </div>
        <p className="text-muted-foreground text-xs">{t("webhookHelp")}</p>
      </div>
    </div>
  );
}

export function InviteForm() {
  const t = useTranslations("settings.team");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<ActionResult, FormData>(inviteMember, undefined);
  useActionFeedback(
    state,
    useCallback(() => formRef.current?.reset(), []),
  );

  return (
    <form ref={formRef} action={action} className="flex flex-wrap items-end gap-3">
      <div className="grid min-w-56 flex-1 gap-2">
        <Label htmlFor="invite-email">{t("email")}</Label>
        <Input id="invite-email" name="email" type="email" dir="ltr" required />
      </div>
      <div className="grid w-36 gap-2">
        <Label htmlFor="invite-role">{t("role")}</Label>
        <NativeSelect id="invite-role" name="role" defaultValue="agent">
          <option value="agent">{t("roles.agent")}</option>
          <option value="admin">{t("roles.admin")}</option>
        </NativeSelect>
      </div>
      <Button type="submit" disabled={pending}>
        {t("invite")}
      </Button>
    </form>
  );
}
