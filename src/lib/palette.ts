import type { ColorOption } from "./types";

/**
 * Shared fabric colourways. Products pick from this palette so swatches,
 * filters and the generated product art all stay in sync.
 */
export const palette = {
  onyx: { name: "onyx", label: "Onyx Black", hex: "#14110E", sheen: "#3B342C" },
  charcoal: { name: "charcoal", label: "Charcoal", hex: "#3A3733", sheen: "#5E5A54" },
  ink: { name: "ink", label: "Midnight Ink", hex: "#1C2438", sheen: "#39445F" },
  sand: { name: "sand", label: "Desert Sand", hex: "#C9B292", sheen: "#E3D2B9" },
  ivory: { name: "ivory", label: "Pearl Ivory", hex: "#EDE4D6", sheen: "#FAF5EC" },
  camel: { name: "camel", label: "Camel", hex: "#A87F51", sheen: "#C9A277" },
  olive: { name: "olive", label: "Olive Grove", hex: "#5E6247", sheen: "#7F8465" },
  sage: { name: "sage", label: "Dusty Sage", hex: "#93A08C", sheen: "#B4BEAE" },
  rose: { name: "rose", label: "Dusty Rose", hex: "#BE8E88", sheen: "#D8AFA9" },
  mauve: { name: "mauve", label: "Mauve", hex: "#8A6A9E", sheen: "#A98AB9" },
  burgundy: { name: "burgundy", label: "Burgundy", hex: "#5C2230", sheen: "#7E3948" },
  emerald: { name: "emerald", label: "Emerald", hex: "#1F4D42", sheen: "#356D5F" },
  pearl: { name: "pearl", label: "Oyster", hex: "#D8CFC4", sheen: "#EFE9E1" },
  cocoa: { name: "cocoa", label: "Cocoa", hex: "#4A382C", sheen: "#6B523F" },
} satisfies Record<string, ColorOption>;

export type PaletteKey = keyof typeof palette;

export const colorOrder: PaletteKey[] = [
  "onyx",
  "charcoal",
  "ink",
  "cocoa",
  "camel",
  "sand",
  "ivory",
  "pearl",
  "olive",
  "sage",
  "emerald",
  "rose",
  "mauve",
  "burgundy",
];

export function colorByName(name: string): ColorOption | undefined {
  return (palette as Record<string, ColorOption>)[name];
}
