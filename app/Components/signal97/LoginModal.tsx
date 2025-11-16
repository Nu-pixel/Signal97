"use client";

import { useState, FormEvent } from "react";

export type ModalMode = "demo" | "login" | null;

interface LoginModalProps {
  isOpen: boolean;
  mode: ModalMode;
  onClose: () => void;
}

export default function LoginModal({
  isOpen,
  mode,
  onClose,
}: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  if (!isOpen || !mode) return null;

  const title =
    mode === "demo"
      ? "Preview your Signal 97 workspace"
      : "Access your Signal 97 workspace";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (mode === "demo") {
      window.location.href = "/dashboard?demo=1";
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-7">
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">
          {title}
        </h2>
        <p className="text-[10px] text-slate-500 text-center mb-5">
          Demo uses sample data only. Live version will use secure
          authentication.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60"
            />
          </div>

          <div>
            <label
              htmlFor="pw"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Password
            </label>
            <input
              id="pw"
              type="password"
              required
              placeholder="••••••••"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full border border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-3 rounded-2xl transition-all shadow-md"
          >
            Continue to {mode === "demo" ? "demo " : ""}dashboard (preview)
          </button>
        </form>

        <button
          onClick={onClose}
          className="mt-3 w-full text-[10px] text-slate-500 hover:text-slate-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}
