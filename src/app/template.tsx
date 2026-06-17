"use client";

import React from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Define tailored luxury animations depending on which page/section the user navigates to
  const getVariants = () => {
    if (pathname.includes("/about")) {
      // 1. About Us: Sophisticated slide-in from the left with a spring transition
      return {
        initial: { opacity: 0, x: -35 },
        animate: { opacity: 1, x: 0 },
        transition: { type: "spring", stiffness: 100, damping: 18 } as any
      };
    }
    
    if (pathname.includes("/contact")) {
      // 2. Contact Us: Clean expansion / luxury scale-up and fade-in
      return {
        initial: { opacity: 0, scale: 0.96, y: 10 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: { type: "spring", stiffness: 110, damping: 16 } as any
      };
    }
    
    if (pathname.includes("/blogs")) {
      // 3. Blogs: Vertical ease-up animation (news-timeline layout feel)
      return {
        initial: { opacity: 0, y: 40 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } as any
      };
    }
    
    if (pathname.includes("/shop") || pathname.includes("/product")) {
      // 4. Shop / Sweet Categories: Cascade-down effect from the top for shop listings
      return {
        initial: { opacity: 0, y: -25 },
        animate: { opacity: 1, y: 0 },
        transition: { type: "spring", stiffness: 100, damping: 17 } as any
      };
    }

    if (pathname.includes("/cart")) {
      // 5. Shopping Cart: Soft bottom-up transition
      return {
        initial: { opacity: 0, y: 25 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: "easeOut" } as any
      };
    }

    if (pathname.includes("/checkout")) {
      // 6. Checkout: Very stable, calm scale transition for security feel
      return {
        initial: { opacity: 0, scale: 0.98 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } as any
      };
    }

    if (pathname.includes("/account")) {
      // 7. Account/Dashboard: Gentle scale and fade for cards
      return {
        initial: { opacity: 0, scale: 0.98 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.4, ease: "easeOut" } as any
      };
    }

    if (pathname.includes("/policy")) {
      // 8. Policy Pages: Elegant subtle fade with text slide
      return {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: "easeInOut" } as any
      };
    }

    // Default transition for the landing homepage and other routes
    return {
      initial: { opacity: 0, y: 15 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] } as any
    };
  };

  const { initial, animate, transition } = getVariants();

  return (
    <motion.div
      key={pathname}
      initial={initial}
      animate={animate}
      transition={transition}
      className="w-full flex-grow flex flex-col"
    >
      {children}
    </motion.div>
  );
}
