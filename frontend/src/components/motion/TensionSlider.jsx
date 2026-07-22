import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

/**
 * TensionSlider - Physical tension-based stakes selector
 * 
 * Replaces raw numeric inputs with a weighted slider that provides
 * haptic feedback and visual tension cues.
 * 
 * Presets:
 * - Low: Friendly wager ($500 stake, $10 pledge, 30 days)
 * - Standard: Put your money where your mouth is ($2500 stake, $25 pledge, 14 days)
 * - High: All in, no excuses ($10000 stake, $100 pledge, 7 days)
 */

const PRESETS = {
  low: {
    label: "Friendly Wager",
    description: "Low stakes, good vibes",
    funder_amount: 500,
    activation_threshold: 250,
    fundee_pledge_amount: 10,
    days_until_deadline: 30,
    color: "#1F6B4E", // emerald
    intensity: 0.3,
  },
  standard: {
    label: "Real Commitment",
    description: "Put your money where your mouth is",
    funder_amount: 2500,
    activation_threshold: 1000,
    fundee_pledge_amount: 25,
    days_until_deadline: 14,
    color: "#A77D2A", // gold
    intensity: 0.6,
  },
  high: {
    label: "All In",
    description: "No excuses. Maximum tension.",
    funder_amount: 10000,
    activation_threshold: 5000,
    fundee_pledge_amount: 100,
    days_until_deadline: 7,
    color: "#7B1730", // burgundy
    intensity: 1.0,
  },
};

export function TensionSlider({ 
  value = "standard", 
  onChange,
  onPresetChange,
  className = "",
}) {
  const [currentPreset, setCurrentPreset] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  
  const presetKeys = Object.keys(PRESETS);
  const currentIndex = presetKeys.indexOf(currentPreset);
  const preset = PRESETS[currentPreset];
  
  useEffect(() => {
    if (onChange) {
      onChange({
        tension: currentPreset,
        ...preset,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPreset]);
  
  const handlePresetChange = (newPreset) => {
    setCurrentPreset(newPreset);
    if (onPresetChange) {
      onPresetChange(newPreset, PRESETS[newPreset]);
    }
  };
  
  // Calculate background darkness based on intensity
  const bgOpacity = 0.02 + (preset.intensity * 0.08);
  const glowIntensity = preset.intensity * 20;
  
  return (
    <div className={`space-y-4 ${className}`}>
      <label className="font-ui text-[12px] text-ink-600 mb-2 block">
        How much tension do you want?
      </label>
      
      {/* Visual tension indicator */}
      <motion.div
        className="relative h-24 rounded-lg overflow-hidden border-2 border-parchment-300"
        style={{
          background: `rgba(18, 16, 18, ${bgOpacity})`,
          boxShadow: `0 0 ${glowIntensity}px rgba(123, 23, 48, ${preset.intensity * 0.3})`,
        }}
        animate={{
          background: `rgba(18, 16, 18, ${bgOpacity})`,
          boxShadow: `0 0 ${glowIntensity}px rgba(123, 23, 48, ${preset.intensity * 0.3})`,
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Tension meter bars */}
        <div className="absolute inset-0 flex items-end justify-around px-4 pb-2">
          {[0.2, 0.4, 0.6, 0.8, 1.0].map((threshold, i) => (
            <motion.div
              key={i}
              className="w-2 rounded-t"
              style={{
                height: `${threshold * 80}%`,
                background: preset.intensity >= threshold ? preset.color : "rgba(18, 16, 18, 0.2)",
              }}
              animate={{
                background: preset.intensity >= threshold ? preset.color : "rgba(18, 16, 18, 0.2)",
                scaleY: preset.intensity >= threshold ? 1 : 0.7,
              }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            />
          ))}
        </div>
        
        {/* Current preset label */}
        <motion.div
          className="absolute top-3 left-0 right-0 text-center"
          key={currentPreset}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <div className="font-serif-display text-[18px] font-bold text-ink">
            {preset.label}
          </div>
          <div className="font-ui text-[11px] text-ink-600">
            {preset.description}
          </div>
        </motion.div>
      </motion.div>
      
      {/* Preset buttons */}
      <div className="grid grid-cols-3 gap-2">
        {presetKeys.map((key, index) => {
          const p = PRESETS[key];
          const isSelected = key === currentPreset;
          
          return (
            <motion.button
              key={key}
              type="button"
              onClick={() => handlePresetChange(key)}
              className={`relative p-3 border-2 transition-all ${
                isSelected
                  ? "border-wax bg-parchment-100 shadow-wax"
                  : "border-parchment-300 hover:border-ink-400 bg-parchment-50"
              }`}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.2 }}
            >
              {/* Intensity indicator dot */}
              <motion.div
                className="absolute top-2 right-2 w-2 h-2 rounded-full"
                style={{ background: p.color }}
                animate={{
                  scale: isSelected ? [1, 1.3, 1] : 1,
                  opacity: isSelected ? 1 : 0.5,
                }}
                transition={{ duration: 0.4, repeat: isSelected ? Infinity : 0, repeatDelay: 0.5 }}
              />
              
              <div className="font-ui text-[11px] font-medium text-ink-700">
                {p.label}
              </div>
              <div className="font-ui text-[9px] text-ink-500 mt-1">
                ${p.funder_amount.toLocaleString()} stake
              </div>
            </motion.button>
          );
        })}
      </div>
      
      {/* Details breakdown */}
      <motion.div
        className="mt-3 p-3 bg-parchment-100 border border-parchment-300 rounded"
        key={currentPreset}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        transition={{ duration: 0.3 }}
      >
        <div className="font-ui text-[10px] uppercase tracking-widest text-ink-600 mb-2">
          Your stakes
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="font-ui text-[11px] text-ink-700">Funder stake:</span>
            <span className="font-ui text-[12px] font-bold text-ink">${preset.funder_amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-ui text-[11px] text-ink-700">Activation threshold:</span>
            <span className="font-ui text-[12px] font-bold text-ink">${preset.activation_threshold.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-ui text-[11px] text-ink-700">Fundee pledge:</span>
            <span className="font-ui text-[12px] font-bold text-ink">${preset.fundee_pledge_amount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-ui text-[11px] text-ink-700">Deadline:</span>
            <span className="font-ui text-[12px] font-bold text-ink">{preset.days_until_deadline} days</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export { PRESETS as TENSION_PRESETS };
