"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Send, Users, Link2, Code2 } from "lucide-react";

const NAV_ITEMS = [
  { href: "/send", label: "Send", icon: Send },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/polka-links", label: "PolkaLinks", icon: Link2 },
  {
    href: "/subpay-sdk",
    label: "@subpay/sdk",
    icon: Code2,
    badge: "Coming soon",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-slate-200 bg-white flex flex-col z-40">
      <div className="px-6 py-6 border-b border-slate-100">
        <span className="text-2xl font-semibold text-pink-600">subpay</span>
        <p className="text-xs text-slate-400 mt-0.5">Polkadot Hub Testnet</p>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? "bg-pink-50 text-pink-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon size={16} strokeWidth={2} />
                {item.label}
              </span>
              {"badge" in item && item.badge ? (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[7px] font-medium uppercase tracking-[0.08em] text-slate-900">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>


    </aside>
  );
}
