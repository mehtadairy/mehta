import type { Metadata } from "next";
import { Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";
import MobileNavBar from "@/components/MobileNavBar";
import ToastContainer from "@/components/Toast";
import SplashLoader from "@/components/SplashLoader";

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
  title: "Mehta Sweet Mart | Premium Sweets, Farsan, Namkeen & Gift Boxes",
  description: "Experience the ultimate luxury of authentic Indian sweets, handmade delicacies, crispy farsan, and premium gift boxes from Mehta Sweet Mart since 1952.",
  keywords: ["Sweets", "Farsan", "Namkeen", "Indian Sweets", "Gift Boxes", "Mehta Dairy", "Rajkot Sweets", "Ahmedabad Sweets"],
  openGraph: {
    title: "Mehta Sweet Mart | Premium Sweets",
    description: "Experience the ultimate luxury of authentic Indian sweets, handmade delicacies, and premium gift boxes from Mehta Sweet Mart since 1952.",
    url: "https://mehtadairy.com",
    siteName: "Mehta Sweet Mart",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mehta Sweet Mart | Premium Sweets",
    description: "Authentic Indian sweets and farsan.",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mehta Sweet Mart",
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
      <body className="min-h-full font-sans flex flex-col bg-background text-foreground animate-fade-in">
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
        {children}
        <MobileNavBar />
        <ToastContainer />
        <SplashLoader />
      </body>
    </html>
  );
}
