import { notFound } from "next/navigation";
import Link from "next/link";
import { getSplitByShareToken, getCurrency } from "@/lib/db";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

// A public, read-only view of a split — reachable with no Tally account
// (see src/proxy.ts's public-route matcher and getSplitByShareToken in
// db.ts) so a non-user participant can see what they owe. No mutation
// happens here; settling/accepting still requires signing in.
export default async function PublicSplitPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await getSplitByShareToken(token);
  if (!result) notFound();
  const { split, participants } = result;
  const currency = await getCurrency(split.creator_id);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-6 flex items-center justify-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/favicon-light.svg" alt="" className="h-7 w-7 dark:hidden" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/favicon-dark.svg" alt="" className="hidden h-7 w-7 dark:block" />
        <span className="font-display text-lg text-foreground">Tally</span>
      </div>

      <div className="rounded-card border border-line bg-surface p-5 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Split bill</p>
        <h1 className="mt-1 font-display text-2xl text-foreground">{split.title}</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {formatCurrency(Number(split.total_amount), currency)} · {split.date}
        </p>

        <div className="mt-5 space-y-2.5">
          {participants.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-card border border-line px-3.5 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{p.username}</p>
                <p className="text-xs text-ink-soft">
                  {p.confirm_status === "pending" ? "Pending" : p.confirm_status === "declined" ? "Declined" : p.settled ? "Settled" : "Owes"}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-foreground">{formatCurrency(Number(p.owed_amount), currency)}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-ink-soft">
        Shared from Tally.{" "}
        <Link href="/welcome" className="font-semibold text-navy hover:underline dark:text-blue-300">
          Create your own account
        </Link>
      </p>
    </main>
  );
}
