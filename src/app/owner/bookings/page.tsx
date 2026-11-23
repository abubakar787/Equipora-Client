
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RefreshCw,
  CalendarDays,
  MapPin,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

import ProtectedRoute from "@/components/providers/protected-route";
import { authClient } from "@/lib/auth-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Booking = {
  _id: string;
  status: string;
  equipment?: {
    title?: string;
    images?: string[];
    location?: string;
  };
  equipmentTitle?: string;
  equipmentImage?: string;
  equipmentLocation?: string;
  customerName?: string;
  customerEmail?: string;
  contactName?: string;
  contactPhone?: string;
  deliveryAddress?: string;
  startAt?: string;
  endAt?: string;
  rentalType?: string;
  quantity?: number;
  pricing?: {
    unitPrice?: number;
    subtotal?: number;
  };
  subtotal?: number;
  totalAmount?: number;
  reviewNote?: string;
  createdAt?: string;
};

type Pagination = {
  page: number;
  totalPages: number;
  total: number;
};

const filters = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending_payment" },
  { label: "Approved", value: "approved_for_payment" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Rejected", value: "rejected" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

function formatDate(value?: string) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function money(value?: number) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`;
}

function getStatusStyle(status: string) {
  switch (status) {
    case "pending_payment":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "approved_for_payment":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "confirmed":
    case "active":
      return "bg-green-50 text-green-700 border-green-200";

    case "completed":
      return "bg-purple-50 text-purple-700 border-purple-200";

    case "rejected":
    case "cancelled":
    case "expired":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function getStatusLabel(status: string) {
  return (status || "unknown")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function OwnerBookingsContent() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeFilter, setActiveFilter] = useState("");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [reviewNotes, setReviewNotes] = useState<
    Record<string, string>
  >({});

  // Get authentication token
  const getToken = async (): Promise<string> => {
    const result = await authClient.token();

    if (result.error) {
      throw new Error("Unable to get authentication token. Please login again.");
    }

    return result.data.token || "";
  };

  // Load owner bookings
  const loadBookings = useCallback(async () => {
    if (!API_URL) {
      setError("API URL is not configured.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = await getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });

      if (activeFilter) {
        params.set("status", activeFilter);
      }

      const response = await fetch(
        `${API_URL}/api/bookings/owner-bookings?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Failed to load bookings."
        );
      }

      const payload = result.data;

      const list = Array.isArray(payload)
        ? payload
        : payload?.bookings ||
          payload?.data ||
          payload?.results ||
          [];

      setBookings(Array.isArray(list) ? list : []);

      const paginationData =
        payload?.pagination || payload?.meta || payload;

      setPagination({
        page: Number(paginationData?.page || page),
        totalPages: Math.max(
          1,
          Number(paginationData?.totalPages || 1)
        ),
        total: Number(
          paginationData?.total ??
            paginationData?.totalBookings ??
            list.length
        ),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );

      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [page, activeFilter]);

  // Initial loading and filter/page changes
  useEffect(() => {
    const timer = setTimeout(() => {
      void loadBookings();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadBookings]);

  // Approve or reject booking
  const handleReview = async (
    bookingId: string,
    action: "approve" | "reject"
  ) => {
    const note = reviewNotes[bookingId] || "";

    if (action === "reject" && !note.trim()) {
      setError(
        "Please provide a reason before rejecting a booking."
      );
      return;
    }

    const confirmed = window.confirm(
      action === "approve"
        ? "Are you sure you want to approve this booking?"
        : "Are you sure you want to reject this booking?"
    );

    if (!confirmed) return;

    setActionId(bookingId);
    setError("");
    setMessage("");

    try {
      if (!API_URL) {
        throw new Error("API URL is not configured.");
      }

      const token = await getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      const response = await fetch(
        `${API_URL}/api/bookings/${bookingId}/owner-review`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            action,
            reviewNote: note.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Booking review failed."
        );
      }

      setMessage(
        result.message || `Booking ${action}d successfully.`
      );

      setReviewNotes((previous) => {
        const updated = { ...previous };
        delete updated[bookingId];
        return updated;
      });

      await loadBookings();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update booking."
      );
    } finally {
      setActionId(null);
    }
  };

  const pendingCount = bookings.filter(
    (booking) => booking.status === "pending_payment"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
              Owner Dashboard
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Booking Management
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Manage customer booking requests and rental reservations.
            </p>
          </div>

          <button
            onClick={() => void loadBookings()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Summary */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Bookings</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {pagination.total}
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Pending on This Page
            </p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Current Page</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {page}
              <span className="text-base text-gray-400">
                {" "} / {pagination.totalPages}
              </span>
            </p>
          </div>
        </div>

        {/* Success Message */}
        {message && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <XCircle size={18} />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <button
              key={filter.value || "all"}
              onClick={() => {
                setActiveFilter(filter.value);
                setPage(1);
                setMessage("");
                setError("");
              }}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
                activeFilter === filter.value
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Booking List */}
        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-gray-200 bg-white">
            <Loader2
              className="mb-3 animate-spin text-blue-600"
              size={32}
            />
            <p className="text-sm text-gray-500">
              Loading bookings...
            </p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <CalendarDays
              className="mx-auto mb-4 text-gray-400"
              size={42}
            />

            <h2 className="text-lg font-semibold text-gray-800">
              No bookings found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Customer booking requests will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {bookings.map((booking) => {
              const title =
                booking.equipment?.title ||
                booking.equipmentTitle ||
                "Equipment";

              const image =
                booking.equipment?.images?.[0] ||
                booking.equipmentImage;

              const location =
                booking.equipment?.location ||
                booking.equipmentLocation ||
                booking.deliveryAddress ||
                "Location not available";

              const isPending =
                booking.status === "pending_payment";

              const isBusy = actionId === booking._id;

              return (
                <article
                  key={booking._id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row">

                      {/* Equipment Image */}
                      <div className="h-44 w-full shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-40 sm:w-52">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={image}
                            alt={title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-400">
                            <Package size={42} />
                          </div>
                        )}
                      </div>

                      {/* Booking Information */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h2 className="text-lg font-bold text-gray-900">
                              {title}
                            </h2>

                            <p className="mt-1 text-xs text-gray-400">
                              Booking ID: {booking._id}
                            </p>
                          </div>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
                              booking.status
                            )}`}
                          >
                            {getStatusLabel(booking.status)}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                          <div className="flex items-center gap-2 text-gray-600">
                            <CalendarDays
                              size={16}
                              className="shrink-0 text-gray-400"
                            />
                            <span>
                              Start: {formatDate(booking.startAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock
                              size={16}
                              className="shrink-0 text-gray-400"
                            />
                            <span>
                              End: {formatDate(booking.endAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin
                              size={16}
                              className="shrink-0 text-gray-400"
                            />
                            <span className="truncate">
                              {location}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-600">
                            <Package
                              size={16}
                              className="shrink-0 text-gray-400"
                            />
                            <span>
                              {booking.quantity || 1} item(s) ·{" "}
                              {booking.rentalType || "N/A"}
                            </span>
                          </div>
                        </div>

                        {/* Amount and Customer */}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                          <div>
                            <p className="text-xs text-gray-500">
                              Booking Amount
                            </p>

                            <p className="text-xl font-bold text-gray-900">
                              {money(
                                booking.subtotal ??
                                  booking.pricing?.subtotal ??
                                  booking.totalAmount
                              )}
                            </p>
                          </div>

                          <div className="text-right text-xs text-gray-500">
                            <p>
                              Customer:{" "}
                              {booking.contactName ||
                                booking.customerName ||
                                "N/A"}
                            </p>

                            <p className="mt-1">
                              {booking.contactPhone ||
                                booking.customerEmail ||
                                ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Review Actions */}
                    {isPending && (
                      <div className="mt-5 border-t border-gray-100 pt-5">
                        <label
                          htmlFor={`note-${booking._id}`}
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Review note (optional for approval, required for rejection)
                        </label>

                        <textarea
                          id={`note-${booking._id}`}
                          rows={2}
                          maxLength={500}
                          value={reviewNotes[booking._id] || ""}
                          onChange={(event) =>
                            setReviewNotes((previous) => ({
                              ...previous,
                              [booking._id]: event.target.value,
                            }))
                          }
                          placeholder="Write a note for the customer..."
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />

                        <div className="mt-3 flex flex-wrap justify-end gap-3">
                          <button
                            onClick={() =>
                              handleReview(booking._id, "reject")
                            }
                            disabled={isBusy}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {isBusy ? (
                              <Loader2
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <XCircle size={16} />
                            )}
                            Reject
                          </button>

                          <button
                            onClick={() =>
                              handleReview(booking._id, "approve")
                            }
                            disabled={isBusy}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            {isBusy ? (
                              <Loader2
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <CheckCircle2 size={16} />
                            )}
                            Approve for Payment
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && bookings.length > 0 && (
          <div className="mt-7 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-4">
            <p className="text-sm text-gray-500">
              Page {page} of {pagination.totalPages}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setPage((current) => Math.max(1, current - 1))
                }
                disabled={page <= 1}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                onClick={() =>
                  setPage((current) =>
                    Math.min(
                      pagination.totalPages,
                      current + 1
                    )
                  )
                }
                disabled={page >= pagination.totalPages}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OwnerBookingsPage() {
  return (
    <ProtectedRoute allowedRoles={["owner", "admin"]}>
      <OwnerBookingsContent />
    </ProtectedRoute>
  );
}
