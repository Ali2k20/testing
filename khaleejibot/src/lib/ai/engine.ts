import type { ModelMessage } from "ai";

import type {
  BotRow,
  ChannelType,
  ConversationRow,
  ConversationStatus,
  KnowledgeMatch,
  MessageRow,
} from "@/lib/supabase/database.types";

import {
  describeHandoffReason,
  evaluateHandoff,
  pickReplyLanguage,
  type HandoffTrigger,
} from "./handoff";
import { buildConversationMessages, buildInstructions } from "./prompts";
import type { AiTurn } from "./schema";

/**
 * KhaleejiBot message engine.
 *
 * One entry point for every channel. For each inbound customer message it:
 *   1. finds (or opens) the customer's conversation;
 *   2. stores voice notes and transcribes them (Whisper);
 *   3. saves the customer message;
 *   4. if a human owns the conversation (HUMAN_PENDING / HUMAN_ACTIVE) it stops
 *      here — the AI never replies — and notifies the agent inbox;
 *   5. otherwise retrieves the top-5 knowledge chunks (pgvector), asks the LLM
 *      for a strictly-typed turn, applies the handoff policy, and saves either
 *      the AI reply or the handoff message.
 *
 * All I/O is injected (EngineDeps) so the policy is unit-tested without a
 * database or model; src/lib/ai/engine-deps.ts wires the production versions.
 */

export const HUMAN_OWNED_STATUSES: readonly ConversationStatus[] = ["HUMAN_PENDING", "HUMAN_ACTIVE"];
export const KNOWLEDGE_MATCH_COUNT = 5;
const HISTORY_LIMIT = 12;

export type AudioInput = {
  data: Uint8Array;
  /** e.g. audio/ogg (WhatsApp), audio/webm (Chrome/Firefox widget), audio/mp4 (Safari widget) */
  mediaType: string;
};

export type IncomingMessage = {
  botId: string;
  channel: ChannelType;
  customerIdentifier: string;
  customerName?: string | null;
  /** Provider message id (WhatsApp wamid). Used to drop webhook retries. */
  externalId?: string | null;
  text?: string | null;
  audio?: AudioInput | null;
};

export type EngineBot = Pick<
  BotRow,
  | "id"
  | "org_id"
  | "name"
  | "dialect_persona"
  | "system_instructions"
  | "confidence_threshold"
  | "handoff_message_ar"
  | "handoff_message_en"
>;

export type NewMessage = Pick<MessageRow, "conversation_id" | "sender_type" | "input_type" | "content_text"> &
  Partial<Pick<MessageRow, "audio_url" | "confidence_score" | "external_id">>;

export interface EngineRepository {
  getBot(botId: string): Promise<EngineBot | null>;
  messageExists(externalId: string): Promise<boolean>;
  /** Returns the customer's open conversation, creating it if needed (race-safe). */
  findOrCreateOpenConversation(params: {
    botId: string;
    channel: ChannelType;
    customerIdentifier: string;
    customerName: string | null;
  }): Promise<ConversationRow>;
  /** Stores audio privately and returns its storage path. */
  saveVoiceNote(params: { orgId: string; conversationId: string; audio: AudioInput }): Promise<string>;
  /** Returns null when the external_id was already stored (concurrent retry). */
  insertMessage(message: NewMessage): Promise<MessageRow | null>;
  getRecentMessages(conversationId: string, limit: number): Promise<MessageRow[]>;
  getConversationStatus(conversationId: string): Promise<ConversationStatus | null>;
  matchKnowledge(botId: string, embedding: number[], count: number): Promise<KnowledgeMatch[]>;
  /**
   * AI_ACTIVE → HUMAN_PENDING, only if still AI_ACTIVE. Returns the updated
   * conversation, or null if someone else changed the status first.
   */
  markHandoff(conversationId: string, params: { reason: string; summary: string }): Promise<ConversationRow | null>;
}

export interface EngineAI {
  transcribe(audio: AudioInput): Promise<string>;
  embed(text: string): Promise<number[]>;
  generateTurn(params: { instructions: string; messages: ModelMessage[] }): Promise<AiTurn>;
}

export type AgentNotification = {
  type: "customer_message" | "handoff" | "ai_reply";
  orgId: string;
  botId: string;
  conversationId: string;
};

export interface EngineNotifier {
  notifyAgents(event: AgentNotification): Promise<void>;
}

export interface EngineLogger {
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export type EngineDeps = {
  repo: EngineRepository;
  ai: EngineAI;
  notifier: EngineNotifier;
  logger?: EngineLogger;
};

export type EngineOutcome =
  /** Webhook retry for a message we already processed. */
  | "duplicate"
  /** A human owns the conversation; the message was saved and agents notified. */
  | "human_owned"
  /** The AI answered. */
  | "ai_replied"
  /** The AI handed off; `reply` is the bot's handoff message. */
  | "handed_off"
  /** An agent took over while the model was thinking; the AI reply was discarded. */
  | "superseded";

export type EngineResult = {
  outcome: EngineOutcome;
  conversation: ConversationRow | null;
  customerMessage: MessageRow | null;
  /** The message to deliver to the customer on their channel, if any. */
  reply: MessageRow | null;
  turn: AiTurn | null;
  handoffTriggers: HandoffTrigger[];
};

export class EngineError extends Error {
  constructor(
    readonly code: "bot_not_found" | "empty_message",
    message: string,
  ) {
    super(message);
    this.name = "EngineError";
  }
}

const VOICE_NOTE_UNREADABLE = {
  ar: "آسفين، ما قدرنا نسمع الرسالة الصوتية زين. ممكن تكتب لنا طلبك؟",
  en: "Sorry, we couldn't make out that voice note. Could you type your message instead?",
};

const consoleLogger: EngineLogger = {
  warn: (message, context) => console.warn(`[engine] ${message}`, context ?? ""),
  error: (message, context) => console.error(`[engine] ${message}`, context ?? ""),
};

export async function processIncomingMessage(input: IncomingMessage, deps: EngineDeps): Promise<EngineResult> {
  const { repo, ai, notifier } = deps;
  const log = deps.logger ?? consoleLogger;

  const text = input.text?.trim() ?? "";
  if (!text && !input.audio) {
    throw new EngineError("empty_message", "A message needs text or audio");
  }

  const bot = await repo.getBot(input.botId);
  if (!bot) throw new EngineError("bot_not_found", `Bot ${input.botId} not found`);

  // Cheap idempotency check before any paid work (transcription, LLM). The
  // unique index on messages.external_id is the real guarantee.
  if (input.externalId && (await repo.messageExists(input.externalId))) {
    return emptyResult("duplicate");
  }

  const conversation = await repo.findOrCreateOpenConversation({
    botId: bot.id,
    channel: input.channel,
    customerIdentifier: input.customerIdentifier,
    customerName: input.customerName?.trim() || null,
  });

  // ── Voice notes: keep the original audio, transcribe to text ─────────────
  // Transcription runs for human-owned conversations too, so agents can read
  // voice notes; it is speech-to-text only and never produces a reply.
  let contentText = text;
  let audioPath: string | null = null;
  let transcriptionFailed = false;
  if (input.audio) {
    audioPath = await repo.saveVoiceNote({ orgId: bot.org_id, conversationId: conversation.id, audio: input.audio });
    try {
      const transcript = (await ai.transcribe(input.audio)).trim();
      contentText = [transcript, text].filter(Boolean).join("\n");
      transcriptionFailed = transcript.length === 0;
    } catch (error) {
      transcriptionFailed = true;
      log.error("voice note transcription failed", { conversationId: conversation.id, error: String(error) });
    }
  }

  const customerMessage = await repo.insertMessage({
    conversation_id: conversation.id,
    sender_type: "customer",
    input_type: input.audio ? "voice_note" : "text",
    content_text: contentText,
    audio_url: audioPath,
    external_id: input.externalId ?? null,
  });
  if (!customerMessage) return { ...emptyResult("duplicate"), conversation };

  const notify = (type: AgentNotification["type"]) =>
    notifier
      .notifyAgents({ type, orgId: bot.org_id, botId: bot.id, conversationId: conversation.id })
      .catch((error) => log.warn("agent notification failed", { conversationId: conversation.id, error: String(error) }));

  // ── CRITICAL: a human owns this conversation → the AI stays silent ──────
  if (HUMAN_OWNED_STATUSES.includes(conversation.status)) {
    await notify("customer_message");
    return {
      outcome: "human_owned",
      conversation,
      customerMessage,
      reply: null,
      turn: null,
      handoffTriggers: [],
    };
  }

  // A voice note we could not understand: ask the customer to type instead of
  // letting the model answer an empty message.
  // With no transcript there is no language signal, so the reply is bilingual.
  if (transcriptionFailed && !text) {
    const reply = await insertIfStillAiActive(repo, conversation.id, {
      conversation_id: conversation.id,
      sender_type: "ai",
      input_type: "text",
      content_text: `${VOICE_NOTE_UNREADABLE.ar}\n${VOICE_NOTE_UNREADABLE.en}`,
    });
    if (reply) await notify("ai_reply");
    return {
      outcome: reply ? "ai_replied" : "superseded",
      conversation,
      customerMessage,
      reply,
      turn: null,
      handoffTriggers: [],
    };
  }

  // ── RAG: top-5 business knowledge chunks for this message ───────────────
  let knowledge: KnowledgeMatch[] = [];
  try {
    const embedding = await ai.embed(contentText);
    knowledge = await repo.matchKnowledge(bot.id, embedding, KNOWLEDGE_MATCH_COUNT);
  } catch (error) {
    // Without knowledge the model is instructed to hand off rather than guess.
    log.error("knowledge retrieval failed", { botId: bot.id, error: String(error) });
  }

  // ── Structured LLM turn ────────────────────────────────────────────────
  const history = await repo.getRecentMessages(conversation.id, HISTORY_LIMIT);
  let turn: AiTurn | null = null;
  try {
    turn = await ai.generateTurn({
      instructions: buildInstructions(bot, knowledge),
      messages: buildConversationMessages(history),
    });
  } catch (error) {
    // Fail safe: if the model is down or returns an invalid object, a human takes over.
    log.error("LLM turn failed; handing off", { conversationId: conversation.id, error: String(error) });
  }

  const threshold = Number(bot.confidence_threshold);
  const decision = evaluateHandoff(turn, threshold, contentText);

  if (decision.handoff) {
    const language = pickReplyLanguage(turn?.detected_language_or_dialect ?? null, contentText);
    const summary =
      turn?.handoff_summary_for_agent?.trim() ||
      `العميل كتب: «${truncate(contentText, 160)}»\nCustomer wrote: "${truncate(contentText, 160)}"`;

    const handedOff = await repo.markHandoff(conversation.id, {
      reason: describeHandoffReason(decision.triggers, turn, threshold),
      summary,
    });
    if (!handedOff) {
      // An agent already took the conversation (or it was resolved) meanwhile.
      return { outcome: "superseded", conversation, customerMessage, reply: null, turn, handoffTriggers: decision.triggers };
    }

    const reply = await repo.insertMessage({
      conversation_id: conversation.id,
      sender_type: "ai",
      input_type: "text",
      content_text: language === "ar" ? bot.handoff_message_ar : bot.handoff_message_en,
      confidence_score: turn ? clamp01(turn.confidence_score) : null,
    });
    await notify("handoff");
    return {
      outcome: "handed_off",
      conversation: handedOff,
      customerMessage,
      reply,
      turn,
      handoffTriggers: decision.triggers,
    };
  }

  // turn is non-null here: a null turn always triggers "ai_unavailable".
  const reply = await insertIfStillAiActive(repo, conversation.id, {
    conversation_id: conversation.id,
    sender_type: "ai",
    input_type: "text",
    content_text: turn!.reply_text.trim(),
    confidence_score: clamp01(turn!.confidence_score),
  });
  if (!reply) {
    return { outcome: "superseded", conversation, customerMessage, reply: null, turn, handoffTriggers: [] };
  }
  await notify("ai_reply");
  return { outcome: "ai_replied", conversation, customerMessage, reply, turn, handoffTriggers: [] };
}

/** Agents can take over while the model is generating; never talk over them. */
async function insertIfStillAiActive(repo: EngineRepository, conversationId: string, message: NewMessage) {
  const status = await repo.getConversationStatus(conversationId);
  if (status !== "AI_ACTIVE") return null;
  return repo.insertMessage(message);
}

function emptyResult(outcome: EngineOutcome): EngineResult {
  return { outcome, conversation: null, customerMessage: null, reply: null, turn: null, handoffTriggers: [] };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Math.round(value * 1000) / 1000));
}

function truncate(value: string, max: number): string {
  const flat = value.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}
