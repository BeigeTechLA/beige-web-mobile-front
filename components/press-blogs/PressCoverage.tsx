"use client";

import React from "react";
import { motion } from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";
import { useRouter } from "next/navigation";
import Image from "next/image";

export const PressCoverage = () => {
  const router = useRouter();

  return (
     <section className="py-10 md:py-16 lg:py-24 relative overflow-hidden">
      <Container>
        {/* Text PressCoverage Content */}
        <div className="flex flex-col items-center justify-center text-center gap-3 lg:gap-6 relative z-10 mb-12 md:mb-20">
          <h2 className="text-3xl md:text-[56px] font-medium bg-gradient-to-r from-[#FFF] from-[2.09%] to-[rgba(255,255,255,0.20)] to-[98.96%] bg-clip-text text-transparent select-text block">
            Press Coverage
          </h2>
        </div>

      </Container>
    </section>
  );
};