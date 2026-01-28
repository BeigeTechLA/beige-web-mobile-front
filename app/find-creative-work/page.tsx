import React from "react";

import { Footer } from "@/src/components/landing/Footer";
import { Navbar } from "@/src/components/landing/Navbar";
import { Separator } from "@/src/components/landing/Separator";
import { WelcomeSection } from "@/components/find-creative-work/WelcomeSection";
import { AmbassadorProgramSection } from "@/components/find-creative-work/AmbassadorProgramSection";

export default function FindCreativeWorkPage() {
  return (
    <main className="bg-[#010101] min-h-screen text-white font-sans selection:bg-[#ECE1CE] selection:text-black">
      <Navbar />

      <WelcomeSection />
      <Separator />

      <AmbassadorProgramSection />
      <Separator />

      <Footer />
    </main>
  );
}