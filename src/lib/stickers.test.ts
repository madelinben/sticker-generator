import assert from "node:assert/strict";
import { test } from "node:test";
import { parseGpx } from "./gpx.ts";
import { fitTrack, thin } from "./project.ts";
import { achievements, computeStats, formatDuration, formatPace } from "./stats.ts";

const GPX = `<?xml version="1.0"?><gpx><trk><trkseg>
<trkpt lat="51.0000" lon="-1.0000"><ele>10</ele><time>2026-01-01T10:00:00Z</time></trkpt>
<trkpt lat="51.0090" lon="-1.0000"><ele>40</ele><time>2026-01-01T10:05:00Z</time></trkpt>
<trkpt lat="51.0180" lon="-1.0000"><ele>30</ele><time>2026-01-01T10:10:00Z</time></trkpt>
</trkseg></trk></gpx>`;

test("parseGpx reads lat/lon/ele/time and skips junk", () => {
  const pts = parseGpx(GPX + `<trkpt lat="x" lon="1"/>`);
  assert.equal(pts.length, 3);
  assert.deepEqual([pts[1].lat, pts[1].ele], [51.009, 40]);
  assert.equal(pts[2].time! - pts[0].time!, 600_000);
});

test("computeStats: distance, duration, climb only counts ascents", () => {
  const s = computeStats(parseGpx(GPX));
  assert.ok(Math.abs(s.distanceM - 2002) < 10); // 0.018° of latitude ≈ 2 km
  assert.equal(s.durationS, 600);
  assert.equal(s.elevGainM, 30);
});

test("stats without time or elevation are null, not zero", () => {
  const s = computeStats(parseGpx(`<trkpt lat="1" lon="1"/><trkpt lat="1.01" lon="1"/>`));
  assert.equal(s.durationS, null);
  assert.equal(s.elevGainM, null);
});

test("formatting: pace and duration", () => {
  assert.equal(formatPace(1800, 5000), "6:00 /km");
  assert.equal(formatPace(null, 5000), null);
  assert.equal(formatDuration(3725), "1:02:05");
  assert.equal(formatDuration(305), "5:05");
});

test("achievements: best distance badge plus best climb badge", () => {
  assert.deepEqual(achievements({ distanceM: 21_500, durationS: null, elevGainM: 620 }), [
    "Half marathon",
    "500m climb",
  ]);
  assert.deepEqual(achievements({ distanceM: 3_000, durationS: null, elevGainM: null }), []);
});

test("fitTrack keeps aspect ratio inside the box", () => {
  const out = fitTrack(parseGpx(GPX), { x: 0, y: 0, w: 100, h: 100 });
  const xs = out.map((p) => p[0]);
  const ys = out.map((p) => p[1]);
  assert.ok(Math.min(...xs) >= 0 && Math.max(...xs) <= 100);
  assert.ok(Math.min(...ys) >= 0 && Math.max(...ys) <= 100);
  assert.ok(Math.max(...ys) - Math.min(...ys) > 99); // tall track fills the height
});

test("thin keeps first and last point", () => {
  const a = Array.from({ length: 1000 }, (_, i) => i);
  const t = thin(a, 10);
  assert.equal(t.length, 10);
  assert.deepEqual([t[0], t[9]], [0, 999]);
});
