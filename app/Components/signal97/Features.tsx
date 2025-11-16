"use client";

import React from "react";
import { motion } from "framer-motion";
import { Activity, Bell, TrendingUp } from "lucide-react";

// 🔹 Soft candlestick background (green & red, very subtle)
function CandlesBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 120 40"
        preserveAspectRatio="none"
        className="w-full h-full opacity-[0.10]"
      >
        {/* light vertical wash so it feels like a panel */}
        <defs>
          <linearGradient id="candles-bg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="100%" stopColor="#f8fafc" stopOpacity="1" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="120" height="40" fill="url(#candles-bg)" />

        {/* Green candles */}
        <g stroke="#22c55e" strokeWidth="0.6" fill="#22c55e">
          {/* left cluster */}
          <line x1="10" y1="5" x2="10" y2="32" />
          <rect x="8" y="14" width="4" height="10" rx="1" />

          <line x1="22" y1="8" x2="22" y2="34" />
          <rect x="20" y="16" width="4" height="9" rx="1" />

          <line x1="34" y1="6" x2="34" y2="30" />
          <rect x="32" y="13" width="4" height="8" rx="1" />
        </g>

        {/* Red candles */}
        <g stroke="#ef4444" strokeWidth="0.6" fill="#ef4444">
          {/* right cluster */}
          <line x1="78" y1="7" x2="78" y2="33" />
          <rect x="76" y="18" width="4" height="9" rx="1" />

          <line x1="92" y1="5" x2="92" y2="31" />
          <rect x="90" y="15" width="4" height="10" rx="1" />

          <line x1="106" y1="9" x2="106" y2="35" />
          <rect x="104" y="20" width="4" height="8" rx="1" />
        </g>
      </svg>
    </div>
  );
}

export default function Features() {
  return (
    <section
      id="features"
      className="relative py-24 px-6 bg-white/30 overflow-hidden"
    >
      {/* subtle candles in the background */}
      <CandlesBackground />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            A quick look inside
          </h2>
        </motion.div>

        {/* Feature 1: Today Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-8 items-center mb-20"
        >
          <div>
            <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Today overview
            </h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                Market mood (Calm / Choppy / Risky)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                How many symbols are being watched
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                How many new alerts by label
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                How many trades you're tracking
              </li>
            </ul>
            <p className="mt-4 text-gray-700 font-medium">
              Answer: Do I need to pay attention right now?
            </p>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-200">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-gray-900">Market Status</h4>
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                  Calm
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4">
                  <div className="text-xs text-gray-500">Watching</div>
                  <div className="text-2xl font-bold text-gray-900">18</div>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <div className="text-xs text-gray-500">Alerts</div>
                  <div className="text-2xl font-bold text-blue-600">10</div>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <div className="text-xs text-gray-500">Open trades</div>
                  <div className="text-2xl font-bold text-green-600">3</div>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <div className="text-xs text-gray-500">Today P&amp;L</div>
                  <div className="text-2xl font-bold text-green-600">+2.8%</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature 2: Alerts Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-8 items-center mb-20"
        >
          <div className="order-2 md:order-1">
            <div className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-4">Signal 97 Alerts</h4>
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-gray-900">PLTR</div>
                    <div className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                      GO
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    Call bias · 0–7 days · 2h ago
                  </div>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-gray-900">SOFI</div>
                    <div className="bg-orange-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                      SCALP
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    Put bias · 0–3 days · 4h ago
                  </div>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-gray-900">TSLA</div>
                    <div className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      WAIT
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    Neutral · Monitoring · 6h ago
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="bg-orange-100 text-orange-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Alerts feed
            </h3>
            <p className="text-gray-600 mb-4">Each alert shows:</p>
            <ul className="space-y-2 text-gray-600 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">•</span>
                Symbol, bias (call/put or up/down)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">•</span>
                Time qualified
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">•</span>
                Label (GO / SCALP / WAIT)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">•</span>
                Window (e.g. 0–7 days)
              </li>
            </ul>
            <p className="text-gray-700 font-medium">
              Only alerts that pass our rules appear here. No random call-outs.
            </p>
          </div>
        </motion.div>

        {/* Feature 3: Your Trades */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-8 items-center"
        >
          <div>
            <div className="bg-green-100 text-green-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Your trades
            </h3>
            <p className="text-gray-600 mb-4">
              You confirm which alerts you took; Signal 97 keeps the history
              neat.
            </p>
            <p className="text-gray-700 font-medium">
              Simple table showing: symbol, entry, current/exit, P&amp;L %
            </p>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-4">Active Trades</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-600 font-medium">
                      Symbol
                    </th>
                    <th className="text-left py-2 text-gray-600 font-medium">
                      Entry
                    </th>
                    <th className="text-left py-2 text-gray-600 font-medium">
                      Current
                    </th>
                    <th className="text-right py-2 text-gray-600 font-medium">
                      P&amp;L
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 font-medium text-gray-900">PLTR</td>
                    <td className="py-3 text-gray-600">$24.50</td>
                    <td className="py-3 text-gray-600">$25.60</td>
                    <td className="py-3 text-right font-semibold text-green-600">
                      +4.5%
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 font-medium text-gray-900">LCID</td>
                    <td className="py-3 text-gray-600">$3.20</td>
                    <td className="py-3 text-gray-600">$3.32</td>
                    <td className="py-3 text-right font-semibold text-green-600">
                      +3.8%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium text-gray-900">SOFI</td>
                    <td className="py-3 text-gray-600">$8.90</td>
                    <td className="py-3 text-gray-600">$8.75</td>
                    <td className="py-3 text-right font-semibold text-red-600">
                      -1.7%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
