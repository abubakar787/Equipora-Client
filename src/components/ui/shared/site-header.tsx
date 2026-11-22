
"use client";

import Link from "next/link";
import { useState } from "react";
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
} from "lucide-react";

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

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

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

          {/* Social Media */}
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

          {/* Authentication Buttons */}
          <div className="hidden items-center gap-3 lg:flex">
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

              {/* Mobile Auth Buttons */}
              <div className="flex gap-3 border-t border-slate-100 pt-4">
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
