
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import { AuthProvider } from "@/components/providers/auth-provider";
import SiteHeader from "@/components/ui/shared/site-header";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "EQUIPORA | Rent Smarter. Build Better.",
    template: "%s | EQUIPORA",
  },
  description:
    "EQUIPORA is a smarter equipment rental marketplace. Discover, compare, and rent quality equipment for your next project.",
  applicationName: "EQUIPORA",
  keywords: [
    "Equipment Rental",
    "Construction Equipment",
    "Machinery Rental",
    "Equipment Marketplace",
    "EQUIPORA",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          {/* Global navigation for all pages */}
          <SiteHeader />

          {/* Page content */}
          <main className="flex-1">{children}</main>

          <Toaster
            position="top-right"
            richColors
            closeButton
            expand={false}
            duration={4000}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
