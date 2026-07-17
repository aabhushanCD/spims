import { Button } from "@/components/ui/button";

interface Props {
  loading: boolean;

  onCancel: () => void;
}

export default function ReceivePurchaseFooter({ loading, onCancel }: Props) {
  return (
    <div className="flex justify-end gap-3">
      <Button variant="outline" type="button" onClick={onCancel}>
        Cancel
      </Button>

      <Button type="submit" disabled={loading}>
        {loading ? "Receiving..." : "Receive Stock"}
      </Button>
    </div>
  );
}
