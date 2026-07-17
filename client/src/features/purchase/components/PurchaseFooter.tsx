import { Button } from "@/components/ui/button";

interface Props {
  isLoading: boolean;
  onCancel: () => void;
}

export default function PurchaseFooter({ isLoading, onCancel }: Props) {
  return (
    <div className="flex justify-end gap-3 border-t pt-6 ">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isLoading}
      >
        Cancel
      </Button>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Draft Purchase"}
      </Button>
    </div>
  );
}
