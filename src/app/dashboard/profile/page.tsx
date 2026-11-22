
"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import ProtectedRoute from "@/components/providers/protected-route";
import { useAuth } from "@/components/providers/auth-provider";
import { authClient } from "@/lib/auth-client";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import {
  UserRound,
  Mail,
  Camera,
  ShieldCheck,
  CalendarDays,
  LoaderCircle,
  Save,
  RefreshCw,
  Pencil,
  X,
  Package,
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

function formatDate(value?: string) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function ProfileContent() {
  const session = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [name, setName] = useState("");
  const [image, setImage] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const getToken = async () => {
    const { data, error } = await authClient.token();

    if (error || !data?.token) {
      throw new Error(
        error?.message || "Unable to retrieve authentication token."
      );
    }

    return data.token;
  };

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);

      const token = await getToken();

      const response = await apiRequest<ApiResponse<UserProfile>>(
        "/api/users/me",
        {
          method: "GET",
          token,
        }
      );

      if (!response.data) {
        throw new Error("Profile information was not returned.");
      }

      setProfile(response.data);
      setName(response.data.name || "");
      setImage(response.data.image || "");
      setEditing(false);
    } catch (error) {
      console.error("Profile loading error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session.isPending || !session.data?.user) return;

    void loadProfile();
  }, [session.isPending, session.data?.user?.id, loadProfile]);

  const handleCancel = () => {
    if (!profile) return;

    setName(profile.name || "");
    setImage(profile.image || "");
    setEditing(false);
  };

  const handleUpdateProfile = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (name.trim().length < 2) {
      toast.error("Name must contain at least 2 characters.");
      return;
    }

    if (image.trim()) {
      try {
        const parsedUrl = new URL(image.trim());

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error("Invalid image URL");
        }
      } catch {
        toast.error("Please enter a valid profile image URL.");
        return;
      }
    }

    if (
      profile &&
      name.trim() === profile.name &&
      image.trim() === (profile.image || "")
    ) {
      toast.info("No changes to save.");
      setEditing(false);
      return;
    }

    try {
      setSaving(true);

      const token = await getToken();

      const response = await apiRequest<ApiResponse<UserProfile>>(
        "/api/users/me",
        {
          method: "PATCH",
          token,
          body: JSON.stringify({
            name: name.trim(),
            image: image.trim(),
          }),
        }
      );

      if (!response.data) {
        throw new Error("Updated profile information was not returned.");
      }

      setProfile(response.data);
      setName(response.data.name || "");
      setImage(response.data.image || "");
      setEditing(false);

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Profile update error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="mx-auto h-9 w-9 animate-spin text-emerald-600" />
          <p className="mt-4 text-sm text-slate-500">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <UserRound className="mx-auto h-12 w-12 text-slate-400" />

        <h2 className="mt-5 text-xl font-bold text-slate-800">
          Profile unavailable
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          We could not retrieve your profile information.
        </p>

        <button
          type="button"
          onClick={() => void loadProfile()}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </section>
    );
  }

  const initials = getInitials(profile.name || "User");

  return (
    <main className="mx-auto w-full max-w-5xl space-y-7">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-600">
            Account Settings
          </p>

          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#101D2C]">
            My Profile
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage your personal information and account details.
          </p>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            <Pencil size={16} />
            Edit Profile
          </button>
        )}
      </div>

      {/* PROFILE OVERVIEW */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative h-36 overflow-hidden bg-gradient-to-r from-[#064E3B] via-emerald-600 to-emerald-400">
          <div className="absolute -right-10 -top-24 h-64 w-64 rounded-full border border-white/15" />
          <div className="absolute -right-2 -top-16 h-48 w-48 rounded-full border border-white/15" />

          <div className="absolute bottom-5 left-7 text-white/90">
            <p className="text-xs font-bold uppercase tracking-[0.2em]">
              EQUIPORA
            </p>
            <p className="mt-1 text-sm text-white/75">
              Your account. Your equipment journey.
            </p>
          </div>
        </div>

        <div className="px-6 pb-7 sm:px-9">
          <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-emerald-50 text-3xl font-extrabold text-emerald-700 shadow-md">
              {profile.image ? (
                <img
                  src={profile.image}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials || <UserRound size={35} />
              )}
            </div>

            <div className="min-w-0 flex-1 pb-1">
              <h2 className="text-2xl font-bold text-[#101D2C]">
                {profile.name}
              </h2>

              <p className="mt-1 break-all text-sm text-slate-500">
                {profile.email}
              </p>
            </div>

            <span className="mb-1 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold capitalize text-emerald-700">
              <ShieldCheck size={15} />
              {profile.role}
            </span>
          </div>
        </div>
      </section>

      {/* PERSONAL INFORMATION */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <div className="mb-7">
          <h2 className="text-xl font-bold text-[#101D2C]">
            Personal Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {editing
              ? "Update your personal information below."
              : "Your registered account information."}
          </p>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          {/* NAME */}
          <div>
            <label
              htmlFor="profileName"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Full Name
            </label>

            <div className="relative">
              <UserRound
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="profileName"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                maxLength={100}
                required
                disabled={!editing || saving}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
          </div>

          {/* EMAIL */}
          <div>
            <label
              htmlFor="profileEmail"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Email Address
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="profileEmail"
                type="email"
                value={profile.email}
                disabled
                className="h-12 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-500"
              />
            </div>

            <p className="mt-2 text-xs text-slate-400">
              Your registered email address cannot be changed here.
            </p>
          </div>

          {/* IMAGE URL */}
          <div>
            <label
              htmlFor="profileImage"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Profile Image URL
            </label>

            <div className="relative">
              <Camera
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="profileImage"
                type="url"
                value={image}
                onChange={(event) => setImage(event.target.value)}
                placeholder="https://example.com/profile.jpg"
                disabled={!editing || saving}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <p className="mt-2 text-xs text-slate-400">
              Use a publicly accessible image URL.
            </p>

            {editing && image.trim() && (
              <div className="mt-4 flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <img
                  src={image}
                  alt="Profile preview"
                  className="h-14 w-14 rounded-xl object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />

                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Image Preview
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    This image will be used as your profile picture.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ACTIONS */}
          {editing && (
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck size={16} className="text-emerald-600" />
                Your account information is protected.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-6 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <X size={17} />
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 text-sm font-bold text-white shadow-lg shadow-emerald-600/15 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </section>

      {/* ACCOUNT DETAILS */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <h2 className="text-xl font-bold text-[#101D2C]">
          Account Details
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <ShieldCheck size={17} />
              Account Verification
            </div>

            <p className="mt-3 font-bold text-slate-800">
              {profile.emailVerified ? "Verified" : "Not verified"}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Email verification status
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <CalendarDays size={17} />
              Member Since
            </div>

            <p className="mt-3 font-bold text-slate-800">
              {formatDate(profile.createdAt)}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Your EQUIPORA membership date
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5 sm:col-span-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Package size={17} />
              Account Type
            </div>

            <p className="mt-3 font-bold capitalize text-slate-800">
              {profile.role}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Your account permissions are managed by EQUIPORA.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function CustomerProfilePage() {
  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <div className="min-h-screen bg-[#F7F9FC] p-5 sm:p-8">
        <ProfileContent />
      </div>
    </ProtectedRoute>
  );
}
