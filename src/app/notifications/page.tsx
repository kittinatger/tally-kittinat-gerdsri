import NotificationsView from "@/components/NotificationsView";

export const dynamic = "force-dynamic";

// The notification inbox (the header bell links here). Its data comes from
// the shared client store in lib/notification-store.ts, same as the badge.
export default function NotificationsPage() {
  return <NotificationsView />;
}
