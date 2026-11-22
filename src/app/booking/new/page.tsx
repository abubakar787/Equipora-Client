
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { authClient } from "@/lib/auth-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type RentalType = "hourly" | "daily" | "weekly" | "monthly";

interface Equipment {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  images?: string[];
  quantity: number;
  rentalType?: RentalType;
  price?: number;
  pricing?: Partial<Record<RentalType, number>>;
  availability?: {
    availableFrom?: string;
    availableUntil?: string;
  };
}

const rentalTypes: RentalType[] = [
  "hourly",
  "daily",
  "weekly",
  "monthly",
];

function getLocalDateTime() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function BookingPageContent() {
  const router = useRouter();

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [equipmentId, setEquipmentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [rentalType, setRentalType] = useState<RentalType>("daily");
  const [quantity, setQuantity] = useState(1);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("equipmentId");

    if (!id) {
      setError("Equipment ID was not found. Please select equipment first.");
      setLoading(false);
      return;
    }

    setEquipmentId(id);

    const loadEquipment = async () => {
      try {
        if (!API_URL) {
          throw new Error("API URL is not configured.");
        }

        const response = await fetch(
          `${API_URL}/api/equipment/${encodeURIComponent(id)}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(result.message || "Unable to load equipment.");
        }

        const item: Equipment =
          result.data?.equipment ?? result.data;

        if (!item?._id) {
          throw new Error("Equipment information is unavailable.");
        }

        setEquipment(item);

        const availableTypes = rentalTypes.filter(
          (type) =>
            typeof item.pricing?.[type] === "number" &&
            item.pricing[type]! > 0
        );

        if (availableTypes.length > 0) {
          setRentalType(
            item.rentalType && availableTypes.includes(item.rentalType)
              ? item.rentalType
              : availableTypes[0]
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading equipment."
        );
      } finally {
        setLoading(false);
      }
    };

    loadEquipment();
  }, []);

  const availableRentalTypes = rentalTypes.filter(
    (type) =>
      typeof equipment?.pricing?.[type] === "number" &&
      equipment.pricing[type]! > 0
  );

  const selectedUnitPrice = equipment?.pricing?.[rentalType];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!equipmentId || !equipment) {
      setError("Equipment information is missing.");
      return;
    }

    if (!startAt || !endAt) {
      setError("Please select both rental dates.");
      return;
    }

    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      endDate <= startDate
    ) {
      setError("End date must be later than start date.");
      return;
    }

    if (startDate <= new Date()) {
      setError("Please select a future start date and time.");
      return;
    }

    if (quantity < 1 || quantity > equipment.quantity) {
      setError(
        `Quantity must be between 1 and ${equipment.quantity}.`
      );
      return;
    }

    if (
      !availableRentalTypes.includes(rentalType) ||
      typeof selectedUnitPrice !== "number"
    ) {
      setError("The selected rental type is not available.");
      return;
    }

    if (contactName.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (contactPhone.trim().length < 7) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (deliveryAddress.trim().length < 5) {
      setError("Please enter your delivery address.");
      return;
    }

    setSubmitting(true);

    try {
      if (!API_URL) {
        throw new Error("API URL is not configured.");
      }

      const tokenResponse = await authClient.token();
      const token = tokenResponse.data?.token;

      const response = await fetch(`${API_URL}/api/bookings`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          equipmentId,
          startAt: startDate.toISOString(),
          endAt: endDate.toISOString(),
          rentalType,
          quantity,
          contactName: contactName.trim(),
          contactPhone: contactPhone.trim(),
          deliveryAddress: deliveryAddress.trim(),
          notes: notes.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Booking could not be created.");
      }

      router.push("/dashboard/bookings?booking=created");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-600">Loading equipment details...</p>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Unable to start booking
        </h1>
        <p className="mt-3 text-red-600">
          {error || "Equipment information could not be loaded."}
        </p>
        <button
          onClick={() => router.push("/equipment")}
          className="mt-6 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Browse Equipment
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            EQUIPORA Booking
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Book Equipment
          </h1>
          <p className="mt-2 text-gray-600">
            Submit your rental request. The equipment owner must approve it
            before you can proceed to payment.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <section className="h-fit overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {equipment.images?.[0] ? (
              <img
                src={equipment.images[0]}
                alt={equipment.title}
                className="h-56 w-full object-cover"
              />
            ) : (
              <div className="flex h-56 items-center justify-center bg-gray-100 text-gray-400">
                No equipment image
              </div>
            )}

            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900">
                {equipment.title}
              </h2>

              {equipment.location && (
                <p className="mt-2 text-sm text-gray-500">
                  {equipment.location}
                </p>
              )}

              {equipment.description && (
                <p className="mt-4 text-sm leading-6 text-gray-600">
                  {equipment.description}
                </p>
              )}

              <div className="mt-5 border-t border-gray-100 pt-5">
                <p className="text-sm text-gray-500">
                  Available quantity
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {equipment.quantity}
                </p>

                {typeof selectedUnitPrice === "number" && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      Rental rate
                    </p>
                    <p className="mt-1 text-2xl font-bold text-blue-700">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(selectedUnitPrice)}
                      <span className="ml-1 text-sm font-normal text-gray-500">
                        / {rentalType}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <p className="mt-5 rounded-lg bg-blue-50 p-3 text-sm leading-6 text-blue-800">
                The final rental amount will be calculated securely by
                EQUIPORA when your booking is submitted.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-6 text-xl font-bold text-gray-900">
              Booking Information
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="startAt"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Start Date & Time *
                  </label>
                  <input
                    id="startAt"
                    type="datetime-local"
                    required
                    min={getLocalDateTime()}
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="endAt"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    End Date & Time *
                  </label>
                  <input
                    id="endAt"
                    type="datetime-local"
                    required
                    min={startAt || getLocalDateTime()}
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="rentalType"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Rental Type *
                  </label>
                  <select
                    id="rentalType"
                    required
                    value={rentalType}
                    onChange={(e) =>
                      setRentalType(e.target.value as RentalType)
                    }
                    disabled={availableRentalTypes.length === 0}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  >
                    {availableRentalTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                  {availableRentalTypes.length === 0 && (
                    <p className="mt-1 text-xs text-red-600">
                      No rental pricing is configured for this equipment.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="quantity"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Quantity *
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    min={1}
                    max={equipment.quantity}
                    required
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="contactName"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Contact Name *
                </label>
                <input
                  id="contactName"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="contactPhone"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Contact Phone *
                </label>
                <input
                  id="contactPhone"
                  type="tel"
                  required
                  minLength={7}
                  maxLength={20}
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="deliveryAddress"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Delivery Address *
                </label>
                <textarea
                  id="deliveryAddress"
                  required
                  minLength={5}
                  maxLength={300}
                  rows={3}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter the complete delivery address"
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Additional Notes
                </label>
                <textarea
                  id="notes"
                  maxLength={1000}
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional instructions (optional)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  submitting ||
                  availableRentalTypes.length === 0
                }
                className="w-full rounded-lg bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Submitting Booking..." : "Submit Booking Request"}
              </button>

              <p className="text-center text-xs leading-5 text-gray-500">
                No payment is collected at this stage. You can pay after
                the equipment owner approves your booking.
              </p>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function NewBookingPage() {
  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <BookingPageContent />
    </ProtectedRoute>
  );
}
