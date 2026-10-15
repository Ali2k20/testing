import { describe, expect, it } from "vitest";

import { describeHandoffReason } from "@/lib/ai/handoff";
import { parseHandoffReason, summaryLines } from "@/lib/handoff-display";

import { turn } from "./fakes";

describe("parseHandoffReason", () => {
  it("round-trips what the engine stores", () => {
    const stored = describeHandoffReason(["frustration", "low_confidence"], turn({ confidence_score: 0.4 }), 0.75);
    expect(parseHandoffReason(stored)).toEqual([
      { trigger: "frustration", detail: null },
      { trigger: "low_confidence", detail: "0.40 < 0.75" },
    ]);
  });

  it("ignores unknown fragments", () => {
    expect(parseHandoffReason("legacy reason, ai_unavailable")).toEqual([{ trigger: "ai_unavailable", detail: null }]);
  });
});

describe("summaryLines", () => {
  it("splits the Arabic and English halves", () => {
    expect(summaryLines("العميل يبي حجز\nCustomer wants a booking")).toEqual(["العميل يبي حجز", "Customer wants a booking"]);
    expect(summaryLines("العميل يبي حجز — Customer wants a booking")).toEqual(["العميل يبي حجز", "Customer wants a booking"]);
  });
});
