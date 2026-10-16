"use client";

import { useEffect, useState, type CSSProperties } from "react";
import styles from "./PracticeConfetti.module.css";

const COLORS = ["#e9b949", "#f8d97b", "#34b993", "#7da8df", "#d5c5f6", "#e8cf97"];
// Stable variation keeps the shower evenly spread without hydration differences.
const PIECES = Array.from({ length: 112 }, (_, index) => {
  const shape = index % 9 === 0 ? "diamond" : index % 5 === 0 ? "ribbon" : "paper";
  const scale = 0.65 + ((index * 7) % 11) / 15;
  return {
    shape,
    style: {
      left: `${(index * 61.8034) % 100}%`,
      width: `${(shape === "ribbon" ? 4 : 7) * scale}px`,
      height: `${(shape === "ribbon" ? 21 : shape === "diamond" ? 7 : 11) * scale}px`,
      "--confetti-color": COLORS[index % COLORS.length],
      "--confetti-delay": `${(index * 73) % 1100}ms`,
      "--confetti-duration": `${3600 + ((index * 107) % 1200)}ms`,
      "--confetti-drift": `${((index * 13) % 19) - 9}vw`,
      "--confetti-sway": `${12 + ((index * 17) % 25)}px`,
      "--confetti-turn": `${1600 + ((index * 137) % 1700)}ms`,
      "--confetti-phase": `${-((index * 179) % 2400)}ms`,
      "--confetti-rotation": `${(index * 47) % 360}deg`,
      "--confetti-opacity": 0.65 + ((index * 3) % 8) / 20,
    } as CSSProperties,
  };
});

export default function PracticeConfetti() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(false), 6200);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={styles.celebration}
      aria-hidden="true"
      data-testid="practice-confetti"
    >
      {PIECES.map(({ style, shape }, index) => (
        <span key={index} className={styles.fall} style={style}>
          <span className={`${styles.piece} ${styles[shape]}`} />
        </span>
      ))}
    </div>
  );
}
