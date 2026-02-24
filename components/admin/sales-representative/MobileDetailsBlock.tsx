"use client";

import React, { useState } from "react";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BookingStatus, LeadsStatusBadge } from "@/components/sales/LeadsStatusBadge";

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

// const StatusBadge = ({ status }: { status: LeadData["bookingStatus"] }) => {
//   const styles = {
//     Paid: "bg-[#F0FFF4] text-[#22C55E] border-[#22C55E]/20",
//     "In-Progress": "bg-[#FFF4C9] text-[#BA6605] border-[#FFF4C9]",
//   };

//   return (
//     <span
//       className={`text-nowrap p-2 lg:px-4 lg:py-3 rounded-full text-xs lg:text-base font-medium border ${styles[status]}`}
//     >
//       {status}
//     </span>
//   );
// };

export const MobileLeadRow = ({ lead, onOpenMenu }: MobileLeadRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-[#171717] overflow-hidden mb-3">
      {/* Header - Always Visible */}
      <div
        className="flex flex-wrap gap-2 items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-1 rounded-full border border-white/10 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown size={16} className="text-white/60" />
          </div>
          <div className="w-5 h-5 rounded-sm bg-[#FFF6D9] flex items-center justify-center text-black font-medium text-xs">
            {lead.clientName.split(" ").map(n => n[0]).join("")}
          </div>
          <span className="text-sm font-medium text-white">{lead.clientName}</span>
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
            className="border-t border-white/5 bg-black/20"
          >
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white text-xs mb-1">Email ID</p>
                  <p className="text-[#A1A1A1] text-sm truncate">{lead.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-white text-xs mb-1">Lead Type</p>
                  <p className="text-[#A1A1A1] text-sm">{lead.leadType}</p>
                </div>
                <div>
                  <p className="text-white text-xs mb-1">Last Activity</p>
                  <p className="text-[#A1A1A1] text-sm">{lead.lastActivity}</p>
                </div>
                <div className="text-right">
                  <p className="text-white text-xs mb-1">Action</p>
                  <button
                    onClick={(e) => onOpenMenu(e)}
                    className="p-1 hover:bg-white/5 rounded-md"
                  >
                    <MoreHorizontal size={24} className="text-white" />
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