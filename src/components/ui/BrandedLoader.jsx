import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";

const MARQUEE_TEXT = "CYNAPSE ENTERPRISE • UNIVERSAL AI COMPLIANCE ENGINE • ";
const LOAD_DURATION = 3200;
const TICK_INTERVAL = 30;
const EXIT_DURATION_MS = 700;
const HOLD_AT_100_MS = 350;

export default function BrandedLoader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const completedRef = useRef(false);
  const exitFallbackRef = useRef(null);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (exitFallbackRef.current) {
      clearTimeout(exitFallbackRef.current);
      exitFallbackRef.current = null;
    }
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    const steps = LOAD_DURATION / TICK_INTERVAL;
    let step = 0;
    const id = setInterval(() => {
      step++;
      const t = step / steps;
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setProgress(Math.min(Math.round(eased * 100), 100));
      if (step >= steps) {
        clearInterval(id);
        setTimeout(() => {
          setIsExiting(true);
          exitFallbackRef.current = setTimeout(finish, EXIT_DURATION_MS + 250);
        }, HOLD_AT_100_MS);
      }
    }, TICK_INTERVAL);
    return () => {
      clearInterval(id);
      if (exitFallbackRef.current) clearTimeout(exitFallbackRef.current);
    };
  }, [finish]);

  const handleExitComplete = useCallback(() => {
    finish();
  }, [finish]);

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {!isExiting && (
        <motion.div
          key="branded-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          className="branded-loader"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#0a1a14",
            overflow: "hidden",
            cursor: "wait",
          }}
        >
          {/* Corner brand badge */}
          <div
            style={{
              position: "absolute",
              top: 28,
              left: 32,
              display: "flex",
              alignItems: "center",
              gap: 8,
              zIndex: 10,
            }}
          >
            <Logo iconOnly className="h-5 w-5 shrink-0" variant="dark" />
          </div>

          {/* Animated vertical bars top-right (like reference) */}
          <div
            style={{
              position: "absolute",
              top: 28,
              right: 32,
              display: "flex",
              alignItems: "end",
              gap: 4,
              height: 22,
              zIndex: 10,
            }}
          >
            {[14, 22, 10, 18, 12].map((h, i) => (
              <motion.div
                key={i}
                animate={{ height: [h, h * 0.4, h] }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  delay: i * 0.12,
                  ease: "easeInOut",
                }}
                style={{
                  width: 3,
                  borderRadius: 2,
                  background: i === 2 ? "#22c55e" : "#94a3b8",
                }}
              />
            ))}
          </div>

          {/* Massive scrolling marquee */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              transform: "translateY(-50%)",
              overflow: "hidden",
              pointerEvents: "none",
            }}
          >
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 18 }}
              style={{
                display: "flex",
                whiteSpace: "nowrap",
                width: "max-content",
              }}
            >
              {[...Array(4)].map((_, i) => (
                <span
                  key={i}
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 900,
                    fontSize: "clamp(4rem, 12vw, 10rem)",
                    color: "transparent",
                    WebkitTextStroke: "1.5px rgba(34,197,94,0.18)",
                    letterSpacing: "-0.03em",
                    lineHeight: 1.1,
                    userSelect: "none",
                    paddingRight: "0.5em",
                  }}
                >
                  {MARQUEE_TEXT}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Center loading pill */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            style={{
              position: "relative",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              gap: 40,
              background: "#0f2a1e",
              border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 99,
              padding: "18px 36px",
              boxShadow:
                "0 0 60px rgba(34,197,94,0.12), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(34,197,94,0.08)",
              minWidth: 280,
            }}
          >
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 800,
                fontSize: 16,
                color: "#e2e8f0",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Loading
            </span>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 800,
                fontSize: 16,
                color: "#22c55e",
                letterSpacing: "0.05em",
                fontVariantNumeric: "tabular-nums",
                minWidth: 50,
                textAlign: "right",
              }}
            >
              {progress}%
            </span>

            {/* Glow ring around pill */}
            <div
              style={{
                position: "absolute",
                inset: -2,
                borderRadius: 99,
                border: "1.5px solid rgba(34,197,94,0.3)",
                pointerEvents: "none",
              }}
            />
          </motion.div>

          {/* Bottom progress bar */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 3,
              background: "rgba(34,197,94,0.08)",
            }}
          >
            <motion.div
              style={{
                height: "100%",
                background: "linear-gradient(90deg, #22c55e, #4ade80)",
                boxShadow: "0 0 16px rgba(34,197,94,0.5)",
                borderRadius: "0 2px 2px 0",
              }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.05, ease: "linear" }}
            />
          </div>

          {/* Subtle background gradients */}
          <div
            style={{
              position: "absolute",
              top: "20%",
              left: "10%",
              width: 400,
              height: 400,
              background: "radial-gradient(circle, rgba(34,197,94,0.06), transparent 70%)",
              borderRadius: "50%",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "10%",
              right: "15%",
              width: 300,
              height: 300,
              background: "radial-gradient(circle, rgba(34,197,94,0.04), transparent 70%)",
              borderRadius: "50%",
              pointerEvents: "none",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
