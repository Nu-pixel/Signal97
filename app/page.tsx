"use client";

import { useState, useEffect } from "react";
import Navigation from "./Components/signal97/Navigation";
import HeroSection from "./Components/signal97/HeroSection";
import HowItWorks from "./Components/signal97/HowItWorks";
import Features from "./Components/signal97/Features";
import WhoItsFor from "./Components/signal97/WhoItsFor";
import Faq from "./Components/signal97/Faq";
import MissionCta from "./Components/signal97/MissionCta";
import FooterDisclaimer from "./Components/signal97/FooterDisclaimer";
import LoginModal, { ModalMode } from "./Components/signal97/LoginModal";
import SignalHeroAnimation from "./Components/signal97/SignalHeroAnimation";

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      className="
        relative min-h-screen overflow-hidden text-slate-900
        bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.22),transparent_30%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.14),transparent_28%),linear-gradient(135deg,#e6eef8_0%,#dbe7f3_45%,#d2e2ef_100%)]
        dark:text-slate-100
        dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_32%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_30%),linear-gradient(135deg,#05070c_0%,#08111f_48%,#0b1828_100%)]
      "
    >
      {/* Ambient animated background */}
      <SignalHeroAnimation />

      <Navigation
        scrolled={scrolled}
        onNavClick={scrollTo}
        onLogin={() => setModalMode("login")}
        onDemo={() => setModalMode("demo")}
      />

      <main className="relative z-10 min-h-screen pt-24">
        <HeroSection onLaunchDemo={() => setModalMode("demo")} />
        <HowItWorks />
        <Features />
        <WhoItsFor />
        <Faq />
        <MissionCta
          onDemo={() => setModalMode("demo")}
          onLogin={() => setModalMode("login")}
        />
        <FooterDisclaimer />
      </main>

      <LoginModal
        isOpen={modalMode !== null}
        mode={modalMode}
        onClose={() => setModalMode(null)}
      />
    </div>
  );
}
