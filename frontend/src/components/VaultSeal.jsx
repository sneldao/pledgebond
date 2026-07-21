import React, { useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

/**
 * VaultSeal — the identity-defining component.
 *
 * Props:
 *  - status: 'pending' | 'active' | 'released' | 'failed'
 *  - pledgeRatio: 0..1  (how full is the seal toward activation)
 *  - completionRatio: 0..1  (how much of the tasks are done, active state only)
 *  - deadlineRatio: 0..1  (how much time has elapsed of the total window, active state only)
 *  - size: number (px), default 320
 *  - style: 'burgundy' | 'gold' | 'emerald'
 *  - onLockComplete?: () => void      (fires after clunk animation finishes)
 *  - onReleaseStep?: (step) => void   (fires at key phases: crack | swing | burst | coins | done)
 *  - showTension: bool (default true)
 *  - hidePill: bool (default false) \u2014 hide the bottom status wax stamp (useful for row thumbnails)
 */

const STYLE_PALETTES = {
  burgundy: {
    waxLight: "#B83A57",
    waxMid: "#9A1F3D",
    waxDark: "#651427",
    waxDarker: "#4A0F1E",
    gold: "#C49A3A",
    goldLight: "#E0C06A",
    ink: "#1C191C",
  },
  gold: {
    waxLight: "#E0C06A",
    waxMid: "#C49A3A",
    waxDark: "#8E6A1F",
    waxDarker: "#7A5A1A",
    gold: "#8E6A1F",
    goldLight: "#F2E2A6",
    ink: "#1C191C",
  },
  emerald: {
    waxLight: "#2E8B67",
    waxMid: "#1F6B4E",
    waxDark: "#134E38",
    waxDarker: "#0D3826",
    gold: "#C49A3A",
    goldLight: "#E0C06A",
    ink: "#1C191C",
  },
};

export const VaultSeal = ({
  status = "pending",
  pledgeRatio = 0,
  completionRatio = 0,
  deadlineRatio = 0,
  size = 320,
  style = "burgundy",
  onLockComplete,
  onReleaseStep,
  showTension = true,
  hidePill = false,
  className = "",
}) => {
  const palette = STYLE_PALETTES[style] || STYLE_PALETTES.burgundy;
  const controls = useAnimation();
  const releaseCtrl = useAnimation();
  const containerRef = useRef(null);

  const clamped = Math.max(0, Math.min(1, pledgeRatio));
  const ringStroke = 2 + clamped * 9; // 2..11
  const waxScale = 1 + clamped * 0.06;
  const ridgeCompress = 1 - clamped * 0.14; // ridges tighten as pledge grows
  const glowOpacity = 0.08 + clamped * 0.32;

  const strain = showTension && (deadlineRatio > 0.7 || completionRatio < 0.4 * deadlineRatio);

  // Trigger the "clunk" when status flips to active
  useEffect(() => {
    if (status === "active") {
      (async () => {
        await controls.start({
          scale: [1, 1.06, 0.98, 1],
          rotate: [0, -1.2, 0.6, 0],
          transition: { duration: 0.52, ease: [0.16, 1, 0.3, 1] },
        });
        onLockComplete && onLockComplete();
      })();
    }
  }, [status]); // eslint-disable-line

  // Release orchestration
  useEffect(() => {
    if (status === "released") {
      (async () => {
        onReleaseStep && onReleaseStep("crack");
        await releaseCtrl.start("crack");
        onReleaseStep && onReleaseStep("swing");
        await releaseCtrl.start("swing");
        onReleaseStep && onReleaseStep("burst");
        await releaseCtrl.start("burst");
        onReleaseStep && onReleaseStep("coins");
        await releaseCtrl.start("coins");
        onReleaseStep && onReleaseStep("done");
      })();
    } else if (status === "failed") {
      releaseCtrl.start({ opacity: 0.65, filter: "grayscale(0.7)", transition: { duration: 0.9 } });
    }
  }, [status]); // eslint-disable-line

  // Strain jitter loop
  const jitter = useMemo(() => {
    if (!strain || status !== "active") return { x: 0, y: 0 };
    return {
      x: [0, -1, 1.2, -0.8, 0],
      y: [0, 0.8, -1, 0.6, 0],
      transition: { duration: 0.55, repeat: Infinity, ease: "easeInOut" },
    };
  }, [strain, status]);

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.42;
  const bandR = size * 0.395;
  const waxR = size * 0.32;

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${className}`}
      style={{ width: size, height: size }}
      data-testid="vault-seal"
      data-status={status}
    >
      {/* Ambient glow */}
      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: glowOpacity }}
        transition={{ duration: 0.4 }}
        style={{
          background: `radial-gradient(closest-side, ${palette.goldLight}55, transparent 70%)`,
        }}
      />

      <motion.svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        animate={{ ...(status === "active" ? jitter : {}), ...controls }}
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          {/* Parchment backplate */}
          <radialGradient id={`bg-${style}`} cx="50%" cy="48%" r="55%">
            <stop offset="0%" stopColor="#FFFBF2" />
            <stop offset="70%" stopColor="#F2E6D1" />
            <stop offset="100%" stopColor="#E7D7BC" />
          </radialGradient>

          {/* Wax body radial */}
          <radialGradient id={`wax-${style}`} cx="38%" cy="35%" r="75%">
            <stop offset="0%" stopColor={palette.waxLight} />
            <stop offset="55%" stopColor={palette.waxMid} />
            <stop offset="100%" stopColor={palette.waxDarker} />
          </radialGradient>

          {/* Gold ring gradient */}
          <linearGradient id={`gold-${style}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F2E2A6" />
            <stop offset="45%" stopColor="#C49A3A" />
            <stop offset="100%" stopColor="#7A5A1A" />
          </linearGradient>

          {/* Wax edge displacement */}
          <filter id={`wax-disp-${style}`} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={4 + (1 - clamped) * 6} />
          </filter>

          {/* Soft blur for glow */}
          <filter id="soft-blur">
            <feGaussianBlur stdDeviation="6" />
          </filter>

          {/* Dust motes */}
          <radialGradient id="mote" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F2E2A6" stopOpacity="1" />
            <stop offset="100%" stopColor="#F2E2A6" stopOpacity="0" />
          </radialGradient>

          <clipPath id={`clip-left-${style}`}>
            <rect x={0} y={0} width={cx} height={size} />
          </clipPath>
          <clipPath id={`clip-right-${style}`}>
            <rect x={cx} y={0} width={cx} height={size} />
          </clipPath>
        </defs>

        {/* Parchment backplate */}
        <circle cx={cx} cy={cy} r={outerR} fill={`url(#bg-${style})`} stroke="#C7B18A" strokeWidth="1" opacity="0.85" />
        <circle cx={cx} cy={cy} r={outerR - 6} fill="none" stroke="#C7B18A" strokeWidth="0.6" strokeDasharray="2 5" opacity="0.65" />

        {/* Countdown ring — only during active */}
        {status === "active" && (
          <g>
            <circle
              cx={cx}
              cy={cy}
              r={bandR}
              fill="none"
              stroke={palette.ink}
              strokeWidth="0.6"
              opacity="0.15"
            />
            <motion.circle
              cx={cx}
              cy={cy}
              r={bandR}
              fill="none"
              stroke={palette.gold}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * bandR}
              strokeDashoffset={(1 - deadlineRatio) * 2 * Math.PI * bandR}
              animate={{ strokeDashoffset: (1 - deadlineRatio) * 2 * Math.PI * bandR }}
              transition={{ duration: 0.8 }}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
            {/* Tick marks */}
            {Array.from({ length: 24 }).map((_, i) => {
              const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
              const x1 = cx + Math.cos(a) * (bandR + 4);
              const y1 = cy + Math.sin(a) * (bandR + 4);
              const x2 = cx + Math.cos(a) * (bandR + 10);
              const y2 = cy + Math.sin(a) * (bandR + 10);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={palette.ink}
                  strokeWidth="0.8"
                  opacity={0.35}
                />
              );
            })}
          </g>
        )}

        {/* Gold band (progress meter as thickness) */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={bandR}
          fill="none"
          stroke={`url(#gold-${style})`}
          strokeWidth={ringStroke}
          animate={{ strokeWidth: ringStroke }}
          transition={{ type: "spring", stiffness: 90, damping: 14 }}
          opacity={0.95}
        />

        {/* Vault door halves (visible from active onwards, swings open on release) */}
        {(status === "active" || status === "released" || status === "failed") && (
          <g>
            <motion.g
              clipPath={`url(#clip-left-${style})`}
              variants={{
                initial: { scaleX: 1, rotate: 0 },
                crack: { scaleX: 1, rotate: 0, transition: { duration: 0.52 } },
                swing: {
                  scaleX: [1, 0.6, 0.2],
                  x: [0, -18, -30],
                  rotate: [0, -6, -14],
                  transition: { duration: 0.78, ease: "easeInOut" },
                },
                burst: { scaleX: 0.2, x: -30, rotate: -14, transition: { duration: 0.1 } },
                coins: { scaleX: 0.2, x: -30, rotate: -14, transition: { duration: 0.1 } },
              }}
              initial="initial"
              animate={releaseCtrl}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            >
              <VaultDoorHalf side="left" size={size} palette={palette} strain={strain} />
            </motion.g>
            <motion.g
              clipPath={`url(#clip-right-${style})`}
              variants={{
                initial: { scaleX: 1, rotate: 0 },
                crack: { scaleX: 1, rotate: 0, transition: { duration: 0.52 } },
                swing: {
                  scaleX: [1, 0.6, 0.2],
                  x: [0, 18, 30],
                  rotate: [0, 6, 14],
                  transition: { duration: 0.78, ease: "easeInOut" },
                },
                burst: { scaleX: 0.2, x: 30, rotate: 14, transition: { duration: 0.1 } },
                coins: { scaleX: 0.2, x: 30, rotate: 14, transition: { duration: 0.1 } },
              }}
              initial="initial"
              animate={releaseCtrl}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            >
              <VaultDoorHalf side="right" size={size} palette={palette} strain={strain} />
            </motion.g>
          </g>
        )}

        {/* Wax seal core */}
        <motion.g
          animate={{ scale: waxScale }}
          transition={{ type: "spring", stiffness: 90, damping: 14 }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
          {/* Wax body with organic edge */}
          <circle
            cx={cx}
            cy={cy}
            r={waxR}
            fill={`url(#wax-${style})`}
            filter={`url(#wax-disp-${style})`}
            stroke={palette.waxDarker}
            strokeWidth={1.2}
          />

          {/* Emboss shadow ring */}
          <circle cx={cx} cy={cy + 3} r={waxR - 2} fill="none" stroke={"#000"} strokeOpacity="0.22" strokeWidth={5} filter="url(#soft-blur)" />

          {/* Concentric ridges — compress with pledge */}
          {[0.78, 0.66, 0.55, 0.44].map((f, i) => (
            <ellipse
              key={i}
              cx={cx}
              cy={cy}
              rx={waxR * f}
              ry={waxR * f * ridgeCompress}
              fill="none"
              stroke={palette.waxDarker}
              strokeOpacity={0.25}
              strokeWidth="1"
            />
          ))}

          {/* Specular highlight */}
          <path
            d={`M ${cx - waxR * 0.6},${cy - waxR * 0.3} 
                 a ${waxR * 0.6},${waxR * 0.4} -20 0 1 ${waxR * 0.5},${-waxR * 0.4}`}
            fill="#FFFBF2"
            opacity="0.14"
          />

          {/* Heraldic crest — stylized "P" seal */}
          <g transform={`translate(${cx}, ${cy})`}>
            <PledgebondCrest size={waxR * 1.3} color={palette.goldLight} deep={palette.waxDarker} />
          </g>

          {/* Crack overlay for release */}
          {(status === "released") && (
            <motion.g
              variants={{
                initial: { opacity: 0, pathLength: 0 },
                crack: { opacity: 1, pathLength: 1, transition: { duration: 0.5 } },
                swing: { opacity: 1, pathLength: 1 },
                burst: { opacity: 0, transition: { duration: 0.3 } },
              }}
              initial="initial"
              animate={releaseCtrl}
              stroke={palette.ink}
              strokeWidth="2.4"
              fill="none"
              strokeLinecap="round"
            >
              <motion.path d={`M ${cx} ${cy - waxR * 0.9} L ${cx + waxR * 0.05} ${cy - waxR * 0.2} L ${cx - waxR * 0.15} ${cy} L ${cx + waxR * 0.02} ${cy + waxR * 0.35} L ${cx - waxR * 0.05} ${cy + waxR * 0.9}`} />
              <motion.path d={`M ${cx - waxR * 0.7} ${cy + waxR * 0.1} L ${cx - waxR * 0.15} ${cy + waxR * 0.1} L ${cx + waxR * 0.4} ${cy - waxR * 0.1} L ${cx + waxR * 0.9} ${cy}`} strokeWidth="1.6" opacity="0.7" />
            </motion.g>
          )}
        </motion.g>

        {/* Light burst */}
        {status === "released" && (
          <motion.circle
            cx={cx}
            cy={cy}
            r={outerR}
            fill={palette.goldLight}
            variants={{
              initial: { opacity: 0, scale: 0.4 },
              crack: { opacity: 0, scale: 0.4 },
              swing: { opacity: 0.15, scale: 0.8 },
              burst: { opacity: [0.15, 0.7, 0], scale: [0.8, 2.4, 3.0], transition: { duration: 0.55 } },
              coins: { opacity: 0, scale: 3.0 },
            }}
            initial="initial"
            animate={releaseCtrl}
            style={{ mixBlendMode: "screen" }}
          />
        )}

        {/* Fail overlay */}
        {status === "failed" && (
          <>
            <circle cx={cx} cy={cy} r={outerR} fill="#1C191C" opacity="0.22" />
            <text
              x={cx}
              y={cy + outerR + 28}
              textAnchor="middle"
              fontFamily="Cormorant Garamond, serif"
              fontSize={size * 0.06}
              fill="#7B1730"
              opacity="0.9"
            >
              Conditions Unmet
            </text>
          </>
        )}
      </motion.svg>

      {/* Status pill */}
      {!hidePill && (
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-2">
          <span
            className={`wax-stamp ${status === "active" ? "" : ""} ${status === "released" ? "wax-stamp-gold" : ""} ${status === "failed" ? "wax-stamp-ink" : ""}`}
            data-testid="bond-status-badge"
          >
            {status === "pending" && "Awaiting Seal"}
            {status === "active" && "Sealed \u00B7 Active"}
            {status === "released" && "Bond Released"}
            {status === "failed" && "Bond Broken"}
          </span>
        </div>
      )}
    </div>
  );
};

const VaultDoorHalf = ({ side, size, palette, strain }) => {
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.42;
  const sign = side === "left" ? -1 : 1;
  return (
    <g opacity={0.0}>
      {/* Vault door invisible until release; the surrounding gold ring already communicates lock. */}
      <path
        d={`M ${cx} ${cy - R} A ${R} ${R} 0 0 ${sign > 0 ? 1 : 0} ${cx} ${cy + R} L ${cx} ${cy - R} Z`}
        fill={palette.waxDarker}
      />
    </g>
  );
};

// A stylized crest: a serif "P" with a laurel base — kept SVG, not a stock icon.
const PledgebondCrest = ({ size = 100, color = "#E0C06A", deep = "#4A0F1E" }) => {
  const s = size;
  return (
    <g>
      {/* Debossed background circle */}
      <circle cx={0} cy={0} r={s * 0.32} fill="none" stroke={color} strokeOpacity="0.35" strokeWidth={0.8} />

      {/* Laurel wreath (two curved sprigs) */}
      <path
        d={`M ${-s * 0.28} ${s * 0.05} Q ${-s * 0.32} ${s * 0.24} ${-s * 0.05} ${s * 0.32}
            M ${-s * 0.24} ${s * 0.08} q ${-0.04 * s} ${0.03 * s} ${-0.06 * s} ${0.06 * s}
            M ${-s * 0.20} ${s * 0.14} q ${-0.04 * s} ${0.03 * s} ${-0.06 * s} ${0.06 * s}
            M ${-s * 0.15} ${s * 0.20} q ${-0.04 * s} ${0.03 * s} ${-0.06 * s} ${0.06 * s}`}
        fill="none"
        stroke={color}
        strokeOpacity="0.78"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <path
        d={`M ${s * 0.28} ${s * 0.05} Q ${s * 0.32} ${s * 0.24} ${s * 0.05} ${s * 0.32}
            M ${s * 0.24} ${s * 0.08} q ${0.04 * s} ${0.03 * s} ${0.06 * s} ${0.06 * s}
            M ${s * 0.20} ${s * 0.14} q ${0.04 * s} ${0.03 * s} ${0.06 * s} ${0.06 * s}
            M ${s * 0.15} ${s * 0.20} q ${0.04 * s} ${0.03 * s} ${0.06 * s} ${0.06 * s}`}
        fill="none"
        stroke={color}
        strokeOpacity="0.78"
        strokeWidth={1.4}
        strokeLinecap="round"
      />

      {/* Center P */}
      <text
        x={0}
        y={s * 0.06}
        textAnchor="middle"
        fontFamily="Cormorant Garamond, serif"
        fontSize={s * 0.48}
        fontWeight="700"
        fill={color}
        style={{ filter: `drop-shadow(0 1px 0 ${deep})` }}
      >
        P
      </text>

      {/* Ribbon underneath */}
      <path
        d={`M ${-s * 0.22} ${s * 0.28} L ${s * 0.22} ${s * 0.28} L ${s * 0.19} ${s * 0.34} L ${-s * 0.19} ${s * 0.34} Z`}
        fill={color}
        opacity="0.75"
      />
    </g>
  );
};

export default VaultSeal;
