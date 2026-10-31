import { useEffect, useMemo, useState } from "react";
import { BadgeForm } from "./components/BadgeForm";
import { RouteControls } from "./components/RouteControls";
import { type BeforeExport, StickerCanvas } from "./components/StickerCanvas";
import { type Fields, StickerForm } from "./components/StickerForm";
import { drawSticker, type LookId, type StickerSpec } from "./lib/draw";
import { type BadgeKind, drawBadge } from "./lib/drawBadge";
import type { MetalId } from "./lib/drawMedal";
import type { FrameId, ThemeId } from "./lib/frames";
import { parseGpx, type TrackPoint } from "./lib/gpx";
import { type BadgeHandoff, takeBadge, takeHandoff } from "./lib/handoff";
import type { LandmarkChoice } from "./lib/landmarks";
import { DEFAULT_ROUTE, type RouteOptions } from "./lib/route3d";
import {
  achievements,
  computeStats,
  formatDistance,
  formatDuration,
  formatPace,
  type Stats,
} from "./lib/stats";

const EMPTY: Fields = { distance: "", time: "", pace: "", climb: "" };
const DEFAULT_FOOTER = "get-out-there.app";

function fieldsFrom(s: Stats): Fields {
  return {
    distance: formatDistance(s.distanceM),
    time: s.durationS === null ? "" : formatDuration(s.durationS),
    pace: formatPace(s.durationS, s.distanceM) ?? "",
    climb: s.elevGainM === null ? "" : `${Math.round(s.elevGainM)} m`,
  };
}

const FIELD_ORDER: (keyof Fields)[] = ["distance", "time", "pace", "climb"];
const LABEL: Record<keyof Fields, string> = {
  distance: "Distance",
  time: "Time",
  pace: "Pace",
  climb: "Climb",
};

export function StickersApp({ beforeExport }: { beforeExport?: BeforeExport }) {
  const [title, setTitle] = useState("");
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [footer, setFooter] = useState(DEFAULT_FOOTER);
  const [frame, setFrame] = useState<FrameId>("scallop");
  const [theme, setTheme] = useState<ThemeId>("sunrise");
  const [look, setLook] = useState<LookId>("sticker");
  const [metal, setMetal] = useState<MetalId>("gold");
  const [landmark, setLandmark] = useState<LandmarkChoice>("auto");
  const [route, setRoute] = useState<RouteOptions>(DEFAULT_ROUTE);
  const [points, setPoints] = useState<TrackPoint[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [badge, setBadge] = useState<BadgeHandoff | null>(null);
  const [badgeKind, setBadgeKind] = useState<BadgeKind>("letter");
  const [badgeLetter, setBadgeLetter] = useState("A");

  // One-shot prefill when another tool (Strava dashboard, parkrun Alphabeteer) sent us here.
  useEffect(() => {
    const b = takeBadge();
    if (b) {
      setBadge(b);
      setBadgeKind(b.letter ? "letter" : "alphabet");
      setBadgeLetter(b.letter ?? b.cells.find((c) => c.status === "done")?.letter ?? "A");
      setTheme("night"); // green / red cells need a contrasting panel
      return;
    }
    const h = takeHandoff();
    if (!h) return;
    const s: Stats = { distanceM: h.distanceM, durationS: h.durationS, elevGainM: h.elevGainM };
    setTitle(h.title);
    setPoints(h.points);
    setStats(s);
    setFields(fieldsFrom(s));
  }, []);

  async function onFile(file: File) {
    setError("");
    const pts = parseGpx(await file.text());
    if (pts.length < 2) {
      setError("No track found in that file. Export the activity as GPX and try again.");
      return;
    }
    const s = computeStats(pts);
    setPoints(pts);
    setRoute((r) => ({ ...r, from: 0, to: 1 }));
    setStats(s);
    setFields(fieldsFrom(s));
    setTitle((t) => t || file.name.replace(/\.gpx$/i, "").slice(0, 32));
  }

  const spec = useMemo<StickerSpec>(() => {
    const known: Stats = stats ?? {
      distanceM: (Number.parseFloat(fields.distance) || 0) * 1000,
      durationS: null,
      elevGainM: Number.parseFloat(fields.climb) || null,
    };
    return {
      title,
      stats: FIELD_ORDER.filter((k) => fields[k].trim()).map((k) => ({
        label: LABEL[k],
        value: fields[k].trim(),
      })),
      badges: achievements(known),
      points,
      frame,
      theme,
      look,
      metal,
      route,
      landmark,
      footer,
    };
  }, [title, fields, footer, frame, theme, look, metal, route, landmark, points, stats]);

  const draw = useMemo(
    () =>
      badge
        ? (c: HTMLCanvasElement) =>
            drawBadge(c, { kind: badgeKind, badge, letter: badgeLetter, frame, theme, footer })
        : (c: HTMLCanvasElement) => drawSticker(c, spec),
    [badge, badgeKind, badgeLetter, frame, theme, footer, spec]
  );
  const fileTitle = badge
    ? badgeKind === "letter"
      ? `parkrun alphabeteer ${badgeLetter}`
      : "parkrun alphabeteer"
    : title;

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)] gap-6 bg-white p-4 md:grid-cols-2">
      <StickerCanvas title={fileTitle} draw={draw} beforeExport={beforeExport} />
      {badge ? (
        <BadgeForm
          kind={badgeKind}
          letter={badgeLetter}
          cells={badge.cells}
          frame={frame}
          theme={theme}
          onKind={setBadgeKind}
          onLetter={setBadgeLetter}
          onFrame={setFrame}
          onTheme={setTheme}
          onExit={() => setBadge(null)}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <StickerForm
            title={title}
            fields={fields}
            footer={footer}
            frame={frame}
            theme={theme}
            look={look}
            metal={metal}
            landmark={landmark}
            hasTrack={points.length > 1}
            error={error}
            onTitle={setTitle}
            onField={(k, v) => setFields((f) => ({ ...f, [k]: v }))}
            onFooter={setFooter}
            onFrame={setFrame}
            onTheme={setTheme}
            onLook={setLook}
            onMetal={setMetal}
            onLandmark={setLandmark}
            onFile={onFile}
          />
          {points.length > 1 && (
            <RouteControls
              points={points}
              route={route}
              onRoute={(patch) => setRoute((r) => ({ ...r, ...patch }))}
            />
          )}
        </div>
      )}
    </div>
  );
}
