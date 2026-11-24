
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
  Timer,
  AlertTriangle,
  Clock3,
} from "lucide-react";

import ProtectedRoute from "@/components/providers/protected-route";
import { authClient } from "@/lib/auth-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ============================================
// TYPES
// ============================================

type ExtensionRequest = {
  _id: string;
  requestedBy: string;
  requestedHours: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string;
  createdAt: string;
};

type ExtensionHistory = {
  extendedBy: string;
  extendedByRole: string;
  previousDeadline: string;
  newDeadline: string;
  hours: number;
  reason: string;
  requestId?: string;
  createdAt: string;
};

type Booking = {
  _id: string;
  status: string;
  paymentStatus?: string;

  ownerReviewExpiresAt?: string;
  paymentExpiresAt?: string;
  expiresAt?: string;

  extensionCount?: number;
  extensionRequests?: ExtensionRequest[];
  extensionHistory?: ExtensionHistory[];

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
  ownerReviewNote?: string;
  createdAt?: string;
};

type Pagination = {
  page: number;
  totalPages: number;
  total: number;
};

type CountdownResult = {
  expired: boolean;
  text: string;
  remainingMs: number;
};

// ============================================
// CONSTANTS
// ============================================

const filters = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending_payment" },
  { label: "Approved", value: "approved_for_payment" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Active", value: "active" },
  { label: "Rejected", value: "rejected" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const extensionOptions = [12, 24, 48];

// ============================================
// HELPERS
// ============================================

function formatDate(value?: string) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

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

function getCountdown(
  deadline?: string,
  now = Date.now()
): CountdownResult {
  if (!deadline) {
    return {
      expired: true,
      text: "Deadline unavailable",
      remainingMs: 0,
    };
  }

  const timestamp = new Date(deadline).getTime();

  if (Number.isNaN(timestamp)) {
    return {
      expired: true,
      text: "Invalid deadline",
      remainingMs: 0,
    };
  }

  const remaining = timestamp - now;

  if (remaining <= 0) {
    return {
      expired: true,
      text: "Approval Time Expired",
      remainingMs: 0,
    };
  }

  const totalSeconds = Math.floor(remaining / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    expired: false,
    text: `${days}d ${hours}h ${minutes}m ${seconds}s`,
    remainingMs: remaining,
  };
}

function getReviewDeadline(booking: Booking) {
  return booking.ownerReviewExpiresAt || booking.expiresAt;
}

// ============================================
// MAIN COMPONENT
// ============================================

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

  const [currentTime, setCurrentTime] = useState(Date.now());

  const [reviewNotes, setReviewNotes] = useState<
    Record<string, string>
  >({});

  const [extensionHours, setExtensionHours] = useState<
    Record<string, number>
  >({});

  const [extensionReasons, setExtensionReasons] = useState<
    Record<string, string>
  >({});

  // ============================================
  // AUTHENTICATION
  // ============================================

  const getToken = async (): Promise<string> => {
    const result = await authClient.token();

    if (result.error) {
      throw new Error(
        "Unable to get authentication token. Please login again."
      );
    }

    const token = result.data?.token;

    if (!token) {
      throw new Error(
        "Authentication token not found. Please login again."
      );
    }

    return token;
  };

  // ============================================
  // API HELPER
  // ============================================

  const apiRequest = async (
    endpoint: string,
    options: RequestInit = {}
  ) => {
    if (!API_URL) {
      throw new Error("API URL is not configured.");
    }

    const token = await getToken();

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include",
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(
        result.message || "Something went wrong."
      );
    }

    return result;
  };

  // ============================================
  // LOAD BOOKINGS
  // ============================================

  const loadBookings = useCallback(async () => {
    if (!API_URL) {
      setError("API URL is not configured.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });

      if (activeFilter) {
        params.set("status", activeFilter);
      }

      const result = await apiRequest(
        `/api/bookings/owner-bookings?${params.toString()}`
      );

      const payload = result.data;

      const list = Array.isArray(payload)
        ? payload
        : payload?.bookings ||
          payload?.data ||
          payload?.results ||
          [];

      const safeBookings: Booking[] = Array.isArray(list)
        ? list
        : [];

      setBookings(safeBookings);

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
            safeBookings.length
        ),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load bookings."
      );

      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [page, activeFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBookings();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadBookings]);

  // ============================================
  // LIVE COUNTDOWN
  // ============================================

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  // ============================================
  // OWNER: APPROVE OR REJECT BOOKING
  // ============================================

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
      const result = await apiRequest(
        `/api/bookings/${bookingId}/owner-review`,
        {
          method: "PATCH",
          body: JSON.stringify({
            action,
            reviewNote: note.trim(),
          }),
        }
      );

      setMessage(
        result.message || `Booking ${action} successful.`
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

  // ============================================
  // OWNER / ADMIN: DIRECT DEADLINE EXTENSION
  // ============================================

  const handleExtendDeadline = async (bookingId: string) => {
    const hours = extensionHours[bookingId] || 24;

    const reason = extensionReasons[bookingId]?.trim() || "";

    if (reason.length < 5) {
      setError(
        "Please provide an extension reason (minimum 5 characters)."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to extend this booking deadline by ${hours} hours?`
    );

    if (!confirmed) return;

    setActionId(bookingId);
    setError("");
    setMessage("");

    try {
      const result = await apiRequest(
        `/api/bookings/${bookingId}/extend-deadline`,
        {
          method: "PATCH",
          body: JSON.stringify({
            hours,
            reason,
          }),
        }
      );

      setMessage(
        result.message ||
          "Booking review deadline extended successfully."
      );

      setExtensionReasons((previous) => ({
        ...previous,
        [bookingId]: "",
      }));

      await loadBookings();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to extend deadline."
      );
    } finally {
      setActionId(null);
    }
  };

  // ============================================
  // OWNER / ADMIN: REVIEW CUSTOMER EXTENSION
  // ============================================

  const handleExtensionRequestReview = async (
    bookingId: string,
    requestId: string,
    action: "approve" | "reject"
  ) => {
    const confirmed = window.confirm(
      action === "approve"
        ? "Are you sure you want to approve this extension request?"
        : "Are you sure you want to reject this extension request?"
    );

    if (!confirmed) return;

    setActionId(bookingId);
    setError("");
    setMessage("");

    try {
      const result = await apiRequest(
        `/api/bookings/${bookingId}/extension-requests/${requestId}/review`,
        {
          method: "PATCH",
          body: JSON.stringify({
            action,
            reviewNote: "",
          }),
        }
      );

      setMessage(
        result.message ||
          (action === "approve"
            ? "Extension request approved."
            : "Extension request rejected.")
      );

      await loadBookings();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to review extension request."
      );
    } finally {
      setActionId(null);
    }
  };

  // ============================================
  // SUMMARY
  // ============================================

  const pendingCount = bookings.filter(
    (booking) => booking.status === "pending_payment"
  ).length;

  const expiredCount = bookings.filter((booking) => {
    if (booking.status !== "pending_payment") return false;

    return getCountdown(
      getReviewDeadline(booking),
      currentTime
    ).expired;
  }).length;

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
              Owner Dashboard
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Booking Management
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Manage customer booking requests, review deadlines
              and rental reservations.
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

        {/* SUMMARY CARDS */}

        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Bookings
            </p>

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

          <div className="rounded-xl border border-red-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Review Time Expired
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {expiredCount}
            </p>
          </div>
        </div>

        {/* SUCCESS MESSAGE */}

        {message && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 size={18} />
            {message}
          </div>
        )}

        {/* ERROR MESSAGE */}

        {error && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div className="flex items-start gap-2">
              <AlertTriangle
                size={18}
                className="mt-0.5 shrink-0"
              />
              <span>{error}</span>
            </div>

            <button
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <XCircle size={18} />
            </button>
          </div>
        )}

        {/* FILTERS */}

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

        {/* BOOKING LIST */}

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

              const reviewDeadline =
                getReviewDeadline(booking);

              const countdown = getCountdown(
                reviewDeadline,
                currentTime
              );

              const pendingExtensionRequests =
                booking.extensionRequests?.filter(
                  (request) => request.status === "pending"
                ) || [];

              const selectedHours =
                extensionHours[booking._id] || 24;

              return (
                <article
                  key={booking._id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="p-5 sm:p-6">

                    {/* BOOKING DETAILS */}

                    <div className="flex flex-col gap-5 lg:flex-row">

                      {/* EQUIPMENT IMAGE */}

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

                      {/* INFORMATION */}

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

                        {/* AMOUNT AND CUSTOMER */}

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

                    {/* OWNER REVIEW COUNTDOWN */}

                    {isPending && (
                      <div
                        className={`mt-5 rounded-xl border p-4 ${
                          countdown.expired
                            ? "border-red-200 bg-red-50"
                            : "border-amber-200 bg-amber-50"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            {countdown.expired ? (
                              <AlertTriangle
                                size={22}
                                className="mt-1 text-red-600"
                              />
                            ) : (
                              <Timer
                                size={22}
                                className="mt-1 text-amber-600"
                              />
                            )}

                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                Owner Review Deadline
                              </p>

                              <p
                                className={`mt-1 text-xl font-bold ${
                                  countdown.expired
                                    ? "text-red-700"
                                    : "text-amber-700"
                                }`}
                              >
                                {countdown.text}
                              </p>

                              {reviewDeadline && (
                                <p className="mt-1 text-xs text-gray-500">
                                  Deadline: {formatDate(reviewDeadline)}
                                </p>
                              )}
                            </div>
                          </div>

                          {countdown.expired && (
                            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                              Review Time Expired
                            </span>
                          )}
                        </div>

                        {/* DIRECT EXTENSION */}

                        <div className="mt-4 border-t border-gray-200 pt-4">
                          <div className="mb-3 flex items-center gap-2">
                            <Clock3
                              size={17}
                              className="text-blue-600"
                            />

                            <h3 className="text-sm font-semibold text-gray-800">
                              Extend Review Deadline
                            </h3>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <select
                              value={selectedHours}
                              onChange={(event) =>
                                setExtensionHours((previous) => ({
                                  ...previous,
                                  [booking._id]: Number(
                                    event.target.value
                                  ),
                                }))
                              }
                              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                              {extensionOptions.map((hours) => (
                                <option
                                  key={hours}
                                  value={hours}
                                >
                                  {hours} Hours
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={() =>
                                void handleExtendDeadline(
                                  booking._id
                                )
                              }
                              disabled={isBusy}
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isBusy ? (
                                <Loader2
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <Clock3 size={16} />
                              )}

                              Extend Deadline
                            </button>
                          </div>

                          <textarea
                            rows={2}
                            maxLength={500}
                            value={
                              extensionReasons[booking._id] || ""
                            }
                            onChange={(event) =>
                              setExtensionReasons((previous) => ({
                                ...previous,
                                [booking._id]:
                                  event.target.value,
                              }))
                            }
                            placeholder="Reason for extending the deadline (minimum 5 characters)..."
                            className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />

                          <p className="mt-1 text-xs text-gray-400">
                            Choose 12, 24 or 48 hours. A reason is required.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* CUSTOMER EXTENSION REQUESTS */}

                    {pendingExtensionRequests.length > 0 && (
                      <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                        <div className="flex items-center gap-2">
                          <Clock3
                            size={19}
                            className="text-blue-600"
                          />

                          <h3 className="font-semibold text-gray-900">
                            Customer Extension Requests
                          </h3>
                        </div>

                        <div className="mt-4 space-y-3">
                          {pendingExtensionRequests.map(
                            (request) => (
                              <div
                                key={request._id}
                                className="rounded-lg border border-blue-100 bg-white p-4"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-sm font-semibold text-gray-800">
                                    Requested Extension:{" "}
                                    {request.requestedHours} Hours
                                  </p>

                                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                    Pending Review
                                  </span>
                                </div>

                                <p className="mt-3 text-sm leading-6 text-gray-600">
                                  {request.reason}
                                </p>

                                <p className="mt-2 text-xs text-gray-400">
                                  Requested:{" "}
                                  {formatDate(request.createdAt)}
                                </p>

                                <div className="mt-4 flex flex-wrap justify-end gap-2">
                                  <button
                                    onClick={() =>
                                      void handleExtensionRequestReview(
                                        booking._id,
                                        request._id,
                                        "reject"
                                      )
                                    }
                                    disabled={isBusy}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                                  >
                                    <XCircle size={16} />
                                    Reject Request
                                  </button>

                                  <button
                                    onClick={() =>
                                      void handleExtensionRequestReview(
                                        booking._id,
                                        request._id,
                                        "approve"
                                      )
                                    }
                                    disabled={isBusy}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                                  >
                                    <CheckCircle2 size={16} />
                                    Approve Request
                                  </button>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* OWNER REVIEW ACTIONS */}

                    {isPending && !countdown.expired && (
                      <div className="mt-5 border-t border-gray-100 pt-5">
                        <label
                          htmlFor={`note-${booking._id}`}
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Review note (optional for approval,
                          required for rejection)
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
                              void handleReview(
                                booking._id,
                                "reject"
                              )
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
                              void handleReview(
                                booking._id,
                                "approve"
                              )
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

                    {/* EXPIRED MESSAGE */}

                    {isPending && countdown.expired && (
                      <div className="mt-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                        <AlertTriangle
                          size={20}
                          className="mt-0.5 shrink-0 text-red-600"
                        />

                        <div>
                          <p className="text-sm font-semibold text-red-800">
                            Approval Time Expired
                          </p>

                          <p className="mt-1 text-sm text-red-700">
                            This booking cannot be approved or rejected
                            until its review deadline is extended.
                            Use the extension option above if the
                            equipment is still available.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* PAYMENT DEADLINE */}

                    {booking.status === "approved_for_payment" &&
                      (booking.paymentExpiresAt ||
                        booking.expiresAt) && (
                        <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
                          <div className="flex items-center gap-2">
                            <Timer
                              size={18}
                              className="text-blue-600"
                            />

                            <p className="text-sm font-semibold text-blue-800">
                              Customer Payment Deadline
                            </p>
                          </div>

                          <p className="mt-2 text-sm text-blue-700">
                            {formatDate(
                              booking.paymentExpiresAt ||
                                booking.expiresAt
                            )}
                          </p>
                        </div>
                      )}

                    {/* REVIEW NOTE */}

                    {booking.ownerReviewNote && (
                      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs font-semibold text-gray-500">
                          Owner Review Note
                        </p>

                        <p className="mt-1 text-sm text-gray-700">
                          {booking.ownerReviewNote}
                        </p>
                      </div>
                    )}

                    {/* EXTENSION HISTORY */}

                    {booking.extensionHistory &&
                      booking.extensionHistory.length > 0 && (
                        <div className="mt-5 border-t border-gray-100 pt-4">
                          <h3 className="text-sm font-semibold text-gray-800">
                            Extension History
                          </h3>

                          <div className="mt-3 space-y-2">
                            {booking.extensionHistory.map(
                              (history, index) => (
                                <div
                                  key={`${booking._id}-history-${index}`}
                                  className="rounded-lg bg-gray-50 p-3 text-sm"
                                >
                                  <p className="font-medium text-gray-700">
                                    {history.hours} hours extended
                                  </p>

                                  <p className="mt-1 text-xs text-gray-500">
                                    New deadline:{" "}
                                    {formatDate(history.newDeadline)}
                                  </p>

                                  <p className="mt-1 text-xs text-gray-500">
                                    {history.reason}
                                  </p>

                                  <p className="mt-1 text-xs text-gray-400">
                                    {formatDate(history.createdAt)}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* PAGINATION */}

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

// ============================================
// PAGE EXPORT
// ============================================

export default function OwnerBookingsPage() {
  return (
    <ProtectedRoute allowedRoles={["owner", "admin"]}>
      <OwnerBookingsContent />
    </ProtectedRoute>
  );
}
