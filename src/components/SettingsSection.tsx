export default function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
