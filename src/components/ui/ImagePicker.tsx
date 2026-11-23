"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/lib/stores";

/** Shrinks a photo in the browser to ≤ maxSide px WebP, so uploads stay small. */
async function compress(file: File, maxSide = 1600): Promise<File> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/webp", 0.82));
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
}

/**
 * Multi-image picker with previews. Compressed files are written into a hidden
 * <input type="file" name={name}> so they submit with the surrounding form.
 */
export function ImagePicker({ name, max, label = "Add photos", resetKey = 0 }: { name: string; max: number; label?: string; resetKey?: number }) {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const hidden = useRef<HTMLInputElement>(null);
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);
  useEffect(() => setFiles([]), [resetKey]);
  useEffect(() => {
    if (!hidden.current) return;
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    hidden.current.files = dt.files;
  }, [files]);

  async function add(list: FileList | null) {
    if (!list?.length) return;
    const picked = Array.from(list).filter((f) => f.type.startsWith("image/"));
    if (files.length + picked.length > max) toast(`Up to ${max} images`, "error");
    setBusy(true);
    try {
      const done = await Promise.all(picked.slice(0, max - files.length).map((f) => compress(f)));
      setFiles((prev) => [...prev, ...done].slice(0, max));
    } catch {
      toast("Couldn't read that image", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input ref={hidden} type="file" name={name} multiple className="hidden" aria-hidden tabIndex={-1} />
      <div className="flex flex-wrap gap-2">
        {urls.map((u, i) => (
          <div key={u} className="group relative h-20 w-28 overflow-hidden border border-white/10 bg-graphite">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => setFiles((f) => f.filter((_, n) => n !== i))} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-xs" aria-label="Remove image">
              ×
            </button>
          </div>
        ))}
        {files.length < max && (
          <label className={`grid h-20 w-28 cursor-pointer place-items-center border border-dashed border-white/20 text-center text-[10px] uppercase tracking-[0.15em] text-mist transition hover:border-gold hover:text-gold ${busy ? "opacity-50" : ""}`}>
            {busy ? "Processing…" : `+ ${label}`}
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
          </label>
        )}
      </div>
      <p className="mt-1.5 text-[11px] text-mist">{files.length}/{max} · JPEG, PNG or WebP, resized automatically</p>
    </div>
  );
}
