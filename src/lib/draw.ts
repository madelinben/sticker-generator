import { drawMetal, METALS, type MetalId, ringText } from "./drawMedal";
import { drawRoute, type RouteInk } from "./drawRoute";
import { type FrameId, framePath, THEMES, type ThemeId } from "./frames";
import type { TrackPoint } from "./gpx";
import type { RouteOptions } from "./route3d";

export type StatItem = { label: string; value: string };

export type LookId = "sticker" | "medal";

export type StickerSpec = {
  title: string;
  stats: StatItem[]; // up to 3 shown
  badges: string[]; // up to 2 shown
  points: TrackPoint[];
  frame: FrameId;
  theme: ThemeId;
  look: LookId;
  metal: MetalId;
  route: RouteOptions;
  footer: string;
};

export const STICKER_SIZE = 1024;

const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

type Palette = { fg: string; soft: string; pill: string; route: RouteInk };

const STICKER_PALETTE: Palette = {
  fg: "#fff",
  soft: "rgba(255,255,255,0.8)",
  pill: "rgba(255,255,255,0.24)",
  route: { line: "#fff", shadow: "rgba(0,0,0,0.25)", wall: "rgba(255,255,255,0.22)" },
};

function pill(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  s: number,
  p: Palette
) {
  ctx.font = `800 ${s * 0.032}px ${FONT}`;
  const w = ctx.measureText(text).width + s * 0.05;
  const h = s * 0.055;
  ctx.fillStyle = p.pill;
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, y - h / 2, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = p.fg;
  ctx.fillText(text, cx, y + s * 0.001);
}

function drawBackground(ctx: CanvasRenderingContext2D, spec: StickerSpec, path: Path2D, s: number) {
  if (spec.look === "medal") {
    const metal = METALS.find((m) => m.id === spec.metal) ?? METALS[0];
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = s * 0.025;
    ctx.shadowOffsetY = s * 0.012;
    ctx.fillStyle = metal.lo;
    ctx.fill(path);
    ctx.restore();
    drawMetal(ctx, path, metal, s);
    return;
  }
  const theme = THEMES.find((t) => t.id === spec.theme) ?? THEMES[0];
  // white sticker edge with a soft drop shadow
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = s * 0.02;
  ctx.shadowOffsetY = s * 0.01;
  ctx.fillStyle = "#fff";
  ctx.fill(path);
  ctx.restore();

  // coloured panel, clipped so the white edge stays visible
  ctx.save();
  ctx.clip(path);
  const g = ctx.createLinearGradient(0, 0, s, s);
  g.addColorStop(0, theme.from);
  g.addColorStop(1, theme.to);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  ctx.lineWidth = s * 0.07;
  ctx.strokeStyle = "#fff";
  ctx.stroke(path);
  ctx.restore();
}

/** Render a sticker onto `canvas` (square, transparent outside the frame). */
export function drawSticker(canvas: HTMLCanvasElement, spec: StickerSpec, s = STICKER_SIZE): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = s;
  canvas.height = s;
  ctx.clearRect(0, 0, s, s);

  const medal = spec.look === "medal";
  const metal = METALS.find((m) => m.id === spec.metal) ?? METALS[0];
  const pal: Palette = medal
    ? {
        fg: metal.ink,
        soft: metal.ink,
        pill: "rgba(255,255,255,0.3)",
        route: { line: metal.ink, shadow: "rgba(255,255,255,0.55)", wall: `${metal.ink}33` },
      }
    : STICKER_PALETTE;

  drawBackground(ctx, spec, new Path2D(framePath(spec.frame, s, s * 0.045)), s);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // route (or the headline stat when there is no track)
  const box = medal
    ? { x: s * 0.24, y: s * 0.2, w: s * 0.52, h: s * 0.34 }
    : { x: s * 0.2, y: s * 0.13, w: s * 0.6, h: s * 0.36 };
  const drew = drawRoute(ctx, spec.points, spec.route, box, pal.route, s);
  if (!drew && spec.stats[0]) {
    ctx.fillStyle = pal.fg;
    ctx.font = `900 ${s * 0.17}px ${FONT}`;
    ctx.fillText(spec.stats[0].value, s / 2, medal ? s * 0.37 : s * 0.36, s * 0.7);
  }

  if (medal) {
    ringText(ctx, spec.title || "My activity", metal, s, false);
    ringText(ctx, spec.footer || "get-out-there.app", metal, s, true);
  } else {
    ctx.fillStyle = pal.fg;
    ctx.font = `900 ${s * 0.065}px ${FONT}`;
    ctx.fillText(spec.title || "My activity", s / 2, s * 0.565, s * 0.6);
  }

  const [badgeY, labelY, valueY] = medal ? [0.6, 0.665, 0.71] : [0.625, 0.69, 0.735];
  const badges = spec.badges.slice(0, 2);
  for (const [i, b] of badges.entries()) {
    pill(ctx, b, s / 2 + (i - (badges.length - 1) / 2) * s * 0.3, s * badgeY, s, pal);
  }

  const stats = spec.stats.slice(0, 3);
  stats.forEach((st, i) => {
    const x = s / 2 + (i - (stats.length - 1) / 2) * s * 0.19;
    ctx.fillStyle = pal.soft;
    ctx.font = `700 ${s * 0.027}px ${FONT}`;
    ctx.fillText(st.label.toUpperCase(), x, s * labelY);
    ctx.fillStyle = pal.fg;
    ctx.font = `900 ${s * (medal ? 0.043 : 0.05)}px ${FONT}`;
    ctx.fillText(st.value, x, s * valueY, s * 0.18);
  });

  if (!medal) {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = `700 ${s * 0.027}px ${FONT}`;
    ctx.fillText(spec.footer || "get-out-there.app", s / 2, s * 0.8, s * 0.46);
  }
}
