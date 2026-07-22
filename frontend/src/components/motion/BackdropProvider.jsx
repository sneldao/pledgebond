import React, { useRef } from "react";
import ParticleField from "@/components/ParticleField";

/**
 * BackdropProvider — dynamic particle backdrop available on any page.
 * 
 * Provides the gold/burgundy particle field + vignette for consistent atmosphere.
 * Exposes imperative API for particle bursts from child components.
 * 
 * Props:
 *  - children: React nodes
 *  - enableParticles: boolean (default true)
 *  - enableVignette: boolean (default true)
 */
export default function BackdropProvider({
  children,
  enableParticles = true,
  enableVignette = true,
}) {
  const particleRef = useRef(null);

  // Expose burst API via context if needed, or children can access via ref
  const triggerBurst = (x, y) => {
    if (particleRef.current) {
      particleRef.current.burst(x, y);
    }
  };

  return (
    <div className="relative min-h-[100dvh]">
      {/* Particle field layer */}
      {enableParticles && (
        <ParticleField ref={particleRef} />
      )}

      {/* Vignette layer */}
      {enableVignette && (
        <div className="landing-vignette" />
      )}

      {/* Content layer */}
      <div className="relative" style={{ zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
}

// Export burst trigger for external use
export const useBackdropBurst = () => {
  return (x, y) => {
    const particleEl = document.querySelector('[data-testid="particle-field"]');
    if (particleEl) {
      // Trigger via custom event
      const event = new CustomEvent('particle-burst', { detail: { x, y } });
      window.dispatchEvent(event);
    }
  };
};
