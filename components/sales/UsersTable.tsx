"use client";

import React, { useState } from "react";
import { Loader2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LeadsStatusBadge } from "@/components/sales/LeadsStatusBadge";
import { useTheme } from "next-themes";

// This is the internal component that handles the expandable mobile view
function MobileUserRow<T>({
  item,
  renderMobileDetails
}: {
  item: T;
  renderMobileDetails: (item: T) => React.ReactNode
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || theme === "dark";
  const data = item as any;

  return (
    <div className={`border rounded-xl overflow-hidden mb-3 lg:hidden transition-all duration-300 ${isDark ? "bg-[#171717] border-[#333]" : "bg-white border-[#E5E5E5]"
      }`}>
      {/* Header - Always Visible */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer gap-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`shrink-0 p-1 rounded-full border transition-all duration-300 ${isExpanded ? 'rotate-180 border-[#E5D5B8]' : isDark ? 'border-white/10' : 'border-black/10'
            }`}>
            <ChevronDown size={14} className={isDark ? "text-white/60" : "text-black/60"} />
          </div>
          <div className="shrink-0 w-9 h-9 rounded-lg bg-[#F5D5D5] flex items-center justify-center text-black font-bold text-xs overflow-hidden">
            {data.imageUrl ? (
              <img src={data.imageUrl} alt={data.name} className="w-full h-full object-cover" />
            ) : (
              <span>{data.initials}</span>
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-[#171717]"}`}>{data.name}</span>
            <span className={`text-[10px] truncate ${isDark ? "text-white/40" : "text-[#999]"}`}>{data.id}</span>
          </div>
        </div>
        <LeadsStatusBadge status={"Booking In Progress"} />
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`border-t transition-colors duration-300 ${isDark ? "border-white/5 bg-black/20" : "border-[#F0F0F0] bg-[#FFFCF6]"
              }`}
          >
            {renderMobileDetails(item)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface Props<T> {
  data: T[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  headers: string[];
  renderRow: (item: T) => React.ReactNode;
  renderMobileDetails: (item: T) => React.ReactNode;
  onPageChange: (page: number) => void;
}

export default function UsersTable<T>({
  data,
  loading,
  currentPage,
  totalPages,
  totalRecords,
  limit,
  headers,
  renderRow,
  renderMobileDetails,
  onPageChange,
}: Props<T>) {
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || theme === "dark";

  return (
    <div className="space-y-6">
      {/* --- DESKTOP TABLE --- */}
      <div className={`hidden lg:block w-full rounded-2xl border overflow-hidden transition-all duration-300 ${isDark ? "bg-[#171717] border-[#333]" : "bg-white border-[#E5E5E5]"
        }`}>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-sm transition-colors duration-300 ${isDark ? "bg-[#101010] text-[#E8D1AB]" : "bg-[#FFFCF6] text-[#000000]"
                }`}>
                {headers.map((header, idx) => (
                  <th key={header} className={`py-5 px-6 font-medium ${idx === headers.length - 1 ? 'text-right' : ''}`}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={headers.length} className="py-20 text-center">
                    <Loader2 className={`animate-spin inline ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={headers.length} className={`py-20 text-center ${isDark ? "text-[#888]" : "text-[#999]"}`}>
                    No users found.
                  </td>
                </tr>
              ) : (
                data.map(renderRow)
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MOBILE LIST --- */}
      <div className="lg:hidden">
        {loading && data.length === 0 ? (
          <div className="flex justify-center py-10">
            <Loader2 className={`animate-spin ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} />
          </div>
        ) : (
          data.map((item, idx) => (
            <MobileUserRow key={idx} item={item} renderMobileDetails={renderMobileDetails} />
          ))
        )}
      </div>

      {/* --- PAGINATION --- */}
      {!loading && totalPages > 1 && (
        <div className={`flex flex-col md:flex-row justify-between items-center p-6 border rounded-2xl gap-4 transition-all duration-300 ${isDark ? "border-[#333] bg-[#171717]" : "border-[#E5E5E5] bg-[#FFFCF6]"
          }`}>
          <div className={`text-sm ${isDark ? "text-[#666666]" : "text-[#999]"}`}>
            Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalRecords)} of {totalRecords} results
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${isDark
                  ? "bg-[#111] text-white/60 border-[#333] hover:bg-white/10"
                  : "bg-white text-[#333] border-[#E5E5E5] hover:bg-black/5"
                }`}
            >
              Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => onPageChange(i + 1)}
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
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${isDark
                  ? "bg-[#111] text-white/60 border-[#333] hover:bg-white/10"
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