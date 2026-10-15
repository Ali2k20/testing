import "server-only";

import { embed, generateText, Output, transcribe } from "ai";

import { createAdminClient, type AdminClient } from "@/lib/supabase/admin";
import type { ConversationRow, MessageRow } from "@/lib/supabase/database.types";
import { inboxTopic, INBOX_EVENT } from "@/lib/realtime";

import type { AudioInput, EngineAI, EngineDeps, EngineNotifier, EngineRepository, NewMessage } from "./engine";
import { EMBEDDING_DIMENSIONS, getChatModel, getEmbeddingModel, getTranscriptionModel } from "./providers";
import { aiTurnSchema } from "./schema";

export const VOICE_NOTES_BUCKET = "voice-notes";

const UNIQUE_VIOLATION = "23505";

const AUDIO_EXTENSIONS: Record<string, string> = {
  "audio/ogg": "ogg",
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/aac": "aac",
  "audio/amr": "amr",
  "audio/wav": "wav",
};

/** "audio/ogg; codecs=opus" → "audio/ogg" */
export function baseMediaType(mediaType: string): string {
  return mediaType.split(";")[0].trim().toLowerCase();
}

export function createSupabaseRepository(db: AdminClient = createAdminClient()): EngineRepository {
  return {
    async getBot(botId) {
      const { data, error } = await db
        .from("bots")
        .select(
          "id, org_id, name, dialect_persona, system_instructions, confidence_threshold, handoff_message_ar, handoff_message_en",
        )
        .eq("id", botId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async messageExists(externalId) {
      const { count, error } = await db
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("external_id", externalId);
      if (error) throw error;
      return (count ?? 0) > 0;
    },

    async findOrCreateOpenConversation({ botId, channel, customerIdentifier, customerName }) {
      const findOpen = async () => {
        const { data, error } = await db
          .from("conversations")
          .select("*")
          .eq("bot_id", botId)
          .eq("channel", channel)
          .eq("customer_identifier", customerIdentifier)
          .neq("status", "RESOLVED")
          .maybeSingle();
        if (error) throw error;
        return data;
      };

      const existing = await findOpen();
      if (existing) {
        if (customerName && customerName !== existing.customer_name) {
          await db.from("conversations").update({ customer_name: customerName }).eq("id", existing.id);
          return { ...existing, customer_name: customerName };
        }
        return existing;
      }

      const { data, error } = await db
        .from("conversations")
        .insert({ bot_id: botId, channel, customer_identifier: customerIdentifier, customer_name: customerName })
        .select("*")
        .single();
      if (!error) return data;
      // Two messages from the same customer raced; the partial unique index
      // let only one insert win. Use the winner's row.
      if (error.code === UNIQUE_VIOLATION) {
        const winner = await findOpen();
        if (winner) return winner;
      }
      throw error;
    },

    async saveVoiceNote({ orgId, conversationId, audio }) {
      const mediaType = baseMediaType(audio.mediaType);
      const extension = AUDIO_EXTENSIONS[mediaType] ?? "bin";
      const path = `${orgId}/${conversationId}/${crypto.randomUUID()}.${extension}`;
      const { error } = await db.storage
        .from(VOICE_NOTES_BUCKET)
        .upload(path, audio.data, { contentType: mediaType, upsert: false });
      if (error) throw error;
      return path;
    },

    async insertMessage(message: NewMessage) {
      const { data, error } = await db.from("messages").insert(message).select("*").single();
      if (error?.code === UNIQUE_VIOLATION && message.external_id) return null;
      if (error) throw error;
      return data as MessageRow;
    },

    async getRecentMessages(conversationId, limit) {
      const { data, error } = await db
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).reverse();
    },

    async getConversationStatus(conversationId) {
      const { data, error } = await db.from("conversations").select("status").eq("id", conversationId).maybeSingle();
      if (error) throw error;
      return data?.status ?? null;
    },

    async matchKnowledge(botId, embedding, count) {
      const { data, error } = await db.rpc("match_knowledge_chunks", {
        query_embedding: toPgVector(embedding),
        filter_bot_id: botId,
        match_count: count,
      });
      if (error) throw error;
      return data ?? [];
    },

    async markHandoff(conversationId, { reason, summary }) {
      const { data, error } = await db
        .from("conversations")
        .update({ status: "HUMAN_PENDING", handoff_reason: reason, ai_summary: summary })
        .eq("id", conversationId)
        .eq("status", "AI_ACTIVE")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data as ConversationRow | null;
    },
  };
}

export function toPgVector(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export function createAIServices(): EngineAI {
  return {
    async transcribe(audio: AudioInput) {
      const result = await transcribe({
        model: getTranscriptionModel(),
        audio: audio.data,
        // A short domain prompt nudges Whisper towards Gulf Arabic spelling
        // and code-switched English instead of transliterating everything.
        providerOptions: {
          groq: { prompt: "محادثة خدمة عملاء باللهجة الإماراتية مع بعض الكلمات الإنجليزية." },
          openai: { prompt: "محادثة خدمة عملاء باللهجة الإماراتية مع بعض الكلمات الإنجليزية." },
        },
        abortSignal: AbortSignal.timeout(30_000),
      });
      return result.text;
    },

    async embed(text: string) {
      return embedText(text);
    },

    async generateTurn({ instructions, messages }) {
      const { output } = await generateText({
        model: getChatModel(),
        instructions,
        messages,
        output: Output.object({
          name: "customer_service_turn",
          description: "The assistant's reply plus confidence and handoff signals",
          schema: aiTurnSchema,
        }),
        temperature: 0.3,
        maxRetries: 2,
        abortSignal: AbortSignal.timeout(30_000),
      });
      return output;
    },
  };
}

export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: getEmbeddingModel(),
    value: text.slice(0, 8000),
    dimensions: EMBEDDING_DIMENSIONS,
    abortSignal: AbortSignal.timeout(15_000),
  });
  return embedding;
}

export function createRealtimeNotifier(db: AdminClient = createAdminClient()): EngineNotifier {
  return {
    async notifyAgents(event) {
      // Only ids travel over the broadcast channel; the inbox re-reads the
      // conversation through RLS, so no customer content leaks via Realtime.
      const channel = db.channel(inboxTopic(event.orgId), { config: { private: true } });
      try {
        const result = await channel.httpSend(INBOX_EVENT, {
          type: event.type,
          conversationId: event.conversationId,
          botId: event.botId,
        });
        if (!result.success) throw new Error(`Realtime broadcast failed: ${result.status} ${result.error}`);
      } finally {
        await db.removeChannel(channel);
      }
    },
  };
}

export function createEngineDeps(): EngineDeps {
  const db = createAdminClient();
  return {
    repo: createSupabaseRepository(db),
    ai: createAIServices(),
    notifier: createRealtimeNotifier(db),
  };
}
