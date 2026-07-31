"use client";

import React from "react";
import { motion } from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";
import { Button } from "@/src/components/landing/ui/button";
import { useRouter } from "next/navigation";
import { pushToDataLayer } from "@/lib/gtm";
import { useAuth } from "@/lib/hooks/useAuth";
import Image from "next/image";

const USER_TYPE: Record<number, string> = {
  1: "Admin",
  2: "Creator",
  3: "Client",
  4: "Creative",
  5: "Sales Representative",
  6: "Production Manager"
};

export const Hero = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const handleJoinUs = () => {
    pushToDataLayer("book_shoot_started", {
      type: "Action Tracking",
      page_name: "About us Page",
      location_in_website: "hero_aboutus_page",
      duration_on_page: performance.now() / 1000,
      user_type: isAuthenticated && user?.user_type_id !== undefined
        ? USER_TYPE[user.user_type_id]
        : "Guest",
    });
    router.push('/book-a-shoot');
  };

  const clipPaths = {
    col1Image1: "path('M 0 423.257 C 0 434.303 8.954 443.257 20 443.257 H 250.242 C 261.288 443.257 270.242 434.303 270.242 423.257 V 86.414 C 270.242 75.369 261.288 66.414 250.242 66.414 H 159.787 C 152.948 66.414 147.405 60.871 147.405 54.033 C 147.405 48.836 144.16 44.193 139.281 42.406 L 26.878 1.238 C 13.827 -3.542 0 6.119 0 20.018 Z')",
    col2Image1: "path('M 0 522.678 C 0 533.724 8.954 542.678 20 542.678 H 250.242 C 261.288 542.678 270.242 533.724 270.242 522.678 V 80.67 C 270.242 69.624 261.288 60.67 250.242 60.67 H 159.557 C 152.845 60.67 147.405 55.229 147.405 48.518 C 147.405 43.228 143.983 38.546 138.943 36.94 L 26.074 0.959 C 13.173 -3.153 0 6.474 0 20.015 Z')"
  };

  return (
    <section className="py-10 md:py-20 lg:py-32 relative overflow-hidden text-white">
      <Container>
        {/* Text Hero Content */}
        <div className="flex flex-col items-center justify-center text-center gap-3 lg:gap-6 relative z-10 ">
          <h2 className="text-3xl md:text-[56px] font-medium bg-gradient-to-r from-[#FFF] from-[2.09%] to-[rgba(255,255,255,0.20)] to-[98.96%] bg-clip-text text-transparent select-text block">
            About Us
          </h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="max-w-xl text-white/70 font-light text-sm md:text-base"
          >
            Beige creates high-quality videos that grab attention for your business. We are available to help you anytime and anywhere.
          </motion.p>
          <Button
            onClick={handleJoinUs}
            className="w-fit h-7 lg:h-15 px-5 lg:px-8 rounded-lg bg-[#ECE1CE] text-black hover:bg-[#dcb98a] text-sm lg:text-xl"
          >
            Start Your Shoot
          </Button>
        </div>

        {/* 
          Asymmetric Grid System 
          On mobile: horizontal scrollable view for accessibility.
          On desktop: clean layout matching the aspect-ratio calculations exactly.
        */}
        <div className="flex flex-row items-end justify-end md:grid md:grid-cols-[1fr_1fr_2fr_1fr_1fr] gap-[18px] max-w-[1440px] mx-auto px-4 overflow-x-auto md:overflow-visible pb-6 select-none">

          {/* Column 1: Far Left Stack */}
          <div className="flex flex-col gap-[18px] shrink-0 w-[270px] md:w-full">
            <div
              className="relative overflow-hidden bg-[#171717] w-full aspect-[270.24/443.25] rounded-b-xl"
              style={{ clipPath: clipPaths.col1Image1 }}
            >
              <Image
                src="/images/crew/CREW(1).png"
                alt="Camera Operator"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 270px, 20vw"
              />
            </div>
            <div className="relative overflow-hidden bg-[#171717] w-full aspect-[270.24/177.02] rounded-[20px]">
              <Image
                src="/images/crew/CREW(2).png"
                alt="Close up cinema setup"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 270px, 20vw"
              />
            </div>
          </div>

          {/* Column 2: Inner Left Tall Card */}
          <div
            className="relative overflow-hidden bg-[#171717] shrink-0 w-[270px] md:w-full aspect-[270.24/542.67] rounded-b-xl"
            style={{ clipPath: clipPaths.col2Image1 }}
          >
            <Image
              src="/images/crew/CREW(3).png"
              alt="Behind the scenes camera rig"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 270px, 20vw"
            />
          </div>

          {/* Column 3: Center Featured Video/Image Card */}
          <div className="relative overflow-hidden bg-[#171717] shrink-0 w-[450px] md:w-full aspect-[554/346] rounded-[24px] shadow-2xl z-20 self-center mt-auto mb-10">
            <Image
              src="/images/crew/CREW(4).png"
              alt="Production Studio Set"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 450px, 40vw"
            />
          </div>

          {/* Column 4: Inner Right Tall Card - Specific Top-Right Cut Angle */}
          <div
            className="relative overflow-hidden bg-[#171717] shrink-0 w-[270px] md:w-full aspect-[270.24/542.67] scale-x-[-1] rounded-b-xl"
            style={{ clipPath: clipPaths.col2Image1 }}
          >
            {/* Embedded wrapper counter-acts flipped parents for normal text/face orientation */}
            <div className="relative w-full h-full scale-x-[-1]">
              <Image
                src="/images/crew/CREW(5).png"
                alt="Camera setup on rails"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 270px, 20vw"
              />
            </div>
          </div>

          {/* Column 5: Far Right Stack */}
          <div className="flex flex-col gap-[18px] shrink-0 w-[270px] md:w-full">
            <div
              className="relative overflow-hidden bg-[#171717] w-full aspect-[270.24/443.25] scale-x-[-1] rounded-b-xl"
              style={{ clipPath: clipPaths.col1Image1 }}
            >
              <div className="relative w-full h-full scale-x-[-1]">
                <Image
                  src="/images/crew/CREW(6).png"
                  alt="Color grading desk panel setup"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 270px, 20vw"
                />
              </div>
            </div>
            <div className="relative overflow-hidden bg-[#171717] w-full aspect-[270.24/177.02] rounded-[20px]">
              <Image
                src="/images/crew/CREW(7).png"
                alt="Cinematic production look monitor view"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 270px, 20vw"
              />
            </div>
          </div>

        </div>
      </Container>
    </section>
  );
};