"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/src/components/landing/ui/container";
import { Button } from "@/src/components/landing/ui/button";
import { ArrowRight } from "lucide-react";

export const CTABanner = () => {
  const router = useRouter();
  const handleGetStarted = () => {
    router.push('/book-a-shoot')
  };

  return (
    <section className="py-10 md:py-16 lg:py-24 relative overflow-hidden">
      <Container className="relative z-10">
        <div className="mx-auto text-center py-5 px-6 lg:py-16 bg-gradient-to-b from-[#E5CFA0] to-[#C9A668] rounded-[10px] lg:rounded-[20px]">
          {/* <div className="inline-block border-b border-t border-t-black/10 border-b-black/10 px-10 py-2 text-center mb-5 md:mb-6">
            <span className="text-black/60 text-xs md:text-base uppercase tracking-wide">Testimonial</span>
          </div> */}

          <h2 className="text-lg md:text-[56px] font-medium text-black mb-2.5 lg:mb-8  leading-[1.1] tracking-tight">
            AI-Powered Post-Production
          </h2>

          <p className="text-black/60 text-xs md:text-base lg:leading-[28px] max-w-2xl mx-auto mb-5 lg:mb-12">
            <span className="font-medium text-sm md:text-base lg:text-lg">Edited, optimized, and ready to ship.</span>
            <br />
            We turn raw footage into polished, platform-ready assets using a blend of expert editors and AI-assisted workflows—fast enough for modern content cycles.
            <br />
            <br />
            Book your first shoot now.
          </p>

          <div className="flex justify-center items-center gap-12">
            <Button
              onClick={handleGetStarted}
              className="bg-[#E8D1AB] text-black hover:bg-[#dcb98a] h-9 md:h-[56px] pl-4 pr-1 lg:pr-2 rounded-[5px] lg:rounded-[10px] text-sm md:text-xl font-medium flex items-center justify-between lg:gap-6 shadow-[0_0_20px_-5px_rgba(232,209,171,0.3)] transition-all md:min-w-[240px]"
            >
              <span className="lg:pr-4">Get Started</span>
              <div className="bg-[#1A1A1A] w-8 h-8 lg:w-12 lg:h-12 rounded-[5px] flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="32"
                  viewBox="0 0 33 26"
                  fill="none"
                >
                  <path
                    d="M0.801232 1.6025L2.40373 0L31.2487 12.82L2.40373 25.64L0.801231 24.0375L5.60873 12.82L0.801232 1.6025Z"
                    fill="#E8D1AB"
                  />
                </svg>
              </div>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
};
