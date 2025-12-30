"use client";

import React from "react";
import { Container } from "@/src/components/landing/ui/container";
import BrandMarquee from "./BrandsMarquee";

export const Brands = () => {
  return (
    <section className="py-10 md:py-32 relative overflow-hidden">
      <Container>
        <div className="flex flex-col lg:flex-row gap-7 lg:gap-24 items-center">

          {/* Left Content */}
          <div className="w-full lg:w-[720px] shrink-0">
            <div className="border-b border-t border-b-white/60 border-t-white/60 w-fit px-10 py-2 text-center mb-5 md:mb-6">
              <p className="text-xs md:text-base text-white">Our Clients</p>
            </div>

            <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white mb-2.5 md:mb-8 tracking-tight">
              Trusted by the World&apos;s Most Influential Brands
            </h2>

            <p className="text-white/70 text-xs lg:text-base lg:leading-[28px] font-light">
              Beige Media makes it easy for brands to create any video they need with a single, trusted partner. Our fast, simple, and transparent process takes the stress out of video production, making it smooth and hassle-free.
            </p>
          </div>

          {/* Right Grid */}
          <div className="w-full">
            <BrandMarquee />
          </div>
        </div>
      </Container>
    </section>
  );
};
