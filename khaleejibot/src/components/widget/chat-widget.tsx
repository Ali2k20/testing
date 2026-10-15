"use client";

import { MicIcon, SendIcon, SquareIcon, UsersIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { LogoMark } from "@/components/logo";
import { useVoiceRecorder } from "@/components/widget/use-voice-recorder";
import { Button } from "@/components/ui/button";
import type { ConversationStatus } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";
import type { WidgetMessage, WidgetMessagesResponse } from "@/lib/widget";

const HUMAN_STATUSES: ConversationStatus[] = ["HUMAN_PENDING", "HUMAN_ACTIVE"];
const POLL_MS = 4000;

type DisplayMessage = WidgetMessage & { pending?: boolean };

function getVisitorId(botId: string): string {
  const key = `khaleejibot:visitor:${botId}`;
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    window.localStorage.setItem(key, fresh);
    return fresh;
  } catch {
    // Storage blocked (private mode, third-party iframe rules): session-only id.
    return crypto.randomUUID();
  }
}

function mergeMessages(current: DisplayMessage[], incoming: WidgetMessage[]): DisplayMessage[] {
  const byId = new Map(current.filter((m) => !m.pending).map((m) => [m.id, m]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function ChatWidget({
  botId,
  botName,
  welcome,
  embedded,
}: {
  botId: string;
  botName: string;
  welcome: string;
  embedded: boolean;
}) {
  const t = useTranslations("widget");
  const visitorRef = useRef<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [status, setStatus] = useState<ConversationStatus>("AI_ACTIVE");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const endpoint = `/api/widget/${botId}/messages`;

  // Read lazily (browser only) so the server render and hydration agree.
  const visitorId = useCallback(() => (visitorRef.current ??= getVisitorId(botId)), [botId]);

  const lastTimestamp = messages.filter((m) => !m.pending).at(-1)?.created_at;

  const fetchMessages = useCallback(
    async (after?: string): Promise<WidgetMessagesResponse | null> => {
      const params = new URLSearchParams({ visitorId: visitorId() });
      if (after) params.set("after", after);
      const response = await fetch(`${endpoint}?${params}`, { cache: "no-store" });
      return response.ok ? ((await response.json()) as WidgetMessagesResponse) : null;
    },
    [endpoint, visitorId],
  );

  const apply = useCallback((data: WidgetMessagesResponse | null) => {
    if (!data) return;
    setStatus(data.status);
    if (data.messages.length) setMessages((current) => mergeMessages(current, data.messages));
  }, []);

  // Restore this visitor's conversation history.
  useEffect(() => {
    fetchMessages().then(apply, () => {});
  }, [fetchMessages, apply]);

  // While a human owns the conversation, poll for agent replies.
  useEffect(() => {
    if (!HUMAN_STATUSES.includes(status)) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") fetchMessages(lastTimestamp).then(apply, () => {});
    }, POLL_MS);
    return () => clearInterval(id);
  }, [status, fetchMessages, apply, lastTimestamp]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = useCallback(
    async (payload: { text: string } | { audio: Blob }) => {
      if (sending) return;
      setSending(true);
      setError(null);

      const optimistic: DisplayMessage = {
        id: `pending-${Date.now()}`,
        sender_type: "customer",
        input_type: "text" in payload ? "text" : "voice_note",
        content_text: "text" in payload ? payload.text : "",
        created_at: new Date().toISOString(),
        pending: true,
      };
      setMessages((current) => [...current, optimistic]);

      try {
        let response: Response;
        if ("text" in payload) {
          response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ visitorId: visitorId(), text: payload.text }),
          });
        } else {
          const form = new FormData();
          form.set("visitorId", visitorId());
          const extension = payload.audio.type.includes("mp4") ? "m4a" : payload.audio.type.includes("ogg") ? "ogg" : "webm";
          form.set("audio", payload.audio, `voice-note.${extension}`);
          response = await fetch(endpoint, { method: "POST", body: form });
        }

        if (!response.ok) {
          setError(response.status === 429 ? t("rateLimited") : t("error"));
          setMessages((current) => current.filter((m) => m.id !== optimistic.id));
          return;
        }
        const data = (await response.json()) as WidgetMessagesResponse;
        setStatus(data.status);
        setMessages((current) => mergeMessages(current, data.messages));
      } catch {
        setError(t("error"));
        setMessages((current) => current.filter((m) => m.id !== optimistic.id));
      } finally {
        setSending(false);
      }
    },
    [endpoint, sending, t, visitorId],
  );

  const banner =
    status === "HUMAN_PENDING" ? t("handoffBanner") : status === "HUMAN_ACTIVE" ? t("agentBanner") : status === "RESOLVED" ? t("resolvedBanner") : null;
  const awaitingAi = sending && !HUMAN_STATUSES.includes(status);

  return (
    <div className="flex h-full flex-col">
      <header className="bg-primary text-primary-foreground flex items-center gap-3 px-4 py-3">
        <LogoMark className="size-9 [&_rect]:fill-primary-foreground/15" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{botName}</p>
          <p className="text-primary-foreground/75 text-xs">{t("poweredBy")}</p>
        </div>
        {embedded ? (
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            aria-label="Close"
            onClick={() => window.parent.postMessage({ type: "khaleejibot:close" }, "*")}
          >
            <XIcon />
          </Button>
        ) : null}
      </header>

      {banner ? (
        <div role="status" className="bg-accent text-accent-foreground flex items-center gap-2 px-4 py-2 text-xs font-medium">
          <UsersIcon className="size-4 shrink-0" aria-hidden />
          {banner}
        </div>
      ) : null}

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
        <Bubble side="start" text={welcome} />
        {messages.map((message) => (
          <Bubble
            key={message.id}
            side={message.sender_type === "customer" ? "end" : "start"}
            text={message.content_text}
            voice={message.input_type === "voice_note"}
            voiceLabel={t("voiceNote")}
            agent={message.sender_type === "human_agent"}
            pending={message.pending}
          />
        ))}
        {awaitingAi ? (
          <div className="text-muted-foreground flex items-center gap-2 text-xs" aria-label={t("thinking")}>
            <span className="flex gap-1" aria-hidden>
              <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:-0.3s]" />
              <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:-0.15s]" />
              <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full" />
            </span>
            {t("thinking")}
          </div>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-destructive px-4 pb-2 text-xs">
          {error}
        </p>
      ) : null}

      <Composer
        disabled={sending}
        draft={draft}
        setDraft={setDraft}
        onSendText={(text) => {
          setDraft("");
          void send({ text });
        }}
        onSendAudio={(audio) => void send({ audio })}
        onMicError={() => setError(t("micDenied"))}
      />
    </div>
  );
}

function Bubble({
  side,
  text,
  voice,
  voiceLabel,
  agent,
  pending,
}: {
  side: "start" | "end";
  text: string;
  voice?: boolean;
  voiceLabel?: string;
  agent?: boolean;
  pending?: boolean;
}) {
  return (
    <div className={cn("flex", side === "end" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap shadow-xs",
          side === "end"
            ? "bg-primary text-primary-foreground rounded-ee-sm"
            : agent
              ? "bg-accent text-accent-foreground rounded-es-sm"
              : "bg-muted rounded-es-sm",
          pending && "opacity-60",
        )}
        dir="auto"
      >
        {voice ? (
          <span className="mb-0.5 flex items-center gap-1 text-xs font-medium opacity-80">
            <MicIcon className="size-3" aria-hidden />
            {voiceLabel}
          </span>
        ) : null}
        {text || (voice ? "…" : "")}
      </div>
    </div>
  );
}

function Composer({
  disabled,
  draft,
  setDraft,
  onSendText,
  onSendAudio,
  onMicError,
}: {
  disabled: boolean;
  draft: string;
  setDraft: (value: string) => void;
  onSendText: (text: string) => void;
  onSendAudio: (audio: Blob) => void;
  onMicError: () => void;
}) {
  const t = useTranslations("widget");
  const recorder = useVoiceRecorderWithErrors(onSendAudio, onMicError);

  if (recorder.state === "recording") {
    const mm = Math.floor(recorder.seconds / 60);
    const ss = String(recorder.seconds % 60).padStart(2, "0");
    return (
      <div className="flex items-center gap-2 border-t p-3">
        <Button variant="ghost" size="icon" aria-label={t("cancelRecording")} onClick={() => recorder.stop(false)}>
          <XIcon />
        </Button>
        <div className="flex flex-1 items-center gap-2 text-sm" role="status">
          <span className="bg-destructive size-2.5 animate-pulse rounded-full" aria-hidden />
          {t("recording")}
          <span className="text-muted-foreground font-mono tabular-nums" dir="ltr">
            {mm}:{ss}
          </span>
        </div>
        <Button size="icon" aria-label={t("stopRecording")} onClick={() => recorder.stop(true)}>
          <SquareIcon className="fill-current" />
        </Button>
      </div>
    );
  }

  return (
    <form
      className="flex items-end gap-2 border-t p-3"
      onSubmit={(event) => {
        event.preventDefault();
        const text = draft.trim();
        if (text) onSendText(text);
      }}
    >
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
        rows={1}
        maxLength={2000}
        dir="auto"
        placeholder={t("placeholder")}
        aria-label={t("placeholder")}
        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 max-h-32 min-h-9 flex-1 resize-none rounded-2xl border bg-transparent px-3.5 py-2 text-sm outline-none field-sizing-content focus-visible:ring-[3px]"
      />
      {draft.trim() ? (
        <Button type="submit" size="icon" className="rounded-full" disabled={disabled} aria-label={t("send")}>
          <SendIcon className="rtl:-scale-x-100" />
        </Button>
      ) : (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="rounded-full"
          disabled={disabled}
          aria-label={t("record")}
          onClick={() => void recorder.start()}
        >
          <MicIcon />
        </Button>
      )}
    </form>
  );
}

function useVoiceRecorderWithErrors(onSendAudio: (audio: Blob) => void, onMicError: () => void) {
  const recorder = useVoiceRecorder(onSendAudio);
  useEffect(() => {
    if (recorder.state === "denied" || recorder.state === "unsupported") onMicError();
  }, [recorder.state, onMicError]);
  return recorder;
}
