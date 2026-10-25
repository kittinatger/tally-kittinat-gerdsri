import { getNotificationSettings, getUserById } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import NotificationPreferencesView from "@/components/NotificationPreferencesView";

export const dynamic = "force-dynamic";

// Which notifications Tally sends: one switch per kind, grouped, plus
// "Pause all" and the email/push options (Settings > Notifications).
export default async function NotificationSettingsPage() {
  const userId = await getUserId();
  const [settings, user] = await Promise.all([getNotificationSettings(userId), getUserById(userId)]);
  return <NotificationPreferencesView initialPrefs={settings.prefs} initialPausedUntil={settings.pausedUntil} hasEmail={Boolean(user?.email)} />;
}
