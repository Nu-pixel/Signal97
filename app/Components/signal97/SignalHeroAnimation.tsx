"use client";

// Pure ambient background: soft glows + scan lines
// No text, no chips, no extra UI.

export default function SignalHeroAnimation() {
  return (
    <>
      {/* NOTE: z-0 so the animation sits above the parent's background
          but behind page content (which uses z-10). */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        {/* Soft radial glows */}
        <div className="absolute -right-40 -top-40 w-[520px] h-[520px] bg-blue-200/40 blur-3xl rounded-full animate-s97-pulse-slow" />
        <div className="absolute right-10 top-40 w-[340px] h-[340px] bg-blue-100/40 blur-3xl rounded-full animate-s97-pulse-slower" />
        <div className="absolute right-[22%] top-[60%] w-[260px] h-[260px] bg-pink-100/30 blur-3xl rounded-full animate-s97-pulse-slowest" />

        {/* Subtle vertical scan line */}
        <div className="absolute right-[18%] top-16 bottom-10 w-px bg-gradient-to-b from-transparent via-blue-300/40 to-transparent animate-s97-scan-vertical" />

        {/* Subtle horizontal scan line */}
        <div className="absolute left-1/2 right-6 top-[72%] h-px bg-gradient-to-r from-transparent via-blue-300/30 to-transparent animate-s97-scan-horizontal" />
      </div>

      <style jsx global>{`
        @keyframes s97-pulse-slow {
          0% {
            opacity: 0.55;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.06);
          }
          100% {
            opacity: 0.55;
            transform: scale(1);
          }
        }
        .animate-s97-pulse-slow {
          animation: s97-pulse-slow 9s ease-in-out infinite;
        }

        @keyframes s97-pulse-slower {
          0% {
            opacity: 0.25;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.08);
          }
          100% {
            opacity: 0.25;
            transform: scale(1);
          }
        }
        .animate-s97-pulse-slower {
          animation: s97-pulse-slower 13s ease-in-out infinite;
        }

        @keyframes s97-pulse-slowest {
          0% {
            opacity: 0.16;
            transform: scale(0.96);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.04);
          }
          100% {
            opacity: 0.16;
            transform: scale(0.96);
          }
        }
        .animate-s97-pulse-slowest {
          animation: s97-pulse-slowest 18s ease-in-out infinite;
        }

        @keyframes s97-scan-vertical {
          0% {
            opacity: 0;
            transform: translateY(40px);
          }
          15% {
            opacity: 0.8;
          }
          85% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
            transform: translateY(-40px);
          }
        }
        .animate-s97-scan-vertical {
          animation: s97-scan-vertical 7s ease-in-out infinite;
        }

        @keyframes s97-scan-horizontal {
          0% {
            opacity: 0;
            transform: translateX(-40px);
          }
          20% {
            opacity: 0.7;
          }
          80% {
            opacity: 0.7;
          }
          100% {
            opacity: 0;
            transform: translateX(40px);
          }
        }
        .animate-s97-scan-horizontal {
          animation: s97-scan-horizontal 9s ease-in-out infinite;
        }

        /* Respect reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .animate-s97-pulse-slow,
          .animate-s97-pulse-slower,
          .animate-s97-pulse-slowest,
          .animate-s97-scan-vertical,
          .animate-s97-scan-horizontal {
            animation: none !important;
            opacity: 0.6;
          }
        }
      `}</style>
    </>
  );
}
