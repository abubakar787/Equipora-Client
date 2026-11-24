
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  CalendarDays,
  Clock,
  Wallet,
  Plus,
  ArrowUpRight,
  RefreshCw,
  Boxes,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

import ProtectedRoute from "@/components/providers/protected-route";
import { authClient } from "@/lib/auth-client";
import { apiRequest } from "@/lib/api";

type Equipment = {
  _id: string;
  title?: string;
  name?: string;
  images?: string[];
  image?: string;
  status?: string;
  price?: number;
  rentalType?: string;
  createdAt?: string;
};

type Booking = {
  _id: string;
  equipmentTitle?: string;
  startAt?: string;
  endAt?: string;
  totalAmount?: number;
  status?: string;
  paymentStatus?: string;
  createdAt?: string;
};

type DashboardState = {
  equipment: Equipment[];
  bookings: Booking[];
};

function getArray<T>(
  response: unknown,
  possibleKeys: string[]
): T[] {
  if (!response || typeof response !== "object") return [];

  const root = response as Record<string, unknown>;

  const data =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;

  if (Array.isArray(data)) return data as T[];

  for (const key of possibleKeys) {
    if (Array.isArray(data[key])) {
      return data[key] as T[];
    }
  }

  return [];
}

const currency = (amount: number) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const dateFormat = (date?: string) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function StatusBadge({ status }: { status?: string }) {
  const value = (status || "unknown").replaceAll("_", " ");
  const normalized = value.toLowerCase();

  let style = "bg-slate-100 text-slate-600";

  if (
    ["approved", "confirmed", "completed", "paid", "active"].includes(
      normalized
    )
  ) {
    style = "bg-emerald-50 text-emerald-700";
  } else if (
    ["pending", "pending payment", "pending_payment"].includes(normalized)
  ) {
    style = "bg-amber-50 text-amber-700";
  } else if (
    ["rejected", "cancelled", "expired"].includes(normalized)
  ) {
    style = "bg-red-50 text-red-600";
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${style}`}
    >
      {value}
    </span>
  );
}

function OwnerDashboardContent() {
  const [dashboard, setDashboard] = useState<DashboardState>({
    equipment: [],
    bookings: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Get authentication token
      const tokenResponse = await authClient.token();

      // Better Auth returns token inside the data property
      const token = tokenResponse.data?.token;

      if (!token) {
        throw new Error(
          "Authentication token not found. Please log in again."
        );
      }

      const equipmentResponse = await apiRequest<unknown>(
  "/api/equipment/my-equipment",
  {
    method: "GET",
    token,
  }
);

console.log("OWNER EQUIPMENT RESPONSE:", equipmentResponse);

const bookingResponse = await apiRequest<unknown>(
  "/api/bookings/owner-bookings",
  {
    method: "GET",
    token,
  }
);

console.log("OWNER BOOKINGS RESPONSE:", bookingResponse);

      const equipment = getArray<Equipment>(
        equipmentResponse,
        ["equipment", "items", "results"]
      );

      const bookings = getArray<Booking>(
        bookingResponse,
        ["bookings", "items", "results"]
      );

      setDashboard({
        equipment,
        bookings,
      });
    } catch (err) {
      console.error("Owner dashboard error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard information."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Dashboard statistics
  const totalEquipment = dashboard.equipment.length;

  const pendingEquipment = dashboard.equipment.filter(
    (item) => item.status?.toLowerCase() === "pending"
  ).length;

  const totalBookings = dashboard.bookings.length;

  const pendingBookings = dashboard.bookings.filter(
    (booking) =>
      booking.status?.toLowerCase() === "pending_payment" ||
      booking.status?.toLowerCase() === "pending"
  ).length;

  const completedPaidBookings = dashboard.bookings.filter(
    (booking) =>
      booking.paymentStatus?.toLowerCase() === "paid" &&
      ["confirmed", "active", "completed"].includes(
        booking.status?.toLowerCase() || ""
      )
  );

  const totalEarnings = completedPaidBookings.reduce(
    (total, booking) =>
      total + (Number(booking.totalAmount) || 0),
    0
  );

  const stats = [
    {
      title: "My Equipment",
      value: totalEquipment,
      description: `${pendingEquipment} awaiting approval`,
      icon: Package,
      iconStyle: "bg-blue-50 text-blue-600",
    },
    {
      title: "Total Bookings",
      value: totalBookings,
      description: "All rental requests",
      icon: CalendarDays,
      iconStyle: "bg-purple-50 text-purple-600",
    },
    {
      title: "Pending Requests",
      value: pendingBookings,
      description: "Requests to review",
      icon: Clock,
      iconStyle: "bg-amber-50 text-amber-600",
    },
    {
      title: "Paid Booking Amount",
      value: currency(totalEarnings),
      description: "Based on paid booking records",
      icon: Wallet,
      iconStyle: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-600">
              Owner Workspace
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-[#101D2C] sm:text-4xl">
              Owner Dashboard
            </h1>

            <p className="mt-2 text-slate-500">
              Manage your equipment, rental requests and business activity.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <Link
              href="/owner/equipment/new"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <Plus size={18} />
              Add Equipment
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm text-red-700">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>

            <button
              onClick={loadDashboard}
              className="text-sm font-bold text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Statistics */}
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.title}
                    </p>

                    <h2 className="mt-3 text-2xl font-bold text-[#101D2C]">
                      {loading ? (
                        <Loader2 className="animate-spin text-slate-400" />
                      ) : (
                        stat.value
                      )}
                    </h2>
                  </div>

                  <div className={`rounded-xl p-3 ${stat.iconStyle}`}>
                    <Icon size={23} />
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-400">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </section>

        {/* Quick Actions */}
        <section className="mt-9">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-[#101D2C]">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage your rental business from here.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Add Equipment",
                description: "List new equipment for rent",
                href: "/owner/equipment/new",
                icon: Plus,
              },
              {
                title: "My Equipment",
                description: "Manage your equipment listings",
                href: "/owner/equipment",
                icon: Boxes,
              },
              {
                title: "Booking Requests",
                description: "Review customer rental requests",
                href: "/owner/bookings",
                icon: ClipboardList,
              },
              {
                title: "Earnings",
                description: "View your payment history",
                href: "/owner/earnings",
                icon: Wallet,
              },
            ].map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  href={action.href}
                  key={action.title}
                  className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                      <Icon size={22} />
                    </div>

                    <div>
                      <h3 className="font-bold text-[#101D2C]">
                        {action.title}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {action.description}
                      </p>
                    </div>
                  </div>

                  <ArrowUpRight
                    size={18}
                    className="text-slate-400 transition group-hover:text-emerald-600"
                  />
                </Link>
              );
            })}
          </div>
        </section>

        {/* Recent Bookings */}
        <section className="mt-9 rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-[#101D2C]">
                Recent Booking Requests
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest rental activity for your equipment.
              </p>
            </div>

            <Link
              href="/owner/bookings"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View all <ArrowUpRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2
                className="animate-spin text-emerald-600"
                size={28}
              />
            </div>
          ) : dashboard.bookings.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <CalendarDays
                size={35}
                className="mx-auto mb-3 text-slate-300"
              />

              <h3 className="font-semibold text-slate-700">
                No booking requests yet
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Customer booking requests will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Equipment</th>
                    <th className="px-5 py-4 font-semibold">Booking Date</th>
                    <th className="px-5 py-4 font-semibold">Amount</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {dashboard.bookings.slice(0, 5).map((booking) => (
                    <tr key={booking._id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {booking.equipmentTitle || "Equipment"}
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {dateFormat(
                          booking.createdAt || booking.startAt
                        )}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {currency(Number(booking.totalAmount) || 0)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={booking.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* My Equipment */}
        <section className="mt-9 rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-[#101D2C]">
                My Equipment
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                A quick overview of your equipment listings.
              </p>
            </div>

            <Link
              href="/owner/equipment"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Manage equipment <ArrowUpRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2
                className="animate-spin text-emerald-600"
                size={28}
              />
            </div>
          ) : dashboard.equipment.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Package
                size={35}
                className="mx-auto mb-3 text-slate-300"
              />

              <h3 className="font-semibold text-slate-700">
                No equipment listed
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Add your first equipment to start your rental business.
              </p>

              <Link
                href="/owner/equipment/new"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <Plus size={17} />
                Add Equipment
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {dashboard.equipment.slice(0, 5).map((item) => (
                <div
                  key={item._id}
                  className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <Package size={22} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-[#101D2C]">
                        {item.title || item.name || "Untitled Equipment"}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {item.rentalType || "Rental"} ·{" "}
                        {currency(Number(item.price) || 0)}
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <StatusBadge status={item.status} />

                    <p className="mt-2 text-xs text-slate-400">
                      Added {dateFormat(item.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer note */}
        <div className="mt-8 flex items-center gap-2 text-xs text-slate-400">
          <CheckCircle2 size={15} className="text-emerald-500" />
          Dashboard information is loaded from your EQUIPORA account.
        </div>
      </div>
    </main>
  );
}

export default function OwnerDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["owner"]}>
      <OwnerDashboardContent />
    </ProtectedRoute>
  );
}
