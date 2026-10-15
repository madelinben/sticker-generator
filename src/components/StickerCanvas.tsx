import { Check, Copy, Download, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { drawSticker, type StickerSpec } from "../lib/draw";

const toBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("render failed"))), "image/png")
  );

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "sticker";

/** Host hook run before any export (download / copy / share). Reject to cancel. Used for the ad wall. */
export type BeforeExport = (label: string) => Promise<void>;

export function StickerCanvas({
  spec,
  beforeExport,
}: {
  spec: StickerSpec;
  beforeExport?: BeforeExport;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("");

  // Canvas is an imperative surface: redraw whenever the spec changes.
  useEffect(() => {
    if (ref.current) drawSticker(ref.current, spec);
  }, [spec]);

  async function run(action: () => Promise<string>) {
    try {
      await beforeExport?.("sticker");
      setStatus(await action());
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  const png = async () => toBlob(ref.current as HTMLCanvasElement);
  const file = async () =>
    new File([await png()], `${slug(spec.title)}.png`, { type: "image/png" });

  const download = () =>
    run(async () => {
      const url = URL.createObjectURL(await png());
      const a = Object.assign(document.createElement("a"), {
        href: url,
        download: `${slug(spec.title)}.png`,
      });
      a.click();
      URL.revokeObjectURL(url);
      return "Saved";
    });

  const copy = () =>
    run(async () => {
      if (!navigator.clipboard?.write) throw new Error("Copy isn't supported here, use Download");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": await png() })]);
      return "Copied to clipboard";
    });

  const share = () =>
    run(async () => {
      const f = await file();
      if (!navigator.canShare?.({ files: [f] }))
        throw new Error("Sharing isn't supported here, use Download");
      await navigator.share({ files: [f], title: spec.title });
      return "Shared";
    });

  const buttons = [
    { label: "Download", Icon: Download, onClick: download },
    { label: "Copy", Icon: Copy, onClick: copy },
    { label: "Share", Icon: Share2, onClick: share },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl bg-[conic-gradient(#f1f5f9_25%,#e2e8f0_0_50%,#f1f5f9_0_75%,#e2e8f0_0)] bg-[length:24px_24px] p-2">
        <canvas
          ref={ref}
          className="mx-auto aspect-square w-full max-w-md"
          aria-label="Sticker preview"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {buttons.map(({ label, Icon, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-orange-600 text-sm font-bold text-white transition active:scale-[0.97]"
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>
      {status && (
        <p role="status" className="flex items-center gap-1 text-sm text-slate-600">
          <Check size={14} /> {status}
        </p>
      )}
    </div>
  );
}
