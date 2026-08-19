"use client";

import { heroGradientClasses, colorHeroStyle } from "@/lib/category-styles";

// Wraps a live card/pass preview in a soft ambient glow matching its own
// color — same gradient the preview itself uses (named palette class or
// custom-hex inline style, see category-styles.ts), just blurred and
// faded behind it. Turns the preview into a small "hero" moment at the
// top of the add/edit forms instead of a plain boxed thumbnail.
export default function ColorGlowPreview({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className="relative px-2 py-3">
      <div
        aria-hidden="true"
        className={`absolute inset-x-8 inset-y-2 -z-10 rounded-[2rem] opacity-40 blur-2xl ${heroGradientClasses(color)}`}
        style={colorHeroStyle(color)}
      />
      {children}
    </div>
  );
}
