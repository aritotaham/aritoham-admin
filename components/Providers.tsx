"use client";

import { WalletProvider } from "./WalletProvider";
import { AdminProvider } from "./AdminContext";
import Shell from "./Shell";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <AdminProvider>
        <Shell>{children}</Shell>
      </AdminProvider>
    </WalletProvider>
  );
}
