import React from "react";

const LiveWatchlist: React.FC = () => {
  const rows = [
    {
      symbol: "PLTR",
      bias: "Call",
      trigger: "Triggered",
      time: "6h",
      expires: "1d 18h",
    },
    { symbol: "TSLA", bias: "Put", trigger: "2.3%", time: "12h", expires: "1d 12h" },
    { symbol: "RIVN", bias: "Call", trigger: "1.8%", time: "8h", expires: "1d 16h" },
    { symbol: "LCID", bias: "Call", trigger: "Triggered", time: "14h", expires: "10h" },
  ];
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">
        Live Watchlist
      </h1>
      <p className="text-xs text-slate-500 mb-4">
        Names auto-expire after 2 days if they don&apos;t qualify. Sample data only.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[11px] text-slate-500 border-b border-slate-100">
            <tr>
              <th className="py-2 text-left">Symbol</th>
              <th className="py-2 text-left">Bias</th>
              <th className="py-2 text-left">% to trigger</th>
              <th className="py-2 text-left">Time in watch</th>
              <th className="py-2 text-left">Expires</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.symbol} className="border-b border-slate-50">
                <td className="py-2 font-semibold text-slate-900">{r.symbol}</td>
                <td className="py-2">
                  <span
                    className={
                      "px-2 py-0.5 rounded-full text-[9px] " +
                      (r.bias === "Call"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-orange-50 text-orange-700")
                    }
                  >
                    {r.bias}
                  </span>
                </td>
                <td className="py-2 text-slate-700">
                  {r.trigger === "Triggered" ? (
                    <span className="px-2 py-0.5 text-[9px] rounded-full bg-sky-600 text-white">
                      Triggered
                    </span>
                  ) : (
                    r.trigger
                  )}
                </td>
                <td className="py-2 text-slate-700">{r.time}</td>
                <td className="py-2 text-slate-700">{r.expires}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LiveWatchlist;
