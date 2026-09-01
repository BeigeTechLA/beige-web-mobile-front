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
  totalExtra?: number;
  totalCount?: number;
  icon?: string;
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
  totalExtra = 25,
  totalCount = 100,
  icon = "📸",
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
            className="w-full py-5 px-3.5 lg:px-7 lg:py-9 flex items-center justify-between text-left cursor-pointer  transition-colors"
          >
            <h3 className="text-base lg:text-[26px] font-['Roboto_Condensed'] font-bold text-[#E8D1AB]">
              {title}
            </h3>
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
              className="overflow-hidden"
            >
              <div className="px-4 md:px-8 pb-4 md:pb-8 pt-0 space-y-3 lg:space-y-6">
                {/* Quantity Counter Row */}
                <div className="flex items-center justify-between pt-4 lg:pt-6">
                  <div>
                    <h4 className="text-sm lg:text-xl font-medium text-white">
                      {itemLabel}
                    </h4>
                    <p className="text-xs lg:text-lg font-light text-white/70 mt-0.5">
                      +{perSetCount} Per Set
                    </p>
                  </div>

                  <div className="flex items-center gap-1 lg:gap-3 bg-[#E8D1AB] text-black px-2 py-1.5 lg:px-3.5 lg:py-2 rounded-full font-semibold self-start xl:self-auto">
                    <button
                      type="button"
                      onClick={onDecrement}
                      className="w-5 h-5 flex items-center justify-center gap-2 rounded-full hover:bg-black/10 transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5 lg:w-5 lg:h-5 stroke-[2.5]" />
                    </button>
                    <span className="w-6 text-center text-sm lg:text-xl font-medium">
                      {String(setsCount).padStart(2, "0")}
                    </span>
                    <button
                      type="button"
                      onClick={onIncrement}
                      className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 lg:w-5 lg:h-5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                <hr className={`border-t my-3.5 lg:my-7 border-white/20`} />

                {/* Badges Stack */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="w-full lg:w-fit flex flex-col lg:flex-row lg:items-center gap-2 bg-[#211F1C] px-5 py-2.5 rounded-md lg:rounded-xl text-sm lg:text-lg font-medium text-[#E8D1AB]">
                    <div className="flex gap-1 ">
                      <span>{icon}</span>
                      <span>Includes {baseFreeCount} free photo edits</span>
                    </div>
                    <span className="text-center bg-white text-black p-2.5 lg:py-4 rounded-md text-xs lg:text-sm font-medium ml-1">
                      {durationLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-[#211F1C] py-3 px-5 lg:py-5.5 rounded-md lg:rounded-xl text-sm lg:text-lg font-medium text-[#E8D1AB]">
                    ➕ <span>{totalExtra} Added Extra</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Total Summary Badge */}
      <div className="w-full lg:w-fit inline-flex items-center gap-3 bg-[#E8D1AB] text-black p-3 lg:p-4 rounded-md lg:rounded-xl font-bold text-sm lg:text-xl shadow-lg">
        <div className="bg-black rounded-full p-2">
          <Sparkles className="w-6 h-6 text-[#E8D1AB]" />
        </div>
        <span>You'll Receive {totalCount} Items</span>
      </div>
    </div>
  );
};