export default function SupportScreenshot({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/screenshots/${src}`}
      alt={alt}
      loading="lazy"
      className="mt-3 w-full rounded-2xl border border-line shadow-sm"
    />
  );
}
