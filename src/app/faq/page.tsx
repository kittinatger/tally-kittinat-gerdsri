import { getUserById } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import SettingsSubpageLayout from "@/components/SettingsSubpageLayout";
import FaqAccordion from "@/components/FaqAccordion";
import T from "@/components/T";

export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const userId = await getUserId();
  const user = await getUserById(userId);

  return (
    <SettingsSubpageLayout username={user?.username ?? ""} email={user?.email ?? null} title={<T k="settings.faqs" />}>
      <p className="-mt-3 mb-5 text-sm text-ink-soft">
        <T k="faq.subtitle" />
      </p>
      <FaqAccordion />
    </SettingsSubpageLayout>
  );
}
