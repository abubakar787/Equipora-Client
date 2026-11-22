
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Menu,
  Package,
  RefreshCw,
  ShieldCheck,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import ProtectedRoute from "@/components/providers/protected-route";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Analytics {
  users: {
    total: number;
    customers: number;
    owners: number;
    admins: number;
  };
  equipment: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  payments: {
    total: number;
  };
  finances?: Record<string, unknown>;
}

type FinanceEntry = [string, string | number];

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-gray-900">
            {(Number(value) || 0).toLocaleString()}
          </h3>
        </div>

        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={24} />
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-500">{description}</p>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage =
    total > 0 ? Math.min((value / total) * 100, 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">{value}</span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function AdminDashboardContent() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const loadAnalytics = useCallback(async () => {
    try {
      const tokenResponse = await authClient.token();
      const token = tokenResponse.data?.token;

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      if (!API_URL) {
        throw new Error("API URL is not configured.");
      }

      const response = await fetch(
        `${API_URL}/api/admin/analytics`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load dashboard analytics."
        );
      }

      setAnalytics(result.data as Analytics);
      setError("");
    } catch (err) {
      console.error("Admin analytics error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const handleRefresh = () => {
    setLoading(true);
    void loadAnalytics();
  };

  const navItems = [
    {
      label: "Overview",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Users",
      href: "/admin/users",
      icon: Users,
    },
    {
      label: "Equipment",
      href: "/admin/equipment",
      icon: Package,
    },
    {
      label: "Bookings",
      href: "/admin/bookings",
      icon: CalendarDays,
    },
    {
      label: "Reviews",
      href: "/admin/reviews",
      icon: ClipboardList,
    },
    {
      label: "Payments",
      href: "/admin/payments",
      icon: CreditCard,
    },
  ];

  const sidebar = (
    <div className="flex h-full flex-col bg-slate-950 text-white">
      <div
        className={`flex h-20 items-center border-b border-white/10 ${
          sidebarCollapsed
            ? "justify-center px-2"
            : "justify-between px-5"
        }`}
      >
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-3"
          title="EQUIPORA Admin"
        >
          <div className="shrink-0 rounded-xl bg-emerald-500 p-2">
            <ShieldCheck size={23} />
          </div>

          {!sidebarCollapsed && (
            <div>
              <h2 className="text-lg font-bold">EQUIPORA</h2>
              <p className="text-xs text-slate-400">
                Admin Control Center
              </p>
            </div>
          )}
        </Link>

        {!sidebarCollapsed && (
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-2 px-3 py-6">
        {!sidebarCollapsed && (
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Main Menu
          </p>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/admin/dashboard";

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              title={sidebarCollapsed ? item.label : undefined}
              className={`flex items-center rounded-xl py-3 text-sm font-medium transition ${
                sidebarCollapsed
                  ? "justify-center px-2"
                  : "gap-3 px-4"
              } ${
                isActive
                  ? "bg-emerald-500 text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={19} className="shrink-0" />

              {!sidebarCollapsed && (
                <>
                  <span>{item.label}</span>

                  {isActive && (
                    <ChevronRight
                      className="ml-auto"
                      size={17}
                    />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div
          className={`rounded-xl bg-white/5 ${
            sidebarCollapsed ? "p-3" : "p-4"
          }`}
        >
          <div
            className={`flex items-center gap-2 text-emerald-400 ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
            title="System Overview"
          >
            <Activity size={17} />
            {!sidebarCollapsed && (
              <span className="text-sm font-semibold">
                System Overview
              </span>
            )}
          </div>

          {!sidebarCollapsed && (
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Manage your equipment rental marketplace.
            </p>
          )}
        </div>

        {!sidebarCollapsed && (
          <p className="mt-5 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} EQUIPORA
          </p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw
            className="mx-auto animate-spin text-emerald-600"
            size={36}
          />
          <p className="mt-4 text-gray-600">
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-5">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle
            className="mx-auto text-red-500"
            size={40}
          />

          <h2 className="mt-4 text-xl font-bold">
            Unable to Load Dashboard
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            {error || "Dashboard data is unavailable."}
          </p>

          <button
            onClick={handleRefresh}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
          >
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const financeEntries: FinanceEntry[] = Object.entries(
    analytics.finances || {}
  ).filter(
    (entry): entry is FinanceEntry =>
      typeof entry[1] === "number" ||
      typeof entry[1] === "string"
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden transition-all duration-300 lg:block ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {sidebar}
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 lg:hidden ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {sidebar}
      </aside>

      <main
        className={`min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg border border-slate-200 p-2 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            {/* Desktop Collapse Button */}
            <button
              onClick={() =>
                setSidebarCollapsed((previous) => !previous)
              }
              className="hidden rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 lg:inline-flex"
              aria-label={
                sidebarCollapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
              title={
                sidebarCollapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
            >
              {sidebarCollapsed ? (
                <ChevronsRight size={21} />
              ) : (
                <ChevronsLeft size={21} />
              )}
            </button>

            <div>
              <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
                Dashboard Overview
              </h1>

              <p className="hidden text-xs text-gray-500 sm:block">
                Monitor and manage your marketplace
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-emerald-500 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </header>

        <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-8">
          {/* Welcome Banner */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-7 text-white sm:p-9">
            <div className="relative z-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                <ShieldCheck size={15} />
                ADMINISTRATOR ACCESS
              </div>

              <h2 className="text-2xl font-bold sm:text-3xl">
                Welcome to EQUIPORA Admin Panel
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                Your central command center to monitor users,
                equipment, bookings and marketplace performance.
              </p>
            </div>

            <div className="absolute -right-10 -top-20 h-72 w-72 rounded-full border-[35px] border-emerald-400/10" />
          </section>

          {/* Marketplace Statistics */}
          <section>
            <h2 className="mb-5 text-lg font-bold text-gray-900">
              Marketplace Statistics
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Users"
                value={analytics.users.total}
                description={`${analytics.users.customers} customers · ${analytics.users.owners} owners`}
                icon={Users}
                color="bg-blue-50 text-blue-600"
              />

              <StatCard
                title="Total Equipment"
                value={analytics.equipment.total}
                description={`${analytics.equipment.approved} approved listings`}
                icon={Package}
                color="bg-violet-50 text-violet-600"
              />

              <StatCard
                title="Total Bookings"
                value={analytics.bookings.total}
                description={`${analytics.bookings.confirmed} confirmed bookings`}
                icon={CalendarDays}
                color="bg-orange-50 text-orange-600"
              />

              <StatCard
                title="Total Payments"
                value={analytics.payments.total}
                description="Paid and refunded payment records"
                icon={CreditCard}
                color="bg-emerald-50 text-emerald-600"
              />
            </div>
          </section>

          {/* User and Equipment Overview */}
          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">
                    User Overview
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Registered account distribution
                  </p>
                </div>

                <Users className="text-blue-600" size={22} />
              </div>

              <div className="space-y-5">
                <ProgressRow
                  label="Customers"
                  value={analytics.users.customers}
                  total={analytics.users.total}
                  color="bg-blue-500"
                />

                <ProgressRow
                  label="Owners"
                  value={analytics.users.owners}
                  total={analytics.users.total}
                  color="bg-violet-500"
                />

                <ProgressRow
                  label="Administrators"
                  value={analytics.users.admins}
                  total={analytics.users.total}
                  color="bg-emerald-500"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">
                    Equipment Status
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Listing approval overview
                  </p>
                </div>

                <Package className="text-violet-600" size={22} />
              </div>

              <div className="space-y-5">
                <ProgressRow
                  label="Approved"
                  value={analytics.equipment.approved}
                  total={analytics.equipment.total}
                  color="bg-emerald-500"
                />

                <ProgressRow
                  label="Pending Review"
                  value={analytics.equipment.pending}
                  total={analytics.equipment.total}
                  color="bg-amber-500"
                />

                <ProgressRow
                  label="Rejected"
                  value={analytics.equipment.rejected}
                  total={analytics.equipment.total}
                  color="bg-red-500"
                />
              </div>

              <div className="mt-6 flex items-center justify-between rounded-xl bg-amber-50 p-4">
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Awaiting Approval
                  </p>

                  <p className="mt-1 text-2xl font-bold text-amber-900">
                    {analytics.equipment.pending}
                  </p>
                </div>

                <AlertCircle
                  className="text-amber-600"
                  size={28}
                />
              </div>
            </div>
          </section>

          {/* Booking Performance */}
          <section>
            <h2 className="mb-5 text-lg font-bold text-gray-900">
              Booking Performance
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard
                title="Total Bookings"
                value={analytics.bookings.total}
                description="All booking records"
                icon={ClipboardList}
                color="bg-blue-50 text-blue-600"
              />

              <StatCard
                title="Pending"
                value={analytics.bookings.pending}
                description="Awaiting next action"
                icon={AlertCircle}
                color="bg-amber-50 text-amber-600"
              />

              <StatCard
                title="Confirmed"
                value={analytics.bookings.confirmed}
                description="Confirmed bookings"
                icon={CheckCircle2}
                color="bg-emerald-50 text-emerald-600"
              />

              <StatCard
                title="Completed"
                value={analytics.bookings.completed}
                description="Successfully completed"
                icon={BarChart3}
                color="bg-violet-50 text-violet-600"
              />

              <StatCard
                title="Cancelled"
                value={analytics.bookings.cancelled}
                description="Cancelled bookings"
                icon={XCircle}
                color="bg-red-50 text-red-600"
              />
            </div>
          </section>

          {/* Financial Summary */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <Wallet size={22} />
              </div>

              <div>
                <h2 className="font-bold text-gray-900">
                  Financial Summary
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Values returned by your backend
                </p>
              </div>
            </div>

            {financeEntries.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {financeEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-xl bg-slate-50 p-4"
                  >
                    <p className="text-sm capitalize text-gray-500">
                      {key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/_/g, " ")}
                    </p>

                    <p className="mt-2 break-words text-xl font-bold text-gray-900">
                      {typeof value === "number"
                        ? value.toLocaleString()
                        : value}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-slate-50 p-5 text-sm text-gray-500">
                No financial summary values are currently available.
              </p>
            )}
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="mb-5 text-lg font-bold text-gray-900">
              Quick Actions
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                {
                  title: "Manage Users",
                  description: "View users and manage roles",
                  href: "/admin/users",
                  icon: Users,
                },
                {
                  title: "Review Equipment",
                  description: "Approve or reject listings",
                  href: "/admin/equipment",
                  icon: Package,
                },
                {
                  title: "Manage Bookings",
                  description: "Monitor all rental bookings",
                  href: "/admin/bookings",
                  icon: CalendarDays,
                },
                {
                  title: "Review Moderation",
                  description: "Moderate customer reviews",
                  href: "/admin/reviews",
                  icon: ClipboardList,
                },
                {
                  title: "Payment Records",
                  description: "Review payment activity",
                  href: "/admin/payments",
                  icon: CreditCard,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md"
                  >
                    <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                      <Icon size={23} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        {item.description}
                      </p>
                    </div>

                    <ChevronRight
                      size={19}
                      className="text-gray-400 group-hover:text-emerald-600"
                    />
                  </Link>
                );
              })}
            </div>
          </section>

          <footer className="border-t py-5 text-center text-xs text-gray-500">
            EQUIPORA Admin Dashboard · Secure Marketplace Management
          </footer>
        </div>
      </main>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
