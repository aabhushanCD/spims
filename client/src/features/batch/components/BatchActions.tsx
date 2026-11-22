import {
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  TrendingDown,
  Trash,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import type { Batch } from "../types/batch.types";

interface Props {
  batch: Batch;
  onView: () => void;
  onEdit: () => void;
  onAdjust: () => void;
  onIncrease: () => void;
  onDeduct: () => void;
  onDispose: () => void;
  onDelete: () => void;
}

export function BatchActions({
  batch,
  onView,
  onEdit,
  onAdjust,
  onIncrease,
  onDeduct,
  onDispose,
  onDelete,
}: Props) {
  const canDispose =
    batch.isExpired === true && batch.quantityRemaining > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onView}>
          <Eye className="mr-2 h-4 w-4" />
          View history
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onAdjust}>
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Adjust to count
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onIncrease}>
          <Plus className="mr-2 h-4 w-4" />
          Increase stock
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDeduct}>
          <TrendingDown className="mr-2 h-4 w-4" />
          Deduct stock
        </DropdownMenuItem>

        {canDispose && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onDispose}
            >
              <Trash className="mr-2 h-4 w-4" />
              Dispose expired stock
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
