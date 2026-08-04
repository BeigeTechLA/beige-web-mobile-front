"use client";

import React from "react";
import { motion } from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";
import { useRouter } from "next/navigation";
import Image from "next/image";

export const Hero = () => {
  const router = useRouter();

  return (
    <section className="py-10 md:py-20 lg:py-30 relative overflow-hidden text-white">
      <Container>
        {/* Text Hero Content */}
        <div className="flex flex-col items-center justify-center text-center gap-3 lg:gap-6 relative z-10 mb-12 md:mb-20">
          <h2 className="text-3xl md:text-[56px] font-medium bg-gradient-to-r from-[#FFF] from-[2.09%] to-[rgba(255,255,255,0.20)] to-[98.96%] bg-clip-text text-transparent select-text block">
            Beige Press & Blogs
          </h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="text-white/70 font-light text-sm md:text-base"
          >
            In-depth insights, updates, and expert perspectives on media technology, video, photography, and the evolving creative industry.
          </motion.p>
         
        </div>

      </Container>
    </section>
  );
};