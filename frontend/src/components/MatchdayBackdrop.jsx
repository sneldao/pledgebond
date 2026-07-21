import React from "react";

/**
 * MatchdayBackdrop — dark stadium atmosphere for football bond pages.
 *
 * Combines:
 * - Deep burgundy gradient background
 * - Subtle gold grid overlay (tactical board feel)
 * - Two ambient blur orbs (burgundy + gold, floodlight effect)
 * - Optional pitch markings SVG at 4% opacity
 *
 * Adapted from SportWarren's V4StadiumBackdrop pattern, rebranded
 * to Pledgebond's burgundy/gold palette.
 *
 * Pure CSS + SVG, no dependencies, pointer-events: none.
 */
export default function MatchdayBackdrop({ showPitch = true }) {
  return (
    <>
      <div className="stadium-grid" />
      <div className="stadium-orb stadium-orb--burgundy" />
      <div className="stadium-orb stadium-orb--gold" />
      {showPitch && (
        <svg className="pitch-overlay" viewBox="0 0 100 160" preserveAspectRatio="xMidYMid slice">
          {/* Pitch outline */}
          <rect x="2" y="2" width="96" height="156" fill="none" stroke="#C49A3A" strokeWidth="0.5" />
          {/* Halfway line */}
          <line x1="2" y1="80" x2="98" y2="80" stroke="#C49A3A" strokeWidth="0.4" />
          {/* Center circle */}
          <circle cx="50" cy="80" r="12" fill="none" stroke="#C49A3A" strokeWidth="0.4" />
          <circle cx="50" cy="80" r="0.8" fill="#C49A3A" />
          {/* Penalty boxes */}
          <rect x="20" y="2" width="60" height="18" fill="none" stroke="#C49A3A" strokeWidth="0.4" />
          <rect x="20" y="140" width="60" height="18" fill="none" stroke="#C49A3A" strokeWidth="0.4" />
          {/* Goal boxes */}
          <rect x="35" y="2" width="30" height="7" fill="none" stroke="#C49A3A" strokeWidth="0.4" />
          <rect x="35" y="151" width="30" height="7" fill="none" stroke="#C49A3A" strokeWidth="0.4" />
        </svg>
      )}
    </>
  );
}
