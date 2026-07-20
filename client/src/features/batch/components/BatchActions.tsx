import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

import type { Batch } from "../types/batch";

interface Props {
  batch: Batch;

  onView: (batch: Batch) => void;

  onEdit: (batch: Batch) => void;

  onDelete: (id: string) => void;
}

export function BatchActions({ batch, onView, onEdit, onDelete }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView(batch)}>
          <Eye className="mr-2 h-4 w-4" />
          View
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onEdit(batch)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-red-600"
          onClick={() => onDelete(batch._id)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
