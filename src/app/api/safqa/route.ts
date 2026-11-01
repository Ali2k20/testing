import Anthropic from "@anthropic-ai/sdk";
import { SAFQA_SYSTEM_PROMPT } from "@/lib/safqa/prompt";
import { parseProfile, runTool, toolDefinitions, type ClientProfile } from "@/lib/safqa/tools";

export const maxDuration = 300;

const MODEL = process.env.SAFQA_MODEL || "claude-opus-5-5";
const MAX_TOOL_ROUNDS = 10;

type Msg = Anthropic.Beta.BetaMessageParam;

export type SafqaEvent =
  | { type: "tool_call"; id: string; name: string; input: unknown }
  | { type: "tool_result"; id: string; name: string; isError: boolean; card?: unknown; output: unknown }
  | { type: "text"; text: string }
  | { type: "done"; messages: Msg[]; usage: { input: number; output: number; cacheRead: number } }
  | { type: "error"; message: string };

function configured() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export async function GET() {
  return Response.json({ configured: configured(), model: MODEL });
}

function profileBlock(p: ClientProfile) {
  const lines = [
    `tier: ${p.tier}`,
    p.name && `name: ${p.name}`,
    p.company && `company: ${p.company}`,
    p.phone && `whatsapp: ${p.phone}`,
  ].filter(Boolean);
  return `<crm_client_profile>\n${lines.join("\n")}\n</crm_client_profile>`;
}

export async function POST(request: Request) {
  if (!configured()) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not set on the server. Add it to .env.local (local) or the deployment's environment variables." },
      { status: 503 },
    );
  }

  let body: { messages?: unknown; input?: unknown; profile?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const input = typeof body.input === "string" ? body.input.trim().slice(0, 8000) : "";
  if (!input) return Response.json({ error: "Empty message" }, { status: 400 });
  const history = Array.isArray(body.messages) ? (body.messages as Msg[]) : [];
  if (JSON.stringify(history).length > 1_500_000) {
    return Response.json({ error: "Conversation too long — start a new chat." }, { status: 413 });
  }
  const profile = parseProfile(body.profile);
  const origin = new URL(request.url).origin;

  // Append-only history: earlier turns (including thinking blocks) go back unchanged.
  const messages: Msg[] = [
    ...history,
    {
      role: "user",
      content: history.length
        ? input
        : [
            { type: "text", text: profileBlock(profile) },
            { type: "text", text: input },
          ],
    },
  ];

  const client = new Anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: SafqaEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      const usage = { input: 0, output: 0, cacheRead: 0 };
      try {
        for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
          const response = await client.beta.messages.create({
            model: MODEL,
            max_tokens: 16000,
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            output_config: { effort: "medium" },
            cache_control: { type: "ephemeral" },
            system: SAFQA_SYSTEM_PROMPT,
            tools: toolDefinitions,
            messages,
          });
          usage.input += response.usage.input_tokens;
          usage.output += response.usage.output_tokens;
          usage.cacheRead += response.usage.cache_read_input_tokens ?? 0;

          messages.push({ role: "assistant", content: response.content });

          for (const block of response.content) {
            if (block.type === "text" && block.text.trim()) send({ type: "text", text: block.text });
          }

          if (response.stop_reason === "refusal") {
            send({ type: "error", message: "The model declined this request." });
            break;
          }
          if (response.stop_reason === "max_tokens") {
            send({ type: "error", message: "The reply hit the length limit and was cut short." });
            break;
          }
          if (response.stop_reason !== "tool_use") break;

          if (round === MAX_TOOL_ROUNDS) {
            send({ type: "error", message: "Stopped after too many tool rounds." });
            break;
          }

          const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
          for (const block of response.content) {
            if (block.type !== "tool_use") continue;
            send({ type: "tool_call", id: block.id, name: block.name, input: block.input });
            const outcome = runTool(block.name, block.input, { origin, profile });
            send({
              type: "tool_result",
              id: block.id,
              name: block.name,
              isError: Boolean(outcome.isError),
              card: outcome.card,
              output: outcome.output,
            });
            results.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify(outcome.output),
              is_error: outcome.isError || undefined,
            });
          }
          // All results for one assistant turn go back in a single user message.
          messages.push({ role: "user", content: results });
        }
        send({ type: "done", messages, usage });
      } catch (err) {
        let message = "Something went wrong talking to the model.";
        if (err instanceof Anthropic.AuthenticationError) message = "The Anthropic API key was rejected.";
        else if (err instanceof Anthropic.RateLimitError) message = "Rate limited by the Anthropic API — try again in a moment.";
        else if (err instanceof Anthropic.BadRequestError) message = `Bad request: ${err.message}`;
        else if (err instanceof Anthropic.APIError) message = `Anthropic API error ${err.status ?? ""}: ${err.message}`;
        else if (err instanceof Error) message = err.message;
        console.error("[safqa]", err);
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
