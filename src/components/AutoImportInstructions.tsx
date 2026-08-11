function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy/10 text-xs font-bold text-navy dark:text-blue-300">
      {n}
    </span>
  );
}

export default function AutoImportInstructions() {
  return (
    <div className="mt-6 space-y-4 border-t border-line pt-4">
      <div className="rounded-card border border-line bg-surface p-4">
        <div className="flex items-start gap-3">
          <StepBadge n={1} />
          <div className="min-w-0">
            <p className="mb-1.5 text-sm font-semibold text-foreground">iOS — fully automatic</p>
            <p className="text-xs leading-relaxed text-ink-soft">
              In the Shortcuts app, create a <strong>Personal Automation</strong> → <strong>Photo Added</strong> → pick
              an album → add action <strong>Get Contents of URL</strong>: URL{" "}
              <code className="rounded bg-bg-soft px-1 py-0.5 font-mono">{"{origin}"}/api/intake/receipt</code>, Method{" "}
              <strong>POST</strong>, Headers{" "}
              <code className="rounded bg-bg-soft px-1 py-0.5 font-mono">Authorization: Bearer &lt;your token&gt;</code>,
              Request Body <strong>Form</strong> with a field named{" "}
              <code className="rounded bg-bg-soft px-1 py-0.5 font-mono">image</code> set to Shortcut Input (the photo).
              Turn off &quot;Ask Before Running&quot; so it fires silently.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-card border border-line bg-surface p-4">
        <div className="flex items-start gap-3">
          <StepBadge n={2} />
          <div className="min-w-0">
            <p className="mb-1.5 text-sm font-semibold text-foreground">iOS — one-tap from the Share Sheet</p>
            <p className="text-xs leading-relaxed text-ink-soft">
              Same idea, but create it as a regular <strong>Shortcut</strong> (not an automation) with{" "}
              <strong>Show in Share Sheet</strong> turned on and its input type set to Images. It&apos;ll then show up
              as e.g. &quot;Send to Tally&quot; whenever you tap Share on a photo.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-card border border-line bg-surface p-4">
        <div className="flex items-start gap-3">
          <StepBadge n={3} />
          <div className="min-w-0">
            <p className="mb-1.5 text-sm font-semibold text-foreground">Android — Share Sheet</p>
            <p className="text-xs leading-relaxed text-ink-soft">
              Install Tally to your home screen first (this only works for the installed app, not the browser tab).
              Then select one or more photos in your gallery, tap Share, and choose <strong>Tally</strong> — no token
              needed, since it uses your normal sign-in.
            </p>
          </div>
        </div>
      </div>

      <p className="text-[11px] leading-snug text-ink-soft">
        However a receipt gets in, it&apos;s tagged <strong>auto-import</strong> and keeps the original photo attached
        — filter by that tag in Activities to double-check anything the automation misread.
      </p>
    </div>
  );
}
