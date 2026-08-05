import Link from "next/link";

export default async function ShareTargetDonePage({
  searchParams,
}: {
  searchParams: Promise<{ imported?: string; skipped?: string }>;
}) {
  const { imported, skipped } = await searchParams;
  const importedCount = Number(imported ?? 0);
  const skippedCount = Number(skipped ?? 0);

  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="font-display text-2xl text-foreground">
        {importedCount > 0 ? "Imported!" : "Nothing imported"}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">
        {importedCount > 0
          ? `Added ${importedCount} transaction${importedCount === 1 ? "" : "s"} from your shared photo${importedCount === 1 ? "" : "s"} — tagged "auto-import" in Activities so you can double-check them.`
          : "Couldn't read a transaction from what was shared."}
        {skippedCount > 0 && ` ${skippedCount} skipped.`}
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark"
      >
        Go to Dashboard
      </Link>
    </main>
  );
}
