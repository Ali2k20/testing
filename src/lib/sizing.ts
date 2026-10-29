/** Gulf abaya sizing: the number is a length, chosen by the wearer's height. */
export const abayaSizeChart = [
  { size: "50", length: 132, minHeight: 0, height: "150 – 155 cm", uk: "UK 6 – 8" },
  { size: "52", length: 137, minHeight: 155, height: "155 – 160 cm", uk: "UK 8 – 10" },
  { size: "54", length: 142, minHeight: 160, height: "160 – 165 cm", uk: "UK 10 – 12" },
  { size: "56", length: 147, minHeight: 165, height: "165 – 170 cm", uk: "UK 12 – 14" },
  { size: "58", length: 152, minHeight: 170, height: "170 – 175 cm", uk: "UK 14 – 16" },
  { size: "60", length: 157, minHeight: 175, height: "175 cm +", uk: "UK 16 – 18" },
] as const;

export type AbayaSizeRow = (typeof abayaSizeChart)[number];

/** The abaya size for a height in centimetres, measured in the shoes usually worn. */
export function abayaSizeForHeight(heightCm: number): AbayaSizeRow {
  let match: AbayaSizeRow = abayaSizeChart[0];
  for (const row of abayaSizeChart) {
    if (heightCm >= row.minHeight) match = row;
  }
  return match;
}
