import { useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { useGetAllUsers } from "@/features/user/hooks/useUser";
import { useNotificationTemplates } from "@/features/notificationTemplate/hooks/useNotificationTemplates";
import { parseTemplateData } from "../lib/notificationPayload";
import { useCreateAdminNotification } from "../hooks/useNotificationAdmin";
import type { NotificationChannel } from "../types/notification.types";

interface Props {
  onOpenChange: (open: boolean) => void;
}

const channels: NotificationChannel[] = ["InApp", "Email", "SMS"];

export default function ComposeNotificationDialog({
  onOpenChange,
}: Props) {
  const users = useGetAllUsers();
  const templates = useNotificationTemplates();
  const create = useCreateAdminNotification();

  const [mode, setMode] = useState<"manual" | "template">("manual");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationChannel>("InApp");
  const [templateKey, setTemplateKey] = useState("");
  const [templateData, setTemplateData] = useState("{}");
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = users.data ?? [];
    if (!query) return list;
    return list.filter((user) =>
      `${user.name} ${user.email}`.toLowerCase().includes(query),
    );
  }, [search, users.data]);

  function toggleUser(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((userId) => userId !== id)
        : [...current, id],
    );
  }

  function handleSubmit() {
    if (selected.length === 0) {
      setError("Select at least one recipient");
      return;
    }

    let parsedTemplateData:
      | Record<string, string | number | boolean>
      | undefined;

    if (mode === "template") {
      if (!templateKey) {
        setError("Select a template");
        return;
      }
      const parsed = parseTemplateData(templateData);
      if (parsed.error || !parsed.data) {
        setError(parsed.error ?? "Invalid template data");
        return;
      }
      parsedTemplateData = parsed.data;
    } else if (!title.trim() || !message.trim()) {
      setError("Enter a title and message");
      return;
    }

    setError(null);
    create.mutate(
      {
        type,
        userIds: selected,
        ...(mode === "template"
          ? {
              templateKey,
              templateData: parsedTemplateData,
            }
          : { title: title.trim(), message: message.trim() }),
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compose notification</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "manual" ? "default" : "outline"}
              onClick={() => setMode("manual")}
            >
              Manual
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "template" ? "default" : "outline"}
              onClick={() => setMode("template")}
            >
              Template
            </Button>
          </div>

          {mode === "manual" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="notification-title">Title</Label>
                <Input
                  id="notification-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notification-message">Message</Label>
                <Textarea
                  id="notification-message"
                  rows={4}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Template</Label>
                <Select
                  value={templateKey}
                  onValueChange={setTemplateKey}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select active template" />
                  </SelectTrigger>
                  <SelectContent>
                    {(templates.data ?? [])
                      .filter((template) => template.isActive)
                      .map((template) => (
                        <SelectItem key={template._id} value={template.key}>
                          {template.name} ({template.channel})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="template-data">
                  Template data (JSON placeholders)
                </Label>
                <Textarea
                  id="template-data"
                  rows={4}
                  value={templateData}
                  onChange={(event) => setTemplateData(event.target.value)}
                />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label>Channel</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as NotificationChannel)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {channels.map((channel) => (
                  <SelectItem key={channel} value={channel}>
                    {channel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Recipients ({selected.length})</Label>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                className="pl-8"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search users..."
              />
            </div>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2">
              {filteredUsers.map((user) => (
                <label
                  key={user._id}
                  className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(user._id)}
                    onChange={() => toggleUser(user._id)}
                  />
                  <span className="font-medium">{user.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {user.email}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={create.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={create.isPending}>
            {create.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
