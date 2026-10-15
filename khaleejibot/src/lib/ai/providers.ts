import "server-only";

import { createGoogle } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import type { EmbeddingModel, LanguageModel, TranscriptionModel } from "ai";

import { requireKey, serverEnv } from "@/lib/env";

/**
 * Provider factory. Each capability is chosen independently through env vars,
 * so a deployment can e.g. reason with Gemini, transcribe on Groq and embed
 * with OpenAI. Adding a provider means adding one case per capability.
 */

export const EMBEDDING_DIMENSIONS = 1536;

const DEFAULT_CHAT_MODELS = { google: "gemini-2.5-flash", openai: "gpt-4o" } as const;
const DEFAULT_TRANSCRIPTION_MODELS = { groq: "whisper-large-v3-turbo", openai: "whisper-1" } as const;
const DEFAULT_EMBEDDING_MODELS = { openai: "text-embedding-3-small", google: "gemini-embedding-001" } as const;

export function getChatModel(): LanguageModel {
  const env = serverEnv();
  const modelId = env.AI_CHAT_MODEL ?? DEFAULT_CHAT_MODELS[env.AI_CHAT_PROVIDER];
  switch (env.AI_CHAT_PROVIDER) {
    case "google":
      return createGoogle({ apiKey: requireKey("GOOGLE_GENERATIVE_AI_API_KEY") })(modelId);
    case "openai":
      return createOpenAI({ apiKey: requireKey("OPENAI_API_KEY") })(modelId);
  }
}

export function getTranscriptionModel(): TranscriptionModel {
  const env = serverEnv();
  const modelId = env.AI_TRANSCRIPTION_MODEL ?? DEFAULT_TRANSCRIPTION_MODELS[env.AI_TRANSCRIPTION_PROVIDER];
  switch (env.AI_TRANSCRIPTION_PROVIDER) {
    case "groq":
      return createGroq({ apiKey: requireKey("GROQ_API_KEY") }).transcription(modelId);
    case "openai":
      return createOpenAI({ apiKey: requireKey("OPENAI_API_KEY") }).transcription(modelId);
  }
}

export function getEmbeddingModel(): EmbeddingModel {
  const env = serverEnv();
  const modelId = env.AI_EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODELS[env.AI_EMBEDDING_PROVIDER];
  switch (env.AI_EMBEDDING_PROVIDER) {
    case "openai":
      return createOpenAI({ apiKey: requireKey("OPENAI_API_KEY") }).embedding(modelId);
    case "google":
      return createGoogle({ apiKey: requireKey("GOOGLE_GENERATIVE_AI_API_KEY") }).embedding(modelId);
  }
}
