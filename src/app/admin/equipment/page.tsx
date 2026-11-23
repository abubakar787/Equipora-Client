
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";

import ProtectedRoute from "@/components/providers/protected-route";
import { authClient } from "@/lib/auth-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Equipment = {
  _id: string;
  title?: string;
  name?: string;
  description?: string;
  category?: string;
  location?: string;
  price?: number | string;
  priceUnit?: string;
  images?: string[];
  image?: string;
  coverImage?: string;
  status?: string;
  reviewNote?: string;
  createdAt?: string;
  owner?: {
    name?: string;
    email?: string;
  };
  ownerName?: string;
  ownerEmail?: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

function getEquipmentImage(equipment: Equipment) {
  return (
    equipment.images?.[0] ||
    equipment.coverImage ||
    equipment.image ||
    ""
  );
}

function formatDate(date?: string) {
  if (!date) return "N/A";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "N/A";

  return parsedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function AdminEquipmentContent() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedEquipment, setSelectedEquipment] =
    useState<Equipment | null>(null);

  const [reviewNote, setReviewNote] = useState("");
  const [reviewAction, setReviewAction] = useState<
    "approved" | "rejected" | null
  >(null);

  const getToken = async () => {
    const tokenResponse = await authClient.token();
    return tokenResponse.data?.token;
  };

  const fetchEquipment = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (!API_URL) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured.");
      }

      const token = await getToken();

      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const response = await fetch(
        `${API_URL}/api/equipment/admin/pending?page=${page}&limit=10`,
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

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load equipment."
        );
      }

      const data = result.data ?? result;

      const equipmentList =
        Array.isArray(data) ? data :
        Array.isArray(data.equipment) ? data.equipment :
        Array.isArray(data.items) ? data.items :
        Array.isArray(data.results) ? data.results :
        Array.isArray(data.data) ? data.data :
        [];

      setEquipment(equipmentList);

      const paginationData = data.pagination ?? result.pagination;

      if (paginationData) {
        setPagination({
          page: Number(paginationData.page ?? page),
          limit: Number(paginationData.limit ?? 10),
          total: Number(paginationData.total ?? equipmentList.length),
          totalPages: Math.max(
            1,
            Number(paginationData.totalPages ?? 1)
          ),
        });
      } else {
        setPagination({
          page,
          limit: 10,
          total: equipmentList.length,
          totalPages: 1,
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const filteredEquipment = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return equipment;

    return equipment.filter((item) => {
      const searchableText = [
        item.title,
        item.name,
        item.description,
        item.category,
        item.location,
        item.owner?.name,
        item.owner?.email,
        item.ownerName,
        item.ownerEmail,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [equipment, search]);

  const handleReview = async (
    item: Equipment,
    status: "approved" | "rejected"
  ) => {
    if (!item._id) {
      setError("Equipment ID is missing.");
      return;
    }

    if (status === "rejected" && !reviewNote.trim()) {
      setError("Please provide a review note before rejecting.");
      return;
    }

    const confirmed = window.confirm(
      status === "approved"
        ? `Are you sure you want to approve "${item.title || item.name}"?`
        : `Are you sure you want to reject "${item.title || item.name}"?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(item._id);
      setError("");
      setSuccess("");

      const token = await getToken();

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await fetch(
        `${API_URL}/api/equipment/${item._id}/review`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            reviewNote: reviewNote.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || `Failed to ${status} equipment.`
        );
      }

      setSuccess(
        status === "approved"
          ? "Equipment approved successfully."
          : "Equipment rejected successfully."
      );

      setSelectedEquipment(null);
      setReviewNote("");
      setReviewAction(null);

      await fetchEquipment();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to process your request."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openReview = (
    item: Equipment,
    action: "approved" | "rejected"
  ) => {
    setSelectedEquipment(item);
    setReviewAction(action);
    setReviewNote("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={19} />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-emerald-600" size={20} />
                <h1 className="text-xl font-bold text-slate-900">
                  Equipment Management
                </h1>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Review and manage equipment submissions
              </p>
            </div>
          </div>

          <button
            onClick={fetchEquipment}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Messages */}
        {error && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p>{error}</p>
            <button
              onClick={() => setError("")}
              aria-label="Close error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <p>{success}</p>
            <button
              onClick={() => setSuccess("")}
              aria-label="Close success message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Summary */}
        <div className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Pending on this page
                </p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  {equipment.length}
                </h2>
              </div>
              <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <Clock size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total pending
                </p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  {pagination.total}
                </h2>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <Package size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Current page
                </p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  {pagination.page} / {pagination.totalPages}
                </h2>
              </div>
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <ShieldCheck size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">
              Pending Submissions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review equipment before making it available.
            </p>
          </div>

          <div className="relative w-full sm:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search equipment..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        {/* Equipment List */}
        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <Loader2 className="mb-3 animate-spin text-emerald-600" size={32} />
            <p className="text-sm text-slate-500">
              Loading equipment...
            </p>
          </div>
        ) : filteredEquipment.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 text-center">
            <div className="mb-4 rounded-2xl bg-slate-100 p-4 text-slate-400">
              <Package size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              No equipment found
            </h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              {search
                ? "Try another search keyword."
                : "There are currently no pending equipment submissions."}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredEquipment.map((item) => {
              const image = getEquipmentImage(item);
              const isProcessing = actionLoading === item._id;

              return (
                <article
                  key={item._id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {/* Image */}
                  <div className="relative h-48 bg-slate-100">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt={item.title || item.name || "Equipment"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-300">
                        <ImageIcon size={45} />
                      </div>
                    )}

                    <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700 shadow-sm">
                      <Clock size={13} />
                      Pending
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="line-clamp-1 text-lg font-bold text-slate-900">
                          {item.title || item.name || "Untitled Equipment"}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {item.category || "Uncategorized"}
                        </p>
                      </div>
                    </div>

                    <p className="mb-4 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
                      {item.description || "No description provided."}
                    </p>

                    <div className="space-y-2 border-t border-slate-100 pt-4 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">Owner</span>
                        <span className="max-w-[65%] truncate font-medium text-slate-800">
                          {item.owner?.name || item.ownerName || "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">Location</span>
                        <span className="flex max-w-[65%] items-center gap-1 truncate font-medium text-slate-800">
                          <MapPin size={13} />
                          {item.location || "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">Price</span>
                        <span className="font-semibold text-slate-900">
                          {item.price !== undefined && item.price !== null
                            ? `${item.price} ${item.priceUnit || ""}`
                            : "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">Submitted</span>
                        <span className="font-medium text-slate-700">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <button
                        onClick={() => openReview(item, "approved")}
                        disabled={isProcessing}
                        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}
                        Approve
                      </button>

                      <button
                        onClick={() => openReview(item, "rejected")}
                        disabled={isProcessing}
                        className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="mt-7 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row">
            <p className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || loading}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={17} />
                Previous
              </button>

              <button
                onClick={() =>
                  setPage((current) =>
                    Math.min(pagination.totalPages, current + 1)
                  )
                }
                disabled={page >= pagination.totalPages || loading}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Review Modal */}
      {selectedEquipment && reviewAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {reviewAction === "approved"
                    ? "Approve Equipment"
                    : "Reject Equipment"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedEquipment.title || selectedEquipment.name}
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedEquipment(null);
                  setReviewAction(null);
                  setReviewNote("");
                }}
                disabled={!!actionLoading}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div
                className={`mb-5 rounded-xl p-4 text-sm ${
                  reviewAction === "approved"
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                {reviewAction === "approved"
                  ? "You are about to approve this equipment. It can become available to customers according to your backend approval workflow."
                  : "You are about to reject this equipment. Please explain the reason so the owner understands what needs to be corrected."}
              </div>

              <label
                htmlFor="reviewNote"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Review Note{" "}
                {reviewAction === "rejected" && (
                  <span className="text-red-500">*</span>
                )}
                {reviewAction === "approved" && (
                  <span className="font-normal text-slate-400">
                    (Optional)
                  </span>
                )}
              </label>

              <textarea
                id="reviewNote"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={4}
                placeholder={
                  reviewAction === "approved"
                    ? "Write an optional note..."
                    : "Explain why this equipment is rejected..."
                }
                className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={() => {
                    setSelectedEquipment(null);
                    setReviewAction(null);
                    setReviewNote("");
                  }}
                  disabled={!!actionLoading}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={() =>
                    handleReview(selectedEquipment, reviewAction)
                  }
                  disabled={
                    !!actionLoading ||
                    (reviewAction === "rejected" && !reviewNote.trim())
                  }
                  className={`flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                    reviewAction === "approved"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {reviewAction === "approved" ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <XCircle size={16} />
                      )}
                      Confirm{" "}
                      {reviewAction === "approved" ? "Approval" : "Rejection"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminEquipmentPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminEquipmentContent />
    </ProtectedRoute>
  );
}
