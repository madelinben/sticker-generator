import type { TrackPoint } from "./gpx";

/** Contract other tools (e.g. the Strava dashboard) use to open the sticker maker pre-filled. */
export const HANDOFF_KEY = "gotc:sticker-handoff";

export type Handoff = {
  title: string;
  distanceM: number;
  durationS: number | null;
  elevGainM: number | null;
  points: TrackPoint[];
};

/** Read and clear a pending handoff (one-shot). */
export function takeHandoff(): Handoff | null {
  try {
    const raw = sessionStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(HANDOFF_KEY);
    return JSON.parse(raw) as Handoff;
  } catch {
    return null;
  }
}
