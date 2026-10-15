import "server-only";

import { embedMany } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";

import { toPgVector } from "@/lib/ai/engine-deps";
import { EMBEDDING_DIMENSIONS, getEmbeddingModel } from "@/lib/ai/providers";
import type { Database } from "@/lib/supabase/database.types";

import { chunkText } from "./chunk";

export const MAX_SOURCE_CHARS = 200_000;
const MAX_CHUNKS_PER_SOURCE = 400;

/**
 * Chunks, embeds and stores one knowledge source for a bot, replacing any
 * previous version of the same source. Uses the caller's (RLS-bound) client so
 * only admins of the bot's organization can write.
 */
export async function ingestKnowledgeSource(
  db: SupabaseClient<Database>,
  params: { botId: string; sourceName: string; text: string },
): Promise<{ chunks: number }> {
  const sourceName = params.sourceName.trim().slice(0, 200);
  if (!sourceName) throw new Error("A source name is required");
  if (params.text.length > MAX_SOURCE_CHARS) {
    throw new Error(`Source is too large (max ${MAX_SOURCE_CHARS.toLocaleString()} characters)`);
  }

  const chunks = chunkText(params.text);
  if (chunks.length === 0) throw new Error("The source has no readable text");
  if (chunks.length > MAX_CHUNKS_PER_SOURCE) throw new Error("Source is too large — split it into smaller files");

  const { embeddings } = await embedMany({
    model: getEmbeddingModel(),
    values: chunks,
    dimensions: EMBEDDING_DIMENSIONS,
    maxParallelCalls: 4,
  });

  // Replace the previous version of this source.
  const { error: deleteError } = await db
    .from("knowledge_chunks")
    .delete()
    .eq("bot_id", params.botId)
    .eq("source_name", sourceName);
  if (deleteError) throw deleteError;

  const rows = chunks.map((content, i) => ({
    bot_id: params.botId,
    source_name: sourceName,
    content,
    embedding: toPgVector(embeddings[i]),
  }));
  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await db.from("knowledge_chunks").insert(rows.slice(i, i + 100));
    if (error) throw error;
  }
  return { chunks: rows.length };
}
