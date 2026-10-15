"use client";

import {
  ArrowLeftIcon,
  BotIcon,
  CheckCheckIcon,
  GlobeIcon,
  HandIcon,
  MessageCircleIcon,
  MicIcon,
  PlayIcon,
  SendIcon,
  SparklesIcon,
  UndoIcon,
} from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  getVoiceNoteUrl,
  handBackToAI,
  resolveConversation,
  sendAgentReply,
  takeOverConversation,
} from "@/app/dashboard/inbox/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { parseHandoffReason, summaryLines } from "@/lib/handoff-display";
import { inboxTopic, INBOX_EVENT, type InboxPing } from "@/lib/realtime";
import { createClient } from "@/lib/supabase/client";
import type { ConversationRow, ConversationStatus, MessageRow } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

export type InboxConversation = ConversationRow & { bot_name: string };

const FILTERS = [
  { key: "attention", status: "HUMAN_PENDING" },
  { key: "active", status: "HUMAN_ACTIVE" },
  { key: "ai", status: "AI_ACTIVE" },
  { key: "resolved", status: "RESOLVED" },
] as const satisfies { key: string; status: ConversationStatus }[];

type FilterKey = (typeof FILTERS)[number]["key"];

const STATUS_BADGE: Record<ConversationStatus, "destructive" | "warning" | "secondary" | "outline"> = {
  HUMAN_PENDING: "destructive",
  HUMAN_ACTIVE: "warning",
  AI_ACTIVE: "secondary",
  RESOLVED: "outline",
};

export function InboxClient({
  orgId,
  botNames,
  initialConversations,
}: {
  orgId: string;
  botNames: Record<string, string>;
  initialConversations: InboxConversation[];
}) {
  const t = useTranslations("inbox");
  const supabase = useMemo(() => createClient(), []);
  const [conversations, setConversations] = useState(initialConversations);
  const [filter, setFilter] = useState<FilterKey>(() =>
    initialConversations.some((c) => c.status === "HUMAN_PENDING") ? "attention" : "ai",
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Messages are tagged with their conversation so a stale thread is never shown.
  const [thread, setThread] = useState<{ conversationId: string | null; messages: MessageRow[] }>({
    conversationId: null,
    messages: [],
  });
  const [connected, setConnected] = useState(false);
  const selectedRef = useRef<string | null>(null);
  useEffect(() => {
    selectedRef.current = selectedId;
  }, [selectedId]);

  const upsertConversation = useCallback(
    (row: ConversationRow) => {
      setConversations((current) => {
        const next = current.filter((c) => c.id !== row.id);
        next.push({ ...row, bot_name: botNames[row.bot_id] ?? "" });
        return next.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      });
    },
    [botNames],
  );

  const appendMessage = useCallback((row: MessageRow) => {
    setThread((current) => {
      if (row.conversation_id !== current.conversationId || current.messages.some((m) => m.id === row.id)) {
        return current;
      }
      const messages = [...current.messages, row].sort((a, b) => a.created_at.localeCompare(b.created_at));
      return { ...current, messages };
    });
  }, []);

  const refreshConversation = useCallback(
    async (conversationId: string) => {
      const { data } = await supabase.from("conversations").select("*").eq("id", conversationId).maybeSingle();
      if (data) upsertConversation(data);
    },
    [supabase, upsertConversation],
  );

  const loadMessages = useCallback(
    async (conversationId: string) => {
      const messages = await fetchThread(supabase, conversationId);
      setThread((current) =>
        selectedRef.current === conversationId || current.conversationId === conversationId
          ? { conversationId, messages }
          : current,
      );
    },
    [supabase],
  );

  // Realtime: row changes (RLS-filtered by Supabase) plus the engine's private
  // "inbox:<org>" pings, which also drive the handoff alert.
  useEffect(() => {
    const changes = supabase
      .channel(`inbox-changes:${orgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, (payload) => {
        if (payload.eventType !== "DELETE") upsertConversation(payload.new as ConversationRow);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        appendMessage(payload.new as MessageRow);
      })
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    const pings = supabase
      .channel(inboxTopic(orgId), { config: { private: true } })
      .on("broadcast", { event: INBOX_EVENT }, ({ payload }) => {
        const ping = payload as InboxPing;
        void refreshConversation(ping.conversationId);
        if (ping.conversationId === selectedRef.current) void loadMessages(ping.conversationId);
        if (ping.type === "handoff") {
          toast.warning(t("newHandoff"), {
            action: { label: t("takeOver"), onClick: () => setSelectedId(ping.conversationId) },
          });
        }
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(changes);
      void supabase.removeChannel(pings);
    };
  }, [supabase, orgId, upsertConversation, appendMessage, refreshConversation, loadMessages, t]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    fetchThread(supabase, selectedId).then((messages) => {
      if (!cancelled) setThread({ conversationId: selectedId, messages });
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId, supabase]);

  const counts = useMemo(() => {
    const result: Record<ConversationStatus, number> = { HUMAN_PENDING: 0, HUMAN_ACTIVE: 0, AI_ACTIVE: 0, RESOLVED: 0 };
    for (const c of conversations) result[c.status] += 1;
    return result;
  }, [conversations]);

  const activeStatus = FILTERS.find((f) => f.key === filter)!.status;
  const visible = conversations.filter((c) => c.status === activeStatus);
  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const messages = thread.conversationId === selectedId ? thread.messages : [];

  return (
    <div className="grid h-[calc(100dvh-var(--inbox-offset,0px))] min-h-[32rem] md:grid-cols-[22rem_minmax(0,1fr)]">
      {/* Conversation list */}
      <section className={cn("flex min-h-0 flex-col border-e", selected && "hidden md:flex")} aria-label={t("title")}>
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <h1 className="text-lg font-bold">{t("title")}</h1>
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs" role="status">
            <span className={cn("size-2 rounded-full", connected ? "bg-success" : "bg-warning animate-pulse")} aria-hidden />
            {connected ? t("live") : t("reconnecting")}
          </span>
        </div>
        <div className="flex gap-1 overflow-x-auto border-b p-2" role="tablist">
          {FILTERS.map(({ key, status }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              onClick={() => setFilter(key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                filter === key ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {t(`filters.${key}`)}
              <span
                className={cn(
                  "rounded-full px-1.5 tabular-nums",
                  key === "attention" && counts[status] > 0 ? "bg-destructive text-white" : "bg-muted",
                )}
              >
                {counts[status]}
              </span>
            </button>
          ))}
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {visible.length === 0 ? (
            <li className="text-muted-foreground p-6 text-center text-sm">{t("empty")}</li>
          ) : (
            visible.map((conversation) => (
              <li key={conversation.id}>
                <ConversationListItem
                  conversation={conversation}
                  active={conversation.id === selectedId}
                  onSelect={() => setSelectedId(conversation.id)}
                />
              </li>
            ))
          )}
        </ul>
      </section>

      {/* Conversation detail */}
      <section className={cn("flex min-h-0 flex-col", !selected && "hidden md:flex")}>
        {selected ? (
          <ConversationView
            key={selected.id}
            conversation={selected}
            messages={messages}
            onBack={() => setSelectedId(null)}
            onMessageSent={appendMessage}
            onChanged={() => refreshConversation(selected.id)}
          />
        ) : (
          <div className="text-muted-foreground m-auto flex flex-col items-center gap-3 p-8 text-sm">
            <MessageCircleIcon className="size-10 opacity-40" aria-hidden />
            {t("select")}
          </div>
        )}
      </section>
    </div>
  );
}

async function fetchThread(supabase: ReturnType<typeof createClient>, conversationId: string): Promise<MessageRow[]> {
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(300);
  return data ?? [];
}

function ConversationListItem({
  conversation,
  active,
  onSelect,
}: {
  conversation: InboxConversation;
  active: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations("inbox");
  const format = useFormatter();
  // Ticks so "3 minutes ago" stays true while the inbox is left open.
  const now = useNow({ updateInterval: 30_000 });
  const ChannelIcon = conversation.channel === "whatsapp" ? MessageCircleIcon : GlobeIcon;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={cn(
        "hover:bg-muted/60 flex w-full flex-col gap-1 border-b px-4 py-3 text-start transition-colors",
        active && "bg-secondary/60",
      )}
    >
      <div className="flex items-center gap-2">
        <ChannelIcon className="text-muted-foreground size-3.5 shrink-0" aria-label={t(`channel.${conversation.channel}`)} />
        <span className="min-w-0 flex-1 truncate text-sm font-medium" dir="auto">
          {customerLabel(conversation, t("anonymous"))}
        </span>
        <time className="text-muted-foreground shrink-0 text-[11px]" dateTime={conversation.updated_at}>
          {format.relativeTime(new Date(conversation.updated_at), now)}
        </time>
      </div>
      {conversation.ai_summary && conversation.status !== "AI_ACTIVE" ? (
        <p className="text-muted-foreground line-clamp-2 text-xs" dir="auto">
          {summaryLines(conversation.ai_summary)[0]}
        </p>
      ) : null}
      <span className="text-muted-foreground text-[11px]">{conversation.bot_name}</span>
    </button>
  );
}

function customerLabel(conversation: ConversationRow, anonymous: string) {
  if (conversation.customer_name) return conversation.customer_name;
  return conversation.channel === "whatsapp" ? `+${conversation.customer_identifier}` : anonymous;
}

function ConversationView({
  conversation,
  messages,
  onBack,
  onMessageSent,
  onChanged,
}: {
  conversation: InboxConversation;
  messages: MessageRow[];
  onBack: () => void;
  onMessageSent: (message: MessageRow) => void;
  onChanged: () => void;
}) {
  const t = useTranslations("inbox");
  const root = useTranslations();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const isHumanOwned = conversation.status === "HUMAN_ACTIVE" || conversation.status === "HUMAN_PENDING";

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  const run = (action: (id: string) => Promise<{ ok: boolean } | undefined>) =>
    startTransition(async () => {
      const result = await action(conversation.id);
      if (!result?.ok) toast.error(root("common.genericError"));
      onChanged();
    });

  const submitReply = () => {
    const text = draft.trim();
    if (!text) return;
    startTransition(async () => {
      const result = await sendAgentReply(conversation.id, text);
      if (!result.ok) {
        toast.error(root(result.error));
        return;
      }
      setDraft("");
      onMessageSent(result.message);
      if (result.warning) toast.warning(root(result.warning));
      onChanged();
    });
  };

  return (
    <>
      <header className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack} aria-label={root("common.back")}>
          <ArrowLeftIcon className="rtl:-scale-x-100" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold" dir="auto">
            {customerLabel(conversation, t("anonymous"))}
          </p>
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
            <span>{t(`channel.${conversation.channel}`)}</span>
            <span aria-hidden>·</span>
            <span>{conversation.bot_name}</span>
            <Badge variant={STATUS_BADGE[conversation.status]}>{t(`status.${conversation.status}`)}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {conversation.status === "HUMAN_PENDING" || conversation.status === "AI_ACTIVE" ? (
            <Button size="sm" disabled={pending} onClick={() => run(takeOverConversation)}>
              <HandIcon aria-hidden />
              {t("takeOver")}
            </Button>
          ) : null}
          {isHumanOwned ? (
            <Button size="sm" variant="outline" disabled={pending} onClick={() => run(handBackToAI)}>
              <UndoIcon aria-hidden className="rtl:-scale-x-100" />
              {t("handBack")}
            </Button>
          ) : null}
          {conversation.status !== "RESOLVED" ? (
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(resolveConversation)}>
              <CheckCheckIcon aria-hidden />
              {t("resolve")}
            </Button>
          ) : null}
        </div>
      </header>

      {conversation.ai_summary && conversation.status !== "AI_ACTIVE" ? (
        <div className="bg-accent/60 border-b px-4 py-3 text-sm">
          <p className="text-accent-foreground flex items-center gap-1.5 text-xs font-semibold">
            <SparklesIcon className="size-3.5" aria-hidden />
            {t("aiSummary")}
          </p>
          {summaryLines(conversation.ai_summary).map((line, i) => (
            <p key={i} className="mt-1" dir="auto">
              {line}
            </p>
          ))}
          {conversation.handoff_reason ? (
            <p className="text-muted-foreground mt-2 text-xs">
              {t("handoffReason")}:{" "}
              {parseHandoffReason(conversation.handoff_reason)
                .map(({ trigger, detail }) => t(`triggers.${trigger}`, { detail: detail ? `\u2066${detail}\u2069` : "" }))
                .join(" · ")}
            </p>
          ) : null}
        </div>
      ) : null}

      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>

      {conversation.status !== "RESOLVED" ? (
        <form
          className="flex items-end gap-2 border-t p-3"
          onSubmit={(event) => {
            event.preventDefault();
            submitReply();
          }}
        >
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                submitReply();
              }
            }}
            rows={1}
            maxLength={4000}
            dir="auto"
            placeholder={conversation.status === "HUMAN_ACTIVE" ? t("replyPlaceholder") : t("takeOverToReply")}
            aria-label={t("replyPlaceholder")}
            className="max-h-40 min-h-10 flex-1 resize-none"
          />
          <Button type="submit" disabled={pending || !draft.trim()} aria-label={t("send")}>
            <SendIcon aria-hidden className="rtl:-scale-x-100" />
            <span className="hidden sm:inline">{t("send")}</span>
          </Button>
        </form>
      ) : null}
    </>
  );
}

function MessageBubble({ message }: { message: MessageRow }) {
  const t = useTranslations("inbox");
  const format = useFormatter();
  const fromCustomer = message.sender_type === "customer";

  return (
    <div className={cn("flex flex-col gap-1", fromCustomer ? "items-start" : "items-end")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap",
          fromCustomer && "bg-muted rounded-ss-sm",
          message.sender_type === "ai" && "bg-secondary text-secondary-foreground rounded-se-sm",
          message.sender_type === "human_agent" && "bg-primary text-primary-foreground rounded-se-sm",
        )}
      >
        {message.input_type === "voice_note" ? <VoiceNote messageId={message.id} /> : null}
        <span dir="auto">{message.content_text}</span>
      </div>
      <div className="text-muted-foreground flex items-center gap-1.5 px-1 text-[11px]">
        {message.sender_type === "ai" ? <BotIcon className="size-3" aria-hidden /> : null}
        <span>{t(`sender.${message.sender_type}`)}</span>
        <span aria-hidden>·</span>
        <time dateTime={message.created_at}>{format.dateTime(new Date(message.created_at), { timeStyle: "short" })}</time>
        {message.confidence_score !== null ? (
          <>
            <span aria-hidden>·</span>
            <span>{t("confidence", { value: format.number(Number(message.confidence_score), { style: "percent" }) })}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}

function VoiceNote({ messageId }: { messageId: string }) {
  const t = useTranslations("inbox");
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (url) {
    return <audio controls autoPlay src={url} className="mb-2 h-9 w-60 max-w-full" />;
  }
  return (
    <button
      type="button"
      disabled={loading}
      className="mb-1 flex items-center gap-1.5 text-xs font-medium opacity-80 hover:opacity-100"
      onClick={async () => {
        setLoading(true);
        setUrl(await getVoiceNoteUrl(messageId));
        setLoading(false);
      }}
    >
      <MicIcon className="size-3.5" aria-hidden />
      {t("voiceNote")}
      <PlayIcon className="size-3" aria-hidden />
    </button>
  );
}
