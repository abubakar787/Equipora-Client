
"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";

import ProtectedRoute from "@/components/providers/protected-route";
import { authClient } from "@/lib/auth-client";

type RentalType = "hourly" | "daily" | "weekly" | "monthly";

type Category = {
  _id: string;
  name: string;
};

type Equipment = {
  _id: string;
  title: string;
  description: string;
  categoryId: string | { _id: string };
  categoryName?: string;
  location: string;
  rentalType: RentalType;
  price: number;
  pricing: {
    hourly?: number;
    daily?: number;
    weekly?: number;
    monthly?: number;
  };
  quantity: number;
  images: string[];
  availability: {
    availableFrom: string;
    availableUntil: string;
  };
  status: string;
};

type EquipmentForm = {
  title: string;
  description: string;
  categoryId: string;
  location: string;
  rentalType: RentalType;
  hourly: string;
  daily: string;
  weekly: string;
  monthly: string;
  quantity: string;
  images: string[];
  availableFrom: string;
  availableUntil: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const initialForm: EquipmentForm = {
  title: "",
  description: "",
  categoryId: "",
  location: "",
  rentalType: "daily",
  hourly: "",
  daily: "",
  weekly: "",
  monthly: "",
  quantity: "1",
  images: [""],
  availableFrom: "",
  availableUntil: "",
};

function toDateInput(value?: string | Date): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

async function getToken(): Promise<string> {
  const result = await authClient.token();

  if (!result?.data?.token) {
    throw new Error("Authentication token not found. Please login again.");
  }

  return result.data.token;
}

async function apiFetch<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  if (!API_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured in your environment."
    );
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    cache: "no-store",
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result?.message || "Something went wrong. Please try again."
    );
  }

  return result as T;
}

function EditEquipmentContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const equipmentId = params.id;

  const [form, setForm] = useState<EquipmentForm>(initialForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    try {
      setError("");

      const token = await getToken();

      const [equipmentResponse, categoryResponse] = await Promise.all([
        apiFetch<{ success: boolean; data: Equipment }>(
          `/api/equipment/my-equipment/${equipmentId}`,
          token
        ),
        apiFetch<{ success: boolean; data: Category[] }>(
          "/api/categories",
          token
        ),
      ]);

      if (!equipmentResponse.success || !equipmentResponse.data) {
        throw new Error("Equipment details could not be loaded.");
      }

      const equipment = equipmentResponse.data;

      const categoryId =
        typeof equipment.categoryId === "string"
          ? equipment.categoryId
          : equipment.categoryId?._id || "";

      setCategories(categoryResponse.data || []);

      setForm({
        title: equipment.title || "",
        description: equipment.description || "",
        categoryId,
        location: equipment.location || "",
        rentalType: equipment.rentalType || "daily",
        hourly: equipment.pricing?.hourly?.toString() || "",
        daily: equipment.pricing?.daily?.toString() || "",
        weekly: equipment.pricing?.weekly?.toString() || "",
        monthly: equipment.pricing?.monthly?.toString() || "",
        quantity: equipment.quantity?.toString() || "1",
        images:
          equipment.images?.length > 0 ? equipment.images : [""],
        availableFrom: toDateInput(
          equipment.availability?.availableFrom
        ),
        availableUntil: toDateInput(
          equipment.availability?.availableUntil
        ),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load equipment."
      );
    } finally {
      setLoading(false);
    }
  }, [equipmentId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const updateField = (
    field: keyof EquipmentForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateImage = (index: number, value: string) => {
    setForm((previous) => ({
      ...previous,
      images: previous.images.map((image, i) =>
        i === index ? value : image
      ),
    }));
  };

  const addImage = () => {
    if (form.images.length >= 5) return;

    setForm((previous) => ({
      ...previous,
      images: [...previous.images, ""],
    }));
  };

  const removeImage = (index: number) => {
    setForm((previous) => ({
      ...previous,
      images:
        previous.images.length === 1
          ? [""]
          : previous.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      form.title.trim().length < 5 ||
      form.title.trim().length > 100
    ) {
      setError("Title must be between 5 and 100 characters.");
      return;
    }

    if (
      form.description.trim().length < 20 ||
      form.description.trim().length > 2000
    ) {
      setError("Description must be between 20 and 2000 characters.");
      return;
    }

    if (!form.categoryId) {
      setError("Please select an equipment category.");
      return;
    }

    if (form.location.trim().length < 3) {
      setError("Please enter a valid location.");
      return;
    }

    const quantity = Number(form.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    const pricing: Record<string, number> = {};

    const pricingFields = [
      "hourly",
      "daily",
      "weekly",
      "monthly",
    ] as const;

    for (const field of pricingFields) {
      const value = form[field].trim();

      if (value !== "") {
        const amount = Number(value);

        if (!Number.isFinite(amount) || amount <= 0) {
          setError(`${field} price must be greater than zero.`);
          return;
        }

        pricing[field] = amount;
      }
    }

    if (Object.keys(pricing).length === 0) {
      setError("Please provide at least one rental price.");
      return;
    }

    const selectedPrice = pricing[form.rentalType];

    if (!selectedPrice) {
      setError(
        `Please provide a ${form.rentalType} price for the selected rental type.`
      );
      return;
    }

    const images = form.images
      .map((image) => image.trim())
      .filter(Boolean);

    if (images.length === 0) {
      setError("Please provide at least one equipment image URL.");
      return;
    }

    if (images.length > 5) {
      setError("You can add a maximum of 5 images.");
      return;
    }

    const invalidImage = images.some((image) => {
      try {
        const url = new URL(image);
        return !["http:", "https:"].includes(url.protocol);
      } catch {
        return true;
      }
    });

    if (invalidImage) {
      setError("Please provide valid HTTP or HTTPS image URLs.");
      return;
    }

    if (!form.availableFrom || !form.availableUntil) {
      setError("Please select both availability dates.");
      return;
    }

    if (form.availableFrom > form.availableUntil) {
      setError("Available until date must be after available from date.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      categoryId: form.categoryId,
      location: form.location.trim(),
      rentalType: form.rentalType,
      price: selectedPrice,
      pricing,
      quantity,
      images,
      availability: {
        availableFrom: form.availableFrom,
        availableUntil: form.availableUntil,
      },
    };

    try {
      setSaving(true);

      const token = await getToken();

      const response = await apiFetch<{
        success: boolean;
        message?: string;
      }>(`/api/equipment/${equipmentId}`, token, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (!response.success) {
        throw new Error(response.message || "Equipment update failed.");
      }

      setSuccess(
        "Equipment updated successfully and submitted for admin approval."
      );

      setTimeout(() => {
        router.push("/owner/equipment");
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update equipment."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-gray-500">
            Loading equipment details...
          </p>
        </div>
      </div>
    );
  }

  if (error && !form.title) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-2 font-semibold text-red-700">
            <AlertCircle className="h-5 w-5" />
            Unable to load equipment
          </div>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void loadData();
            }}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
          >
            Try again
          </button>
          <Link
            href="/owner/equipment"
            className="ml-3 text-sm font-medium text-gray-700 underline"
          >
            Back to My Equipment
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/owner/equipment"
            className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Equipment
          </Link>

          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Edit Equipment
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Update your equipment information and rental details.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            Basic Information
          </h2>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Equipment Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                maxLength={100}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Enter equipment title"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Description *
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  updateField("description", e.target.value)
                }
                rows={5}
                maxLength={2000}
                required
                className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Describe your equipment..."
              />
              <p className="mt-1 text-right text-xs text-gray-400">
                {form.description.length}/2000
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Category *
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    updateField("categoryId", e.target.value)
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-primary"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Location *
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) =>
                    updateField("location", e.target.value)
                  }
                  required
                  maxLength={150}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
                  placeholder="Equipment location"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Rental Pricing */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            Rental Pricing
          </h2>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Default Rental Type *
            </label>
            <select
              value={form.rentalType}
              onChange={(e) =>
                updateField("rentalType", e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-primary sm:max-w-xs"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {(
              [
                ["hourly", "Hourly Price"],
                ["daily", "Daily Price"],
                ["weekly", "Weekly Price"],
                ["monthly", "Monthly Price"],
              ] as const
            ).map(([field, label]) => (
              <div key={field}>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {label}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form[field]}
                  onChange={(e) => updateField(field, e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
                  placeholder="Enter amount"
                />
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Enter at least one price. The selected rental type must have a
            corresponding price.
          </p>
        </section>

        {/* Quantity and Availability */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            Quantity & Availability
          </h2>

          <div className="mb-5 sm:max-w-xs">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Available Quantity *
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={form.quantity}
              onChange={(e) => updateField("quantity", e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Available From *
              </label>
              <input
                type="date"
                value={form.availableFrom}
                onChange={(e) =>
                  updateField("availableFrom", e.target.value)
                }
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Available Until *
              </label>
              <input
                type="date"
                value={form.availableUntil}
                min={form.availableFrom || undefined}
                onChange={(e) =>
                  updateField("availableUntil", e.target.value)
                }
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              />
            </div>
          </div>
        </section>

        {/* Equipment Images */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Equipment Images
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Add image URLs. You can add up to 5 images.
              </p>
            </div>

            <ImageIcon className="h-6 w-6 text-gray-400" />
          </div>

          <div className="space-y-4">
            {form.images.map((image, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="url"
                  value={image}
                  onChange={(e) =>
                    updateImage(index, e.target.value)
                  }
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
                  placeholder="https://example.com/image.jpg"
                />

                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  disabled={form.images.length === 1}
                  className="rounded-lg border border-gray-200 p-3 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Remove image"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>

          {form.images.length < 5 && (
            <button
              type="button"
              onClick={addImage}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary"
            >
              <Plus className="h-4 w-4" />
              Add another image
            </button>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {form.images
              .filter((image) => image.trim())
              .map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  className="overflow-hidden rounded-lg border border-gray-200"
                >
                  <img
                    src={image}
                    alt={`Equipment preview ${index + 1}`}
                    className="h-32 w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              ))}
          </div>
        </section>

        {/* Submission */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
          <Link
            href="/owner/equipment"
            className="rounded-lg border border-gray-300 px-6 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function EditEquipmentPage() {
  return (
    <ProtectedRoute allowedRoles={["owner", "admin"]}>
      <EditEquipmentContent />
    </ProtectedRoute>
  );
}
