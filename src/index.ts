export type { BeforeExport } from "./components/StickerCanvas";
export { HANDOFF_KEY, type Handoff } from "./lib/handoff";
export { StickersApp } from "./StickersApp";

export const meta = {
  id: "stickers",
  title: "Activity Stickers",
  description: "Turn your activity stats and route into a shareable sticker",
} as const;
