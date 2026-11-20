import NotificationPreferencesCard from "../components/NotificationPreferencesCard";

export default function NotificationSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Notification settings
        </h1>

        <p className="text-muted-foreground text-sm">
          Manage how SPIMS notifies you about stock, expiry, purchase and sales
          events.
        </p>
      </header>

      <NotificationPreferencesCard />
    </div>
  );
}
