
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Package,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import ProtectedRoute from "@/components/providers/protected-route";
import { apiRequest } from "@/lib/api";

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

const filters = [
  { label: "All Bookings", value: "" },
  { label: "Pending Payment", value: "pending_payment" },
  { label: "Awaiting Payment", value: "approved_for_payment" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const statusStyles: Record<string, string> = {
  pending_payment: "bg-amber-50 text-amber-700",
  approved_for_payment: "bg-blue-50 text-blue-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  active: "bg-violet-50 text-violet-700",
  completed: "bg-slate-100 text-slate-700",
  rejected: "bg-red-50 text-red-700",
  cancelled: "bg-red-50 text-red-700",
  expired: "bg-slate-100 text-slate-500",
};

const statusLabels: Record<string, string> = {
  pending_payment: "Pending Payment",
  approved_for_payment: "Awaiting Payment",
  confirmed: "Confirmed",
  active: "Active",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
  expired: "Expired",
};

function formatDate(value: string) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function MyBookingsContent() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });

      if (selectedStatus) {
        params.set("status", selectedStatus);
      }

      const response = await apiRequest<ApiResponse<BookingResult>>(
        `/api/bookings/my-bookings?${params.toString()}`
      );

      setBookings(response.data.bookings || []);
      setTotalPages(response.data.pagination.totalPages || 1);
      setTotalBookings(response.data.pagination.total || 0);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load your bookings.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, selectedStatus]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleFilterChange = (value: string) => {
    setSelectedStatus(value);
    setPage(1);
  };

  const handleCancel = async (booking: Booking) => {
    const paymentStatus = booking.paymentStatus?.toLowerCase();

    if (paymentStatus === "paid") {
      toast.error("Paid bookings cannot be cancelled through this action.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel the booking for "${booking.equipmentTitle}"?`
    );

    if (!confirmed) return;

    try {
      setCancellingId(booking._id);

      await apiRequest(`/api/bookings/${booking._id}/cancel`, {
        method: "PATCH",
      });

      toast.success("Booking cancelled successfully.");
      await loadBookings();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Unable to cancel this booking."
      );
    } finally {
      setCancellingId(null);
    }
  };

  const visibleBookings = bookings.filter((booking) =>
    booking.equipmentTitle
      ?.toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#F6F8FB]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <div>
            <Link
              href="/dashboard"
              className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>

            <h1 className="text-2xl font-extrabold tracking-tight text-[#172033]">
              My Bookings
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage and track your equipment rental reservations.
            </p>
          </div>

          <Link
            href="/equipment"
            className="hidden rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 sm:inline-flex"
          >
            Explore Equipment
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CalendarDays className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400">
                Total Reservations
              </p>
              <p className="text-2xl font-extrabold text-slate-800">
                {loading ? "..." : totalBookings}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-bold text-slate-800">
                Booking History
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Filter your reservations by status.
              </p>
            </div>

            <button
              type="button"
              onClick={loadBookings}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => handleFilterChange(filter.value)}
                className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                  selectedStatus === filter.value
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="relative mt-5 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search equipment in this page..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </section>

        {error && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-red-700">{error}</p>

            <button
              type="button"
              onClick={loadBookings}
              className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-red-700"
            >
              Retry
            </button>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-20 text-sm font-medium text-slate-500">
              <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
              Loading your bookings...
            </div>
          ) : visibleBookings.length === 0 && !error ? (
            <div className="flex flex-col items-center px-6 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Package className="h-8 w-8" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-800">
                {search ? "No matching bookings" : "No bookings found"}
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                {search
                  ? "Try another equipment name."
                  : "You have no reservations in this category yet. Explore equipment to get started."}
              </p>

              {!search && (
                <Link
                  href="/equipment"
                  className="mt-6 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  Browse Equipment
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {visibleBookings.map((booking) => {
                const status = booking.status;
                const paymentStatus = booking.paymentStatus?.toLowerCase();

                const canCancel =
                  paymentStatus !== "paid" &&
                  !["completed", "cancelled", "rejected", "expired"].includes(
                    status
                  );

                return (
                  <article
                    key={booking._id}
                    className="p-5 transition hover:bg-slate-50/60 md:p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 gap-4">
                        <div className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                          {booking.equipmentImage ? (
                            <img
                              src={booking.equipmentImage}
                              alt={booking.equipmentTitle || "Equipment"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-slate-400" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate font-bold text-slate-800">
                            {booking.equipmentTitle || "Equipment Rental"}
                          </h3>

                          <p className="mt-1 text-xs text-slate-400">
                            Booking ID: {booking._id}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {formatDate(booking.startAt)}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 className="h-3.5 w-3.5" />
                              {formatDate(booking.endAt)}
                            </span>
                          </div>

                          <p className="mt-2 text-xs text-slate-400">
                            Quantity: {booking.quantity} · {booking.rentalType}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4 lg:border-0 lg:pt-0">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Total Amount
                          </p>
                          <p className="mt-1 text-lg font-extrabold text-slate-800">
                            {formatMoney(booking.totalAmount)}
                          </p>
                          <p className="mt-1 text-xs capitalize text-slate-400">
                            Payment: {booking.paymentStatus || "Unknown"}
                          </p>
                        </div>

                        <div className="flex flex-col items-start gap-3 sm:items-end">
                          <span
                            className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${
                              statusStyles[status] ||
                              "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {statusLabels[status] || status}
                          </span>

                          {canCancel && (
                            <button
                              type="button"
                              disabled={cancellingId === booking._id}
                              onClick={() => handleCancel(booking)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 transition hover:text-red-800 disabled:opacity-50"
                            >
                              {cancellingId === booking._id ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5" />
                              )}
                              Cancel Booking
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {!loading && !error && totalBookings > 0 && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Page {page} of {totalPages} · {totalBookings} total bookings
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-10 border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        Copyright {new Date().getFullYear()} EQUIPORA. Rent Smarter. Build Better.
      </footer>
    </main>
  );
}

export default function CustomerBookingsPage() {
  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <MyBookingsContent />
    </ProtectedRoute>
  );
}
