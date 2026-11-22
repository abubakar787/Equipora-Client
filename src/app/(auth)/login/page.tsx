
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Truck,
  Wrench,
  LoaderCircle,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState("");

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Please enter your email and password.");
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await authClient.signIn.email({
        email: email.trim(),
        password,
        callbackURL: `${window.location.origin}/redirect`,
      });

      if (error) {
        toast.error(error.message || "Invalid email or password.");
        return;
      }

      toast.success("Login successful! Welcome to EQUIPORA.");

      router.replace("/redirect");
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);

      toast.error(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "github") => {
    try {
      setSocialLoading(provider);

      const { error } = await authClient.signIn.social({
        provider,
       callbackURL: `${window.location.origin}/redirect`,
      });

      if (error) {
        toast.error(error.message || `${provider} login failed.`);
        setSocialLoading("");
      }
    } catch (error) {
      console.error(`${provider} login error:`, error);

      toast.error("Unable to continue with social login.");
      setSocialLoading("");
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F9FC]">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Branding Section */}
        <section className="relative hidden overflow-hidden bg-[#101D2C] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full border border-white/10" />
          <div className="absolute -bottom-48 -left-32 h-[500px] w-[500px] rounded-full border border-white/10" />
          <div className="absolute right-20 top-1/3 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

          <Link href="/" className="relative z-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <Wrench size={25} />
            </div>

            <div>
              <p className="text-2xl font-black tracking-[0.12em]">
                EQUIPORA
              </p>
              <p className="text-xs tracking-[0.18em] text-slate-400">
                RENT SMARTER. BUILD BETTER.
              </p>
            </div>
          </Link>

          <div className="relative z-10 max-w-xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
              <ShieldCheck size={16} />
              A smarter way to rent equipment
            </div>

            <h1 className="text-5xl font-bold leading-[1.15] xl:text-6xl">
              Build more.
              <br />
              <span className="text-emerald-400">Own less.</span>
              <br />
              Achieve more.
            </h1>

            <p className="mt-7 max-w-md text-lg leading-8 text-slate-300">
              Access the equipment you need, connect with trusted owners,
              and move your projects forward with confidence.
            </p>

            <div className="mt-12 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <Truck className="mb-4 text-emerald-400" size={27} />
                <h3 className="font-semibold">Flexible Rentals</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Equipment when you need it.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <ShieldCheck className="mb-4 text-emerald-400" size={27} />
                <h3 className="font-semibold">Trusted Platform</h3>
                <p className="mt-1 text-sm text-slate-400">
                  A secure rental experience.
                </p>
              </div>
            </div>
          </div>

          <p className="relative z-10 text-sm text-slate-500">
            © 2026 EQUIPORA. All rights reserved.
          </p>
        </section>

        {/* Login Form */}
        <section className="flex items-center justify-center px-5 py-12 sm:px-10 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Wrench size={23} />
                </div>
                <span className="text-xl font-black tracking-wider text-[#101D2C]">
                  EQUIPORA
                </span>
              </Link>
            </div>

            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">
                Welcome Back
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-[#101D2C] sm:text-4xl">
                Sign in to your account
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Access your rentals, manage your equipment, and continue
                where you left off.
              </p>
            </div>

            {/* Social Login */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSocialLogin("google")}
                disabled={isLoading || !!socialLoading}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {socialLoading === "google" ? (
                  <LoaderCircle className="animate-spin" size={18} />
                ) : (
                  <svg viewBox="0 0 48 48" className="h-5 w-5">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.72 7.18l7.26 5.63c4.24-3.91 6.68-9.67 6.68-17.28Z" />
                    <path fill="#FBBC05" d="M10.54 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a24 24 0 0 0 0 21.56l7.98-6.19Z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.94-2.13 15.92-5.8l-7.26-5.63c-2.01 1.35-4.58 2.15-8.66 2.15-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
                  </svg>
                )}
                Google
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin("github")}
                disabled={isLoading || !!socialLoading}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {socialLoading === "github" ? (
                  <LoaderCircle className="animate-spin" size={18} />
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                    <path d="M12 .5A12 12 0 0 0 8.2 23.88c.6.11.82-.26.82-.58v-2.04c-3.34.73-4.05-1.42-4.05-1.42-.55-1.4-1.34-1.77-1.34-1.77-1.1-.75.08-.74.08-.74 1.22.09 1.86 1.25 1.86 1.25 1.08 1.85 2.83 1.32 3.52 1.01.11-.78.42-1.32.76-1.63-2.67-.3-5.48-1.34-5.48-5.95 0-1.31.47-2.38 1.25-3.22-.13-.31-.54-1.53.12-3.18 0 0 1.02-.33 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.28-1.56 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.18.78.84 1.25 1.91 1.25 3.22 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z" />
                  </svg>
                )}
                GitHub
              </button>
            </div>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Or continue with email
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                  Email Address
                </label>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="h-13 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="h-13 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !!socialLoading}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <LoaderCircle className="animate-spin" size={19} />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-bold text-emerald-600 transition hover:text-emerald-700">
                Create an account
              </Link>
            </p>

            <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
              <ShieldCheck size={15} />
              Your account is protected by secure authentication.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
