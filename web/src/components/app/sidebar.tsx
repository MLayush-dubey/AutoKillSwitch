"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  SlidersHorizontal,
  History,
  Plug,
  CreditCard,
  Settings,
  LifeBuoy,
  ShieldCheck,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const baseItems = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/rules", label: "Rules", icon: SlidersHorizontal },
  { href: "/app/history", label: "History", icon: History },
  { href: "/app/broker", label: "Broker", icon: Plug },
  { href: "/app/billing", label: "Billing", icon: CreditCard },
  { href: "/app/settings", label: "Settings", icon: Settings },
  { href: "/app/support", label: "Support", icon: LifeBuoy },
];

export function AppSidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const items = isAdmin
    ? [...baseItems, { href: "/app/admin", label: "Admin", icon: Shield }]
    : baseItems;

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card/40 md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5 font-semibold">
        <ShieldCheck className="h-5 w-5 text-[color:var(--brand-emerald)]" />
        <span>AutoKillSwitch</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const active =
            item.href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3 text-xs text-muted-foreground">
        Market hours: 9:15 – 15:30 IST
      </div>
    </aside>
  );
}
