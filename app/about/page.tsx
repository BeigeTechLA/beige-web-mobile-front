import React from "react";

import { Footer } from "@/src/components/landing/Footer";
import { Navbar } from "@/src/components/landing/Navbar";
import { Separator } from "@/src/components/landing/Separator";
import { FAQ } from "@/components/about/FAQ";
import { AvailabilityBanner } from "@/components/about/AvailabilityBanner";
import BrandMarquee from "@/components/about/BrandsMarquee";
import LeadershipTeam from "@/components/about/LeadershipTeam";
import SectorShowcase from "@/components/about/SectorShowcase";
import CeoMessageBlock from "@/components/about/CeoMessageBlock";
import ContentAndMarquee from "@/components/about/ContentAndMarquee";
import ContentAndImages from "@/components/about/ContentAndImages";


export default function FindCreativeWorkPage() {
  return (
    <main className="bg-[#010101] min-h-screen text-white font-sans selection:bg-[#ECE1CE] selection:text-black px-5 pt-15 lg:p-0 lg:pt-30">
      <Navbar />

      <CeoMessageBlock />

      <Separator />
      <ContentAndMarquee />


      <Separator />
      <ContentAndImages />

      <Separator />
      <SectorShowcase />

      <Separator />
      <LeadershipTeam />

      <Separator />
      <BrandMarquee />

      <Separator />
      <AvailabilityBanner />

      <Separator />
      <FAQ />

      <Footer />
    </main>
  );
}