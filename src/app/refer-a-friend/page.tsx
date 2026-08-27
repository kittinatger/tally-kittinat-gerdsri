import { getUserById } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { getAppOriginFromHeaders } from "@/lib/app-url";
import SettingsSubpageLayout from "@/components/SettingsSubpageLayout";
import ReferFriendCard from "@/components/ReferFriendCard";
import T from "@/components/T";

export const dynamic = "force-dynamic";

export default async function ReferAFriendPage() {
  const userId = await getUserId();
  const user = await getUserById(userId);
  const origin = await getAppOriginFromHeaders();

  return (
    <SettingsSubpageLayout username={user?.username ?? ""} email={user?.email ?? null} title={<T k="settings.referFriend" />}>
      <ReferFriendCard shareUrl={`${origin}/register`} embedUrl={`${origin}/embed/refer`} />
    </SettingsSubpageLayout>
  );
}
