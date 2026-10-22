import { FileUp } from "lucide-react";
import type { LookId } from "../lib/draw";
import { METALS, type MetalId } from "../lib/drawMedal";
import { FRAMES, type FrameId, THEMES, type ThemeId } from "../lib/frames";
import { LANDMARKS, type LandmarkChoice } from "../lib/landmarks";

export type Fields = { distance: string; time: string; pace: string; climb: string };

const FIELD_LABELS: Record<keyof Fields, string> = {
  distance: "Distance",
  time: "Time",
  pace: "Pace",
  climb: "Climb",
};

interface StickerFormProps {
  title: string;
  fields: Fields;
  footer: string;
  frame: FrameId;
  theme: ThemeId;
  look: LookId;
  metal: MetalId;
  landmark: LandmarkChoice;
  hasTrack: boolean;
  error: string;
  onTitle: (v: string) => void;
  onField: (k: keyof Fields, v: string) => void;
  onFooter: (v: string) => void;
  onFrame: (v: FrameId) => void;
  onTheme: (v: ThemeId) => void;
  onLook: (v: LookId) => void;
  onMetal: (v: MetalId) => void;
  onLandmark: (v: LandmarkChoice) => void;
  onFile: (f: File) => void;
}

const inputCls =
  "min-h-11 w-full min-w-0 rounded-xl border-2 border-slate-200 px-3 text-base outline-none focus:border-orange-500";
const chipCls = (on: boolean) =>
  `min-h-11 rounded-xl px-3 text-sm font-bold transition active:scale-[0.97] ${on ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`;

const LOOKS: { id: LookId; label: string }[] = [
  { id: "sticker", label: "Sticker" },
  { id: "medal", label: "Race medal" },
];

export function StickerForm(p: StickerFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 px-3 text-sm font-semibold text-slate-600">
        <FileUp size={18} />
        {p.hasTrack
          ? "Route loaded — choose another GPX"
          : "Add a GPX file (Strava, Garmin, Coros) to draw your route"}
        <input
          type="file"
          accept=".gpx,application/gpx+xml,text/xml"
          className="sr-only"
          onChange={(e) => e.target.files?.[0] && p.onFile(e.target.files[0])}
        />
      </label>
      {p.error && <p className="text-sm text-rose-600">{p.error}</p>}

      <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
        Title
        <input
          className={inputCls}
          value={p.title}
          maxLength={32}
          onChange={(e) => p.onTitle(e.target.value)}
          placeholder="e.g. Chester 10K"
        />
      </label>

      <div className="grid grid-cols-2 gap-2 [&>label]:min-w-0">
        {(Object.keys(FIELD_LABELS) as (keyof Fields)[]).map((k) => (
          <label key={k} className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
            {FIELD_LABELS[k]}
            <input
              className={inputCls}
              value={p.fields[k]}
              maxLength={12}
              onChange={(e) => p.onField(k, e.target.value)}
            />
          </label>
        ))}
      </div>
      <p className="-mt-2 text-xs text-slate-500">
        The first three filled-in fields appear on the sticker.
      </p>

      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-1 text-sm font-semibold text-slate-700">Style</legend>
        {LOOKS.map((l) => (
          <button
            key={l.id}
            type="button"
            aria-pressed={p.look === l.id}
            onClick={() => p.onLook(l.id)}
            className={chipCls(p.look === l.id)}
          >
            {l.label}
          </button>
        ))}
      </fieldset>

      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-1 text-sm font-semibold text-slate-700">
          {p.look === "medal" ? "Metal" : "Colour"}
        </legend>
        {(p.look === "medal" ? METALS : THEMES).map((t) => {
          const on = (p.look === "medal" ? p.metal : p.theme) === t.id;
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={on}
              onClick={() =>
                p.look === "medal" ? p.onMetal(t.id as MetalId) : p.onTheme(t.id as ThemeId)
              }
              className={chipCls(on)}
            >
              {t.label}
            </button>
          );
        })}
      </fieldset>

      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-1 text-sm font-semibold text-slate-700">Shape</legend>
        {FRAMES.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={p.frame === f.id}
            onClick={() => p.onFrame(f.id)}
            className={chipCls(p.frame === f.id)}
          >
            {f.label}
          </button>
        ))}
      </fieldset>

      <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
        Local landmark
        <select
          className={inputCls}
          value={p.landmark}
          onChange={(e) => p.onLandmark(e.target.value as LandmarkChoice)}
        >
          <option value="auto">Auto (from your route)</option>
          <option value="none">None</option>
          {LANDMARKS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
        Footer line
        <input
          className={inputCls}
          value={p.footer}
          maxLength={48}
          onChange={(e) => p.onFooter(e.target.value)}
          placeholder="e.g. Donate: justgiving.com/your-page"
        />
      </label>
    </div>
  );
}
