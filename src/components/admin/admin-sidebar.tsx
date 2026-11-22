
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  CalendarDays,
  ClipboardList,
  CreditCard,
  ChartNoAxesCombined,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Wrench,
} from "lucide-react";

const navigation = [
  {
    title: "MAIN MENU",
    items: [
      { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Equipment", href: "/admin/equipment", icon: Package },
      { label: "Bookings", href: "/admin/bookings", icon: CalendarDays },
      { label: "Reviews", href: "/admin/reviews", icon: ClipboardList },
      { label: "Payments", href: "/admin/payments", icon: CreditCard },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { label: "Analytics", href: "/admin/analytics", icon: ChartNoAxesCombined },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

type AdminSidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export default function AdminSidebar({
  mobileOpen = false,
  onMobileClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-slate-800 bg-[#080D20] text-white transition-all duration-300 lg:sticky lg:top-0 ${
          collapsed ? "w-[88px]" : "w-[280px]"
        } ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="flex h-[82px] shrink-0 items-center justify-between border-b border-white/10 px-5">
          <Link
            href="/admin/dashboard"
            onClick={onMobileClose}
            className="flex min-w-0 items-center gap-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-[#07111F]">
              <Wrench size={22} />
            </span>

            {!collapsed && (
              <span className="text-lg font-black tracking-wider">
                EQUIP<span className="text-emerald-400">ORA</span>
                <span className="block text-[9px] font-semibold tracking-[0.2em] text-slate-400">
                  ADMIN PANEL
                </span>
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={onMobileClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={19} />
          </button>
        </div>

        {/* Collapse Button */}
        <div className="hidden justify-end px-3 pt-4 lg:flex">
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-8 overflow-y-auto px-3 py-6">
          {navigation.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.18em] text-slate-500">
                  {section.title}
                </p>
              )}

              <div className="space-y-1.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onMobileClose}
                      title={collapsed ? item.label : undefined}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-3.5 text-sm font-semibold transition-all ${
                        active
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      } ${collapsed ? "justify-center" : ""}`}
                    >
                      <Icon
                        size={20}
                        className="shrink-0"
                      />

                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {active && (
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Information */}
        <div className="shrink-0 border-t border-white/10 p-4">
          <div
            className={`rounded-xl bg-white/5 p-3 ${
              collapsed ? "text-center" : ""
            }`}
          >
            <div className="mb-2 flex items-center gap-2 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {!collapsed && (
                <span className="text-xs font-bold">System Online</span>
              )}
            </div>

            {!collapsed && (
              <p className="text-xs leading-5 text-slate-400">
                Manage your EQUIPORA rental marketplace.
              </p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
