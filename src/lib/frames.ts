export type FrameId = "scallop" | "hex" | "rounded" | "wave" | "circle" | "shield" | "burst";

export const FRAMES: { id: FrameId; label: string }[] = [
  { id: "scallop", label: "Scallop" },
  { id: "hex", label: "Hexagon" },
  { id: "rounded", label: "Rounded" },
  { id: "wave", label: "Wave" },
  { id: "circle", label: "Circle" },
  { id: "shield", label: "Shield" },
  { id: "burst", label: "Burst" },
];

export type ThemeId = "sunrise" | "ocean" | "forest" | "night";

export const THEMES: { id: ThemeId; label: string; from: string; to: string }[] = [
  { id: "sunrise", label: "Sunrise", from: "#ff7a18", to: "#fc4c02" },
  { id: "ocean", label: "Ocean", from: "#2fa7e0", to: "#1b4f9c" },
  { id: "forest", label: "Forest", from: "#5cc326", to: "#14633a" },
  { id: "night", label: "Night", from: "#7c3aed", to: "#1e1b4b" },
];

function assertNever(x: never): never {
  throw new Error(`Unhandled frame: ${String(x)}`);
}

const polygon = (pts: [number, number][]) => `M ${pts.map((p) => p.join(",")).join(" L ")} Z`;

/** SVG path (usable with Path2D) of the sticker outline inside a square canvas of `size`. */
export function framePath(id: FrameId, size: number, margin: number): string {
  const c = size / 2;
  const r = c - margin;
  switch (id) {
    case "scallop":
    case "burst": {
      const [teeth, depth] = id === "burst" ? [16, 0.84] : [28, 0.93];
      return polygon(
        Array.from({ length: teeth * 2 }, (_, i): [number, number] => {
          const a = (Math.PI * 2 * i) / (teeth * 2) - Math.PI / 2;
          const rad = i % 2 === 0 ? r : r * depth;
          return [c + rad * Math.cos(a), c + rad * Math.sin(a)];
        })
      );
    }
    case "hex":
      return polygon(
        Array.from({ length: 6 }, (_, i): [number, number] => {
          const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
          return [c + r * Math.cos(a), c + r * Math.sin(a)];
        })
      );
    case "rounded": {
      const [x0, x1, k] = [margin, size - margin, size * 0.14];
      return `M ${x0 + k} ${x0} L ${x1 - k} ${x0} Q ${x1} ${x0} ${x1} ${x0 + k} L ${x1} ${x1 - k} Q ${x1} ${x1} ${x1 - k} ${x1} L ${x0 + k} ${x1} Q ${x0} ${x1} ${x0} ${x1 - k} L ${x0} ${x0 + k} Q ${x0} ${x0} ${x0 + k} ${x0} Z`;
    }
    case "wave": {
      const [x0, x1, k, amp] = [margin, size - margin, size * 0.12, size * 0.018];
      const yb = size - margin - amp;
      let d = `M ${x0 + k} ${x0} L ${x1 - k} ${x0} Q ${x1} ${x0} ${x1} ${x0 + k} L ${x1} ${yb}`;
      const n = 6;
      for (let i = 0; i < n; i++) {
        const xa = x1 - ((x1 - x0) * i) / n;
        const xb = x1 - ((x1 - x0) * (i + 1)) / n;
        d += ` Q ${(xa + xb) / 2} ${yb + (i % 2 ? -amp : amp) * 2} ${xb} ${yb}`;
      }
      return `${d} L ${x0} ${x0 + k} Q ${x0} ${x0} ${x0 + k} ${x0} Z`;
    }
    case "circle":
      return `M ${c - r} ${c} A ${r} ${r} 0 1 0 ${c + r} ${c} A ${r} ${r} 0 1 0 ${c - r} ${c} Z`;
    case "shield": {
      const [x0, x1] = [margin, size - margin];
      return `M ${x0} ${x0} L ${x1} ${x0} L ${x1} ${size * 0.55} Q ${x1} ${size * 0.86} ${c} ${size - margin} Q ${x0} ${size * 0.86} ${x0} ${size * 0.55} Z`;
    }
    default:
      return assertNever(id);
  }
}
