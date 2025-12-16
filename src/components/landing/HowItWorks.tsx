"use client";

import React, { useEffect, useState } from "react";
import { Container } from "@/src/components/landing/ui/container";
import { DollarSign, Video, Users, Play } from "lucide-react";

export const HowItWorks = () => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoFileName = "How It Works.mp4";

  useEffect(() => {
    const fetchSignedUrl = async () => {
      try {
        const response = await fetch(`/api/video/${videoFileName}`);

        if (!response.ok) {
          throw new Error("Failed to fetch signed URL.");
        }

        const data = await response.json();
        setVideoUrl(data.url);
      } catch (error) {
        console.error("Error fetching video URL:", error);
      }
    };

    fetchSignedUrl();
  }, [videoFileName]);

  return (
    <section
      id="how-it-works"
      className="py-10 md:py-32 bg-[#010101] relative overflow-hidden"
    >
      <Container>
        {/* Section label */}
        <div className="inline-flex items-center border-b border-t border-b-white/60 border-t-white/60 w-fit px-10 py-2 text-center mb-5 md:mb-6">
          <p className="text-xs md:text-base text-white">How it works</p>
        </div>

        {/* Heading + text */}
        <div className="flex flex-col lg:flex-row justify-between mb-7 md:mb-10 gap-2.5 md:gap-10">
          <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white tracking-tight">
            Booking a Shoot Has Never <br />
            Been This Easy.
          </h2>

          <p className="text-xs lg:text-base lg:leading-[28px] text-white/50 font-light max-w-[500px] lg:text-right">
            Experience effortless booking with quick access to trusted creators and professionals— all in one seamless platform, helping you find the perfect match for every shoot with ease and confidence, while giving you full control over availability, pricing, and project details.
          </p>
        </div>

        {/* Main container */}
        <div className="flex flex-col lg:flex-row gap-8 items-stretch border border-[#e8d1ab]/30 rounded-[20px] overflow-hidden">

          {/* LEFT: Feature Cards */}
          <div className="w-full lg:w-[420px] flex flex-col border-r border-white/10 lg:rounded-l-[20px] relative overflow-hidden">

            {/* Visible left glow */}
            {/* <div className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-[#e8d1ab]/90 via-[#e8d1ab]/50 to-transparent z-30 pointer-events-none" /> */}

            {/* Card 1 */}
            <div className="relative flex-1 bg-[#111] border-b border-white/10 p-5 lg:p-7 flex flex-col gap-6 overflow-hidden">
              {/* Active glow */}
              <div className="absolute left-0 top-0 h-full w-[8px] bg-gradient-to-r from-[#e8d1ab]/50 to-transparent z-20" />

              {/* Top content */}
              <div className="flex flex-col items-start gap-5 lg:gap-6 relative z-10">
                <div className="h-11 w-11 lg:w-14 lg:h-14 rounded-[14px] bg-gradient-to-b from-[#e8d1ab] to-[#bfa276] flex items-center justify-center shrink-0 shadow-lg">
                  <DollarSign className="text-black w-[28px] h-[28px]" />
                </div>

                <div>
                  <h3 className="text-base lg:text-2xl font-medium text-white mb-1.5 lg:mb-2.5">
                    Instant Pricing
                  </h3>
                  <p className="text-xs lg:text-base lg:leading-[22px] text-white/50 font-light">
                    Our dynamic pricing engine pulls data from 4,000+ Beige
                    shoots to give you real-time, transparent pricing.
                  </p>
                </div>
              </div>

              {/* Mobile-only video inside first card */}
              <div className="block lg:hidden w-full">
                <div className="relative w-full h-[200px] rounded-[14px] overflow-hidden border border-white/10">
                  {
                    videoUrl &&
                    <video
                      className="absolute inset-0 w-full h-full object-cover"
                      src={videoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />}
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="w-[44px] h-[44px] bg-white rounded-xl flex items-center justify-center shadow-lg">
                      <Play className="w-[18px] h-[18px] text-black ml-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="flex-1 bg-[#0b0b0b] border-b border-white/10 p-5 lg:p-7 flex items-start">
              <div className="flex flex-col items-start gap-5 lg:gap-6">
                <div className="h-11 w-11 lg:w-14 lg:h-14 rounded-[14px] bg-[#1a1a1a] flex items-center justify-center shrink-0">
                  <Users className="text-white w-[26px] h-[26px]" />
                </div>
                <div>
                  <h3 className="text-base lg:text-2xl font-medium text-white mb-1.5 lg:mb-2.5">
                    Intelligent Matchmaking
                  </h3>
                  <p className="text-xs lg:text-base lg:leading-[22px] text-white/50 font-light">
                    Our matchmaking algorithm learns your style to pair you with
                    the perfect creative instantly.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="flex-1 bg-[#0b0b0b] p-5 lg:p-7 flex items-start">
              <div className="flex flex-col items-start gap-5 lg:gap-6">
                <div className="h-11 w-11 lg:w-14 lg:h-14 rounded-[14px] bg-[#1a1a1a] flex items-center justify-center shrink-0">
                  <Video className="text-white w-[26px] h-[26px]" />
                </div>
                <div>
                  <h3 className="text-base lg:text-2xl font-medium text-white mb-1.5 lg:mb-2.5">
                    The Home for the Future of Content
                  </h3>
                  <p className="text-xs lg:text-base lg:leading-[22px] text-white/50 font-light">
                    Join the Beige ecosystem and unlock creators, locations, and
                    equipment on demand.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop-only RIGHT video */}
          <div className="hidden lg:flex w-full lg:flex-1 p-[28px]">
            <div className="w-full h-[700px] overflow-hidden relative rounded-[20px] border border-white/10">
              {videoUrl &&
                <video
                  className="absolute inset-0 w-full h-full object-cover"
                  src={videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                />}
              <div className="absolute bottom-8 right-8 w-[50px] h-[50px] bg-white rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-300 shadow-lg z-20">
                <Play className="w-[20px] h-[20px] text-black ml-1" />
              </div>
            </div>
          </div>

        </div>
      </Container>
    </section>
  );
};
