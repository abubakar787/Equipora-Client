
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  UserRound,
  Mail,
  LockKeyhole,
  Camera,
  ShieldCheck,
  Wrench,
  CheckCircle2,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "github" | null>(null);

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasMinLength = password.length >= 6;

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      toast.error("Please complete all required fields.");
      return;
    }

    if (!hasUppercase || !hasLowercase || !hasMinLength) {
      toast.error(
        "Password must contain uppercase, lowercase and at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
        image: image.trim() || undefined,
        callbackURL: "/dashboard",
      });

      if (error) {
        throw new Error(error.message || "Registration failed.");
      }

      if (!data) {
        throw new Error("Registration response was empty.");
      }

      toast.success("Your EQUIPORA account has been created!");
      router.replace("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSocialRegister = async (provider: "google" | "github") => {
    try {
      setSocialLoading(provider);

      const { error } = await authClient.signIn.social({
        provider,
        callbackURL: "/dashboard",
      });

      if (error) {
        throw new Error(error.message || `${provider} registration failed.`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Unable to continue with ${provider}.`
      );
      setSocialLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F9FC]">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Registration Form */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-16">
          <div className="w-full max-w-[460px]">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-600"
            >
              <ArrowLeft size={17} />
              Back to Home
            </Link>

            <Link href="/" className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#101D2C] text-emerald-400 shadow-lg">
                <Wrench size={25} />
              </div>

              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#101D2C]">
                  EQUIPORA
                </h1>
                <p className="text-[10px] font-semibold tracking-[0.25em] text-slate-400">
                  RENT SMARTER. BUILD BETTER.
                </p>
              </div>
            </Link>

            <div className="mb-7">
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">
                Create Your Account
              </p>

              <h2 className="text-3xl font-extrabold tracking-tight text-[#101D2C] sm:text-4xl">
                Join EQUIPORA
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Create your account and discover a smarter way to rent
                and manage equipment.
              </p>
            </div>

            {/* Google Registration */}
            <button
              type="button"
              onClick={() => handleSocialRegister("google")}
              disabled={loading || socialLoading !== null}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg viewBox="0 0 48 48" className="h-5 w-5">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.24 5.48-4.7 7.18l7.19 5.58c4.2-3.88 6.55-9.6 6.55-17.23Z" />
                <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a24 24 0 0 0 0 21.56l7.98-6.19Z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.78l-7.19-5.58c-1.99 1.34-4.53 2.13-8.72 2.13-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 43.62 14.62 48 24 48Z" />
              </svg>
              {socialLoading === "google" ? "Connecting..." : "Continue with Google"}
            </button>

            {/* GitHub Registration */}
            <button
              type="button"
              onClick={() => handleSocialRegister("github")}
              disabled={loading || socialLoading !== null}
              className="mt-3 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.53v-2.05c-3.1.67-3.75-1.32-3.75-1.32-.5-1.28-1.23-1.62-1.23-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.7 1.15 1.7 1.15.99 1.7 2.6 1.21 3.23.93.1-.72.39-1.21.7-1.49-2.47-.28-5.07-1.24-5.07-5.5 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.95 0 0 .94-.3 3.05 1.15a10.6 10.6 0 0 1 5.55 0c2.11-1.44 3.05-1.15 3.05-1.15.61 1.53.23 2.67.11 2.95.72.78 1.15 1.78 1.15 3 0 4.27-2.6 5.21-5.08 5.49.4.34.75 1.01.75 2.04V22c0 .29.2.63.76.53A11.1 11.1 0 0 0 12 .9Z" />
              </svg>
              {socialLoading === "github" ? "Connecting..." : "Continue with GitHub"}
            </button>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Or register with email
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-bold text-slate-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              {/* Photo URL */}
              <div>
                <label htmlFor="image" className="mb-2 block text-sm font-bold text-slate-700">
                  Profile Photo URL <span className="text-xs font-normal text-slate-400">(Optional)</span>
                </label>
                <div className="relative">
                  <Camera size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="image"
                    type="url"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { valid: hasUppercase, label: "Uppercase" },
                    { valid: hasLowercase, label: "Lowercase" },
                    { valid: hasMinLength, label: "6+ Characters" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <CheckCircle2
                        size={13}
                        className={item.valid ? "text-emerald-500" : "text-slate-300"}
                      />
                      <span className={`text-[10px] font-medium ${item.valid ? "text-emerald-600" : "text-slate-400"}`}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-sm font-bold text-slate-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label="Toggle confirm password visibility"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || socialLoading !== null}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#101D2C] px-5 py-4 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating Account..." : "Create My Account"}
                {!loading && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-emerald-600 hover:text-emerald-700">
                Sign In
              </Link>
            </p>

            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={15} className="text-emerald-600" />
              Your information is protected by EQUIPORA
            </div>
          </div>
        </section>

        {/* Brand Panel */}
        <section className="relative hidden overflow-hidden bg-[#101D2C] lg:flex lg:items-center lg:justify-center">
          <div className="absolute -right-32 -top-32 h-[450px] w-[450px] rounded-full border border-white/10" />
          <div className="absolute -right-20 -top-20 h-[350px] w-[350px] rounded-full border border-white/10" />
          <div className="absolute -bottom-40 -left-32 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative z-10 max-w-lg px-12">
            <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Start Your Journey
            </div>

            <h2 className="text-5xl font-extrabold leading-[1.15] tracking-tight text-white">
              Make your next
              <span className="block text-emerald-400">project happen.</span>
            </h2>

            <p className="mt-7 text-base leading-8 text-slate-300">
              Discover equipment, connect with trusted owners and bring
              your ideas to life with a smarter rental marketplace.
            </p>

            <div className="mt-12 space-y-5">
              {[
                "Discover quality equipment for your projects",
                "Connect with equipment owners",
                "Manage your rentals in one place",
                "Enjoy a secure rental experience",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400">
                    <CheckCircle2 size={16} />
                  </div>
                  <span className="text-sm font-medium text-slate-200">{item}</span>
                </div>
              ))}
            </div>

            <p className="mt-14 text-xs font-medium tracking-widest text-slate-500">
              EQUIPORA — RENT SMARTER. BUILD BETTER.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
