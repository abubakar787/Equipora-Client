
"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  Menu,
  X,
  MapPin,
  Clock3,
  ShieldCheck,
  Truck,
  Headphones,
  Star,
  CheckCircle2,
  HardHat,
  Camera,
  Tractor,
  Zap,
  CalendarDays,
  Package,
  RefreshCw,
  Wrench,
} from "lucide-react";

// ============================================
// API CONFIGURATION
// ============================================

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ============================================
// TYPES
// ============================================

type Equipment = {
  _id: string;
  title: string;
  description: string;
  categoryName?: string;
  location: string;
  rentalType: "hourly" | "daily" | "weekly" | "monthly";
  price: number;
  pricing?: {
    hourly?: number;
    daily?: number;
    weekly?: number;
    monthly?: number;
  };
  quantity: number;
  images: string[];
};

type ApiResponse = {
  success: boolean;
  message: string;
  data: Equipment[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

// ============================================
// STATIC CONTENT
// ============================================

const categories = [
  {
    name: "Construction",
    description: "Build with confidence",
    icon: HardHat,
    number: "01",
  },
  {
    name: "Photography",
    description: "Capture every moment",
    icon: Camera,
    number: "02",
  },
  {
    name: "Vehicles",
    description: "Move your projects",
    icon: Truck,
    number: "03",
  },
  {
    name: "Agriculture",
    description: "Power your harvest",
    icon: Tractor,
    number: "04",
  },
  {
    name: "Electronics",
    description: "Technology on demand",
    icon: Zap,
    number: "05",
  },
  {
    name: "Event",
    description: "Make events memorable",
    icon: CalendarDays,
    number: "06",
  },
];

const benefits = [
  {
    icon: ShieldCheck,
    title: "Verified Equipment Owners",
    description:
      "Find equipment from responsible owners with a transparent rental process.",
  },
  {
    icon: Package,
    title: "Flexible Rental Options",
    description:
      "Choose rental durations that work for your project and your budget.",
  },
  {
    icon: Clock3,
    title: "Save Time & Resources",
    description:
      "Get access to the equipment you need without the cost of ownership.",
  },
  {
    icon: Headphones,
    title: "Support When You Need It",
    description:
      "Enjoy a straightforward experience from discovery to rental completion.",
  },
];

const testimonials = [
  {
    name: "Daniel Carter",
    role: "Construction Project Manager",
    rating: 5,
    comment:
      "Finding the right machinery used to take days. EQUIPORA made the process much easier and more organized.",
    initials: "DC",
  },
  {
    name: "Sophia Williams",
    role: "Creative Studio Owner",
    rating: 5,
    comment:
      "A convenient way to access professional equipment without making a huge investment upfront.",
    initials: "SW",
  },
  {
    name: "Michael Anderson",
    role: "Independent Contractor",
    rating: 5,
    comment:
      "The rental options are flexible, and discovering equipment for different projects feels effortless.",
    initials: "MA",
  },
  {
    name: "Olivia Brown",
    role: "Event Organizer",
    rating: 5,
    comment:
      "EQUIPORA brings equipment discovery and rental management together in one simple experience.",
    initials: "OB",
  },
];

// ============================================
// HERO SLIDER DATA
// ============================================

const heroSlides = [
  {
    title: "Excavators",
    category: "Construction Equipment",
    description: "Powerful machinery for demanding construction projects.",
    image:
      "https://images.unsplash.com/photo-1580901368919-7738efb0f87e?auto=format&fit=crop&w=1200&q=85",
    number: "01",
  },
  {
    title: "Heavy Machinery",
    category: "Industrial Equipment",
    description: "Reliable equipment to keep your operation moving.",
    image:
      "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=85",
    number: "02",
  },
  {
    title: "Professional Tools",
    category: "Project Equipment",
    description: "The right tools for precision and productivity.",
    image:
      "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1200&q=85",
    number: "03",
  },
  {
    title: "Industrial Equipment",
    category: "Power & Machinery",
    description: "Find equipment that helps bring big ideas to life.",
    image:
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=85",
    number: "04",
  },
];

// ============================================
// ANIMATION VARIANTS
// ============================================

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: "easeOut" as const,
    },
  },
};

// ============================================
// REUSABLE SECTION HEADING
// ============================================

function SectionHeading({
  eyebrow,
  title,
  description,
  light = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  light?: boolean;
}) {
  return (
    <div className="max-w-2xl">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
        {eyebrow}
      </p>

      <h2
        className={`text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl ${
          light ? "text-white" : "text-[#101D2C]"
        }`}
      >
        {title}
      </h2>

      <p
        className={`mt-4 text-base leading-7 ${
          light ? "text-slate-300" : "text-slate-500"
        }`}
      >
        {description}
      </p>
    </div>
  );
}

// ============================================
// EQUIPMENT CARD
// ============================================

function EquipmentCard({ equipment }: { equipment: Equipment }) {
  const image = equipment.images?.[0];

  return (
    <motion.article
      variants={itemVariants}
      whileHover={{ y: -7 }}
      className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-slate-900/10"
    >
      <Link
        href={`/equipment/${equipment._id}`}
        className="block"
        aria-label={`View ${equipment.title}`}
      >
        <div className="relative h-56 overflow-hidden bg-slate-100">
          {image ? (
            <Image
              src={image}
              alt={equipment.title}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-14 w-14 text-slate-300" />
            </div>
          )}

          <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#101D2C] shadow-sm backdrop-blur">
            {equipment.categoryName || "Equipment"}
          </div>

          <div className="absolute bottom-4 right-4 rounded-lg bg-[#101D2C]/90 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
            {equipment.quantity} available
          </div>
        </div>

        <div className="p-5">
          <div className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-emerald-600" />
            <span className="truncate">{equipment.location}</span>
          </div>

          <h3 className="line-clamp-1 text-lg font-bold text-[#101D2C] transition-colors group-hover:text-emerald-700">
            {equipment.title}
          </h3>

          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
            {equipment.description}
          </p>

          <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
            <div>
              <p className="text-xs text-slate-500">Starting from</p>

              <p className="mt-1 text-xl font-bold text-[#101D2C]">
                ${Number(equipment.price).toLocaleString("en-US")}
                <span className="ml-1 text-xs font-medium text-slate-500">
                  / {equipment.rentalType}
                </span>
              </p>
            </div>

            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition-all group-hover:bg-emerald-600 group-hover:text-white">
              <ArrowUpRight className="h-5 w-5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

// ============================================
// EQUIPMENT LOADING SKELETON
// ============================================

function EquipmentSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="h-56 bg-slate-200" />

      <div className="space-y-3 p-5">
        <div className="h-3 w-1/3 rounded bg-slate-200" />
        <div className="h-5 w-3/4 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="mt-5 h-10 rounded bg-slate-100" />
      </div>
    </div>
  );
}

// ============================================
// MAIN HOMEPAGE
// ============================================

export default function Home() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

  // ------------------------------------------
  // AUTOMATIC HERO SLIDER
  // ------------------------------------------

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHeroSlide(
        (current) => (current + 1) % heroSlides.length
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // ------------------------------------------
  // FETCH EQUIPMENT FROM BACKEND
  // ------------------------------------------

  const fetchEquipment = useCallback(async (searchTerm = "") => {
    if (!API_URL) {
      setError(
        "API configuration is missing. Please check your environment variables."
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        limit: "6",
        page: "1",
        sort: "newest",
      });

      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }

      const response = await fetch(
        `${API_URL}/api/equipment?${params.toString()}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(`Equipment API returned ${response.status}`);
      }

      const result: ApiResponse = await response.json();

      if (!result.success || !Array.isArray(result.data)) {
        throw new Error(
          result.message || "Unable to retrieve equipment."
        );
      }

      setEquipment(result.data);
    } catch (err) {
      console.error("Equipment fetch error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading equipment."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEquipment();
  }, [fetchEquipment]);

  // ------------------------------------------
  // SEARCH HANDLER
  // ------------------------------------------

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void fetchEquipment(search);
  };

  const closeMenu = () => setMobileMenuOpen(false);

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <main className="min-h-screen overflow-hidden bg-[#F7F9FC]">

      {/* ======================================
          NAVBAR
      ====================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">

          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#101D2C] text-emerald-400">
              <Wrench className="h-5 w-5" />
            </div>

            <div>
              <span className="block text-xl font-black tracking-[0.08em] text-[#101D2C]">
                EQUIP<span className="text-emerald-600">ORA</span>
              </span>

              <span className="block text-[9px] font-semibold tracking-[0.22em] text-slate-500">
                RENT SMARTER. BUILD BETTER.
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            <Link href="/" className="text-sm font-semibold text-emerald-700">
              Home
            </Link>

            <Link
              href="/equipment"
              className="text-sm font-medium text-slate-600 transition hover:text-emerald-700"
            >
              Equipment
            </Link>

            <a
              href="#categories"
              className="text-sm font-medium text-slate-600 transition hover:text-emerald-700"
            >
              Categories
            </a>

            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-600 transition hover:text-emerald-700"
            >
              How it works
            </a>

            <a
              href="#about"
              className="text-sm font-medium text-slate-600 transition hover:text-emerald-700"
            >
              About
            </a>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#101D2C] transition hover:bg-slate-100"
            >
              Log in
            </Link>

            <Link
              href="/register"
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              Get Started <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-[#101D2C] lg:hidden"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-5 py-5 shadow-xl lg:hidden">
            <nav className="flex flex-col gap-4">
              <Link href="/" onClick={closeMenu} className="font-semibold">
                Home
              </Link>

              <Link href="/equipment" onClick={closeMenu}>
                Equipment
              </Link>

              <a href="#categories" onClick={closeMenu}>
                Categories
              </a>

              <a href="#how-it-works" onClick={closeMenu}>
                How it works
              </a>

              <a href="#about" onClick={closeMenu}>
                About
              </a>

              <div className="flex gap-3 border-t border-slate-100 pt-4">
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold"
                >
                  Log in
                </Link>

                <Link
                  href="/register"
                  onClick={closeMenu}
                  className="flex-1 rounded-xl bg-emerald-600 py-3 text-center text-sm font-bold text-white"
                >
                  Get Started
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ======================================
          HERO SECTION
      ====================================== */}

      <section className="relative isolate overflow-hidden bg-[#101D2C]">

        {/* Background image */}

        <div className="absolute inset-0 -z-20">
          <Image
            src="https://images.unsplash.com/photo-1580901368919-7738efb0f87e?auto=format&fit=crop&w=2000&q=85"
            alt="Heavy construction machinery"
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover object-center opacity-35"
          />
        </div>

        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#101D2C] via-[#101D2C]/95 to-[#101D2C]/45" />

        <div className="absolute -right-40 -top-40 -z-10 h-[500px] w-[500px] rounded-full border border-emerald-400/10" />

        <div className="absolute -right-20 -top-20 -z-10 h-[350px] w-[350px] rounded-full border border-emerald-400/10" />

        <div className="mx-auto grid min-h-[650px] max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-24">

          {/* LEFT CONTENT */}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold tracking-wide text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#10B981]" />
              THE SMARTER WAY TO RENT EQUIPMENT
            </div>

            <h1 className="text-5xl font-black leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-[68px]">
              The Right Tools.
              <br />
              The Right Time.
              <br />
              <span className="text-emerald-400">
                Your Next Project.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              Discover quality equipment, connect with trusted owners, and
              rent what you need. Build more without the burden of ownership.
            </p>

            {/* SEARCH FORM */}

            <form
              onSubmit={handleSearch}
              className="mt-9 flex max-w-xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/20 sm:flex-row"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <Search className="h-5 w-5 shrink-0 text-emerald-600" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search equipment or machinery..."
                  className="h-12 w-full min-w-0 bg-transparent text-sm text-[#101D2C] outline-none placeholder:text-slate-400"
                  aria-label="Search equipment"
                />
              </div>

              <button
                type="submit"
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                Search Equipment
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-slate-300">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Flexible rental
              </span>

              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Trusted owners
              </span>

              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Simple booking
              </span>
            </div>
          </motion.div>

          {/* RIGHT SIDE EQUIPMENT SLIDER */}

          <motion.div
            initial={{ opacity: 0, scale: 0.94, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative ml-auto aspect-[4/4.5] max-w-[480px] overflow-hidden rounded-[2rem] border border-white/15 bg-[#1A2A3A] shadow-2xl">

              {/* SLIDING IMAGE */}

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeHeroSlide}
                  initial={{ opacity: 0, scale: 1.06 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.03 }}
                  transition={{ duration: 1 }}
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${heroSlides[activeHeroSlide].image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              </AnimatePresence>

              {/* IMAGE OVERLAY */}

              <div className="absolute inset-0 bg-gradient-to-t from-[#101D2C] via-[#101D2C]/10 to-[#101D2C]/5" />

              {/* TOP LABEL */}

              <div className="absolute left-6 top-6 z-10 flex items-center gap-2 rounded-full border border-white/20 bg-[#101D2C]/50 px-4 py-2 backdrop-blur-md">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

                <span className="text-[10px] font-bold tracking-[0.18em] text-white">
                  EXPLORE EQUIPMENT
                </span>
              </div>

              {/* FLOATING TRUST BADGE */}

              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -left-12 top-14 z-20 rounded-2xl border border-white/50 bg-white/95 p-4 shadow-xl backdrop-blur"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <ShieldCheck className="h-6 w-6" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-[#101D2C]">
                      Trusted marketplace
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Rent with confidence
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* BOTTOM SLIDE INFORMATION */}

              <div className="absolute bottom-0 left-0 right-0 z-10 p-7 sm:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`content-${activeHeroSlide}`}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.7 }}
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-400">
                      {heroSlides[activeHeroSlide].category}
                    </p>

                    <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                      {heroSlides[activeHeroSlide].title}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {heroSlides[activeHeroSlide].description}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* SLIDER INDICATORS */}

                <div className="mt-7 flex items-center justify-between">
                  <span className="text-xs font-bold tracking-widest text-white/70">
                    {heroSlides[activeHeroSlide].number}
                    <span className="mx-2 text-white/30">/</span>
                    04
                  </span>

                  <div className="flex items-center gap-2">
                    {heroSlides.map((slide, index) => (
                      <button
                        key={slide.number}
                        type="button"
                        onClick={() => setActiveHeroSlide(index)}
                        aria-label={`Show ${slide.title}`}
                        className={`h-2 rounded-full transition-all duration-500 ${
                          activeHeroSlide === index
                            ? "w-9 bg-emerald-400"
                            : "w-2 bg-white/50 hover:bg-white"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* DECORATIVE CIRCLES */}

            <div className="absolute -right-8 -top-8 -z-10 h-40 w-40 rounded-full border border-emerald-400/20" />

            <div className="absolute -bottom-8 -left-8 -z-10 h-32 w-32 rounded-full border border-emerald-400/20" />
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-70" />
      </section>

      {/* ======================================
          TRUST STRIP
      ====================================== */}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-8 sm:px-8 md:grid-cols-4 lg:px-10">
          {[
            ["Flexible", "Rental durations"],
            ["Verified", "Equipment owners"],
            ["Secure", "Booking process"],
            ["Simple", "Equipment discovery"],
          ].map(([heading, subheading]) => (
            <div key={heading} className="text-center">
              <p className="text-lg font-extrabold text-[#101D2C]">
                {heading}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {subheading}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================
          CATEGORIES
      ====================================== */}

      <section
        id="categories"
        className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10"
      >
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Explore by category"
            title="Everything your project needs."
            description="Explore equipment across different industries and find the right tools for your next job."
          />

          <Link
            href="/equipment"
            className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 transition hover:gap-3"
          >
            Explore all equipment
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
        >
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <motion.div key={category.name} variants={itemVariants}>
                <Link
                  href="/equipment"
                  className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-900/5"
                >
                  <span className="text-xs font-bold text-slate-300">
                    {category.number}
                  </span>

                  <div className="my-6 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="text-sm font-bold text-[#101D2C]">
                    {category.name}
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {category.description}
                  </p>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ======================================
          FEATURED EQUIPMENT
      ====================================== */}

      <section id="featured" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading
              eyebrow="Featured equipment"
              title="Ready when you are."
              description="Discover recently listed equipment from our marketplace. Every listing shown here is retrieved from our live equipment API."
            />

            <Link
              href="/equipment"
              className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 transition hover:gap-3"
            >
              View all equipment
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <EquipmentSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <div className="mt-12 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
              <Package className="mx-auto h-10 w-10 text-red-500" />

              <h3 className="mt-4 text-lg font-bold text-[#101D2C]">
                Could not load equipment
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">
                {error}
              </p>

              <button
                onClick={() => fetchEquipment(search)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#101D2C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
            </div>
          ) : equipment.length === 0 ? (
            <div className="mt-12 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
              <Package className="mx-auto h-12 w-12 text-slate-300" />

              <h3 className="mt-4 text-xl font-bold text-[#101D2C]">
                {search
                  ? "No matching equipment found"
                  : "Equipment is coming soon"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {search
                  ? "Try another search term to discover available equipment."
                  : "Approved equipment listings will appear here as owners add their products."}
              </p>

              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                    void fetchEquipment();
                  }}
                  className="mt-5 text-sm font-bold text-emerald-700"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              {search && (
                <div className="mt-8 flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    Search results for{" "}
                    <span className="font-bold text-[#101D2C]">
                      &quot;{search}&quot;
                    </span>
                  </p>

                  <button
                    onClick={() => {
                      setSearch("");
                      void fetchEquipment();
                    }}
                    className="text-sm font-semibold text-emerald-700"
                  >
                    Clear search
                  </button>
                </div>
              )}

              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {equipment.map((item) => (
                  <EquipmentCard key={item._id} equipment={item} />
                ))}
              </motion.div>
            </>
          )}
        </div>
      </section>

      {/* ======================================
          HOW IT WORKS
      ====================================== */}

      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10"
      >
        <div className="mx-auto max-w-2xl text-center">
          <SectionHeading
            eyebrow="How EQUIPORA works"
            title="Rent in three simple steps."
            description="A straightforward process that helps you find equipment and move your project forward."
          />
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {[
            {
              number: "01",
              title: "Discover equipment",
              description:
                "Browse equipment listings and find the tools that fit your project requirements.",
              icon: Search,
            },
            {
              number: "02",
              title: "Book your rental",
              description:
                "Choose your rental dates, quantity and delivery information to submit a booking.",
              icon: CalendarDays,
            },
            {
              number: "03",
              title: "Get to work",
              description:
                "Complete the payment process and move forward with your project.",
              icon: CheckCircle2,
            },
          ].map((step, index) => {
            const Icon = step.icon;

            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.12, duration: 0.5 }}
                className="relative rounded-2xl border border-slate-200 bg-white p-8"
              >
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-black text-slate-100">
                    {step.number}
                  </span>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>

                <h3 className="mt-7 text-xl font-bold text-[#101D2C]">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ======================================
          WHY CHOOSE EQUIPORA
      ====================================== */}

      <section id="about" className="bg-[#101D2C] py-24">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:items-center lg:px-10">
          <div>
            <SectionHeading
              eyebrow="Why choose EQUIPORA"
              title="More access. Less ownership."
              description="We make equipment rental simpler by bringing equipment discovery, owners and renters together in one marketplace."
              light
            />

            <div className="mt-10 grid gap-7 sm:grid-cols-2">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <div key={benefit.title} className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="font-bold text-white">
                        {benefit.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 sm:p-10">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
                Built for every project
              </p>

              <h3 className="mt-5 text-3xl font-bold leading-tight text-white sm:text-4xl">
                Your equipment needs, all in one place.
              </h3>

              <p className="mt-5 leading-7 text-slate-400">
                Whether you are a business looking for reliable equipment or
                an owner looking to make better use of your assets, EQUIPORA
                brings both sides together.
              </p>

              <div className="mt-9 space-y-4">
                {[
                  "Find equipment that matches your project",
                  "Explore flexible rental pricing",
                  "Manage bookings in one place",
                  "Connect with equipment owners",
                ].map((text) => (
                  <div key={text} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                    <span className="text-sm text-slate-200">
                      {text}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href="/equipment"
                className="mt-10 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                Explore marketplace
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================
          TESTIMONIALS
      ====================================== */}

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10">
        <SectionHeading
          eyebrow="Customer experiences"
          title="Built around better experiences."
          description="A great rental experience starts with a marketplace designed around the people who use it."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((review, index) => (
            <motion.div
              key={review.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex gap-1 text-amber-400">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>

              <p className="mt-5 min-h-28 text-sm leading-7 text-slate-600">
                &quot;{review.comment}&quot;
              </p>

              <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                  {review.initials}
                </div>

                <div>
                  <p className="text-sm font-bold text-[#101D2C]">
                    {review.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {review.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="mt-5 text-xs text-slate-400">
          Sample testimonial content for the initial homepage design.
        </p>
      </section>

      {/* ======================================
          CALL TO ACTION
      ====================================== */}

      <section className="px-5 pb-24 sm:px-8 lg:px-10">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-emerald-600 px-7 py-14 sm:px-12 lg:px-16">
          <div className="absolute -right-20 -top-32 h-96 w-96 rounded-full border-[50px] border-white/10" />

          <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">
                Ready to get started?
              </p>

              <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
                Make your next project happen.
              </h2>

              <p className="mt-4 max-w-xl leading-7 text-emerald-50">
                Discover equipment, connect with owners and get the tools you
                need to move forward.
              </p>
            </div>

            <Link
              href="/equipment"
              className="inline-flex shrink-0 items-center justify-center gap-3 rounded-xl bg-white px-7 py-4 text-sm font-bold text-emerald-800 shadow-lg transition hover:-translate-y-1 hover:bg-emerald-50"
            >
              Browse Equipment
              <ArrowUpRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================
          FOOTER
      ====================================== */}

      <footer className="bg-[#0B1521] text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-2 lg:grid-cols-4 lg:px-10">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
                <Wrench className="h-5 w-5" />
              </div>

              <span className="text-xl font-black tracking-[0.08em]">
                EQUIP<span className="text-emerald-400">ORA</span>
              </span>
            </Link>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
              A smarter equipment rental marketplace. Discover quality
              equipment, connect with trusted owners and build better.
            </p>

            <p className="mt-5 text-xs font-semibold tracking-wider text-emerald-400">
              RENT SMARTER. BUILD BETTER.
            </p>
          </div>

          <div>
            <h3 className="font-bold">Marketplace</h3>

            <div className="mt-5 flex flex-col gap-3 text-sm text-slate-400">
              <Link
                href="/equipment"
                className="transition hover:text-emerald-400"
              >
                All Equipment
              </Link>

              <a
                href="#categories"
                className="transition hover:text-emerald-400"
              >
                Categories
              </a>

              <a
                href="#how-it-works"
                className="transition hover:text-emerald-400"
              >
                How it works
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-bold">Account</h3>

            <div className="mt-5 flex flex-col gap-3 text-sm text-slate-400">
              <Link
                href="/login"
                className="transition hover:text-emerald-400"
              >
                Log in
              </Link>

              <Link
                href="/register"
                className="transition hover:text-emerald-400"
              >
                Create account
              </Link>

              <Link
                href="/dashboard"
                className="transition hover:text-emerald-400"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-5 py-6 text-xs text-slate-500 sm:px-8 md:flex-row lg:px-10">
            <p>
              © {new Date().getFullYear()} EQUIPORA. All rights reserved.
            </p>

            <p>Rent Smarter. Build Better.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
