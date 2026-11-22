
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/providers/protected-route";
import {
  ArrowLeft,
  MapPin,
  Package,
  ShieldCheck,
  Clock,
  CalendarDays,
  LoaderCircle,
  Wrench,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Equipment = {
  _id: string;
  title: string;
  description: string;
  categoryName?: string;
  categoryId?: string;
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
  availability?: unknown;
  ownerName?: string;
  ownerEmail?: string;
  ownerId?: string;
  owner?: {
    name?: string;
    email?: string;
    image?: string;
  };
  createdAt?: string;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  data: Equipment;
};

function EquipmentDetailsContent() {
  const params = useParams();
  const router = useRouter();

  const equipmentId = params.id as string;

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEquipmentDetails = useCallback(async () => {
    if (!API_URL || !equipmentId) {
      setError("Equipment information is unavailable.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/equipment/${equipmentId}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? "This equipment could not be found."
            : `Unable to load equipment. Error: ${response.status}`
        );
      }

      const result: ApiResponse = await response.json();

      if (!result.success || !result.data) {
        throw new Error(
          result.message || "Equipment information is unavailable."
        );
      }

      setEquipment(result.data);
    } catch (error) {
      console.error("Equipment details error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, [equipmentId]);

  useEffect(() => {
    void fetchEquipmentDetails();
  }, [fetchEquipmentDetails]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-BD").format(price);

  const rentalPeriod = equipment?.rentalType || "daily";

  const ownerName =
    equipment?.owner?.name ||
    equipment?.ownerName ||
    "Equipment Owner";

  const ownerEmail =
    equipment?.owner?.email ||
    equipment?.ownerEmail;

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
        <LoaderCircle className="h-10 w-10 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-slate-500">
          Loading equipment details...
        </p>
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
        <AlertCircle className="h-12 w-12 text-red-400" />

        <h2 className="mt-5 text-2xl font-black text-[#101D2C]">
          Equipment Not Available
        </h2>

        <p className="mt-3 max-w-md text-sm text-slate-500">
          {error || "We could not find the requested equipment."}
        </p>

        <button
          onClick={() => void fetchEquipmentDetails()}
          className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
        >
          <RefreshCw size={16} />
          Try Again
        </button>

        <Link
          href="/equipment"
          className="mt-4 text-sm font-bold text-slate-600 hover:text-emerald-600"
        >
          Back to Equipment
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F9FC]">
      {/* Breadcrumb */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8 lg:px-10">
          <Link
            href="/equipment"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-600"
          >
            <ArrowLeft size={17} />
            Back to Equipment
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-5">
          {/* Equipment image */}
          <div className="lg:col-span-3">
            <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-3xl bg-white shadow-sm sm:min-h-[480px]">
              {equipment.images?.[0] ? (
                <img
                  src={equipment.images[0]}
                  alt={equipment.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <Package className="h-20 w-20 text-slate-300" />
              )}

              <span className="absolute left-5 top-5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg">
                Available for Rent
              </span>
            </div>

            {/* Additional images */}
            {equipment.images?.length > 1 && (
              <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-4">
                {equipment.images.slice(1, 5).map((image, index) => (
                  <div
                    key={`${image}-${index}`}
                    className="relative h-24 overflow-hidden rounded-2xl bg-white"
                  >
                    <img
                      src={image}
                      alt={`${equipment.title} image ${index + 2}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Equipment information */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                  {equipment.categoryName || "Equipment"}
                </span>

                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                  {equipment.rentalType} rental
                </span>
              </div>

              <h1 className="text-3xl font-black leading-tight text-[#101D2C]">
                {equipment.title}
              </h1>

              <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                <MapPin size={18} className="text-emerald-600" />
                {equipment.location}
              </div>

              <div className="my-7 border-y border-slate-100 py-6">
                <p className="text-sm font-medium text-slate-400">
                  Rental Price
                </p>

                <div className="mt-2 flex items-end gap-2">
                  <span className="text-4xl font-black text-emerald-600">
                    ৳{formatPrice(equipment.price)}
                  </span>

                  <span className="pb-1 text-sm text-slate-500">
                    / {equipment.rentalType}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <Package className="mb-3 text-emerald-600" size={21} />
                  <p className="text-xs text-slate-400">
                    Available Quantity
                  </p>
                  <p className="mt-1 text-xl font-black text-[#101D2C]">
                    {equipment.quantity}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <Clock className="mb-3 text-emerald-600" size={21} />
                  <p className="text-xs text-slate-400">
                    Rental Period
                  </p>
                  <p className="mt-1 text-xl font-black capitalize text-[#101D2C]">
                    {rentalPeriod}
                  </p>
                </div>
              </div>

              <div className="mt-7 rounded-2xl border border-slate-100 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Wrench size={21} />
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Listed by
                    </p>
                    <p className="font-bold text-[#101D2C]">
                      {ownerName}
                    </p>
                  </div>
                </div>

                {ownerEmail && (
                  <p className="mt-3 break-all text-sm text-slate-500">
                    {ownerEmail}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/booking/new?equipmentId=${encodeURIComponent(equipment._id)}`
                  )
                }
                className="mt-7 flex w-full items-center justify-center gap-3 rounded-xl bg-emerald-600 px-6 py-4 font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
              >
                <CalendarDays size={19} />
                Book This Equipment
              </button>

              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
                <ShieldCheck size={16} className="text-emerald-600" />
                Secure rental experience with EQUIPORA
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black text-[#101D2C]">
            Equipment Description
          </h2>

          <p className="mt-5 whitespace-pre-line text-sm leading-8 text-slate-600">
            {equipment.description}
          </p>
        </div>
      </section>
    </main>
  );
}

export default function EquipmentDetailsPage() {
  return (
    <ProtectedRoute>
      <EquipmentDetailsContent />
    </ProtectedRoute>
  );
}
