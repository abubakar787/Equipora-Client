
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

export default function AuthRedirectPage() {
  const router = useRouter();
  const { data, isPending } = useAuth();

  useEffect(() => {
    if (isPending) return;

    if (!data?.user) {
      router.replace("/login");
      return;
    }

    const user = data.user as typeof data.user & {
      role?: string;
    };

    const role = user.role?.toLowerCase();

    switch (role) {
      case "admin":
        router.replace("/admin/dashboard");
        break;

      case "owner":
        router.replace("/owner/dashboard");
        break;

      case "customer":
        router.replace("/dashboard");
        break;

      default:
        router.replace("/");
        break;
    }
  }, [data, isPending, router]);


  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F7F9FC]">
      <LoaderCircle className="h-10 w-10 animate-spin text-emerald-600" />

      <h1 className="text-xl font-bold text-[#101D2C]">
        Preparing your dashboard
      </h1>

      <p className="text-sm text-slate-500">
        Verifying your account and permissions...
      </p>
    </main>
  );
}
