"use client";

import React from "react";

type Props = {
  speed?: "slow" | "normal" | "fast";
  opacity?: number;
  light?: boolean;
};

const SPEEDS = { slow: 36, normal: 22, fast: 12 };

export default function ForecastBandsBackground({
  speed = "normal",
  opacity = 1,
  light = false,
}: Props) {
  const dur = SPEEDS[speed] ?? SPEEDS.normal;
  const palette = light
    ? { bg0: "#ffffff", bg1: "#fbfdff", glowA: "#bdefff", glowB: "#ffd6e8" }
    : { bg0: "#f8fbff", bg1: "#fff7fb", glowA: "#7dd3fc", glowB: "#fbcfe8" };

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
      style={{ opacity }}
    >
      {/* Large CSS-blurred divs for soft, cheap glow */}
      <div className="absolute -left-40 -top-40 w-[520px] h-[520px] rounded-full blur-3xl"
           style={{ background: palette.glowA, opacity: 0.75, mixBlendMode: "screen", transformOrigin: "center" }} />
      <div className="absolute right-10 top-44 w-[420px] h-[420px] rounded-full blur-3xl"
           style={{ background: palette.glowB, opacity: 0.6, mixBlendMode: "screen", transformOrigin: "center" }} />
      <div className="absolute left-[20%] bottom-20 w-[360px] h-[360px] rounded-full blur-2xl"
           style={{ background: palette.glowA, opacity: 0.48, mixBlendMode: "screen", transformOrigin: "center" }} />

      {/* SVG for subtle layered gradients and animated masks */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="aurora-bg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={palette.bg0} stopOpacity="1" />
            <stop offset="100%" stopColor={palette.bg1} stopOpacity="1" />
          </linearGradient>

          <radialGradient id="aurora-a" cx="30%" cy="20%" r="40%">
            <stop offset="0%" stopColor={palette.glowA} stopOpacity="0.95" />
            <stop offset="45%" stopColor={palette.glowA} stopOpacity="0.20" />
            <stop offset="100%" stopColor={palette.glowA} stopOpacity="0" />
          </radialGradient>

          <radialGradient id="aurora-b" cx="70%" cy="60%" r="40%">
            <stop offset="0%" stopColor={palette.glowB} stopOpacity="0.9" />
            <stop offset="45%" stopColor={palette.glowB} stopOpacity="0.18" />
            <stop offset="100%" stopColor={palette.glowB} stopOpacity="0" />
          </radialGradient>

          <filter id="softBlur">
            <feGaussianBlur stdDeviation="18" result="b" />
            <feBlend in="SourceGraphic" in2="b" mode="screen" />
          </filter>

          <style>{`
            /* gentle, very long drifting movement */
            @keyframes auroraFloatA {
              0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.85; }
              50% { transform: translateY(-1.2%) translateX(1.0%) scale(1.03); opacity: 1; }
              100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.85; }
            }
            @keyframes auroraFloatB {
              0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.72; }
              50% { transform: translateY(1.6%) translateX(-1.2%) scale(1.04); opacity: 0.96; }
              100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.72; }
            }
            @keyframes auroraSoftSweep {
              0% { transform: translateX(-4%); opacity: 0.0; }
              20% { opacity: 0.35; }
              80% { opacity: 0.35; }
              100% { transform: translateX(4%); opacity: 0.0; }
            }

            .s97-aurora-a { animation: auroraFloatA ${dur}s ease-in-out infinite; transform-origin: 50% 50%; will-change: transform, opacity; }
            .s97-aurora-b { animation: auroraFloatB ${dur + 8}s ease-in-out infinite; transform-origin: 50% 50%; will-change: transform, opacity; }
            .s97-aurora-sweep { animation: auroraSoftSweep ${dur + 6}s ease-in-out infinite; will-change: transform, opacity; }

            /* Respect reduced motion */
            @media (prefers-reduced-motion: reduce) {
              .s97-aurora-a, .s97-aurora-b, .s97-aurora-sweep {
                animation: none !important;
                opacity: 0.85;
              }
            }
          `}</style>
        </defs>

        {/* background wash */}
        <rect x="0" y="0" width="100" height="100" fill="url(#aurora-bg)" />

        {/* large radial glows (animated groups) */}
        <g className="s97-aurora-a">
          <circle cx="30" cy="20" r="38" fill="url(#aurora-a)" filter="url(#softBlur)" />
        </g>

        <g className="s97-aurora-b">
          <circle cx="70" cy="60" r="36" fill="url(#aurora-b)" filter="url(#softBlur)" />
        </g>

        {/* gentle sweep overlay to add motion and color variation */}
        <g className="s97-aurora-sweep" style={{ mixBlendMode: "screen" }}>
          <rect x="-8" y="10" width="116" height="36" rx="18" fill="url(#aurora-b)" opacity="0.12" />
        </g>
      </svg>
    </div>
  );
}
