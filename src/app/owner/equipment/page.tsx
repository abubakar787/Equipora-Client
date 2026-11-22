
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Package,
  RefreshCw,
  Trash2,
  Eye,
  MapPin,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import ProtectedRoute from "@/components/providers/protected-route";
import { authClient } from "@/lib/auth-client";
import { apiRequest } from "@/lib/api";

type Equipment = {
  _id: string;
  title: string;
  description?: string;
  categoryName?: string;
  categoryId?: string;
  location?: string;
  rentalType?: string;
  price?: number;
  pricing?: {
    hourly?: number;
    daily?: number;
    weekly?: number;
    monthly?: number;
  };
  quantity?: number;
  images?: string[];
  status?: "pending" | "approved" | "rejected";
  isAvailable?: boolean;
  createdAt?: string;
};

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  equipment?: T;
};

type EquipmentResult = {
  equipment?: Equipment[];
  items?: Equipment[];
  results?: Equipment[];
};

function extractEquipment(
  response: ApiResponse<EquipmentResult> | EquipmentResult | Equipment[]
): Equipment[] {
  if (Array.isArray(response)) return response;

  if ("equipment" in response && Array.isArray(response.equipment)) {
    return response.equipment;
  }

  if ("items" in response && Array.isArray(response.items)) {
    return response.items;
  }

  if ("results" in response && Array.isArray(response.results)) {
    return response.results;
  }

  if ("data" in response && response.data) {
    const data = response.data;

    if (Array.isArray(data)) return data;
    if (data.equipment) return data.equipment;
    if (data.items) return data.items;
    if (data.results) return data.results;
  }

  return [];
}

function getStatusStyle(status?: string) {
  switch (status?.toLowerCase()) {
    case "approved":
      return "bg-emerald-50 text-emerald-700";

    case "rejected":
      return "bg-red-50 text-red-700";

    case "pending":
    default:
      return "bg-amber-50 text-amber-700";
  }
}

function OwnerEquipmentContent() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const getToken = async () => {
    const tokenResponse = await authClient.token();
    const token = tokenResponse.data?.token;

    if (!token) {
      throw new Error("Authentication token not found. Please log in again.");
    }

    return token;
  };

  const loadEquipment = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      const response = await apiRequest<
        ApiResponse<EquipmentResult> | EquipmentResult | Equipment[]
      >("/api/equipment/my-equipment", {
        method: "GET",
        token,
      });

      setEquipment(extractEquipment(response));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load equipment.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  const handleDelete = async (id: string, title: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${title}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      const token = await getToken();

      const response = await apiRequest<ApiResponse<unknown>>(
        `/api/equipment/${id}`,
        {
          method: "DELETE",
          token,
        }
      );

      setEquipment((previous) =>
        previous.filter((item) => item._id !== id)
      );

      toast.success(response.message || "Equipment deleted successfully.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete equipment."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/owner/dashboard"
              className="mb-4 inline-flex items-center text-sm font-medium text-slate-500 transition hover:text-emerald-600"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="text-3xl font-bold tracking-tight text-[#101D2C]">
              My Equipment
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage your equipment listings and monitor their approval status.
            </p>
          </div>

          <Link
            href="/owner/equipment/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
          >
            <Plus size={19} />
            Add Equipment
          </Link>
        </div>

        {/* Equipment Summary */}
        <div className="mb-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Equipment
            </p>
            <p className="mt-2 text-3xl font-bold text-[#101D2C]">
              {equipment.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Approved
            </p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {equipment.filter((item) => item.status === "approved").length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Pending Review
            </p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {equipment.filter((item) => item.status === "pending").length}
            </p>
          </div>
        </div>

        {/* Equipment List */}
        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-7">
            <div>
              <h2 className="text-lg font-bold text-[#101D2C]">
                Your Listings
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Equipment submitted from your account
              </p>
            </div>

            <button
              type="button"
              onClick={loadEquipment}
              disabled={loading}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              aria-label="Refresh equipment"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <LoaderCircle className="h-9 w-9 animate-spin text-emerald-600" />
              <p className="mt-3 text-sm text-slate-500">
                Loading your equipment...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="mt-3 font-semibold text-slate-700">
                Unable to load equipment
              </p>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                {error}
              </p>
              <button
                type="button"
                onClick={loadEquipment}
                className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Try Again
              </button>
            </div>
          ) : equipment.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Package size={30} />
              </div>

              <h3 className="mt-5 text-lg font-bold text-[#101D2C]">
                No Equipment Listed Yet
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                You have not added any equipment yet. Start listing your
                equipment to receive rental requests.
              </p>

              <Link
                href="/owner/equipment/new"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
              >
                <Plus size={18} />
                Add Your First Equipment
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {equipment.map((item) => (
                <article
                  key={item._id}
                  className="flex flex-col gap-5 p-5 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:px-7"
                >
                  {/* Equipment Image */}
                  <div className="h-36 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-28 sm:w-36">
                    {item.images?.[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        <Package size={35} />
                      </div>
                    )}
                  </div>

                  {/* Equipment Information */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-[#101D2C]">
                        {item.title}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(item.status)}`}
                      >
                        {item.status || "pending"}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {item.categoryName || "Equipment"}
                    </p>

                    {item.location && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin size={14} />
                        {item.location}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                      <span>
                        Quantity: <strong>{item.quantity ?? 1}</strong>
                      </span>

                      <span>
                        Rental:{" "}
                        <strong className="capitalize">
                          {item.rentalType || "daily"}
                        </strong>
                      </span>

                      <span className="font-bold text-emerald-700">
                        ${Number(item.price || 0).toLocaleString("en-BD")}
                        /{item.rentalType || "daily"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-stretch">
                    <Link
                      href={`/equipment/${item._id}`}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 sm:flex-none"
                    >
                      <Eye size={15} />
                      View
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDelete(item._id, item.title)}
                      disabled={deletingId === item._id}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-100 px-3 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                    >
                      {deletingId === item._id ? (
                        <LoaderCircle size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function OwnerEquipmentPage() {
  return (
    <ProtectedRoute allowedRoles={["owner", "admin"]}>
      <OwnerEquipmentContent />
    </ProtectedRoute>
  );
}
