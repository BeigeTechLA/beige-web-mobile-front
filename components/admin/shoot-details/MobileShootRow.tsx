"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

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
  "Initiated": "bg-[#FFF5CC] text-[#A86500] border border-[#E9CE7A]",
  "Pre_Production": "bg-[#F6EEFF] text-[#A334D5] border border-[#E4CCFF]",
  "PreProduction": "bg-[#F6EEFF] text-[#A334D5] border border-[#E4CCFF]",
  "Shoot Day": "bg-[#FFECCF] text-[#C26A00] border border-[#F4C987]",
  "Post_Production": "bg-[#F1F1F1] text-[#666666] border border-[#D7D7D7]",
  "PostProduction": "bg-[#F1F1F1] text-[#666666] border border-[#D7D7D7]",
  "Revision": "bg-[#E9EEFF] text-[#3258D8] border border-[#C8D5FF]",
  "Completed": "bg-[#DCF7E8] text-[#1F8A53] border border-[#B9E7CD]",
  "Assets Delivered": "bg-[#D7F3E4] text-[#1D7A4F] border border-[#A7DEBF]",
  "Cancelled": "bg-[#FFE8E8] text-[#D03434] border border-[#F4C0C0]",
};

const STATUS_LABEL_MAP: Record<number, string> = {
  0: "Initiated",
  1: "Pre_Production",
  2: "Shoot Day",
  3: "Post_Production",
  4: "Revision",
  5: "Completed",
  6: "Assets Delivered",
  7: "Cancelled",
};

interface MobileShootRowProps {
  shoot: ShootRecord;
  onRowClick: (id: string) => void;
}

const StatusBadge = ({ status }: { status: string }) => {
  const style = STATUS_STYLES[status as keyof typeof STATUS_STYLES] || "bg-[#ECECEC] text-[#6D6D6D] border border-[#D5D5D5]";

  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold leading-none whitespace-nowrap ${style}`}>
      {status}
    </span>
  );
};

export const MobileShootRow = ({ shoot, onRowClick }: MobileShootRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  if (!mounted) return null;

  return (
    <div className={`transition-all duration-300 ${isDark ? ((isExpanded ? "bg-[#202020]" : "bg-[#171717]")) : ((isExpanded ? "bg-[#F9F9F9]" : "bg-white"))}`}>
      {/* Header - Always Visible */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer gap-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          {/* Circular Chevron Toggle */}
          <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300 shrink-0 ${isExpanded
              ? (isDark ? 'rotate-180 border-[#E8D1AB] text-[#E8D1AB]' : 'rotate-180 border-[#000000] text-[#000000]')
              : (isDark ? 'border-white/10 text-white/60' : 'border-[#E5E5E5] text-[#999]')
            }`}>
            <ChevronDown size={16} />
          </div>

          {/* Customer Avatar & Name */}
          <div className="flex items-center gap-3">
            <div className={`shrink-0 w-8 h-8 rounded-sm flex items-center justify-center font-semibold text-sm ${isDark ? "bg-[#F5F5F5] text-black" : "bg-[#FDF8EE] text-[#B18A00]"
              }`}>
              {shoot.initials}
            </div>
            <span className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
              {shoot.customerName}
            </span>
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
            className={`transition-colors duration-300 ${isDark ? "bg-[#202020]" : "border-[#E5E5E5] bg-[#F9F9F9]"}`}
          >
            <div className="pt-0 pr-5 pb-7 pl-14 space-y-4">
              {/* Data Grid: 2 Columns */}
              <div className="grid grid-cols-2 gap-y-3">
                <div>
                  <p className={`text-sm mb-0.5 ${isDark ? "text-white/40" : "text-[#999]"}`}>Shoot ID</p>
                  <p className={`text-sm ${isDark ? "text-white" : "text-[#333]"}`}>{shoot.id}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm mb-0.5 ${isDark ? "text-white/40" : "text-[#999]"}`}>Price</p>
                  <p className={`text-sm font-medium ${isDark ? "text-white" : "text-[#333]"}`}>{shoot.price}</p>
                </div>
                <div>
                  <p className={`text-sm mb-0.5 ${isDark ? "text-white/40" : "text-[#999]"}`}>Category</p>
                  <p className={`text-sm ${isDark ? "text-white" : "text-[#333]"}`}>{shoot.category}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm mb-0.5 ${isDark ? "text-white/40" : "text-[#999]"}`}>Action</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRowClick(shoot.id);
                    }}
                    className={`text-sm font-medium underline underline-offset-4 ${isDark ? "text-[#E5D5B8]" : "text-[#B18A00]"
                      }`}
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
