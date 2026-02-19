"use client";

import React from "react";
import { format } from "date-fns";
import { MoreVertical, Loader2 } from "lucide-react";
import { LeadsStatusBadge, BookingStatus } from "@/components/sales/LeadsStatusBadge";
import { IntentBadge } from "./IntentBadge";

interface LeadData {
  lead_id: number;
  clientName: string;
  email: string;
  leadType: "Self-Serve" | "Sales Assisted";
  bookingStatus: "Paid" | "In-Progress" | BookingStatus; //update with code change
  lastActivity: string;
  date: Date;
}

interface LeadsTableProps {
  data: LeadData[];
  loading: boolean;
  isFetching?: boolean;
  // Pagination Props
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  onPageChange: (page: number) => void;
  // Action Props
  onRowClick: (id: number) => void;
  onOpenMenu: (e: React.MouseEvent<HTMLButtonElement>, name: string, id: number) => void;
}

type IntentType = "Hot" | "Warm" | "Cold";

const INTENT_STYLES: Record<IntentType, { bg: string; text: string }> = {
  Hot: { bg: "bg-[#311F14]", text: "text-[#E6570C]" },
  Warm: { bg: "bg-[#3A2A05]", text: "text-[#FBBF24]" },
  Cold: { bg: "bg-[#132A3E]", text: "text-[#60A5FA]" },
};


export default function LeadsTable({
  data,
  loading,
  isFetching,
  currentPage,
  totalPages,
  totalRecords,
  limit,
  onPageChange,
  onRowClick,
  onOpenMenu,
}: LeadsTableProps) {
  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 border border-[#3D3D3D] rounded-2xl bg-[#171717]">
        <Loader2 className="animate-spin text-[#E8D1AB]" size={40} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-white/60 border border-[#3D3D3D] rounded-2xl bg-[#171717]">
        <p>No leads found</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-[#3D3D3D] bg-[#171717]">
      <table className="w-full text-left border-separate border-spacing-0">
        <thead>
          <tr className="bg-[#101010] text-[#E8D1AB] text-sm font-medium">
            <th className="p-3 lg:py-5 font-medium border-b border-[#333333] rounded-tl-2xl">
              Client Name
            </th>
            <th className="p-3 lg:py-5 font-medium border-b border-[#333333]">
              Email ID
            </th>
            <th className="p-3 lg:py-5 font-medium border-b border-[#333333]">
              Lead Type
            </th>
            <th className="p-3 lg:py-5 font-medium border-b border-[#333333]">
              Intent
            </th>
            <th className="p-3 lg:py-5 font-medium border-b border-[#333333]">
              Booking Status
            </th>
            <th className="p-3 lg:py-5 font-medium border-b border-[#333333]">
              Last Activity
            </th>
            <th className="p-3 lg:py-5 font-medium text-right border-b border-[#333333] rounded-tr-2xl">
              Action
            </th>
          </tr>
        </thead>
        <tbody className={`transition-opacity duration-200 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
          {data.map((lead) => (
            <tr
              key={lead.lead_id}
              onClick={() => onRowClick(lead.lead_id)}
              className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
            >
              <td className="p-3 lg:py-5 border-b border-[#222] group-last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 lg:h-[50px] lg:w-[50px] rounded-lg bg-[#FFF6D9] flex items-center justify-center text-black font-semibold text-base lg:text-xl">
                    {lead.clientName.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm lg:text-base">{lead.clientName}</p>
                    <p className="text-white/40 text-xs lg:text-sm mt-1">
                      {format(lead.date, "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              </td>
              <td className="p-3 lg:py-5 text-white/80 text-sm lg:text-base border-b border-[#222] group-last:border-0 text-balance">
                {lead.email}
              </td>
              <td className="p-3 lg:py-5 text-white/80 text-sm lg:text-base border-b border-[#222] group-last:border-0">
                {lead.leadType}
              </td>
              <td className="p-3 lg:py-5 text-white/80 text-sm lg:text-base border-b border-[#222] group-last:border-0">
                {/* update once data is available */}
                <IntentBadge intent={"Hot"} />
              </td>
              <td className="p-3 lg:py-5 border-b border-[#222] group-last:border-0 shrink-0">
                {/* <StatusBadge status={lead.bookingStatus} /> */}
                {/* using placeholder status until new statuses are available */}
                <LeadsStatusBadge status={"Manual - Lead Created"} />
              </td>
              <td className="p-3 lg:py-5 text-white/80 text-sm lg:text-base border-b border-[#222] group-last:border-0">
                {lead.lastActivity}
              </td>
              <td className="p-3 lg:py-5 text-right border-b border-[#222] group-last:border-0">
                <button
                  className="p-2 text-white/40 hover:text-white transition-colors"
                  onClick={(e) => onOpenMenu(e, lead.clientName, lead.lead_id)}
                >
                  <MoreVertical size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>


      {/* Pagination Section */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-between items-center p-6 border-t border-t-[#3D3D3D] bg-[#171717]">
          <div className="text-sm text-[#666666]">
            Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalRecords)} of {totalRecords} leads
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPageChange(Math.max(1, currentPage - 1));
              }}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[#111] text-white/60 border border-[#333] hover:bg-white/10 hover:text-white disabled:opacity-30 transition-all"
            >
              Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPageChange(i + 1);
                  }}
                  className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${currentPage === i + 1 ? "bg-[#E5D5B8] text-black" : "text-white/60 hover:bg-white/5"
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPageChange(Math.min(totalPages, currentPage + 1));
              }}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[#111] text-white/60 border border-[#333] hover:bg-white/10 hover:text-white disabled:opacity-30 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}