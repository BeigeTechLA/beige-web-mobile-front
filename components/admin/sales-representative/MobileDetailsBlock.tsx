"use client";

import React, { useState } from "react";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BookingStatus, LeadsStatusBadge } from "@/components/sales/LeadsStatusBadge";
import { useTheme } from "next-themes";

interface LeadData {
  lead_id: number;
  clientName: string;
  email: string;
  leadType: "Self-Serve" | "Sales Assisted";
  bookingStatus: "Paid" | "In-Progress" | BookingStatus; //update with code change
  lastActivity: string;
  date: Date;
}

interface MobileLeadRowProps {
  lead: LeadData;
  onOpenMenu: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const MobileLeadRow = ({ lead, onOpenMenu }: MobileLeadRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || theme === "dark";

  return (
    <div className={`overflow-hidden mb-3 transition-colors duration-300 rounded-xl ${
      isDark ? "bg-[#171717]" : "bg-white"
    }`}>
      {/* Header - Always Visible */}
      <div
        className="flex flex-wrap gap-2 items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-1 rounded-full border transition-all duration-300 ${
            isExpanded ? 'rotate-180 border-[#E8D1AB]' : isDark ? 'border-white/10' : 'border-black/10'
          }`}>
            <ChevronDown size={16} className={isDark ? "text-white/60" : "text-black/60"} />
          </div>
          <div className="w-6 h-6 rounded-sm bg-[#FFF6D9] flex items-center justify-center text-black font-medium text-xs">
            {lead.clientName.split(" ").map(n => n[0]).join("")}
          </div>
          <span className={`text-sm font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>
            {lead.clientName}
          </span>
        </div>

        <LeadsStatusBadge status={lead.bookingStatus || "Unknown"} />
      </div>

      {/* Expandable Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`border-t transition-colors duration-300 ${
              isDark ? "border-white/5 bg-black/20" : "border-[#F0F0F0] bg-[#FFFCF6]"
            }`}
          >
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-xs mb-1 uppercase tracking-wider font-semibold ${isDark ? "text-white/40" : "text-[#999]"}`}>
                    Email ID
                  </p>
                  <p className={`text-sm truncate ${isDark ? "text-[#A1A1A1]" : "text-[#444]"}`}>
                    {lead.email}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-xs mb-1 uppercase tracking-wider font-semibold ${isDark ? "text-white/40" : "text-[#999]"}`}>
                    Lead Type
                  </p>
                  <p className={`text-sm ${isDark ? "text-[#A1A1A1]" : "text-[#444]"}`}>
                    {lead.leadType}
                  </p>
                </div>
                <div>
                  <p className={`text-xs mb-1 uppercase tracking-wider font-semibold ${isDark ? "text-white/40" : "text-[#999]"}`}>
                    Last Activity
                  </p>
                  <p className={`text-sm ${isDark ? "text-[#A1A1A1]" : "text-[#444]"}`}>
                    {lead.lastActivity}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-xs mb-1 uppercase tracking-wider font-semibold ${isDark ? "text-white/40" : "text-[#999]"}`}>
                    Action
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent closing when clicking action
                      onOpenMenu(e);
                    }}
                    className={`p-1 rounded-md transition-colors ${
                      isDark ? "hover:bg-white/5" : "hover:bg-black/5"
                    }`}
                  >
                    <MoreHorizontal size={24} className={isDark ? "text-white" : "text-[#171717]"} />
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