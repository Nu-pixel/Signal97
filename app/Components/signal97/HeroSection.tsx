"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";

const steps = [
  {
    title: "We alert",
    short: "Consistent rules scan → qualified alerts surface",
    expanded:
      "We run a consistent, rules-based process in the background. Only qualified setups become alerts. No spam.",
  },
  {
    title: "You decide",
    short: "You choose what fits → place trades yourself",
    expanded:
      "You choose if an alert fits your plan and place trades on your own secure broker. We never touch your funds.",
  },
  {
    title: "We track",
    short: "Mark what you took → see outcomes clearly",
    expanded:
      "You mark which alerts you took. Signal 97 tracks entries, exits, and targets like +4%, so you can see outcomes without spreadsheets.",
  },
];

// 🔷 Futuristic floor-grid + glow background
function SignalGridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* soft sky → white base */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#dff1ff] via-white to-white" />

      {/* perspective grid “floor” */}
      <div
        className="absolute inset-0 opacity-55"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(56,189,248,0.8) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56,189,248,0.8) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          transform: "perspective(650px) rotateX(60deg)",
          transformOrigin: "center top",
        }}
      />

      {/* floating color glows — much lighter & pushed out of the focal area */}
      <div
        className="absolute -top-10 left-[10%] w-72 h-72 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full blur-3xl opacity-15"
      />
      <div
        className="absolute top-10 right-[8%] w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full blur-3xl opacity-14"
        style={{ animationDelay: "1s", animationDuration: "4s" }}
      />
      <div
        className="absolute -bottom-16 left-[55%] w-80 h-80 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full blur-3xl opacity-10"
        style={{ animationDelay: "2s", animationDuration: "5s" }}
      />

      {/* subtle vertical light beams */}
      <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-cyan-400/55 to-transparent blur-sm" />
      <div
        className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-blue-400/55 to-transparent blur-sm"
        style={{ animationDelay: "1.5s" }}
      />

      {/* geometric outlines */}
      {/* original rotating square – top right */}
      <div
        className="absolute top-32 right-16 w-32 h-32 border-2 border-cyan-400/40 rounded-2xl rotate-12 animate-spin"
        style={{ animationDuration: "22s" }}
      />
      {/* new square – opposite side, lower bottom-left */}
      <div
        className="absolute bottom-24 left-10 w-28 h-28 border-2 border-blue-400/35 rounded-2xl -rotate-12 animate-spin"
        style={{ animationDuration: "26s" }}
      />

      {/* small bouncing square (kept) */}
      <div
        className="absolute top-1/2 right-1/4 w-16 h-16 border-2 border-blue-400/40 rounded-lg -rotate-12 animate-bounce"
        style={{ animationDuration: "7s" }}
      />
    </div>
  );
}

export default function HeroSection({
  onLaunchDemo,
}: {
  onLaunchDemo: () => void;
}) {
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const [workspaceState, setWorkspaceState] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setWorkspaceState((prev) => (prev + 1) % 2),
      4000
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden">
      {/* 🔷 Background floor grid */}
      <SignalGridBackground />

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* LEFT – Signal 97 hero copy */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Fewer, better stock &amp; options alerts, built for real life.
          </h1>
          <p className="text-lg md:text-xl text-slate-700 mb-8 leading-relaxed max-w-xl">
            Signal 97 quietly scans the market with fixed rules and historical
            checks, and surfaces a small number of structured alerts you can act
            on in your own account.
          </p>

          <div className="space-y-3 mb-8">
            {steps.map((step, index) => {
              const isActive = expandedStep === index;
              return (
                <motion.button
                  type="button"
                  key={index}
                  onClick={() => setExpandedStep(isActive ? null : index)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className={`w-full text-left bg-white/85 backdrop-blur-sm rounded-2xl p-5 border-2 flex gap-3 items-start transition-all ${
                    isActive
                      ? "border-blue-500 shadow-xl shadow-blue-500/20"
                      : "border-slate-200 hover:border-blue-300 shadow-sm"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-semibold shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-base mb-1">
                      {step.title}
                    </div>
                    <div className="text-[13px] text-slate-600">
                      {isActive ? step.expanded : step.short}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <button
            onClick={onLaunchDemo}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-sm font-medium shadow-lg shadow-blue-500/30 transition-all"
          >
            Launch interactive demo
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* RIGHT – Today at a glance card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={workspaceState}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    Today at a glance
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Sample workspace · Demo data
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-slate-50 text-[10px] text-slate-500">
                  Live preview
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 rounded-2xl p-4">
                  <div className="text-[10px] text-slate-500 mb-1">
                    Watching
                  </div>
                  <div className="text-2xl font-semibold text-slate-900">
                    {workspaceState === 0 ? 18 : 21}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4">
                  <div className="text-[10px] text-slate-500 mb-1">
                    New alerts
                  </div>
                  <div className="text-[11px] text-slate-800">
                    GO: {workspaceState === 0 ? 3 : 5} · SCALP:{" "}
                    {workspaceState === 0 ? 2 : 1} · WAIT: 5
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="bg-emerald-50 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">
                      {workspaceState === 0 ? "LCID" : "PLTR"}
                    </div>
                    <div className="text-[10px] text-slate-600">
                      Call bias · 0–7 days · Qualified{" "}
                      {workspaceState === 0 ? "2h ago" : "45m ago"}
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[9px] font-semibold">
                    GO
                  </span>
                </div>

                <div className="bg-amber-50 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">
                      {workspaceState === 0 ? "SOFI" : "RIVN"}
                    </div>
                    <div className="text-[10px] text-slate-600">
                      Put bias · 0–3 days · Qualified{" "}
                      {workspaceState === 0 ? "4h ago" : "1h ago"}
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-[9px] font-semibold">
                    SCALP
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-600">
                Your trades (sample): 2 open ·{" "}
                <span className="text-emerald-600 font-semibold">
                  +{workspaceState === 0 ? "4.1" : "5.2"}%
                </span>
                ,{" "}
                <span className="text-emerald-600 font-semibold">
                  +{workspaceState === 0 ? "3.6" : "4.8"}%
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
