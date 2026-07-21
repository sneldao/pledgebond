import React from "react";
import { motion } from "framer-motion";

/**
 * PayoutPockets — vertical rendering of destination pockets that receive coins/confetti on release.
 * Props:
 *  - splits: [{ label, percent }]
 *  - filled: bool (fills bars once coins arrive)
 *  - totalAmount: number (funder_amount)
 */
export const PayoutPockets = ({ splits = [], filled = false, totalAmount = 0, className = "" }) => {
  return (
    <div className={`w-full flex flex-col gap-2 ${className}`} data-testid="payout-pockets">
      {splits.map((s, i) => {
        const amount = Math.round((s.percent / 100) * totalAmount);
        return (
          <div
            key={s.label + i}
            className="ledger-row flex items-center justify-between py-2 px-1"
            data-testid={`payout-pocket-${s.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-parchment-200 border border-parchment-300 flex items-center justify-center relative overflow-hidden">
                <motion.div
                  initial={{ height: "0%" }}
                  animate={{ height: filled ? `${Math.max(28, s.percent)}%` : "0%" }}
                  transition={{ delay: 0.15 * i, duration: 0.9, ease: [0.2, 0.9, 0.2, 1] }}
                  className="absolute bottom-0 left-0 right-0"
                  style={{
                    background: "linear-gradient(180deg, #E0C06A 0%, #C49A3A 60%, #8E6A1F 100%)",
                  }}
                />
                <span className="relative font-serif-display text-[13px] text-ink-700">{s.percent}%</span>
              </div>
              <div>
                <div className="font-serif-display text-[15px] text-ink leading-tight">{s.label}</div>
                <div className="font-ui text-[11px] text-ink-500">Demo ledger · ${amount.toLocaleString()}</div>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: filled ? 1 : 0, scale: filled ? 1 : 0.8 }}
              transition={{ delay: 0.35 + 0.15 * i, duration: 0.35 }}
              className="wax-stamp-gold wax-stamp"
            >
              Sealed
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};

export default PayoutPockets;
