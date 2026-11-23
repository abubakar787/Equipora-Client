
"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedRoute from "@/components/providers/protected-route";
import { authClient } from "@/lib/auth-client";
import {
  CalendarDays,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  ClipboardList,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  MapPin,
  Package,
  UserRound,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type BookingStatus =
  | "pending"
  | "approved"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed";

type PaymentStatus =
  | "paid"
  | "pending"
  | "failed"
  | "refunded"
  | "unpaid";

interface Booking {
  _id: string;
  customer?: {
    _id?: string;
    name?: string;
    email?: string;
    image?: string;
  };
  owner?: {
    _id?: string;
    name?: string;
    email?: string;
  };
  equipment?: {
    _id?: string;
    name?: string;
    title?: string;
    image?: string;
    location?: string;
  };
  equipmentName?: string;
  equipmentImage?: string;
  startDate?: string;
  endDate?: string;
  quantity?: number;
  totalAmount?: number;
  totalPrice?: number;
  amount?: number;
  bookingStatus?: BookingStatus;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  transactionId?: string;
  createdAt?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STATUS_OPTIONS = [
  "all",
  "pending",
  "approved",
  "confirmed",
  "rejected",
  "cancelled",
  "completed",
];

const PAYMENT_OPTIONS = [
  "all",
  "paid",
  "pending",
  "unpaid",
  "failed",
  "refunded",
];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const getToken = async () => {
    const tokenResponse = await authClient.token();
    const token = tokenResponse.data?.token;

    if (!token) {
      throw new Error("Authentication token not found. Please login again.");
    }

    return token;
  };

  const fetchBookings = useCallback(
    async (page = 1) => {
      if (!API_URL) {
        setError("API URL is missing. Check NEXT_PUBLIC_API_URL.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const token = await getToken();

        const params = new URLSearchParams({
          page: String(page),
          limit: String(pagination.limit),
        });

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (statusFilter !== "all") {
          params.set("status", statusFilter);
        }

        if (paymentFilter !== "all") {
          params.set("paymentStatus", paymentFilter);
        }

        // Expected admin bookings endpoint.
        const response = await fetch(
          `${API_URL}/api/bookings/admin-bookings?${params.toString()}`,
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

        if (!response.ok || result.success === false) {
          throw new Error(
            result.message || "Unable to load bookings."
          );
        }

        // Supports common API response shapes.
        const bookingList =
          result.data?.data ??
          result.data?.bookings ??
          result.bookings ??
          result.data ??
          [];

        if (!Array.isArray(bookingList)) {
          throw new Error("Invalid bookings response from server.");
        }

        setBookings(bookingList);

        const paginationData =
          result.data?.pagination ??
          result.pagination;

        setPagination({
          total: Number(
            paginationData?.total ?? bookingList.length
          ),
          page: Number(paginationData?.page ?? page),
          limit: Number(
            paginationData?.limit ?? pagination.limit
          ),
          totalPages: Number(
            paginationData?.totalPages ?? 1
          ),
        });
      } catch (err) {
        console.error("Admin bookings error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      search,
      statusFilter,
      paymentFilter,
      pagination.limit,
    ]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchBookings(1);
    }, 400);

    return () => clearTimeout(timeout);
  }, [fetchBookings]);

  const getBookingStatus = (booking: Booking) =>
    booking.bookingStatus || booking.status || "pending";

  const getAmount = (booking: Booking) =>
    booking.totalAmount ??
    booking.totalPrice ??
    booking.amount ??
    0;

  const getEquipmentName = (booking: Booking) =>
    booking.equipment?.name ||
    booking.equipment?.title ||
    booking.equipmentName ||
    "Equipment";

  const getEquipmentImage = (booking: Booking) =>
    booking.equipment?.image || booking.equipmentImage || "";

  const formatDate = (date?: string) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "N/A";

    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      maximumFractionDigits: 0,
    }).format(amount);

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
      case "confirmed":
      case "completed":
        return "bg-emerald-100 text-emerald-700";

      case "pending":
        return "bg-amber-100 text-amber-700";

      case "rejected":
      case "cancelled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const getPaymentStyle = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-emerald-100 text-emerald-700";

      case "refunded":
        return "bg-purple-100 text-purple-700";

      case "failed":
        return "bg-red-100 text-red-700";

      case "pending":
      case "unpaid":
      default:
        return "bg-amber-100 text-amber-700";
    }
  };

  const countByStatus = (status: string) =>
    bookings.filter(
      (booking) =>
        getBookingStatus(booking).toLowerCase() === status
    ).length;

  const paidBookings = bookings.filter(
    (booking) =>
      booking.paymentStatus?.toLowerCase() === "paid"
  );

  const paidRevenue = paidBookings.reduce(
    (total, booking) => total + Number(getAmount(booking)),
    0
  );

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Header */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-600">
                <ClipboardList size={17} />
                Administration
              </div>

              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Booking Management
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Monitor equipment rentals, customers, owners and payments.
              </p>
            </div>

            <button
              onClick={() => fetchBookings(pagination.page)}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Bookings"
              value={pagination.total}
              icon={<ClipboardList size={21} />}
              color="bg-blue-50 text-blue-600"
            />

            <StatCard
              title="Pending Bookings"
              value={countByStatus("pending")}
              icon={<Clock size={21} />}
              color="bg-amber-50 text-amber-600"
            />

            <StatCard
              title="Completed Bookings"
              value={countByStatus("completed")}
              icon={<CheckCircle2 size={21} />}
              color="bg-emerald-50 text-emerald-600"
            />

            <StatCard
              title="Paid Revenue"
              value={formatCurrency(paidRevenue)}
              icon={<CreditCard size={21} />}
              color="bg-purple-50 text-purple-600"
            />
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatusSummary
              label="Approved"
              value={countByStatus("approved") + countByStatus("confirmed")}
              icon={<CheckCircle2 size={17} />}
            />

            <StatusSummary
              label="Rejected"
              value={countByStatus("rejected")}
              icon={<XCircle size={17} />}
            />

            <StatusSummary
              label="Cancelled"
              value={countByStatus("cancelled")}
              icon={<XCircle size={17} />}
            />

            <StatusSummary
              label="Completed"
              value={countByStatus("completed")}
              icon={<CalendarDays size={17} />}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={19} className="mt-0.5 shrink-0" />

              <div>
                <p className="font-semibold">
                  Unable to load bookings
                </p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search booking, customer or equipment..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status === "all"
                      ? "All Booking Status"
                      : status.charAt(0).toUpperCase() +
                        status.slice(1)}
                  </option>
                ))}
              </select>

              <select
                value={paymentFilter}
                onChange={(event) =>
                  setPaymentFilter(event.target.value)
                }
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              >
                {PAYMENT_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status === "all"
                      ? "All Payment Status"
                      : status.charAt(0).toUpperCase() +
                        status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Showing {bookings.length} of {pagination.total} bookings
            </p>
          </div>

          {/* Bookings Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-slate-900">
                All Rental Bookings
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                View customer, equipment, rental and payment information.
              </p>
            </div>

            {loading ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3">
                <Loader2
                  size={32}
                  className="animate-spin text-emerald-600"
                />
                <p className="text-sm text-slate-500">
                  Loading bookings...
                </p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
                <div className="mb-3 rounded-full bg-slate-100 p-4 text-slate-400">
                  <CalendarDays size={28} />
                </div>

                <h3 className="font-semibold text-slate-800">
                  No bookings found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Try changing your search or filters.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1150px] text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-5 py-4 font-semibold">
                          Equipment
                        </th>

                        <th className="px-5 py-4 font-semibold">
                          Customer
                        </th>

                        <th className="px-5 py-4 font-semibold">
                          Owner
                        </th>

                        <th className="px-5 py-4 font-semibold">
                          Rental Period
                        </th>

                        <th className="px-5 py-4 font-semibold">
                          Quantity
                        </th>

                        <th className="px-5 py-4 font-semibold">
                          Amount
                        </th>

                        <th className="px-5 py-4 font-semibold">
                          Payment
                        </th>

                        <th className="px-5 py-4 font-semibold">
                          Booking Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {bookings.map((booking) => {
                        const status = getBookingStatus(booking);
                        const paymentStatus =
                          booking.paymentStatus || "pending";

                        return (
                          <tr
                            key={booking._id}
                            className="transition hover:bg-slate-50/80"
                          >
                            {/* Equipment */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                {getEquipmentImage(booking) ? (
                                  <img
                                    src={getEquipmentImage(booking)}
                                    alt={getEquipmentName(booking)}
                                    className="h-12 w-12 rounded-xl border border-slate-200 object-cover"
                                  />
                                ) : (
                                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                                    <Package size={22} />
                                  </div>
                                )}

                                <div className="max-w-[180px]">
                                  <p className="font-semibold text-slate-800">
                                    {getEquipmentName(booking)}
                                  </p>

                                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                                    <MapPin size={12} />
                                    {booking.equipment?.location || "N/A"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Customer */}
                            <td className="px-5 py-4">
                              <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                <UserRound
                                  size={15}
                                  className="text-slate-400"
                                />
                                {booking.customer?.name || "N/A"}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {booking.customer?.email || ""}
                              </p>
                            </td>

                            {/* Owner */}
                            <td className="px-5 py-4">
                              <p className="text-sm font-medium text-slate-700">
                                {booking.owner?.name || "N/A"}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {booking.owner?.email || ""}
                              </p>
                            </td>

                            {/* Dates */}
                            <td className="px-5 py-4">
                              <p className="text-sm text-slate-700">
                                {formatDate(booking.startDate)}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                to {formatDate(booking.endDate)}
                              </p>
                            </td>

                            {/* Quantity */}
                            <td className="px-5 py-4">
                              <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
                                {booking.quantity ?? 1}
                              </span>
                            </td>

                            {/* Amount */}
                            <td className="px-5 py-4">
                              <p className="font-semibold text-slate-800">
                                {formatCurrency(Number(getAmount(booking)))}
                              </p>
                            </td>

                            {/* Payment */}
                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getPaymentStyle(
                                  paymentStatus
                                )}`}
                              >
                                {paymentStatus}
                              </span>
                            </td>

                            {/* Booking Status */}
                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                                  status
                                )}`}
                              >
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row">
                  <p className="text-xs text-slate-500">
                    Page {pagination.page} of{" "}
                    {pagination.totalPages || 1}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        fetchBookings(pagination.page - 1)
                      }
                      disabled={
                        loading || pagination.page <= 1
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={15} />
                      Previous
                    </button>

                    <button
                      onClick={() =>
                        fetchBookings(pagination.page + 1)
                      }
                      disabled={
                        loading ||
                        pagination.page >= pagination.totalPages
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        <div className={`rounded-xl p-3 ${color}`}>
          {icon}
        </div>
      </div>

      <p className="mt-4 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatusSummary({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
        {icon}
      </div>

      <div>
        <p className="text-lg font-bold text-slate-900">
          {value}
        </p>

        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
