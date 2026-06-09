"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

import { Separator } from '@/src/components/landing/Separator';

interface RuleItem {
  title: string;
  content: string;
}

const HostRulesAccordion = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const rules: RuleItem[] = [
    { title: 'Host Rules', content: 'Detailed host rules and guidelines for studio usage go here.' },
    { title: 'Cleaning Protocol', content: 'Our comprehensive cleaning and sanitization standards for every session.' },
    { title: 'Protective Gears', content: 'Information regarding available safety equipment and requirements.' },
    { title: 'Physical Distance', content: 'Spatial guidelines to ensure comfort and safety during your booking.' },
    { title: 'Signage', content: 'Directions on how to navigate the studio and use on-site indicators.' },
    { title: 'Cancellation Policy', content: 'Terms and conditions regarding booking modifications and refunds.' },
  ];

  const toggleAccordion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="w-full bg-[#1B1B1B] rounded-xl overflow-hidden px-5 py-6 space-y-5">
      {rules.map((rule, index) => {
        const isExpanded = expandedIndex === index;

        return (
          <div
            key={index}
          // className={`${index !== rules.length - 1 ? 'border-b border-white/5' : ''}`}
          >
            <div className={`${index !== rules.length - 1 ? 'pb-5' : ''}`}>

              <button
                onClick={() => toggleAccordion(index)}
                className="w-full flex items-center justify-between text-left transition-colors group"
              >
                <span className={`lg:text-lg font-light transition-colors ${isExpanded ? 'text-white' : 'text-[#FFFFFFAD] group-hover:text-white/80'}`}>
                  {rule.title}
                </span>
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight
                    size={20}
                    className={'text-white'}
                  />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 text-[#8B8B8B] text-base leading-relaxed">
                      {rule.content}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {index !== rules.length - 1 &&
              <Separator />
            }

          </div>
        );
      })}
    </div>
  );
};

export default HostRulesAccordion;