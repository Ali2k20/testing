import { describe, expect, it } from "vitest";

import { EngineError, processIncomingMessage, type IncomingMessage } from "@/lib/ai/engine";

import { BOT, createFakeDeps, turn } from "./fakes";

const textMessage = (text: string, extra: Partial<IncomingMessage> = {}): IncomingMessage => ({
  botId: BOT.id,
  channel: "whatsapp",
  customerIdentifier: "971501234567",
  customerName: "Hamdan",
  text,
  ...extra,
});

const voiceMessage = (extra: Partial<IncomingMessage> = {}): IncomingMessage => ({
  botId: BOT.id,
  channel: "whatsapp",
  customerIdentifier: "971501234567",
  audio: { data: new Uint8Array([0x4f, 0x67, 0x67, 0x53]), mediaType: "audio/ogg; codecs=opus" },
  ...extra,
});

describe("human-owned conversations (CRITICAL: the AI must stay silent)", () => {
  for (const status of ["HUMAN_PENDING", "HUMAN_ACTIVE"] as const) {
    it(`${status}: saves the message, notifies agents, never calls the LLM or RAG`, async () => {
      const fake = createFakeDeps({ status });
      const result = await processIncomingMessage(textMessage("وينكم؟ أبي أحد يرد"), fake.deps);

      expect(result.outcome).toBe("human_owned");
      expect(result.reply).toBeNull();
      expect(fake.calls.generateTurn).toBe(0);
      expect(fake.calls.embed).toBe(0);
      expect(fake.calls.matchKnowledge).toBe(0);
      expect(fake.messages).toHaveLength(1);
      expect(fake.messages[0]).toMatchObject({ sender_type: "customer", content_text: "وينكم؟ أبي أحد يرد" });
      expect(fake.notifications).toEqual([
        expect.objectContaining({ type: "customer_message", orgId: BOT.org_id, conversationId: result.conversation!.id }),
      ]);
    });
  }

  it("still stores and transcribes voice notes for the agent, without replying", async () => {
    const fake = createFakeDeps({ status: "HUMAN_ACTIVE", transcript: "ابي ارجع الطلب" });
    const result = await processIncomingMessage(voiceMessage(), fake.deps);

    expect(result.outcome).toBe("human_owned");
    expect(fake.calls.generateTurn).toBe(0);
    expect(fake.messages).toHaveLength(1);
    expect(fake.messages[0]).toMatchObject({
      input_type: "voice_note",
      content_text: "ابي ارجع الطلب",
      audio_url: fake.voiceNotes[0],
    });
  });
});

describe("AI turn", () => {
  it("answers from knowledge when confident", async () => {
    const fake = createFakeDeps();
    const result = await processIncomingMessage(textMessage("بكم المچبوس؟"), fake.deps);

    expect(result.outcome).toBe("ai_replied");
    expect(result.reply).toMatchObject({ sender_type: "ai", content_text: turn().reply_text, confidence_score: 0.92 });
    expect(fake.calls.matchKnowledge).toBe(1);
    expect(fake.generateInputs[0].instructions).toContain("Machboos laham — AED 65");
    expect(fake.generateInputs[0].messages).toEqual([{ role: "user", content: "بكم المچبوس؟" }]);
    expect(fake.conversations.get(result.conversation!.id)!.status).toBe("AI_ACTIVE");
    expect(fake.notifications.map((n) => n.type)).toEqual(["ai_reply"]);
  });

  it("transcribes voice notes and answers the transcript", async () => {
    const fake = createFakeDeps({ transcript: "شو أوقات الدوام؟" });
    const result = await processIncomingMessage(voiceMessage(), fake.deps);

    expect(result.outcome).toBe("ai_replied");
    expect(result.customerMessage).toMatchObject({ input_type: "voice_note", content_text: "شو أوقات الدوام؟" });
    expect(result.customerMessage!.audio_url).toMatch(new RegExp(`^${BOT.org_id}/`));
    expect(fake.generateInputs[0].messages[0].content).toBe("[Voice note transcript] شو أوقات الدوام؟");
  });

  it("asks the customer to type when a voice note cannot be transcribed", async () => {
    const fake = createFakeDeps({ transcript: new Error("whisper down") });
    const result = await processIncomingMessage(voiceMessage(), fake.deps);

    expect(result.outcome).toBe("ai_replied");
    expect(fake.calls.generateTurn).toBe(0);
    expect(result.reply!.content_text).toMatch(/type your message/);
    expect(result.reply!.content_text).toMatch(/[؀-ۿ]/);
  });

  it("still asks the LLM (which is told no knowledge was found) when retrieval fails", async () => {
    const fake = createFakeDeps({ knowledge: new Error("pgvector timeout") });
    await processIncomingMessage(textMessage("hello"), fake.deps);
    expect(fake.calls.generateTurn).toBe(1);
    expect(fake.generateInputs[0].instructions).toContain("NO MATCHING BUSINESS KNOWLEDGE");
  });
});

describe("handoff policy", () => {
  it("hands off below the bot's confidence threshold, in the customer's Arabic", async () => {
    const fake = createFakeDeps({
      turn: turn({ confidence_score: 0.4, handoff_summary_for_agent: "العميل يسأل عن حجز حفلة — Customer asks about a party booking." }),
    });
    const result = await processIncomingMessage(textMessage("تسوون حفلات أعراس؟"), fake.deps);

    expect(result.outcome).toBe("handed_off");
    expect(result.handoffTriggers).toEqual(["low_confidence"]);
    expect(result.reply).toMatchObject({ sender_type: "ai", content_text: BOT.handoff_message_ar, confidence_score: 0.4 });
    const conversation = fake.conversations.get(result.conversation!.id)!;
    expect(conversation.status).toBe("HUMAN_PENDING");
    expect(conversation.handoff_reason).toBe("low_confidence (0.40 < 0.75)");
    expect(conversation.ai_summary).toContain("party booking");
    expect(fake.notifications.map((n) => n.type)).toEqual(["handoff"]);
  });

  it("does not hand off exactly at the threshold", async () => {
    const fake = createFakeDeps({ turn: turn({ confidence_score: 0.75 }) });
    expect((await processIncomingMessage(textMessage("hi"), fake.deps)).outcome).toBe("ai_replied");
  });

  it("uses the English handoff message for English speakers", async () => {
    const fake = createFakeDeps({
      turn: turn({ detected_language_or_dialect: "english", confidence_score: 0.2, requires_human_handoff: true }),
    });
    const result = await processIncomingMessage(textMessage("Can I return a dish I already ate?"), fake.deps);
    expect(result.reply!.content_text).toBe(BOT.handoff_message_en);
    expect(result.handoffTriggers).toEqual(["model_requested", "low_confidence"]);
  });

  it("hands off on frustration even when confident", async () => {
    const fake = createFakeDeps({ turn: turn({ confidence_score: 0.95, user_frustration_detected: true }) });
    const result = await processIncomingMessage(textMessage("ثالث مرة أسأل!! محد يرد"), fake.deps);
    expect(result.outcome).toBe("handed_off");
    expect(result.handoffTriggers).toEqual(["frustration"]);
  });

  it("hands off on an explicit request for a human even if the model misses it", async () => {
    const fake = createFakeDeps({ turn: turn({ confidence_score: 0.99 }) });
    const result = await processIncomingMessage(textMessage("abi akalem mowazaf plz"), fake.deps);
    expect(result.outcome).toBe("handed_off");
    expect(result.handoffTriggers).toEqual(["explicit_human_request"]);
  });

  it("fails safe to a human when the LLM errors, with a fallback summary", async () => {
    const fake = createFakeDeps({ turn: new Error("503 overloaded") });
    const result = await processIncomingMessage(textMessage("I want to cancel my order #4411"), fake.deps);

    expect(result.outcome).toBe("handed_off");
    expect(result.handoffTriggers).toEqual(["ai_unavailable"]);
    expect(result.reply!.content_text).toBe(BOT.handoff_message_en);
    expect(result.reply!.confidence_score).toBeNull();
    expect(fake.conversations.get(result.conversation!.id)!.ai_summary).toContain("cancel my order #4411");
  });

  it("after a handoff, the next customer message never reaches the AI", async () => {
    const fake = createFakeDeps({ turn: turn({ confidence_score: 0.1 }) });
    await processIncomingMessage(textMessage("refund please"), fake.deps);
    const second = await processIncomingMessage(textMessage("hello??"), fake.deps);

    expect(second.outcome).toBe("human_owned");
    expect(fake.calls.generateTurn).toBe(1);
  });
});

describe("races and idempotency", () => {
  it("drops WhatsApp webhook retries before doing any paid work", async () => {
    const fake = createFakeDeps();
    await processIncomingMessage(textMessage("hi", { externalId: "wamid.ABC" }), fake.deps);
    const retry = await processIncomingMessage(voiceMessage({ externalId: "wamid.ABC" }), fake.deps);

    expect(retry.outcome).toBe("duplicate");
    expect(fake.calls.transcribe).toBe(0);
    expect(fake.calls.generateTurn).toBe(1);
    expect(fake.messages.filter((m) => m.sender_type === "customer")).toHaveLength(1);
  });

  it("discards the AI reply if an agent takes over while the model is thinking", async () => {
    const fake = createFakeDeps();
    fake.hooks.duringGenerate = () => {
      for (const [id, c] of fake.conversations) fake.conversations.set(id, { ...c, status: "HUMAN_ACTIVE" });
    };
    const result = await processIncomingMessage(textMessage("hi"), fake.deps);

    expect(result.outcome).toBe("superseded");
    expect(result.reply).toBeNull();
    expect(fake.messages.filter((m) => m.sender_type === "ai")).toHaveLength(0);
  });

  it("does not send a handoff message if an agent already took the conversation", async () => {
    const fake = createFakeDeps({ turn: turn({ confidence_score: 0.1 }) });
    fake.hooks.duringGenerate = () => {
      for (const [id, c] of fake.conversations) fake.conversations.set(id, { ...c, status: "HUMAN_ACTIVE" });
    };
    const result = await processIncomingMessage(textMessage("hi"), fake.deps);
    expect(result.outcome).toBe("superseded");
    expect(fake.messages.filter((m) => m.sender_type === "ai")).toHaveLength(0);
  });
});

describe("input validation", () => {
  it("rejects empty messages", async () => {
    const fake = createFakeDeps();
    await expect(processIncomingMessage(textMessage("   "), fake.deps)).rejects.toBeInstanceOf(EngineError);
  });

  it("rejects unknown bots", async () => {
    const fake = createFakeDeps({ bot: null });
    await expect(processIncomingMessage(textMessage("hi"), fake.deps)).rejects.toMatchObject({ code: "bot_not_found" });
  });
});
