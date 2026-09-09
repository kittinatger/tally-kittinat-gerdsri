// A folder groups either wallets/cards or passes on the /wallet page —
// never both; `kind` scopes it to whichever of the page's two
// already-separate stacks it belongs to. See card_folders in db.ts.
// `kind` is a plain string (not a "wallet"|"pass" union) to match
// CardFolderRow (db.ts) exactly — which of the two a given folder
// actually is is already known contextually (the wallet-page prop it
// arrived through, or the API call that fetched it), never inferred from
// this field's type.
export type CardFolder = {
  id: number;
  kind: string;
  name: string;
  color: string;
};
