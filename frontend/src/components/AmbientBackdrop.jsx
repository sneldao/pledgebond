import React, { useMemo } from "react";

/**
 * AmbientBackdrop — a CSS-only animated atmospheric layer.
 *
 * Renders behind all content:
 *  - Slowly drifting wax motes (dust-in-candlelight particles)
 *  - A breathing radial vignette that shifts position over ~20s
 *  - A subtle warm glow at the top (like light from above)
 *
 * No JS animation loop, no canvas, no dependencies. Pure CSS keyframes.
 * pointer-events: none so it never interferes with interaction.
 */
export default function AmbientBackdrop() {
  // Generate stable random positions for motes
  const motes = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 8,
        duration: 8 + Math.random() * 12,
        drift: 20 + Math.random() * 40,
        opacity: 0.15 + Math.random() * 0.25,
      })),
    []
  );

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      data-testid="ambient-backdrop"
      aria-hidden="true"
      style={{ zIndex: 0 }}
    >
      {/* Warm top glow — like light from above */}
      <div
        className="absolute inset-x-0 top-0 h-[40vh]"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(196, 154, 58, 0.08) 0%, transparent 70%)",
          animation: "ambient-glow 14s ease-in-out infinite alternate",
        }}
      />

      {/* Breathing vignette — shifts position slowly */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 45%, transparent 0%, rgba(74, 15, 30, 0.06) 100%)",
          animation: "ambient-breathe 20s ease-in-out infinite alternate",
        }}
      />

      {/* Wax motes — drifting upward like dust in candlelight */}
      {motes.map((m) => (
        <div
          key={m.id}
          className="absolute rounded-full"
          style={{
            left: `${m.left}%`,
            top: `${m.top}%`,
            width: `${m.size}px`,
            height: `${m.size}px`,
            background: `radial-gradient(circle, rgba(196, 154, 58, ${m.opacity}) 0%, transparent 70%)`,
            animation: `ambient-mote ${m.duration}s ease-in-out ${m.delay}s infinite alternate`,
            ["--drift"]: `${m.drift}px`,
          }}
        />
      ))}

      <style>{`
        @keyframes ambient-glow {
          0% { opacity: 0.6; transform: translateY(0) scale(1); }
          100% { opacity: 1; transform: translateY(8px) scale(1.05); }
        }
        @keyframes ambient-breathe {
          0% { transform: scale(1) translate(0, 0); opacity: 0.7; }
          50% { transform: scale(1.08) translate(2%, -1%); opacity: 1; }
          100% { transform: scale(1.03) translate(-1%, 2%); opacity: 0.85; }
        }
        @keyframes ambient-mote {
          0% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          100% { transform: translate(var(--drift, 30px), -40px) scale(1.3); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
