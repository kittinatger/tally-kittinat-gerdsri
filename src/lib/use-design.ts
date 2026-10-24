import { useSyncExternalStore } from "react";

export type Design = "modern" | "classic";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-design"] });
  return () => observer.disconnect();
}

function getSnapshot(): Design {
  return document.documentElement.getAttribute("data-design") === "classic" ? "classic" : "modern";
}

// Server render + hydration assume "modern" (the default); useSyncExternalStore
// then re-renders with the real attribute for anyone on Classic, so there's no
// hydration mismatch either way.
export function useDesign(): Design {
  return useSyncExternalStore(subscribe, getSnapshot, () => "modern");
}
