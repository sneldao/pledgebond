import React from "react";

/**
 * Pledgebond custom icon set — wax/seal themed SVG icons.
 *
 * Replaces generic lucide-react icons for core actions with
 * brand-specific visuals that match the wax seal motif.
 *
 * All icons inherit currentColor for stroke/fill where appropriate.
 * Size prop controls width/height (default 16).
 */

const baseProps = (size) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  className: "pb-icon",
});

/* ===== PledgeIcon — wax drop with ring ===== */
export function PledgeIcon({ size = 16, className = "" }) {
  return (
    <svg {...baseProps(size)} className={`pb-icon ${className}`}>
      {/* Wax drop */}
      <path d="M 12 4 Q 14 8 14 12 Q 14 16 12 16 Q 10 16 10 12 Q 10 8 12 4 Z" fill="currentColor" opacity="0.85" />
      {/* Ring around drop */}
      <circle cx="12" cy="14" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4" />
      {/* Highlight */}
      <ellipse cx="11" cy="9" rx="1" ry="1.5" fill="white" opacity="0.3" />
    </svg>
  );
}

/* ===== WitnessIcon — eye in seal ===== */
export function WitnessIcon({ size = 16, className = "" }) {
  return (
    <svg {...baseProps(size)} className={`pb-icon ${className}`}>
      {/* Eye shape */}
      <path d="M 3 12 Q 12 5 21 12 Q 12 19 3 12 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Iris */}
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Pupil */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      {/* Seal ring around eye */}
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.3" strokeDasharray="2 2" />
    </svg>
  );
}

/* ===== SealIcon — lock with wax ===== */
export function SealIcon({ size = 16, className = "" }) {
  return (
    <svg {...baseProps(size)} className={`pb-icon ${className}`}>
      {/* Lock body */}
      <rect x="6" y="11" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Shackle */}
      <path d="M 8 11 L 8 8 Q 8 5 12 5 Q 16 5 16 8 L 16 11" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Wax seal center */}
      <circle cx="12" cy="15.5" r="2.5" fill="currentColor" opacity="0.7" />
      {/* Keyhole */}
      <circle cx="12" cy="14.5" r="0.8" fill="white" opacity="0.5" />
    </svg>
  );
}

/* ===== ReleaseIcon — breaking seal / open vault ===== */
export function ReleaseIcon({ size = 16, className = "" }) {
  return (
    <svg {...baseProps(size)} className={`pb-icon ${className}`}>
      {/* Vault door (open) */}
      <rect x="4" y="5" width="11" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Open door swing */}
      <path d="M 15 6 L 20 8 L 20 16 L 15 18" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Crack lines */}
      <path d="M 7 9 L 10 12 L 8 14 L 11 17" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5" />
      {/* Light burst from crack */}
      <line x1="12" y1="6" x2="14" y2="3" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      <line x1="13" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      <line x1="12" y1="18" x2="14" y2="21" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
    </svg>
  );
}

/* ===== ProofIcon — quill on parchment ===== */
export function ProofIcon({ size = 16, className = "" }) {
  return (
    <svg {...baseProps(size)} className={`pb-icon ${className}`}>
      {/* Parchment */}
      <path d="M 5 4 L 16 4 L 19 7 L 19 20 L 5 20 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M 16 4 L 16 7 L 19 7" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Lines on parchment */}
      <line x1="8" y1="11" x2="15" y2="11" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      <line x1="8" y1="14" x2="15" y2="14" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      <line x1="8" y1="17" x2="12" y2="17" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      {/* Quill */}
      <path d="M 14 3 Q 18 5 20 10 L 18 12 Q 16 7 13 5 Z" fill="currentColor" opacity="0.7" />
      <line x1="18" y1="12" x2="15" y2="18" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/* ===== SquadIcon — three figures (participants) ===== */
export function SquadIcon({ size = 16, className = "" }) {
  return (
    <svg {...baseProps(size)} className={`pb-icon ${className}`}>
      {/* Center figure */}
      <circle cx="12" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M 8 20 Q 8 14 12 14 Q 16 14 16 20" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Left figure */}
      <circle cx="5" cy="9" r="2" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.6" />
      <path d="M 2 20 Q 2 15 5 15 Q 7 15 7 17" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.6" />
      {/* Right figure */}
      <circle cx="19" cy="9" r="2" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.6" />
      <path d="M 17 17 Q 17 15 19 15 Q 22 15 22 20" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.6" />
    </svg>
  );
}

/* ===== DeadlineIcon — stopwatch ===== */
export function DeadlineIcon({ size = 16, className = "" }) {
  return (
    <svg {...baseProps(size)} className={`pb-icon ${className}`}>
      {/* Watch body */}
      <circle cx="12" cy="13" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Top button */}
      <line x1="12" y1="3" x2="12" y2="6" stroke="currentColor" strokeWidth="1.5" />
      <line x1="9" y1="4" x2="15" y2="4" stroke="currentColor" strokeWidth="1.5" />
      {/* Hands */}
      <line x1="12" y1="13" x2="12" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="13" x2="15" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      {/* Tick marks */}
      <line x1="12" y1="7" x2="12" y2="8" stroke="currentColor" strokeWidth="1" />
      <line x1="18" y1="13" x2="17" y2="13" stroke="currentColor" strokeWidth="1" />
      <line x1="12" y1="19" x2="12" y2="18" stroke="currentColor" strokeWidth="1" />
      <line x1="6" y1="13" x2="7" y2="13" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/* ===== StakeIcon — coin stack ===== */
export function StakeIcon({ size = 16, className = "" }) {
  return (
    <svg {...baseProps(size)} className={`pb-icon ${className}`}>
      {/* Bottom coin */}
      <ellipse cx="12" cy="18" rx="7" ry="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M 5 18 L 5 15 Q 5 12.5 12 12.5 Q 19 12.5 19 15 L 19 18" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Middle coin */}
      <ellipse cx="12" cy="13" rx="6" ry="2.2" stroke="currentColor" strokeWidth="1.3" fill="none" opacity="0.7" />
      <path d="M 6 13 L 6 10.5 Q 6 8.5 12 8.5 Q 18 8.5 18 10.5 L 18 13" stroke="currentColor" strokeWidth="1.3" fill="none" opacity="0.7" />
      {/* Top coin */}
      <ellipse cx="12" cy="9" rx="5" ry="2" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.5" />
      <path d="M 7 9 L 7 7 Q 7 5.5 12 5.5 Q 17 5.5 17 7 L 17 9" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.5" />
      {/* Wax seal on top */}
      <circle cx="12" cy="5.5" r="1.5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export default {
  PledgeIcon,
  WitnessIcon,
  SealIcon,
  ReleaseIcon,
  ProofIcon,
  SquadIcon,
  DeadlineIcon,
  StakeIcon,
};
