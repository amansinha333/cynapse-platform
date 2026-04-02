import React from "react";
import { motion } from "framer-motion";

const spring = {
  type: "spring",
  stiffness: 100,
  damping: 20,
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: spring,
  },
};

/**
 * Document-flow-safe scroll reveal. Use stagger for grids/lists of siblings.
 */
export default function SafeScrollReveal({
  children,
  className = "",
  stagger = false,
  staggerDelay = 0.08,
  ...rest
}) {
  const view = { once: true, margin: "-50px" };

  if (stagger) {
    const containerVariants = {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: 0.04,
        },
      },
    };

    return (
      <motion.div
        className={className}
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={view}
        {...rest}
      >
        {React.Children.map(children, (child, i) =>
          React.isValidElement(child) ? (
            <motion.div key={child.key ?? i} variants={itemVariants} className="min-h-0">
              {child}
            </motion.div>
          ) : (
            child
          )
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={view}
      transition={spring}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
