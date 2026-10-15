/**
 * Splits business documents (menus, price lists, policies, FAQs) into chunks
 * for embedding. Paragraph- and line-aware so a menu item and its price stay
 * together; long paragraphs fall back to sentence, then hard, splits. Each
 * chunk carries a little overlap from its predecessor for context.
 */

export type ChunkOptions = {
  /** Target maximum characters per chunk. */
  maxChars?: number;
  /** Characters of trailing context carried into the next chunk. */
  overlap?: number;
};

const SENTENCE_END = /(?<=[.!?؟。\n])\s+/u;

export function chunkText(input: string, { maxChars = 1000, overlap = 150 }: ChunkOptions = {}): string[] {
  const text = input.replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) return [];

  const pieces = text
    .split(/\n\s*\n/)
    .flatMap((paragraph) => splitLong(paragraph.trim(), maxChars))
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";
  for (const piece of pieces) {
    const candidate = current ? `${current}\n\n${piece}` : piece;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    if (current) chunks.push(current);
    const carry = overlap > 0 && current ? tail(current, overlap) : "";
    current = carry && carry.length + piece.length + 2 <= maxChars ? `${carry}\n\n${piece}` : piece;
  }
  if (current) chunks.push(current);
  return chunks;
}

function splitLong(paragraph: string, maxChars: number): string[] {
  if (paragraph.length <= maxChars) return [paragraph];

  // Prefer line breaks (lists, menus), then sentence ends.
  const units = paragraph.includes("\n") ? paragraph.split("\n") : paragraph.split(SENTENCE_END);
  const out: string[] = [];
  let current = "";
  for (const unit of units.map((u) => u.trim()).filter(Boolean)) {
    if (unit.length > maxChars) {
      if (current) out.push(current);
      current = "";
      for (let i = 0; i < unit.length; i += maxChars) out.push(unit.slice(i, i + maxChars));
      continue;
    }
    const joiner = paragraph.includes("\n") ? "\n" : " ";
    const candidate = current ? `${current}${joiner}${unit}` : unit;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      out.push(current);
      current = unit;
    }
  }
  if (current) out.push(current);
  return out;
}

/** Last `size` characters of a chunk, trimmed to a word boundary. */
function tail(chunk: string, size: number): string {
  if (chunk.length <= size) return chunk;
  const slice = chunk.slice(-size);
  const boundary = slice.search(/\s/);
  return (boundary >= 0 ? slice.slice(boundary) : slice).trim();
}
