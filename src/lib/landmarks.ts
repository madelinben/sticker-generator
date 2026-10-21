import type { TrackPoint } from "./gpx";
import { haversine } from "./stats.ts";

/** Silhouettes live in a 100 x 60 box, ground at y = 60, drawn as one filled SVG path (Path2D-ready). */
const R = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h${-w}Z`;
const poly = (...n: number[]) =>
  `M${n
    .filter((_, i) => i % 2 === 0)
    .map((x, i) => `${x} ${n[i * 2 + 1]}`)
    .join("L")}Z`;
const dome = (cx: number, base: number, r: number) =>
  `M${cx - r} ${base}A${r} ${r} 0 0 1 ${cx + r} ${base}Z`;
const GROUND = R(0, 58, 100, 2);
const join = (...parts: string[]) => parts.join("");

type Landmark = { id: string; label: string; lat: number; lon: number; path: string };

const CITY: Landmark[] = [
  {
    id: "london",
    label: "London: Elizabeth Tower",
    lat: 51.5,
    lon: -0.12,
    path: join(
      R(42, 26, 16, 34),
      R(44, 8, 12, 18),
      poly(44, 8, 56, 8, 50, 0),
      R(8, 46, 34, 14),
      R(58, 48, 34, 12),
      R(14, 40, 3, 6),
      R(26, 40, 3, 6),
      R(72, 42, 3, 6),
      GROUND
    ),
  },
  {
    id: "birmingham",
    label: "Birmingham: Rotunda",
    lat: 52.48,
    lon: -1.9,
    path: join(
      R(40, 10, 20, 50),
      R(38, 6, 24, 4),
      R(44, 0, 12, 6),
      dome(14, 60, 10),
      dome(86, 60, 12),
      GROUND
    ),
  },
  {
    id: "glasgow",
    label: "Glasgow: Armadillo & crane",
    lat: 55.86,
    lon: -4.25,
    path: join(
      dome(28, 60, 16),
      dome(52, 60, 20),
      dome(72, 60, 12),
      R(88, 14, 3, 46),
      R(80, 14, 18, 3),
      GROUND
    ),
  },
  {
    id: "manchester",
    label: "Manchester: Beetham Tower",
    lat: 53.48,
    lon: -2.24,
    path: join(
      R(42, 12, 12, 48),
      R(47, 0, 2, 12),
      R(10, 34, 18, 26),
      R(62, 28, 14, 32),
      R(80, 40, 12, 20),
      GROUND
    ),
  },
  {
    id: "sheffield",
    label: "Sheffield: Arts Tower",
    lat: 53.38,
    lon: -1.47,
    path: join(R(38, 6, 14, 54), R(52, 24, 10, 36), R(6, 38, 28, 22), R(66, 44, 28, 16), GROUND),
  },
  {
    id: "leeds",
    label: "Leeds: Town Hall",
    lat: 53.8,
    lon: -1.55,
    path: join(R(28, 36, 44, 24), R(44, 16, 12, 20), dome(50, 16, 8), R(49, 0, 2, 8), GROUND),
  },
  {
    id: "edinburgh",
    label: "Edinburgh: Castle Rock",
    lat: 55.95,
    lon: -3.19,
    path: join(
      poly(0, 60, 6, 40, 24, 30, 40, 26, 60, 24, 90, 34, 100, 60),
      R(40, 14, 8, 12),
      R(54, 10, 5, 16),
      poly(40, 14, 44, 6, 48, 14),
      poly(54, 10, 56.5, 2, 59, 10)
    ),
  },
  {
    id: "liverpool",
    label: "Liverpool: Liver Building",
    lat: 53.41,
    lon: -2.99,
    path: join(
      R(28, 28, 44, 32),
      R(32, 14, 10, 14),
      dome(37, 14, 5),
      R(58, 14, 10, 14),
      dome(63, 14, 5),
      R(44, 22, 12, 6),
      poly(47, 22, 50, 12, 53, 22),
      GROUND
    ),
  },
  {
    id: "bristol",
    label: "Bristol: Clifton Bridge",
    lat: 51.45,
    lon: -2.59,
    path: join(
      R(24, 14, 5, 46),
      R(68, 14, 5, 46),
      R(0, 40, 100, 3),
      poly(29, 14, 46, 34, 51, 34, 68, 14, 68, 18, 51, 38, 46, 38, 29, 18),
      poly(0, 38, 24, 14, 24, 18, 0, 42),
      poly(100, 38, 73, 14, 73, 18, 100, 42),
      GROUND
    ),
  },
  {
    id: "cardiff",
    label: "Cardiff: Principality Stadium",
    lat: 51.48,
    lon: -3.18,
    path: join(
      poly(8, 60, 14, 36, 86, 36, 92, 60),
      R(22, 18, 2, 18),
      R(76, 18, 2, 18),
      R(48, 26, 2, 10),
      GROUND
    ),
  },
  {
    id: "leicester",
    label: "Leicester: Space Centre",
    lat: 52.63,
    lon: -1.13,
    path: join(
      R(42, 20, 16, 40),
      poly(42, 20, 50, 0, 58, 20),
      poly(32, 60, 42, 40, 42, 60),
      poly(68, 60, 58, 40, 58, 60),
      GROUND
    ),
  },
  {
    id: "bradford",
    label: "Bradford: Mill chimney",
    lat: 53.8,
    lon: -1.75,
    path: join(R(46, 6, 8, 54), R(43, 0, 14, 6), R(8, 36, 32, 24), R(60, 40, 32, 20), GROUND),
  },
  {
    id: "belfast",
    label: "Belfast: Titanic Belfast",
    lat: 54.6,
    lon: -5.93,
    path: join(
      poly(4, 60, 16, 12, 28, 60),
      poly(24, 60, 36, 20, 48, 60),
      poly(44, 60, 56, 14, 68, 60),
      poly(64, 60, 76, 24, 88, 60),
      R(92, 10, 3, 50),
      R(84, 10, 16, 3)
    ),
  },
  {
    id: "coventry",
    label: "Coventry: Cathedral spires",
    lat: 52.41,
    lon: -1.51,
    path: join(
      poly(18, 60, 18, 24, 23, 6, 28, 24, 28, 60),
      poly(44, 60, 44, 18, 49, 0, 54, 18, 54, 60),
      poly(68, 60, 68, 26, 73, 10, 78, 26, 78, 60),
      R(8, 44, 84, 16)
    ),
  },
  {
    id: "nottingham",
    label: "Nottingham: Council House",
    lat: 52.95,
    lon: -1.15,
    path: join(
      R(18, 36, 64, 24),
      dome(50, 36, 16),
      R(49, 10, 2, 10),
      R(30, 30, 4, 6),
      R(66, 30, 4, 6),
      GROUND
    ),
  },
  {
    id: "hull",
    label: "Hull: Humber Bridge",
    lat: 53.74,
    lon: -0.33,
    path: join(
      R(26, 10, 4, 50),
      R(70, 10, 4, 50),
      R(0, 46, 100, 2),
      poly(30, 10, 50, 36, 70, 10, 70, 14, 50, 41, 30, 14),
      poly(0, 44, 26, 10, 26, 14, 0, 48),
      poly(100, 44, 74, 10, 74, 14, 100, 48),
      GROUND
    ),
  },
  {
    id: "newcastle",
    label: "Newcastle: Tyne Bridge",
    lat: 54.98,
    lon: -1.61,
    path: join(
      R(8, 34, 84, 3),
      R(8, 20, 6, 40),
      R(86, 20, 6, 40),
      poly(14, 60, 50, 14, 86, 60, 80, 60, 50, 24, 20, 60),
      GROUND
    ),
  },
  {
    id: "brighton",
    label: "Brighton: Royal Pavilion",
    lat: 50.82,
    lon: -0.14,
    path: join(
      R(18, 40, 64, 20),
      dome(30, 40, 8),
      dome(50, 36, 13),
      dome(70, 40, 8),
      R(49, 12, 2, 10),
      R(14, 28, 2, 14),
      R(84, 28, 2, 14),
      GROUND
    ),
  },
  {
    id: "southampton",
    label: "Southampton: Cruise ship",
    lat: 50.9,
    lon: -1.4,
    path: join(
      poly(4, 60, 12, 46, 94, 46, 88, 60),
      R(24, 32, 56, 14),
      R(34, 22, 36, 10),
      R(50, 10, 8, 12)
    ),
  },
  {
    id: "plymouth",
    label: "Plymouth: Smeaton's Tower",
    lat: 50.37,
    lon: -4.14,
    path: join(
      poly(38, 60, 44, 16, 56, 16, 62, 60),
      R(43, 6, 14, 10),
      poly(41, 6, 50, 0, 59, 6),
      GROUND
    ),
  },
  {
    id: "stoke",
    label: "Stoke: Bottle kilns",
    lat: 53.0,
    lon: -2.18,
    path: join(
      poly(32, 60, 28, 40, 42, 28, 42, 10, 58, 10, 58, 28, 72, 40, 68, 60),
      R(40, 4, 20, 6),
      poly(78, 60, 76, 46, 84, 42, 92, 46, 90, 60),
      GROUND
    ),
  },
  {
    id: "portsmouth",
    label: "Portsmouth: Spinnaker Tower",
    lat: 50.8,
    lon: -1.09,
    path: join(poly(34, 60, 50, 6, 58, 0, 52, 38, 64, 60), R(0, 56, 100, 4)),
  },
  {
    id: "aberdeen",
    label: "Aberdeen: Marischal College",
    lat: 57.15,
    lon: -2.09,
    path: join(
      R(18, 30, 64, 30),
      poly(22, 30, 27, 10, 32, 30),
      poly(34, 30, 39, 6, 44, 30),
      poly(46, 30, 50, 0, 54, 30),
      poly(56, 30, 61, 6, 66, 30),
      poly(68, 30, 73, 10, 78, 30)
    ),
  },
  {
    id: "sunderland",
    label: "Sunderland: Penshaw Monument",
    lat: 54.9,
    lon: -1.38,
    path: join(
      R(10, 16, 80, 4),
      poly(8, 16, 50, 2, 92, 16),
      R(16, 20, 5, 34),
      R(30, 20, 5, 34),
      R(44, 20, 5, 34),
      R(58, 20, 5, 34),
      R(72, 20, 5, 34),
      R(6, 54, 88, 6)
    ),
  },
  {
    id: "swansea",
    label: "Swansea: Meridian Tower",
    lat: 51.62,
    lon: -3.94,
    path: join(poly(36, 60, 42, 4, 58, 4, 64, 60), R(0, 56, 100, 4)),
  },
  {
    id: "york",
    label: "York: Minster",
    lat: 53.96,
    lon: -1.08,
    path: join(
      R(24, 12, 14, 48),
      R(62, 12, 14, 48),
      R(22, 8, 18, 4),
      R(60, 8, 18, 4),
      R(38, 32, 24, 28),
      R(45, 16, 10, 16),
      poly(45, 16, 50, 6, 55, 16),
      GROUND
    ),
  },
  {
    id: "oxford",
    label: "Oxford: Radcliffe Camera",
    lat: 51.75,
    lon: -1.26,
    path: join(R(28, 34, 44, 26), dome(50, 34, 22), R(46, 8, 8, 6), R(49, 2, 2, 6), GROUND),
  },
  {
    id: "cambridge",
    label: "Cambridge: King's College Chapel",
    lat: 52.2,
    lon: 0.12,
    path: join(
      R(12, 30, 76, 30),
      R(12, 10, 6, 20),
      R(30, 14, 5, 16),
      R(65, 14, 5, 16),
      R(82, 10, 6, 20),
      GROUND
    ),
  },
  {
    id: "norwich",
    label: "Norwich: Cathedral spire",
    lat: 52.63,
    lon: 1.3,
    path: join(
      R(24, 44, 46, 16),
      R(42, 26, 12, 18),
      poly(42, 26, 48, 0, 54, 26),
      R(76, 40, 18, 20),
      GROUND
    ),
  },
  {
    id: "dundee",
    label: "Dundee: V&A",
    lat: 56.46,
    lon: -2.97,
    path: join(poly(12, 60, 24, 40, 52, 44, 60, 60), poly(44, 60, 56, 22, 86, 26, 92, 60)),
  },
  {
    id: "blackpool",
    label: "Blackpool: Tower",
    lat: 53.82,
    lon: -3.05,
    path: join(
      poly(40, 60, 47, 12, 53, 12, 60, 60, 54, 60, 50, 38, 46, 60),
      R(38, 34, 24, 4),
      R(49, 0, 2, 12),
      GROUND
    ),
  },
];

const GENERIC: Landmark[] = [
  {
    id: "mountain",
    label: "Mountain",
    lat: 0,
    lon: 0,
    path: join(poly(0, 60, 30, 18, 42, 36, 60, 6, 100, 60)),
  },
  {
    id: "hills",
    label: "Rolling hills",
    lat: 0,
    lon: 0,
    path: join(poly(0, 60, 0, 44, 22, 30, 44, 46, 68, 26, 100, 44, 100, 60)),
  },
  {
    id: "skyline",
    label: "Skyline",
    lat: 0,
    lon: 0,
    path: join(
      R(6, 30, 14, 30),
      R(22, 14, 12, 46),
      R(36, 36, 14, 24),
      R(52, 8, 12, 52),
      R(66, 26, 14, 34),
      R(82, 38, 12, 22),
      GROUND
    ),
  },
];

const ALL = [...CITY, ...GENERIC];
export const LANDMARKS: { id: string; label: string }[] = ALL.map(({ id, label }) => ({
  id,
  label,
}));
export type LandmarkChoice = "auto" | "none" | (typeof ALL)[number]["id"];

const NEAR_KM = 30;
const CLIMBY_M = 400;
const HILLY_M = 120;

/** Silhouette path for the choice. Auto picks the nearest landmark city, else terrain by climb. */
export function landmarkPath(choice: LandmarkChoice, points: TrackPoint[]): string | null {
  if (choice === "none") return null;
  if (choice !== "auto") return ALL.find((l) => l.id === choice)?.path ?? null;
  if (points.length < 2) return null;
  const mid = {
    lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
    lon: points.reduce((s, p) => s + p.lon, 0) / points.length,
    ele: null,
    time: null,
  };
  const [best, km] = CITY.map(
    (l) => [l, haversine(mid, { ...mid, lat: l.lat, lon: l.lon }) / 1000] as const
  ).sort((a, b) => a[1] - b[1])[0];
  if (km <= NEAR_KM) return best.path;
  const eles = points.map((p) => p.ele).filter((e): e is number => e !== null);
  const relief = eles.length ? Math.max(...eles) - Math.min(...eles) : 0;
  return GENERIC[relief > CLIMBY_M ? 0 : relief > HILLY_M ? 1 : 2].path;
}
