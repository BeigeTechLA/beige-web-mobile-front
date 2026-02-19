"use client";

import React, { useState } from "react";
import { Loader2, ChevronDown, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LeadsStatusBadge } from "@/components/sales/LeadsStatusBadge";

// This is the internal component that handles the expandable mobile view
function MobileUserRow<T>({
  item,
  renderMobileDetails
}: {
  item: T;
  renderMobileDetails: (item: T) => React.ReactNode
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const data = item as any; // Type casting for ease of access to common fields

  return (
    <div className="bg-[#171717] border border-[#333] rounded-xl overflow-hidden mb-3 lg:hidden">
      {/* Header - Always Visible */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-1 rounded-full border border-white/10 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown size={14} className="text-white/60" />
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#F5D5D5] flex items-center justify-center text-black font-bold text-xs">
            {data.imageUrl ? (
              <img src={data.imageUrl} alt={data.name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <span>{data.initials}</span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">{data.name}</span>
            <span className="text-[10px] text-white/40">{data.id}</span>
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
            className="border-t border-white/5 bg-black/20"
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
  renderMobileDetails: (item: T) => React.ReactNode; // Defines what shows inside the expanded area
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
  return (
    <div className="space-y-6">
      {/* --- DESKTOP TABLE --- */}
      <div className="hidden lg:block w-full bg-[#171717] rounded-2xl border border-[#333] overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#101010] text-[#E8D1AB] text-sm">
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
                  <td colSpan={headers.length} className="py-20 text-center"><Loader2 className="animate-spin inline text-[#E8D1AB]" /></td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={headers.length} className="py-20 text-center text-[#888]">No users found.</td>
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
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#E8D1AB]" /></div>
        ) : (
          data.map((item, idx) => (
            <MobileUserRow key={idx} item={item} renderMobileDetails={renderMobileDetails} />
          ))
        )}
      </div>

      {/* --- PAGINATION --- */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col md:flex-row justify-between items-center p-6 border border-[#333] rounded-2xl bg-[#171717] gap-4">
          <div className="text-sm text-[#666666]">
            Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalRecords)} of {totalRecords} results
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 text-sm font-medium rounded-lg bg-[#111] text-white/60 border border-[#333] hover:bg-white/10 disabled:opacity-30">Previous</button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                <button key={i + 1} onClick={() => onPageChange(i + 1)} className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg ${currentPage === i + 1 ? "bg-[#E5D5B8] text-black" : "text-white/60 hover:bg-white/5"}`}>
                  {i + 1}
                </button>
              ))}
            </div>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 text-sm font-medium rounded-lg bg-[#111] text-white/60 border border-[#333] hover:bg-white/10 disabled:opacity-30">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}