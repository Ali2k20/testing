import "server-only";

import { z } from "zod";

/**
 * Server environment, validated lazily on first use so `next build` works
 * without secrets and a misconfiguration fails loudly with the variable name.
 */
const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),

  // 32-byte key, base64 encoded: `openssl rand -base64 32`
  ENCRYPTION_KEY: z.string().refine((v) => Buffer.from(v, "base64").length === 32, {
    message: "must be 32 bytes, base64 encoded (openssl rand -base64 32)",
  }),

  AI_CHAT_PROVIDER: z.enum(["google", "openai"]).default("google"),
  AI_CHAT_MODEL: z.string().optional(),
  AI_TRANSCRIPTION_PROVIDER: z.enum(["groq", "openai"]).default("groq"),
  AI_TRANSCRIPTION_MODEL: z.string().optional(),
  AI_EMBEDDING_PROVIDER: z.enum(["openai", "google"]).default("openai"),
  AI_EMBEDDING_MODEL: z.string().optional(),

  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),

  WHATSAPP_VERIFY_TOKEN: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  WHATSAPP_GRAPH_API_VERSION: z.string().default("v23.0"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid server environment:\n${problems}`);
  }
  cached = parsed.data;
  return cached;
}

export function requireKey(name: "OPENAI_API_KEY" | "GOOGLE_GENERATIVE_AI_API_KEY" | "GROQ_API_KEY"): string {
  const value = serverEnv()[name];
  if (!value) throw new Error(`${name} is required by the configured AI provider`);
  return value;
}
