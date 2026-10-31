import { drawThemePanel, FONT, STICKER_SIZE } from "./draw";
import { type FrameId, framePath, SAFE_SCALE, type ThemeId } from "./frames";
import type { BadgeHandoff, CellStatus } from "./handoff";

export type BadgeKind = "letter" | "alphabet";

export type BadgeSpec = {
  kind: BadgeKind;
  badge: BadgeHandoff;
  letter: string;
  frame: FrameId;
  theme: ThemeId;
  footer: string;
};

/** Green done, red still to do, grey no event exists: same language as the Alphabeteer grid */
const CELL: Record<CellStatus, string> = { done: "#15803d", todo: "#dc2626", none: "#94a3b8" };

function assertNever(x: never): never {
  throw new Error(`Unhandled badge: ${String(x)}`);
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

function cell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  status: CellStatus,
  s: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, s * 0.02);
  ctx.fillStyle = CELL[status];
  ctx.fill();
  ctx.lineWidth = s * 0.005;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.stroke();
}

/** One completed letter: big green cell, first event that completed it, date, progress */
function drawLetter(ctx: CanvasRenderingContext2D, spec: BadgeSpec, s: number) {
  const c = spec.badge.cells.find((l) => l.letter === spec.letter);
  const box = s * 0.3;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = `800 ${s * 0.034}px ${FONT}`;
  ctx.fillText("PARKRUN ALPHABETEER", s / 2, s * 0.22, s * 0.5);
  cell(ctx, (s - box) / 2, s * 0.27, box, box, c?.status ?? "todo", s);
  ctx.fillStyle = "#fff";
  ctx.font = `900 ${s * 0.24}px ${FONT}`;
  ctx.fillText(spec.letter, s / 2, s * 0.27 + box / 2 + s * 0.01);
  ctx.font = `900 ${s * 0.068}px ${FONT}`;
  ctx.fillText(c?.event ?? "Still to run", s / 2, s * 0.645, s * 0.62);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = `700 ${s * 0.04}px ${FONT}`;
  if (c?.date) ctx.fillText(formatDate(c.date), s / 2, s * 0.705, s * 0.5);
  ctx.font = `800 ${s * 0.034}px ${FONT}`;
  ctx.fillText(`${spec.badge.done} / ${spec.badge.possible} letters`, s / 2, s * 0.765, s * 0.46);
  ctx.font = `700 ${s * 0.026}px ${FONT}`;
  ctx.fillText(spec.footer, s / 2, s * 0.81, s * 0.4);
}

/** Every letter as a red / green / grey cell with the first event and date in each done cell */
function drawAlphabet(ctx: CanvasRenderingContext2D, spec: BadgeSpec, s: number) {
  const cols = 6;
  const gap = s * 0.012;
  const [x0, y0, gw, gh] = [s * 0.1, s * 0.22, s * 0.8, s * 0.64];
  const rows = Math.ceil(spec.badge.cells.length / cols);
  const w = (gw - gap * (cols - 1)) / cols;
  const h = (gh - gap * (rows - 1)) / rows;

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = `800 ${s * 0.032}px ${FONT}`;
  ctx.fillText("PARKRUN ALPHABETEER", s / 2, s * 0.115, s * 0.6);
  ctx.fillStyle = "#fff";
  ctx.font = `900 ${s * 0.056}px ${FONT}`;
  ctx.fillText(`${spec.badge.done} / ${spec.badge.possible} letters`, s / 2, s * 0.17, s * 0.6);

  spec.badge.cells.forEach((l, i) => {
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, spec.badge.cells.length - row * cols);
    // centre a short last row (26 letters = 4 rows of 6 + 2)
    const x = x0 + ((cols - inRow) * (w + gap)) / 2 + (i % cols) * (w + gap);
    const y = y0 + row * (h + gap);
    cell(ctx, x, y, w, h, l.status, s);
    ctx.fillStyle = "#fff";
    ctx.font = `900 ${s * 0.05}px ${FONT}`;
    ctx.fillText(l.letter, x + w / 2, y + h * (l.event ? 0.36 : 0.52));
    if (!l.event) return;
    ctx.font = `700 ${s * 0.016}px ${FONT}`;
    ctx.fillText(l.event, x + w / 2, y + h * 0.68, w * 0.9);
    if (l.date) {
      ctx.font = `600 ${s * 0.014}px ${FONT}`;
      ctx.fillText(formatDate(l.date), x + w / 2, y + h * 0.84, w * 0.9);
    }
  });

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = `700 ${s * 0.027}px ${FONT}`;
  ctx.fillText(spec.footer, s / 2, s * 0.905, s * 0.6);
}

/** Render an Alphabeteer badge onto `canvas` (square, transparent outside the frame). */
export function drawBadge(canvas: HTMLCanvasElement, spec: BadgeSpec, s = STICKER_SIZE): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = s;
  canvas.height = s;
  ctx.clearRect(0, 0, s, s);
  // the grid needs a square panel; letter badges use the chosen shape
  const frame: FrameId = spec.kind === "alphabet" ? "rounded" : spec.frame;
  drawThemePanel(ctx, new Path2D(framePath(frame, s, s * 0.045)), spec.theme, s);

  const k = SAFE_SCALE[frame];
  ctx.save();
  ctx.translate(s / 2, s / 2);
  ctx.scale(k, k);
  ctx.translate(-s / 2, -s / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  switch (spec.kind) {
    case "letter":
      drawLetter(ctx, spec, s);
      break;
    case "alphabet":
      drawAlphabet(ctx, spec, s);
      break;
    default:
      assertNever(spec.kind);
  }
  ctx.restore();
}
