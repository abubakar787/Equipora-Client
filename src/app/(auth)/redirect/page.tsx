
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

type UserRole = "customer" | "owner" | "admin";

function getDashboardPath(role: string): string {
  const normalizedRole = role.toLowerCase();

  switch (normalizedRole) {
    case "admin":
      return "/admin/dashboard";

    case "owner":
      return "/owner/dashboard";

    case "customer":
      return "/dashboard";

    default:
      return "/dashboard";
  }
}

export default function AuthRedirectPage() {
  const router = useRouter();
  const session = useAuth();

  const { data, isPending } = session;

  useEffect(() => {
    if (isPending) return;

    // Check whether the user is authenticated
    if (!data?.user) {
      router.replace("/login");
      return;
    }

    // Get authenticated user's role
    const user = data.user as typeof data.user & {
      role?: UserRole;
    };

    const role = user.role || "customer";

    // Redirect according to user role
    const destination = getDashboardPath(role);

    router.replace(destination);
  }, [data, isPending, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F9FC] px-5">
      <div className="flex w-full max-w-md flex-col items-center rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">

        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
          {isPending ? (
            <LoaderCircle className="h-8 w-8 animate-spin text-emerald-600" />
          ) : (
            <ShieldCheck className="h-8 w-8 text-emerald-600" />
          )}
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#101D2C]">
          EQUIPORA
        </h1>

        <p className="mt-3 text-lg font-semibold text-slate-800">
          Preparing Your Dashboard
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Please wait while we verify your account and redirect you to the
          appropriate dashboard.
        </p>

        <div className="mt-7 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-600" />
        </div>

        <p className="mt-4 text-xs font-medium tracking-wider text-slate-400">
          RENT SMARTER. BUILD BETTER.
        </p>
      </div>
    </main>
  );
}
