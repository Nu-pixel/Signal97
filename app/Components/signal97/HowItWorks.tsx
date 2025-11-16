"use client";

import React from "react";
import { motion } from "framer-motion";
import { Eye, CheckSquare, Tag, UserCheck, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Eye,
    title: "Curated watch",
    description:
      "We monitor a focused list that fits our rules, not every ticker.",
  },
  {
    icon: CheckSquare,
    title: "Verified moves",
    description:
      "Alerts only appear after specific price behavior happens, not on guesses.",
  },
  {
    icon: Tag,
    title: "Clear labels",
    description:
      "Each alert is tagged in plain language (GO / SCALP / WAIT).",
  },
  {
    icon: UserCheck,
    title: "Your decision",
    description:
      "You choose entries, exits, and size on your own broker.",
  },
  {
    icon: BarChart3,
    title: "Track & reflect",
    description:
      "You see how alerts you took played out—without building your own tracker.",
  },
];

const sampleTickers = [
  { symbol: "AAPL", label: "CALL bias", change: "+2.1%" },
  { symbol: "TSLA", label: "SCALP", change: "-0.8%" },
  { symbol: "LCID", label: "GO", change: "+4.0%" },
  { symbol: "PLTR", label: "WAIT", change: "+0.3%" },
  { symbol: "RIVN", label: "PUT bias", change: "-1.6%" },
  { symbol: "BTC", label: "Crypto watch", change: "+3.7%" },
];

// 🔹 FULL-WIDTH ticker bridge (white background, continuous scroll)
function HeroToHowBridgeTicker() {
  // repeat more so the scroll feels continuous
  const loopData = [
    ...sampleTickers,
    ...sampleTickers,
    ...sampleTickers,
    ...sampleTickers,
  ];

  return (
    <div className="bg-white">
      <div className="relative overflow-hidden bg-white border-y border-slate-100/80 shadow-sm shadow-slate-200/60">
        {/* Top label bar */}
        <div className="px-6 py-2 flex items-center">
          <span className="text-[11px] md:text-xs font-semibold tracking-[0.12em] uppercase text-slate-500">
            SAMPLE TICKERS
          </span>
        </div>

        {/* Scrolling row */}
        <div className="relative h-10 md:h-11 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 flex items-center gap-8 px-6 min-w-max"
            initial={{ x: 0 }}
            animate={{ x: "-50%" }}
            transition={{
              repeat: Infinity,
              duration: 40,
              ease: "linear",
            }}
          >
            {loopData.map((t, idx) => {
              const isNeg = t.change.trim().startsWith("-");
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-[11px] md:text-xs whitespace-nowrap"
                >
                  <span className="font-semibold text-slate-900">
                    {t.symbol}
                  </span>
                  <span className="text-slate-400">· {t.label}</span>
                  <span
                    className={`px-2 py-[2px] rounded-full text-[10px] md:text-[11px] font-semibold ${
                      isNeg
                        ? "bg-red-50 text-red-600"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {t.change}
                  </span>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <>
      {/* 🔹 Bridge ticker between hero + this section */}
      <HeroToHowBridgeTicker />

      {/* 🔹 Main “How it fits” section — solid #187bcd */}
      <section
        id="how"
        className="relative overflow-hidden bg-[#187bcd] py-20 px-6"
      >
        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4">
              How Signal 97 fits into your day
            </h2>
            <p className="text-sm md:text-base text-blue-50 max-w-2xl mx-auto">
              The underlying rules and research stay internal. You see only what
              you need to make calm, intentional decisions.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-lg shadow-slate-900/20 border border-white/60 hover:shadow-xl hover:shadow-slate-900/30 transition-all"
                >
                  <div className="bg-blue-50 text-blue-600 w-10 h-10 rounded-2xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm md:text-base font-semibold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
