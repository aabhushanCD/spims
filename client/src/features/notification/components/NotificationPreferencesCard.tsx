import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useNotificationPreferences } from "../hooks/useNotificationPreferences";
import { useUpdateNotificationPreferences } from "../hooks/useUpdateNotificationPreferences";

interface PreferenceRowProps {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function PreferenceRow({
  id,
  title,
  description,
  checked,
  disabled,
  onCheckedChange,
}: PreferenceRowProps) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 first:pt-0 last:pb-0">
      <div className="space-y-1">
        <Label htmlFor={id} className="text-sm font-medium">
          {title}
        </Label>

        <p className="text-muted-foreground text-xs">{description}</p>
      </div>

      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

export default function NotificationPreferencesCard() {
  const { data, isLoading, isError, refetch } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification preferences</CardTitle>

        <CardDescription>
          Choose how SPIMS reaches you. Changes save automatically.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="space-y-4">
            {[0, 1].map((row) => (
              <div key={row} className="flex items-center justify-between gap-6">
                <div className="w-full space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && (isError || !data) && (
          <div className="space-y-3 py-4 text-center">
            <p className="text-muted-foreground text-sm">
              Could not load your notification preferences.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        )}

        {!isLoading && !isError && data && (
          <div className="divide-y">
            <PreferenceRow
              id="notifications-email"
              title="Email notifications"
              description="Stock, expiry, purchase and low-stock alerts sent to your email address."
              checked={data.email}
              disabled={updatePreferences.isPending}
              onCheckedChange={(checked) =>
                updatePreferences.mutate({ email: checked })
              }
            />

            <PreferenceRow
              id="notifications-sms"
              title="SMS notifications"
              description="The same alerts sent by text message to the phone number on your account."
              checked={data.sms}
              disabled={updatePreferences.isPending}
              onCheckedChange={(checked) =>
                updatePreferences.mutate({ sms: checked })
              }
            />

            <div className="flex items-start justify-between gap-6 py-4 last:pb-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">In-app notifications</p>
                  <Badge variant="outline">Always on</Badge>
                </div>

                <p className="text-muted-foreground text-xs">
                  Every notification is recorded in your inbox, including
                  critical alerts that bypass email and SMS opt-outs.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
