import { useReducedMotion } from "motion/react";

export const EASE_OUT = [0.16, 1, 0.3, 1] as [number, number, number, number];

export const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease: EASE_OUT },
  },
};

const fadeUpReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

export const stagger = (delay = 0.08, delayChildren = 0.05) => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: delay, delayChildren },
  },
});

export function useAnimVariant() {
  const prefersReduced = useReducedMotion();
  return {
    anim: prefersReduced ? fadeUpReduced : fadeUp,
    prefersReduced: !!prefersReduced,
  };
}
