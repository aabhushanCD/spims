import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ReorderRecommendation } from "../types/smart.types";
import { useRejectRecommendation } from "../hooks/useSmartMutate";

interface Props {
  recommendation: ReorderRecommendation;
  onOpenChange: (open: boolean) => void;
}

export default function RejectReorderDialog({
  recommendation,
  onOpenChange,
}: Props) {
  const reject = useRejectRecommendation();
  const [reason, setReason] = useState("");

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject recommendation</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="reject-reason">Reason (optional)</Label>
          <Textarea
            id="reject-reason"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={reject.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={reject.isPending}
            onClick={() =>
              reject.mutate(
                {
                  id: recommendation._id,
                  ...(reason.trim() ? { reason: reason.trim() } : {}),
                },
                { onSuccess: () => onOpenChange(false) },
              )
            }
          >
            {reject.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
