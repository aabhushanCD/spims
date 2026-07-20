import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Loader2 } from "lucide-react";

import { useDeleteBatch } from "../hooks/useMutateBatch";

interface Props {
  open: boolean;

  setOpen: (value: boolean) => void;

  batchId: string | null;
}

export default function DeleteBatchDialog({
  open,

  setOpen,

  batchId,
}: Props) {
  const deleteBatch = useDeleteBatch();

  function handleDelete() {
    if (!batchId) return;

    deleteBatch.mutate(batchId, {
      onSuccess: () => {
        setOpen(false);
      },
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Batch?</AlertDialogTitle>

          <AlertDialogDescription>
            This action cannot be undone. The batch record will be permanently
            removed.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>

          <AlertDialogAction
            onClick={handleDelete}

            disabled={deleteBatch.isPending}
          >
            {deleteBatch.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
