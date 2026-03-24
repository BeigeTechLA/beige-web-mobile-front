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
  "Initiated": "bg-[#FFF9E5] text-[#B18A00]",
  "Pre_Production": "bg-[#FDF4FF] text-[#C065F0]",
  "Shoot Day": "bg-[#FFF9E5] text-[#B18A00]",
  "Post_Production": "bg-[#EAEAEA] text-[#666666]",
  "Revision": "bg-[#E6F0FF] text-[#3B82F6]",
  "Completed": "bg-[#F0FFF4] text-[#22C55E]",
  "Assets Delivered": "bg-[#EAEAEA] text-[#666666]",
  "Cancelled": "bg-[#FFF5F5] text-[#EF4444]",
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
  const style = STATUS_STYLES[status as keyof typeof STATUS_STYLES] || "bg-[#F3F4F6] text-[#6B7280]";

  return (
    <span className={`px-3 py-2 rounded-full text-xs font-medium leading-none ${style}`}>
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
    <div className={`rounded-lg  transition-all duration-300 ${isDark ? "bg-[#171717] border border-white/5" : ((isExpanded ? "bg-[#F9F9F9]" : "bg-white"))
      }`}>
      {/* Header - Always Visible */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
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
            <div className={`w-8 h-8 rounded-sm flex items-center justify-center font-semibold text-sm ${isDark ? "bg-[#F5F5F5] text-black" : "bg-[#FDF8EE] text-[#B18A00]"
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
            className={`transition-colors duration-300 ${isDark ? "border-t border-white/5 bg-black/10" : "border-[#E5E5E5] bg-[#F9F9F9]"
              }`}
          >
            <div className="p-3 space-y-4">
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