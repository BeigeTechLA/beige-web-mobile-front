"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/src/components/landing/ui/button";
import { Container } from "@/components/ui/container";


export const WelcomeSection = () => {
  const router = useRouter();

  return (
    <section className="py-10 lg:pt-50 lg:pb-32 bg-[#010101] overflow-hidden select-none">
      <Container>
        <div className="text-center mb-12 lg:mb-20">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-2xl lg:text-[58px] leading-tight font-bold text-gradient-white mb-2"
          >
            Welcome to the Beige<br />Creative Partners Ambassador Program
          </motion.h1>

          {/* Sub-headline */}
          <motion.h4
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-base lg:text-[32px] leading-tight text-white/70 mb-4 lg:mb-8"
          >
            Join a global movement of creators shaping the future of video.
          </motion.h4>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex gap-6 mx-auto items-center justify-center"
          >
            <Button
              className="h-7 lg:h-15 px-5 lg:px-8 rounded-full bg-[#ECE1CE] text-black hover:bg-[#dcb98a] text-sm lg:text-xl"
              // onClick={() => router.push('/book-a-shoot')}
            >
              Join Us
            </Button>
             <Button
                className="bg-transparent border border-white/20 hover:bg-white/5 text-white h-7 lg:h-15 px-5 lg:px-9 text-sm lg:text-xl rounded-full flex items-center gap-3 w-fit transition-all group"
              >
                How It Works
              </Button>
          </motion.div>

          {/* Video component to be added here */}
        </div>
      </Container>
    </section>
  );
};