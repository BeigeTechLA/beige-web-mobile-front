"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Container } from "@/src/components/landing/ui/container";
import { Button } from "@/src/components/landing/ui/button";
import { pushToDataLayer } from "@/lib/gtm";
import { motion } from "framer-motion";
import { MousePointer2 } from "lucide-react";


export const AvailabilityBanner = () => {
  const router = useRouter();
  const handleGetStarted = () => {
    pushToDataLayer("book_shoot_started", {
      type: "Action Tracking",
      page_name: "About Us Page",
      location_in_website: "cta_banner_aboutus_page",
      duration_on_page: performance.now() / 1000,
    });
    router.push('/book-a-shoot')
  };

  return (
    <section className="py-10 md:py-16 lg:py-24 relative overflow-hidden">
      <Container className="relative z-10">
        <div className="mx-auto grid grid-cols-2 py-5 px-6 lg:py-0 lg:pt-11 bg-gradient-to-b from-[#E5CFA0] to-[#C9A668] rounded-lg lg:rounded-xl">
          <div className="pl-17 lg:py-11">
            <h2 className="text-lg md:text-[56px] font-medium text-black mb-2.5 lg:mb-5 leading-[1.1] tracking-tight">
              Available in all 50 states
            </h2>

            <p className="text-black/60 text-xs md:text-base lg:leading-[28px] italic max-w-2xl mx-auto mb-5 lg:mb-13">
              Available nationwide anywhere in the United States.
            </p>

            <div className="flex items-center gap-12">
              <Button
                onClick={handleGetStarted}
                className="bg-[#1A1A1A] text-black hover:bg-black h-9 md:h-[56px] pl-4 pr-1 lg:pr-2 rounded-md lg:rounded-lg text-sm md:text-xl font-medium flex items-center justify-between lg:gap-6 shadow-[0_0_20px_-5px_rgba(232,209,171,0.3)] transition-all md:min-w-55"
              >
                <span className="lg:pr-4 text-[#E8D1AB]">Get Started</span>
                <div className="bg-[#E8D1AB] w-8 h-8 lg:w-12 lg:h-12 rounded-[5px] flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="33" height="26" viewBox="0 0 33 26" fill="none">
                    <g clipPath="url(#clip0_3160_3031)">
                      <path d="M0.801721 1.6025L2.40422 1.40095e-07L31.2492 12.82L2.40422 25.64L0.80172 24.0375L5.60922 12.82L0.801721 1.6025Z" fill="#1D1D1B" />
                    </g>
                    <defs>
                      <clipPath id="clip0_3160_3031">
                        <rect width="25.64" height="32.05" fill="white" transform="translate(32.05 1.40095e-06) rotate(90)" />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
              </Button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full flex items-center justify-center"
          >
            <div className="relative w-full h-full max-w-[500px] lg:max-w-none ">
              <Image
                src="/images/misc/blackplanet.svg"
                alt="Global Reach"
                fill
                className="object-cover lg:object-contain"
                priority
              />
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
};
