import React from "react";

/**
 * CategoryMotif — inline SVG illustrations for each bond category.
 *
 * Each motif is a small, animated, category-specific visual that replaces
 * generic emoji and text explanations. Pure SVG + CSS, no dependencies.
 *
 * Categories:
 * - football: soccer ball with motion lines (uses existing SoccerBallLoader for full anim)
 * - fitness: running shoe with motion streaks
 * - project: rocket with launch arc
 * - custom: sparkles constellation
 *
 * Sizes: small (28px), medium (48px), large (80px)
 */

const COLORS = {
  burgundy: "#9A1F3D",
  gold: "#C49A3A",
  goldLight: "#E0C06A",
  emerald: "#1F6B4E",
  ink: "#1C191C",
  parchment: "#F2E6D1",
  inkLight: "#3a3a3a",
};

export default function CategoryMotif({ category, size = "medium", animated = true }) {
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

/* ===== Football: soccer ball with motion lines ===== */
function FootballMotif() {
  return (
    <g>
      {/* Motion streaks */}
      <g className="motif-football-streaks" opacity="0.4">
        <line x1="4" y1="18" x2="12" y2="18" stroke={COLORS.gold} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="2" y1="24" x2="10" y2="24" stroke={COLORS.burgundy} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="4" y1="30" x2="12" y2="30" stroke={COLORS.gold} strokeWidth="1.5" strokeLinecap="round" />
      </g>
      {/* Ball */}
      <g className="motif-football-ball" transform="translate(28 24)">
        <circle r="10" fill={COLORS.parchment} stroke={COLORS.ink} strokeWidth="1.5" />
        {/* Hexagon pattern */}
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

/* ===== Fitness: running shoe with motion streaks ===== */
function FitnessMotif() {
  return (
    <g>
      {/* Motion streaks */}
      <g className="motif-fitness-streaks" opacity="0.35">
        <line x1="2" y1="16" x2="10" y2="16" stroke={COLORS.emerald} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="4" y1="22" x2="12" y2="22" stroke={COLORS.gold} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="2" y1="28" x2="10" y2="28" stroke={COLORS.emerald} strokeWidth="1.5" strokeLinecap="round" />
      </g>
      {/* Shoe silhouette */}
      <g className="motif-fitness-shoe" transform="translate(14 14)">
        {/* Sole */}
        <path d="M 2 20 Q 2 18 4 17 L 24 17 Q 30 17 30 20 L 30 22 Q 30 24 28 24 L 4 24 Q 2 24 2 22 Z" fill={COLORS.emerald} />
        {/* Upper */}
        <path d="M 4 17 Q 6 10 12 8 Q 18 6 22 10 L 26 14 Q 28 16 28 17 Z" fill={COLORS.burgundy} />
        {/* Laces */}
        <line x1="10" y1="11" x2="14" y2="14" stroke={COLORS.parchment} strokeWidth="1" strokeLinecap="round" />
        <line x1="14" y1="9" x2="18" y2="13" stroke={COLORS.parchment} strokeWidth="1" strokeLinecap="round" />
        {/* Swoosh accent */}
        <path d="M 16 12 Q 20 14 24 16" stroke={COLORS.gold} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
}

/* ===== Project: rocket with launch arc ===== */
function ProjectMotif() {
  return (
    <g>
      {/* Launch arc / smoke */}
      <g className="motif-project-smoke" opacity="0.3">
        <circle cx="16" cy="36" r="2" fill={COLORS.gold} />
        <circle cx="20" cy="38" r="1.5" fill={COLORS.burgundy} />
        <circle cx="24" cy="36" r="2" fill={COLORS.gold} />
        <circle cx="28" cy="38" r="1.5" fill={COLORS.burgundy} />
      </g>
      {/* Rocket */}
      <g className="motif-project-rocket" transform="translate(24 20)">
        {/* Body */}
        <path d="M 0 -12 Q 3 -8 3 0 L 3 8 L -3 8 L -3 0 Q -3 -8 0 -12 Z" fill={COLORS.parchment} stroke={COLORS.ink} strokeWidth="1" />
        {/* Nose cone */}
        <path d="M 0 -12 Q 3 -8 0 -10 Q -3 -8 0 -12 Z" fill={COLORS.burgundy} />
        {/* Window */}
        <circle cx="0" cy="-2" r="2" fill={COLORS.gold} stroke={COLORS.ink} strokeWidth="0.5" />
        {/* Fins */}
        <path d="M -3 4 L -6 8 L -3 8 Z" fill={COLORS.burgundy} />
        <path d="M 3 4 L 6 8 L 3 8 Z" fill={COLORS.burgundy} />
        {/* Flame */}
        <g className="motif-project-flame">
          <path d="M -2 8 Q 0 14 2 8 Q 0 12 0 8 Z" fill={COLORS.gold} />
          <path d="M -1 8 Q 0 11 1 8 Z" fill={COLORS.parchment} />
        </g>
      </g>
    </g>
  );
}

/* ===== Custom: sparkles constellation ===== */
function CustomMotif() {
  return (
    <g className="motif-custom-sparkles">
      {/* Main sparkle */}
      <g className="motif-custom-main" transform="translate(24 24)">
        <path d="M 0 -10 L 2 -2 L 10 0 L 2 2 L 0 10 L -2 2 L -10 0 L -2 -2 Z" fill={COLORS.gold} />
      </g>
      {/* Small sparkles */}
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
