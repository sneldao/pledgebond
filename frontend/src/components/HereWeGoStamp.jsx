import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { sfx } from "@/lib/sound";

/**
 * HereWeGoStamp — fullscreen "🚨 HERE WE GO!" overlay shown when a football
 * bond reaches its activation threshold and seals.
 *
 * Fabrizio Romano's signature catchphrase, stamped across the screen with
 * confetti, sound, and dramatic typography. This is THE viral moment —
 * the shareable screenshot that football fans recognize instantly.
 *
 * Props:
 *  - bond: the bond object (used for title/squad count)
 *  - show: boolean to trigger the stamp
 *  - onDone: callback when the stamp finishes
 */
export default function HereWeGoStamp({ bond, show, onDone }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      sfx.release();
      // Confetti burst from center
      const colors = ["#9A1F3D", "#C49A3A", "#E0C06A", "#F2E6D1"];
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { x: 0.5, y: 0.45 },
        colors,
        startVelocity: 45,
      });
      // Second burst from sides
      setTimeout(() => {
        confetti({ particleCount: 60, angle: 60, spread: 70, origin: { x: 0, y: 0.6 }, colors });
        confetti({ particleCount: 60, angle: 120, spread: 70, origin: { x: 1, y: 0.6 }, colors });
      }, 300);

      // Auto-dismiss after 3.5s
      const timer = setTimeout(() => {
        setVisible(false);
        onDone?.();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [show, onDone]);

  const squadCount = bond?.participants?.length || 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ background: "rgba(74, 15, 30, 0.92)" }}
          data-testid="here-we-go-stamp"
          onClick={() => { setVisible(false); onDone?.(); }}
        >
          {/* Siren emoji */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
            className="text-[48px] mb-2"
          >
            {"\uD83D\uDEA8"}
          </motion.div>

          {/* HERE WE GO — massive stamp */}
          <motion.h1
            initial={{ scale: 2.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 14, stiffness: 180, delay: 0.15 }}
            className="font-serif-display text-[52px] leading-[1] tracking-tight text-center px-6"
            style={{
              color: "#F2E6D1",
              textShadow: "0 4px 24px rgba(196, 154, 58, 0.5), 0 2px 4px rgba(0,0,0,0.4)",
            }}
          >
            HERE WE GO!
          </motion.h1>

          {/* Gold divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mt-4 h-[2px] w-48 bg-[#C49A3A]"
          />

          {/* Bond title + squad info */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4 font-serif-display text-[18px] text-center px-8 max-w-[360px]"
            style={{ color: "#E0C06A" }}
          >
            {bond?.title?.replace(/^HERE WE GO:\s*/, "") || "The pledge is sealed."}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-2 font-ui text-[13px] uppercase tracking-[0.2em]"
            style={{ color: "rgba(242, 230, 209, 0.6)" }}
          >
            {squadCount} in the squad · deal sealed
          </motion.p>

          {/* Tap to dismiss hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 2 }}
            className="absolute bottom-8 font-ui text-[11px] text-[#F2E6D1]/50"
          >
            tap to continue
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
