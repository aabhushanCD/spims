// UserActions.tsx

import { MoreHorizontal } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

interface Props {
  id: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function UserActions({ id, onEdit, onDelete }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(id)}>Edit</DropdownMenuItem>

        <DropdownMenuItem onClick={() => onDelete(id)} className="text-red-600">
          Deactivate
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
