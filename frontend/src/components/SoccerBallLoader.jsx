import React from "react";

/**
 * SoccerBallLoader — a rolling soccer ball with colored stripe trails.
 *
 * Adapted from https://github.com/antonbobrov/r3f-rapier-ball-of-glass
 * (SVG/CSS loader only — no R3F/Rapier physics).
 *
 * Palette adapted to Pledgebond: burgundy, gold, parchment instead of red/white/blue.
 * The ball rolls in circles, emitting stripes that leave behind shrinking dots.
 * Pure SVG + CSS keyframes. No dependencies.
 *
 * Props:
 *  - label: text below the ball (default: "HERE WE GO...")
 *  - size: ball SVG width in px (default: 56)
 *  - fullPage: if true, centers vertically
 */
export default function SoccerBallLoader({ label = "HERE WE GO...", size = 56, fullPage = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center ${fullPage ? "min-h-[60vh]" : "py-16"}`}
      role="status"
      aria-label={label}
      data-testid="soccer-ball-loader"
    >
      <style>{`
        .pb-ball {
          --dur: 3s;
          display: block;
          width: ${size}px;
          height: auto;
        }
        .pb-ball__ball,
        .pb-ball__ball-shadow,
        .pb-ball__ball-texture,
        .pb-ball__stripe,
        .pb-ball__stripe-dot,
        .pb-ball__stripe-rotate {
          animation-duration: var(--dur);
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .pb-ball__ball { animation-name: pb-ball; }
        .pb-ball__ball-shadow { animation-name: pb-ball-shadow; }
        .pb-ball__ball-texture { animation-name: pb-ball-texture; }
        .pb-ball__stripe { animation-name: pb-stripe; }
        .pb-ball__stripe--1 { animation-name: pb-stripe1; }
        .pb-ball__stripe--2 { animation-name: pb-stripe2; }
        .pb-ball__stripe--3 { animation-name: pb-stripe3; }
        .pb-ball__stripe-dot { animation-name: pb-stripe-dot; }
        .pb-ball__stripe-rotate { animation-name: pb-stripe-rotate; }

        /* Dot delays — each group has different frame offsets */
        .pb-ball__stripe-dot-group:nth-child(1) .pb-ball__stripe-dot:nth-child(1) { animation-delay: calc(var(--dur) * 0); }
        .pb-ball__stripe-dot-group:nth-child(1) .pb-ball__stripe-dot:nth-child(2) { animation-delay: calc(var(--dur) * 0.233); }
        .pb-ball__stripe-dot-group:nth-child(1) .pb-ball__stripe-dot:nth-child(3) { animation-delay: calc(var(--dur) * 0.3); }
        .pb-ball__stripe-dot-group:nth-child(1) .pb-ball__stripe-dot:nth-child(4) { animation-delay: calc(var(--dur) * 0.45); }
        .pb-ball__stripe-dot-group:nth-child(1) .pb-ball__stripe-dot:nth-child(5) { animation-delay: calc(var(--dur) * 0.683); }
        .pb-ball__stripe-dot-group:nth-child(1) .pb-ball__stripe-dot:nth-child(6) { animation-delay: calc(var(--dur) * 0.708); }
        .pb-ball__stripe-dot-group:nth-child(1) .pb-ball__stripe-dot:nth-child(7) { animation-delay: calc(var(--dur) * 0.842); }

        .pb-ball__stripe-dot-group:nth-child(2) .pb-ball__stripe-dot:nth-child(1) { animation-delay: calc(var(--dur) * 0.108); }
        .pb-ball__stripe-dot-group:nth-child(2) .pb-ball__stripe-dot:nth-child(2) { animation-delay: calc(var(--dur) * 0.333); }
        .pb-ball__stripe-dot-group:nth-child(2) .pb-ball__stripe-dot:nth-child(3) { animation-delay: calc(var(--dur) * 0.425); }
        .pb-ball__stripe-dot-group:nth-child(2) .pb-ball__stripe-dot:nth-child(4) { animation-delay: calc(var(--dur) * 0.6); }
        .pb-ball__stripe-dot-group:nth-child(2) .pb-ball__stripe-dot:nth-child(5) { animation-delay: calc(var(--dur) * 0.658); }
        .pb-ball__stripe-dot-group:nth-child(2) .pb-ball__stripe-dot:nth-child(6) { animation-delay: calc(var(--dur) * 0.808); }
        .pb-ball__stripe-dot-group:nth-child(2) .pb-ball__stripe-dot:nth-child(7) { animation-delay: calc(var(--dur) * 0.842); }
        .pb-ball__stripe-dot-group:nth-child(2) .pb-ball__stripe-dot:nth-child(8) { animation-delay: calc(var(--dur) * 0.892); }

        .pb-ball__stripe-dot-group:nth-child(3) .pb-ball__stripe-dot:nth-child(1) { animation-delay: calc(var(--dur) * 0); }
        .pb-ball__stripe-dot-group:nth-child(3) .pb-ball__stripe-dot:nth-child(2) { animation-delay: calc(var(--dur) * 0.058); }
        .pb-ball__stripe-dot-group:nth-child(3) .pb-ball__stripe-dot:nth-child(3) { animation-delay: calc(var(--dur) * 0.208); }
        .pb-ball__stripe-dot-group:nth-child(3) .pb-ball__stripe-dot:nth-child(4) { animation-delay: calc(var(--dur) * 0.4); }
        .pb-ball__stripe-dot-group:nth-child(3) .pb-ball__stripe-dot:nth-child(5) { animation-delay: calc(var(--dur) * 0.517); }
        .pb-ball__stripe-dot-group:nth-child(3) .pb-ball__stripe-dot:nth-child(6) { animation-delay: calc(var(--dur) * 0.625); }
        .pb-ball__stripe-dot-group:nth-child(3) .pb-ball__stripe-dot:nth-child(7) { animation-delay: calc(var(--dur) * 0.767); }

        @keyframes pb-ball {
          from { transform: rotate(0) translate(0, -15.75px); }
          to { transform: rotate(1turn) translate(0, -15.75px); }
        }
        @keyframes pb-ball-shadow {
          from { transform: rotate(0); }
          to { transform: rotate(-1turn); }
        }
        @keyframes pb-ball-texture {
          from { transform: translate(-16px, 0); }
          to { transform: translate(48px, 0); }
        }
        @keyframes pb-stripe-dot {
          from { r: 1.25px; }
          16.67%, to { r: 0; }
        }
        @keyframes pb-stripe-rotate {
          from { transform: rotate(0); }
          to { transform: rotate(1turn); }
        }
        @keyframes pb-stripe1 {
          from, to { stroke-dashoffset: -95.7; }
          50% { animation-timing-function: cubic-bezier(0.65, 0, 0.35, 1); stroke-dashoffset: -75.7; }
        }
        @keyframes pb-stripe2 {
          from, to { stroke-dashoffset: -80.1; }
          50% { animation-timing-function: cubic-bezier(0.65, 0, 0.35, 1); stroke-dashoffset: -53.4; }
        }
        @keyframes pb-stripe3 {
          from, to { stroke-dashoffset: -72.8; }
          50% { animation-timing-function: cubic-bezier(0.65, 0, 0.35, 1); stroke-dashoffset: -48.5; }
        }
      `}</style>

      <svg
        className="pb-ball"
        viewBox="0 0 56 56"
        width={size}
        height={size}
        role="img"
        aria-label="Soccer ball rolling in circles, emitting colored stripes"
      >
        <clipPath id="pb-ball-clip">
          <circle r="8" />
        </clipPath>
        <defs>
          <path id="pb-hex" d="M 0 -9.196 L 8 -4.577 L 8 4.661 L 0 9.28 L -8 4.661 L -8 -4.577 Z" />
          <g id="pb-hex-chunk" fill="none" stroke="hsl(30, 15%, 15%)" strokeWidth="0.5">
            <use href="#pb-hex" fill="hsl(30, 15%, 15%)" />
            <use href="#pb-hex" transform="translate(16,0)" />
            <use href="#pb-hex" transform="rotate(60) translate(16,0)" />
          </g>
          <g id="pb-hex-pattern" transform="scale(0.333)">
            <use href="#pb-hex-chunk" />
            <use href="#pb-hex-chunk" transform="rotate(30) translate(0,48) rotate(-30)" />
            <use href="#pb-hex-chunk" transform="rotate(-180) translate(0,27.7) rotate(180)" />
            <use href="#pb-hex-chunk" transform="rotate(-120) translate(0,27.7) rotate(120)" />
            <use href="#pb-hex-chunk" transform="rotate(-60) translate(0,27.7) rotate(60)" />
            <use href="#pb-hex-chunk" transform="translate(0,27.7)" />
            <use href="#pb-hex-chunk" transform="rotate(60) translate(0,27.7) rotate(-60)" />
            <use href="#pb-hex-chunk" transform="rotate(120) translate(0,27.7) rotate(-120)" />
          </g>
          <g id="pb-ball-texture" transform="translate(0,-3.5)">
            <use href="#pb-hex-pattern" transform="translate(-48,0)" />
            <use href="#pb-hex-pattern" transform="translate(-32,0)" />
            <use href="#pb-hex-pattern" transform="translate(-16,0)" />
            <use href="#pb-hex-pattern" transform="translate(0,0)" />
            <use href="#pb-hex-pattern" transform="translate(16,0)" />
          </g>
        </defs>
        <filter id="pb-ball-shadow-inside">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
        </filter>
        <filter id="pb-ball-shadow-outside">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
        </filter>
        <g transform="translate(28,28)">
          {/* Burgundy stripe dots */}
          <g className="pb-ball__stripe-dot-group" fill="#9A1F3D">
            <circle className="pb-ball__stripe-dot" transform="rotate(32) translate(-18.25,0)" />
            <circle className="pb-ball__stripe-dot" transform="rotate(87) translate(-18.25,0)" />
            <circle className="pb-ball__stripe-dot" transform="rotate(103) translate(-18.25,0)" />
            <circle className="pb-ball__stripe-dot" transform="rotate(138) translate(-18.25,0)" />
            <circle className="pb-ball__stripe-dot" transform="rotate(228) translate(-18.25,0)" />
            <circle className="pb-ball__stripe-dot" transform="rotate(243) translate(-18.25,0)" />
            <circle className="pb-ball__stripe-dot" transform="rotate(328) translate(-18.25,0)" />
          </g>
          {/* Parchment/cream stripe dots */}
          <g className="pb-ball__stripe-dot-group" fill="#F2E6D1">
            <circle className="pb-ball__stripe-dot" transform="rotate(41) translate(-15.75,0)" />
            <circle className="pb-ball__stripe-dot" transform="rotate(77) translate(-15.75,0)" />
            <circle className="pb-ball__stripe-dot" transform="rotate(92) translate(-15.75,0)" />
            <circle className="pb-ball__stripe-dot" transform="rotate(146) translate(-15.75,0)" />
            <circle className="pb-ball__stripe-dot" transform="rotate(175) translate(-15.75,0)" />
            <circle className="pb-ball__stripe-dot" transform="rotate(293) translate(-15.75,0)" />
            <circle className="pb-ball__stripe-dot" transform="rotate(314) translate(-15.75,0)" />
            <circle className="pb-ball__stripe-dot" transform="rotate(340) translate(-15.75,0)" />
          </g>
          {/* Gold stripe dots */}
          <g className="pb-ball__stripe-dot-group" fill="#C49A3A">
            <circle className="pb-ball__stripe-dot" transform="rotate(20) translate(-13.25,0)" />
            <circle className="pb-ball__stripe-dot" transform="rotate(55) translate(-13.25,0)" />
            <circle className="pb-ball__stripe-dot" transform="rotate(77) translate(-13.25,0)" />
            <circle className="pb-ball__stripe-dot" transform="rotate(106) translate(-13.25,0)" />
            <circle className="pb-ball__stripe-dot" transform="rotate(128) translate(-13.25,0)" />
            <circle className="pb-ball__stripe-dot" transform="rotate(174) translate(-13.25,0)" />
            <circle className="pb-ball__stripe-dot" transform="rotate(279) translate(-13.25,0)" />
          </g>
          <g fill="none" strokeLinecap="round" strokeWidth="2.5" transform="rotate(-90)">
            <g className="pb-ball__stripe-rotate">
              <circle className="pb-ball__stripe pb-ball__stripe--1" r="18.25" stroke="#9A1F3D" strokeDasharray="114.7 114.7" />
            </g>
            <g className="pb-ball__stripe-rotate">
              <circle className="pb-ball__stripe pb-ball__stripe--2" r="15.75" stroke="#F2E6D1" strokeDasharray="106.8 106.8" />
            </g>
            <g className="pb-ball__stripe-rotate">
              <circle className="pb-ball__stripe pb-ball__stripe--3" r="13.25" stroke="#C49A3A" strokeDasharray="99 99" />
            </g>
          </g>
          <g className="pb-ball__ball" transform="translate(0,-15.75)">
            <circle className="pb-ball__ball-shadow" filter="url(#pb-ball-shadow-outside)" fill="hsla(30, 15%, 15%, 0.5)" r="8" cx="1" cy="1" />
            <circle fill="#FFFBF2" r="8" />
            <g clipPath="url(#pb-ball-clip)">
              <use className="pb-ball__ball-texture" href="#pb-ball-texture" />
            </g>
            <circle
              className="pb-ball__ball-shadow"
              clipPath="url(#pb-ball-clip)"
              filter="url(#pb-ball-shadow-inside)"
              fill="none"
              stroke="hsla(30, 15%, 15%, 0.3)"
              strokeWidth="5"
              r="12"
              cx="-4"
              cy="-4"
            />
          </g>
        </g>
      </svg>

      {label && (
        <p className="mt-4 font-serif-display italic text-[14px] text-ink-500" data-testid="soccer-ball-loader-label">
          {label}
        </p>
      )}
    </div>
  );
}
