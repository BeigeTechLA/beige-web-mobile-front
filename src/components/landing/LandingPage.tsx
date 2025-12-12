"use client";

import React from "react";
import { Navbar } from "@/src/components/landing/Navbar";
import { Hero } from "@/src/components/landing/Hero";
import { About } from "@/src/components/landing/About";
import { HowItWorks } from "@/src/components/landing/HowItWorks";
import { Brands } from "@/src/components/landing/Brands";
import { Influencers } from "@/src/components/landing/Influencers";
import { Process } from "@/src/components/landing/Process";
import { Projects } from "@/src/components/landing/Projects";
import { Gallery } from "@/src/components/landing/Gallery";
import { Testimonials } from "@/src/components/landing/Testimonials";
import { CTABanner } from "@/src/components/landing/CTABanner";
import { FAQ } from "@/src/components/landing/FAQ";
import { Waitlist } from "@/src/components/landing/Waitlist";
import { Footer } from "@/src/components/landing/Footer";
import { Separator } from "@/src/components/landing/Separator";

export default function LandingPageV2() {
  return (
    <main className="bg-[#010101] min-h-screen text-white font-sans selection:bg-[#ECE1CE] selection:text-black">
      <Navbar />
      <Hero />
      <Separator />

      <About />
      <Separator />

      <HowItWorks />
      <Separator />

      <Brands />
      <Separator />

      <Influencers />
      <Separator />

      <Process />
      <Separator />

      <Projects />
      <Separator />

      <Gallery />
      <Separator />

      <Testimonials />
      <Separator />

      <CTABanner />
      <Separator />

      <FAQ />
      <Separator />

      <Waitlist />
      <Separator />

      <Footer />
    </main>
  );
}
