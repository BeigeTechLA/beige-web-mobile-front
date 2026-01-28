import React from "react";

import { Footer } from "@/src/components/landing/Footer";
import { Navbar } from "@/src/components/landing/Navbar";
import { Separator } from "@/src/components/landing/Separator";
import { WelcomeSection } from "@/components/find-creative-work/WelcomeSection";
import { AmbassadorProgramSection } from "@/components/find-creative-work/AmbassadorProgramSection";
import { WhySection } from "@/components/find-creative-work/WhySection";
import { TopCreatives } from "@/src/components/landing/TopCreatives";
import { GrowthJourneySection } from "@/components/find-creative-work/GrowthJourneySection";
import { Potential } from "@/components/find-creative-work/PotentialSection";

export default function FindCreativeWorkPage() {
  return (
    <main className="bg-[#010101] min-h-screen text-white font-sans selection:bg-[#ECE1CE] selection:text-black px-5 pt-15 lg:p-0">
      <Navbar />

      <WelcomeSection />
      <Separator />

      <Potential />
      <Separator />

      <AmbassadorProgramSection />
      <Separator />

      <WhySection />
      <Separator />

      <GrowthJourneySection />
      <Separator />

      <TopCreatives title="Meet Our Top Creative Partners" />

      <Footer />
    </main>
  );
}