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

/** Contract the parkrun Alphabeteer uses to open the badge maker pre-filled. */
export const BADGE_KEY = "gotc:badge-handoff";

export type CellStatus = "done" | "todo" | "none";
export type LetterCell = { letter: string; status: CellStatus; event?: string; date?: string };
export type BadgeHandoff = {
  /** Letter to feature; null opens the full alphabet badge */
  letter: string | null;
  done: number;
  possible: number;
  cells: LetterCell[];
};

/** Read and clear a pending badge handoff (one-shot). */
export function takeBadge(): BadgeHandoff | null {
  try {
    const raw = sessionStorage.getItem(BADGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(BADGE_KEY);
    return JSON.parse(raw) as BadgeHandoff;
  } catch {
    return null;
  }
}

/** Progress as it stood on `date`: letters first done later go back to "todo" and the count follows */
export function badgeAsOf(badge: BadgeHandoff, date: string): BadgeHandoff {
  const cells = badge.cells.map((c) =>
    c.status === "done" && c.date && c.date > date
      ? { letter: c.letter, status: "todo" as const }
      : c
  );
  return { ...badge, cells, done: cells.filter((c) => c.status === "done").length };
}
