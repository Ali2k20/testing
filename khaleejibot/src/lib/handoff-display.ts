import type { HandoffTrigger } from "@/lib/ai/handoff";

const TRIGGERS: readonly HandoffTrigger[] = [
  "model_requested",
  "frustration",
  "low_confidence",
  "explicit_human_request",
  "ai_unavailable",
];

/**
 * Parses a stored handoff_reason such as "low_confidence (0.40 < 0.75), frustration"
 * into triggers with their optional detail, for localized display.
 */
export function parseHandoffReason(reason: string): { trigger: HandoffTrigger; detail: string | null }[] {
  return reason
    .split(/,\s*/)
    .map((part) => part.match(/^(\w+)(?:\s*\((.*)\))?$/))
    .filter((match): match is RegExpMatchArray => match !== null && (TRIGGERS as string[]).includes(match[1]))
    .map((match) => ({ trigger: match[1] as HandoffTrigger, detail: match[2] ?? null }));
}

/** Splits the AI's bilingual summary (Arabic line, English line) for per-line direction. */
export function summaryLines(summary: string): string[] {
  return summary
    .split(/\n+|\s+—\s+/)
    .map((line) => line.trim())
    .filter(Boolean);
}
