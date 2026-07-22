import React, { useState } from "react";
import { motion } from "framer-motion";

/**
 * AtmospherePicker - Visual theme selector for bond atmosphere
 * 
 * Lets users choose the visual vibe of their bond:
 * - Archive: Bright parchment, serif fonts, quiet (default for Custom/Project)
 * - Matchday: Dark stadium, neon accents, loud (default for Football)
 * - Gym: Gritty textures, bold sans-serif, energetic (default for Fitness)
 * 
 * Clicking an option instantly transitions the preview background.
 */

const ATMOSPHERES = {
  archive: {
    label: "The Archive",
    description: "Quiet. Scholarly. Timeless.",
    icon: "📜",
    preview: {
      bg: "linear-gradient(135deg, #FFFBF2 0%, #F2E6D1 100%)",
      textColor: "#1C191C",
      accentColor: "#A77D2A",
      font: "serif",
    },
    theme: {
      shell: "",
      textColor: "text-ink",
      accentColor: "text-gold-500",
      borderColor: "border-parchment-300",
    },
  },
  matchday: {
    label: "Matchday",
    description: "Loud. Electric. Unforgettable.",
    icon: "⚽",
    preview: {
      bg: "linear-gradient(135deg, #1a0a12 0%, #2a0f1a 100%)",
      textColor: "#F2E6D1",
      accentColor: "#C49A3A",
      font: "sans-serif",
    },
    theme: {
      shell: "matchday-shell",
      textColor: "text-parchment",
      accentColor: "text-gold-300",
      borderColor: "border-gold-400/30",
    },
  },
  gym: {
    label: "The Gym",
    description: "Gritty. Raw. No excuses.",
    icon: "💪",
    preview: {
      bg: "linear-gradient(135deg, #2A252A 0%, #1C191C 100%)",
      textColor: "#F2E6D1",
      accentColor: "#E0C06A",
      font: "sans-serif",
    },
    theme: {
      shell: "gym-shell",
      textColor: "text-parchment",
      accentColor: "text-gold-300",
      borderColor: "border-parchment-400/30",
    },
  },
};

export function AtmospherePicker({ 
  value = "archive", 
  onChange,
  className = "",
}) {
  const [selected, setSelected] = useState(value);
  const [previewActive, setPreviewActive] = useState(false);
  
  const handleSelect = (key) => {
    setSelected(key);
    setPreviewActive(true);
    if (onChange) {
      onChange(key, ATMOSPHERES[key]);
    }
    setTimeout(() => setPreviewActive(false), 2000);
  };
  
  const currentAtmosphere = ATMOSPHERES[selected];
  
  return (
    <div className={`space-y-4 ${className}`}>
      <label className="font-ui text-[12px] text-ink-600 mb-2 block">
        What's the vibe?
      </label>
      
      {/* Live preview background */}
      <motion.div
        className="relative h-32 rounded-lg overflow-hidden border-2 border-parchment-300"
        style={{ background: currentAtmosphere.preview.bg }}
        animate={{
          background: currentAtmosphere.preview.bg,
        }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        {/* Preview content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          <motion.div
            className="text-center"
            key={selected}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-4xl mb-2">{currentAtmosphere.icon}</div>
            <div 
              className="font-serif-display text-[20px] font-bold mb-1"
              style={{ 
                color: currentAtmosphere.preview.textColor,
                fontFamily: currentAtmosphere.preview.font === "serif" ? "serif" : "sans-serif"
              }}
            >
              {currentAtmosphere.label}
            </div>
            <div 
              className="font-ui text-[11px]"
              style={{ color: currentAtmosphere.preview.textColor, opacity: 0.7 }}
            >
              {currentAtmosphere.description}
            </div>
          </motion.div>
        </div>
        
        {/* Atmospheric overlay effects */}
        {selected === "matchday" && (
          <>
            <div className="stadium-grid" />
            <div className="stadium-orb stadium-orb--burgundy" />
            <div className="stadium-orb stadium-orb--gold" />
          </>
        )}
        
        {selected === "gym" && (
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)",
            }}
          />
        )}
        
        {selected === "archive" && (
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23A77D2A' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />
        )}
      </motion.div>
      
      {/* Atmosphere options */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(ATMOSPHERES).map(([key, atm]) => {
          const isSelected = key === selected;
          
          return (
            <motion.button
              key={key}
              type="button"
              onClick={() => handleSelect(key)}
              className={`relative p-4 border-2 transition-all ${
                isSelected
                  ? "border-wax bg-parchment-100 shadow-wax"
                  : "border-parchment-300 hover:border-ink-400 bg-parchment-50"
              }`}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-wax flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <div className="text-parchment text-[12px]">✓</div>
                </motion.div>
              )}
              
              <div className="flex flex-col items-center gap-2">
                <div className="text-3xl">{atm.icon}</div>
                <div className="font-ui text-[11px] font-medium text-ink-700 text-center">
                  {atm.label}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
      
      {/* Preview notification */}
      {previewActive && (
        <motion.div
          className="text-center font-ui text-[11px] text-ink-600"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          Preview active — your bond will have this atmosphere
        </motion.div>
      )}
    </div>
  );
}

export { ATMOSPHERES };
