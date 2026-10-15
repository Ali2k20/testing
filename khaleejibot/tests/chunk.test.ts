import { describe, expect, it } from "vitest";

import { chunkText } from "@/lib/knowledge/chunk";

describe("chunkText", () => {
  it("returns nothing for blank input", () => {
    expect(chunkText(" \n\n ")).toEqual([]);
  });

  it("keeps short documents whole", () => {
    expect(chunkText("مچبوس لحم — ٦٥ درهم\nلقيمات — ٢٥ درهم")).toEqual(["مچبوس لحم — ٦٥ درهم\nلقيمات — ٢٥ درهم"]);
  });

  it("never exceeds maxChars and never splits a menu line", () => {
    const menu = Array.from({ length: 80 }, (_, i) => `Dish ${i + 1} — AED ${20 + i}`).join("\n");
    const chunks = chunkText(menu, { maxChars: 200, overlap: 40 });
    expect(chunks.length).toBeGreaterThan(5);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(200);
    }
    for (let i = 1; i <= 80; i++) {
      expect(chunks.some((chunk) => chunk.includes(`Dish ${i} — AED ${19 + i}`))).toBe(true);
    }
  });

  it("carries overlap from the previous chunk", () => {
    const paragraphs = ["Returns are accepted within 7 days with receipt.", "Delivery is free above AED 100.", "We open at noon daily."];
    const chunks = chunkText(paragraphs.join("\n\n"), { maxChars: 70, overlap: 20 });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[1]).toMatch(/receipt\./);
  });

  it("hard-splits a single enormous token", () => {
    const chunks = chunkText("x".repeat(2500), { maxChars: 1000, overlap: 0 });
    expect(chunks.map((c) => c.length)).toEqual([1000, 1000, 500]);
  });
});
