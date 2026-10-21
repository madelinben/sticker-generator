import { Mountain } from "lucide-react";
import { useMemo } from "react";
import type { TrackPoint } from "../lib/gpx";
import { thin } from "../lib/project";
import {
  cumulative,
  MIN_SECTION,
  peakFraction,
  type RouteOptions,
  smoothElevation,
  VIEW_PRESETS,
} from "../lib/route3d";

const chipCls = (on: boolean) =>
  `min-h-11 rounded-xl px-3 text-sm font-bold transition active:scale-[0.97] ${on ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`;

function ElevationStrip({ points, from, to }: { points: TrackPoint[]; from: number; to: number }) {
  const d = useMemo(() => {
    const cum = cumulative(points);
    const ele = smoothElevation(points);
    const [lo, hi] = [Math.min(...ele), Math.max(...ele)];
    const pick = thin(
      ele.map((e, i) => [cum[i] / (cum[cum.length - 1] || 1), e] as const),
      120
    );
    const line = pick.map(
      ([x, e]) => `${(x * 100).toFixed(1)},${(30 - ((e - lo) / (hi - lo || 1)) * 28).toFixed(1)}`
    );
    return `M0,32 L${line.join(" L")} L100,32 Z`;
  }, [points]);

  return (
    <svg
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      className="h-14 w-full rounded-xl bg-slate-100"
      role="img"
      aria-label="Elevation profile"
    >
      <path d={d} className="fill-slate-300" />
      <clipPath id="sel">
        <rect x={from * 100} y="0" width={(to - from) * 100} height="32" />
      </clipPath>
      <path d={d} className="fill-orange-500" clipPath="url(#sel)" />
    </svg>
  );
}

type SliderSpec = {
  key: keyof RouteOptions;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
};

const SLIDERS: SliderSpec[] = [
  { key: "tilt", label: "Tilt", min: 10, max: 90, step: 1, unit: "°" },
  { key: "yaw", label: "Rotate", min: -180, max: 180, step: 1, unit: "°" },
  { key: "relief", label: "Elevation boost", min: 0.2, max: 2.5, step: 0.1, unit: "×" },
  { key: "width", label: "Line width", min: 0.5, max: 2, step: 0.1, unit: "×" },
];

interface RouteControlsProps {
  points: TrackPoint[];
  route: RouteOptions;
  onRoute: (patch: Partial<RouteOptions>) => void;
}

export function RouteControls({ points, route, onRoute }: RouteControlsProps) {
  const peak = useMemo(() => peakFraction(points), [points]);
  const pct = (v: number) => `${Math.round(v * 100)}%`;

  return (
    <fieldset className="flex flex-col gap-3 rounded-2xl border-2 border-slate-100 p-3">
      <legend className="px-1 text-sm font-semibold text-slate-700">Route view</legend>

      <div className="flex flex-wrap gap-2">
        {VIEW_PRESETS.map((v) => (
          <button
            key={v.label}
            type="button"
            aria-pressed={route.tilt === v.tilt && route.yaw === v.yaw}
            onClick={() => onRoute({ tilt: v.tilt, yaw: v.yaw })}
            className={chipCls(route.tilt === v.tilt && route.yaw === v.yaw)}
          >
            {v.label}
          </button>
        ))}
      </div>

      <ElevationStrip points={points} from={route.from} to={route.to} />
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
          Start {pct(route.from)}
          <input
            type="range"
            min={0}
            max={100}
            value={route.from * 100}
            onChange={(e) =>
              onRoute({ from: Math.min(Number(e.target.value) / 100, route.to - MIN_SECTION) })
            }
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
          End {pct(route.to)}
          <input
            type="range"
            min={0}
            max={100}
            value={route.to * 100}
            onChange={(e) =>
              onRoute({ to: Math.max(Number(e.target.value) / 100, route.from + MIN_SECTION) })
            }
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={chipCls(false)}
          onClick={() => onRoute({ from: 0, to: 1 })}
        >
          Whole route
        </button>
        {peak !== null && (
          <button
            type="button"
            className={`${chipCls(false)} flex items-center gap-1`}
            onClick={() => onRoute({ from: Math.max(0, peak - 0.2), to: Math.min(1, peak + 0.2) })}
          >
            <Mountain size={14} /> Summit
          </button>
        )}
      </div>

      {SLIDERS.map((sl) => (
        <label key={sl.key} className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
          {sl.label} {route[sl.key] as number}
          {sl.unit}
          <input
            type="range"
            min={sl.min}
            max={sl.max}
            step={sl.step}
            value={route[sl.key] as number}
            onChange={(e) => onRoute({ [sl.key]: Number(e.target.value) })}
          />
        </label>
      ))}

      <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-700">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={route.wall}
            onChange={(e) => onRoute({ wall: e.target.checked })}
          />
          Elevation curtain
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={route.markers}
            onChange={(e) => onRoute({ markers: e.target.checked })}
          />
          Start / finish dots
        </label>
      </div>
    </fieldset>
  );
}
