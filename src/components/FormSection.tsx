"use client";

// A labeled group of fields inside a modal form — a small round icon
// badge plus a heading, wrapping its content in a bordered card. Used to
// break the long single-column add/edit forms (pass, wallet card,
// account) into visually distinct groups instead of a flat stack of bare
// labels, without changing how any of the fields inside actually work.
export default function FormSection({
  icon,
  title,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  /** An optional control shown at the right of the header (e.g. "Scan instead"). */
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy/10 text-navy dark:text-blue-300">
            {icon}
          </span>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
