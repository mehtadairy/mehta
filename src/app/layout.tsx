import type { Metadata } from "next";
import { Playfair_Display, Outfit } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import ToastContainer from "@/components/Toast";
import SplashLoader from "@/components/SplashLoader";
import GlobalScrollManager from "@/components/ScrollToTop";
import MobileNavBar from "@/components/MobileNavBar";
import { LanguageProvider } from "@/lib/context/LanguageContext";
import { LocationProvider } from "@/lib/context/LocationContext";
import { Toaster } from 'sonner';
import { Analytics } from "@vercel/analytics/react";
import { BUSINESS } from '@/lib/businessConfig';

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const viewport = {
  themeColor: "#D46D2D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: `${BUSINESS.name} | Premium Sweets, Farsan, Namkeen & Gift Boxes`,
  description: `Experience the ultimate luxury of authentic Indian sweets, handmade delicacies, crispy farsan, and premium gift boxes from ${BUSINESS.name} since ${BUSINESS.foundedYear}.`,
  keywords: ["Sweets", "Farsan", "Namkeen", "Indian Sweets", "Gift Boxes", BUSINESS.shortName, "Palitana Sweets", "Gujarat Sweets"],
  openGraph: {
    title: `${BUSINESS.name} | Premium Sweets`,
    description: `Experience the ultimate luxury of authentic Indian sweets, handmade delicacies, and premium gift boxes from ${BUSINESS.name} since ${BUSINESS.foundedYear}.`,
    url: "https://mehtadairy.com",
    siteName: BUSINESS.name,
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${BUSINESS.name} | Premium Sweets`,
    description: "Authentic Indian sweets and farsan.",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: BUSINESS.name,
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${outfit.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full font-sans flex flex-col bg-background text-foreground animate-fade-in">
        {/* Google Analytics - Replace G-XXXXXXX with actual ID */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-XXXXXXX', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
        {/* Global scroll restoration — instant on page nav, smooth on filter changes */}
        <Suspense fallback={null}>
          <GlobalScrollManager />
        </Suspense>
        <LanguageProvider>
          <LocationProvider>
            <div className="flex-1">
              {children}
            </div>
            <MobileNavBar />
            <ToastContainer />
            <SplashLoader />
          </LocationProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
