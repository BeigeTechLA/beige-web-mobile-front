"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { QuoteBookingsTable } from "./Quotebookingstable";

type PipelineStatus = "Sent" | "Accepted" | "Partially Paid";

const pipelineCards: [PipelineStatus, string, string][] = [
  ["Sent", "20 Quotes", "from-[#1b1923] to-[#8676e8]"],
  ["Accepted", "14 Quotes", "from-[#173322] to-[#39c762]"],
  ["Partially Paid", "12 Quotes", "from-[#242216] to-[#dacb43]"],
];

export function OpenPipelineCard() {
  const [activeStatus, setActiveStatus] = useState<PipelineStatus | null>(null);

  const handleToggle = (status: PipelineStatus) => {
    setActiveStatus((current) => (current === status ? null : status));
  };

  return (
    <section className="rounded-xl border border-[#2c2c2c] bg-[#171717] p-4 xl:col-span-2">
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[13px] font-medium text-white/80">
            <span className="h-4 w-px bg-[#ead7b0]" />
            Open Pipeline
          </div>
          <p className="text-2xl font-semibold text-[#ead7b0]">$12.4M</p>
          <p className="mt-1 text-[13px] text-white/55">Total Active Pipeline Value</p>
        </div>
        <div className="rounded-xl border border-white/15 bg-[#101010] px-5 py-2 text-center">
          <b className="text-xl">46</b>
          <p className="text-[12px]">Active Quotes</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-5 rounded-lg bg-[#101010] p-4">
        {pipelineCards.map(([label, count, gradient]) => {
          const isActive = activeStatus === label;
          return (
            <button
              key={label}
              onClick={() => handleToggle(label)}
              className={`relative border-l-2 pl-2 pr-8 text-left transition-colors ${
                isActive ? "border-[#E8D1AB]" : "border-white"
              }`}
            >
              <span className="absolute right-1 top-0">
                <span
                  className={`group grid h-6 w-6 place-items-center rounded-full border transition-colors duration-200 ${
                    isActive
                      ? "border-[#E8D1AB] bg-[#E8D1AB]"
                      : "border-white/15 bg-[#3D3D3D] hover:border-[#E8D1AB] hover:bg-[#E8D1AB]"
                  }`}
                >
                  <ArrowUpRight
                    size={12}
                    strokeWidth={1.5}
                    className={`transition-transform duration-200 ${
                      isActive
                        ? "rotate-90 text-[#101010]"
                        : "text-white group-hover:text-[#101010]"
                    }`}
                  />
                </span>
              </span>
              <p className="text-[13px] text-white/75">{label}</p>
              <p className="text-[11px] text-[#b5a4ff]">{count}</p>
              <div className={`mt-2 h-8 rounded bg-gradient-to-r ${gradient}`} />
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {activeStatus && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4">
              <QuoteBookingsTable statusFilter={activeStatus} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}