"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, FileText, Loader2, Search } from "lucide-react";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,TooltipPortal  } from "@radix-ui/react-tooltip";

export type DisputeStatus = "Open" | "In Review" | "Resolved" | "Rejected" | "Escalated";

export type DisputeHistoryItem = {
  disputeId?: number | string;
  rawStatus?: string;
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
  currentPage?: number;
  totalItems?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onViewDetails?: (item: DisputeHistoryItem) => void;
  itemsPerPage?: number;
}

export const disputeStatusStyles: Record<DisputeStatus, string> = {
  Open: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
  "In Review": "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20",
  Resolved: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20",
  Rejected: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20",
  Escalated: "bg-[#A855F7]/10 text-[#A855F7] border-[#A855F7]/20",
};

const isClosedDisputeStatus = (status: DisputeStatus) =>
  status === "Resolved" || status === "Rejected";

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

const TruncatedDescription = ({ text, isDark }: { text: string; isDark: boolean }) => {
  const [isTruncated, setIsTruncated] = React.useState(false);
  const textRef = React.useRef<HTMLParagraphElement>(null);

  React.useEffect(() => {
    const element = textRef.current;
    if (element) {
      setIsTruncated(element.scrollHeight > element.clientHeight);
    }
  }, [text]);

  const content = (
    <p ref={textRef} className={`text-sm lg:text-base line-clamp-2 ${isDark ? "text-white" : "text-[#171717]"}`}>
      {text}
    </p>
  );

  if (!isTruncated) return content;

 return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-pointer">{content}</div>
        </TooltipTrigger>
        
        <TooltipPortal>
          <TooltipContent 
            side="bottom" 
            align="start" 
            sideOffset={8}
            className={`z-50 w-[calc(100vw-40px)] lg:max-w-[1000px] p-4 text-sm shadow-2xl border rounded-lg break-words whitespace-normal ${
              isDark ? "bg-[#1A1A1A] border-[#333] text-white" : "bg-white border-gray-200 text-black"
            }`}
          >
            {text}
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </TooltipProvider>
  );
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
  currentPage: controlledPage,
  totalItems: controlledTotalItems,
  totalPages: controlledTotalPages,
  onPageChange,
  onViewDetails,
  itemsPerPage = 3,
}: DisputeHistoryListProps) {
  const { isDark } = useResolvedTheme();
  const [internalPage, setInternalPage] = useState(1);
  const isControlledPagination =
    typeof controlledPage === "number" && typeof onPageChange === "function";

  useEffect(() => {
    if (!isControlledPagination) setInternalPage(1);
  }, [isControlledPagination, items, searchValue, statusValue, monthValue, typeValue]);

  const resolvedTotalItems = Math.max(0, controlledTotalItems ?? items.length);
  const resolvedTotalPages = Math.max(
    1,
    controlledTotalPages ?? Math.ceil(resolvedTotalItems / itemsPerPage)
  );
  const requestedPage = isControlledPagination ? controlledPage : internalPage;
  const safePage = Math.min(Math.max(requestedPage ?? 1, 1), resolvedTotalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const visibleItems = useMemo(
    () =>
      isControlledPagination
        ? items
        : items.slice(startIndex, startIndex + itemsPerPage),
    [isControlledPagination, items, startIndex, itemsPerPage]
  );
  const endIndex = Math.min(startIndex + visibleItems.length, resolvedTotalItems);
  const paginationItems = buildPaginationItems(safePage, resolvedTotalPages);

  const changePage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), resolvedTotalPages);
    if (isControlledPagination) {
      onPageChange?.(nextPage);
      return;
    }
    setInternalPage(nextPage);
  };

  return (
    <section
      className={`w-full rounded-2xl border overflow-visible transition-all duration-300 ${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5]"}`}
    >
      <div className={`flex flex-col gap-4 p-5 lg:p-6 border-b ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-[3px] h-6 bg-[#E5D5B8]" />
            <h3 className={isDark ? "text-white text-lg" : "text-[#323232] text-lg"}>
              Dispute History
            </h3>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Select value={statusValue} onValueChange={onStatusChange}>
              <SelectTrigger className={`w-[110px] rounded-full h-8 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"}`}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-[#111111] border-[#3D3D3D]" : "text-black bg-white border-[#E3E3E3]"}>
                <SelectItem value="All">Status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Review">In Review</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={monthValue} onValueChange={onMonthChange}>
              <SelectTrigger className={`w-[110px] rounded-full h-8 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"}`}>
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
              <SelectTrigger className={`w-[90px] rounded-full h-8 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"}`}>
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
            className={`w-full border rounded-lg h-10 pl-10 pr-4 text-sm focus:outline-none transition-colors ${isDark
              ? "bg-zinc-900 border-[#333333] text-white focus:border-[#E8D1AB]"
              : "bg-white border-[#E5E5E5] text-black focus:border-[#E8D1AB]"
              }`}
          />
        </div>
      </div>

      <div className="p-5 lg:p-6 space-y-4">
        {loading ? (
          <div className="h-[200px] flex items-center justify-center">
            <Loader2 className="animate-spin text-[#E8D1AB]" size={32} />
          </div>
        ) : visibleItems.length > 0 ? (
          visibleItems.map((item) => {
            const isClosed = isClosedDisputeStatus(item.status);
            return (
              <article
                key={item.id}
                className={`rounded-2xl border p-0 lg:p-6 transition-colors duration-200 ${isDark
                  ? isClosed
                    ? "border-[#333333] bg-[#0D0D0D] hover:border-[#444444] hover:bg-[#111111]"
                    : "border-[#E8D1AB] bg-[#0D0D0D] hover:border-[#E8D1AB]/80 hover:bg-[#0D0D0D]/80"
                  : isClosed
                    ? "border-[#E5E5E5] bg-white hover:border-[#D1D1D1] hover:bg-[#FAFAFA]"
                    : "border-[#E5D5B8] bg-[#FFFCF7] hover:border-[#D7C199] hover:bg-[#FFF8EF]"
                  }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between lg:gap-6">
                  <div className="p-4 lg:p-0 space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className={`lg:text-lg font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>
                        {item.id}
                      </h4>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${disputeStatusStyles[item.status]}`}>
                        {item.status}
                      </span>
                    </div>

                    <div className={`flex flex-wrap items-center gap-3 text-xs lg:text-sm  ${isDark ? "text-[#A0A0A0]" : "text-[#676767]"}`}>
                      <span className={`flex items-center gap-2 ${isDark ? "text-[#E8D1AB]" : "text-[#E5D5B8]"}`}>
                        <FileText size={16} />
                        {item.shootId}
                      </span>
                      {/* <span className={isDark ? "text-white/20" : "text-[#999]"}>&bull;</span> */}
                      <span className={`flex items-center gap-2 `}>
                        <FileText size={16} />
                        {item.invoiceId}
                      </span>
                      <span className={isDark ? "text-white/20" : "text-[#999]"}>&bull;</span>
                      <span>{item.category}</span>
                    </div>

                    <TruncatedDescription text={item.description} isDark={isDark} />
                  </div>

                  <hr className={`lg:hidden border-t my-0 ${isDark ? "border-[#262626]" : "border-[#000000]/30"}`} />

                  <div className="p-4 lg:p-0 shrink-0 lg:text-right lg:min-w-[180px]">
                    <div className="flex justify-between lg:hidden text-[#F59E0B] text-xs lg:text-sm">
                      <span> Payout Hold:</span> <span>{item.payoutHold}</span>
                    </div>

                    <div className="flex flex-row-reverse justify-between items-center lg:block">
                      <p className="text-[#F98A84] text-lg font-semibold">{item.disputedAmount}</p>
                      <p className={`mt-1 text-xs lg:text-sm ${isDark ? "text-[#A0A0A0]" : "text-[#676767]"}`}>
                        Disputed Amount
                      </p>

                    </div>
                    <p className="hidden lg:block mt-3 text-[#F59E0B] text-xs lg:text-sm">Payout Hold: {item.payoutHold}</p>
                  </div>
                </div>

                <hr className={`border-t my-0 lg:mt-5 lg:my-4 ${isDark ? "border-[#262626]" : "border-[#000000]/30"}`} />

                <div className={`p-4 lg:p-0 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 `}>
                  <div className={`flex gap-2 text-xs lg:text-sm ${isDark ? "text-[#A0A0A0]" : "text-[#676767]"}`}>
                    <p>Raised by: <span className={isDark ? "text-white" : "text-[#171717]"}>{item.raisedBy}</span> ({item.raisedRole}){" "}</p>
                    <span className={isDark ? "text-white/20" : "text-[#999]"}>&bull;</span>
                    <span>{item.raisedDate}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onViewDetails?.(item)}
                    className="inline-flex items-center gap-2 text-[#E8D1AB] text-sm lg:text-base font-medium"
                  >
                    View Details <ArrowRight size={16} />
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <div className={`py-8 text-center text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>
            No disputes found.
          </div>
        )}
      </div>

      {!loading && resolvedTotalItems > 0 && (
        <div className={`flex justify-center lg:justify-between items-center p-6 border-t transition-colors duration-300 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
          <div className={`hidden lg:block text-sm ${isDark ? "text-[#666666]" : "text-[#999]"}`}>
            Showing {startIndex + 1} to {endIndex} of {resolvedTotalItems}
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => changePage(safePage - 1)}
              disabled={loading || safePage === 1}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${isDark ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10" : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"
                }`}
            >
              <span className="hidden lg:block">Previous</span>
              <ChevronLeft size={24} className="block lg:hidden" />
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
                    onClick={() => changePage(page)}
                    className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${safePage === page
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
              onClick={() => changePage(safePage + 1)}
              disabled={loading || safePage === resolvedTotalPages}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${isDark ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10" : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"}`}
            >
              <span className="hidden lg:block">Next</span>
              <ChevronRight size={24} className="block lg:hidden" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}