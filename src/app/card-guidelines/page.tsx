import { getUserById } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import SettingsSubpageLayout from "@/components/SettingsSubpageLayout";
import WalletCardShape from "@/components/WalletCardShape";
import T from "@/components/T";
import type { MessageKey } from "@/lib/i18n/messages";

export const dynamic = "force-dynamic";

// Real spec numbers, pulled straight from the component that actually
// renders every wallet card in the app (WalletCardShape.tsx) rather than
// re-derived or approximated here — if that component's ratio/min-height
// ever changes, this page is the one place that goes stale, but at least
// it won't silently disagree with the code on day one.
const RATIO = "1.586 : 1";
const MM = "85.60mm × 53.98mm";
const INCHES = "3.370in × 2.125in";
const MIN_HEIGHT = "190px";

type Section = { heading: MessageKey; body: MessageKey };

const SECTIONS: Section[] = [
  { heading: "cardGuidelines.ratioHeading", body: "cardGuidelines.ratioBody" },
  { heading: "cardGuidelines.layoutHeading", body: "cardGuidelines.layoutBody" },
  { heading: "cardGuidelines.colorHeading", body: "cardGuidelines.colorBody" },
  { heading: "cardGuidelines.checklistHeading", body: "cardGuidelines.checklistBody" },
];

export default async function CardGuidelinesPage() {
  const userId = await getUserId();
  const user = await getUserById(userId);

  return (
    <SettingsSubpageLayout username={user?.username ?? ""} email={user?.email ?? null} title={<T k="cardGuidelines.title" />}>
      <p className="-mt-3 mb-5 text-sm text-ink-soft">
        <T k="cardGuidelines.intro" />
      </p>

      {/* A real WalletCardShape, not a mockup — this is the exact component
       * every wallet card in the app renders through, so the ratio/layout
       * shown here can't drift out of sync with what a submitted template
       * actually looks like. */}
      <div className="mb-6 max-w-sm">
        <WalletCardShape
          label="Sample Card"
          holderName="Jane Doe"
          last4="1234"
          expiryMonth={12}
          expiryYear={2029}
          network="visa"
          color="indigo"
          balance={1250.75}
          currency="USD"
          showBalance
        />
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-ink-soft sm:grid-cols-4">
          <div>
            <dt className="font-semibold text-foreground">{RATIO}</dt>
            <dd><T k="cardGuidelines.ratioLabel" /></dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">{MM}</dt>
            <dd><T k="cardGuidelines.physicalSizeLabel" /></dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">{INCHES}</dt>
            <dd><T k="cardGuidelines.physicalSizeLabel" /></dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">{MIN_HEIGHT}</dt>
            <dd><T k="cardGuidelines.minHeightLabel" /></dd>
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
