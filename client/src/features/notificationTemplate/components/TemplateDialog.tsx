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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { NotificationChannel } from "@/features/notification/types/notification.types";
import {
  useCreateTemplate,
  useUpdateTemplate,
} from "../hooks/useNotificationTemplates";
import type { NotificationTemplate } from "../types/notificationTemplate.types";

interface Props {
  editing: NotificationTemplate | null;
  onOpenChange: (open: boolean) => void;
}

const channels: NotificationChannel[] = ["Email", "SMS", "InApp"];

export default function TemplateDialog({ editing, onOpenChange }: Props) {
  const create = useCreateTemplate();
  const update = useUpdateTemplate();
  const [key, setKey] = useState(editing?.key ?? "");
  const [name, setName] = useState(editing?.name ?? "");
  const [channel, setChannel] = useState<NotificationChannel>(
    editing?.channel ?? "InApp",
  );
  const [subject, setSubject] = useState(editing?.subject ?? "");
  const [body, setBody] = useState(editing?.body ?? "");
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);

  const isPending = create.isPending || update.isPending;

  function handleSubmit() {
    if (!key.trim() || !name.trim() || !subject.trim() || !body.trim()) {
      setError("Key, name, subject, and body are required");
      return;
    }

    setError(null);
    const data = {
      key: key.trim(),
      name: name.trim(),
      channel,
      subject: subject.trim(),
      body,
      isActive,
    };

    if (editing) {
      update.mutate(
        { id: editing._id, data },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      create.mutate(data, { onSuccess: () => onOpenChange(false) });
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit template" : "Create template"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="template-key">Key</Label>
              <Input
                id="template-key"
                value={key}
                onChange={(event) => setKey(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="template-name">Name</Label>
              <Input
                id="template-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Channel</Label>
            <Select
              value={channel}
              onValueChange={(value) =>
                setChannel(value as NotificationChannel)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {channels.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="template-subject">Subject</Label>
            <Input
              id="template-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="template-body">Body</Label>
            <Textarea
              id="template-body"
              rows={6}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Use {{placeholders}} for dynamic values"
            />
          </div>

          <label className="flex items-center justify-between rounded-lg border p-3 text-sm">
            <span>Active</span>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </label>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editing ? "Save changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
