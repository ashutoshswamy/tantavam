"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { btn, btnGhost } from "./ui";

export const CROP_W = 1080;
export const CROP_H = 1350;

const VIEW_W = 288; // on-screen frame, same 4:5 ratio as the output
const VIEW_H = (VIEW_W * CROP_H) / CROP_W;
const MAX_ZOOM = 4;

// Fixed 1080x1350 crop: the frame never changes shape, the admin only pans and zooms the photo behind it.
export function CropDialog({ file, onDone, onCancel }: { file: File; onDone: (cropped: File) => void; onCancel: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // image centre, relative to frame centre

  useEffect(() => {
    dialog.current?.showModal();
    return () => URL.revokeObjectURL(url);
  }, [url]);

  // zoom 1 = image just covers the frame, so there is never empty space inside the crop
  const scale = size ? Math.max(VIEW_W / size.w, VIEW_H / size.h) * zoom : 1;
  const clamp = (x: number, y: number, s = scale) =>
    size
      ? {
          x: Math.min(Math.max(x, -(size.w * s - VIEW_W) / 2), (size.w * s - VIEW_W) / 2),
          y: Math.min(Math.max(y, -(size.h * s - VIEW_H) / 2), (size.h * s - VIEW_H) / 2),
        }
      : { x: 0, y: 0 };

  const changeZoom = (z: number) => {
    if (!size) return;
    const next = Math.min(Math.max(z, 1), MAX_ZOOM);
    setZoom(next);
    setPos((p) => clamp(p.x, p.y, Math.max(VIEW_W / size.w, VIEW_H / size.h) * next));
  };

  const crop = () => {
    if (!size || !img.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = CROP_W;
    canvas.height = CROP_H;
    const sw = VIEW_W / scale;
    const sh = VIEW_H / scale;
    const sx = size.w / 2 - (VIEW_W / 2 + pos.x) / scale;
    const sy = size.h / 2 - (VIEW_H / 2 + pos.y) / scale;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img.current, sx, sy, sw, sh, 0, 0, CROP_W, CROP_H);
    canvas.toBlob(
      (blob) => blob && onDone(new File([blob], `${file.name.replace(/\.\w+$/, "")}-${CROP_W}x${CROP_H}.jpg`, { type: "image/jpeg" })),
      "image/jpeg",
      0.92,
    );
  };

  return (
    <dialog ref={dialog} onCancel={onCancel} className="m-auto w-[min(92vw,26rem)] rounded-lg bg-white p-5 text-kajal backdrop:bg-kajal/50">
      <p className="text-sm font-medium">Crop to {CROP_W} × {CROP_H}</p>
      <p className="mt-1 text-xs text-kajal/50">Drag to move, slide to zoom. {file.name}</p>
      <div
        className="relative mx-auto mt-4 cursor-grab touch-none select-none overflow-hidden bg-kajal active:cursor-grabbing"
        style={{ width: VIEW_W, height: VIEW_H }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, ox: pos.x, oy: pos.y };
        }}
        onPointerMove={(e) => drag.current && setPos(clamp(drag.current.ox + e.clientX - drag.current.x, drag.current.oy + e.clientY - drag.current.y))}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onWheel={(e) => changeZoom(zoom - e.deltaY / 500)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, nothing for next/image to optimise */}
        <img
          ref={img}
          src={url}
          alt=""
          draggable={false}
          onLoad={(e) => setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
          style={size ? { width: size.w * scale, height: size.h * scale, transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))` } : { opacity: 0 }}
        />
        {/* thirds grid so composition is easy to judge */}
        <div aria-hidden className="pointer-events-none absolute inset-0 border border-white/70 [background:linear-gradient(to_right,transparent_33%,rgb(255_255_255/.35)_33%,rgb(255_255_255/.35)_calc(33%+1px),transparent_calc(33%+1px),transparent_66%,rgb(255_255_255/.35)_66%,rgb(255_255_255/.35)_calc(66%+1px),transparent_calc(66%+1px)),linear-gradient(to_bottom,transparent_33%,rgb(255_255_255/.35)_33%,rgb(255_255_255/.35)_calc(33%+1px),transparent_calc(33%+1px),transparent_66%,rgb(255_255_255/.35)_66%,rgb(255_255_255/.35)_calc(66%+1px),transparent_calc(66%+1px))]" />
      </div>
      <label className="mt-4 flex items-center gap-3 text-xs">
        Zoom
        <input type="range" min={1} max={MAX_ZOOM} step={0.01} value={zoom} onChange={(e) => changeZoom(+e.target.value)} className="flex-1" />
      </label>
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={crop} disabled={!size} className={`${btn} flex-1`}>Crop and add</button>
        <button type="button" onClick={onCancel} className={btnGhost}>Skip</button>
      </div>
    </dialog>
  );
}
