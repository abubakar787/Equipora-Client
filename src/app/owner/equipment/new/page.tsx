
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ImagePlus,
  Loader2,
  Package,
} from "lucide-react";
import { toast } from "sonner";

import ProtectedRoute from "@/components/providers/protected-route";
import { authClient } from "@/lib/auth-client";
import { apiRequest } from "@/lib/api";

type Category = {
  _id: string;
  name: string;
};

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  categories?: T;
};

type RentalType = "hourly" | "daily" | "weekly" | "monthly";

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

const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

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
  availableFrom: getToday(),
  availableUntil: "",
};

function AddEquipmentContent() {
  const router = useRouter();

  const [form, setForm] = useState<EquipmentForm>(initialForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load available equipment categories from backend.
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await apiRequest<ApiResponse<Category[]> | Category[]>(
          "/api/categories"
        );

        let categoryList: Category[] = [];

        if (Array.isArray(response)) {
          categoryList = response;
        } else if (Array.isArray(response.data)) {
          categoryList = response.data;
        } else if (Array.isArray(response.categories)) {
          categoryList = response.categories;
        }

        setCategories(categoryList);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load categories"
        );
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

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
      images: previous.images.map((image, imageIndex) =>
        imageIndex === index ? value : image
      ),
    }));
  };

  const addImageField = () => {
    if (form.images.length >= 5) {
      toast.error("Maximum 5 images are allowed");
      return;
    }

    setForm((previous) => ({
      ...previous,
      images: [...previous.images, ""],
    }));
  };

  const removeImageField = (index: number) => {
    if (form.images.length === 1) {
      toast.error("At least one image URL is required");
      return;
    }

    setForm((previous) => ({
      ...previous,
      images: previous.images.filter(
        (_, imageIndex) => imageIndex !== index
      ),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const imageUrls = form.images
      .map((image) => image.trim())
      .filter(Boolean);

    const pricing = {
      ...(form.hourly && { hourly: Number(form.hourly) }),
      ...(form.daily && { daily: Number(form.daily) }),
      ...(form.weekly && { weekly: Number(form.weekly) }),
      ...(form.monthly && { monthly: Number(form.monthly) }),
    };

    if (!form.categoryId) {
      toast.error("Please select an equipment category");
      return;
    }

    if (Object.keys(pricing).length === 0) {
      toast.error("Please enter at least one rental price");
      return;
    }

    const selectedPrice = pricing[form.rentalType];

    if (!selectedPrice || selectedPrice <= 0) {
      toast.error(
        `Please enter a valid ${form.rentalType} rental price`
      );
      return;
    }

    if (imageUrls.length === 0) {
      toast.error("Please provide at least one image URL");
      return;
    }

    if (imageUrls.length > 5) {
      toast.error("Maximum 5 images are allowed");
      return;
    }

    if (!form.availableFrom || !form.availableUntil) {
      toast.error("Please select the availability dates");
      return;
    }

    if (form.availableUntil < form.availableFrom) {
      toast.error("Available until date must be after available from date");
      return;
    }

    if (Number(form.quantity) < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    const invalidImage = imageUrls.some((url) => {
      try {
        const parsed = new URL(url);
        return !["http:", "https:"].includes(parsed.protocol);
      } catch {
        return true;
      }
    });

    if (invalidImage) {
      toast.error("Please provide valid image URLs");
      return;
    }

    setSubmitting(true);

    try {
      // Better Auth returns the token inside response.data.
      const tokenResponse = await authClient.token();
      const token = tokenResponse.data?.token;

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // This payload follows the backend createEquipmentSchema.
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        categoryId: form.categoryId,
        location: form.location.trim(),
        rentalType: form.rentalType,
        price: selectedPrice,
        pricing,
        quantity: Number(form.quantity),
        images: imageUrls,
        availability: {
          availableFrom: form.availableFrom,
          availableUntil: form.availableUntil,
        },
      };

      const response = await apiRequest<ApiResponse<unknown>>(
        "/api/equipment",
        {
          method: "POST",
          token,
          body: JSON.stringify(payload),
        }
      );

      toast.success(
        response.message || "Equipment submitted successfully for approval"
      );

      router.push("/owner/equipment");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit equipment"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#16A36A] focus:ring-2 focus:ring-[#16A36A]/10";

  const labelClass = "text-sm font-semibold text-slate-700";

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Page header */}
        <Link
          href="/owner/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#16A36A]"
        >
          <ArrowLeft size={17} />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#16A36A]/10 text-[#16A36A]">
            <Package size={25} />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#101D2C]">
            Add New Equipment
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            List your equipment on EQUIPORA and start receiving rental
            requests from customers.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic information */}
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-lg font-bold text-[#101D2C]">
              Basic Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Provide the essential details of your equipment.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label className={labelClass}>
                  Equipment Title *
                </label>
                <input
                  required
                  minLength={5}
                  maxLength={100}
                  value={form.title}
                  onChange={(event) =>
                    updateField("title", event.target.value)
                  }
                  placeholder="e.g. Professional Heavy Duty Excavator"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Description *
                </label>
                <textarea
                  required
                  minLength={20}
                  maxLength={2000}
                  rows={5}
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  placeholder="Describe your equipment, condition, features and rental details..."
                  className={inputClass}
                />
                <p className="mt-1 text-right text-xs text-slate-400">
                  {form.description.length}/2000 characters
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Category *
                  </label>

                  <select
                    required
                    value={form.categoryId}
                    onChange={(event) =>
                      updateField("categoryId", event.target.value)
                    }
                    disabled={loadingCategories}
                    className={inputClass}
                  >
                    <option value="">
                      {loadingCategories
                        ? "Loading categories..."
                        : "Select a category"}
                    </option>

                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>

                  {!loadingCategories && categories.length === 0 && (
                    <p className="mt-2 text-xs text-red-500">
                      No categories found. Please ask the admin to add
                      equipment categories.
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>
                    Location *
                  </label>
                  <input
                    required
                    minLength={3}
                    maxLength={150}
                    value={form.location}
                    onChange={(event) =>
                      updateField("location", event.target.value)
                    }
                    placeholder="e.g. Dhaka, Bangladesh"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Available Quantity *
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={form.quantity}
                  onChange={(event) =>
                    updateField("quantity", event.target.value)
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Rental pricing */}
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-lg font-bold text-[#101D2C]">
              Rental Pricing
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Set one or more rental rates. Select which rate will be
              displayed as the primary price.
            </p>

            <div className="mt-6">
              <label className={labelClass}>
                Primary Rental Type *
              </label>

              <select
                value={form.rentalType}
                onChange={(event) =>
                  updateField("rentalType", event.target.value)
                }
                className={inputClass}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {(
                [
                  ["hourly", "Hourly Rate"],
                  ["daily", "Daily Rate"],
                  ["weekly", "Weekly Rate"],
                  ["monthly", "Monthly Rate"],
                ] as const
              ).map(([field, label]) => (
                <div key={field}>
                  <label className={labelClass}>{label}</label>
                  <div className="relative mt-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form[field]}
                      onChange={(event) =>
                        updateField(field, event.target.value)
                      }
                      placeholder="Enter amount"
                      className={`${inputClass} mt-0 pl-9`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl bg-[#16A36A]/5 p-4 text-sm text-slate-600">
              <strong className="text-[#16A36A]">
                Primary price:
              </strong>{" "}
              The selected rental type must have a valid price.
            </div>
          </section>

          {/* Availability */}
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-lg font-bold text-[#101D2C]">
              Availability
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select the dates when customers can rent this equipment.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Available From *
                </label>
                <input
                  required
                  type="date"
                  min={getToday()}
                  value={form.availableFrom}
                  onChange={(event) =>
                    updateField("availableFrom", event.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Available Until *
                </label>
                <input
                  required
                  type="date"
                  min={form.availableFrom || getToday()}
                  value={form.availableUntil}
                  onChange={(event) =>
                    updateField("availableUntil", event.target.value)
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Equipment images */}
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16A36A]/10 text-[#16A36A]">
                <ImagePlus size={21} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#101D2C]">
                  Equipment Images
                </h2>
                <p className="text-sm text-slate-500">
                  Add 1–5 publicly accessible image URLs.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {form.images.map((image, index) => (
                <div key={index}>
                  <label className={labelClass}>
                    Image URL {index + 1} *
                  </label>

                  <div className="mt-2 flex gap-2">
                    <input
                      type="url"
                      required={index === 0}
                      value={image}
                      onChange={(event) =>
                        updateImage(index, event.target.value)
                      }
                      placeholder="https://example.com/equipment-image.jpg"
                      className={`${inputClass} mt-0`}
                    />

                    {form.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeImageField(index)}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50"
                        aria-label="Remove image"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  {image.trim() && (
                    <div className="mt-3">
                      <img
                        src={image}
                        alt={`Equipment preview ${index + 1}`}
                        className="h-36 w-48 rounded-xl border border-slate-200 object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {form.images.length < 5 && (
              <button
                type="button"
                onClick={addImageField}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-dashed border-[#16A36A]/40 px-4 py-3 text-sm font-semibold text-[#16A36A] transition hover:bg-[#16A36A]/5"
              >
                <Plus size={17} />
                Add Another Image
              </button>
            )}
          </section>

          {/* Submission note */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            <strong>Approval process:</strong> After submitting your
            equipment, it will remain pending until an administrator
            reviews and approves it. It will not appear in public
            equipment listings before approval.
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/owner/dashboard"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting || loadingCategories || categories.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16A36A] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-[#16A36A]/20 transition hover:bg-[#128653] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Equipment
                  <Plus size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function AddEquipmentPage() {
  return (
    <ProtectedRoute allowedRoles={["owner", "admin"]}>
      <AddEquipmentContent />
    </ProtectedRoute>
  );
}
