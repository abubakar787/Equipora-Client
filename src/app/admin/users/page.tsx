
"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedRoute from "@/components/providers/protected-route";
import { authClient } from "@/lib/auth-client";
import {
  Search,
  Users,
  ShieldCheck,
  UserRound,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Shield,
  Mail,
  CalendarDays,
  X,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type UserRole = "customer" | "owner" | "admin";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: UserRole;
  emailVerified?: boolean;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UsersResponse {
  success: boolean;
  message?: string;
  data: {
    data: User[];
    pagination: Pagination;
  };
}

const ROLE_OPTIONS: UserRole[] = ["customer", "owner", "admin"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [currentUserId, setCurrentUserId] = useState("");

  // Get the currently authenticated user's ID.
  // This is used to prevent changing the admin's own role.
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const session = await authClient.getSession();
        const user = session.data?.user as
          | { id?: string }
          | undefined;

        setCurrentUserId(user?.id || "");
      } catch (err) {
        console.error("Could not load current user:", err);
      }
    };

    getCurrentUser();
  }, []);

  const getToken = async () => {
    const tokenResponse = await authClient.token();
    const token = tokenResponse.data?.token;

    if (!token) {
      throw new Error("Authentication token not found. Please login again.");
    }

    return token;
  };

  const fetchUsers = useCallback(
    async (page = 1) => {
      if (!API_URL) {
        setError("API URL is missing. Check NEXT_PUBLIC_API_URL.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        setSuccessMessage("");

        const token = await getToken();

        const params = new URLSearchParams({
          page: String(page),
          limit: String(pagination.limit),
        });

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (roleFilter !== "all") {
          params.set("role", roleFilter);
        }

        const response = await fetch(
          `${API_URL}/api/users?${params.toString()}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
          }
        );

        const result: UsersResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Failed to load users."
          );
        }

        setUsers(result.data.data || []);
        setPagination(
          result.data.pagination || {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 1,
          }
        );
      } catch (err) {
        console.error("Fetch users error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading users."
        );
      } finally {
        setLoading(false);
      }
    },
    [search, roleFilter, pagination.limit]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsers(1);
    }, 400);

    return () => clearTimeout(timeout);
  }, [fetchUsers]);

  const handleRoleChange = async (
    user: User,
    newRole: UserRole
  ) => {
    if (user.role === newRole) return;

    if (user.id === currentUserId) {
      setError("You cannot change your own admin role.");
      return;
    }

    const confirmed = window.confirm(
      `Change ${user.name}'s role from ${user.role} to ${newRole}?`
    );

    if (!confirmed) return;

    try {
      setUpdatingId(user.id);
      setError("");
      setSuccessMessage("");

      const token = await getToken();

      const response = await fetch(
        `${API_URL}/api/users/${user.id}/role`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to update user role."
        );
      }

      setSuccessMessage(
        `${user.name}'s role updated to ${newRole}.`
      );

      await fetchUsers(pagination.page);
    } catch (err) {
      console.error("Role update error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not update user role."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getRoleStyle = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700";
      case "owner":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-emerald-100 text-emerald-700";
    }
  };

  const adminCount = users.filter(
    (user) => user.role === "admin"
  ).length;

  const ownerCount = users.filter(
    (user) => user.role === "owner"
  ).length;

  const customerCount = users.filter(
    (user) => user.role === "customer"
  ).length;

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Header */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-600">
                <ShieldCheck size={17} />
                Administration
              </div>

              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                User Management
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Manage platform users, monitor accounts and control
                user permissions.
              </p>
            </div>

            <button
              onClick={() => fetchUsers(pagination.page)}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Users"
              value={pagination.total}
              icon={<Users size={21} />}
              color="bg-emerald-50 text-emerald-600"
            />

            <StatCard
              title="Customers"
              value={customerCount}
              icon={<UserRound size={21} />}
              color="bg-blue-50 text-blue-600"
            />

            <StatCard
              title="Equipment Owners"
              value={ownerCount}
              icon={<Shield size={21} />}
              color="bg-orange-50 text-orange-600"
            />

            <StatCard
              title="Administrators"
              value={adminCount}
              icon={<ShieldCheck size={21} />}
              color="bg-purple-50 text-purple-600"
            />
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>

              <button onClick={() => setError("")}>
                <X size={18} />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <span>{successMessage}</span>
              <button onClick={() => setSuccessMessage("")}>
                <X size={18} />
              </button>
            </div>
          )}

          {/* Search and Filters */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search
                  size={19}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="all">All Roles</option>
                <option value="customer">Customers</option>
                <option value="owner">Owners</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                Showing {users.length} of {pagination.total} users
              </span>

              <span>
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-slate-900">
                All Platform Users
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                View user information and manage account roles.
              </p>
            </div>

            {loading ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3">
                <Loader2
                  size={32}
                  className="animate-spin text-emerald-600"
                />
                <p className="text-sm text-slate-500">
                  Loading users...
                </p>
              </div>
            ) : users.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
                <div className="mb-3 rounded-full bg-slate-100 p-4 text-slate-400">
                  <Users size={28} />
                </div>
                <h3 className="font-semibold text-slate-800">
                  No users found
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Try changing your search or role filter.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-5 py-4 font-semibold">
                          User
                        </th>
                        <th className="px-5 py-4 font-semibold">
                          Email
                        </th>
                        <th className="px-5 py-4 font-semibold">
                          Joined
                        </th>
                        <th className="px-5 py-4 font-semibold">
                          Current Role
                        </th>
                        <th className="px-5 py-4 font-semibold">
                          Manage Role
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {users.map((user) => {
                        const isUpdating =
                          updatingId === user.id;

                        const isCurrentUser =
                          user.id === currentUserId;

                        return (
                          <tr
                            key={user.id}
                            className="transition hover:bg-slate-50/80"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                {user.image ? (
                                  <img
                                    src={user.image}
                                    alt={user.name}
                                    className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                                  </div>
                                )}

                                <div>
                                  <p className="font-semibold text-slate-800">
                                    {user.name}
                                  </p>
                                  {isCurrentUser && (
                                    <span className="text-xs font-medium text-emerald-600">
                                      You
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Mail
                                  size={15}
                                  className="text-slate-400"
                                />
                                {user.email}
                              </div>
                              <p className="mt-1 text-xs text-slate-400">
                                {user.emailVerified
                                  ? "Email verified"
                                  : "Not verified"}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <CalendarDays
                                  size={15}
                                  className="text-slate-400"
                                />
                                {formatDate(user.createdAt)}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getRoleStyle(
                                  user.role
                                )}`}
                              >
                                {user.role}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              {isCurrentUser ? (
                                <span className="text-xs text-slate-400">
                                  Own role protected
                                </span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <select
                                    value={user.role}
                                    disabled={isUpdating}
                                    onChange={(e) =>
                                      handleRoleChange(
                                        user,
                                        e.target.value as UserRole
                                      )
                                    }
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium capitalize text-slate-700 outline-none focus:border-emerald-500 disabled:opacity-50"
                                  >
                                    {ROLE_OPTIONS.map((role) => (
                                      <option
                                        key={role}
                                        value={role}
                                      >
                                        {role}
                                      </option>
                                    ))}
                                  </select>

                                  {isUpdating && (
                                    <Loader2
                                      size={16}
                                      className="animate-spin text-emerald-600"
                                    />
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row">
                  <p className="text-xs text-slate-500">
                    Page {pagination.page} of{" "}
                    {pagination.totalPages || 1}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        fetchUsers(pagination.page - 1)
                      }
                      disabled={
                        loading || pagination.page <= 1
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={15} />
                      Previous
                    </button>

                    <button
                      onClick={() =>
                        fetchUsers(pagination.page + 1)
                      }
                      disabled={
                        loading ||
                        pagination.page >= pagination.totalPages
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        <div className={`rounded-xl p-3 ${color}`}>
          {icon}
        </div>
      </div>

      <p className="mt-4 text-3xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}
