import { type FrameId, framePath, THEMES, type ThemeId } from "./frames";
import type { TrackPoint } from "./gpx";
import { fitTrack, thin } from "./project";

export type StatItem = { label: string; value: string };

export type StickerSpec = {
  title: string;
  stats: StatItem[]; // up to 3 shown
  badges: string[]; // up to 2 shown
  points: TrackPoint[];
  frame: FrameId;
  theme: ThemeId;
  footer: string;
};

export const STICKER_SIZE = 1024;

const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

function pill(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, s: number) {
  ctx.font = `800 ${s * 0.032}px ${FONT}`;
  const w = ctx.measureText(text).width + s * 0.05;
  const h = s * 0.055;
  ctx.fillStyle = "rgba(255,255,255,0.24)";
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, y - h / 2, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillText(text, cx, y + s * 0.001);
}

/** Render a sticker onto `canvas` (square, transparent outside the frame). */
export function drawSticker(canvas: HTMLCanvasElement, spec: StickerSpec, s = STICKER_SIZE): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = s;
  canvas.height = s;
  ctx.clearRect(0, 0, s, s);

  const theme = THEMES.find((t) => t.id === spec.theme) ?? THEMES[0];
  const path = new Path2D(framePath(spec.frame, s, s * 0.045));

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

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // route (or the headline stat when there is no track)
  const route = fitTrack(thin(spec.points, 600), {
    x: s * 0.2,
    y: s * 0.13,
    w: s * 0.6,
    h: s * 0.36,
  });
  if (route.length) {
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    for (const [i, [x, y]] of route.entries()) {
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = s * 0.03;
    ctx.stroke();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = s * 0.018;
    ctx.stroke();
    const [sx, sy] = route[0];
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(sx, sy, s * 0.02, 0, Math.PI * 2);
    ctx.fill();
  } else if (spec.stats[0]) {
    ctx.fillStyle = "#fff";
    ctx.font = `900 ${s * 0.17}px ${FONT}`;
    ctx.fillText(spec.stats[0].value, s / 2, s * 0.36, s * 0.7);
  }

  ctx.fillStyle = "#fff";
  ctx.font = `900 ${s * 0.065}px ${FONT}`;
  ctx.fillText(spec.title || "My activity", s / 2, s * 0.565, s * 0.6);

  const badges = spec.badges.slice(0, 2);
  for (const [i, b] of badges.entries()) {
    pill(ctx, b, s / 2 + (i - (badges.length - 1) / 2) * s * 0.3, s * 0.625, s);
  }

  const stats = spec.stats.slice(0, 3);
  stats.forEach((st, i) => {
    const x = s / 2 + (i - (stats.length - 1) / 2) * s * 0.19;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = `700 ${s * 0.027}px ${FONT}`;
    ctx.fillText(st.label.toUpperCase(), x, s * 0.69);
    ctx.fillStyle = "#fff";
    ctx.font = `900 ${s * 0.05}px ${FONT}`;
    ctx.fillText(st.value, x, s * 0.735, s * 0.18);
  });

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = `700 ${s * 0.027}px ${FONT}`;
  ctx.fillText(spec.footer || "get-out-there.app", s / 2, s * 0.8, s * 0.46);
}
