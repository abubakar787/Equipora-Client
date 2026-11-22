"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Camera,
  Briefcase,
  CirclePlay,
  Mail,
  Phone,
  Menu,
  X,
  Wrench,
  ArrowUpRight,
  LayoutDashboard,
  UserRound,
  LogOut,
  ChevronDown,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { authClient } from "@/lib/auth-client";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Equipment", href: "/equipment" },
  { label: "Categories", href: "/#categories" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "About", href: "/#about" },
];

const socialLinks = [
  { label: "Website", icon: Globe, href: "#" },
  { label: "Instagram", icon: Camera, href: "#" },
  { label: "LinkedIn", icon: Briefcase, href: "#" },
  { label: "YouTube", icon: CirclePlay, href: "#" },
];

type UserRole = "customer" | "owner" | "admin";

function getDashboardPath(role: string) {
  switch (role.toLowerCase()) {
    case "admin":
      return "/admin/dashboard";

    case "owner":
      return "/owner/dashboard";

    case "customer":
    default:
      return "/dashboard";
  }
}

export default function SiteHeader() {
  const router = useRouter();
  const session = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const user = session.data?.user as
    | {
        id: string;
        name?: string;
        email?: string;
        image?: string | null;
        role?: UserRole;
      }
    | undefined;

  const isPending = session.isPending;
  const role = user?.role?.toLowerCase() || "customer";
  const dashboardPath = getDashboardPath(role);

  const displayName = user?.name || "EQUIPORA User";
  const userInitial = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    try {
      setIsSigningOut(true);

      const { error } = await authClient.signOut();

      if (error) {
        toast.error(error.message || "Unable to sign out.");
        return;
      }

      setProfileOpen(false);
      setMobileOpen(false);

      toast.success("You have signed out successfully.");

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);

      toast.error("Something went wrong while signing out.");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top Contact Bar */}
      <div className="hidden bg-[#101D2C] text-white sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-2.5 lg:px-10">
          <div className="flex items-center gap-6 text-xs">
            <a
              href="mailto:info@equipora.com"
              className="flex items-center gap-2 transition-colors hover:text-emerald-400"
            >
              <Mail className="h-3.5 w-3.5 text-emerald-400" />
              <span>info@equipora.com</span>
            </a>

            <span className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-emerald-400" />
              <span>+123XX</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {socialLinks.map((social) => {
              const Icon = social.icon;

              return (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  title={social.label}
                  className="text-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:text-emerald-400"
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 lg:px-10">
          {/* Brand Logo */}
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex shrink-0 items-center gap-2.5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#101D2C] text-emerald-400 shadow-md">
              <Wrench className="h-5 w-5" />
            </span>

            <span>
              <span className="block text-xl font-black tracking-[0.08em] text-[#101D2C]">
                EQUIP<span className="text-emerald-600">ORA</span>
              </span>

              <span className="block text-[9px] font-semibold tracking-[0.2em] text-slate-500">
                RENT SMARTER. BUILD BETTER.
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-7 lg:flex">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-slate-600 transition-colors duration-200 hover:text-emerald-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Authentication */}
          <div className="hidden items-center gap-3 lg:flex">
            {isPending ? (
              <LoaderCircle className="h-5 w-5 animate-spin text-emerald-600" />
            ) : user ? (
              <>
                <Link
                  href={dashboardPath}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileOpen((value) => !value)}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 transition hover:border-emerald-400 hover:bg-slate-50"
                    aria-expanded={profileOpen}
                  >
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={displayName}
                        className="h-9 w-9 rounded-full border border-slate-200 object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                        {userInitial}
                      </span>
                    )}

                    <span className="max-w-[110px] truncate text-sm font-semibold text-[#101D2C]">
                      {displayName}
                    </span>

                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full z-50 mt-3 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                      <div className="border-b border-slate-100 px-4 py-4">
                        <p className="truncate text-sm font-bold text-[#101D2C]">
                          {displayName}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {user.email}
                        </p>

                        <span className="mt-2 inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                          {role}
                        </span>
                      </div>

                      <div className="p-2">
                        <Link
                          href="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          <UserRound className="h-4 w-4" />
                          My Profile
                        </Link>

                        <Link
                          href={dashboardPath}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard
                        </Link>

                        <button
                          type="button"
                          onClick={handleLogout}
                          disabled={isSigningOut}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                        >
                          {isSigningOut ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <LogOut className="h-4 w-4" />
                          )}
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#101D2C] transition-colors hover:bg-slate-100"
                >
                  Log In
                </Link>

                <Link
                  href="/register"
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700"
                >
                  Get Started
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-[#101D2C] transition-colors hover:bg-slate-100 lg:hidden"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile Navigation Panel */}
        {mobileOpen && (
          <div className="border-t border-slate-200 bg-white px-5 py-5 shadow-xl lg:hidden">
            <nav className="flex flex-col gap-4">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-semibold text-slate-700 transition-colors hover:text-emerald-700"
                >
                  {item.label}
                </Link>
              ))}

              <div className="border-t border-slate-100 pt-4">
                {isPending ? (
                  <div className="flex justify-center py-3">
                    <LoaderCircle className="h-5 w-5 animate-spin text-emerald-600" />
                  </div>
                ) : user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={displayName}
                          className="h-11 w-11 rounded-full border border-slate-200 object-cover"
                        />
                      ) : (
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                          {userInitial}
                        </span>
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#101D2C]">
                          {displayName}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                      <ShieldCheck className="h-4 w-4" />
                      {role} Account
                    </p>

                    <Link
                      href={dashboardPath}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>

                    <Link
                      href="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-[#101D2C]"
                    >
                      <UserRound className="h-4 w-4" />
                      My Profile
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isSigningOut}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                    >
                      {isSigningOut ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold text-[#101D2C]"
                    >
                      Log In
                    </Link>

                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 rounded-xl bg-emerald-600 py-3 text-center text-sm font-bold text-white"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Contact Information */}
              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <a
                  href="mailto:info@equipora.com"
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4 text-emerald-600" />
                  info@equipora.com
                </a>

                <span className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-600" />
                  +123XX
                </span>

                <div className="flex items-center gap-5 pt-1">
                  {socialLinks.map((social) => {
                    const Icon = social.icon;

                    return (
                      <a
                        key={social.label}
                        href={social.href}
                        aria-label={social.label}
                        className="transition-colors hover:text-emerald-600"
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}