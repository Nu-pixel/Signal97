"use client";

interface MissionCtaProps {
  onDemo: () => void;
  onLogin: () => void;
}

export default function MissionCta({ onDemo, onLogin }: MissionCtaProps) {
  return (
    <section className="py-16 px-6 bg-[#187bcd]">
      <div className="max-w-5xl mx-auto text-center">
        {/* Hero mission text without background card */}
        <p className="text-sm md:text-[15px] text-blue-50 mb-6 leading-relaxed">
          Most everyday traders see noise instead of structure. Signal 97 exists
          to give them a calmer, rules-based way to find and track opportunities —
          without pretending it&apos;s easy or guaranteed.
        </p>

        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
          Signal 97: smarter alerts for the 97%.
        </h2>
        <p className="text-sm md:text-base text-blue-50 mb-5">
          Cleaner. Calmer. Clearer.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onDemo}
            className="px-6 py-3 rounded-2xl bg-white text-[#187bcd] hover:bg-slate-100 text-xs font-medium shadow-md"
          >
            Launch demo
          </button>
          <button
            onClick={onLogin}
            className="px-6 py-3 rounded-2xl border border-white/70 text-xs text-white hover:bg-white/10"
          >
            Log in
          </button>
        </div>
      </div>
    </section>
  );
}
