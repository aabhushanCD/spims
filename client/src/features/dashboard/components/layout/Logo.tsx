import { Pill } from "lucide-react";

interface Props {
  /** Hide the wordmark when only the mark is needed. */
  compact?: boolean;
}

export default function Logo({ compact = false }: Props) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="bg-emerald-600 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
        aria-hidden="true"
      >
        <Pill size={22} />
      </div>

      {!compact && (
        <div className="min-w-0">
          <p className="text-lg font-bold tracking-tight">SPIMS</p>
          <p className="text-muted-foreground text-xs">Smart Pharmacy</p>
        </div>
      )}
    </div>
  );
}
