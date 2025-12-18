"use client";

import React, {useState} from "react";
import { motion } from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";
import { Button } from "@/src/components/landing/ui/button";

import { TESTIMONIALS } from "./data/testimonials";

const INITIAL_COUNT = 6;
const LOAD_MORE_COUNT = 3;

export const Testimonials = () => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  const handleViewToggle = () => {
    if (visibleCount >= TESTIMONIALS.length) {
      setVisibleCount(INITIAL_COUNT);
    } else {
      setVisibleCount((prev) =>
        Math.min(prev + LOAD_MORE_COUNT, TESTIMONIALS.length)
      );
    }
  };

  const isAllVisible = visibleCount >= TESTIMONIALS.length;

  return (
    <section className="py-15 md:py-32 relative overflow-hidden">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 lg:mb-24"
        >
          <div className="inline-flex items-center border-b border-t border-b-white/60 border-t-white/60 w-fit px-10 py-2 text-center mb-5 md:mb-6">
            <p className="text-xs md:text-base text-white">Testimonial</p>
          </div>

          <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white mb-2.5 md:mb-8 tracking-tight">
            What our Clients Say <br />
            about Beige.
          </h2>
          <p className="text-white/50 text-xs lg:text-base max-w-[720px] mx-auto font-light">
            See how Beige has helped clients book top creators with confidence, providing reliable talent, transparent details, and seamless communication for projects of every size and style.
          </p>
        </motion.div>

        {/* Masonry Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 lg:mb-16">
          {TESTIMONIALS.slice(0, visibleCount).map((testimonial, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="p-4 lg:p-8 rounded-[16px] bg-[#0A0A0A] border border-white/5 hover:border-white/10 transition-all duration-300 flex flex-col justify-between h-full"
            >
              <div>
                {/* User Avatar Placeholder */}
                <div className="flex items-center gap-4 mb-5 md:mb-6">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[#E8D1AB] flex items-center justify-center text-black font-bold text-lg">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-medium text-sm md:text-lg leading-tight">{testimonial.author}</h4>
                    <p className="text-white/40 text-xs md:text-sm font-light">{testimonial.role}</p>
                  </div>
                </div>

                <p className="text-xs md:text-base md:leading-[26px] font-light text-white/50 whitespace-pre-line">
                  &quot;{testimonial.quote}&quot;
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View More Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleViewToggle}
            className="bg-[#E8D1AB] text-black hover:bg-[#dcb98a] h-9 md:h-[56px] pl-4  pr-1 lg:pr-2 rounded-[5px] lg:rounded-[10px] text-sm md:text-xl font-medium flex items-center justify-between lg:gap-6 shadow-[0_0_20px_-5px_rgba(232,209,171,0.3)] transition-all md:min-w-[240px]"
          >
            <span className="lg:pr-4">{isAllVisible ? "View Less" : "View More"}</span>

            {/* Right Dark Icon Box */}
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
