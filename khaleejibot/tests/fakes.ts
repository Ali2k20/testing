import type { AiTurn } from "@/lib/ai/schema";
import type {
  AgentNotification,
  EngineAI,
  EngineBot,
  EngineDeps,
  EngineRepository,
  NewMessage,
} from "@/lib/ai/engine";
import type { ConversationRow, ConversationStatus, KnowledgeMatch, MessageRow } from "@/lib/supabase/database.types";

export const BOT: EngineBot = {
  id: "11111111-1111-4111-8111-111111111111",
  org_id: "22222222-2222-4222-8222-222222222222",
  name: "Fanar Concierge",
  dialect_persona: "emirati_khaleeji",
  system_instructions: "Family restaurant in Al Barsha.",
  confidence_threshold: 0.75,
  handoff_message_ar: "لحظات، بحوّلك لواحد من الفريق",
  handoff_message_en: "One moment, connecting you to our team",
};

export const MENU: KnowledgeMatch[] = [
  { id: "k1", source_name: "menu.md", content: "Machboos laham — AED 65", similarity: 0.82 },
];

export function turn(overrides: Partial<AiTurn> = {}): AiTurn {
  return {
    reply_text: "هلا والله! المچبوس لحم بـ ٦٥ درهم.",
    detected_language_or_dialect: "emirati_khaleeji",
    confidence_score: 0.92,
    user_frustration_detected: false,
    requires_human_handoff: false,
    handoff_summary_for_agent: null,
    ...overrides,
  };
}

let sequence = 0;
const nextId = () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}`;

/** In-memory implementation of everything the engine touches. */
export function createFakeDeps(options: {
  status?: ConversationStatus;
  turn?: AiTurn | Error;
  transcript?: string | Error;
  knowledge?: KnowledgeMatch[] | Error;
  bot?: EngineBot | null;
} = {}) {
  const conversations = new Map<string, ConversationRow>();
  const messages: MessageRow[] = [];
  const notifications: AgentNotification[] = [];
  const voiceNotes: string[] = [];
  const calls = { transcribe: 0, embed: 0, generateTurn: 0, matchKnowledge: 0 };
  const generateInputs: Parameters<EngineAI["generateTurn"]>[0][] = [];
  /** Lets a test change state while the "model" is thinking. */
  const hooks: { duringGenerate?: () => void } = {};

  const repo: EngineRepository = {
    async getBot(id) {
      const bot = options.bot === undefined ? BOT : options.bot;
      return bot && bot.id === id ? bot : null;
    },
    async messageExists(externalId) {
      return messages.some((m) => m.external_id === externalId);
    },
    async findOrCreateOpenConversation({ botId, channel, customerIdentifier, customerName }) {
      const open = [...conversations.values()].find(
        (c) => c.bot_id === botId && c.channel === channel && c.customer_identifier === customerIdentifier && c.status !== "RESOLVED",
      );
      if (open) return open;
      const now = new Date().toISOString();
      const row: ConversationRow = {
        id: nextId(),
        bot_id: botId,
        channel,
        customer_identifier: customerIdentifier,
        customer_name: customerName,
        status: options.status ?? "AI_ACTIVE",
        handoff_reason: null,
        ai_summary: null,
        assigned_agent_id: null,
        created_at: now,
        updated_at: now,
      };
      conversations.set(row.id, row);
      return row;
    },
    async saveVoiceNote({ orgId, conversationId }) {
      const path = `${orgId}/${conversationId}/${nextId()}.ogg`;
      voiceNotes.push(path);
      return path;
    },
    async insertMessage(message: NewMessage) {
      if (message.external_id && messages.some((m) => m.external_id === message.external_id)) return null;
      const row: MessageRow = {
        id: nextId(),
        audio_url: null,
        confidence_score: null,
        external_id: null,
        sender_user_id: null,
        created_at: new Date(Date.now() + messages.length).toISOString(),
        ...message,
      };
      messages.push(row);
      return row;
    },
    async getRecentMessages(conversationId, limit) {
      return messages.filter((m) => m.conversation_id === conversationId).slice(-limit);
    },
    async getConversationStatus(conversationId) {
      return conversations.get(conversationId)?.status ?? null;
    },
    async matchKnowledge(_botId, _embedding, count) {
      calls.matchKnowledge += 1;
      if (options.knowledge instanceof Error) throw options.knowledge;
      return (options.knowledge ?? MENU).slice(0, count);
    },
    async markHandoff(conversationId, { reason, summary }) {
      const row = conversations.get(conversationId);
      if (!row || row.status !== "AI_ACTIVE") return null;
      const updated = { ...row, status: "HUMAN_PENDING" as const, handoff_reason: reason, ai_summary: summary };
      conversations.set(conversationId, updated);
      return updated;
    },
  };

  const ai: EngineAI = {
    async transcribe() {
      calls.transcribe += 1;
      if (options.transcript instanceof Error) throw options.transcript;
      return options.transcript ?? "شو عندكم اليوم؟";
    },
    async embed() {
      calls.embed += 1;
      return [0.1, 0.2, 0.3];
    },
    async generateTurn(input) {
      calls.generateTurn += 1;
      generateInputs.push(input);
      hooks.duringGenerate?.();
      if (options.turn instanceof Error) throw options.turn;
      return options.turn ?? turn();
    },
  };

  const deps: EngineDeps = {
    repo,
    ai,
    notifier: {
      async notifyAgents(event) {
        notifications.push(event);
      },
    },
    logger: { warn: () => {}, error: () => {} },
  };

  return { deps, conversations, messages, notifications, voiceNotes, calls, generateInputs, hooks };
}
