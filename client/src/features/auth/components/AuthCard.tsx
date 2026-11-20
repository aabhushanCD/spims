import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function AuthCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "w-full max-w-md rounded-3xl border-0 bg-white/90 shadow-2xl backdrop-blur-xl dark:bg-card/95",
        className,
      )}
    >
      <CardContent className="p-8 sm:p-10">{children}</CardContent>
    </Card>
  );
}
