export type TrackPoint = { lat: number; lon: number; ele: number | null; time: number | null };

const TRKPT = /<trkpt\b([^>]*?)(?:\/>|>([\s\S]*?)<\/trkpt>)/g;
const attr = (attrs: string, name: string) =>
  attrs.match(new RegExp(`${name}\\s*=\\s*"([^"]+)"`))?.[1];
const tag = (inner: string | undefined, name: string) =>
  inner?.match(new RegExp(`<${name}>([^<]+)</${name}>`))?.[1];

/** Parse track points from GPX text (Strava / Garmin / Coros exports). Ignores waypoints and routes. */
export function parseGpx(xml: string): TrackPoint[] {
  const pts: TrackPoint[] = [];
  for (const m of xml.matchAll(TRKPT)) {
    const lat = Number(attr(m[1], "lat"));
    const lon = Number(attr(m[1], "lon"));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const ele = tag(m[2], "ele");
    const time = tag(m[2], "time");
    pts.push({
      lat,
      lon,
      ele: ele === undefined ? null : Number(ele),
      time: time === undefined ? null : Date.parse(time),
    });
  }
  return pts;
}
