
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  MapPin,
  Package,
  RefreshCw,
  Trash2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import ProtectedRoute from "@/components/providers/protected-route";
import { useAuth } from "@/components/providers/auth-provider";
import { authClient } from "@/lib/auth-client";
import { apiRequest } from "@/lib/api";

interface Equipment {
  _id: string;
  title: string;
  description: string;
  categoryName?: string;
  location?: string;
  price: number;
  rentalType?: string;
  images?: string[];
  status?: string;
  isAvailable?: boolean;
}

interface Favorite {
  _id: string;
  createdAt: string;
  equipment: Equipment;
}

interface FavoriteResult {
  data: Favorite[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

function formatMoney(amount?: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function MyFavoritesContent() {
  const session = useAuth();

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFavorites, setTotalFavorites] = useState(0);

  const getToken = async () => {
    const { data, error } = await authClient.token();

    if (error || !data?.token) {
      throw new Error(
        error?.message || "Authentication token not found. Please sign in again."
      );
    }

    return data.token;
  };

  const loadFavorites = useCallback(async () => {
    setError("");

    try {
      const token = await getToken();

      const params = new URLSearchParams({
        page: String(page),
        limit: "12",
      });

      const response = await apiRequest<
        ApiResponse<FavoriteResult> | FavoriteResult
      >(`/api/favorites?${params.toString()}`, {
        method: "GET",
        token,
      });

      const result =
        "data" in response && response.data
          ? response.data
          : response;

      setFavorites(Array.isArray(result.data) ? result.data : []);
      setTotalFavorites(result.pagination?.total ?? 0);
      setTotalPages(Math.max(1, result.pagination?.totalPages ?? 1));
    } catch (err) {
      console.error("Favorites loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your favorites."
      );
      setFavorites([]);
      setTotalFavorites(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (session.isPending || !session.data?.user) return;

    void loadFavorites();
  }, [session.isPending, session.data?.user?.id, loadFavorites]);

  const handleRefresh = () => {
    setLoading(true);
    void loadFavorites();
  };

  const handleRemove = async (equipmentId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this equipment from your favorites?"
    );

    if (!confirmed) return;

    try {
      setRemovingId(equipmentId);

      const token = await getToken();

      await apiRequest(`/api/favorites/${equipmentId}`, {
        method: "DELETE",
        token,
      });

      toast.success("Removed from your favorites.");

      setFavorites((current) =>
        current.filter(
          (favorite) => favorite.equipment?._id !== equipmentId
        )
      );

      setTotalFavorites((current) => Math.max(0, current - 1));

      if (favorites.length === 1 && page > 1) {
        setLoading(true);
        setPage((current) => current - 1);
      } else {
        await loadFavorites();
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Unable to remove favorite."
      );
    } finally {
      setRemovingId(null);
    }
  };

  const filteredFavorites = favorites.filter((favorite) => {
    const equipment = favorite.equipment;

    const query = search.trim().toLowerCase();

    return (
      equipment?.title?.toLowerCase().includes(query) ||
      equipment?.categoryName?.toLowerCase().includes(query) ||
      equipment?.location?.toLowerCase().includes(query)
    );
  });

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
              My Favorites
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Your saved equipment, all in one place.
            </p>
          </div>

          <Link
            href="/equipment"
            className="hidden rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 sm:inline-flex"
          >
            Explore Equipment
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
              <Heart className="h-5 w-5 fill-current" />
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400">
                Saved Equipment
              </p>
              <p className="text-2xl font-extrabold text-slate-800">
                {loading ? "..." : totalFavorites}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-800">
                Your Saved Equipment
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Browse and manage your favorite equipment.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          <div className="relative mt-5 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by equipment, category or location..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </section>

        {error && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-red-700">{error}</p>
            <button
              type="button"
              onClick={handleRefresh}
              className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-24 text-sm font-medium text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
            Loading your favorites...
          </div>
        ) : filteredFavorites.length === 0 && !error ? (
          <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-400">
              <Heart className="h-8 w-8" />
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-800">
              {search ? "No matching equipment" : "No favorites yet"}
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              {search
                ? "Try another search term."
                : "Save equipment you like and find it here whenever you need it."}
            </p>

            {!search && (
              <Link
                href="/equipment"
                className="mt-6 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
              >
                Explore Equipment
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFavorites.map((favorite) => {
              const equipment = favorite.equipment;

              if (!equipment) return null;

              return (
                <article
                  key={favorite._id}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative h-52 overflow-hidden bg-slate-100">
                    {equipment.images?.[0] ? (
                      <img
                        src={equipment.images[0]}
                        alt={equipment.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        <Package className="h-12 w-12" />
                      </div>
                    )}

                    <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm">
                      {equipment.categoryName || "Equipment"}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemove(equipment._id)}
                      disabled={removingId === equipment._id}
                      title="Remove from favorites"
                      className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-rose-500 shadow-md transition hover:bg-rose-50 disabled:opacity-50"
                    >
                      {removingId === equipment._id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <div className="p-5">
                    <h3 className="truncate text-lg font-bold text-slate-800">
                      {equipment.title}
                    </h3>

                    <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
                      {equipment.description}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      <span className="truncate">
                        {equipment.location || "Location not specified"}
                      </span>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <div>
                        <p className="text-xs text-slate-400">
                          Rental Price
                        </p>
                        <p className="mt-1 text-lg font-extrabold text-emerald-700">
                          {formatMoney(equipment.price)}
                        </p>
                        <p className="text-xs text-slate-400">
                          / {equipment.rentalType || "rental"}
                        </p>
                      </div>

                      <Link
                        href={`/equipment/${equipment._id}`}
                        className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                      >
                        View Details
                      </Link>
                    </div>

                    <p className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Saved {new Date(favorite.createdAt).toLocaleDateString("en-BD")}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Page {page} of {totalPages} · {totalFavorites} favorites
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  setLoading(true);
                  setPage((current) => current - 1);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => {
                  setLoading(true);
                  setPage((current) => current + 1);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40"
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

export default function CustomerFavoritesPage() {
  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <MyFavoritesContent />
    </ProtectedRoute>
  );
}
