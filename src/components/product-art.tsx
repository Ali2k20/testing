import type { ColorOption, Fit, Product } from "@/lib/types";

export type ArtView = "full" | "detail" | "back" | "fabric";

/**
 * Decorative treatment drawn over the garment silhouette. Kept next to the
 * renderer rather than in the catalogue because it is purely presentational.
 */
type Motif = "plain" | "pearls" | "zari" | "talli" | "pleats" | "embroidery" | "sadu" | "velvet";

const motifBySlug: Record<string, Motif> = {
  "dana-pearl-trim-abaya": "pearls",
  "sahra-pleated-abaya": "pleats",
  "zahra-embroidered-abaya": "embroidery",
  "sadu-kimono-abaya": "sadu",
  "nakhla-satin-abaya": "plain",
  "bahar-mukhawar": "zari",
  "talli-heritage-mukhawar": "talli",
  "farah-velvet-mukhawar": "velvet",
  "sabah-cotton-mukhawar": "embroidery",
  "majlis-mukhawar": "zari",
  "aseel-zari-mukhawar": "zari",
  "lulwa-bridal-kaftan": "pearls",
  "noor-abaya-sheila-set": "plain",
  "pearl-drop-belt": "pearls",
};

interface Geometry {
  /** Half-width of the neck opening. */
  neck: number;
  shoulder: number;
  /** How far the cuff reaches from centre. */
  sleeveReach: number;
  cuffTop: number;
  cuffBottom: number;
  waist: number;
  hem: number;
  hemY: number;
}

const geometryByFit: Record<Fit, Geometry> = {
  straight: { neck: 38, shoulder: 74, sleeveReach: 162, cuffTop: 452, cuffBottom: 470, waist: 96, hem: 124, hemY: 716 },
  "a-line": { neck: 38, shoulder: 76, sleeveReach: 168, cuffTop: 446, cuffBottom: 466, waist: 104, hem: 176, hemY: 720 },
  flared: { neck: 36, shoulder: 74, sleeveReach: 170, cuffTop: 440, cuffBottom: 462, waist: 108, hem: 208, hemY: 722 },
  kimono: { neck: 42, shoulder: 86, sleeveReach: 206, cuffTop: 322, cuffBottom: 438, waist: 116, hem: 150, hemY: 714 },
  butterfly: { neck: 40, shoulder: 80, sleeveReach: 236, cuffTop: 470, cuffBottom: 560, waist: 120, hem: 214, hemY: 710 },
  relaxed: { neck: 46, shoulder: 92, sleeveReach: 196, cuffTop: 402, cuffBottom: 452, waist: 128, hem: 168, hemY: 718 },
};

const CX = 300;
const SHOULDER_Y = 158;
const NECK_Y = 146;
const UNDERARM_Y = 302;

function garmentPath(fit: Fit): string {
  const g = geometryByFit[fit];

  if (fit === "butterfly") {
    // One continuous panel: the sleeve sweeps outward and falls straight into
    // the hem, which is what makes a true butterfly cut.
    return [
      `M ${CX - g.neck} ${NECK_Y}`,
      `C ${CX - g.shoulder} ${NECK_Y + 4}, ${CX - g.shoulder - 8} ${SHOULDER_Y}, ${CX - g.shoulder - 12} ${SHOULDER_Y + 6}`,
      `C ${CX - g.sleeveReach} ${SHOULDER_Y + 150}, ${CX - g.sleeveReach - 18} ${g.cuffTop}, ${CX - g.sleeveReach + 22} ${g.cuffBottom}`,
      `C ${CX - g.hem - 46} ${g.hemY - 90}, ${CX - g.hem - 16} ${g.hemY - 30}, ${CX - g.hem} ${g.hemY}`,
      `Q ${CX} ${g.hemY + 22}, ${CX + g.hem} ${g.hemY}`,
      `C ${CX + g.hem + 16} ${g.hemY - 30}, ${CX + g.hem + 46} ${g.hemY - 90}, ${CX + g.sleeveReach - 22} ${g.cuffBottom}`,
      `C ${CX + g.sleeveReach + 18} ${g.cuffTop}, ${CX + g.sleeveReach} ${SHOULDER_Y + 150}, ${CX + g.shoulder + 12} ${SHOULDER_Y + 6}`,
      `C ${CX + g.shoulder + 8} ${SHOULDER_Y}, ${CX + g.shoulder} ${NECK_Y + 4}, ${CX + g.neck} ${NECK_Y}`,
      `Q ${CX} ${NECK_Y + 34}, ${CX - g.neck} ${NECK_Y}`,
      "Z",
    ].join(" ");
  }

  // Standard T-silhouette: neck, shoulder, sleeve out to the cuff, back in at
  // the underarm, then down the body to the hem.
  return [
    `M ${CX - g.neck} ${NECK_Y}`,
    `C ${CX - g.shoulder + 10} ${NECK_Y + 2}, ${CX - g.shoulder} ${SHOULDER_Y - 6}, ${CX - g.shoulder - 6} ${SHOULDER_Y}`,
    `L ${CX - g.sleeveReach} ${g.cuffTop}`,
    `Q ${CX - g.sleeveReach + 6} ${g.cuffBottom + 6}, ${CX - g.sleeveReach + 46} ${g.cuffBottom}`,
    `L ${CX - g.waist - 10} ${UNDERARM_Y}`,
    `C ${CX - g.waist - 6} ${UNDERARM_Y + 160}, ${CX - g.hem + 8} ${g.hemY - 180}, ${CX - g.hem} ${g.hemY}`,
    `Q ${CX} ${g.hemY + 24}, ${CX + g.hem} ${g.hemY}`,
    `C ${CX + g.hem - 8} ${g.hemY - 180}, ${CX + g.waist + 6} ${UNDERARM_Y + 160}, ${CX + g.waist + 10} ${UNDERARM_Y}`,
    `L ${CX + g.sleeveReach - 46} ${g.cuffBottom}`,
    `Q ${CX + g.sleeveReach - 6} ${g.cuffBottom + 6}, ${CX + g.sleeveReach} ${g.cuffTop}`,
    `L ${CX + g.shoulder + 6} ${SHOULDER_Y}`,
    `C ${CX + g.shoulder} ${SHOULDER_Y - 6}, ${CX + g.shoulder - 10} ${NECK_Y + 2}, ${CX + g.neck} ${NECK_Y}`,
    `Q ${CX} ${NECK_Y + 34}, ${CX - g.neck} ${NECK_Y}`,
    "Z",
  ].join(" ");
}

/** Soft vertical folds, offset deterministically so each product differs. */
function foldPaths(fit: Fit, seed: number) {
  const g = geometryByFit[fit];
  const count = fit === "flared" || fit === "butterfly" ? 7 : 5;
  return Array.from({ length: count }, (_, index) => {
    const t = (index + 1) / (count + 1);
    const drift = ((seed + index * 37) % 11) - 5;
    const topX = CX - g.waist * 0.72 + g.waist * 1.44 * t;
    const bottomX = CX - g.hem * 0.82 + g.hem * 1.64 * t + drift;
    return `M ${topX} ${UNDERARM_Y + 16} C ${topX + drift} ${UNDERARM_Y + 190}, ${bottomX - drift} ${g.hemY - 190}, ${bottomX} ${g.hemY - 8}`;
  });
}

/** Perceived luminance of a #rrggbb colour, 0 (black) to 1 (white). */
function luminance(hex: string) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hashSeed(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) % 100000;
  }
  return hash;
}

const VIEW_BOX: Record<ArtView, string> = {
  full: "0 0 600 800",
  detail: "176 118 250 334",
  back: "0 0 600 800",
  fabric: "0 0 600 800",
};

export interface ProductArtProps {
  product: Product;
  color: ColorOption;
  view?: ArtView;
  className?: string;
  priority?: boolean;
}

export function ProductArt({ product, color, view = "full", className }: ProductArtProps) {
  const uid = `${product.slug}-${color.name}-${view}`.replace(/[^a-z0-9-]/gi, "");
  const seed = hashSeed(uid);
  const motif = motifBySlug[product.slug] ?? (product.category === "mukhawar" ? "zari" : "plain");
  const g = geometryByFit[product.fit];
  const isAccessory = product.category === "accessory";
  // A low-key studio: a dark ground with one pool of light behind the garment.
  // Black and deep fabrics need a brighter pool to keep their silhouette; pale
  // fabrics already glow, so their pool is dimmed to keep them from flaring.
  const pale = luminance(color.hex) > 0.7;
  const backdrop = { top: "#2B2723", mid: "#1D1A17", bottom: "#131110" };
  const pool = pale ? 0.1 : luminance(color.hex) < 0.08 ? 0.34 : 0.24;
  const label = `${product.name} in ${color.label}`;

  return (
    <svg
      viewBox={VIEW_BOX[view]}
      className={className}
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMid slice"
    >
      <title>{label}</title>
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={backdrop.top} />
          <stop offset="58%" stopColor={backdrop.mid} />
          <stop offset="100%" stopColor={backdrop.bottom} />
        </linearGradient>
        <radialGradient id={`vignette-${uid}`} cx="50%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#F3E7D3" stopOpacity={pool} />
          <stop offset="100%" stopColor="#F3E7D3" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`cloth-${uid}`} x1="0.15" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor={color.sheen} />
          <stop offset="34%" stopColor={color.hex} />
          <stop offset="72%" stopColor={color.hex} />
          <stop offset="100%" stopColor={color.sheen} stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id={`shade-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.22" />
          <stop offset="26%" stopColor="#000000" stopOpacity="0" />
          <stop offset="74%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
        </linearGradient>
        <filter id={`grain-${uid}`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed % 97} />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.08" />
          </feComponentTransfer>
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <filter id={`soft-${uid}`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <clipPath id={`clip-${uid}`}>
          <path d={garmentPath(product.fit)} />
        </clipPath>
      </defs>

      <rect width="600" height="800" fill={`url(#bg-${uid})`} />
      <rect width="600" height="800" fill={`url(#vignette-${uid})`} />

      {view === "fabric" ? (
        <FabricSwatch uid={uid} color={color} motif={motif} />
      ) : isAccessory ? (
        <AccessoryArt uid={uid} slug={product.slug} color={color} seed={seed} />
      ) : (
        <>
          {/* Hanger — reads as a studio shot rather than a floating garment. */}
          <g stroke="#B9AB98" strokeWidth="3" fill="none" strokeLinecap="round">
            <path d={`M ${CX} 96 C ${CX - 16} 84, ${CX - 16} 62, ${CX} 60 C ${CX + 14} 58, ${CX + 16} 74, ${CX + 6} 78`} />
            <path d={`M ${CX} 96 L ${CX - g.shoulder - 4} ${SHOULDER_Y - 2} M ${CX} 96 L ${CX + g.shoulder + 4} ${SHOULDER_Y - 2}`} />
          </g>

          {/* Floor shadow. */}
          <ellipse
            cx={CX}
            cy={g.hemY + 34}
            rx={g.hem + 60}
            ry="26"
            fill="#000000"
            opacity="0.55"
            filter={`url(#soft-${uid})`}
          />

          <path d={garmentPath(product.fit)} fill={`url(#cloth-${uid})`} />

          <g clipPath={`url(#clip-${uid})`}>
            <path d={garmentPath(product.fit)} fill={`url(#shade-${uid})`} />
            {foldPaths(product.fit, seed).map((d, index) => (
              <path
                key={index}
                d={d}
                fill="none"
                stroke={color.sheen}
                strokeOpacity={index % 2 === 0 ? 0.4 : 0.24}
                strokeWidth={index % 2 === 0 ? 9 : 5}
                strokeLinecap="round"
              />
            ))}
            {view === "back" ? (
              <GarmentBack product={product} color={color} />
            ) : (
              <GarmentFront product={product} color={color} motif={motif} />
            )}
            <rect width="600" height="800" filter={`url(#grain-${uid})`} fill={color.hex} opacity="0.5" />
          </g>

          <path
            d={garmentPath(product.fit)}
            fill="none"
            stroke="#2A241E"
            strokeOpacity="0.18"
            strokeWidth="1.5"
          />
        </>
      )}
    </svg>
  );
}

function GarmentFront({
  product,
  color,
  motif,
}: {
  product: Product;
  color: ColorOption;
  motif: Motif;
}) {
  const g = geometryByFit[product.fit];
  const gold = "#C8A878";
  const opensAtFront =
    product.category === "abaya" || product.category === "set" || product.fit === "kimono";

  return (
    <g>
      {/* Neckline facing. */}
      <path
        d={`M ${CX - g.neck} ${NECK_Y} Q ${CX} ${NECK_Y + 34}, ${CX + g.neck} ${NECK_Y} Q ${CX} ${NECK_Y + 52}, ${CX - g.neck} ${NECK_Y} Z`}
        fill={color.sheen}
        opacity="0.55"
      />

      {opensAtFront && (
        <>
          {/* Front opening: a placket line plus a lifted right panel. */}
          <path
            d={`M ${CX} ${NECK_Y + 30} L ${CX - 4} ${g.hemY + 6}`}
            stroke="#000"
            strokeOpacity="0.3"
            strokeWidth="2"
            fill="none"
          />
          <path
            d={`M ${CX + 2} ${NECK_Y + 30} L ${CX + 26} ${g.hemY} L ${CX + g.hem} ${g.hemY + 4} L ${CX + g.waist + 8} ${UNDERARM_Y} Z`}
            fill={color.sheen}
            opacity="0.16"
          />
        </>
      )}

      {motif === "pleats" && (
        <g stroke={color.sheen} strokeOpacity="0.5" strokeWidth="2" fill="none">
          {Array.from({ length: 17 }, (_, index) => {
            const t = index / 16;
            const top = CX - g.waist + g.waist * 2 * t;
            const bottom = CX - g.hem + g.hem * 2 * t;
            return <path key={index} d={`M ${top} ${UNDERARM_Y - 6} L ${bottom} ${g.hemY + 10}`} />;
          })}
        </g>
      )}

      {motif === "pearls" && (
        <g fill="#F6F1E7" stroke="#CBBFA9" strokeWidth="0.8">
          {Array.from({ length: 24 }, (_, index) => (
            <circle key={`p-${index}`} cx={CX - 3} cy={NECK_Y + 48 + index * 23} r="4.2" />
          ))}
          {Array.from({ length: 5 }, (_, index) => (
            <circle key={`lc-${index}`} cx={CX - g.sleeveReach + 22 + index * 6} cy={g.cuffTop + 8 + index * 3} r="3.4" />
          ))}
          {Array.from({ length: 5 }, (_, index) => (
            <circle key={`rc-${index}`} cx={CX + g.sleeveReach - 22 - index * 6} cy={g.cuffTop + 8 + index * 3} r="3.4" />
          ))}
        </g>
      )}

      {motif === "embroidery" && (
        <g stroke={color.sheen} strokeOpacity="0.85" strokeWidth="2.4" fill="none" strokeLinecap="round">
          <path d={`M ${CX - g.sleeveReach + 40} ${g.cuffTop - 10} C ${CX - 150} ${400}, ${CX - 118} ${290}, ${CX - 74} ${196}`} />
          {Array.from({ length: 7 }, (_, index) => {
            const t = index / 6;
            const x = CX - g.sleeveReach + 40 + (g.sleeveReach - 114) * t;
            const y = g.cuffTop - 10 - (g.cuffTop - 206) * t;
            return (
              <g key={index} transform={`translate(${x} ${y})`}>
                <circle r="7" strokeOpacity="0.7" />
                <path d="M 0 -12 L 0 12 M -12 0 L 12 0" strokeOpacity="0.5" strokeWidth="1.6" />
              </g>
            );
          })}
        </g>
      )}

      {motif === "sadu" && (
        <g>
          {[
            { y: g.hemY - 78, w: g.hem * 2 - 20 },
            { y: g.cuffTop - 6, w: 92 },
          ].map((band, bandIndex) => (
            <g key={bandIndex}>
              <rect
                x={bandIndex === 0 ? CX - band.w / 2 : CX - g.sleeveReach + 10}
                y={band.y}
                width={band.w}
                height="34"
                fill={color.sheen}
                opacity="0.28"
              />
              {Array.from({ length: 14 }, (_, index) => {
                const startX = (bandIndex === 0 ? CX - band.w / 2 : CX - g.sleeveReach + 10) + index * (band.w / 14);
                return (
                  <path
                    key={index}
                    d={`M ${startX} ${band.y + 34} L ${startX + band.w / 28} ${band.y} L ${startX + band.w / 14} ${band.y + 34}`}
                    fill="none"
                    stroke={gold}
                    strokeOpacity="0.55"
                    strokeWidth="1.8"
                  />
                );
              })}
            </g>
          ))}
        </g>
      )}

      {(motif === "zari" || motif === "talli" || product.category === "mukhawar") && (
        <g>
          {/* Square yoke, the defining feature of a mukhawar. */}
          <rect
            x={CX - 96}
            y={NECK_Y + 26}
            width="192"
            height="152"
            rx="6"
            fill={motif === "talli" ? "#7A5C33" : gold}
            opacity={motif === "velvet" ? 0.42 : 0.6}
          />
          <rect
            x={CX - 96}
            y={NECK_Y + 26}
            width="192"
            height="152"
            rx="6"
            fill="none"
            stroke={gold}
            strokeOpacity="0.9"
            strokeWidth="2"
          />
          {Array.from({ length: 4 }, (_, row) =>
            Array.from({ length: 5 }, (_, col) => (
              <g
                key={`${row}-${col}`}
                transform={`translate(${CX - 76 + col * 38} ${NECK_Y + 54 + row * 36})`}
                stroke="#F0E2C6"
                strokeOpacity="0.8"
                strokeWidth="1.6"
                fill="none"
              >
                <path d="M -9 0 L 0 -9 L 9 0 L 0 9 Z" />
                <circle r="2.2" fill="#F0E2C6" stroke="none" />
              </g>
            )),
          )}
          {/* Cuff bands. */}
          {[-1, 1].map((side) => (
            <rect
              key={side}
              x={CX + side * (g.sleeveReach - 6) - (side === -1 ? 0 : 56)}
              y={g.cuffTop - 4}
              width="56"
              height="30"
              fill={gold}
              opacity="0.55"
            />
          ))}
          {motif === "talli" && (
            <g stroke="#E4C98F" strokeOpacity="0.85" strokeWidth="2" fill="none">
              {Array.from({ length: 26 }, (_, index) => (
                <path
                  key={index}
                  d={`M ${CX - 96 + index * 7.6} ${NECK_Y + 26} l 3.8 6 l -3.8 6 l 3.8 6`}
                />
              ))}
              <path d={`M ${CX - g.hem + 14} ${g.hemY - 54} L ${CX + g.hem - 14} ${g.hemY - 54}`} strokeWidth="6" strokeOpacity="0.5" />
              <path d={`M ${CX - g.hem + 14} ${g.hemY - 42} L ${CX + g.hem - 14} ${g.hemY - 42}`} strokeDasharray="6 5" />
            </g>
          )}
        </g>
      )}
    </g>
  );
}

function GarmentBack({ product, color }: { product: Product; color: ColorOption }) {
  const g = geometryByFit[product.fit];
  return (
    <g>
      {/* Neck facing sits higher at the back than the front. */}
      <path
        d={`M ${CX - g.neck} ${NECK_Y} Q ${CX} ${NECK_Y + 18}, ${CX + g.neck} ${NECK_Y} Q ${CX} ${NECK_Y + 32}, ${CX - g.neck} ${NECK_Y} Z`}
        fill={color.sheen}
        opacity="0.5"
      />
      {/* Centre back seam. */}
      <path
        d={`M ${CX} ${NECK_Y + 24} L ${CX} ${g.hemY + 8}`}
        stroke="#000"
        strokeOpacity="0.22"
        strokeWidth="2"
        fill="none"
      />
      <path
        d={`M ${CX + 3} ${NECK_Y + 24} L ${CX + 3} ${g.hemY + 8}`}
        stroke={color.sheen}
        strokeOpacity="0.4"
        strokeWidth="2"
        fill="none"
      />
      {/* Yoke seam across the shoulder blades. */}
      <path
        d={`M ${CX - g.waist - 4} ${UNDERARM_Y - 34} Q ${CX} ${UNDERARM_Y - 14}, ${CX + g.waist + 4} ${UNDERARM_Y - 34}`}
        fill="none"
        stroke={color.sheen}
        strokeOpacity="0.4"
        strokeWidth="2.5"
      />
      {/* Hem facing. */}
      <path
        d={`M ${CX - g.hem} ${g.hemY - 26} Q ${CX} ${g.hemY - 4}, ${CX + g.hem} ${g.hemY - 26}`}
        fill="none"
        stroke={color.sheen}
        strokeOpacity="0.3"
        strokeWidth="3"
      />
    </g>
  );
}

function AccessoryArt({
  uid,
  slug,
  color,
  seed,
}: {
  uid: string;
  slug: string;
  color: ColorOption;
  seed: number;
}) {
  if (slug === "pearl-drop-belt") {
    return (
      <g>
        <ellipse cx="300" cy="620" rx="180" ry="26" fill="#000000" opacity="0.55" filter={`url(#soft-${uid})`} />
        <path
          d="M 120 300 C 220 200, 380 200, 480 300 C 540 360, 460 452, 340 430 C 220 408, 168 470, 220 540 C 260 594, 372 604, 452 566"
          fill="none"
          stroke={`url(#cloth-${uid})`}
          strokeWidth="34"
          strokeLinecap="round"
        />
        <path
          d="M 120 300 C 220 200, 380 200, 480 300 C 540 360, 460 452, 340 430 C 220 408, 168 470, 220 540 C 260 594, 372 604, 452 566"
          fill="none"
          stroke={color.sheen}
          strokeOpacity="0.4"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {[
          [120, 300],
          [452, 566],
        ].map(([cx, cy], index) => (
          <g key={index}>
            <path d={`M ${cx} ${cy} l 0 34`} stroke="#C8A878" strokeWidth="2" />
            <circle cx={cx} cy={cy + 44} r="13" fill="#F6F1E7" stroke="#CBBFA9" strokeWidth="1.2" />
            <circle cx={cx - 4} cy={cy + 40} r="4" fill="#FFFFFF" opacity="0.8" />
          </g>
        ))}
      </g>
    );
  }

  if (slug === "satin-underscarf") {
    return (
      <g>
        <ellipse cx="300" cy="618" rx="150" ry="24" fill="#000000" opacity="0.55" filter={`url(#soft-${uid})`} />
        <path
          d="M 300 176 C 404 176, 452 258, 452 356 C 452 470, 396 566, 300 578 C 204 566, 148 470, 148 356 C 148 258, 196 176, 300 176 Z"
          fill={`url(#cloth-${uid})`}
        />
        <path
          d="M 300 176 C 404 176, 452 258, 452 356 C 452 470, 396 566, 300 578 C 204 566, 148 470, 148 356 C 148 258, 196 176, 300 176 Z"
          fill={`url(#shade-${uid})`}
        />
        <path
          d="M 168 296 C 250 262, 350 262, 432 296"
          fill="none"
          stroke={color.sheen}
          strokeOpacity="0.55"
          strokeWidth="16"
        />
        <path
          d="M 196 214 C 258 190, 342 190, 404 214"
          fill="none"
          stroke={color.sheen}
          strokeOpacity="0.35"
          strokeWidth="7"
        />
      </g>
    );
  }

  // Sheila: folded over a studio rail, the way a scarf is actually displayed.
  const sway = ((seed % 18) - 9) * 0.8;
  return (
    <g>
      <ellipse cx="300" cy="722" rx="150" ry="22" fill="#000000" opacity="0.55" filter={`url(#soft-${uid})`} />

      {/* Rail */}
      <path d="M 120 152 L 480 152" stroke="#B9AB98" strokeWidth="5" strokeLinecap="round" />
      <circle cx="120" cy="152" r="6" fill="#B9AB98" />
      <circle cx="480" cy="152" r="6" fill="#B9AB98" />

      {/* Back panel */}
      <path
        d={`M 214 154 C 200 330, ${186 + sway} 500, 176 676 Q 300 708, 424 676 C ${414 - sway} 500, 400 330, 386 154 Z`}
        fill={`url(#cloth-${uid})`}
      />
      <path
        d={`M 214 154 C 200 330, ${186 + sway} 500, 176 676 Q 300 708, 424 676 C ${414 - sway} 500, 400 330, 386 154 Z`}
        fill={`url(#shade-${uid})`}
      />

      {/* Front panel, narrower and lifted so the drape reads as two layers */}
      <path
        d={`M 250 154 C 242 340, ${232 - sway} 500, 240 646 Q 300 672, 360 646 C ${368 + sway} 500, 358 340, 350 154 Z`}
        fill={color.sheen}
        opacity="0.34"
      />

      {/* Fold over the rail */}
      <path
        d="M 214 154 Q 300 178, 386 154 Q 300 200, 214 154 Z"
        fill={color.sheen}
        opacity="0.6"
      />

      {/* Soft vertical folds */}
      <g stroke={color.sheen} strokeOpacity="0.35" strokeWidth="7" strokeLinecap="round" fill="none">
        <path d={`M 262 190 C 254 360, 250 520, 256 650`} />
        <path d={`M 300 190 C 300 360, 300 520, 300 660`} strokeOpacity="0.2" />
        <path d={`M 338 190 C 346 360, 350 520, 344 650`} />
      </g>

      {/* Hand-rolled hem */}
      <path
        d="M 176 676 Q 300 708, 424 676"
        fill="none"
        stroke={color.sheen}
        strokeOpacity="0.7"
        strokeWidth="4"
        strokeDasharray="10 7"
      />
    </g>
  );
}

function FabricSwatch({ uid, color, motif }: { uid: string; color: ColorOption; motif: Motif }) {
  return (
    <g>
      <rect width="600" height="800" fill={`url(#cloth-${uid})`} />

      {/* Twill: paired light and dark diagonals so the weave reads on any colour. */}
      <g strokeWidth="2">
        {Array.from({ length: 84 }, (_, index) => {
          const offset = index * 18 - 700;
          return (
            <g key={index}>
              <path d={`M ${offset} 800 L ${offset + 800} 0`} stroke={color.sheen} strokeOpacity="0.34" />
              <path
                d={`M ${offset + 7} 800 L ${offset + 807} 0`}
                stroke="#000000"
                strokeOpacity="0.14"
              />
            </g>
          );
        })}
      </g>
      <g stroke="#000000" strokeOpacity="0.07" strokeWidth="1.5">
        {Array.from({ length: 45 }, (_, index) => (
          <path key={index} d={`M 0 ${index * 18} L 600 ${index * 18}`} />
        ))}
      </g>

      {motif === "velvet" && (
        <rect width="600" height="800" fill={color.sheen} opacity="0.16" filter={`url(#soft-${uid})`} />
      )}
      <rect width="600" height="800" filter={`url(#grain-${uid})`} fill={color.hex} opacity="0.7" />

      {/* Selvedge fold across the swatch. */}
      <path d="M -20 520 C 160 462, 440 578, 620 496 L 620 800 L -20 800 Z" fill="#000" opacity="0.2" />
      <path
        d="M -20 520 C 160 462, 440 578, 620 496"
        fill="none"
        stroke={color.sheen}
        strokeOpacity="0.75"
        strokeWidth="12"
      />
      <path
        d="M -20 536 C 160 478, 440 594, 620 512"
        fill="none"
        stroke="#000000"
        strokeOpacity="0.12"
        strokeWidth="18"
      />
    </g>
  );
}
