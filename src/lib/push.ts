import webpush from "web-push";
import { listPushSubscriptionsForUser, deletePushSubscription } from "@/lib/db";

// VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY are a keypair generated once for this
// deployment (via web-push's generateVAPIDKeys()) and set as Vercel env
// vars — the public half is also exposed to the client, unprefixed here
// but read client-side via NEXT_PUBLIC_VAPID_PUBLIC_KEY (see
// push-subscribe.ts). VAPID_SUBJECT is a mailto: or https: URL push
// services use to contact the sender if something's wrong; falls back to
// a placeholder so a deployment that hasn't set it yet doesn't crash, but
// push sends will simply no-op (see sendPushToUser) until real keys exist.
let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:support@example.com", publicKey, privateKey);
  configured = true;
  return true;
}

export type PushPayload = { title: string; body: string; url?: string };

// Sends to every subscription on file for this user (phone + laptop, etc.)
// — a subscription the push service reports as gone (410/404, the
// standard "this endpoint no longer exists" response) is removed rather
// than retried, since it'll never succeed again.
export async function sendPushToUser(userId: number, payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;
  const subs = await listPushSubscriptionsForUser(userId);
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number } | undefined)?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await deletePushSubscription(sub.endpoint);
        }
        // Any other failure (network blip, service outage) is left alone
        // — the next day's cron run will simply try again with whatever's
        // due at that point.
      }
    }),
  );
}
