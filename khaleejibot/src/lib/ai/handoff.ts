import type { AiTurn, DetectedLanguage } from "./schema";

/**
 * Deterministic handoff policy, applied on top of the model's own judgement.
 * Any single trigger hands the conversation to a human.
 */

export type HandoffTrigger =
  | "model_requested"
  | "frustration"
  | "low_confidence"
  | "explicit_human_request"
  | "ai_unavailable";

export type HandoffDecision = {
  handoff: boolean;
  triggers: HandoffTrigger[];
};

// Backstop for explicit "let me talk to a person" requests, so a handoff never
// depends solely on the model noticing. Covers English, Gulf/Levantine/MSA
// Arabic and common Arabizi spellings.
const HUMAN_REQUEST_PATTERNS: RegExp[] = [
  /\b(talk|speak|chat)\s+(to|with)\s+(a\s+|an\s+|the\s+|your\s+)?(human|person|agent|someone|somebody|manager|supervisor|representative|staff)\b/i,
  /\b(want|need|get\s+me|give\s+me|connect\s+me\s+(to|with)|transfer\s+me\s+to)\s+(a\s+|an\s+|the\s+|your\s+)?(human|person|agent|manager|supervisor|representative)\b/i,
  /\b(real|actual|live)\s+(human|person|agent)\b/i,
  /\b(customer\s+(service|support|care))\b/i,
  /\bhuman\s+(agent|please|pls)\b/i,
  /(موظف|موظفة|الموظف|مسؤول|المسؤول|المدير|مدير|انسان|إنسان|شخص\s+حقيقي|خدمة\s+العملاء)/,
  /(أبي|ابي|ابا|أبا|ابغى|أبغى|ابغا|بدي|أريد|اريد|ممكن)\s+(أكلم|اكلم|اتكلم|أتكلم|احكي|أحكي|اتواصل|أتواصل)/,
  /\b(mowazaf|mwazaf|muwazaf|mwazf|insan|insaan|modeer|mudeer)\b/i,
  /\b(abi|abgha|abgh|baddi|bdi|bade|abee)\s+(akalem|akalim|akallim|akalm|a7ki|ahki|at9el|atwasal)\b/i,
];

export function isExplicitHumanRequest(text: string): boolean {
  return HUMAN_REQUEST_PATTERNS.some((pattern) => pattern.test(text));
}

export function evaluateHandoff(turn: AiTurn | null, threshold: number, customerText: string): HandoffDecision {
  const triggers: HandoffTrigger[] = [];

  if (!turn) {
    triggers.push("ai_unavailable");
  } else {
    if (turn.requires_human_handoff) triggers.push("model_requested");
    if (turn.user_frustration_detected) triggers.push("frustration");
    if (turn.confidence_score < threshold) triggers.push("low_confidence");
  }
  if (isExplicitHumanRequest(customerText) && !triggers.includes("explicit_human_request")) {
    triggers.push("explicit_human_request");
  }

  return { handoff: triggers.length > 0, triggers };
}

export function describeHandoffReason(triggers: HandoffTrigger[], turn: AiTurn | null, threshold: number): string {
  return triggers
    .map((trigger) =>
      trigger === "low_confidence" && turn
        ? `low_confidence (${turn.confidence_score.toFixed(2)} < ${threshold.toFixed(2)})`
        : trigger,
    )
    .join(", ");
}

const ARABIC_SCRIPT = /[؀-ۿݐ-ݿࢠ-ࣿ]/;

export function hasArabicScript(text: string): boolean {
  return ARABIC_SCRIPT.test(text);
}

export type ReplyLanguage = "ar" | "en";

/** Which of the bot's configured (handoff/fallback) messages to send. */
export function pickReplyLanguage(detected: DetectedLanguage | null, customerText: string): ReplyLanguage {
  switch (detected) {
    case "english":
      return "en";
    case "emirati_khaleeji":
    case "other_arabic":
    case "arabizi":
      return "ar";
    case "mixed":
    case null:
      return hasArabicScript(customerText) ? "ar" : "en";
  }
}
