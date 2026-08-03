"use client";

import React from "react";
import { motion } from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";

export default function ContentAndImages() {
  return (
    <section className="py-10 md:py-20 lg:py-32 relative overflow-hidden">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-10 lg:gap-12">

          {/* Left Column: Image Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative flex w-full items-center justify-center bg-transparent p-4 mx-auto overflow-visible"
          >
            {/* Image Stack Container */}
            <div className="relative w-full max-w-[700px] aspect-[4/3] flex items-center justify-center select-none">

              {/* Back Left Image */}
              <div className="absolute top-0 left-0 w-[55%] aspect-[4/3] rounded-2xl overflow-hidden opacity-60 z-0 border border-white/5">
                <img
                  src="https://d2jhn32fsulyac.cloudfront.net/assets/aboutUs/Theo+King+81.jpg"
                  alt="BTS background scene left"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Front Main Image */}
              <div className="absolute top-[12%] left-[12%] w-[75%] aspect-[4/3] rounded-2xl overflow-hidden z-10 border border-white/10">
                <img
                  src="https://d2jhn32fsulyac.cloudfront.net/assets/aboutUs/Theo+King+92.jpg"
                  alt="Main camera production setup"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Middle Image (Tucked behind the right corner of the main image) */}
              <div className="absolute bottom-0 right-[2%] w-[55%] aspect-[4/3] rounded-2xl overflow-hidden opacity-60 z-0 border border-white/5">
                <img
                  src="https://d2jhn32fsulyac.cloudfront.net/assets/aboutUs/Theo+King+78.jpg"
                  alt="BTS preview setup right"
                  className="w-full h-full object-cover"
                />
              </div>

            </div>
          </motion.div>

          {/* Right Column: Text Section */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col max-w-5xl mx-auto text-left shrink-0 space-y-6 lg:space-y-8"
          >
            <h2 className="text-3xl md:text-[56px] leading-tight font-medium bg-gradient-to-r from-[#FFF] from-[2.09%] to-[rgba(255,255,255,0.20)] to-[98.96%] bg-clip-text text-transparent select-text block">
              Expert storytelling combines with cutting-edge production technology
            </h2>
            <div className="max-w-3xl text-white/70 font-light space-y-4">
              <p>
                Beige started in Los Angeles, California, in 2017 to make it easy for anyone to book a video or photo shoot anytime.
              </p>
              <p>
                Whether you want to educate, persuade, encourage, or share, we have years of experience to help you create great content that connects with your audience.
              </p>
              <p>
                Our idea is simple: anyone can book a shoot anywhere, at any time. We aim to make quality content accessible to everyone. We provide both individuals and organizations with high-quality video and photography services while empowering our global team of creative professionals to follow their passion—telling your story.
              </p>
            </div>
          </motion.div>

        </div>
      </Container>
    </section>
  );
}