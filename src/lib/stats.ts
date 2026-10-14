import type { TrackPoint } from "./gpx";

export type Stats = { distanceM: number; durationS: number | null; elevGainM: number | null };

const R = 6_371_000;
const rad = (d: number) => (d * Math.PI) / 180;

export function haversine(a: TrackPoint, b: TrackPoint): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function computeStats(pts: TrackPoint[]): Stats {
  let distanceM = 0;
  let gain = 0;
  let hasEle = false;
  for (let i = 1; i < pts.length; i++) {
    distanceM += haversine(pts[i - 1], pts[i]);
    const [a, b] = [pts[i - 1].ele, pts[i].ele];
    if (a !== null && b !== null) {
      hasEle = true;
      if (b > a) gain += b - a;
    }
  }
  const first = pts[0]?.time ?? null;
  const last = pts[pts.length - 1]?.time ?? null;
  return {
    distanceM,
    durationS: first !== null && last !== null && last > first ? (last - first) / 1000 : null,
    elevGainM: hasEle ? gain : null,
  };
}

export const formatDistance = (m: number) => `${(m / 1000).toFixed(m >= 100_000 ? 0 : 2)} km`;

export function formatDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.round(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}

/** min/km, e.g. "5:30 /km"; null when distance or time is missing. */
export function formatPace(s: number | null, distanceM: number): string | null {
  if (s === null || distanceM <= 0) return null;
  const perKm = s / (distanceM / 1000);
  const m = Math.floor(perKm / 60);
  return `${m}:${String(Math.round(perKm % 60)).padStart(2, "0")} /km`;
}

const DISTANCE_BADGES: [number, string][] = [
  [42_195, "Marathon"],
  [21_097, "Half marathon"],
  [10_000, "10K"],
  [5_000, "5K"],
];
const CLIMB_BADGES: [number, string][] = [
  [1000, "1000m climb"],
  [500, "500m climb"],
  [100, "100m climb"],
];

/** Highest distance badge reached plus highest climb badge reached. */
export function achievements(s: Stats): string[] {
  const dist = DISTANCE_BADGES.find(([min]) => s.distanceM >= min)?.[1];
  const gain = s.elevGainM;
  const climb = gain === null ? undefined : CLIMB_BADGES.find(([min]) => gain >= min)?.[1];
  return [dist, climb].filter((b): b is string => b !== undefined);
}
