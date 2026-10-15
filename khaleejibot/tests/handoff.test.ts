import { describe, expect, it } from "vitest";

import { evaluateHandoff, isExplicitHumanRequest, pickReplyLanguage } from "@/lib/ai/handoff";
import { aiTurnSchema } from "@/lib/ai/schema";

import { turn } from "./fakes";

describe("isExplicitHumanRequest", () => {
  it.each([
    "Can I talk to a human please",
    "I want to speak with your manager",
    "I need a human",
    "get me your manager NOW",
    "connect me to an agent",
    "real person pls",
    "customer service?",
    "أبي أكلم موظف",
    "ابغى اكلم المدير",
    "بدي احكي مع حدا من خدمة العملاء",
    "ممكن اتواصل مع شخص حقيقي",
    "abi akalem mowazaf",
    "baddi a7ki ma3 insan",
  ])("detects %j", (text) => {
    expect(isExplicitHumanRequest(text)).toBe(true);
  });

  it.each([
    "What time do you open?",
    "بكم المچبوس؟",
    "عندكم توصيل للشارقة؟",
    "shu 3indkum lyom?",
    "Is the human-sized platter enough for 4?",
    "I want the mixed grill",
    "Do you need a deposit?",
  ])("ignores %j", (text) => {
    expect(isExplicitHumanRequest(text)).toBe(false);
  });
});

describe("evaluateHandoff", () => {
  it("passes a confident, calm turn", () => {
    expect(evaluateHandoff(turn(), 0.75, "hi")).toEqual({ handoff: false, triggers: [] });
  });

  it("collects every trigger that fired", () => {
    const decision = evaluateHandoff(
      turn({ confidence_score: 0.3, requires_human_handoff: true, user_frustration_detected: true }),
      0.75,
      "I want a manager now",
    );
    expect(decision.triggers).toEqual(["model_requested", "frustration", "low_confidence", "explicit_human_request"]);
  });

  it("treats a missing turn as ai_unavailable", () => {
    expect(evaluateHandoff(null, 0.75, "hi")).toEqual({ handoff: true, triggers: ["ai_unavailable"] });
  });
});

describe("pickReplyLanguage", () => {
  it.each([
    ["english", "hello", "en"],
    ["emirati_khaleeji", "هلا", "ar"],
    ["other_arabic", "مرحبا", "ar"],
    ["arabizi", "shlonak", "ar"],
    ["mixed", "abi order wa7ed please", "en"],
    ["mixed", "ابي order واحد", "ar"],
    [null, "مرحبا", "ar"],
    [null, "hello", "en"],
  ] as const)("%s / %j → %s", (detected, text, expected) => {
    expect(pickReplyLanguage(detected, text)).toBe(expected);
  });
});

describe("aiTurnSchema", () => {
  it("rejects out-of-range confidence and unknown dialects", () => {
    expect(aiTurnSchema.safeParse(turn({ confidence_score: 1.2 })).success).toBe(false);
    expect(aiTurnSchema.safeParse({ ...turn(), detected_language_or_dialect: "klingon" }).success).toBe(false);
    expect(aiTurnSchema.safeParse(turn()).success).toBe(true);
  });
});
