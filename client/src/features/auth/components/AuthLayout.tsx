import type { ReactNode } from "react";

import LanguageSwitcher from "@/features/preferences/components/LanguageSwitcher";
import LeftPannel from "./LeftPannel";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-slate-100 dark:bg-background">
      <div className="pointer-events-none absolute top-0 left-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />

      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      <LeftPannel />

      <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
}
