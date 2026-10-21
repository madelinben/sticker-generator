export type MetalId = "gold" | "silver" | "bronze" | "graphite";

export const METALS: {
  id: MetalId;
  label: string;
  hi: string;
  mid: string;
  lo: string;
  ink: string;
}[] = [
  { id: "gold", label: "Gold", hi: "#fff3b0", mid: "#e0a82e", lo: "#8a5a12", ink: "#4a2e06" },
  { id: "silver", label: "Silver", hi: "#ffffff", mid: "#b8c0cc", lo: "#6b7280", ink: "#1f2937" },
  { id: "bronze", label: "Bronze", hi: "#f6c79b", mid: "#c9773a", lo: "#7a3a14", ink: "#3b1a07" },
  {
    id: "graphite",
    label: "Graphite",
    hi: "#9ca3af",
    mid: "#4b5563",
    lo: "#111827",
    ink: "#f9fafb",
  },
];

export type Metal = (typeof METALS)[number];

const MAX_SWEEP = Math.PI * 0.8;
const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Brushed-metal face with a bevelled rim, clipped to `path`. */
export function drawMetal(ctx: CanvasRenderingContext2D, path: Path2D, m: Metal, s: number): void {
  ctx.save();
  ctx.clip(path);
  const face = ctx.createLinearGradient(0, 0, s, s);
  face.addColorStop(0, m.hi);
  face.addColorStop(0.45, m.mid);
  face.addColorStop(1, m.lo);
  ctx.fillStyle = face;
  ctx.fillRect(0, 0, s, s);
  const shine = ctx.createRadialGradient(s * 0.35, s * 0.3, 0, s * 0.35, s * 0.3, s * 0.7);
  shine.addColorStop(0, "rgba(255,255,255,0.45)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = shine;
  ctx.fillRect(0, 0, s, s);
  // bevel: dark outer lip, bright inner lip
  ctx.lineWidth = s * 0.06;
  ctx.strokeStyle = m.lo;
  ctx.stroke(path);
  ctx.lineWidth = s * 0.03;
  ctx.strokeStyle = m.hi;
  ctx.stroke(path);
  ctx.restore();
}

/** Engraved ring separating the rim lettering from the face. */
export function drawEngraving(ctx: CanvasRenderingContext2D, m: Metal, s: number): void {
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s * 0.335, 0, Math.PI * 2);
  ctx.lineWidth = s * 0.006;
  ctx.strokeStyle = m.lo;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s * 0.342, 0, Math.PI * 2);
  ctx.strokeStyle = m.hi;
  ctx.stroke();
}

/** Letters along the rim; `bottom` text is flipped so it reads upright. */
export function ringText(
  ctx: CanvasRenderingContext2D,
  text: string,
  m: Metal,
  s: number,
  bottom: boolean
): void {
  const label = text.toUpperCase();
  if (!label) return;
  const r = s * 0.375;
  // shrink long text so top and bottom lettering never meet at the sides
  const base = s * 0.04;
  ctx.font = `900 ${base}px ${FONT}`;
  const natural = [...label].reduce((w, ch) => w + ctx.measureText(ch).width + base * 0.18, 0);
  const size = Math.min(base, (base * r * MAX_SWEEP) / natural);
  ctx.font = `900 ${size}px ${FONT}`;
  const gap = size * 0.18;
  const widths = [...label].map((ch) => ctx.measureText(ch).width + gap);
  const total = widths.reduce((a, b) => a + b, 0);
  const sweep = Math.min(total / r, MAX_SWEEP);
  let a = (bottom ? Math.PI / 2 : -Math.PI / 2) + (bottom ? sweep / 2 : -sweep / 2);
  for (const [i, ch] of [...label].entries()) {
    const step = (widths[i] / total) * sweep;
    a += bottom ? -step / 2 : step / 2;
    ctx.save();
    ctx.translate(s / 2 + r * Math.cos(a), s / 2 + r * Math.sin(a));
    ctx.rotate(a + (bottom ? -Math.PI / 2 : Math.PI / 2));
    ctx.fillStyle = m.hi;
    ctx.fillText(ch, 0, size * 0.04);
    ctx.fillStyle = m.ink;
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    a += bottom ? -step / 2 : step / 2;
  }
}
