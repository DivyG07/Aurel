// Small presentational helpers shared by admin pages (server-safe).

export function PageHead({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.07] pb-6">
      <div>
        <h1 className="font-display text-4xl md:text-5xl">{title}</h1>
        {sub && <p className="mt-2 text-sm text-mist">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Notice({ saved, error }: { saved?: string; error?: string }) {
  if (error) return <p className="mb-6 border border-red-400/30 bg-red-400/5 px-4 py-3 text-sm text-red-300">{error}</p>;
  if (saved) return <p className="mb-6 border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-gold">{saved === "deleted" ? "Deleted." : `Saved: ${saved}`}</p>;
  return null;
}

export const th = "px-3 py-3 text-left text-[10px] font-medium uppercase tracking-[0.2em] text-mist";
export const td = "px-3 py-3 align-top text-sm";

export function Table({ head, children, empty }: { head: string[]; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto border border-white/[0.07] bg-onyx" data-lenis-prevent>
      <table className="w-full min-w-[720px]">
        <thead className="border-b border-white/[0.07]">
          <tr>{head.map((h) => <th key={h} className={th}>{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05]">{children}</tbody>
      </table>
      {empty && <p className="p-6 text-sm text-mist">Nothing here yet.</p>}
    </div>
  );
}

export const fmtDate = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
