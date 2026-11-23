import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User, UserRole } from "../types/user.types";
import { useChangeRole } from "../hooks/useMutateUser";

interface Props {
  user: User;
  onOpenChange: (open: boolean) => void;
}

const roles: UserRole[] = ["owner", "inventory_manager", "pharmacist"];

export default function UserRoleDialog({ user, onOpenChange }: Props) {
  const changeRole = useChangeRole();
  const [role, setRole] = useState<UserRole>(user.role);

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription>
            Changing a role revokes the user’s active sessions and refresh
            tokens.
          </DialogDescription>
        </DialogHeader>

        <Select
          value={role}
          onValueChange={(value) => setRole(value as UserRole)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={changeRole.isPending}
          >
            Cancel
          </Button>
          <Button
            disabled={changeRole.isPending || role === user.role}
            onClick={() =>
              changeRole.mutate(
                { userId: user._id, newRole: role },
                { onSuccess: () => onOpenChange(false) },
              )
            }
          >
            {changeRole.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
