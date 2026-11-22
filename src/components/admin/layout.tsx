
"use client";

import { useState } from "react";
import AdminSidebar from "@/components/admin/admin-sidebar";
import {
  Menu,
  Bell,
  ShieldCheck,
} from "lucide-react";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <div className="flex min-h-screen">
        <AdminSidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Admin Topbar */}
          <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur-md sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
                aria-label="Open admin menu"
              >
                <Menu size={21} />
              </button>

              <div>
                <h1 className="text-base font-bold text-slate-900 sm:text-lg">
                  EQUIPORA Admin
                </h1>
                <p className="hidden text-xs text-slate-500 sm:block">
                  Marketplace Management System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-5">
              <span className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:flex">
                <ShieldCheck size={15} />
                Administrator
              </span>

              <button
                type="button"
                className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-100"
                aria-label="Notifications"
              >
                <Bell size={19} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500" />
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
