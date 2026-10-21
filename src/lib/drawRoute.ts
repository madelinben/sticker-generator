import type { TrackPoint } from "./gpx";
import type { Box } from "./project";
import { thin } from "./project";
import { project, type RouteOptions, sliceByDistance, toLocal } from "./route3d";

export type RouteInk = { line: string; shadow: string; wall: string };

/** Paint the selected section of the track as a flat map, a 3D ribbon or a side profile. */
export function drawRoute(
  ctx: CanvasRenderingContext2D,
  points: TrackPoint[],
  o: RouteOptions,
  box: Box,
  ink: RouteInk,
  s: number
): boolean {
  const section = thin(sliceByDistance(points, o.from, o.to), 240);
  if (section.length < 2) return false;
  const { line, base, depth } = project(toLocal(section), o, box);
  const trace = (pts: [number, number][]) => {
    ctx.beginPath();
    for (const [i, [x, y]] of pts.entries()) {
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
  };

  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  if (o.wall && o.tilt < 85) {
    // curtain strips, farthest first so nearer ones overlap
    const order = line
      .slice(1)
      .map((_, i) => i + 1)
      .sort((a, b) => depth[b] - depth[a]);
    ctx.fillStyle = ink.wall;
    ctx.strokeStyle = ink.wall;
    ctx.lineWidth = s * 0.003;
    for (const i of order) {
      ctx.beginPath();
      ctx.moveTo(...line[i - 1]);
      ctx.lineTo(...line[i]);
      ctx.lineTo(...base[i]);
      ctx.lineTo(...base[i - 1]);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    trace(base);
    ctx.strokeStyle = ink.shadow;
    ctx.lineWidth = s * 0.008 * o.width;
    ctx.stroke();
  }

  trace(line);
  ctx.strokeStyle = ink.shadow;
  ctx.lineWidth = s * 0.03 * o.width;
  ctx.stroke();
  ctx.strokeStyle = ink.line;
  ctx.lineWidth = s * 0.018 * o.width;
  ctx.stroke();

  if (o.markers) {
    const dot = (p: [number, number], hollow: boolean) => {
      ctx.beginPath();
      ctx.arc(p[0], p[1], s * 0.02 * Math.max(o.width, 0.6), 0, Math.PI * 2);
      ctx.fillStyle = hollow ? ink.shadow : ink.line;
      ctx.fill();
      ctx.lineWidth = s * 0.008;
      ctx.strokeStyle = ink.line;
      ctx.stroke();
    };
    dot(line[0], false);
    dot(line[line.length - 1], true);
  }
  return true;
}
