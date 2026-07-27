"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * GlobalScrollManager
 *
 * Handles ALL scroll restoration needs across the entire app:
 *
 * 1. Disables browser's native scroll restoration (which re-opens pages
 *    at the previous position) — runs once on mount.
 *
 * 2. On every pathname change (page navigation):
 *    → Instantly resets to top (no animation so new page appears clean).
 *
 * 3. On searchParam changes within the same page (category, filter, search):
 *    → Smooth-scrolls to top so the transition feels intentional, not jarring.
 *
 * Mount once inside root layout wrapped in <Suspense fallback={null}>.
 * Renders nothing — zero visual impact.
 */
export default function GlobalScrollManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track the previous pathname to distinguish page changes from filter changes
  const prevPathname = useRef<string>(pathname);
  const isFirstMount = useRef(true);

  // ── Step 1: Disable browser scroll restoration once, globally ─────────────
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  // ── Step 2 & 3: Reset scroll on route changes ─────────────────────────────
  useEffect(() => {
    // Skip the very first mount (page has just loaded — position is already 0)
    if (isFirstMount.current) {
      isFirstMount.current = false;
      prevPathname.current = pathname;
      return;
    }

    const isPageChange = pathname !== prevPathname.current;
    prevPathname.current = pathname;

    if (isPageChange) {
      // Hard page navigation: instant snap — feels like a fresh page load
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } else {
      // Same page, filter/category/search changed: smooth scroll — feels intentional
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  }, [pathname, searchParams]);

  return null;
}
