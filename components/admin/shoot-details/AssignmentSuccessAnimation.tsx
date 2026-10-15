"use client";

import React from "react";

type Spark = {
  x: number;
  y: number;
  rotation: number;
  delay: number;
  width: number;
  height: number;
  color: string;
};

const sparks: Spark[] = [
  {
    x: -57,
    y: -18,
    rotation: -22,
    delay: 155,
    width: 4,
    height: 9,
    color: "#E8AF5C",
  },
  {
    x: -45,
    y: -42,
    rotation: 35,
    delay: 220,
    width: 4,
    height: 8,
    color: "#86BC91",
  },
  {
    x: -16,
    y: -57,
    rotation: -35,
    delay: 135,
    width: 4,
    height: 8,
    color: "#E58179",
  },
  {
    x: 24,
    y: -55,
    rotation: 32,
    delay: 200,
    width: 4,
    height: 9,
    color: "#7B9DE3",
  },
  {
    x: 51,
    y: -36,
    rotation: -30,
    delay: 180,
    width: 5,
    height: 7,
    color: "#C6AA71",
  },
  {
    x: 60,
    y: -5,
    rotation: 40,
    delay: 230,
    width: 3,
    height: 9,
    color: "#A1C88E",
  },
  {
    x: 53,
    y: 29,
    rotation: -25,
    delay: 150,
    width: 4,
    height: 7,
    color: "#DF817B",
  },
  {
    x: 30,
    y: 53,
    rotation: 30,
    delay: 245,
    width: 4,
    height: 9,
    color: "#7DAEE2",
  },
  {
    x: -11,
    y: 57,
    rotation: -37,
    delay: 175,
    width: 5,
    height: 7,
    color: "#E8B262",
  },
  {
    x: -46,
    y: 39,
    rotation: 25,
    delay: 210,
    width: 4,
    height: 9,
    color: "#9CBD9A",
  },
  {
    x: -62,
    y: 12,
    rotation: -42,
    delay: 195,
    width: 4,
    height: 8,
    color: "#CBA0CC",
  },
];

/**
 * One-time celebration shared by Producer and Editor assignment success modals.
 * The badge and checkmark stay visible after the burst finishes. Mount only
 * when the success step is reached so animation starts once per assignment.
 */
export default function AssignmentSuccessAnimation() {
  return (
    <div
      className="assignment-success-root relative mx-auto flex h-20 w-36 items-center justify-center overflow-visible"
      aria-hidden="true"
    >
      <div className="assignment-success-badge relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-[#E8D1AB] text-[#171717] shadow-[0_0_0_8px_rgba(232,209,171,0.06)]">
        <svg
          className="h-12 w-12"
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden="true"
        >
          <path
            className="assignment-success-mark"
            d="M16 33L28 44L49 21"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="80"
          />
        </svg>
      </div>
      {sparks.map((spark, index) => (
        <span
          key={index}
          className="assignment-success-spark pointer-events-none absolute left-1/2 top-1/2 z-0 rounded-[2px]"
          style={
            {
              width: spark.width,
              height: spark.height,
              backgroundColor: spark.color,
              animationDelay: `${spark.delay}ms`,
              "--assignment-spark-x": `${spark.x}px`,
              "--assignment-spark-y": `${spark.y}px`,
              "--assignment-spark-rotation": `${spark.rotation}deg`,
            } as React.CSSProperties
          }
        />
      ))}
      <style>{`
        .assignment-success-badge {
          animation: assignment-success-pop 480ms cubic-bezier(0.22, 1.35, 0.4, 1) 1 both;
        }
        .assignment-success-mark {
          stroke-dashoffset: 0;
          animation: assignment-success-draw 470ms cubic-bezier(0.25, 0.8, 0.3, 1) 240ms 1 both;
        }
        .assignment-success-spark {
          opacity: 0;
          animation: assignment-success-burst 820ms cubic-bezier(0.2, 0.75, 0.25, 1) 1 both;
        }
        @keyframes assignment-success-pop {
          0% { opacity: 0; transform: scale(0.65); }
          64% { opacity: 1; transform: scale(1.07); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes assignment-success-draw {
          0% { stroke-dashoffset: 80; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes assignment-success-burst {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.2) rotate(0deg);
          }
          22% { opacity: 1; }
          65% { opacity: 0.85; }
          100% {
            opacity: 0;
            transform: translate(calc(-50% + var(--assignment-spark-x)), calc(-50% + var(--assignment-spark-y))) rotate(var(--assignment-spark-rotation)) scale(0.75);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .assignment-success-badge,
          .assignment-success-mark,
          .assignment-success-spark { animation: none !important; }
          .assignment-success-badge { opacity: 1; transform: none; }
          .assignment-success-mark { stroke-dashoffset: 0; }
          .assignment-success-spark { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
