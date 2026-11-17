"use client";

import { motion, MotionConfig } from "framer-motion";
import { ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

// Content is never hidden: sections only slide in slightly, so the page is fully
// readable before JavaScript loads (slow phones) and if animations never run.
const dirVariants = {
  up: { hidden: { y: 16 }, visible: { y: 0 } },
  down: { hidden: { y: -16 }, visible: { y: 0 } },
  left: { hidden: { x: -16 }, visible: { x: 0 } },
  right: { hidden: { x: 16 }, visible: { x: 0 } },
  none: { hidden: {}, visible: {} },
} as const;

interface AnimatedSectionProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

export function AnimatedSection({
  children,
  direction = "up",
  delay = 0,
  duration = 0.5,
  className,
  once = true,
}: AnimatedSectionProps) {
  const v = dirVariants[direction];
  return (
    // reducedMotion="user": no movement for visitors who turned on "reduce motion".
    <MotionConfig reducedMotion="user">
      <motion.div
        variants={v}
        initial="hidden"
        whileInView="visible"
        viewport={{ once, margin: "0px" }}
        transition={{ duration: Math.min(duration, 0.35), delay, ease: "easeOut" }}
        className={className}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}

export function StaggerContainer({ children, className, staggerDelay = 0.1 }: { children: ReactNode; className?: string; staggerDelay?: number }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px" }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: Math.min(staggerDelay, 0.05) } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, direction = "up", className }: { children: ReactNode; direction?: Direction; className?: string }) {
  const v = dirVariants[direction];
  return (
    <motion.div
      variants={v}
      className={className}
    >
      {children}
    </motion.div>
  );
}
