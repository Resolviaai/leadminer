"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function TopProgressBar() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (target && target.href && target.target !== "_blank") {
        try {
          const url = new URL(target.href);
          if (
            url.origin === window.location.origin &&
            url.pathname !== window.location.pathname
          ) {
            setIsNavigating(true);
          }
        } catch {
          // ignore
        }
      }
    };

    document.addEventListener("click", handleLinkClick);
    return () => document.removeEventListener("click", handleLinkClick);
  }, []);

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-primary/20 overflow-hidden pointer-events-none">
      <div className="h-full bg-primary animate-pulse w-full origin-left" />
    </div>
  );
}
