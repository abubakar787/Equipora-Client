
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Trash2,
  ArrowRight,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import ProtectedRoute from "@/components/providers/protected-route";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Equipment {
  _id: string;
  title: string;
  description?: string;
  categoryName?: string;
  location?: string;
  price?: number;
  rentalType?: string;
  images?: string[];
}

interface Favorite {
  _id: string;
  equipmentId?: string;
  equipment?: Equipment | null;
  createdAt?: string;
}

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
}

function FavoritesContent() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [removingId, setRemovingId] = useState<string | null>(null);

  const getToken = async () => {
    const tokenResponse = await authClient.token();
    return tokenResponse.data?.token;
  };

  const loadFavorites = useCallback(async () => {
    try {
      setError("");

      const token = await getToken();

      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const response = await fetch(
        `${API_URL}/api/favorites?page=${page}&limit=12`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load favorites.");
      }

      const data = result.data;

      const items = Array.isArray(data)
        ? data
        : data?.favorites || data?.items || data?.results || [];

      setFavorites(items);

      const paginationData = result.pagination || data?.pagination || {};

      setPagination({
        page: paginationData.page || page,
        totalPages: paginationData.totalPages || 1,
        total: paginationData.total ?? items.length,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  const removeFavorite = async (equipmentId: string) => {
    try {
      setRemovingId(equipmentId);

      const token = await getToken();

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await fetch(
        `${API_URL}/api/favorites/${equipmentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not remove favorite.");
      }

      setFavorites((previous) =>
        previous.filter(
          (favorite) =>
            favorite.equipment?._id !== equipmentId &&
            favorite.equipmentId !== equipmentId
        )
      );

      setPagination((previous) => ({
        ...previous,
        total: Math.max(0, previous.total - 1),
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not remove favorite."
      );
    } finally {
      setRemovingId(null);
    }
  };

  const filteredFavorites = favorites.filter((favorite) => {
    const equipment = favorite.equipment;
    if (!equipment) return false;

    const query = search.toLowerCase();

    return (
      equipment.title?.toLowerCase().includes(query) ||
      equipment.categoryName?.toLowerCase().includes(query) ||
      equipment.location?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-7 p-4 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
              <Link href="/dashboard" className="hover:text-emerald-600">
                Dashboard
              </Link>
              <span>/</span>
              <span>My Favorites</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-rose-100 p-3 text-rose-600">
                <Heart size={25} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  My Favorites
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Equipment you have saved for later
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setLoading(true);
              void loadFavorites();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-emerald-500"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Saved Equipment</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {pagination.total}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Current Page</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {pagination.page} / {pagination.totalPages}
            </p>
          </div>
        </div>

        <div className="relative">
          <Search
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search your favorite equipment..."
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="text-center">
              <RefreshCw
                size={34}
                className="mx-auto animate-spin text-emerald-600"
              />
              <p className="mt-3 text-sm text-gray-500">
                Loading your favorites...
              </p>
            </div>
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white px-6 py-16 text-center">
            <Heart size={45} className="mx-auto text-gray-300" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              {search ? "No matching equipment" : "No Favorites Yet"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              {search
                ? "Try another search term."
                : "You have not saved any equipment yet. Explore the marketplace and save equipment you like."}
            </p>
            {!search && (
              <Link
                href="/equipment"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Explore Equipment <ArrowRight size={17} />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredFavorites.map((favorite) => {
              const equipment = favorite.equipment;

              if (!equipment) return null;

              const equipmentId = equipment._id || favorite.equipmentId || "";
              const imageUrl = equipment.images?.[0];

              return (
                <div
                  key={favorite._id || equipmentId}
                  className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative h-52 bg-slate-100">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={equipment.title}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        <Package size={42} />
                      </div>
                    )}

                    <button
                      onClick={() => void removeFavorite(equipmentId)}
                      disabled={removingId === equipmentId}
                      aria-label="Remove favorite"
                      className="absolute right-3 top-3 rounded-full bg-white p-2.5 text-rose-600 shadow transition hover:bg-rose-50 disabled:opacity-50"
                    >
                      {removingId === equipmentId ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>

                  <div className="p-5">
                    {equipment.categoryName && (
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                        {equipment.categoryName}
                      </p>
                    )}

                    <h3 className="mt-2 line-clamp-1 text-lg font-bold text-gray-900">
                      {equipment.title}
                    </h3>

                    {equipment.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
                        {equipment.description}
                      </p>
                    )}

                    {equipment.location && (
                      <p className="mt-3 flex items-center gap-1.5 text-sm text-gray-500">
                        <MapPin size={15} />
                        {equipment.location}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t pt-4">
                      <div>
                        <p className="text-xs text-gray-500">
                          {equipment.rentalType || "Rental"} price
                        </p>
                        <p className="mt-1 font-bold text-gray-900">
                          {typeof equipment.price === "number"
                            ? `৳${equipment.price.toLocaleString()}`
                            : "Contact for price"}
                        </p>
                      </div>

                      <Link
                        href={`/equipment/${equipmentId}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        View <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={17} /> Previous
            </button>

            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              onClick={() =>
                setPage((current) =>
                  Math.min(pagination.totalPages, current + 1)
                )
              }
              disabled={page >= pagination.totalPages}
              className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next <ChevronRight size={17} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FavoritesPage() {
  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <FavoritesContent />
    </ProtectedRoute>
  );
}
