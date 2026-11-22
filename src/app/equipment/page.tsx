
"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  MapPin,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  PackageSearch,
  LoaderCircle,
  RefreshCw,
  X,
  Wrench,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Equipment = {
  _id: string;
  title: string;
  description: string;
  categoryName?: string;
  location: string;
  rentalType: "hourly" | "daily" | "weekly" | "monthly";
  price: number;
  pricing?: {
    hourly?: number;
    daily?: number;
    weekly?: number;
    monthly?: number;
  };
  quantity: number;
  images: string[];
};

type Category = {
  _id: string;
  name: string;
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  pagination?: Pagination;
};

const initialPagination: Pagination = {
  total: 0,
  page: 1,
  limit: 9,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] =
    useState<Pagination>(initialPagination);

  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCategories = useCallback(async () => {
    if (!API_URL) return;

    try {
      const response = await fetch(
        `${API_URL}/api/categories`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error("Unable to load categories.");
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error("Category fetch error:", error);
    }
  }, []);

  const fetchEquipment = useCallback(
    async (page = 1) => {
      if (!API_URL) {
        setError("API URL is not configured.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          page: String(page),
          limit: "9",
          sort,
        });

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (location.trim()) {
          params.set("location", location.trim());
        }

        if (category) {
          params.set("category", category);
        }

        const response = await fetch(
          `${API_URL}/api/equipment?${params.toString()}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(
            `Equipment API returned ${response.status}`
          );
        }

        const result: ApiResponse<Equipment[]> =
          await response.json();

        if (!result.success || !Array.isArray(result.data)) {
          throw new Error(
            result.message || "Unable to load equipment."
          );
        }

        setEquipment(result.data);
        setPagination(result.pagination || initialPagination);
      } catch (error) {
        console.error("Equipment fetch error:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    },
    [search, location, category, sort]
  );

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    void fetchEquipment(1);
  }, [fetchEquipment]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void fetchEquipment(1);
  };

  const clearFilters = () => {
    setSearch("");
    setLocation("");
    setCategory("");
    setSort("newest");
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-BD").format(price);

  return (
    <main className="min-h-screen bg-[#F7F9FC]">
      {/* Page heading */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
          <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-emerald-600">
            <Wrench size={17} />
            EQUIPORA MARKETPLACE
          </div>

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-[#101D2C] sm:text-5xl">
                Find the right
                <span className="text-emerald-600"> equipment.</span>
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
                Discover reliable equipment for your next project.
                Compare options and rent with confidence.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-2xl font-black text-[#101D2C]">
                {pagination.total}
              </p>
              <p className="text-xs font-medium text-slate-500">
                Available equipment
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Search and filters */}
      <section className="mx-auto max-w-7xl px-5 pt-9 sm:px-8 lg:px-10">
        <form
          onSubmit={handleSearch}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-5 flex items-center gap-2">
            <SlidersHorizontal
              size={18}
              className="text-emerald-600"
            />
            <h2 className="font-bold text-[#101D2C]">
              Find your equipment
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label className="mb-2 block text-xs font-bold text-slate-600">
                Search equipment
              </label>

              <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-emerald-500">
                <Search size={18} className="text-slate-400" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by equipment name..."
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-600">
                Location
              </label>

              <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-emerald-500">
                <MapPin size={18} className="text-slate-400" />

                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Enter location"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-600">
                Category
              </label>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500"
              >
                <option value="">All categories</option>

                {categories.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-col justify-between gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <ArrowUpDown
                size={17}
                className="text-slate-400"
              />

              <span className="text-sm font-semibold text-slate-600">
                Sort by
              </span>

              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
              >
                <option value="newest">Recently added</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                <X size={16} />
                Clear
              </button>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                <Search size={17} />
                Search
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Equipment listing */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        <div className="mb-7 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#101D2C]">
              Available Equipment
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Explore equipment listed by rental owners.
            </p>
          </div>

          <span className="hidden rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 sm:inline-flex">
            {pagination.total} RESULTS
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-4">
            <LoaderCircle
              size={38}
              className="animate-spin text-emerald-600"
            />
            <p className="text-sm font-medium text-slate-500">
              Loading equipment...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-100 bg-white px-6 py-16 text-center">
            <PackageSearch
              size={42}
              className="mx-auto text-red-400"
            />
            <h3 className="mt-4 text-xl font-bold text-[#101D2C]">
              Unable to load equipment
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {error}
            </p>
            <button
              onClick={() => void fetchEquipment(1)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        ) : equipment.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-20 text-center">
            <PackageSearch
              size={48}
              className="mx-auto text-slate-300"
            />
            <h3 className="mt-5 text-xl font-bold text-[#101D2C]">
              No equipment found
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Try changing your search or filters.
            </p>
            <button
              onClick={clearFilters}
              className="mt-5 font-bold text-emerald-600"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {equipment.map((item) => (
                <article
                  key={item._id}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-60 overflow-hidden bg-slate-100">
                    {item.images?.[0] ? (
                      <Image
                        src={item.images[0]}
                        alt={item.title}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <PackageSearch
                          size={48}
                          className="text-slate-300"
                        />
                      </div>
                    )}

                    <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm">
                      {item.categoryName || "Equipment"}
                    </span>

                    <span className="absolute right-4 top-4 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">
                      Available
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h3 className="line-clamp-1 text-lg font-black text-[#101D2C]">
                        {item.title}
                      </h3>
                    </div>

                    <p className="line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
                      {item.description}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                      <MapPin size={15} />
                      <span className="line-clamp-1">
                        {item.location}
                      </span>
                    </div>

                    <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
                      <div>
                        <p className="text-xs text-slate-400">
                          Rental price
                        </p>
                        <p className="mt-1 text-xl font-black text-emerald-600">
                          ${formatPrice(item.price)}
                          <span className="ml-1 text-xs font-medium text-slate-500">
                            / {item.rentalType}
                          </span>
                        </p>
                      </div>

                      <Link
                        href={`/equipment/${item._id}`}
                        className="rounded-xl bg-[#101D2C] px-4 py-3 text-xs font-bold text-white transition hover:bg-emerald-600"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
                <button
                  disabled={!pagination.hasPrevPage}
                  onClick={() =>
                    void fetchEquipment(pagination.page - 1)
                  }
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={17} />
                  Previous
                </button>

                <span className="rounded-xl bg-[#101D2C] px-5 py-3 text-sm font-bold text-white">
                  {pagination.page} / {pagination.totalPages}
                </span>

                <button
                  disabled={!pagination.hasNextPage}
                  onClick={() =>
                    void fetchEquipment(pagination.page + 1)
                  }
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={17} />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
