"use client";

import React from "react";
import { format } from "date-fns";
import { MoreVertical, Loader2 } from "lucide-react";
import { LeadsStatusBadge, BookingStatus } from "@/components/sales/LeadsStatusBadge";
import { IntentBadge } from "./IntentBadge";
import { useTheme } from "next-themes";

interface LeadData {
  lead_id: number;
  clientName: string;
  email: string;
  leadType: "Self-Serve" | "Sales Assisted";
  bookingStatus: "Paid" | "In-Progress" | BookingStatus;
  lastActivity: string;
  date: Date;
  intent: string;
  assignedSalesRepName?: string;
  assignedSalesRepEmail?: string;
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
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || theme === "dark";

  if (loading && data.length === 0) {
    return (
      <div className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-[#E5E5E5] bg-white"
        }`}>
        <Loader2 className={`animate-spin ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} size={40} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 ${isDark ? "text-white/60 border-[#3D3D3D] bg-[#171717]" : "text-black/40 border-[#E5E5E5] bg-white"
        }`}>
        <p>No leads found</p>
      </div>
    );
  }

  return (
    <div className={`w-full overflow-x-auto rounded-2xl border transition-all duration-300 ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-[#E5E5E5] bg-white"
      }`}>
      <table className="w-full text-left border-separate border-spacing-0">
        <thead>
          <tr className={`text-sm font-medium transition-colors duration-300 ${isDark ? "bg-[#101010] text-[#E8D1AB]" : "bg-[#FFFCF6] text-[#000000]"
            }`}>
            <th className={`p-3 lg:py-5 font-medium border-b rounded-tl-2xl ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
              Client Name
            </th>
            <th className={`p-3 lg:py-5 font-medium border-b ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
              Email ID
            </th>
            <th className={`p-3 lg:py-5 font-medium border-b ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
              Lead Type
            </th>
            <th className={`p-3 lg:py-5 font-medium border-b ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
              Intent
            </th>
            <th className={`p-3 lg:py-5 font-medium border-b ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
              Booking Status
            </th>
            <th className={`p-3 lg:py-5 font-medium border-b ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
              Last Activity
            </th>
            <th className={`p-3 lg:py-5 font-medium text-right border-b rounded-tr-2xl ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
              Action
            </th>
          </tr>
        </thead>
        <tbody className={`transition-opacity duration-200 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
          {data.map((lead) => (
            <tr
              key={lead.lead_id}
              onClick={() => onRowClick(lead.lead_id)}
              className={`group transition-colors cursor-pointer ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.02]"
                }`}
            >
              <td className={`p-3 lg:py-5 border-b group-last:border-0 ${isDark ? "border-[#222]" : "border-[#F0F0F0]"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 lg:h-[50px] lg:w-[50px] rounded-lg bg-[#FFF6D9] flex items-center justify-center text-black font-semibold text-base lg:text-xl">
                    {lead.clientName.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)}
                  </div>
                  <div>
                    <p className={`font-medium text-sm lg:text-base ${isDark ? "text-white" : "text-[#171717]"}`}>{lead.clientName}</p>
                    <p className={`text-xs lg:text-sm mt-1 ${isDark ? "text-white/40" : "text-[#999]"}`}>
                      {format(lead.date, "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              </td>
              <td className={`p-3 lg:py-5 text-sm lg:text-base border-b group-last:border-0 text-balance ${isDark ? "text-white/80 border-[#222]" : "text-[#333] border-[#F0F0F0]"
                }`}>
                {lead.email}
              </td>
              <td className={`p-3 lg:py-5 text-sm lg:text-base border-b group-last:border-0 ${isDark ? "text-white/80 border-[#222]" : "text-[#333] border-[#F0F0F0]"
                }`}>
                {lead.leadType}
              </td>
              <td className={`p-3 lg:py-5 text-sm lg:text-base border-b group-last:border-0 ${isDark ? "text-white/80 border-[#222]" : "text-[#333] border-[#F0F0F0]"
                }`}>
                <IntentBadge intent={(lead.intent || "Hot") as any} />
              </td>
              <td className={`p-3 lg:py-5 border-b group-last:border-0 shrink-0 ${isDark ? "border-[#222]" : "border-[#F0F0F0]"
                }`}>
                <LeadsStatusBadge status={lead.bookingStatus || "Unknown"} />
              </td>
              <td className={`p-3 lg:py-5 text-sm lg:text-base border-b group-last:border-0 ${isDark ? "text-white/80 border-[#222]" : "text-[#333] border-[#F0F0F0]"
                }`}>
                <div className="space-y-1 min-w-0">
                  <p>{lead.lastActivity}</p>
                  {(lead.assignedSalesRepName || lead.assignedSalesRepEmail) && (
                    <p className={`text-xs truncate ${isDark ? "text-white/50" : "text-[#777]"}`}>
                      {lead.assignedSalesRepName || "Unassigned"}
                      {lead.assignedSalesRepEmail ? ` • ${lead.assignedSalesRepEmail}` : ""}
                    </p>
                  )}
                </div>
              </td>
              <td className={`p-3 lg:py-5 text-right border-b group-last:border-0 ${isDark ? "border-[#222]" : "border-[#F0F0F0]"
                }`}>
                <button
                  className={`p-2 transition-colors ${isDark ? "text-white/40 hover:text-white" : "text-[#999] hover:text-[#171717]"}`}
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
        <div className={`flex justify-between items-center p-6 border-t transition-colors duration-300 ${isDark ? "border-t-[#3D3D3D] bg-[#171717]" : "border-t-[#E5E5E5] bg-[#FFFCF6]"
          }`}>
          <div className={`text-sm ${isDark ? "text-[#666666]" : "text-[#999]"}`}>
            Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalRecords)} of {totalRecords} leads
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPageChange(Math.max(1, currentPage - 1));
              }}
              disabled={currentPage === 1}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${isDark
                  ? "bg-[#111] text-white/60 border-[#333] hover:bg-white/10 hover:text-white"
                  : "bg-white text-[#333] border-[#E5E5E5] hover:bg-black/5"
                }`}
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
                  className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${currentPage === i + 1
                      ? "bg-[#E5D5B8] text-black"
                      : isDark ? "text-white/60 hover:bg-white/5" : "text-[#666] hover:bg-black/5"
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
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${isDark
                  ? "bg-[#111] text-white/60 border-[#333] hover:bg-white/10 hover:text-white"
                  : "bg-white text-[#333] border-[#E5E5E5] hover:bg-black/5"
                }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
