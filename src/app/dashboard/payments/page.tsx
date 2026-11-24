
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CreditCard,
  RefreshCw,
  Receipt,
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

const HISTORY_ENDPOINT = "api/payments/history";

interface Payment {
  _id?: string;
  id?: string;
  bookingId?: string | { _id?: string; equipmentTitle?: string };
  equipmentTitle?: string;
  amountCents?: number;
  amount?: number;
  currency?: string;
  status?: string;
  method?: string;
  paymentMethod?: string;
  stripeSessionId?: string;
  paymentIntentId?: string;
  createdAt?: string;
  paidAt?: string;
}

interface PaymentHistoryResponse {
  success?: boolean;
  total?: number;
  data?: Payment[] | PaymentHistoryResponse;
  payments?: Payment[];
  message?: string;
}

function getPayments(response: PaymentHistoryResponse): Payment[] {
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.payments)) return response.payments;

  if (
    response.data &&
    typeof response.data === "object" &&
    !Array.isArray(response.data)
  ) {
    return getPayments(response.data as PaymentHistoryResponse);
  }

  return [];
}

function formatAmount(payment: Payment) {
  const currency = (payment.currency || "usd").toUpperCase();

  // Backend payment records store amount in cents.
  const amount =
    typeof payment.amountCents === "number"
      ? payment.amountCents / 100
      : Number(payment.amount || 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(date?: string) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusStyle(status?: string) {
  switch (status?.toLowerCase()) {
    case "paid":
    case "succeeded":
      return {
        className: "bg-green-50 text-green-700",
        icon: CheckCircle2,
        label: "Paid",
      };

    case "pending":
    case "processing":
      return {
        className: "bg-yellow-50 text-yellow-700",
        icon: Clock,
        label: "Pending",
      };

    case "failed":
    case "refunded":
    case "cancelled":
      return {
        className: "bg-red-50 text-red-700",
        icon: XCircle,
        label: status,
      };

    default:
      return {
        className: "bg-gray-100 text-gray-700",
        icon: Clock,
        label: status || "Unknown",
      };
  }
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiRequest<PaymentHistoryResponse>(
        HISTORY_ENDPOINT,
        {
          method: "GET",
          auth: true,
        }
      );

      setPayments(getPayments(response));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load payment history."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filteredPayments = payments.filter((payment) => {
    const bookingId =
      typeof payment.bookingId === "object"
        ? payment.bookingId?._id || ""
        : payment.bookingId || "";

    const equipmentTitle =
      payment.equipmentTitle ||
      (typeof payment.bookingId === "object"
        ? payment.bookingId?.equipmentTitle
        : "") ||
      "";

    const searchValue = [
      bookingId,
      equipmentTitle,
      payment.status,
      payment.stripeSessionId,
      payment.paymentIntentId,
    ]
      .join(" ")
      .toLowerCase();

    return searchValue.includes(searchTerm.toLowerCase());
  });

  const totalPaid = payments
    .filter((payment) => payment.status?.toLowerCase() === "paid")
    .reduce((total, payment) => {
      const amount =
        typeof payment.amountCents === "number"
          ? payment.amountCents / 100
          : Number(payment.amount || 0);

      return total + amount;
    }, 0);

  const paidCount = payments.filter(
    (payment) => payment.status?.toLowerCase() === "paid"
  ).length;

  const pendingCount = payments.filter((payment) =>
    ["pending", "processing"].includes(payment.status?.toLowerCase() || "")
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Payment History
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View and track your payment transactions.
          </p>
        </div>

        <button
          onClick={fetchPayments}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Transactions</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                {payments.length}
              </h2>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <Receipt size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Successful Payments</p>
              <h2 className="mt-2 text-2xl font-bold text-green-600">
                {paidCount}
              </h2>
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-green-600">
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Paid</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(totalPaid)}
              </h2>
            </div>
            <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
              <CreditCard size={22} />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            {pendingCount} pending transaction(s)
          </p>
        </div>
      </div>

      {/* Payment History */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">
              Transactions
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {filteredPayments.length} transaction(s) found
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search transactions..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3">
            <RefreshCw className="animate-spin text-blue-600" size={28} />
            <p className="text-sm text-gray-500">
              Loading payment history...
            </p>
          </div>
        ) : error ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <AlertCircle className="mb-3 text-red-500" size={32} />
            <h3 className="font-semibold text-gray-900">
              Failed to load payments
            </h3>
            <p className="mt-2 max-w-md text-sm text-gray-500">
              {error}
            </p>
            <button
              onClick={fetchPayments}
              className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <div className="mb-3 rounded-full bg-gray-100 p-4">
              <CreditCard size={28} className="text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900">
              No payments found
            </h3>
            <p className="mt-2 max-w-sm text-sm text-gray-500">
              {searchTerm
                ? "No transactions match your search."
                : "Your completed payment transactions will appear here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Booking</th>
                  <th className="px-5 py-4 font-semibold">Amount</th>
                  <th className="px-5 py-4 font-semibold">Method</th>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredPayments.map((payment, index) => {
                  const bookingId =
                    typeof payment.bookingId === "object"
                      ? payment.bookingId?._id
                      : payment.bookingId;

                  const status = getStatusStyle(payment.status);
                  const StatusIcon = status.icon;

                  return (
                    <tr
                      key={payment._id || payment.id || index}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">
                          {payment.equipmentTitle ||
                            (typeof payment.bookingId === "object"
                              ? payment.bookingId?.equipmentTitle
                              : "") ||
                            "Equipment Rental"}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {bookingId
                            ? `Booking: ${String(bookingId).slice(-8)}`
                            : "Booking reference unavailable"}
                        </p>
                      </td>

                      <td className="px-5 py-4 font-semibold text-gray-900">
                        {formatAmount(payment)}
                      </td>

                      <td className="px-5 py-4 capitalize text-gray-600">
                        {payment.method ||
                          payment.paymentMethod ||
                          "Card"}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {formatDate(payment.paidAt || payment.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${status.className}`}
                        >
                          <StatusIcon size={13} />
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
