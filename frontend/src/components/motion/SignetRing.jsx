import React from "react";
import { motion } from "framer-motion";

/**
 * SignetRing - Heraldic identity component
 * 
 * Auto-generates a personalized seal/stamp based on user initials.
 * Provides 4 heraldic styles: Shield, Crest, Monogram, Stamp
 */

const STYLES = {
  shield: {
    label: "Shield",
    description: "Classic heraldic shield",
    render: (initials, color) => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id={`shield-grad-${initials}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>
        {/* Shield shape */}
        <path
          d="M 50 10 L 85 25 L 85 60 Q 85 85 50 95 Q 15 85 15 60 L 15 25 Z"
          fill={`url(#shield-grad-${initials})`}
          stroke="currentColor"
          strokeWidth="2"
          className="text-ink-700"
        />
        {/* Inner border */}
        <path
          d="M 50 18 L 78 30 L 78 58 Q 78 78 50 87 Q 22 78 22 58 L 22 30 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-parchment-200"
          opacity="0.6"
        />
        {/* Initials */}
        <text
          x="50"
          y="58"
          textAnchor="middle"
          fontSize="28"
          fontWeight="700"
          fill="currentColor"
          className="text-parchment"
          fontFamily="serif"
        >
          {initials}
        </text>
      </svg>
    ),
  },
  crest: {
    label: "Crest",
    description: "Ornate circular crest",
    render: (initials, color) => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id={`crest-grad-${initials}`} cx="30%" cy="30%">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </radialGradient>
        </defs>
        {/* Outer circle */}
        <circle cx="50" cy="50" r="45" fill={`url(#crest-grad-${initials})`} />
        {/* Decorative ring */}
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="4 2"
          className="text-parchment-200"
          opacity="0.7"
        />
        {/* Inner circle */}
        <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="1" className="text-parchment-300" />
        {/* Initials */}
        <text
          x="50"
          y="58"
          textAnchor="middle"
          fontSize="26"
          fontWeight="700"
          fill="currentColor"
          className="text-parchment"
          fontFamily="serif"
        >
          {initials}
        </text>
        {/* Corner ornaments */}
        <circle cx="50" cy="20" r="3" fill="currentColor" className="text-parchment-200" />
        <circle cx="50" cy="80" r="3" fill="currentColor" className="text-parchment-200" />
        <circle cx="20" cy="50" r="3" fill="currentColor" className="text-parchment-200" />
        <circle cx="80" cy="50" r="3" fill="currentColor" className="text-parchment-200" />
      </svg>
    ),
  },
  monogram: {
    label: "Monogram",
    description: "Elegant letter monogram",
    render: (initials, color) => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Diamond background */}
        <path
          d="M 50 10 L 90 50 L 50 90 L 10 50 Z"
          fill={color}
          stroke="currentColor"
          strokeWidth="2"
          className="text-ink-700"
        />
        {/* Inner diamond */}
        <path
          d="M 50 20 L 80 50 L 50 80 L 20 50 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-parchment-200"
          opacity="0.6"
        />
        {/* Initials in elegant script */}
        <text
          x="50"
          y="58"
          textAnchor="middle"
          fontSize="32"
          fontWeight="400"
          fontStyle="italic"
          fill="currentColor"
          className="text-parchment"
          fontFamily="serif"
        >
          {initials}
        </text>
      </svg>
    ),
  },
  stamp: {
    label: "Stamp",
    description: "Official wax stamp",
    render: (initials, color) => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <filter id={`stamp-shadow-${initials}`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="0" dy="2" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Irregular wax blob */}
        <path
          d="M 50 15 Q 70 12 82 28 Q 88 45 85 62 Q 82 78 68 85 Q 52 92 38 88 Q 22 84 15 68 Q 10 52 15 38 Q 20 22 35 16 Z"
          fill={color}
          filter={`url(#stamp-shadow-${initials})`}
        />
        {/* Inner texture */}
        <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="1" className="text-ink-900" opacity="0.2" />
        {/* Initials */}
        <text
          x="50"
          y="58"
          textAnchor="middle"
          fontSize="24"
          fontWeight="900"
          fill="currentColor"
          className="text-parchment"
          fontFamily="serif"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
        >
          {initials}
        </text>
        {/* Wax drips */}
        <ellipse cx="30" cy="75" rx="4" ry="6" fill={color} opacity="0.7" />
        <ellipse cx="70" cy="78" rx="3" ry="5" fill={color} opacity="0.6" />
      </svg>
    ),
  },
};

export function SignetRing({ 
  initials, 
  style = "stamp", 
  color = "#7B1730",
  size = 80,
  className = "",
  interactive = false,
  selected = false,
  onClick = null,
}) {
  const StyleComponent = STYLES[style]?.render || STYLES.stamp.render;
  
  return (
    <motion.div
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
      whileHover={interactive ? { scale: 1.05, rotate: 2 } : {}}
      whileTap={interactive ? { scale: 0.95 } : {}}
      animate={selected ? { scale: [1, 1.1, 1], rotate: [0, 5, 0] } : {}}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      onClick={onClick}
    >
      {StyleComponent(initials.toUpperCase(), color)}
      
      {/* Selection indicator */}
      {selected && (
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-wax"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
      
      {/* Hover glow */}
      {interactive && (
        <div className="absolute inset-0 rounded-full bg-wax/0 hover:bg-wax/10 transition-colors pointer-events-none" />
      )}
    </motion.div>
  );
}

export function SignetRingPicker({ 
  initials, 
  value, 
  onChange, 
  color = "#7B1730" 
}) {
  const styles = Object.keys(STYLES);
  
  return (
    <div className="space-y-3">
      <label className="font-ui text-[12px] text-ink-600 mb-2 block">
        Choose your seal style
      </label>
      
      <div className="grid grid-cols-4 gap-3">
        {styles.map((styleKey) => {
          const style = STYLES[styleKey];
          const isSelected = value === styleKey;
          
          return (
            <motion.button
              key={styleKey}
              type="button"
              onClick={() => onChange(styleKey)}
              className={`flex flex-col items-center gap-2 p-3 border-2 transition-all ${
                isSelected
                  ? "border-wax bg-parchment-100 shadow-wax"
                  : "border-parchment-300 hover:border-ink-400 bg-parchment-50"
              }`}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <SignetRing
                initials={initials || "AB"}
                style={styleKey}
                color={color}
                size={60}
                interactive={false}
                selected={false}
              />
              <div className="font-ui text-[10px] text-ink-700 font-medium">
                {style.label}
              </div>
            </motion.button>
          );
        })}
      </div>
      
      <div className="font-ui text-[11px] text-ink-500 text-center">
        {STYLES[value]?.description}
      </div>
    </div>
  );
}
