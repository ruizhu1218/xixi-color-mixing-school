import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface ConfettiPiece {
  id: number;
  x: number; // percentage left
  delay: number; // seconds
  duration: number; // seconds
  size: number; // pixels
  color: string;
  shape: "circle" | "square" | "triangle";
}

const MEMPHIS_COLORS = [
  "#E63329", // Red
  "#FCE300", // Yellow
  "#1B4CA1", // Blue
  "#F5821F", // Orange
  "#0B8A3C", // Green
  "#7B2A90", // Violet
  "#C0186A", // Magenta
  "#009E8E", // Teal
];

export default function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const generated: ConfettiPiece[] = Array.from({ length: 60 }).map((_, idx) => {
      const shapes: ("circle" | "square" | "triangle")[] = [
        "circle",
        "square",
        "triangle",
      ];
      return {
        id: idx,
        x: Math.random() * 100,
        delay: Math.random() * 1.5,
        duration: 2 + Math.random() * 2.5,
        size: 8 + Math.random() * 12,
        color: MEMPHIS_COLORS[Math.floor(Math.random() * MEMPHIS_COLORS.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      };
    });
    setPieces(generated);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => {
        // Render shape
        let borderRadius = "0px";
        if (p.shape === "circle") {
          borderRadius = "50%";
        }

        return (
          <motion.div
            key={p.id}
            initial={{
              y: -50,
              x: `${p.x}vw`,
              opacity: 1,
              rotate: 0,
            }}
            animate={{
              y: "110vh",
              x: `${p.x + (Math.random() * 12 - 6)}vw`,
              opacity: [1, 1, 0.8, 0],
              rotate: 360 + Math.random() * 360,
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: "linear",
              repeat: 0,
            }}
            style={{
              position: "absolute",
              width: p.size,
              height: p.size,
              backgroundColor: p.shape !== "triangle" ? p.color : "transparent",
              borderLeft:
                p.shape === "triangle" ? `${p.size / 2}px solid transparent` : "",
              borderRight:
                p.shape === "triangle" ? `${p.size / 2}px solid transparent` : "",
              borderBottom:
                p.shape === "triangle" ? `${p.size}px solid ${p.color}` : "",
              borderRadius: borderRadius,
            }}
          />
        );
      })}
    </div>
  );
}
