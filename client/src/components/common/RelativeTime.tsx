import { useTranslation } from "react-i18next";

import AppDate from "@/components/common/AppDate";
import { useDateFormat } from "@/lib/datetime/dateFormatContext";
import { useNow } from "@/lib/datetime/nowContext";
import type { DateInput } from "@/lib/datetime/workspaceDate";
import { cn } from "@/lib/utils";

interface RelativeTimeProps {
  value: DateInput;
  /** Render the absolute date after the relative threshold. */
  fallback?: "absolute" | "none";
  className?: string;
  style?: "long" | "short" | "narrow";
}

/**
 * "2 hours ago" style timestamp. The exact BS and AD date/time are exposed in
 * both `title` and `aria-label`, so the record is never ambiguous.
 */
export default function RelativeTime({
  value,
  fallback = "absolute",
  className,
  style = "long",
}: RelativeTimeProps) {
  const { t } = useTranslation();
  const now = useNow();
  const { relative } = useDateFormat();
  const result = relative(value, {
    now,
    style,
    justNow: t("common.justNow"),
  });

  if (!result.isRelative) {
    return fallback === "absolute" ? (
      <AppDate value={value} variant="inline" className={className} />
    ) : null;
  }

  return (
    <time
      dateTime={result.iso}
      title={result.absolute}
      aria-label={result.absolute}
      className={cn(result.isRelative && "whitespace-nowrap", className)}
    >
      {result.text}
    </time>
  );
}
