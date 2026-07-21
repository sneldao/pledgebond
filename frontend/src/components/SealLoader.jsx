import React from "react";
import { motion } from "framer-motion";
import VaultSeal from "@/components/VaultSeal";

/**
 * SealLoader — on-brand loading state.
 *
 * Shows a pulsing vault seal with wax-stamped text below.
 * Replaces generic "Fetching..." text and gray skeletons.
 *
 * Props:
 *  - label: the text below the seal (default: "Sealing the ledger...")
 *  - size: seal diameter in px (default: 120)
 *  - fullPage: if true, centers vertically in a min-h screen
 */
export default function SealLoader({ label = "Sealing the ledger...", size = 120, fullPage = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center ${fullPage ? "min-h-[60vh]" : "py-16"}`}
      role="status"
      aria-label={label}
      data-testid="seal-loader"
    >
      <motion.div
        animate={{
          scale: [1, 0.94, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <VaultSeal status="pending" pledgeRatio={0.5} size={size} style="burgundy" showTension={false} hidePill />
      </motion.div>
      <motion.p
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="mt-5 font-serif-display italic text-[14px] text-ink-500"
      >
        {label}
      </motion.p>
      {/* Wax drip dots — subtle animated dots below text */}
      <div className="mt-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-wax"
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
    </div>
  );
}
