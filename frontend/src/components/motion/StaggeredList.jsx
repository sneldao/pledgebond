import React from "react";
import { motion } from "framer-motion";

/**
 * StaggeredList — automatic staggered reveal for card grids and item lists.
 * 
 * Wraps children and applies staggered entrance animations.
 * Each child gets a delay based on its index.
 * 
 * Props:
 *  - children: React nodes to stagger
 *  - staggerDelay: number (delay between items, default 0.08s)
 *  - initialY: number (starting Y offset, default 20)
 *  - duration: number (animation duration per item, default 0.5)
 *  - className: string
 */
export default function StaggeredList({
  children,
  staggerDelay = 0.08,
  initialY = 20,
  duration = 0.5,
  className = "",
}) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: initialY,
      scale: 0.96,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration,
        ease: [0.23, 1, 0.32, 1],
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {React.Children.map(children, (child) => (
        <motion.div variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
