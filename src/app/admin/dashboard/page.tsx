
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
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
import { ProtectedRoute } from "@/components/providers/protected-route";

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

function formatValue(value: unknown) {
  if (typeof value === "number") {
    return value.toLocaleString();
  }

  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return "—";
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-gray-900">
            {formatValue(value)}
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
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">
          {value.toLocaleString()}
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
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

  const loadAnalytics = useCallback(async () => {
    try {
      setError("");

      const tokenResponse = await authClient.token();
      const token = tokenResponse.data?.token;

      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const response = await fetch(`${API_URL}/api/admin/analytics`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load admin dashboard analytics."
        );
      }

      setAnalytics(result.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading analytics."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const navItems = [
    {
      label: "Overview",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      active: true,
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
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500 p-2">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wide">EQUIPORA</h2>
            <p className="text-xs text-slate-400">Admin Control Center</p>
          </div>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(false)}
          className="rounded-lg p-2 hover:bg-white/10 lg:hidden"
          aria-label="Close menu"
        >
          <X size={22} />
        </button>
      </div>

      <div className="px-4 py-6">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Main Menu
        </p>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  item.active
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={19} />
                {item.label}
                {item.active && <ChevronRight className="ml-auto" size={17} />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-white/10 p-5">
        <div className="rounded-xl bg-white/5 p-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <Activity size={17} />
            <span className="text-sm font-semibold">System Overview</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Manage your equipment rental marketplace from one place.
          </p>
        </div>
        <p className="mt-5 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} EQUIPORA
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto animate-spin text-emerald-600" size={36} />
          <p className="mt-4 font-medium text-gray-600">
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-5">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto text-red-500" size={42} />
          <h2 className="mt-4 text-xl font-bold text-gray-900">
            Unable to Load Dashboard
          </h2>
          <p className="mt-2 text-sm text-gray-600">{error || "No analytics data found."}</p>
          <button
            onClick={() => {
              setLoading(true);
              void loadAnalytics();
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const financeEntries = Object.entries(analytics.finances || {}).filter(
    ([, value]) =>
      typeof value === "number" ||
      (typeof value === "string" && value.trim() !== "")
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 lg:block">
        {sidebar}
      </aside>

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </aside>

      <main className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-200 bg-white/90 px-4 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg border border-gray-200 p-2 text-gray-700 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={22} />
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
            onClick={() => {
              setLoading(true);
              void loadAnalytics();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-emerald-500 hover:text-emerald-700 sm:px-4"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Refresh Data</span>
            <span className="sm:hidden">Refresh</span>
          </button>
        </header>

        <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-8">
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-6 text-white sm:p-9">
            <div className="relative z-10 max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                <ShieldCheck size={15} />
                ADMINISTRATOR ACCESS
              </div>

              <h2 className="text-2xl font-bold sm:text-3xl">
                Welcome to EQUIPORA Admin Panel
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                Your central command center to monitor users, equipment,
                bookings and marketplace performance.
              </p>
            </div>

            <div className="absolute -right-10 -top-20 h-72 w-72 rounded-full border-[35px] border-emerald-400/10" />
            <div className="absolute -bottom-36 right-32 h-72 w-72 rounded-full border-[35px] border-white/5" />
          </section>

          <section>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Marketplace Statistics
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Overall platform performance
                </p>
              </div>
            </div>

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

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">User Overview</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Registered account distribution
                  </p>
                </div>
                <Users className="text-blue-600" size={22} />
              </div>

              <div className="space-y-5">
                <ProgressRow label="Customers" value={analytics.users.customers} total={analytics.users.total} color="bg-blue-500" />
                <ProgressRow label="Owners" value={analytics.users.owners} total={analytics.users.total} color="bg-violet-500" />
                <ProgressRow label="Administrators" value={analytics.users.admins} total={analytics.users.total} color="bg-emerald-500" />
              </div>

              <div className="mt-6 rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-gray-500">Total Registered Users</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {analytics.users.total.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Equipment Status</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Listing approval overview
                  </p>
                </div>
                <Package className="text-violet-600" size={22} />
              </div>

              <div className="space-y-5">
                <ProgressRow label="Approved" value={analytics.equipment.approved} total={analytics.equipment.total} color="bg-emerald-500" />
                <ProgressRow label="Pending Review" value={analytics.equipment.pending} total={analytics.equipment.total} color="bg-amber-500" />
                <ProgressRow label="Rejected" value={analytics.equipment.rejected} total={analytics.equipment.total} color="bg-red-500" />
              </div>

              <div className="mt-6 flex items-center justify-between rounded-xl bg-amber-50 p-4">
                <div>
                  <p className="text-sm font-medium text-amber-800">Awaiting Approval</p>
                  <p className="mt-1 text-2xl font-bold text-amber-900">
                    {analytics.equipment.pending}
                  </p>
                </div>
                <AlertCircle className="text-amber-600" size={28} />
              </div>
            </div>
          </section>

          <section>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                Booking Performance
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Booking status across the marketplace
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard title="Total Bookings" value={analytics.bookings.total} description="All booking records" icon={ClipboardList} color="bg-blue-50 text-blue-600" />
              <StatCard title="Pending" value={analytics.bookings.pending} description="Awaiting next action" icon={AlertCircle} color="bg-amber-50 text-amber-600" />
              <StatCard title="Confirmed" value={analytics.bookings.confirmed} description="Confirmed bookings" icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" />
              <StatCard title="Completed" value={analytics.bookings.completed} description="Successfully completed" icon={ArrowUpRight} color="bg-violet-50 text-violet-600" />
              <StatCard title="Cancelled" value={analytics.bookings.cancelled} description="Cancelled bookings" icon={XCircle} color="bg-red-50 text-red-600" />
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <Wallet size={22} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Financial Summary</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Financial data returned by your backend
                </p>
              </div>
            </div>

            {financeEntries.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {financeEntries.map(([key, value]) => (
                  <div key={key} className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm capitalize text-gray-500">
                      {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}
                    </p>
                    <p className="mt-2 break-words text-xl font-bold text-gray-900">
                      {formatValue(value)}
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

          <section>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
              <p className="mt-1 text-sm text-gray-500">
                Navigate to administration sections
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { title: "Manage Users", description: "View users and manage roles", href: "/admin/users", icon: Users, color: "text-blue-600 bg-blue-50" },
                { title: "Review Equipment", description: "Approve or reject listings", href: "/admin/equipment", icon: Package, color: "text-violet-600 bg-violet-50" },
                { title: "Manage Bookings", description: "Monitor all rental bookings", href: "/admin/bookings", icon: CalendarDays, color: "text-orange-600 bg-orange-50" },
                { title: "Review Moderation", description: "Moderate customer reviews", href: "/admin/reviews", icon: ClipboardList, color: "text-emerald-600 bg-emerald-50" },
                { title: "Payment Records", description: "Review payment activity", href: "/admin/payments", icon: CreditCard, color: "text-pink-600 bg-pink-50" },
                { title: "Financial Overview", description: "Review financial information", href: "/admin/finances", icon: BarChart3, color: "text-indigo-600 bg-indigo-50" },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md"
                  >
                    <div className={`rounded-xl p-3 ${item.color}`}>
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
                      className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-emerald-600"
                    />
                  </Link>
                );
              })}
            </div>
          </section>

          <footer className="border-t border-gray-200 py-5 text-center text-xs text-gray-500">
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
