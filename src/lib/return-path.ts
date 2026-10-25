// Only same-app paths, so a ?from= parameter can't send anyone off-site.
export function safeReturnPath(from: string | undefined, fallback = "/wallet"): string {
  return from && from.startsWith("/") && !from.startsWith("//") ? from : fallback;
}
