"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";

import { deleteBot, updateBot } from "@/app/dashboard/bots/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import type { ActionResult } from "@/lib/action-result";
import type { BotRow } from "@/lib/supabase/database.types";

import { PersonaSelect } from "./persona-select";

export function BotSettingsForm({ bot, canEdit }: { bot: BotRow; canEdit: boolean }) {
  const t = useTranslations("bots");
  const common = useTranslations("common");
  const [state, action, pending] = useActionState<ActionResult, FormData>(updateBot.bind(null, bot.id), undefined);
  const [threshold, setThreshold] = useState(Number(bot.confidence_threshold));
  useActionFeedback(state);

  return (
    <form action={action} className="grid max-w-3xl gap-6">
      <fieldset disabled={!canEdit || pending} className="grid gap-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">{t("fields.name")}</Label>
            <Input id="name" name="name" required maxLength={80} defaultValue={bot.name} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dialect_persona">{t("fields.persona")}</Label>
            <PersonaSelect id="dialect_persona" defaultValue={bot.dialect_persona} />
          </div>
        </div>
        <p className="text-muted-foreground -mt-3 text-xs">{t("fields.personaHelp")}</p>

        <div className="grid gap-2">
          <Label htmlFor="system_instructions">{t("fields.instructions")}</Label>
          <Textarea
            id="system_instructions"
            name="system_instructions"
            rows={5}
            maxLength={8000}
            defaultValue={bot.system_instructions}
            placeholder={t("fields.instructionsPlaceholder")}
            className="min-h-28"
          />
          <p className="text-muted-foreground text-xs">{t("fields.instructionsHelp")}</p>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="confidence_threshold">{t("fields.threshold")}</Label>
            <output htmlFor="confidence_threshold" className="font-mono text-sm tabular-nums" dir="ltr">
              {threshold.toFixed(2)}
            </output>
          </div>
          <input
            id="confidence_threshold"
            name="confidence_threshold"
            type="range"
            min={0.3}
            max={0.95}
            step={0.05}
            value={threshold}
            onChange={(event) => setThreshold(Number(event.target.value))}
            className="accent-primary w-full"
          />
          <p className="text-muted-foreground text-xs">{t("fields.thresholdHelp")}</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <MessageField name="welcome_message_ar" label={t("fields.welcomeAr")} value={bot.welcome_message_ar} dir="rtl" />
          <MessageField name="welcome_message_en" label={t("fields.welcomeEn")} value={bot.welcome_message_en} dir="ltr" />
          <MessageField name="handoff_message_ar" label={t("fields.handoffAr")} value={bot.handoff_message_ar} dir="rtl" />
          <MessageField name="handoff_message_en" label={t("fields.handoffEn")} value={bot.handoff_message_en} dir="ltr" />
        </div>
      </fieldset>

      {canEdit ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
          <Button type="submit" disabled={pending}>
            {pending ? common("saving") : common("save")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={async () => {
              if (window.confirm(t("deleteConfirm"))) await deleteBot(bot.id);
            }}
          >
            {t("delete")}
          </Button>
        </div>
      ) : null}
    </form>
  );
}

function MessageField({ name, label, value, dir }: { name: string; label: string; value: string; dir: "rtl" | "ltr" }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} rows={2} maxLength={500} required defaultValue={value} dir={dir} />
    </div>
  );
}
