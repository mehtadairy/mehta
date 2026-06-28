import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  scope: "/",
});

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['playwright-core', '@sparticuz/chromium-min', 'playwright'],
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['./node_modules/playwright-core/**/*'],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        // Allow any https hostname — covers Supabase CDN, uploaded product images, etc.
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  turbopack: {},
};

export default withPWA(nextConfig);
