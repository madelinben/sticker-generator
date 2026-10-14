import type { TrackPoint } from "./gpx";

export type Box = { x: number; y: number; w: number; h: number };

/** Fit a GPS track into `box` (aspect preserved, centred, north up). Returns canvas coordinates. */
export function fitTrack(pts: TrackPoint[], box: Box): [number, number][] {
  if (pts.length < 2) return [];
  const lat0 = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
  const k = Math.cos((lat0 * Math.PI) / 180);
  const xy = pts.map((p): [number, number] => [p.lon * k, -p.lat]);
  const xs = xy.map((p) => p[0]);
  const ys = xy.map((p) => p[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const spanX = maxX - minX || 1e-9;
  const spanY = maxY - minY || 1e-9;
  const scale = Math.min(box.w / spanX, box.h / spanY);
  const offX = box.x + (box.w - spanX * scale) / 2;
  const offY = box.y + (box.h - spanY * scale) / 2;
  return xy.map(([x, y]) => [offX + (x - minX) * scale, offY + (y - minY) * scale]);
}

/** Thin a long track so canvas drawing stays cheap. */
export function thin<T>(items: T[], max: number): T[] {
  if (items.length <= max) return items;
  const step = (items.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => items[Math.round(i * step)]);
}
