import { Loader2 } from "lucide-react";

interface Props {
  text?: string;
}

export default function LoadingSpinner({ text = "Loading..." }: Props) {
  return (
    <div className="flex min-h-75 flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />

      <p className="text-muted-foreground">{text}</p>
    </div>
  );
}
