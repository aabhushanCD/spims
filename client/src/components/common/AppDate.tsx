import { useDateFormat } from "@/lib/datetime/dateFormatContext";
import type {
  DateDisplayStyle,
  DateInput,
  DateKind,
} from "@/lib/datetime/workspaceDate";
import { cn } from "@/lib/utils";

interface AppDateProps {
  value: DateInput;
  kind?: DateKind;
  style?: DateDisplayStyle;
  variant?: "header" | "table" | "detail" | "inline";
  className?: string;
}

/**
 * Renders the workspace calendar date. BS and AD follow the user's calendar
 * mode, and the exact BS/AD pair is always available in the tooltip.
 */
export default function AppDate({
  value,
  kind,
  style = "date",
  variant = "inline",
  className,
}: AppDateProps) {
  const { format } = useDateFormat();
  const parts = format(value, { kind, style });
  const secondary = parts.secondary;

  const time = (
    <time
      dateTime={parts.iso}
      title={parts.full}
      aria-label={parts.full}
      className={cn(
        "inline-flex flex-col leading-tight",
        variant === "inline" && "inline",
        className,
      )}
    >
      <span
        className={cn(
          variant === "header" && "text-sm font-medium",
          variant === "detail" && "text-sm",
        )}
      >
        {parts.primary}
      </span>

      {secondary ? (
        <span
          className={cn(
            "text-muted-foreground",
            variant === "header" ? "text-xs" : "text-[11px]",
          )}
        >
          {secondary}
        </span>
      ) : null}
    </time>
  );

  return time;
}
