
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CreditCard,
  LoaderCircle,
  RefreshCw,
  Search,
  X,
  RotateCcw,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import ProtectedRoute from "@/components/providers/protected-route";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type PaymentStatus =
  | "paid"
  | "partially_refunded"
  | "refunded"
  | string;

interface Payment {
  _id: string;
  bookingId: string;
  customerId: string;
  ownerId: string;
  amountCents: number;
  commissionCents: number;
  ownerEarningsCents: number;
  refundedAmountCents?: number;
  refundReservedCents?: number;
  refundedCommissionCents?: number;
  refundedOwnerEarningsCents?: number;
  currency?: string;
  status: PaymentStatus;
  paymentMethod?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  createdAt: string;
}

interface RefundForm {
  paymentId: string;
  amount: string;
  reason: "requested_by_customer" | "duplicate" | "fraudulent";
  note: string;
}

function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format((Number(cents) || 0) / 100);
}

function formatDate(date: string) {
  if (!date) return "—";

  return new Date(date).toLocaleString();
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700",
    partially_refunded: "bg-amber-50 text-amber-700",
    refunded: "bg-blue-50 text-blue-700",
    failed: "bg-red-50 text-red-700",
    pending: "bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function AdminPaymentsContent() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [refundForm, setRefundForm] = useState<RefundForm | null>(null);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (!API_URL) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured.");
      }

      const tokenResponse = await authClient.token();
      const token = tokenResponse.data?.token;

      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const response = await fetch(`${API_URL}/api/payments/history`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load payment history.");
      }

      const records = result.data?.data;

      if (!Array.isArray(records)) {
        throw new Error("Unexpected payment history response format.");
      }

      setPayments(records);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  const filteredPayments = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return payments;

    return payments.filter((payment) =>
      [
        payment._id,
        payment.bookingId,
        payment.customerId,
        payment.ownerId,
        payment.status,
        payment.stripePaymentIntentId,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [payments, search]);

  const totals = useMemo(() => {
    return payments.reduce(
      (acc, payment) => {
        const amount = Number(payment.amountCents) || 0;
        const refunded = Number(payment.refundedAmountCents) || 0;

        acc.total += amount;
        acc.refunded += refunded;

        if (payment.status === "paid") acc.paidCount += 1;
        if (payment.status === "partially_refunded") acc.partialCount += 1;
        if (payment.status === "refunded") acc.refundedCount += 1;

        return acc;
      },
      {
        total: 0,
        refunded: 0,
        paidCount: 0,
        partialCount: 0,
        refundedCount: 0,
      }
    );
  }, [payments]);

  const openRefund = (payment: Payment) => {
    setError("");
    setSuccess("");

    const refundable =
      payment.amountCents -
      (payment.refundedAmountCents || 0) -
      (payment.refundReservedCents || 0);

    if (
      !["paid", "partially_refunded"].includes(payment.status) ||
      refundable <= 0
    ) {
      setError("This payment has no refundable balance.");
      return;
    }

    setRefundForm({
      paymentId: payment._id,
      amount: (refundable / 100).toFixed(2),
      reason: "requested_by_customer",
      note: "",
    });
  };

  const submitRefund = async () => {
    if (!refundForm) return;

    setError("");
    setSuccess("");

    const payment = payments.find(
      (item) => item._id === refundForm.paymentId
    );

    if (!payment) {
      setError("Payment record not found.");
      return;
    }

    const amountCents = Math.round(Number(refundForm.amount) * 100);

    const refundable =
      payment.amountCents -
      (payment.refundedAmountCents || 0) -
      (payment.refundReservedCents || 0);

    if (
      !Number.isSafeInteger(amountCents) ||
      amountCents <= 0 ||
      amountCents > refundable
    ) {
      setError("Enter a valid amount within the refundable balance.");
      return;
    }

    try {
      setSubmitting(true);

      const tokenResponse = await authClient.token();
      const token = tokenResponse.data?.token;

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await fetch(`${API_URL}/api/payments/refunds`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId: refundForm.paymentId,
          amountCents,
          reason: refundForm.reason,
          note: refundForm.note.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Refund request failed.");
      }

      setSuccess(
        "Refund request submitted. Final status will update after Stripe webhook confirmation."
      );

      setRefundForm(null);
      await loadPayments();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to process refund."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={20} />
          </Link>

          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Payment Management
            </h1>
            <p className="text-sm text-slate-500">
              Monitor transactions and manage refunds
            </p>
          </div>
        </div>

        <button
          onClick={() => void loadPayments()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-emerald-500 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {success}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Payment Records",
              value: payments.length.toLocaleString(),
            },
            {
              label: "Recorded Payment Volume",
              value: money(totals.total),
            },
            {
              label: "Refunded Amount",
              value: money(totals.refunded),
            },
            {
              label: "Paid / Partial / Refunded",
              value: `${totals.paidCount} / ${totals.partialCount} / ${totals.refundedCount}`,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-2 break-words text-2xl font-bold text-slate-900">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-bold text-slate-900">All Transactions</h2>
              <p className="mt-1 text-xs text-slate-500">
                Latest payment records returned by the server
              </p>
            </div>

            <div className="relative w-full sm:max-w-sm">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search payment, booking or customer..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <LoaderCircle
                className="animate-spin text-emerald-600"
                size={34}
              />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard
                size={40}
                className="mx-auto text-slate-300"
              />
              <h3 className="mt-4 font-semibold text-slate-800">
                No payment records found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Payments will appear here after successful checkout.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Payment / Booking</th>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Amount</th>
                    <th className="px-5 py-4">Refunded</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((payment) => {
                    const refundable =
                      payment.amountCents -
                      (payment.refundedAmountCents || 0) -
                      (payment.refundReservedCents || 0);

                    const canRefund =
                      ["paid", "partially_refunded"].includes(payment.status) &&
                      refundable > 0;

                    return (
                      <tr key={payment._id} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">
                            {payment._id}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Booking: {payment.bookingId}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-slate-700">
                            {payment.customerId}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Owner: {payment.ownerId}
                          </p>
                        </td>

                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {money(payment.amountCents, payment.currency)}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {money(
                            payment.refundedAmountCents || 0,
                            payment.currency
                          )}
                          {(payment.refundReservedCents || 0) > 0 && (
                            <p className="mt-1 text-xs text-amber-600">
                              Reserved:{" "}
                              {money(
                                payment.refundReservedCents || 0,
                                payment.currency
                              )}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={payment.status} />
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-500">
                          {formatDate(payment.createdAt)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            disabled={!canRefund}
                            onClick={() => openRefund(payment)}
                            className="inline-flex items-center gap-2 rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <RotateCcw size={14} />
                            Refund
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
            Showing {filteredPayments.length} of {payments.length} loaded
            records. The current backend returns at most 100 latest payments.
          </div>
        </section>
      </main>

      {refundForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Create Refund
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Refund is submitted to Stripe. Final status is webhook-driven.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setRefundForm(null)}
                disabled={submitting}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close refund dialog"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Refund amount (USD)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={refundForm.amount}
                  onChange={(event) =>
                    setRefundForm({
                      ...refundForm,
                      amount: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Reason
                </label>
                <select
                  value={refundForm.reason}
                  onChange={(event) =>
                    setRefundForm({
                      ...refundForm,
                      reason: event.target.value as RefundForm["reason"],
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                >
                  <option value="requested_by_customer">
                    Requested by customer
                  </option>
                  <option value="duplicate">Duplicate payment</option>
                  <option value="fraudulent">Fraudulent payment</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Admin note (optional)
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={refundForm.note}
                  onChange={(event) =>
                    setRefundForm({
                      ...refundForm,
                      note: event.target.value,
                    })
                  }
                  placeholder="Write a short internal note..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setRefundForm(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void submitRefund()}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {submitting && (
                    <LoaderCircle size={16} className="animate-spin" />
                  )}
                  Submit Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPaymentsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminPaymentsContent />
    </ProtectedRoute>
  );
}
