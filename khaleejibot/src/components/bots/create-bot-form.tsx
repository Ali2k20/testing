"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { createBot } from "@/app/dashboard/bots/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import type { ActionResult } from "@/lib/action-result";

import { PersonaSelect } from "./persona-select";

export function CreateBotForm() {
  const t = useTranslations("bots");
  const [state, action, pending] = useActionState<ActionResult, FormData>(createBot, undefined);
  useActionFeedback(state);

  return (
    <form action={action} className="grid max-w-lg gap-5">
      <div className="grid gap-2">
        <Label htmlFor="name">{t("fields.name")}</Label>
        <Input id="name" name="name" required maxLength={80} placeholder="Fanar Concierge" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="dialect_persona">{t("fields.persona")}</Label>
        <PersonaSelect id="dialect_persona" />
        <p className="text-muted-foreground text-xs">{t("fields.personaHelp")}</p>
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {t("create")}
        </Button>
      </div>
    </form>
  );
}
