"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ShootRecord {
  id: string;
  customerName: string;
  initials: string;
  date: string;
  category: string;
  price: string;
  status: string;
}

// internal status mapping for styles
const STATUS_STYLES = {
  "Initiated": "bg-[#FFF9E5] text-[#B18A00]",
  "PreProduction": "bg-[#FDF4FF] text-[#C065F0]",
  "PostProduction": "bg-[#EAEAEA] text-[#666666]",
  "Revision": "bg-[#E6F0FF] text-[#3B82F6]",
  "Completed": "bg-[#F0FFF4] text-[#22C55E]",
  "Cancelled": "bg-[#FFF5F5] text-[#EF4444]",
};

const STATUS_LABEL_MAP: Record<number, string> = {
  0: "Initiated",
  1: "PreProduction",
  2: "PostProduction",
  3: "Revision",
  4: "Completed",
  5: "Cancelled",
};

interface MobileShootRowProps {
  shoot: ShootRecord;
  onRowClick: (id: string) => void;
}

const StatusBadge = ({ status }: { status: string }) => {
  const style = STATUS_STYLES[status as keyof typeof STATUS_STYLES] || "bg-[#F3F4F6] text-[#6B7280]";

  return (
    <span className={`px-6 py-2.5 rounded-full text-base font-medium leading-none ${style}`}>
      {status}
    </span>
  );
};

export const MobileShootRow = ({ shoot, onRowClick }: MobileShootRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-[#171717] rounded-2xl border border-white/5 overflow-hidden mb-3">
      {/* Header - Always Visible */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          {/* Circular Chevron Toggle */}
          <div className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown size={18} className="text-white/60" />
          </div>

          {/* Customer Avatar & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-black font-semibold text-sm">
              {shoot.initials}
            </div>
            <span className="text-base font-medium text-white">{shoot.customerName}</span>
          </div>
        </div>

        <StatusBadge status={shoot.status} />
      </div>

      {/* Expandable Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="border-t border-white/5 bg-black/10"
          >
            <div className="p-5 space-y-6">
              {/* Data Grid: 2 Columns */}
              <div className="grid grid-cols-2 gap-y-6">
                <div>
                  <p className="text-white/40 text-sm mb-1">Shoot ID</p>
                  <p className="text-white text-base">{shoot.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-sm mb-1">Price</p>
                  <p className="text-white text-base font-medium">{shoot.price}</p>
                </div>
                <div>
                  <p className="text-white/40 text-sm mb-1">Category</p>
                  <p className="text-white text-base">{shoot.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-sm mb-1">Action</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRowClick(shoot.id);
                    }}
                    className="text-[#E5D5B8] text-base font-medium underline underline-offset-4"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};