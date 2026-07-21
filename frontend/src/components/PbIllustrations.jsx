import React from "react";

/**
 * Pledgebond brand SVG visuals — icons, category motifs, and empty-state
 * illustrations in one file. All pure SVG + CSS, no external assets.
 *
 * Three exports:
 *   - Icon components (PledgeIcon, WitnessIcon, ...) — 24×24 viewBox, inherit currentColor
 *   - CategoryMotif — animated category illustration (football/fitness/project/custom)
 *   - EmptyStateIllustration — floating empty-state visual + caption
 *
 * Shared COLORS + baseProps keep the visuals consistent.
 */

const COLORS = {
  burgundy: "#9A1F3D",
  gold: "#C49A3A",
  goldLight: "#E0C06A",
  emerald: "#1F6B4E",
  ink: "#1C191C",
  inkLight: "#3a3a3a",
  parchment: "#F2E6D1",
  parchmentLight: "#FBF2E3",
};

const iconProps = (size, className) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  className: `pb-icon ${className}`,
});

/* ================================================================
 * ICONS — wax/seal themed, 24×24, inherit currentColor
 * ================================================================ */

export function PledgeIcon({ size = 16, className = "" }) {
  return (
    <svg {...iconProps(size, className)}>
      <path d="M 12 4 Q 14 8 14 12 Q 14 16 12 16 Q 10 16 10 12 Q 10 8 12 4 Z" fill="currentColor" opacity="0.85" />
      <circle cx="12" cy="14" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4" />
      <ellipse cx="11" cy="9" rx="1" ry="1.5" fill="white" opacity="0.3" />
    </svg>
  );
}

export function WitnessIcon({ size = 16, className = "" }) {
  return (
    <svg {...iconProps(size, className)}>
      <path d="M 3 12 Q 12 5 21 12 Q 12 19 3 12 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.3" strokeDasharray="2 2" />
    </svg>
  );
}

export function SealIcon({ size = 16, className = "" }) {
  return (
    <svg {...iconProps(size, className)}>
      <rect x="6" y="11" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M 8 11 L 8 8 Q 8 5 12 5 Q 16 5 16 8 L 16 11" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="12" cy="15.5" r="2.5" fill="currentColor" opacity="0.7" />
      <circle cx="12" cy="14.5" r="0.8" fill="white" opacity="0.5" />
    </svg>
  );
}

export function ReleaseIcon({ size = 16, className = "" }) {
  return (
    <svg {...iconProps(size, className)}>
      <rect x="4" y="5" width="11" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M 15 6 L 20 8 L 20 16 L 15 18" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M 7 9 L 10 12 L 8 14 L 11 17" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5" />
      <line x1="12" y1="6" x2="14" y2="3" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      <line x1="13" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      <line x1="12" y1="18" x2="14" y2="21" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
    </svg>
  );
}

export function ProofIcon({ size = 16, className = "" }) {
  return (
    <svg {...iconProps(size, className)}>
      <path d="M 5 4 L 16 4 L 19 7 L 19 20 L 5 20 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M 16 4 L 16 7 L 19 7" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="8" y1="11" x2="15" y2="11" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      <line x1="8" y1="14" x2="15" y2="14" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      <line x1="8" y1="17" x2="12" y2="17" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      <path d="M 14 3 Q 18 5 20 10 L 18 12 Q 16 7 13 5 Z" fill="currentColor" opacity="0.7" />
      <line x1="18" y1="12" x2="15" y2="18" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function SquadIcon({ size = 16, className = "" }) {
  return (
    <svg {...iconProps(size, className)}>
      <circle cx="12" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M 8 20 Q 8 14 12 14 Q 16 14 16 20" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="5" cy="9" r="2" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.6" />
      <path d="M 2 20 Q 2 15 5 15 Q 7 15 7 17" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.6" />
      <circle cx="19" cy="9" r="2" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.6" />
      <path d="M 17 17 Q 17 15 19 15 Q 22 15 22 20" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.6" />
    </svg>
  );
}

export function DeadlineIcon({ size = 16, className = "" }) {
  return (
    <svg {...iconProps(size, className)}>
      <circle cx="12" cy="13" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="12" y1="3" x2="12" y2="6" stroke="currentColor" strokeWidth="1.5" />
      <line x1="9" y1="4" x2="15" y2="4" stroke="currentColor" strokeWidth="1.5" />
      <line x1="12" y1="13" x2="12" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="13" x2="15" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="12" y1="7" x2="12" y2="8" stroke="currentColor" strokeWidth="1" />
      <line x1="18" y1="13" x2="17" y2="13" stroke="currentColor" strokeWidth="1" />
      <line x1="12" y1="19" x2="12" y2="18" stroke="currentColor" strokeWidth="1" />
      <line x1="6" y1="13" x2="7" y2="13" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function StakeIcon({ size = 16, className = "" }) {
  return (
    <svg {...iconProps(size, className)}>
      <ellipse cx="12" cy="18" rx="7" ry="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M 5 18 L 5 15 Q 5 12.5 12 12.5 Q 19 12.5 19 15 L 19 18" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <ellipse cx="12" cy="13" rx="6" ry="2.2" stroke="currentColor" strokeWidth="1.3" fill="none" opacity="0.7" />
      <path d="M 6 13 L 6 10.5 Q 6 8.5 12 8.5 Q 18 8.5 18 10.5 L 18 13" stroke="currentColor" strokeWidth="1.3" fill="none" opacity="0.7" />
      <ellipse cx="12" cy="9" rx="5" ry="2" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.5" />
      <path d="M 7 9 L 7 7 Q 7 5.5 12 5.5 Q 17 5.5 17 7 L 17 9" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.5" />
      <circle cx="12" cy="5.5" r="1.5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

/* ================================================================
 * CATEGORY MOTIFS — animated category illustrations, 48×48 viewBox
 * ================================================================ */

export function CategoryMotif({ category, size = "medium", animated = true }) {
  const px = size === "small" ? 28 : size === "large" ? 80 : 48;
  const cls = animated ? "category-motif" : "category-motif category-motif--static";
  return (
    <div className={cls} style={{ width: px, height: px }} data-testid={`category-motif-${category}`}>
      <svg width={px} height={px} viewBox="0 0 48 48" fill="none">
        {category === "football" && <FootballMotif />}
        {category === "fitness" && <FitnessMotif />}
        {category === "project" && <ProjectMotif />}
        {category === "custom" && <CustomMotif />}
      </svg>
    </div>
  );
}

function FootballMotif() {
  return (
    <g>
      <g className="motif-football-streaks" opacity="0.4">
        <line x1="4" y1="18" x2="12" y2="18" stroke={COLORS.gold} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="2" y1="24" x2="10" y2="24" stroke={COLORS.burgundy} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="4" y1="30" x2="12" y2="30" stroke={COLORS.gold} strokeWidth="1.5" strokeLinecap="round" />
      </g>
      <g className="motif-football-ball" transform="translate(28 24)">
        <circle r="10" fill={COLORS.parchment} stroke={COLORS.ink} strokeWidth="1.5" />
        <polygon points="0,-5 4.3,-2.5 4.3,2.5 0,5 -4.3,2.5 -4.3,-2.5" fill={COLORS.ink} />
        <line x1="0" y1="-5" x2="0" y2="-10" stroke={COLORS.ink} strokeWidth="1" />
        <line x1="4.3" y1="-2.5" x2="8.7" y2="-5" stroke={COLORS.ink} strokeWidth="1" />
        <line x1="4.3" y1="2.5" x2="8.7" y2="5" stroke={COLORS.ink} strokeWidth="1" />
        <line x1="0" y1="5" x2="0" y2="10" stroke={COLORS.ink} strokeWidth="1" />
        <line x1="-4.3" y1="2.5" x2="-8.7" y2="5" stroke={COLORS.ink} strokeWidth="1" />
        <line x1="-4.3" y1="-2.5" x2="-8.7" y2="-5" stroke={COLORS.ink} strokeWidth="1" />
      </g>
    </g>
  );
}

function FitnessMotif() {
  return (
    <g>
      <g className="motif-fitness-streaks" opacity="0.35">
        <line x1="2" y1="16" x2="10" y2="16" stroke={COLORS.emerald} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="4" y1="22" x2="12" y2="22" stroke={COLORS.gold} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="2" y1="28" x2="10" y2="28" stroke={COLORS.emerald} strokeWidth="1.5" strokeLinecap="round" />
      </g>
      <g className="motif-fitness-shoe" transform="translate(14 14)">
        <path d="M 2 20 Q 2 18 4 17 L 24 17 Q 30 17 30 20 L 30 22 Q 30 24 28 24 L 4 24 Q 2 24 2 22 Z" fill={COLORS.emerald} />
        <path d="M 4 17 Q 6 10 12 8 Q 18 6 22 10 L 26 14 Q 28 16 28 17 Z" fill={COLORS.burgundy} />
        <line x1="10" y1="11" x2="14" y2="14" stroke={COLORS.parchment} strokeWidth="1" strokeLinecap="round" />
        <line x1="14" y1="9" x2="18" y2="13" stroke={COLORS.parchment} strokeWidth="1" strokeLinecap="round" />
        <path d="M 16 12 Q 20 14 24 16" stroke={COLORS.gold} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
}

function ProjectMotif() {
  return (
    <g>
      <g className="motif-project-smoke" opacity="0.3">
        <circle cx="16" cy="36" r="2" fill={COLORS.gold} />
        <circle cx="20" cy="38" r="1.5" fill={COLORS.burgundy} />
        <circle cx="24" cy="36" r="2" fill={COLORS.gold} />
        <circle cx="28" cy="38" r="1.5" fill={COLORS.burgundy} />
      </g>
      <g className="motif-project-rocket" transform="translate(24 20)">
        <path d="M 0 -12 Q 3 -8 3 0 L 3 8 L -3 8 L -3 0 Q -3 -8 0 -12 Z" fill={COLORS.parchment} stroke={COLORS.ink} strokeWidth="1" />
        <path d="M 0 -12 Q 3 -8 0 -10 Q -3 -8 0 -12 Z" fill={COLORS.burgundy} />
        <circle cx="0" cy="-2" r="2" fill={COLORS.gold} stroke={COLORS.ink} strokeWidth="0.5" />
        <path d="M -3 4 L -6 8 L -3 8 Z" fill={COLORS.burgundy} />
        <path d="M 3 4 L 6 8 L 3 8 Z" fill={COLORS.burgundy} />
        <g className="motif-project-flame">
          <path d="M -2 8 Q 0 14 2 8 Q 0 12 0 8 Z" fill={COLORS.gold} />
          <path d="M -1 8 Q 0 11 1 8 Z" fill={COLORS.parchment} />
        </g>
      </g>
    </g>
  );
}

function CustomMotif() {
  return (
    <g className="motif-custom-sparkles">
      <g className="motif-custom-main" transform="translate(24 24)">
        <path d="M 0 -10 L 2 -2 L 10 0 L 2 2 L 0 10 L -2 2 L -10 0 L -2 -2 Z" fill={COLORS.gold} />
      </g>
      <g className="motif-custom-small1" transform="translate(10 14)">
        <path d="M 0 -4 L 1 -1 L 4 0 L 1 1 L 0 4 L -1 1 L -4 0 L -1 -1 Z" fill={COLORS.burgundy} opacity="0.7" />
      </g>
      <g className="motif-custom-small2" transform="translate(36 34)">
        <path d="M 0 -3 L 0.8 -0.8 L 3 0 L 0.8 0.8 L 0 3 L -0.8 0.8 L -3 0 L -0.8 -0.8 Z" fill={COLORS.emerald} opacity="0.6" />
      </g>
      <g className="motif-custom-small3" transform="translate(38 12)">
        <path d="M 0 -2.5 L 0.6 -0.6 L 2.5 0 L 0.6 0.6 L 0 2.5 L -0.6 0.6 L -2.5 0 L -0.6 -0.6 Z" fill={COLORS.gold} opacity="0.5" />
      </g>
    </g>
  );
}

/* ================================================================
 * EMPTY STATE ILLUSTRATIONS — 64×64 viewBox, floating + caption
 * ================================================================ */

export function EmptyStateIllustration({ type, caption, className = "" }) {
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

function LedgerIllustration() {
  return (
    <g>
      <path d="M 12 22 Q 20 18 32 20 L 32 44 Q 20 42 12 46 Z" fill={COLORS.parchment} stroke={COLORS.ink} strokeWidth="1.2" />
      <path d="M 52 22 Q 44 18 32 20 L 32 44 Q 44 42 52 46 Z" fill={COLORS.parchmentLight} stroke={COLORS.ink} strokeWidth="1.2" />
      <line x1="32" y1="20" x2="32" y2="44" stroke={COLORS.ink} strokeWidth="1" />
      <line x1="16" y1="28" x2="28" y2="27" stroke={COLORS.inkLight} strokeWidth="0.6" strokeDasharray="2 2" opacity="0.5" />
      <line x1="16" y1="33" x2="28" y2="32" stroke={COLORS.inkLight} strokeWidth="0.6" strokeDasharray="2 2" opacity="0.5" />
      <line x1="16" y1="38" x2="28" y2="37" stroke={COLORS.inkLight} strokeWidth="0.6" strokeDasharray="2 2" opacity="0.5" />
      <line x1="36" y1="27" x2="48" y2="28" stroke={COLORS.inkLight} strokeWidth="0.6" strokeDasharray="2 2" opacity="0.5" />
      <line x1="36" y1="32" x2="48" y2="33" stroke={COLORS.inkLight} strokeWidth="0.6" strokeDasharray="2 2" opacity="0.5" />
      <g transform="translate(40 8) rotate(30)">
        <path d="M 0 0 Q 4 2 6 8 L 4 10 Q 2 4 0 2 Z" fill={COLORS.burgundy} />
        <line x1="4" y1="10" x2="10" y2="20" stroke={COLORS.gold} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="10" cy="20" r="1.5" fill={COLORS.ink} />
      </g>
    </g>
  );
}

function ProofsIllustration() {
  return (
    <g>
      <path d="M 10 32 Q 32 16 54 32 Q 32 48 10 32 Z" fill={COLORS.parchment} stroke={COLORS.ink} strokeWidth="1.2" />
      <circle cx="32" cy="32" r="8" fill={COLORS.parchmentLight} stroke={COLORS.ink} strokeWidth="1" />
      <circle cx="32" cy="32" r="4" fill="none" stroke={COLORS.burgundy} strokeWidth="1.5" strokeDasharray="2 1.5" />
      <circle cx="32" cy="32" r="1.5" fill={COLORS.ink} opacity="0.4" />
      <line x1="20" y1="24" x2="18" y2="20" stroke={COLORS.ink} strokeWidth="1" strokeLinecap="round" />
      <line x1="28" y1="20" x2="27" y2="16" stroke={COLORS.ink} strokeWidth="1" strokeLinecap="round" />
      <line x1="36" y1="20" x2="37" y2="16" stroke={COLORS.ink} strokeWidth="1" strokeLinecap="round" />
      <line x1="44" y1="24" x2="46" y2="20" stroke={COLORS.ink} strokeWidth="1" strokeLinecap="round" />
      <circle cx="36" cy="28" r="1" fill={COLORS.gold} opacity="0.6" />
    </g>
  );
}

function BleachersIllustration() {
  return (
    <g>
      <path d="M 8 48 L 14 44 L 14 40 L 20 40 L 20 36 L 26 36 L 26 32 L 38 32 L 38 36 L 44 36 L 44 40 L 50 40 L 50 44 L 56 48 Z" fill={COLORS.parchment} stroke={COLORS.ink} strokeWidth="1" />
      <circle cx="17" cy="42" r="1.5" fill="none" stroke={COLORS.burgundy} strokeWidth="0.8" />
      <circle cx="23" cy="38" r="1.5" fill="none" stroke={COLORS.burgundy} strokeWidth="0.8" />
      <circle cx="29" cy="34" r="1.5" fill="none" stroke={COLORS.burgundy} strokeWidth="0.8" />
      <circle cx="35" cy="34" r="1.5" fill="none" stroke={COLORS.burgundy} strokeWidth="0.8" />
      <circle cx="41" cy="38" r="1.5" fill="none" stroke={COLORS.burgundy} strokeWidth="0.8" />
      <circle cx="47" cy="42" r="1.5" fill="none" stroke={COLORS.burgundy} strokeWidth="0.8" />
      <line x1="8" y1="50" x2="56" y2="50" stroke={COLORS.emerald} strokeWidth="1.5" opacity="0.4" />
      <circle cx="32" cy="54" r="2" fill={COLORS.parchment} stroke={COLORS.ink} strokeWidth="0.6" />
    </g>
  );
}

function ChairsIllustration() {
  return (
    <g>
      <ellipse cx="32" cy="38" rx="20" ry="6" fill={COLORS.parchment} stroke={COLORS.ink} strokeWidth="1" />
      <rect x="10" y="28" width="6" height="10" rx="1" fill="none" stroke={COLORS.ink} strokeWidth="1" />
      <rect x="29" y="24" width="6" height="10" rx="1" fill="none" stroke={COLORS.ink} strokeWidth="1" />
      <rect x="48" y="28" width="6" height="10" rx="1" fill="none" stroke={COLORS.ink} strokeWidth="1" />
      <line x1="13" y1="38" x2="13" y2="44" stroke={COLORS.inkLight} strokeWidth="0.8" strokeDasharray="1.5 1.5" opacity="0.5" />
      <line x1="32" y1="38" x2="32" y2="44" stroke={COLORS.inkLight} strokeWidth="0.8" strokeDasharray="1.5 1.5" opacity="0.5" />
      <line x1="51" y1="38" x2="51" y2="44" stroke={COLORS.inkLight} strokeWidth="0.8" strokeDasharray="1.5 1.5" opacity="0.5" />
      <rect x="30" y="32" width="4" height="4" fill={COLORS.gold} opacity="0.5" />
      <line x1="32" y1="30" x2="32" y2="32" stroke={COLORS.burgundy} strokeWidth="0.8" />
    </g>
  );
}
