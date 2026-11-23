import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import UserSearchSelect from "@/features/user/components/UserSearchSelect";
import type { User } from "@/features/user/types/user.types";
import { notificationService } from "../services/notification.service";

interface Props {
  onOpenChange: (open: boolean) => void;
}

export default function UserNotificationPreferencesDialog({
  onOpenChange,
}: Props) {
  const [user, setUser] = useState<User | null>(null);

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User notification preferences</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>User</Label>
            <UserSearchSelect selected={user} onChange={setUser} />
          </div>

          {user && <PreferenceForm key={user._id} userId={user._id} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PreferenceForm({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const prefs = useQuery({
    queryKey: ["notification-preferences", userId],
    queryFn: () => notificationService.getPreferencesForUser(userId),
  });

  const update = useMutation({
    mutationFn: (patch: { email?: boolean; sms?: boolean }) =>
      notificationService.updatePreferencesForUser(userId, patch),
    onSuccess: () => {
      toast.success("Preferences updated");
      queryClient.invalidateQueries({
        queryKey: ["notification-preferences", userId],
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update preferences"));
    },
  });

  if (prefs.isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!prefs.data) {
    return (
      <p className="text-destructive text-sm">
        Could not load user preferences.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center justify-between rounded-lg border p-3">
        <span className="text-sm">Email notifications</span>
        <Switch
          checked={prefs.data.email}
          disabled={update.isPending}
          onCheckedChange={(checked) => update.mutate({ email: checked })}
        />
      </label>
      <label className="flex items-center justify-between rounded-lg border p-3">
        <span className="text-sm">SMS notifications</span>
        <Switch
          checked={prefs.data.sms}
          disabled={update.isPending}
          onCheckedChange={(checked) => update.mutate({ sms: checked })}
        />
      </label>
    </div>
  );
}
