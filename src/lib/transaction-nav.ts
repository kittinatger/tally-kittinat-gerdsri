// Set by Activities right before it navigates to /transactions/[id], so the
// details page knows its Back button can simply go back in history (keeping
// Activities' scroll position) instead of pushing a fresh "/" — which it
// still does when the page was opened directly, e.g. from a shared link.
let openedFromList = false;

export function markOpenedFromList() {
  openedFromList = true;
}

export function consumeOpenedFromList(): boolean {
  const value = openedFromList;
  openedFromList = false;
  return value;
}
