"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { Container } from "@/src/components/landing/ui/container";

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What professional photography and videography services does Beige offer?",
    answer: (
      <div className="space-y-2 lg:space-y-4">
        <p>
          Beige is a leading provider of high-quality on demand photography and videography services for various industries. Our services include:
        </p>
        <ul className="list-disc pl-5 space-y-2 marker:text-[#E8D1AB] text-white">
          <li><span className="text-[#E8D1AB]">Wedding Photography & Videography:</span> Capture your special moments with cinematic storytelling.</li>
          <li><span className="text-[#E8D1AB]">Luxury Fleet Rentals:</span> Rent high-end exotic cars for photoshoots and creative video productions.</li>
          <li><span className="text-[#E8D1AB]">Studio Rentals:</span> Fully-equipped photography studios for professional shoots in Los Angeles.</li>
          <li><span className="text-[#E8D1AB]">Full-Service Production:</span> From pre-production to post-production editing, we deliver outstanding results.</li>
        </ul>
      </div>
    ),
  },
  {
    question: "How can I easily book a photography or videography session?",
    answer: (
      <p>
        Booking a professional <strong>photo shoot</strong> or <strong>video production</strong> with Beige is simple! Visit our{" "}
        <a href="/book" className="text-[#E8D1AB] hover:text-[#E8D1AB]/70">Book Now</a> page, fill out your project details, and our team will confirm your booking. We offer <strong>same-day bookings</strong> and advanced scheduling options to meet your needs.
      </p>
    ),
  },
  {
    question: "What do clients say about your services?",
    answer: (
      <p>
        Beige is proud of its <strong>outstanding customer satisfaction</strong>. Clients consistently praise our <strong>professionalism, creativity, and high-quality productions</strong>. You can view more testimonials on the website.
      </p>
    ),
  },
  {
    question: "Do you offer professional photo and video editing services?",
    answer: (
      <div className="space-y-4">
        <p>
          Yes, Beige provides comprehensive <strong>editing services</strong> for both photography and videography. Our team offers:
        </p>
        <ul className="list-disc pl-5 space-y-2 marker:text-[#E8D1AB] text-white">
          <li><strong>Photo retouching, color correction</strong>, and background enhancements.</li>
          <li><strong>Video editing</strong>, including color grading, <strong>motion graphics</strong>, and sound design.</li>
        </ul>
        <p>Our team ensures your content is polished to perfection.</p>
      </div>
    ),
  },
  {
    question: "Can I choose a specific photographer or videographer for my project?",
    answer: (
      <p>
        Yes, we will assign the best-suited expert to fulfill your needs and ensure your creative vision is brought to life.
      </p>
    ),
  },
  {
    question: "Do you provide photography and videography services internationally?",
    answer: (
      <p>
        Beige offers <strong>international photography and videography services</strong>. We work with clients worldwide, including those in the U.S., Europe, and beyond. Whether it’s a destination wedding or a global commercial project, we are available to travel and capture high-quality visuals.
      </p>
    ),
  },
  {
    question: "Has Beige been featured in the press or media outlets?",
    answer: (
      <p>
        Yes, Beige has been featured in multiple prestigious media outlets. Our <strong>photography services</strong> and <strong>videography expertise</strong> have been recognized globally.
      </p>
    ),
  },
  {
    question: "Where can I see your photography and videography portfolio?",
    answer: (
      <p>
        Browse through our <strong>wedding photography, corporate videos, and creative projects</strong> to see the caliber of our work on the{" "}
        “use case” section of our website.
      </p>
    ),
  },
  {
    question: "How can I get a custom quote for my photo or video project",
    answer: (
      <p>
        Beige provides <strong>custom quotes</strong> based on your specific requirements. To receive a tailored quote, simply visit our <a href="/book" className="text-[#E8D1AB] hover:text-[#E8D1AB]/70">Booking Page</a>, fill out the project details, and we will send you a personalized proposal.
      </p>
    ),
  },
];

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-10 md:py-20 lg:py-32 relative overflow-hidden">
      <Container>
        <div className="border-b border-t border-b-white/60 border-t-white/60 w-[140px] py-2 text-center mb-5 md:mb-6">
          <p className="text-xs md:text-base text-white">FAQ</p>
        </div>
        <div className="flex flex-col lg:flex-row gap-7 lg:gap-24 items-start">
          {/* Left Content */}
          <div className="w-full lg:w-1/3 shrink-0">
            {/* Section Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:mb-16"
            >
              <h2 className="text-center text-3xl md:text-[56px] font-medium bg-gradient-to-r from-[#FFF] from-[2.09%] to-[rgba(255,255,255,0.20)] to-[98.96%] bg-clip-text text-transparent select-text block">
                Everything You Need to Know!
              </h2>
            </motion.div>
          </div>

          {/* Right Grid */}
          <div className="w-full lg:w-2/3">
            {/* FAQ Items */}
            <div className="max-w-3xl mx-auto">
              {FAQ_ITEMS.map((item, index) => {
                const isOpen = openIndex === index;
                const isLast = index === FAQ_ITEMS.length - 1;
                const isFirst = index === 0;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05, duration: 0.5 }}
                    className={`
                      ${!isLast ? "border-b border-white/10" : ""}
                      ${isFirst ? "pt-0" : "pt-5 lg:pt-6"}
                      ${isLast ? "pb-0" : "pb-5 lg:pb-6"}
                    `}
                  >
                    <button
                      onClick={() => toggleItem(index)}
                      className="flex justify-between items-center w-full text-left group"
                    >
                      <span className="text-sm md:text-lg lg:text-[28px] text-white transition-colors pr-8">
                        {item.question}
                      </span>

                      {/* Toggle Icon */}
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex-shrink-0"
                      >
                        {isOpen ? (
                          <Minus className="w-5 h-5 text-white/60 transition-colors" />
                        ) : (
                          <Plus className="w-5 h-5 text-white/60 transition-colors" />
                        )}
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="text-white/60 text-xs md:text-base lg:text-xl leading-relaxed mt-2 lg:mt-4 pr-12">
                            {item.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};