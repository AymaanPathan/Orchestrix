"use client";

import { useEffect, useId, useRef } from "react";
import { animate, useMotionValue } from "framer-motion";

interface EtheralShadowProps {
  intensity?: number; // 0.6 – 1.4
  speed?: number; // 0.3 – 1
  className?: string;
}

export default function EtheralShadow({
  intensity = 1,
  speed = 0.6,
  className,
}: EtheralShadowProps) {
  const id = useId().replace(/:/g, "");
  const seed = useMotionValue(0);
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);

  useEffect(() => {
    const controls = animate(seed, 1000, {
      duration: 80 / speed,
      repeat: Infinity,
      ease: "linear",
      onUpdate: (v) => {
        turbulenceRef.current?.setAttribute("seed", v.toFixed(0));
      },
    });

    return () => controls.stop();
  }, [speed, seed]);

  return (
    <div
      className={`absolute inset-0 overflow-hidden bg-black ${className ?? ""}`}
      aria-hidden
    >
      <svg
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        className="absolute inset-0"
      >
        <defs>
          {/* Stronger monochrome gradient */}
          <linearGradient id={`${id}-gradient`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.04)" />
            <stop offset="35%" stopColor="rgba(255,255,255,0.14)" />
            <stop offset="65%" stopColor="rgba(255,255,255,0.14)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
          </linearGradient>

          {/* Animated distortion */}
          <filter id={`${id}-distort`}>
            <feTurbulence
              ref={turbulenceRef}
              type="fractalNoise"
              baseFrequency="0.0015 0.0025"
              numOctaves={3}
              seed="0"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={18 * intensity}
            />
            <feGaussianBlur stdDeviation={30 * intensity} />
          </filter>

          {/* Ambient glow */}
          <filter id={`${id}-glow`}>
            <feGaussianBlur stdDeviation="120" />
          </filter>
        </defs>

        {/* Flow band 1 */}
        <path
          d="M -500 900 C 200 500, 700 350, 1500 -200"
          stroke={`url(#${id}-gradient)`}
          strokeWidth={260}
          fill="none"
          filter={`url(#${id}-distort)`}
          opacity={0.6}
        />

        {/* Flow band 2 */}
        <path
          d="M 1600 1100 C 900 650, 600 500, -300 150"
          stroke={`url(#${id}-gradient)`}
          strokeWidth={240}
          fill="none"
          filter={`url(#${id}-distort)`}
          opacity={0.55}
        />

        {/* Flow band 3 (subtle) */}
        <path
          d="M -400 1200 C 400 800, 900 700, 1800 200"
          stroke={`url(#${id}-gradient)`}
          strokeWidth={200}
          fill="none"
          filter={`url(#${id}-distort)`}
          opacity={0.4}
        />

        {/* Center depth glow */}
        <ellipse
          cx="50%"
          cy="50%"
          rx="50%"
          ry="45%"
          fill="rgba(255,255,255,0.03)"
          filter={`url(#${id}-glow)`}
        />
      </svg>
    </div>
  );
}
