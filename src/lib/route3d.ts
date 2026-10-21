import type { TrackPoint } from "./gpx";
import { type Box, fitPoints } from "./project.ts";
import { haversine } from "./stats.ts";

/** Everything the user can tinker with for the route graphic. */
export type RouteOptions = {
  from: number; // 0..1 along the distance of the track
  to: number;
  yaw: number; // degrees, spins the route about its centre
  tilt: number; // degrees, 90 = straight down (flat map), ~10 = side-on elevation
  relief: number; // elevation exaggeration multiplier, 1 = balanced
  width: number; // line width multiplier
  wall: boolean; // drop a curtain from the route down to the ground
  markers: boolean; // start / finish dots
};

export const DEFAULT_ROUTE: RouteOptions = {
  from: 0,
  to: 1,
  yaw: 0,
  tilt: 90,
  relief: 1,
  width: 1,
  wall: true,
  markers: true,
};

export const VIEW_PRESETS: { label: string; tilt: number; yaw: number }[] = [
  { label: "Top-down", tilt: 90, yaw: 0 },
  { label: "3D", tilt: 55, yaw: -35 },
  { label: "Side", tilt: 10, yaw: 0 },
];

export const MIN_SECTION = 0.05;

const rad = (d: number) => (d * Math.PI) / 180;

export function cumulative(pts: TrackPoint[]): number[] {
  const out = [0];
  for (let i = 1; i < pts.length; i++) out.push(out[i - 1] + haversine(pts[i - 1], pts[i]));
  return out;
}

/** Points whose distance along the track lies in [from, to] (fractions of total distance). */
export function sliceByDistance(pts: TrackPoint[], from: number, to: number): TrackPoint[] {
  const cum = cumulative(pts);
  const total = cum[cum.length - 1];
  return pts.filter((_, i) => cum[i] >= from * total && cum[i] <= to * total);
}

/** Index of the highest point, as a fraction along the track's distance. Null without elevation. */
export function peakFraction(pts: TrackPoint[]): number | null {
  const cum = cumulative(pts);
  let best = -1;
  let at = -1;
  for (const [i, p] of pts.entries()) {
    if (p.ele !== null && p.ele > best) {
      best = p.ele;
      at = i;
    }
  }
  return at < 0 || !cum[cum.length - 1] ? null : cum[at] / cum[cum.length - 1];
}

/** Moving-average elevation to calm GPS noise. Missing elevation reads as 0. */
export function smoothElevation(pts: TrackPoint[], radius = 3): number[] {
  return pts.map((_, i) => {
    const win = pts.slice(Math.max(0, i - radius), i + radius + 1).map((p) => p.ele ?? 0);
    return win.reduce((a, b) => a + b, 0) / win.length;
  });
}

type Vec3 = [number, number, number]; // east m, north m, up m (above lowest point)

export function toLocal(pts: TrackPoint[]): Vec3[] {
  const lat0 = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
  const lon0 = pts.reduce((s, p) => s + p.lon, 0) / pts.length;
  const k = Math.cos(rad(lat0));
  const ele = smoothElevation(pts);
  const floor = Math.min(...ele);
  return pts.map(
    (p, i): Vec3 => [(p.lon - lon0) * k * 111_320, (p.lat - lat0) * 110_574, ele[i] - floor]
  );
}

export type Projected = { line: [number, number][]; base: [number, number][]; depth: number[] };

/** Oblique projection: tilt 90 is a plain map, lower tilt lifts elevation off the page. */
export function project(local: Vec3[], o: RouteOptions, box: Box): Projected {
  const span = Math.max(
    Math.max(...local.map((p) => p[0])) - Math.min(...local.map((p) => p[0])),
    Math.max(...local.map((p) => p[1])) - Math.min(...local.map((p) => p[1])),
    1
  );
  const relief = Math.max(...local.map((p) => p[2]));
  const zScale = relief > 0 ? ((span * 0.35) / relief) * o.relief : 0;
  const [cy, sy, ct, st] = [
    Math.cos(rad(o.yaw)),
    Math.sin(rad(o.yaw)),
    Math.cos(rad(o.tilt)),
    Math.sin(rad(o.tilt)),
  ];
  const depth: number[] = [];
  const raw: [number, number][] = [];
  for (const [x, y, z] of local) {
    const [xr, yr] = [x * cy - y * sy, x * sy + y * cy];
    depth.push(yr);
    raw.push([xr, -(yr * st + z * zScale * ct)]); // line
  }
  const ground = raw.map(([x], i): [number, number] => [x, -(depth[i] * st)]);
  const fitted = fitPoints([...raw, ...ground], box);
  return { line: fitted.slice(0, raw.length), base: fitted.slice(raw.length), depth };
}
