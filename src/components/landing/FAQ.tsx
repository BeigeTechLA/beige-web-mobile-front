"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { Container } from "@/src/components/landing/ui/container";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What services does Beige Media offer?",
    answer:
      "We provide professional livestreaming, photography, and videography services for events, conferences, and special occasions.",
  },
  {
    question: "How far in advance should I book?",
    answer:
      "We recommend booking at least 2-4 weeks in advance for best availability.",
  },
  {
    question: "Do you provide equipment?",
    answer:
      "Yes, all professional equipment is included in our service packages.",
  },
  {
    question: "What's your coverage area?",
    answer:
      "We primarily serve the Miami area but are available for events nationwide.",
  },
  {
    question: "Can I see samples of your work?",
    answer:
      "Yes, check our Showcase section or contact us for a full portfolio.",
  },
  {
    question: "What's included in your packages?",
    answer:
      "Each package includes professional crew, equipment, editing, and delivery of final content.",
  },
  {
    question: "What is your cancellation policy?",
    answer:
      "We offer flexible cancellation up to 7 days before your event. Contact us for specific terms and conditions.",
  },
  {
    question: "Can you accommodate last-minute bookings?",
    answer:
      "While we prefer advance bookings, we'll do our best to accommodate last-minute requests based on availability. Contact us directly to discuss urgent needs.",
  },
];

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-10 lg:py-32 relative overflow-hidden">
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
              <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white tracking-tight">
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
                      <span className="text-sm lg:text-[28px] text-white transition-colors pr-8">
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
                          <p className="text-white/70 text-xs lg:text-xl leading-relaxed mt-2 lg:mt-4 pr-12">
                            {item.answer}
                          </p>
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
