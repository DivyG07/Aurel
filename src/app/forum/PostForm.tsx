"use client";

import { useActionState, useState } from "react";
import { createPost, updatePost } from "./actions";
import { flairMeta } from "@/components/forum/bits";
import { ImagePicker } from "@/components/ui/ImagePicker";

type Initial = { id?: string; title?: string; body?: string; flair?: string; car?: string; images?: { id: string; url: string }[] };

/** Create or edit a post. Editing keeps chosen existing images and can add new ones (4 max in total). */
export function PostForm({ cars, initial = {}, onDone }: { cars?: { slug: string; label: string }[]; initial?: Initial; onDone?: () => void }) {
  const editing = !!initial.id;
  const [state, action, pending] = useActionState(async (prev: Awaited<ReturnType<typeof createPost>>, f: FormData) => {
    const r = editing ? await updatePost(prev, f) : await createPost(prev, f);
    if (r?.ok) onDone?.();
    return r;
  }, null);
  const [flair, setFlair] = useState(initial.flair && flairMeta[initial.flair] ? initial.flair : "DISCUSSION");
  const [keep, setKeep] = useState((initial.images ?? []).map((i) => i.id));
  const [title, setTitle] = useState(initial.title ?? "");

  return (
    <form action={action} className="mt-8 space-y-5">
      {editing && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="flair" value={flair} />
      {keep.map((k) => <input key={k} type="hidden" name="keep" value={k} />)}

      <div>
        <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-mist">Category</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(flairMeta).map(([k, m]) => (
            <button key={k} type="button" onClick={() => setFlair(k)} className="rounded-full border px-3.5 py-1.5 text-[11px] uppercase tracking-[0.15em] transition" style={flair === k ? { background: m.color, color: "#0b0b0c", borderColor: m.color } : { color: m.color, borderColor: `${m.color}55` }}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 flex justify-between text-[10px] uppercase tracking-[0.2em] text-mist">
          Title <span className={title.length > 140 ? "text-red-300" : ""}>{title.length}/140</span>
        </span>
        <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={5} maxLength={140} placeholder="e.g. Revuelto vs SF90 — which would you take?" className="field text-lg" />
      </label>

      {cars && !editing && (
        <label className="block">
          <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-mist">About a car in the collection (optional)</span>
          <select name="car" defaultValue={initial.car ?? ""} className="field">
            <option value="">— None —</option>
            {cars.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
          </select>
        </label>
      )}

      <label className="block">
        <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-mist">Text</span>
        <textarea name="body" defaultValue={initial.body} rows={8} maxLength={10000} placeholder="Share your thoughts, experience, or question…" className="field leading-relaxed" />
      </label>

      <div>
        <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-mist">Photos</p>
        {editing && keep.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {(initial.images ?? []).filter((i) => keep.includes(i.id)).map((i) => (
              <div key={i.id} className="relative h-20 w-28 overflow-hidden border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.url} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => setKeep((k) => k.filter((x) => x !== i.id))} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-xs" aria-label="Remove image">×</button>
              </div>
            ))}
          </div>
        )}
        <ImagePicker name="images" max={Math.max(0, 4 - keep.length)} />
      </div>

      {state && !state.ok && <p className="text-sm text-red-300">{state.message}</p>}
      {state?.ok && <p className="text-sm text-gold">{state.message}</p>}
      <div className="flex gap-3">
        <button disabled={pending} className="btn btn-primary">{pending ? (editing ? "Saving…" : "Posting…") : editing ? "Save changes" : "Post"}</button>
        {onDone && <button type="button" onClick={onDone} className="btn btn-ghost">Cancel</button>}
      </div>
    </form>
  );
}
