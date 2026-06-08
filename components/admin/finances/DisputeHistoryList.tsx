"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronRight, FileText, Loader2, Search } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type DisputeStatus = "Open" | "In Review" | "Resolved";

export type DisputeHistoryItem = {
  id: string;
  shootId: string;
  invoiceId: string;
  category: string;
  description: string;
  raisedBy: string;
  raisedRole: string;
  raisedDate: string;
  disputedAmount: string;
  payoutHold: string;
  status: DisputeStatus;
};

interface DisputeHistoryListProps {
  items: DisputeHistoryItem[];
  loading?: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusValue: string;
  onStatusChange: (value: string) => void;
  monthValue: string;
  onMonthChange: (value: string) => void;
  typeValue: string;
  onTypeChange: (value: string) => void;
  onViewDetails?: (item: DisputeHistoryItem) => void;
  itemsPerPage?: number;
}

export const disputeStatusStyles: Record<DisputeStatus, string> = {
  Open: "bg-[#2C2419] text-[#D4971B] border-[#6B542C]",
  "In Review": "bg-[#17263D] text-[#4F93FF] border-[#2A4C7A]",
  Resolved: "bg-[#10352A] text-[#22C55E] border-[#1F5B49]",
};

const buildPaginationItems = (
  currentPage: number,
  totalPages: number
): Array<number | "..."> => {
  const range: Array<number | "..."> = [];
  const delta = 1;
  const left = currentPage - delta;
  const right = currentPage + delta + 1;

  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || (i >= left && i < right)) {
      range.push(i);
    } else if (i === left - 1 || i === right) {
      range.push("...");
    }
  }

  return range.filter((val, index, arr) => val !== "..." || arr[index - 1] !== "...");
};

export default function DisputeHistoryList({
  items,
  loading = false,
  searchValue,
  onSearchChange,
  statusValue,
  onStatusChange,
  monthValue,
  onMonthChange,
  typeValue,
  onTypeChange,
  onViewDetails,
  itemsPerPage = 3,
}: DisputeHistoryListProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [items, searchValue, statusValue, monthValue, typeValue]);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const visibleItems = useMemo(
    () => items.slice(startIndex, startIndex + itemsPerPage),
    [items, startIndex, itemsPerPage]
  );
  const paginationItems = buildPaginationItems(safePage, totalPages);

  return (
    <section
      className={`w-full rounded-2xl border overflow-visible transition-all duration-300 ${
        isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5]"
      }`}
    >
      <div className={`flex flex-col gap-4 p-5 lg:p-6 border-b ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-[3px] h-6 bg-[#E5D5B8]" />
            <h3 className={isDark ? "text-white text-[18px]" : "text-[#323232] text-[18px]"}>
              Dispute History
            </h3>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Select value={statusValue} onValueChange={onStatusChange}>
              <SelectTrigger className={`w-[110px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"}`}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-[#111111] border-[#3D3D3D]" : "text-black bg-white border-[#E3E3E3]"}>
                <SelectItem value="All">Status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Review">In Review</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            <Select value={monthValue} onValueChange={onMonthChange}>
              <SelectTrigger className={`w-[110px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"}`}>
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-[#111111] border-[#3D3D3D]" : "text-black bg-white border-[#E3E3E3]"}>
                <SelectItem value="Month">Month</SelectItem>
                <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                <SelectItem value="This Quarter">This Quarter</SelectItem>
                <SelectItem value="This Year">This Year</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeValue} onValueChange={onTypeChange}>
              <SelectTrigger className={`w-[90px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"}`}>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-[#111111] border-[#3D3D3D]" : "text-black bg-white border-[#E3E3E3]"}>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Client">Client</SelectItem>
                <SelectItem value="Creator">Creator</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative w-full">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#666]" : "text-[#999]"}`} size={18} />
          <input
            type="text"
            placeholder="Search by Dispute ID and Client Name..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full border rounded-lg h-10 pl-10 pr-4 text-sm focus:outline-none transition-colors ${
              isDark
                ? "bg-zinc-900 border-[#333333] text-white focus:border-[#E8D1AB]"
                : "bg-white border-[#E5E5E5] text-black focus:border-[#E8D1AB]"
            }`}
          />
        </div>
      </div>

      <div className="p-5 lg:p-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-[#E8D1AB]" size={32} />
          </div>
        ) : visibleItems.length > 0 ? (
          visibleItems.map((item) => (
            <article
              key={item.id}
              className={`rounded-2xl border p-6 transition-colors duration-200 ${
                isDark
                  ? "border-[#3A3225] bg-[#111111] hover:border-[#5B4B30] hover:bg-[#151515]"
                  : "border-[#E5D5B8] bg-[#FFFCF7] hover:border-[#D7C199] hover:bg-[#FFF8EF]"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="space-y-5 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className={`text-[18px] font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>
                      {item.id}
                    </h4>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-sm ${disputeStatusStyles[item.status]}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className={`flex flex-wrap items-center gap-3 text-[18px] ${isDark ? "text-white/75" : "text-[#4C4C4C]"}`}>
                    <span className="flex items-center gap-2">
                      <FileText size={15} className={isDark ? "text-[#E5D5B8]" : "text-[#8B6B36]"} />
                      {item.shootId}
                    </span>
                    <span className={isDark ? "text-white/20" : "text-[#999]"}>&bull;</span>
                    <span className="flex items-center gap-2">
                      <FileText size={15} className={isDark ? "text-[#E5D5B8]" : "text-[#8B6B36]"} />
                      {item.invoiceId}
                    </span>
                    <span className={isDark ? "text-white/20" : "text-[#999]"}>&bull;</span>
                    <span>{item.category}</span>
                  </div>

                  <p className={`text-[17px] ${isDark ? "text-white" : "text-[#171717]"}`}>
                    {item.description}
                  </p>

                  <div className={`border-t pt-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 ${isDark ? "border-[#2A2A2A]" : "border-[#E5E5E5]"}`}>
                    <div className={`text-[15px] ${isDark ? "text-white/55" : "text-[#676767]"}`}>
                      Raised by: <span className={isDark ? "text-white/80" : "text-[#171717]"}>{item.raisedBy}</span> ({item.raisedRole}){" "}
                      <span className="ml-4">{item.raisedDate}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onViewDetails?.(item)}
                      className="inline-flex items-center gap-2 text-[#E5D5B8] text-[16px] font-medium"
                    >
                      View Details <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                <div className="shrink-0 text-right min-w-[180px]">
                  <p className="text-[#FF8B7D] text-[20px] font-semibold">{item.disputedAmount}</p>
                  <p className={`mt-1 text-[15px] ${isDark ? "text-white/55" : "text-[#676767]"}`}>
                    Disputed Amount
                  </p>
                  <p className="mt-3 text-[#D4971B] text-[16px]">Payout Hold: {item.payoutHold}</p>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className={`py-12 text-center ${isDark ? "text-white/50" : "text-[#777]"}`}>
            No disputes found.
          </div>
        )}
      </div>

      {!loading && items.length > 0 && (
        <div className={`flex justify-between items-center p-6 border-t transition-colors duration-300 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
          <div className={`hidden lg:block text-sm ${isDark ? "text-[#666666]" : "text-[#999]"}`}>
            Page {startIndex + 1} to {Math.min(startIndex + itemsPerPage, items.length)}
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setCurrentPage(safePage - 1)}
              disabled={safePage === 1}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${
                isDark ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10" : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"
              }`}
            >
              Previous
            </button>
            <div className="flex gap-1">
              {paginationItems.map((page, index) =>
                page === "..." ? (
                  <span key={`dots-${index}`} className={`px-2 py-1 text-xs ${isDark ? "text-white/30" : "text-[#999]"}`}>
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${
                      safePage === page
                        ? isDark
                          ? "bg-[#E5D5B8] text-black"
                          : "bg-[#E8D1AB] text-black"
                        : isDark
                        ? "text-white/60 hover:bg-white/5"
                        : "text-[#666] hover:bg-zinc-100"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
            <button
              onClick={() => setCurrentPage(safePage + 1)}
              disabled={safePage === totalPages}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${
                isDark ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10" : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
