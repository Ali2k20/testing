/**
 * End-to-end through the real schema: the engine's Supabase repository and the
 * dashboard's RLS-bound queries, via supabase-js → PostgREST → Postgres.
 * Started by scripts/test-integration.sh.
 */
import { execSync } from "node:child_process";
import { createHmac, randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

import { processIncomingMessage, type EngineAI, type EngineDeps } from "@/lib/ai/engine";
import { createSupabaseRepository, toPgVector } from "@/lib/ai/engine-deps";
import type { Database } from "@/lib/supabase/database.types";

import { turn } from "../fakes";

const REST_URL = process.env.INTEGRATION_REST_URL!;
const SECRET = process.env.INTEGRATION_JWT_SECRET!;
const PSQL = process.env.INTEGRATION_PSQL!;
const FAKE_SUPABASE = "http://supabase.test";

function jwt(claims: Record<string, unknown>): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const body = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ exp: Math.floor(Date.now() / 1000) + 3600, ...claims })}`;
  return `${body}.${createHmac("sha256", SECRET).update(body).digest("base64url")}`;
}

/** supabase-js against bare PostgREST (no /rest/v1 prefix) with a stub Storage API. */
function client(token: string) {
  return createClient<Database>(FAKE_SUPABASE, token, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        if (url.startsWith(`${FAKE_SUPABASE}/storage/v1/object/`)) {
          const key = url.slice(`${FAKE_SUPABASE}/storage/v1/object/`.length);
          uploads.push(key);
          return Response.json({ Key: key, Id: randomUUID() });
        }
        return fetch(url.replace(`${FAKE_SUPABASE}/rest/v1`, REST_URL), init);
      },
    },
  });
}

const uploads: string[] = [];
const sql = (statement: string) => execSync(`${PSQL} -v ON_ERROR_STOP=1`, { input: statement }).toString().trim();

const vec = (k: number) => Array.from({ length: 1536 }, (_, i) => (i === k ? 1 : 0));

const OWNER = randomUUID();
const AGENT = randomUUID();
const OUTSIDER = randomUUID();
const ORG = randomUUID();
const OTHER_ORG = randomUUID();
const BOT = randomUUID();

const admin = client(jwt({ role: "service_role" }));
const agentDb = client(jwt({ role: "authenticated", sub: AGENT }));
const outsiderDb = client(jwt({ role: "authenticated", sub: OUTSIDER }));

function fakeAI(overrides: Partial<EngineAI> = {}) {
  const calls = { generateTurn: 0, instructions: [] as string[] };
  const ai: EngineAI = {
    transcribe: async () => "شو أوقات الدوام؟",
    embed: async () => vec(1),
    generateTurn: async (input) => {
      calls.generateTurn += 1;
      calls.instructions.push(input.instructions);
      return turn();
    },
    ...overrides,
  };
  return { ai, calls };
}

function deps(ai: EngineAI): EngineDeps {
  return {
    repo: createSupabaseRepository(admin),
    ai,
    notifier: { notifyAgents: async () => {} },
    logger: { warn: () => {}, error: () => {} },
  };
}

beforeAll(() => {
  sql(`
    insert into auth.users (id, email) values
      ('${OWNER}', 'owner@fanar.ae'), ('${AGENT}', 'agent@fanar.ae'), ('${OUTSIDER}', 'owner@optics.ae');
    insert into public.organizations (id, name) values ('${ORG}', 'Al Fanar'), ('${OTHER_ORG}', 'Optics');
    insert into public.organization_members (org_id, user_id, role) values
      ('${ORG}', '${OWNER}', 'owner'), ('${ORG}', '${AGENT}', 'agent'), ('${OTHER_ORG}', '${OUTSIDER}', 'owner');
    insert into public.bots (id, org_id, name) values ('${BOT}', '${ORG}', 'Fanar Concierge');
    insert into public.knowledge_chunks (bot_id, source_name, content, embedding) values
      ('${BOT}', 'menu.md', 'Machboos laham — AED 65', '${toPgVector(vec(1))}'),
      ('${BOT}', 'hours.md', 'Open daily 12pm–1am', '${toPgVector(vec(500))}');
  `);
});

describe("engine × Supabase repository", () => {
  it("answers from pgvector knowledge and persists both messages", async () => {
    const { ai, calls } = fakeAI();
    const customer = `9715${Math.floor(Math.random() * 1e8)}`;
    const result = await processIncomingMessage(
      { botId: BOT, channel: "whatsapp", customerIdentifier: customer, customerName: "Hamdan", text: "بكم المچبوس؟", externalId: `wamid.${randomUUID()}` },
      deps(ai),
    );

    expect(result.outcome).toBe("ai_replied");
    expect(calls.instructions[0]).toContain("Machboos laham — AED 65");
    expect(calls.instructions[0]).not.toContain("Open daily"); // below the similarity threshold

    const { data: stored } = await admin
      .from("messages")
      .select("sender_type, content_text, confidence_score")
      .eq("conversation_id", result.conversation!.id)
      .order("created_at");
    expect(stored).toEqual([
      { sender_type: "customer", content_text: "بكم المچبوس؟", confidence_score: null },
      { sender_type: "ai", content_text: turn().reply_text, confidence_score: 0.92 },
    ]);
  });

  it("hands off, then keeps the AI silent on the next message", async () => {
    const { ai, calls } = fakeAI({
      generateTurn: async () => turn({ confidence_score: 0.3, handoff_summary_for_agent: "يبي حجز حفلة — wants a party booking" }),
    });
    const customer = `9715${Math.floor(Math.random() * 1e8)}`;
    const message = { botId: BOT, channel: "whatsapp" as const, customerIdentifier: customer };

    const first = await processIncomingMessage({ ...message, text: "تسوون حفلات؟" }, deps(ai));
    expect(first.outcome).toBe("handed_off");

    const { data: conversation } = await admin.from("conversations").select("*").eq("id", first.conversation!.id).single();
    expect(conversation).toMatchObject({
      status: "HUMAN_PENDING",
      handoff_reason: "low_confidence (0.30 < 0.75)",
      ai_summary: "يبي حجز حفلة — wants a party booking",
    });

    const generateCalls = calls.generateTurn;
    const second = await processIncomingMessage({ ...message, text: "؟؟" }, deps(ai));
    expect(second.outcome).toBe("human_owned");
    expect(second.conversation!.id).toBe(first.conversation!.id);
    expect(calls.generateTurn).toBe(generateCalls);
  });

  it("stores voice notes in the org's folder with the transcript", async () => {
    const { ai } = fakeAI();
    const result = await processIncomingMessage(
      {
        botId: BOT,
        channel: "web_widget",
        customerIdentifier: randomUUID(),
        audio: { data: new Uint8Array([1, 2, 3]), mediaType: "audio/webm;codecs=opus" },
      },
      deps(ai),
    );
    expect(result.customerMessage).toMatchObject({ input_type: "voice_note", content_text: "شو أوقات الدوام؟" });
    expect(result.customerMessage!.audio_url).toMatch(new RegExp(`^${ORG}/${result.conversation!.id}/[0-9a-f-]+\\.webm$`));
    expect(uploads.at(-1)).toBe(`voice-notes/${result.customerMessage!.audio_url}`);
  });

  it("is idempotent for webhook retries, including concurrent ones", async () => {
    const repo = createSupabaseRepository(admin);
    const conversation = await repo.findOrCreateOpenConversation({
      botId: BOT,
      channel: "whatsapp",
      customerIdentifier: `9715${Math.floor(Math.random() * 1e8)}`,
      customerName: null,
    });
    const message = {
      conversation_id: conversation.id,
      sender_type: "customer" as const,
      input_type: "text" as const,
      content_text: "hi",
      external_id: `wamid.${randomUUID()}`,
    };
    const results = await Promise.all([repo.insertMessage(message), repo.insertMessage(message), repo.insertMessage(message)]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await repo.messageExists(message.external_id)).toBe(true);
  });

  it("opens exactly one conversation when a customer's messages race", async () => {
    const repo = createSupabaseRepository(admin);
    const params = { botId: BOT, channel: "web_widget" as const, customerIdentifier: randomUUID(), customerName: null };
    const rows = await Promise.all(Array.from({ length: 6 }, () => repo.findOrCreateOpenConversation(params)));
    expect(new Set(rows.map((row) => row.id)).size).toBe(1);
  });

  it("only hands off from AI_ACTIVE (never overrides an agent)", async () => {
    const repo = createSupabaseRepository(admin);
    const conversation = await repo.findOrCreateOpenConversation({
      botId: BOT,
      channel: "web_widget",
      customerIdentifier: randomUUID(),
      customerName: null,
    });
    await admin.from("conversations").update({ status: "HUMAN_ACTIVE" }).eq("id", conversation.id);
    expect(await repo.markHandoff(conversation.id, { reason: "x", summary: "y" })).toBeNull();
    expect(await repo.getConversationStatus(conversation.id)).toBe("HUMAN_ACTIVE");
  });
});

describe("dashboard queries under RLS", () => {
  it("lets an agent work a handed-off conversation end to end", async () => {
    const { ai } = fakeAI({ generateTurn: async () => turn({ requires_human_handoff: true, confidence_score: 0.2 }) });
    const handoff = await processIncomingMessage(
      { botId: BOT, channel: "whatsapp", customerIdentifier: `9715${Math.floor(Math.random() * 1e8)}`, text: "refund" },
      deps(ai),
    );
    const id = handoff.conversation!.id;

    // The shape sendAgentReply reads (embedded bot for the org id).
    const { data: conversation, error } = await agentDb
      .from("conversations")
      .select("id, status, channel, customer_identifier, bots(org_id)")
      .eq("id", id)
      .single();
    expect(error).toBeNull();
    expect(conversation).toMatchObject({ status: "HUMAN_PENDING", bots: { org_id: ORG } });

    const { data: taken } = await agentDb
      .from("conversations")
      .update({ status: "HUMAN_ACTIVE", assigned_agent_id: AGENT })
      .eq("id", id)
      .select("id");
    expect(taken).toHaveLength(1);

    const { error: replyError } = await agentDb.from("messages").insert({
      conversation_id: id,
      sender_type: "human_agent",
      content_text: "هلا، معك سارة. بشيك على طلبك.",
      sender_user_id: AGENT,
    });
    expect(replyError).toBeNull();

    const { error: impersonation } = await agentDb
      .from("messages")
      .insert({ conversation_id: id, sender_type: "ai", content_text: "fake", sender_user_id: AGENT });
    expect(impersonation?.code).toBe("42501");
  });

  it("shows knowledge sources to members only", async () => {
    const { data: mine } = await agentDb.from("knowledge_sources").select("source_name, chunk_count").eq("bot_id", BOT).order("source_name");
    expect(mine).toEqual([
      { source_name: "hours.md", chunk_count: 1 },
      { source_name: "menu.md", chunk_count: 1 },
    ]);
    const { data: theirs } = await outsiderDb.from("knowledge_sources").select("*").eq("bot_id", BOT);
    expect(theirs).toEqual([]);
  });

  it("isolates tenants and hides the WhatsApp token", async () => {
    const { data: conversations } = await outsiderDb.from("conversations").select("id");
    expect(conversations).toEqual([]);
    const { data: messages } = await outsiderDb.from("messages").select("id");
    expect(messages).toEqual([]);

    const { error } = await agentDb.from("organizations").select("whatsapp_access_token");
    expect(error?.code).toBe("42501");
    const { data: org } = await agentDb.from("organizations").select("id, name").single();
    expect(org).toEqual({ id: ORG, name: "Al Fanar" });
  });

  it("serves the RAG RPC to members of the bot's organization only", async () => {
    const args = { query_embedding: toPgVector(vec(1)), filter_bot_id: BOT, match_count: 5 };
    const { data: mine } = await agentDb.rpc("match_knowledge_chunks", args);
    expect(mine?.map((row) => row.content)).toEqual(["Machboos laham — AED 65"]);
    const { data: theirs } = await outsiderDb.rpc("match_knowledge_chunks", args);
    expect(theirs).toEqual([]);
  });
});
