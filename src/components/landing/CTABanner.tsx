"use client";

import React from "react";
import { Container } from "@/src/components/landing/ui/container";
import { Button } from "@/src/components/landing/ui/button";
import { ArrowRight } from "lucide-react";

export const CTABanner = () => {
  const handleKnowMore = () => {
    console.log('Navigation: Know More clicked');
  };

  return (
    <section className="py-24 relative overflow-hidden">
      <Container className="relative z-10">
        <div className="mx-auto text-center py-16 bg-gradient-to-b from-[#E5CFA0] to-[#C9A668] rounded-[20px]">
          <div className="inline-block border-b border-t border-t-black/10 border-b-black/10 px-4 py-1 mb-8">
            <span className="text-black/60 text-sm uppercase tracking-wide">Testimonial</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-medium text-black mb-8 leading-tight tracking-tight">
            Transform Your Creative Workflow with Beige
          </h2>

          <p className="text-black/60 text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
            From booking to final delivery, Beige empowers you with tools that simplify coordination, improve productivity, and keep every shoot running smoothly.
          </p>

          <div className="flex justify-center items-center gap-12">
            <Button
              onClick={handleKnowMore}
              className="bg-black text-white hover:bg-black/80 h-[56px] px-8 rounded-[8px] text-lg flex items-center gap-2 shadow-xl"
            >
              Know More
              <ArrowRight size={20} />
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
};
