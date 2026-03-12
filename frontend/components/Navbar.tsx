"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/send": "Send",
  "/groups": "Groups",
  "/polka-links": "PolkaLinks",
  "/subpay-sdk": "@subpay/sdk",
  "/pay": "Pay",
};

function getTitle(pathname: string): string {
  for (const [key, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === key || pathname.startsWith(key + "/")) return title;
  }
  return "subpay";
}

export default function Navbar() {
  const pathname = usePathname();
  const title = getTitle(pathname);

  return (
    <header className="fixed top-0 left-64 right-0 h-24 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-30">
      <span className="text-2xl font-semibold text-slate-800">{title}</span>
      <ConnectButton
        accountStatus="address"
        chainStatus="full"
        showBalance={true}
      />
    </header>
  );
}
