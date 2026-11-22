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
import { useRenderTemplate } from "../hooks/useNotificationTemplates";
import type { NotificationTemplate } from "../types/notificationTemplate.types";

interface Props {
  template: NotificationTemplate;
  onOpenChange: (open: boolean) => void;
}

export default function TemplatePreviewDialog({
  template,
  onOpenChange,
}: Props) {
  const render = useRenderTemplate();
  const [data, setData] = useState("{}");
  const [error, setError] = useState<string | null>(null);

  function handleRender() {
    let parsed: Record<string, string | number | boolean>;

    try {
      parsed = JSON.parse(data) as Record<string, string | number | boolean>;
    } catch {
      setError("Template data must be valid JSON");
      return;
    }

    setError(null);
    render.mutate({ id: template._id, data: parsed });
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Preview {template.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="preview-data">Placeholder data (JSON)</Label>
            <Textarea
              id="preview-data"
              rows={4}
              value={data}
              onChange={(event) => setData(event.target.value)}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          {render.data && (
            <div className="space-y-2 rounded-lg border p-4 text-sm">
              <p className="text-muted-foreground text-xs">Subject</p>
              <p className="font-medium">{render.data.subject}</p>
              <p className="text-muted-foreground text-xs">Body</p>
              <p className="whitespace-pre-wrap">{render.data.body}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={render.isPending}
          >
            Close
          </Button>
          <Button onClick={handleRender} disabled={render.isPending}>
            {render.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Render
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
