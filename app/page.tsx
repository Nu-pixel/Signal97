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
    <div className="relative min-h-screen bg-gradient-to-b from-blue-50 via-white to-pink-50 text-slate-900">
      {/* Ambient animated background */}
      <SignalHeroAnimation />

      <Navigation
        scrolled={scrolled}
        onNavClick={scrollTo}
        onLogin={() => setModalMode("login")}
        onDemo={() => setModalMode("demo")}
      />

      <main className="pt-24 relative z-10">
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
