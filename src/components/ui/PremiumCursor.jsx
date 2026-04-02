import React, { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Cynapse green dot + lagging ring. pointer-events-none; hides default cursor on body while mounted.
 */
export default function PremiumCursor() {
  const mx = useMotionValue(-100);
  const my = useMotionValue(-100);

  const ringX = useSpring(mx, { stiffness: 180, damping: 22 });
  const ringY = useSpring(my, { stiffness: 180, damping: 22 });

  const dotX = useSpring(mx, { stiffness: 500, damping: 35 });
  const dotY = useSpring(my, { stiffness: 500, damping: 35 });

  useEffect(() => {
    document.body.classList.add("cyn-premium-cursor-active");
    const onMove = (e) => {
      mx.set(e.clientX);
      my.set(e.clientY);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.body.classList.remove("cyn-premium-cursor-active");
    };
  }, [mx, my]);

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed z-[9998] -translate-x-1/2 -translate-y-1/2"
        style={{ left: ringX, top: ringY }}
      >
        <div className="h-10 w-10 rounded-full border-2 border-[#22c55e]/45 bg-[#22c55e]/[0.08] shadow-[0_0_20px_rgba(34,197,94,0.25)]" />
      </motion.div>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed z-[9999] -translate-x-1/2 -translate-y-1/2"
        style={{ left: dotX, top: dotY }}
      >
        <div className="h-2 w-2 rounded-full bg-[#22c55e] shadow-[0_0_12px_rgba(34,197,94,0.85)]" />
      </motion.div>
    </>
  );
}
