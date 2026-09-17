"use client";

import { useState } from "react";
import { currency } from "./types";
import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { QuoteBookingsTable } from "./Quotebookingstable";

export function QuotePipelineCard() {
  const [showBookings, setShowBookings] = useState(false);

  return (
    <section className="rounded-xl border border-[#2c2c2c] bg-[#171717] p-4">
      <div className="grid gap-4 md:grid-cols-[130px_1fr]">
        <div className="flex flex-col">
          <div className="mb-3 flex items-center gap-2 text-[13px] font-medium text-white/80">
            <span className="h-4 w-px bg-[#ead7b0]" />
            Quotes Overdue
          </div>
          <b className="text-xl text-[#ead7b0]">14</b>
          <p className="mt-1 text-[13px] text-white/55">Need Follow-Up</p>
          <button
            aria-label="View overdue quotes"
            onClick={() => setShowBookings((current) => !current)}
            className={`group mt-auto grid h-6 w-6 place-items-center rounded-full border transition-colors duration-200 ${
              showBookings
                ? "border-[#E8D1AB] bg-[#E8D1AB]"
                : "border-white/15 bg-[#3D3D3D] hover:border-[#E8D1AB] hover:bg-[#E8D1AB]"
            }`}
          >
            <ArrowUpRight
              size={12}
              strokeWidth={1.5}
              className={`transition-transform duration-200 ${
                showBookings
                  ? "rotate-90 text-[#101010]"
                  : "text-white group-hover:text-[#101010]"
              }`}
            />
          </button>
        </div>
        <div className="rounded-lg bg-[#101010] p-4">
          <p className="text-[13px] text-white/70">Pipeline At Risk</p>
          <div className="mt-3 grid grid-cols-3 text-[11px]">
            <span className="text-[#41c7e3]">• SENT - 6 QUOTES</span>
            <span className="text-[#42d96a]">• ACCEPTED - 5 QUOTES</span>
            <span className="text-[#e7d045]">• PARTIALLY PAID - 3 QUOTES</span>
          </div>
          <div className="mt-2 flex h-11 overflow-hidden rounded">
            <div className="grid flex-[1.6] place-items-center bg-gradient-to-b from-[#50d4fa] to-[#167baf] text-sm font-bold text-black">$1.6M</div>
            <div className="grid flex-[1.3] place-items-center bg-gradient-to-b from-[#c2efad] to-[#6bcf70] text-sm font-bold text-black">$1.3M</div>
            <div className="grid flex-1 place-items-center bg-gradient-to-b from-[#fff4ba] to-[#d5bd5a] text-sm font-bold text-black">$0.9M</div>
          </div>
          <p className="mt-3 flex items-center gap-2 text-center text-[13px] text-[#ead7b0] before:h-px before:flex-1 before:bg-white/20 after:h-px after:flex-1 after:bg-white/20">
            Total {currency(3800000)}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {showBookings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4">
              <QuoteBookingsTable statusFilter="All" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}