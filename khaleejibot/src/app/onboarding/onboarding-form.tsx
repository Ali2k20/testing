"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createOrganization, type OnboardingState } from "./actions";

export function OnboardingForm() {
  const t = useTranslations("onboarding");
  const common = useTranslations("common");
  const [state, action, pending] = useActionState<OnboardingState, FormData>(createOrganization, undefined);

  return (
    <form action={action} className="mt-8 grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">{t("orgName")}</Label>
        <Input id="name" name="name" required maxLength={120} placeholder={t("orgNamePlaceholder")} />
      </div>
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{common("genericError")}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={pending}>
        {t("create")}
      </Button>
    </form>
  );
}
