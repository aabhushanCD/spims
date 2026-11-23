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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User } from "../types/user.types";
import { useUpdateUser } from "../hooks/useMutateUser";

interface Props {
  user: User;
  onOpenChange: (open: boolean) => void;
}

export default function UserEditDialog({ user, onOpenChange }: Props) {
  const update = useUpdateUser();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required");
      return;
    }
    if (password && password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setError(null);
    update.mutate(
      {
        userId: user._id,
        userData: {
          name: name.trim(),
          email: email.trim(),
          ...(password ? { password } : {}),
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit user profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="user-name">Name</Label>
            <Input
              id="user-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="user-password">New password (optional)</Label>
            <Input
              id="user-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Leave blank to keep current password"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={update.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={update.isPending}>
            {update.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
