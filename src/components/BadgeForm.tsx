import type { BadgeKind } from "../lib/drawBadge";
import { FRAMES, type FrameId, THEMES, type ThemeId } from "../lib/frames";
import type { LetterCell } from "../lib/handoff";
import { ChipGroup } from "./ChipGroup";

const KINDS: { id: BadgeKind; label: string }[] = [
  { id: "letter", label: "Letter" },
  { id: "alphabet", label: "Whole alphabet" },
];

interface Props {
  kind: BadgeKind;
  letter: string;
  cells: LetterCell[];
  frame: FrameId;
  theme: ThemeId;
  onKind: (v: BadgeKind) => void;
  onLetter: (v: string) => void;
  onFrame: (v: FrameId) => void;
  onTheme: (v: ThemeId) => void;
  onExit: () => void;
}

/** Options for a parkrun Alphabeteer badge handed over from the tracker */
export function BadgeForm(p: Props) {
  const done = p.cells.filter((c) => c.status === "done");
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-extrabold">parkrun Alphabeteer badge</h2>
      <ChipGroup legend="Badge" options={KINDS} value={p.kind} onChange={p.onKind} />
      {p.kind === "letter" && done.length > 0 && (
        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
          Letter
          <select
            className="min-h-11 rounded-xl border-2 border-slate-200 px-3 text-base outline-none focus:border-orange-500"
            value={p.letter}
            onChange={(e) => p.onLetter(e.target.value)}
          >
            {done.map((c) => (
              <option key={c.letter} value={c.letter}>
                {c.letter} · {c.event}
              </option>
            ))}
          </select>
        </label>
      )}
      <ChipGroup legend="Colour" options={THEMES} value={p.theme} onChange={p.onTheme} />
      {p.kind === "letter" && (
        <ChipGroup legend="Shape" options={FRAMES} value={p.frame} onChange={p.onFrame} />
      )}
      <button
        type="button"
        onClick={p.onExit}
        className="min-h-11 self-start rounded-xl px-3 text-sm font-semibold text-slate-700 underline"
      >
        Make a route sticker instead
      </button>
    </div>
  );
}
