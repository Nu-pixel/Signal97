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
      <header className="w-full bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          {/* Left: logo + brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center text-base font-semibold shadow-sm">
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
              className="hover:text-blue-600 transition-colors"
            >
              How it works
            </button>

            <button
              onClick={() => onNavClick("features")}
              className="hover:text-blue-600 transition-colors"
            >
              Features
            </button>

            <button
              onClick={() => onNavClick("who")}
              className="hover:text-blue-600 transition-colors"
            >
              Who it&apos;s for
            </button>

            <button
              onClick={() => onNavClick("results")}
              className="hover:text-blue-600 transition-colors"
            >
              Results &amp; safety
            </button>
          </div>

          {/* Right: auth + CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={onLogin}
              className="px-4 py-2 rounded-2xl text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
            >
              Log in
            </button>

            <button
              onClick={onDemo}
              className="px-4 py-2 rounded-2xl text-sm font-semibold bg-slate-900 hover:bg-black text-white shadow-md transition-colors"
            >
              Launch demo
            </button>

            <button
              onClick={() => {
                onLogin();
              }}
              className="px-5 py-2 rounded-2xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors"
            >
              Launch live
            </button>
          </div>
        </div>
      </header>
    </nav>
  );
}
