import React from "react";

/**
 * EmptyStateIllustration — small SVG illustrations for empty states.
 *
 * Replaces text-only empty states with a visual + short caption.
 * Each illustration is a floating, subtle SVG that conveys the
 * "waiting to be filled" feeling without being an error state.
 *
 * Types:
 * - ledger: empty ledger with quill (no bonds yet)
 * - proofs: waiting eye (no proofs logged)
 * - bleachers: empty seats (no participants — football)
 * - chairs: empty chairs (no participants — other)
 */

const C = {
  burgundy: "#9A1F3D",
  gold: "#C49A3A",
  goldLight: "#E0C06A",
  emerald: "#1F6B4E",
  ink: "#1C191C",
  inkLight: "#3a3a3a",
  parchment: "#F2E6D1",
  parchmentLight: "#FBF2E3",
};

export default function EmptyStateIllustration({ type, caption, className = "" }) {
  return (
    <div className={`empty-illustration ${className}`} data-testid={`empty-illustration-${type}`}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        {type === "ledger" && <LedgerIllustration />}
        {type === "proofs" && <ProofsIllustration />}
        {type === "bleachers" && <BleachersIllustration />}
        {type === "chairs" && <ChairsIllustration />}
      </svg>
      {caption && (
        <p className="font-ui text-[12px] text-ink-500 text-center max-w-[260px] leading-snug">
          {caption}
        </p>
      )}
    </div>
  );
}

/* ===== Ledger: open book with quill pen ===== */
function LedgerIllustration() {
  return (
    <g>
      {/* Open book */}
      <path d="M 12 22 Q 20 18 32 20 L 32 44 Q 20 42 12 46 Z" fill={C.parchment} stroke={C.ink} strokeWidth="1.2" />
      <path d="M 52 22 Q 44 18 32 20 L 32 44 Q 44 42 52 46 Z" fill={C.parchmentLight} stroke={C.ink} strokeWidth="1.2" />
      {/* Spine */}
      <line x1="32" y1="20" x2="32" y2="44" stroke={C.ink} strokeWidth="1" />
      {/* Empty lines (dashed = waiting to be written) */}
      <line x1="16" y1="28" x2="28" y2="27" stroke={C.inkLight} strokeWidth="0.6" strokeDasharray="2 2" opacity="0.5" />
      <line x1="16" y1="33" x2="28" y2="32" stroke={C.inkLight} strokeWidth="0.6" strokeDasharray="2 2" opacity="0.5" />
      <line x1="16" y1="38" x2="28" y2="37" stroke={C.inkLight} strokeWidth="0.6" strokeDasharray="2 2" opacity="0.5" />
      <line x1="36" y1="27" x2="48" y2="28" stroke={C.inkLight} strokeWidth="0.6" strokeDasharray="2 2" opacity="0.5" />
      <line x1="36" y1="32" x2="48" y2="33" stroke={C.inkLight} strokeWidth="0.6" strokeDasharray="2 2" opacity="0.5" />
      {/* Quill pen */}
      <g transform="translate(40 8) rotate(30)">
        <path d="M 0 0 Q 4 2 6 8 L 4 10 Q 2 4 0 2 Z" fill={C.burgundy} />
        <line x1="4" y1="10" x2="10" y2="20" stroke={C.gold} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="10" cy="20" r="1.5" fill={C.ink} />
      </g>
    </g>
  );
}

/* ===== Proofs: waiting eye ===== */
function ProofsIllustration() {
  return (
    <g>
      {/* Eye outline */}
      <path d="M 10 32 Q 32 16 54 32 Q 32 48 10 32 Z" fill={C.parchment} stroke={C.ink} strokeWidth="1.2" />
      {/* Iris */}
      <circle cx="32" cy="32" r="8" fill={C.parchmentLight} stroke={C.ink} strokeWidth="1" />
      {/* Pupil (dashed = waiting/watching) */}
      <circle cx="32" cy="32" r="4" fill="none" stroke={C.burgundy} strokeWidth="1.5" strokeDasharray="2 1.5" />
      <circle cx="32" cy="32" r="1.5" fill={C.ink} opacity="0.4" />
      {/* Eyelashes */}
      <line x1="20" y1="24" x2="18" y2="20" stroke={C.ink} strokeWidth="1" strokeLinecap="round" />
      <line x1="28" y1="20" x2="27" y2="16" stroke={C.ink} strokeWidth="1" strokeLinecap="round" />
      <line x1="36" y1="20" x2="37" y2="16" stroke={C.ink} strokeWidth="1" strokeLinecap="round" />
      <line x1="44" y1="24" x2="46" y2="20" stroke={C.ink} strokeWidth="1" strokeLinecap="round" />
      {/* Sparkle (waiting) */}
      <circle cx="36" cy="28" r="1" fill={C.gold} opacity="0.6" />
    </g>
  );
}

/* ===== Bleachers: empty stadium seats (football) ===== */
function BleachersIllustration() {
  return (
    <g>
      {/* Stepped bleachers */}
      <path d="M 8 48 L 14 44 L 14 40 L 20 40 L 20 36 L 26 36 L 26 32 L 38 32 L 38 36 L 44 36 L 44 40 L 50 40 L 50 44 L 56 48 Z" fill={C.parchment} stroke={C.ink} strokeWidth="1" />
      {/* Seat dots (empty = hollow) */}
      <circle cx="17" cy="42" r="1.5" fill="none" stroke={C.burgundy} strokeWidth="0.8" />
      <circle cx="23" cy="38" r="1.5" fill="none" stroke={C.burgundy} strokeWidth="0.8" />
      <circle cx="29" cy="34" r="1.5" fill="none" stroke={C.burgundy} strokeWidth="0.8" />
      <circle cx="35" cy="34" r="1.5" fill="none" stroke={C.burgundy} strokeWidth="0.8" />
      <circle cx="41" cy="38" r="1.5" fill="none" stroke={C.burgundy} strokeWidth="0.8" />
      <circle cx="47" cy="42" r="1.5" fill="none" stroke={C.burgundy} strokeWidth="0.8" />
      {/* Pitch line below */}
      <line x1="8" y1="50" x2="56" y2="50" stroke={C.emerald} strokeWidth="1.5" opacity="0.4" />
      {/* Ball waiting on pitch */}
      <circle cx="32" cy="54" r="2" fill={C.parchment} stroke={C.ink} strokeWidth="0.6" />
    </g>
  );
}

/* ===== Chairs: empty meeting chairs (other categories) ===== */
function ChairsIllustration() {
  return (
    <g>
      {/* Table */}
      <ellipse cx="32" cy="38" rx="20" ry="6" fill={C.parchment} stroke={C.ink} strokeWidth="1" />
      {/* Chairs (empty = just backs visible) */}
      <rect x="10" y="28" width="6" height="10" rx="1" fill="none" stroke={C.ink} strokeWidth="1" />
      <rect x="29" y="24" width="6" height="10" rx="1" fill="none" stroke={C.ink} strokeWidth="1" />
      <rect x="48" y="28" width="6" height="10" rx="1" fill="none" stroke={C.ink} strokeWidth="1" />
      {/* Empty seats indicator (dashed) */}
      <line x1="13" y1="38" x2="13" y2="44" stroke={C.inkLight} strokeWidth="0.8" strokeDasharray="1.5 1.5" opacity="0.5" />
      <line x1="32" y1="38" x2="32" y2="44" stroke={C.inkLight} strokeWidth="0.8" strokeDasharray="1.5 1.5" opacity="0.5" />
      <line x1="51" y1="38" x2="51" y2="44" stroke={C.inkLight} strokeWidth="0.8" strokeDasharray="1.5 1.5" opacity="0.5" />
      {/* Candle on table (waiting) */}
      <rect x="30" y="32" width="4" height="4" fill={C.gold} opacity="0.5" />
      <line x1="32" y1="30" x2="32" y2="32" stroke={C.burgundy} strokeWidth="0.8" />
    </g>
  );
}
