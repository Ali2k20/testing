import { CheckCircle2Icon, CircleIcon } from "lucide-react";
import Link from "next/link";
import { getFormatter, getNow, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrgContext } from "@/lib/auth";
import { summaryLines } from "@/lib/handoff-display";
import { createClient } from "@/lib/supabase/server";

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export default async function OverviewPage() {
  const ctx = await requireOrgContext();
  const t = await getTranslations("overview");
  const inbox = await getTranslations("inbox");
  const format = await getFormatter();
  const now = await getNow();
  const supabase = await createClient();
  const weekAgo = daysAgoIso(7);

  const [bots, open, pending, recentTotal, recentHandedOff, handoffs, knowledge] = await Promise.all([
    supabase.from("bots").select("id", { count: "exact", head: true }),
    supabase.from("conversations").select("id", { count: "exact", head: true }).neq("status", "RESOLVED"),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("status", "HUMAN_PENDING"),
    supabase.from("conversations").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo)
      .not("handoff_reason", "is", null),
    supabase
      .from("conversations")
      .select("id, customer_name, customer_identifier, channel, ai_summary, updated_at")
      .in("status", ["HUMAN_PENDING", "HUMAN_ACTIVE"])
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase.from("knowledge_sources").select("bot_id", { count: "exact", head: true }),
  ]);

  const total = recentTotal.count ?? 0;
  const aiShare = total > 0 ? (total - (recentHandedOff.count ?? 0)) / total : null;
  const stats = [
    { label: t("stats.bots"), value: format.number(bots.count ?? 0) },
    { label: t("stats.open"), value: format.number(open.count ?? 0) },
    { label: t("stats.pending"), value: format.number(pending.count ?? 0), alert: (pending.count ?? 0) > 0 },
    { label: t("stats.aiHandled"), value: aiShare === null ? "—" : format.number(aiShare, { style: "percent" }) },
  ];
  const steps = [
    { label: t("steps.createBot"), done: (bots.count ?? 0) > 0, href: "/dashboard/bots" },
    { label: t("steps.addKnowledge"), done: (knowledge.count ?? 0) > 0, href: "/dashboard/bots" },
    { label: t("steps.deploy"), done: Boolean(ctx.org.whatsapp_phone_number_id) || total > 0, href: "/dashboard/bots" },
  ];

  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <div className="grid gap-6 p-4 sm:p-8">
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl border p-5 shadow-xs">
              <dt className="text-muted-foreground text-sm">{stat.label}</dt>
              <dd className={`mt-2 text-3xl font-bold tabular-nums ${stat.alert ? "text-destructive" : ""}`}>{stat.value}</dd>
            </div>
          ))}
        </dl>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>{t("recentHandoffs")}</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/inbox">{t("openInbox")}</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {handoffs.data?.length ? (
                <ul className="divide-y">
                  {handoffs.data.map((c) => (
                    <li key={c.id} className="py-3">
                      <div className="flex items-center justify-between gap-2 text-sm font-medium">
                        <span dir="auto">
                          {c.customer_name ?? (c.channel === "whatsapp" ? `+${c.customer_identifier}` : inbox("anonymous"))}
                        </span>
                        <time className="text-muted-foreground text-xs font-normal" dateTime={c.updated_at}>
                          {format.relativeTime(new Date(c.updated_at), now)}
                        </time>
                      </div>
                      {c.ai_summary
                        ? summaryLines(c.ai_summary).map((line, i) => (
                            <p key={i} className="text-muted-foreground mt-1 line-clamp-2 text-sm" dir="auto">
                              {line}
                            </p>
                          ))
                        : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">{t("noHandoffs")}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("gettingStarted")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="grid gap-3">
                {steps.map((step) => (
                  <li key={step.label}>
                    <Link href={step.href} className="flex items-center gap-3 text-sm hover:underline">
                      {step.done ? (
                        <CheckCircle2Icon className="text-success size-5 shrink-0" aria-hidden />
                      ) : (
                        <CircleIcon className="text-muted-foreground size-5 shrink-0" aria-hidden />
                      )}
                      <span className={step.done ? "text-muted-foreground line-through" : ""}>{step.label}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
