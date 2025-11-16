"use client";

export default function FooterDisclaimer() {
  return (
    <section className="py-6 px-6 bg-gradient-to-b from-[#e1e6f0] via-[#d1d7e2] to-[#e1e6f0]">
      <div className="max-w-6xl mx-auto text-[9px] text-slate-700 space-y-1 border-t border-slate-300/60 pt-4">
        <p>• Not investment, legal, or tax advice.</p>
        <p>• Signal 97 does not execute trades, custody assets, or guarantee outcomes.</p>
        <p>• Historical or backtested results are hypothetical and not indicative of future performance.</p>
        <p>• Trading stocks and options involves substantial risk and may result in loss of some or all capital.</p>
        <p>• You remain solely responsible for your own trading decisions, position sizes, and risk management.</p>
      </div>
    </section>
  );
}
