//vimeo video for ceo message https://vimeo.com/837736935?fl=pl&fe=sh
"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";
import { Button } from "../ui/button";
import { Play } from "lucide-react";

export default function CeoMessageBlock() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const vimeoUrl = `https://player.vimeo.com/video/837736935?api=1&autoplay=1&muted=1&loop=1&controls=1&title=0&byline=0&portrait=0&badge=0&autopause=0&playsinline=1&transparent=0&vimeo_logo=0`;

  return (
    <section className="py-10 md:py-20 lg:py-32 relative overflow-hidden">
      <Container>
        <div className="relative text-center mx-auto space-y-9 lg:space-y-15">
          {/* Header Text Flow Grid */}
          <div className="flex flex-col items-center max-w-5xl mx-auto text-center flex-shrink-0 space-y-3 lg:space-y-5">
            <h2 className="text-center text-3xl md:text-[56px] font-medium bg-gradient-to-r from-[#FFF] from-[2.09%] to-[rgba(255,255,255,0.20)] to-[98.96%] bg-clip-text text-transparent select-text block">
              A message from our CEO
            </h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="max-w-3xl text-white/70 font-light"
            >
              Kawser Khan founded Beige with a simple belief: creating exceptional content shouldn't be complicated. After building a successful media company trusted by leading brands and artists, he launched Beige to combine technology and creativity into one seamless platform for content production.
            </motion.p>
          </div>

          <div className="mx-auto w-full h-[320px] lg:h-[600px] lg:max-w-5xl overflow-hidden relative rounded-lg lg:rounded-3xl border border-white/20 bg-black shadow-2xl">
            {/* Vimeo Iframe Implementation */}
            <iframe
              ref={iframeRef}
              src={vimeoUrl}
              className="absolute inset-0 w-full h-full z-10"
              allow="autoplay; fullscreen"
            />
            {/* <Button className="!absolute rounded-full w-12 h-12 lg:w-17 lg:h-17 bg-black z-30 top-10 right-10">
              <Play size={16} className="text-white fill-white" />
            </Button> */}
          </div>
        </div>
      </Container>
    </section>
  );
}