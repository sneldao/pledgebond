import React from "react";
import { motion } from "framer-motion";

/**
 * DeadlineChips - Quick-select deadline options
 * 
 * Provides contextual quick-select chips for common deadlines:
 * - End of the month
 * - 30 days from now
 * - Next Friday
 * - Custom date picker
 * 
 * Reduces friction and mental math for users.
 */

export function DeadlineChips({ 
  value, 
  onChange,
  className = "",
}) {
  const today = new Date();
  
  // Calculate preset dates
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const thirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  // Next Friday
  const nextFriday = new Date(today);
  const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
  nextFriday.setDate(today.getDate() + daysUntilFriday);
  
  const presets = [
    {
      label: "End of month",
      date: endOfMonth,
      value: endOfMonth.toISOString().split('T')[0],
    },
    {
      label: "30 days",
      date: thirtyDays,
      value: thirtyDays.toISOString().split('T')[0],
    },
    {
      label: "Next Friday",
      date: nextFriday,
      value: nextFriday.toISOString().split('T')[0],
    },
  ];
  
  const formatChipDate = (date) => {
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };
  
  const isCustomDate = value && !presets.some(p => p.value === value);
  
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="font-ui text-[12px] text-ink-600 block">
        When's the deadline?
      </label>
      
      {/* Quick select chips */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const isSelected = value === preset.value;
          
          return (
            <motion.button
              key={preset.label}
              type="button"
              onClick={() => onChange(preset.value)}
              className={`px-4 py-2 border-2 transition-all ${
                isSelected
                  ? "border-wax bg-parchment-100 shadow-wax"
                  : "border-parchment-300 hover:border-ink-400 bg-parchment-50"
              }`}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col items-center gap-0.5">
                <span className="font-ui text-[11px] font-medium text-ink-700">
                  {preset.label}
                </span>
                <span className="font-ui text-[9px] text-ink-500">
                  {formatChipDate(preset.date)}
                </span>
              </div>
            </motion.button>
          );
        })}
        
        {/* Custom date option */}
        <motion.button
          type="button"
          onClick={() => {
            // Focus the date input
            const input = document.querySelector('[data-testid="create-deadline-input"]');
            if (input) input.focus();
          }}
          className={`px-4 py-2 border-2 transition-all ${
            isCustomDate
              ? "border-wax bg-parchment-100 shadow-wax"
              : "border-parchment-300 hover:border-ink-400 bg-parchment-50"
          }`}
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-ui text-[11px] font-medium text-ink-700">
              Custom
            </span>
            <span className="font-ui text-[9px] text-ink-500">
              Pick date
            </span>
          </div>
        </motion.button>
      </div>
      
      {/* Current selection display */}
      {value && (
        <motion.div
          className="font-ui text-[11px] text-ink-600 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {(() => {
            const selectedDate = new Date(value + 'T00:00:00');
            const daysUntil = Math.ceil((selectedDate - today) / (1000 * 60 * 60 * 24));
            return `Deadline set: ${selectedDate.toLocaleDateString('default', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })} (${daysUntil} days from now)`;
          })()}
        </motion.div>
      )}
    </div>
  );
}
