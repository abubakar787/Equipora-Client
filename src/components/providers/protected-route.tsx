
"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

type UserRole = "customer" | "owner" | "admin";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

function getDashboardPath(role: string) {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "owner":
      return "/owner/dashboard";
    case "customer":
      return "/dashboard";
    default:
      return "/";
  }
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const router = useRouter();
  const session = useAuth();

  const user = session.data?.user as
    | { id: string; email: string; role?: string }
    | undefined;

  const role = user?.role?.toLowerCase();
  const isPending = session.isPending;
  const allowedRolesKey = allowedRoles?.join("|") ?? "";

  useEffect(() => {
    if (isPending) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const permittedRoles = allowedRolesKey
      ? allowedRolesKey.split("|")
      : [];

    if (permittedRoles.length > 0 && (!role || !permittedRoles.includes(role))) {
      router.replace(role ? getDashboardPath(role) : "/");
    }
  }, [isPending, user, role, allowedRolesKey, router]);

  if (isPending || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F7F9FC]">
        <LoaderCircle className="h-9 w-9 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-slate-500">
          Verifying your account...
        </p>
      </div>
    );
  }

  const permittedRoles = allowedRolesKey
    ? allowedRolesKey.split("|")
    : [];

  if (permittedRoles.length > 0 && (!role || !permittedRoles.includes(role))) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F7F9FC] px-5 text-center">
        <ShieldAlert className="h-12 w-12 text-amber-500" />
        <h2 className="text-xl font-bold text-slate-800">
          Access Restricted
        </h2>
        <p className="text-sm text-slate-500">
          Redirecting you to the appropriate page...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
