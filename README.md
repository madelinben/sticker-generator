# Activity Sticker Maker

Turn activity stats and a GPX route into a shareable sticker (PNG): download, copy to clipboard, or share via the phone share sheet. Everything is drawn in the browser on a canvas; nothing is uploaded and no paid APIs are used.

- Load a GPX (Strava, Garmin, Coros export) or type the stats by hand
- Achievement badges from distance and climb (5K, 10K, Half marathon, Marathon, 100/500/1000 m climb)
- 4 sticker shapes, 4 colour themes, editable footer line (e.g. a donation link for fundraisers)

Two ways this repo ships, from the same `src/`:

| Target | How |
|---|---|
| **GitHub Pages** (`madelinben.github.io/sticker-generator/`) | `pnpm build:demo` builds `demo/` into `docs/` (Pages source: `main` / `/docs`) |
| **get-out-there** (Cloudflare) | imported as workspace package `@get-out-there/stickers` (`StickersApp`) |

```bash
pnpm install
pnpm dev          # demo at http://localhost:3103/sticker-generator/
pnpm test         # GPX parsing, stats, badges, projection
pnpm build:demo   # static site -> docs/
```

## Handoff from other tools
Another tool can open the maker pre-filled by writing JSON (`Handoff` type) to `sessionStorage["gotc:sticker-handoff"]` and navigating to `/tools/stickers`. The maker reads and clears it once.

Package rules: no router/auth/app imports; Tailwind default palette only; host must `@source` this folder. Peer deps: react, react-dom, lucide-react.
