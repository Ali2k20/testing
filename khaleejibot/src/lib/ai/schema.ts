import { z } from "zod";

/**
 * Strict structured output the LLM must return for every customer turn.
 * The engine never sends free-form model text to a customer: it only acts on
 * a response that validates against this schema.
 */
export const aiTurnSchema = z.object({
  reply_text: z
    .string()
    .describe("Natural response matching the user's Arabic dialect, Arabizi, or English code-switching"),
  detected_language_or_dialect: z.enum(["emirati_khaleeji", "other_arabic", "arabizi", "english", "mixed"]),
  confidence_score: z
    .number()
    .min(0)
    .max(1)
    .describe(
      "How confident the AI is that the knowledge base directly answers the user's question without guessing",
    ),
  user_frustration_detected: z
    .boolean()
    .describe("True if the user sounds angry, frustrated, or explicitly asks for a human/manager"),
  requires_human_handoff: z.boolean(),
  handoff_summary_for_agent: z
    .string()
    .nullable()
    .describe(
      "1-sentence summary in Arabic & English for the human agent explaining what the customer wants and why handoff occurred",
    ),
});

export type AiTurn = z.infer<typeof aiTurnSchema>;
export type DetectedLanguage = AiTurn["detected_language_or_dialect"];
