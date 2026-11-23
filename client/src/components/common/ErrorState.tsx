import { Button } from "@/components/ui/button";

interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: Props) {
  return (
    <div
      role="alert"
      className="border-destructive/40 flex flex-col items-center gap-3 rounded-lg border p-6 text-center"
    >
      <p className="text-destructive text-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
