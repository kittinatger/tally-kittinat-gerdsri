import AppHeader from "./AppHeader";
import BackToSettingsLink from "./BackToSettingsLink";
import SettingsNavList from "./SettingsNavList";

/**
 * Shared chrome for the standalone Support pages (Usage guide, FAQs,
 * Troubleshooting, Contact, Report an issue, Changelog) — real routes
 * rather than in-app Settings panels, so without this they'd lose the
 * persistent Settings nav list on desktop the moment you left /settings.
 * Below lg: just the page content with a Back-to-Settings link, same as
 * before. At lg+: the same nav list SettingsView.tsx shows, in link mode
 * (its panel rows navigate to /settings?panel=X instead of switching
 * local state, since these pages don't fetch the data those panels need).
 */
export default function SettingsSubpageLayout({
  username,
  email,
  title,
  children,
}: {
  username: string;
  email: string | null;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10 lg:max-w-6xl">
      <AppHeader />

      <main className="flex-1 px-1 py-6 sm:px-2 lg:flex lg:items-start lg:gap-6">
        {/* Independent scroll region at lg+ (sticky under the header,
         * capped to the viewport) — otherwise the nav list and the page
         * content share one page scroll, so scrolling the list drags the
         * content down with it. Matches SettingsView.tsx's two-pane
         * layout. */}
        <div className="hidden lg:sticky lg:top-[88px] lg:block lg:max-h-[calc(100dvh-104px)] lg:w-[320px] lg:shrink-0 lg:overflow-y-auto">
          <SettingsNavList mode="link" username={username} email={email} />
        </div>
        <div className="lg:min-w-0 lg:flex-1">
          <BackToSettingsLink className="lg:hidden" />
          <h2 className="mb-5 font-display text-2xl text-foreground">{title}</h2>
          {children}
        </div>
      </main>
    </div>
  );
}
