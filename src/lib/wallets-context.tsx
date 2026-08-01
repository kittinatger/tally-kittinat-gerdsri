"use client";

import { createContext, useContext } from "react";
import type { WalletOption } from "@/types/wallet";

const WalletsContext = createContext<WalletOption[]>([]);

export function WalletsProvider({ wallets, children }: { wallets: WalletOption[]; children: React.ReactNode }) {
  return <WalletsContext.Provider value={wallets}>{children}</WalletsContext.Provider>;
}

export function useWallets(): WalletOption[] {
  return useContext(WalletsContext);
}
