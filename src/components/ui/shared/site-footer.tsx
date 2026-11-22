
import Link from "next/link";
import {
  ArrowRight,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Twitter,
} from "lucide-react";

const footerSections = [
  {
    title: "Platform",
    links: [
      { label: "Home", href: "/" },
      { label: "All Equipment", href: "/equipment" },
      { label: "Categories", href: "/categories" },
      { label: "How It Works", href: "/how-it-works" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact Us", href: "/contact" },
      { label: "Become an Owner", href: "/register" },
      { label: "Help Center", href: "/help" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Rental Policy", href: "/rental-policy" },
    ],
  },
];

const socialLinks = [
  { label: "Facebook", icon: Facebook, href: "https://facebook.com" },
  { label: "Instagram", icon: Instagram, href: "https://instagram.com" },
  { label: "LinkedIn", icon: Linkedin, href: "https://linkedin.com" },
  { label: "Twitter", icon: Twitter, href: "https://twitter.com" },
];

export default function SiteFooter() {
  return (
    <footer className="mt-auto bg-[#101D2C] text-white">
      {/* Call to Action */}
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-7 px-5 py-12 sm:px-8 md:flex-row md:items-center lg:px-10">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
              Ready to Get Started?
            </p>

            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
              Find the right equipment.
              <span className="block text-emerald-400">
                Build something great.
              </span>
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-400">
              Discover quality equipment, connect with trusted owners,
              and make your next project easier with EQUIPORA.
            </p>
          </div>

          <Link
            href="/equipment"
            className="inline-flex w-fit items-center gap-3 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-400"
          >
            Explore Equipment
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-2xl font-black">
                E
              </div>

              <span className="text-2xl font-extrabold tracking-tight">
                EQUIPORA
              </span>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
              EQUIPORA is your equipment rental marketplace.
              Find reliable tools and machinery, rent from trusted
              owners, and move your projects forward with confidence.
            </p>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
              Rent Smarter. Build Better.
            </p>

            {/* Social Media */}
            <div className="mt-7 flex gap-3">
              {socialLinks.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-400 transition hover:border-emerald-500 hover:bg-emerald-500 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-bold text-white">
                {section.title}
              </h3>

              <ul className="mt-6 space-y-4">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition hover:text-emerald-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Information */}
        <div className="mt-12 grid gap-5 border-t border-white/10 pt-8 sm:grid-cols-2">
          <a
            href="mailto:info@equipora.com"
            className="flex items-center gap-3 text-sm text-slate-400 transition hover:text-emerald-400"
          >
            <Mail className="h-5 w-5 text-emerald-400" />
            info@equipora.com
          </a>

          <div className="flex items-center gap-3 text-sm text-slate-400">
            <MapPin className="h-5 w-5 text-emerald-400" />
            Equipment Rental Marketplace
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 text-center sm:px-8 md:flex-row md:text-left lg:px-10">
          <p className="text-xs text-slate-500">
            Copyright {new Date().getFullYear()} EQUIPORA. All rights reserved.
          </p>

          <p className="text-xs text-slate-500">
            Rent Smarter. Build Better.
          </p>
        </div>
      </div>
    </footer>
  );
}
