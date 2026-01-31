"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    // Only animate if pathname actually changed (not on initial mount)
    if (prevPathname.current !== pathname) {
      setShouldAnimate(true);
      prevPathname.current = pathname;
    }
  }, [pathname]);

  // If we shouldn't animate (first load), render without motion
  if (!shouldAnimate) {
    return <>{children}</>;
  }

  // Animate on navigation
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
