// Shows a desktop screenshot by default, swapped for a mobile one below the
// `sm` breakpoint — pure CSS (`hidden`/`sm:hidden`), not a JS viewport
// check, so it works identically during server render and on first paint
// with no layout flash. `mobileSrc` defaults to the same file as `src`
// (desktop) for a section that doesn't have a distinct mobile capture yet;
// pass it explicitly once one exists.
export default function SupportScreenshot({
  src,
  alt,
  mobileSrc,
  mobileAlt,
}: {
  src: string;
  alt: string;
  mobileSrc?: string;
  mobileAlt?: string;
}) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/screenshots/${src}`} alt={alt} loading="lazy" className="mt-3 hidden w-full rounded-2xl border border-line shadow-sm sm:block" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/screenshots/${mobileSrc ?? src}`}
        alt={mobileAlt ?? alt}
        loading="lazy"
        className="mt-3 w-full rounded-2xl border border-line shadow-sm sm:hidden"
      />
    </>
  );
}
