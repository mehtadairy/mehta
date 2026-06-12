import type { Metadata } from "next";
import { Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Mehta Sweet Mart | Premium Sweets, Farsan, Namkeen & Gift Boxes",
  description: "Experience the ultimate luxury of authentic Indian sweets, handmade delicacies, crispy farsan, and premium gift boxes from Mehta Sweet Mart.",
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
      <body className="min-h-full font-sans flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
