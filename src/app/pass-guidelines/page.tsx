import { getUserById } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import SettingsSubpageLayout from "@/components/SettingsSubpageLayout";
import PassShape from "@/components/PassShape";
import T from "@/components/T";
import type { MessageKey } from "@/lib/i18n/messages";

export const dynamic = "force-dynamic";

// Real numbers, pulled from the component that actually renders every pass
// in the app (PassShape.tsx) rather than re-derived here — logo/banner have
// no fixed box at all (both crop freeform, see MembershipCardModal's
// aspect={null}), so there's no single ratio to quote the way cards have one.
const LOGO_MAX_HEIGHT = "36px";
const LOGO_MAX_WIDTH = "112px";
const BANNER_MAX_HEIGHT = "224px";
const CORNER_RADIUS = "16px";

type Section = { heading: MessageKey; body: MessageKey };

const SECTIONS: Section[] = [
  { heading: "passGuidelines.shapeHeading", body: "passGuidelines.shapeBody" },
  { heading: "passGuidelines.assetsHeading", body: "passGuidelines.assetsBody" },
  { heading: "passGuidelines.layoutHeading", body: "passGuidelines.layoutBody" },
  { heading: "passGuidelines.kindCategoryHeading", body: "passGuidelines.kindCategoryBody" },
  { heading: "passGuidelines.colorHeading", body: "passGuidelines.colorBody" },
  { heading: "passGuidelines.checklistHeading", body: "passGuidelines.checklistBody" },
];

export default async function PassGuidelinesPage() {
  const userId = await getUserId();
  const user = await getUserById(userId);

  return (
    <SettingsSubpageLayout username={user?.username ?? ""} email={user?.email ?? null} title={<T k="passGuidelines.title" />}>
      <p className="-mt-3 mb-5 text-sm text-ink-soft">
        <T k="passGuidelines.intro" />
      </p>

      {/* A real PassShape, not a mockup — this is the exact component every
       * pass in the app renders through, so the layout shown here can't
       * drift out of sync with what a submitted template actually looks
       * like. storeCard is used as the example kind since it's the
       * simplest one with a real field. */}
      <div className="mb-6 max-w-sm">
        <PassShape
          name="Daily Grind Coffee"
          color="amber"
          icon="coffee"
          kind="storeCard"
          fields={{ pointsBalance: "240 pts", memberSince: "2024" }}
          layout={null}
          codeValue="1234567890"
          codeFormat="qr"
        />
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-ink-soft sm:grid-cols-4">
          <div>
            <dt className="font-semibold text-foreground">{LOGO_MAX_HEIGHT}</dt>
            <dd><T k="passGuidelines.logoHeightLabel" /></dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">{LOGO_MAX_WIDTH}</dt>
            <dd><T k="passGuidelines.logoWidthLabel" /></dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">{BANNER_MAX_HEIGHT}</dt>
            <dd><T k="passGuidelines.bannerHeightLabel" /></dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">{CORNER_RADIUS}</dt>
            <dd><T k="passGuidelines.cornerRadiusLabel" /></dd>
          </div>
        </dl>
      </div>

      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <section key={section.heading} className="rounded-card border border-line bg-surface p-5">
            <h3 className="mb-2 font-display text-lg text-foreground">
              <T k={section.heading} />
            </h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">
              <T k={section.body} />
            </p>
          </section>
        ))}
      </div>
    </SettingsSubpageLayout>
  );
}
