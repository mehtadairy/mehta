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
import { Analytics } from "@vercel/analytics/next";
import { BUSINESS } from '@/lib/businessConfig';
import AuthSync from "@/components/AuthSync";
import Script from "next/script";

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
  metadataBase: new URL('https://mehtadairy.com'),
  alternates: {
    canonical: 'https://mehtadairy.com',
  },
  title: {
    default: `${BUSINESS.name} | Premium Sweets, Farsan, Namkeen & Gift Boxes`,
    template: `%s | ${BUSINESS.name}`,
  },
  description: `Experience authentic Indian sweets, handmade delicacies, crispy farsan, Kesar Penda, Mohanthal, and premium gift boxes from ${BUSINESS.name} since ${BUSINESS.foundedYear}. Fast shipping across India.`,
  keywords: [
    "Mehta Dairy",
    "Premium Sweets",
    "Gujarati Sweets",
    "Namkeen",
    "Kesar Penda",
    "Mohanthal",
    "Gathiya",
    "Dry Fruit Sweets",
    "Online Sweet Shop",
    "Ahmedabad Sweets",
    "Fresh Mithai",
    "Traditional Gujarati Snacks",
    "Gift Boxes",
    "Festival Sweets",
    "Diwali Gifts",
    "Raksha Bandhan Sweets",
    "Wedding Sweets",
    "Palitana Sweets"
  ],
  openGraph: {
    title: `${BUSINESS.name} | Authentic Gujarati Sweets & Namkeen`,
    description: `Order authentic Indian sweets, handmade delicacies, crispy farsan, and festival gift boxes online from ${BUSINESS.name}.`,
    url: "https://mehtadairy.com",
    siteName: BUSINESS.name,
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${BUSINESS.name} | Premium Sweets & Farsan`,
    description: "Authentic Gujarati sweets, farsan, and gift boxes delivered fresh across India.",
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
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

import { CustomerAuthProvider } from "@/lib/context/CustomerAuthContext";

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
        {/* Structured Data (JSON-LD) for LocalBusiness & WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "SweetShop",
                  "@id": "https://mehtadairy.com/#store",
                  "name": BUSINESS.name,
                  "url": "https://mehtadairy.com",
                  "logo": "https://mehtadairy.com/icon.png",
                  "image": "https://mehtadairy.com/og-image.jpg",
                  "description": "Authentic Gujarati sweets, handmade delicacies, crispy farsan, Kesar Penda, Mohanthal, and premium gift boxes since 1972.",
                  "telephone": "+919913252232",
                  "priceRange": "₹₹",
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "Taleti Road",
                    "addressLocality": "Palitana",
                    "addressRegion": "Gujarat",
                    "postalCode": "364270",
                    "addressCountry": "IN"
                  },
                  "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": 21.5214,
                    "longitude": 71.5172
                  },
                  "openingHoursSpecification": [
                    {
                      "@type": "OpeningHoursSpecification",
                      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                      "opens": "09:00",
                      "closes": "22:00"
                    }
                  ]
                },
                {
                  "@type": "WebSite",
                  "@id": "https://mehtadairy.com/#website",
                  "url": "https://mehtadairy.com",
                  "name": BUSINESS.name,
                  "description": "Premium Gujarati Sweets & Namkeen Shop",
                  "publisher": {
                    "@id": "https://mehtadairy.com/#store"
                  },
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://mehtadairy.com/shop?search={search_term_string}",
                    "query-input": "required name=search_term_string"
                  }
                }
              ]
            })
          }}
        />
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
        
        {/* Google Translate Script */}
        <div id="google_translate_element" className="hidden"></div>
        <Script id="google-translate-init" strategy="afterInteractive">
          {`
            function googleTranslateElementInit() {
              new google.translate.TranslateElement({
                pageLanguage: 'en',
                includedLanguages: 'gu,hi,en',
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false,
              }, 'google_translate_element');
            }
          `}
        </Script>
        <Script
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />

        {/* Global scroll restoration — instant on page nav, smooth on filter changes */}
        <Suspense fallback={null}>
          <GlobalScrollManager />
          <AuthSync />
        </Suspense>
        <LanguageProvider>
          <LocationProvider>
            <CustomerAuthProvider>
              <div className="flex-1">
                {children}
              </div>
              <MobileNavBar />
              <ToastContainer />
              <SplashLoader />
            </CustomerAuthProvider>
          </LocationProvider>
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
