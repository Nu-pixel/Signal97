import React from "react";

const ActiveTrades: React.FC = () => {
  const rows = [
    {
      symbol: "PLTR",
      side: "Call",
      size: "5 contracts",
      entry: "$24.50",
      current: "$25.60",
      pnl: "+4.5%",
    },
    {
      symbol: "LCID",
      side: "Call",
      size: "10 contracts",
      entry: "$3.20",
      current: "$3.33",
      pnl: "+4.1%",
    },
    {
      symbol: "NIO",
      side: "Call",
      size: "8 contracts",
      entry: "$6.80",
      current: "$7.05",
      pnl: "+3.7%",
    },
  ];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Active Trades
        </h1>
        <p className="text-xs text-slate-500">
          Based only on trades you marked as taken. Sample data.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[11px] text-slate-500 border-b border-slate-100">
            <tr>
              <th className="py-2 text-left">Symbol</th>
              <th className="py-2 text-left">Side</th>
              <th className="py-2 text-left">Size</th>
              <th className="py-2 text-left">Entry</th>
              <th className="py-2 text-left">Current</th>
              <th className="py-2 text-left">P&amp;L</th>
              <th className="py-2 text-left">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.symbol} className="border-b border-slate-50">
                <td className="py-2 font-semibold text-slate-900">
                  {r.symbol}
                </td>
                <td className="py-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px]">
                    {r.side}
                  </span>
                </td>
                <td className="py-2 text-slate-700">{r.size}</td>
                <td className="py-2 text-slate-700">{r.entry}</td>
                <td className="py-2 text-slate-700">{r.current}</td>
                <td className="py-2 text-emerald-600 font-semibold">
                  {r.pnl}
                </td>
                <td className="py-2 text-slate-500 text-[10px]">
                  Near +4% target
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary row */}
      <div className="grid md:grid-cols-3 gap-4 text-sm">
        <Summary label="Total P&amp;L" value="+$1,247" />
        <Summary label="Avg P&amp;L" value="+4.1%" />
        <Summary label="Open positions" value="3" />
      </div>
    </div>
  );
};

export default ActiveTrades;

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-4">
      <div className="text-[10px] text-slate-500 mb-1">{label}</div>
      <div className="text-lg font-semibold text-emerald-600">{value}</div>
    </div>
  );
}
