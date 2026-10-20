import type { Status, Supplier } from "@/lib/catalog";

export function StoreBadge({ supplier }: { supplier: Supplier }) {
  return supplier === "printify" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-teal px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-ivory">
      <span className="h-1.5 w-1.5 rounded-full bg-aqua" /> Printify
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-coral px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-ivory">
      <span className="h-1.5 w-1.5 rounded-full bg-gold" /> Zazzle
    </span>
  );
}

const statusStyle: Record<Status, string> = {
  active: "border-mile text-mile",
  draft: "border-gold text-gold",
  archived: "border-muted-foreground/50 text-muted-foreground",
};
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${statusStyle[status]}`}>
      {status}
    </span>
  );
}
