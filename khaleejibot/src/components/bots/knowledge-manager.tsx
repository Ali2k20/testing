"use client";

import { FileTextIcon, Trash2Icon } from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { useActionState, useCallback, useRef, useTransition } from "react";
import { toast } from "sonner";

import { addKnowledge, deleteKnowledgeSource } from "@/app/dashboard/bots/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import type { ActionResult } from "@/lib/action-result";
import type { KnowledgeSourceRow } from "@/lib/supabase/database.types";

export function KnowledgeManager({
  botId,
  sources,
  canEdit,
}: {
  botId: string;
  sources: KnowledgeSourceRow[];
  canEdit: boolean;
}) {
  const t = useTranslations("knowledge");
  const root = useTranslations();
  const format = useFormatter();
  const now = useNow();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<ActionResult, FormData>(addKnowledge.bind(null, botId), undefined);
  const [deleting, startDelete] = useTransition();
  useActionFeedback(
    state,
    useCallback(() => formRef.current?.reset(), []),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={action} className="grid gap-4">
            <fieldset disabled={!canEdit || pending} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sourceName">{t("sourceName")}</Label>
                <Input id="sourceName" name="sourceName" maxLength={200} placeholder={t("sourceNamePlaceholder")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">{t("content")}</Label>
                <Textarea id="content" name="content" rows={8} placeholder={t("contentPlaceholder")} className="min-h-40" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="file">{t("file")}</Label>
                <Input id="file" name="file" type="file" accept=".txt,.md,.markdown,.csv,.json,text/plain,text/markdown,text/csv,application/json" />
                <p className="text-muted-foreground text-xs">{t("fileHelp")}</p>
              </div>
            </fieldset>
            {canEdit ? (
              <div>
                <Button type="submit" disabled={pending}>
                  {pending ? t("adding") : t("add")}
                </Button>
              </div>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sources")}</CardTitle>
        </CardHeader>
        <CardContent>
          {sources.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("empty")}</p>
          ) : (
            <ul className="divide-y">
              {sources.map((source) => (
                <li key={source.source_name} className="flex items-center gap-3 py-3">
                  <FileTextIcon className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{source.source_name}</p>
                    <p className="text-muted-foreground text-xs">
                      {t("chunkCount", { count: source.chunk_count })} ·{" "}
                      {format.relativeTime(new Date(source.updated_at), now)}
                    </p>
                  </div>
                  {canEdit ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={deleting}
                      aria-label={`${t("deleteSource")} ${source.source_name}`}
                      onClick={() =>
                        startDelete(async () => {
                          const result = await deleteKnowledgeSource(botId, source.source_name);
                          if (result?.ok) toast.success(t("deleted"));
                          else if (result) toast.error(root(result.error));
                        })
                      }
                    >
                      <Trash2Icon />
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
