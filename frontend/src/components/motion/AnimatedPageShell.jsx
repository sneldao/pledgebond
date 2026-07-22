import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * AnimatedPageShell — cinematic entrance wrapper for all pages.
 * 
 * Provides consistent page-level motion: scale + fade + optional screen shake.
 * Replaces ad-hoc fade-in patterns across the app.
 * 
 * Props:
 *  - shakeOnLoad: boolean (trigger subtle screen shake on mount)
 *  - initialScale: number (default 0.96)
 *  - duration: number (default 0.6)
 *  - className: string
 */
export default function AnimatedPageShell({
  children,
  shakeOnLoad = false,
  initialScale = 0.96,
  duration = 0.6,
  className = "",
}) {
  const [screenShake, setScreenShake] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!shakeOnLoad) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let shakeIntensity = 6;
    const shakeInterval = setInterval(() => {
      setScreenShake({
        x: (Math.random() - 0.5) * shakeIntensity,
        y: (Math.random() - 0.5) * shakeIntensity,
      });
      shakeIntensity *= 0.7;
      if (shakeIntensity < 0.5) {
        clearInterval(shakeInterval);
        setScreenShake({ x: 0, y: 0 });
      }
    }, 16);

    return () => clearInterval(shakeInterval);
  }, [shakeOnLoad]);

  return (
    <motion.div
      className={`min-h-[100dvh] w-full ${className}`}
      initial={{ opacity: 0, y: 30, scale: initialScale }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        x: screenShake.x || 0,
      }}
      transition={{ 
        duration, 
        ease: [0.23, 1, 0.32, 1],
        type: shakeOnLoad ? "spring" : "tween",
        stiffness: shakeOnLoad ? 120 : undefined,
        damping: shakeOnLoad ? 14 : undefined,
      }}
      style={{
        transform: screenShake.x || screenShake.y 
          ? `translate(${screenShake.x}px, ${screenShake.y}px)` 
          : undefined,
      }}
    >
      {children}
    </motion.div>
  );
}
