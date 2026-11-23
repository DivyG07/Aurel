"use client";

/** Submits a server action for one record after a native confirm dialog. */
export function ConfirmButton({ action, id, label, confirm, className }: { action: (f: FormData) => Promise<void>; id: string; label: string; confirm: string; className?: string }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className={className ?? "text-xs text-red-300/80 hover:text-red-300"}>{label}</button>
    </form>
  );
}
