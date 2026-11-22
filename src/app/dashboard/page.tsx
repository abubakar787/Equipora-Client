
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Heart,
  CreditCard,
  UserRound,
  LogOut,
  Bell,
  Menu,
  ArrowUpRight,
  Clock3,
  CheckCircle2,
  Package,
  AlertCircle,
  RefreshCw,
  MapPin,
  ChevronRight,
  LoaderCircle,
} from "lucide-react";
import { toast } from "sonner";

import ProtectedRoute from "@/components/providers/protected-route";
import { useAuth } from "@/components/providers/auth-provider";
import { authClient } from "@/lib/auth-client";
import { apiRequest } from "@/lib/api";

// ============================================
// TYPES
// ============================================

type BookingStatus =
  | "pending_payment"
  | "approved_for_payment"
  | "confirmed"
  | "active"
  | "completed"
  | "rejected"
  | "cancelled"
  | "expired";

interface Booking {
  _id: string;
  equipmentTitle: string;
  equipmentImage?: string;
  startAt: string;
  endAt: string;
  rentalType: string;
  rentalUnits: number;
  quantity: number;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: string;
  createdAt: string;
}

interface BookingResult {
  bookings: Booking[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface DashboardStats {
  total: number;
  active: number;
  completed: number;
  pending: number;
}

// ============================================
// CONSTANTS
// ============================================

const navigation = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    active: true,
  },
  {
    label: "My Bookings",
    href: "/dashboard/bookings",
    icon: CalendarDays,
  },
  {
    label: "My Favorites",
    href: "/dashboard/favorites",
    icon: Heart,
  },
  {
    label: "Payments",
    href: "/dashboard/payments",
    icon: CreditCard,
  },
  {
    label: "My Profile",
    href: "/dashboard/profile",
    icon: UserRound,
  },
];

const money = (amount: number) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));

const statusStyles: Record<BookingStatus, string> = {
  pending_payment: "bg-amber-50 text-amber-700",
  approved_for_payment: "bg-blue-50 text-blue-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  active: "bg-violet-50 text-violet-700",
  completed: "bg-slate-100 text-slate-700",
  rejected: "bg-red-50 text-red-700",
  cancelled: "bg-red-50 text-red-700",
  expired: "bg-slate-100 text-slate-500",
};

const statusLabels: Record<BookingStatus, string> = {
  pending_payment: "Pending Payment",
  approved_for_payment: "Awaiting Payment",
  confirmed: "Confirmed",
  active: "Active",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
  expired: "Expired",
};

// ============================================
// DASHBOARD CONTENT
// ============================================

function CustomerDashboardContent() {
  const router = useRouter();
  const session = useAuth();

  const user = session.data?.user as
    | {
        name?: string;
        email?: string;
        image?: string | null;
      }
    | undefined;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    active: 0,
    completed: 0,
    pending: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // ============================================
  // FETCH REAL BOOKING DATA
  // ============================================

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const fetchBookings = async (status?: BookingStatus) => {
        const query = new URLSearchParams({
          page: "1",
          limit: "24",
        });

        if (status) query.set("status", status);

        return apiRequest<ApiResponse<BookingResult>>(
          `/api/bookings/my-bookings?${query.toString()}`,
          { auth: true }
        );
      };

      const [
        recentResponse,
        confirmedResponse,
        activeResponse,
        completedResponse,
        pendingResponse,
        approvedResponse,
      ] = await Promise.all([
        fetchBookings(),
        fetchBookings("confirmed"),
        fetchBookings("active"),
        fetchBookings("completed"),
        fetchBookings("pending_payment"),
        fetchBookings("approved_for_payment"),
      ]);

      setBookings(recentResponse.data.bookings || []);

      setStats({
        total: recentResponse.data.pagination.total,
        active:
          confirmedResponse.data.pagination.total +
          activeResponse.data.pagination.total,
        completed: completedResponse.data.pagination.total,
        pending:
          pendingResponse.data.pagination.total +
          approvedResponse.data.pagination.total,
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load dashboard information.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ============================================
  // LOGOUT
  // ============================================

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await authClient.signOut();
      router.replace("/login");
    } catch {
      toast.error("Unable to sign out. Please try again.");
      setLoggingOut(false);
    }
  };

  const firstName = user?.name?.trim().split(" ")[0] || "Customer";

  // ============================================
  // STATISTICS
  // ============================================

  const statCards = [
    {
      title: "Total Bookings",
      value: stats.total,
      description: "All your reservations",
      icon: CalendarDays,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Active Rentals",
      value: stats.active,
      description: "Confirmed and active",
      icon: Package,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      title: "Completed",
      value: stats.completed,
      description: "Successfully completed",
      icon: CheckCircle2,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      title: "Pending Payment",
      value: stats.pending,
      description: "Awaiting payment",
      icon: Clock3,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
  ];

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#172033]">
      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-[82px] items-center gap-3 border-b border-slate-100 px-7">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-xl font-black text-white">
              E
            </div>
            <div>
              <p className="text-xl font-extrabold tracking-tight text-[#132238]">
                EQUIPORA
              </p>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-400">
                CUSTOMER PORTAL
              </p>
            </div>
          </div>

          <div className="px-5 pt-8">
            <p className="mb-4 px-3 text-[10px] font-bold tracking-[0.18em] text-slate-400">
              WORKSPACE
            </p>

            <nav className="space-y-1.5">
              {navigation.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${
                      item.active
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-[19px] w-[19px]" />
                    {item.label}
                    {item.active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto border-t border-slate-100 p-5">
            <div className="mb-4 rounded-2xl bg-[#F6F8FB] p-4">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                <Package className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                Need equipment?
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Explore equipment for your next project.
              </p>
              <Link
                href="/equipment"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                Browse equipment <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            >
              <LogOut className="h-[19px] w-[19px]" />
              {loggingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="min-w-0 flex-1">
          {/* TOP BAR */}
          <header className="sticky top-0 z-30 flex h-[82px] items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur md:px-8 lg:px-10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div>
                <p className="text-sm font-semibold text-slate-400">
                  Customer Workspace
                </p>
                <h1 className="text-lg font-bold text-[#172033]">
                  Dashboard Overview
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-800">
                  {user?.name || "Customer"}
                </p>
                <p className="max-w-[180px] truncate text-xs text-slate-400">
                  {user?.email}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-emerald-50 text-sm font-bold text-emerald-700">
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user.name || "Customer"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  firstName.charAt(0).toUpperCase()
                )}
              </div>
            </div>
          </header>

          {/* PAGE BODY */}
          <div className="mx-auto max-w-[1500px] px-5 py-8 md:px-8 lg:px-10">
            {/* WELCOME */}
            <section className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-medium text-emerald-700">
                  YOUR RENTAL MANAGEMENT CENTER
                </p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#142238] sm:text-3xl">
                  Welcome back, {firstName}!
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Track your equipment reservations and manage your rentals.
                </p>
              </div>

              <Link
                href="/equipment"
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Explore Equipment
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </section>

            {/* ERROR STATE */}
            {error && (
              <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  <div>
                    <p className="text-sm font-bold text-red-800">
                      Unable to load dashboard
                    </p>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={loadDashboard}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
              </div>
            )}

            {/* STAT CARDS */}
            <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.title}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.025)] transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconBg} ${stat.iconColor}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-slate-300" />
                    </div>

                    <p className="mt-5 text-sm font-medium text-slate-500">
                      {stat.title}
                    </p>

                    <div className="mt-1 flex items-end justify-between gap-2">
                      <p className="text-3xl font-extrabold tracking-tight text-[#172033]">
                        {loading ? (
                          <span className="inline-block h-8 w-12 animate-pulse rounded-md bg-slate-100" />
                        ) : (
                          stat.value.toLocaleString("en-BD")
                        )}
                      </p>
                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                      {stat.description}
                    </p>
                  </div>
                );
              })}
            </section>

            {/* BOOKINGS SECTION */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.025)]">
              <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center md:px-7">
                <div>
                  <h3 className="text-lg font-bold text-[#172033]">
                    Recent Bookings
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Your latest equipment rental reservations
                  </p>
                </div>

                <Link
                  href="/dashboard/bookings"
                  className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700 hover:text-emerald-800"
                >
                  View all bookings
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-4 p-6">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="flex animate-pulse items-center gap-4"
                    >
                      <div className="h-14 w-16 rounded-xl bg-slate-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/3 rounded bg-slate-100" />
                        <div className="h-3 w-1/2 rounded bg-slate-100" />
                      </div>
                      <div className="h-6 w-20 rounded-full bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : bookings.length === 0 && !error ? (
                <div className="flex flex-col items-center px-6 py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <CalendarDays className="h-8 w-8" />
                  </div>
                  <h4 className="mt-5 text-lg font-bold text-slate-800">
                    No bookings yet
                  </h4>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    You have not reserved any equipment yet. Explore our
                    equipment marketplace to find what your next project needs.
                  </p>
                  <Link
                    href="/equipment"
                    className="mt-6 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                  >
                    Browse Equipment
                  </Link>
                </div>
              ) : (
                <>
                  {/* DESKTOP TABLE */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/80">
                        <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="px-7 py-4">Equipment</th>
                          <th className="px-5 py-4">Rental Period</th>
                          <th className="px-5 py-4">Amount</th>
                          <th className="px-5 py-4">Status</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {bookings.slice(0, 8).map((booking) => (
                          <tr
                            key={booking._id}
                            className="transition hover:bg-slate-50/70"
                          >
                            <td className="px-7 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                                  {booking.equipmentImage ? (
                                    <img
                                      src={booking.equipmentImage}
                                      alt={booking.equipmentTitle}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <Package className="h-5 w-5 text-slate-400" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="max-w-[220px] truncate text-sm font-bold text-slate-800">
                                    {booking.equipmentTitle}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-400">
                                    Qty: {booking.quantity} ·{" "}
                                    {booking.rentalType}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <p className="text-sm font-medium text-slate-700">
                                {formatDate(booking.startAt)}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                to {formatDate(booking.endAt)}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <p className="text-sm font-bold text-slate-800">
                                {money(booking.totalAmount)}
                              </p>
                              <p className="mt-1 text-xs capitalize text-slate-400">
                                {booking.paymentStatus}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold ${
                                  statusStyles[booking.status] ||
                                  "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {statusLabels[booking.status] ||
                                  booking.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE BOOKING CARDS */}
                  <div className="divide-y divide-slate-100 md:hidden">
                    {bookings.slice(0, 8).map((booking) => (
                      <div key={booking._id} className="p-5">
                        <div className="flex gap-3">
                          <div className="flex h-14 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                            {booking.equipmentImage ? (
                              <img
                                src={booking.equipmentImage}
                                alt={booking.equipmentTitle}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-6 w-6 text-slate-400" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-800">
                              {booking.equipmentTitle}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Quantity: {booking.quantity}
                            </p>
                            <span
                              className={`mt-2 inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${
                                statusStyles[booking.status] ||
                                "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {statusLabels[booking.status] ||
                                booking.status}
                            </span>
                          </div>

                          <p className="shrink-0 text-sm font-bold text-slate-800">
                            {money(booking.totalAmount)}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(booking.startAt)}
                          <span>—</span>
                          {formatDate(booking.endAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            {/* BOTTOM INFORMATION */}
            <section className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Plan your next project
                  </h4>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Find the equipment you need and manage your reservations
                    from one place.
                  </p>
                  <Link
                    href="/equipment"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-700"
                  >
                    Explore marketplace <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Stay on top of your rentals
                  </h4>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Check your booking status and payment progress regularly.
                  </p>
                  <Link
                    href="/dashboard/bookings"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-700"
                  >
                    Manage bookings <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </section>

            <footer className="mt-10 border-t border-slate-200 py-6 text-center text-xs text-slate-400">
            Copyright {new Date().getFullYear()} EQUIPORA. Rent Smarter. Build Better.
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

// ============================================
// PROTECTED CUSTOMER DASHBOARD
// ============================================

export default function CustomerDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <CustomerDashboardContent />
    </ProtectedRoute>
  );
}
