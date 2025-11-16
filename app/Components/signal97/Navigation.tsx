"use client";

interface NavigationProps {
  scrolled: boolean;
  onNavClick: (id: string) => void;
  onLogin: () => void;
  onDemo: () => void;
}

export default function Navigation({
  scrolled,
  onNavClick,
  onLogin,
  onDemo,
}: NavigationProps) {
  return (
    <nav
      className={`fixed top-0 inset-x-0 z-40 transition-all ${
        scrolled
          ? "bg-white/95 shadow-md"
          : "bg-white/80 border-b border-slate-100 backdrop-blur"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
        {/* Left: logo + brand */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center text-base font-semibold">
            97
          </div>
          <div className="font-semibold text-slate-900 text-xl md:text-2xl tracking-tight">
            Signal 97
          </div>
        </div>

        {/* Center: nav links */}
        <div className="hidden md:flex items-center gap-8 text-base text-slate-600 font-medium">
          <button
            onClick={() => onNavClick("how")}
            className="hover:text-blue-600"
          >
            How it works
          </button>
          <button
            onClick={() => onNavClick("features")}
            className="hover:text-blue-600"
          >
            Features
          </button>
          <button
            onClick={() => onNavClick("who")}
            className="hover:text-blue-600"
          >
            Who it&apos;s for
          </button>
          <button
            onClick={() => onNavClick("results")}
            className="hover:text-blue-600"
          >
            Results &amp; safety
          </button>
        </div>

        {/* Right: auth + CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={onLogin}
            className="px-4 py-2 rounded-2xl text-sm font-medium text-slate-700 hover:text-blue-600"
          >
            Log in
          </button>
          <button
            onClick={onDemo}
            className="px-5 py-2 rounded-2xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md"
          >
            Launch demo
          </button>
        </div>
      </div>
    </nav>
  );
}
