"use client";

import React from "react";
import { Container } from "@/src/components/landing/ui/container";
import Link from "next/link";
import Image from "next/image";

export const AppBanner = () => {
  return (
    <section className="py-10 md:py-20 lg:py-32 relative overflow-hidden">
      <Container className="relative overflow-hidden p-8 md:p-14 lg:p-20">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/misc/AppBanner.png"
            alt="App Banner Background"
            fill
            className="object-contain object-right pointer-events-none"
            priority
          />
          {/* Optional Gradient Overlay for Text Contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent z-10" />
        </div>

          {/* Foreground Content */}
        <div className="relative z-20 space-y-10 lg:space-y-[145px]">
            {/* Left Content */}
            <div className="w-full lg:w-[720px] shrink-0">
              <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white mb-2.5 lg:mb-8 tracking-tight">
                Your Shoot, Always Within Reach
              </h2>

              <p className="text-white/70 text-xs md:text-base lg:leading-[28px] font-light">
                Book, manage, and track your production from anywhere with the Beige mobile app.
              </p>
            </div>

            {/* App Store / Play Store Links */}
            <div className="flex gap-3 lg:gap-5">
              <Link
                href="https://apps.apple.com/"
                className="relative rounded-full h-12 w-40 lg:w-[220px] lg:h-[69px]"
              >
                <Image
                  src="/images/misc/AppStore.svg"
                  alt="App Store"
                  fill
                  className="object-contain"
                />
              </Link>
              {/* <Link
                href="https://play.google.com/store/apps"
                className="relative rounded-full h-12 w-40 lg:w-[220px] lg:h-[69px]"
              >
                <Image
                  src="/images/misc/GooglePlaystore.svg"
                alt="Google Play"
                  fill
                  className="object-contain"
                />
              </Link> */}
            </div>
          </div>

      </Container>
    </section>
  );
};