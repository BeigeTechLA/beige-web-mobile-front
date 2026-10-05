"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, Minus, Sparkles } from "lucide-react";

interface CollapsibleEditProps {
  title?: string;
  itemLabel?: string;
  setsCount: number;
  onIncrement: (e: React.MouseEvent) => void;
  onDecrement: (e: React.MouseEvent) => void;
  baseFreeCount?: number;
  perSetCount?: number;
  durationLabel?: string;
  totalCount?: number;
  initialOpen?: boolean;
}

export const CollapsibleEdit: React.FC<CollapsibleEditProps> = ({
  title = "Photo Edits",
  itemLabel = "Edited Photos",
  setsCount,
  onIncrement,
  onDecrement,
  baseFreeCount = 100,
  perSetCount = 25,
  durationLabel = "4 Hour Duration",
  totalCount = 100,
  initialOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(initialOpen);

  return (
    <div className="space-y-6">
      <div className="rounded-lg lg:rounded-2xl bg-[#101010] border border-white/10 overflow-hidden transition-all duration-300">
        <div className={` bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) ${isOpen ? "border-b border-white/20 rounded-b-lg lg:rounded-b-2xl" : ""}`}>
          {/* Toggle Header */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-controls="photo-edit-options"
            className="w-full py-5 px-4 lg:p-6 flex items-start justify-between gap-4 text-left cursor-pointer transition-colors"
          >
            <div>
              <h3 className="text-base lg:text-xl 2xl:text-[26px] font-['Roboto_Condensed'] font-bold text-[#E8D1AB]">
                {title}
              </h3>
              <p className="mt-3 w-fit rounded-lg bg-[#292622] px-4 py-3 text-xs lg:text-sm text-[#E8D1AB]">
                Includes {baseFreeCount} free photo edits for your <span className="font-semibold text-white underline underline-offset-4">{durationLabel.replace(/ Duration$/, "")}</span> Duration
              </p>
            </div>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-white/80"
            >
              <ChevronDown className="w-5 h-5 lg:w-8 lg:h-8" />
            </motion.div>
          </button>
        </div>

        {/* Expandable Body */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              id="photo-edit-options"
              className="overflow-hidden"
            >
              <div className="px-4 md:px-8 pb-4 md:pb-8 pt-0 space-y-3 lg:space-y-6">
                <p className="pt-4 text-base lg:text-lg font-medium text-[#E8D1AB]">Do you want more?</p>
                {/* Quantity Counter Row */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm lg:text-xl font-medium text-white">
                      {itemLabel}
                    </h4>
                    <p className="text-xs lg:text-lg font-light text-white/70 mt-0.5">
                      +{perSetCount} Photos Per Set
                    </p>
                  </div>

                  <div className="flex items-center gap-1 lg:gap-3 bg-[#E8D1AB] text-black px-2 py-1.5 lg:px-3.5 lg:py-2 rounded-full font-semibold self-start xl:self-auto">
                    <button
                      type="button"
                      onClick={onDecrement}
                      aria-label="Remove a photo edit set"
                      disabled={setsCount === 0}
                      className="w-5 h-5 flex items-center justify-center gap-2 rounded-full hover:bg-black/10 transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5 lg:w-5 lg:h-5 stroke-[2.5]" />
                    </button>
                    <span className="w-6 text-center text-sm lg:text-xl font-medium">
                      {String(setsCount)}
                    </span>
                    <button
                      type="button"
                      onClick={onIncrement}
                      aria-label="Add a photo edit set"
                      className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 lg:w-5 lg:h-5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Total Summary Badge */}
      <div className="w-full lg:w-fit inline-flex items-center gap-3 bg-[#E8D1AB] text-black p-3 lg:p-4 rounded-md lg:rounded-xl font-bold text-sm lg:text-lg 2xl:text-xl shadow-lg">
        <div className="bg-black rounded-full p-2">
          <Sparkles className="w-6 h-6 text-[#E8D1AB]" />
        </div>
        <span>You&apos;ll Receive {totalCount} Photos</span>
      </div>
    </div>
  );
};