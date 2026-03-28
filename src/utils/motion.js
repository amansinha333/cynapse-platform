/**
 * Shared Framer Motion presets for Cynapse Enterprise.
 * Centralizes animation variants so every component uses
 * consistent timing, easing, and stagger values.
 */

// ── Spring Presets ────────────────────────────────────────────────
export const springs = {
  snappy:  { type: 'spring', stiffness: 350, damping: 30 },
  gentle:  { type: 'spring', stiffness: 180, damping: 22 },
  bouncy:  { type: 'spring', stiffness: 400, damping: 17 },
  molasses:{ type: 'spring', stiffness: 120, damping: 20 },
};

// ── Easing Curves (matching the CSS in index.css) ─────────────────
export const easings = {
  outExpo:    [0.16, 1, 0.3, 1],
  inOutExpo:  [0.87, 0, 0.13, 1],
  outQuart:   [0.25, 1, 0.5, 1],
  standard:   [0.4, 0, 0.2, 1],
};

// ── Stagger Container ─────────────────────────────────────────────
// Usage: <motion.div variants={staggerContainer()} initial="hidden" animate="show">
export const staggerContainer = (staggerMs = 0.07, delayMs = 0) => ({
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: staggerMs,
      delayChildren: delayMs,
    },
  },
});

// ── Stagger Children ──────────────────────────────────────────────
export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: easings.outExpo },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.4, ease: easings.outExpo },
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: easings.outExpo },
  },
};

export const slideInLeft = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: easings.outExpo },
  },
};

export const slideInRight = {
  hidden: { opacity: 0, x: 20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: easings.outExpo },
  },
};

// ── Page / Route Transition ───────────────────────────────────────
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: easings.outExpo } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.2, ease: easings.standard } },
};

// ── Card Hover Lift ───────────────────────────────────────────────
export const cardHover = {
  rest: { y: 0, scale: 1 },
  hover: { y: -4, scale: 1.01, transition: springs.gentle },
};

// ── Viewport-triggered wrapper props ──────────────────────────────
// Spread onto a motion.div: <motion.div {...viewportFade}>
export const viewportFade = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5, ease: easings.outExpo },
};

// ── Animated Counter Hook ─────────────────────────────────────────
// Provides a ref-based counting animation from 0 to `target`.
import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

export function useAnimatedCounter(target, duration = 1200) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const hasRun = useRef(false);

  useEffect(() => {
    if (!isInView || hasRun.current) return;
    hasRun.current = true;

    const numTarget = typeof target === 'string' ? parseFloat(target) : target;
    if (isNaN(numTarget) || numTarget === 0) {
      setCount(numTarget || 0);
      return;
    }

    const start = performance.now();
    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * numTarget));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, target, duration]);

  return { count, ref };
}
