import { motion } from "framer-motion";
import { ReactNode } from "react";

function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    color: `rgba(255,255,255,${0.04 + i * 0.015})`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      viewBox="0 0 696 316"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      {paths.map((path) => (
        <motion.path
          key={path.id}
          d={path.d}
          stroke={path.color}
          strokeWidth={path.width}
          strokeOpacity={0.1 + path.id * 0.018}
          initial={{ pathLength: 0.3, opacity: 0.5 }}
          animate={{
            pathLength: 1,
            opacity: [0.2, 0.5, 0.2],
            pathOffset: [0, 1, 0],
          }}
          transition={{
            duration: 20 + (path.id % 7) * 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </svg>
  );
}

/**
 * BackgroundPaths — renders animated SVG path overlays inside the parent container.
 * This component is a TRANSPARENT WRAPPER: it adds NO height/width/flex constraints.
 * The animated SVGs are position:absolute so they stretch to fill the nearest
 * position:relative ancestor (the hero-card), and children render in normal flow.
 */
export function BackgroundPaths({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Layer 1: flowing paths from bottom-left */}
      <FloatingPaths position={1} />
      {/* Layer 2: flowing paths from top-right (mirrored) */}
      <FloatingPaths position={-1} />
      {/* Children render in normal document flow — no wrapper div that could collapse */}
      {children}
    </>
  );
}
