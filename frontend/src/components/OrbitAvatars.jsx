import React, { useMemo } from "react";
import { motion } from "framer-motion";

/**
 * OrbitAvatars — avatars orbit the vault seal.
 * Newly added participants get a "fly-in" animation.
 *
 * Props:
 *  - participants: [{ id, initials, color, joined_at }]
 *  - centerSize: number (matches VaultSeal size)
 *  - ringRadius: number (px from center)
 *  - showBadgeIfOverflow: bool (default true)
 */
export const OrbitAvatars = ({
  participants = [],
  centerSize = 320,
  ringRadius = null,
  maxSlots = 18,
  small = false,
  className = "",
}) => {
  const R = ringRadius ?? centerSize * 0.56;
  const visible = participants.slice(0, maxSlots);
  const overflow = Math.max(0, participants.length - maxSlots);

  const slots = useMemo(() => {
    const N = Math.max(visible.length, 1);
    return visible.map((p, i) => {
      const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
      return {
        p,
        x: Math.cos(angle) * R,
        y: Math.sin(angle) * R,
        angle,
      };
    });
  }, [visible, R]);

  const bubbleSize = small ? 22 : 34;

  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ width: centerSize, height: centerSize }}
    >
      {slots.map(({ p, x, y }, idx) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 80, opacity: 0, scale: 0.6 }}
          animate={{ x, y, opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 210,
            damping: 18,
            delay: idx * 0.02,
          }}
          className="absolute"
          style={{
            left: `calc(50% - ${bubbleSize / 2}px)`,
            top: `calc(50% - ${bubbleSize / 2}px)`,
          }}
        >
          <div
            className="font-ui font-semibold text-[11px] flex items-center justify-center rounded-full border select-none"
            style={{
              width: bubbleSize,
              height: bubbleSize,
              background: p.color || "#7B1730",
              color: "#FFFBF2",
              borderColor: "#1C191C",
              boxShadow: "0 6px 14px rgba(28,25,28,0.28), inset 0 1px 0 rgba(255,255,255,0.35)",
            }}
            title={p.display_name}
          >
            {p.initials || p.display_name?.slice(0, 2)?.toUpperCase() || "?"}
          </div>
        </motion.div>
      ))}

      {overflow > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute font-ui font-semibold text-[11px] flex items-center justify-center rounded-full"
          style={{
            left: `calc(50% + ${R * 0.72}px)`,
            top: `calc(50% + ${R * 0.72}px)`,
            width: bubbleSize,
            height: bubbleSize,
            background: "#1C191C",
            color: "#E0C06A",
            border: "1px solid #C49A3A",
          }}
        >
          +{overflow}
        </motion.div>
      )}
    </div>
  );
};

export default OrbitAvatars;
