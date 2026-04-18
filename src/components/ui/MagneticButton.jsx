import React, { useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring } from "framer-motion";

const RADIUS = 42;

const MotionLink = motion(Link);

/**
 * Magnetic hover within ~30px influence; springs back on leave.
 */
export default function MagneticButton({
  children,
  className = "",
  href,
  to,
  type = "button",
  onClick,
  ...rest
}) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 520, damping: 34, mass: 0.72 });
  const springY = useSpring(y, { stiffness: 520, damping: 34, mass: 0.72 });

  const handleMove = useCallback(
    (e) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const influence = Math.max(0, 1 - dist / (RADIUS * 4.2));
      const pull = 0.32 + influence * 0.48;
      x.set(dx * pull);
      y.set(dy * pull);
    },
    [x, y]
  );

  const handleLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  const motionStyle = { x: springX, y: springY };

  if (to) {
    return (
      <MotionLink
        ref={ref}
        to={to}
        className={className}
        onClick={onClick}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={motionStyle}
        {...rest}
      >
        {children}
      </MotionLink>
    );
  }

  if (href) {
    return (
      <motion.a
        ref={ref}
        href={href}
        className={className}
        onClick={onClick}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={motionStyle}
        {...rest}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      ref={ref}
      type={type}
      className={className}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={motionStyle}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
