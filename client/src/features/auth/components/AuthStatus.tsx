import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tone = "success" | "error" | "info";

const toneClasses: Record<Tone, string> = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
  error:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
  info: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300",
};

export default function AuthStatus({
  icon,
  title,
  description,
  tone = "info",
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  tone?: Tone;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-6 text-center">
      <div
        className={cn(
          "mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border",
          toneClasses[tone],
        )}
      >
        {icon}
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </div>

      {children}
    </div>
  );
}
