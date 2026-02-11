"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { motion } from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";
import { Button } from "@/src/components/landing/ui/button";

export const EarlySignup = () => {
  const router = useRouter();

  const handleEarlySignup = () => {
    router.push('/signup/user')
  };


  return (
    <section className="py-10 md:py-20 lg:py-24 bg-[#010101] relative overflow-hidden">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 lg:mb-16"
        >
          {/* Header */}
          <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white mb-2.5 lg:mb-8 tracking-tight">
            Sign Up For Beige
          </h2>
          <p className="text-white/50 text-xs md:text-base max-w-[720px] mx-auto font-light">
            Sign Up Now And Get Priority Access
          </p>
        </motion.div>
        <div className="flex justify-center items-center gap-12">
          <Button
            onClick={handleEarlySignup}
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
      </Container>
    </section>
  );
};
