"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  CircleAlert,
  Loader2,
  MoreVertical,
  Pencil,
  Search,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PayoutStatus = "Completed" | "Pending" | "Rejected";

const PayoutStatusBadge = ({
  status,
  mobile,
}: {
  status: PayoutStatus;
  mobile?: boolean;
}) => {
  const styles = {
    Completed: "bg-[#D4FFE4] text-[#16A34A] border-[#D4FFE4]/20",
    Pending: "bg-[#FFF4C9] text-[#BA6605] border-[#FFF4C9]/20",
    Rejected: "bg-[#FEF3F2] text-[#B42318] border-[#FEF3F2]/20",
  };

  const padding = mobile ? "px-4 py-1 text-xs" : "px-5 py-2 text-sm";

  return (
    <span className={`${padding} rounded-full font-medium border ${styles[status]}`}>
      {status}
    </span>
  );
};

export type PayoutHistoryRow = {
  id: string;
  shootId: string;
  creatorName: string;
  date: string;
  serviceType: string;
  netPayout: string;
  paymentMethod: string;
  status: PayoutStatus;
  initials: string;
  avatarColor: string;
  avatarImage?: string;
  invoiceIds?: string[];
  breakdown?: {
    earnings: string;
    fee: string;
    net: string;
  };
};

interface PayoutHistoryTableProps {
  rows: PayoutHistoryRow[];
  loading?: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusValue: string;
  onStatusChange: (value: string) => void;
  monthValue: string;
  onMonthChange: (value: string) => void;
  typeValue: string;
  onTypeChange: (value: string) => void;
  itemsPerPage?: number;
}

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

export default function PayoutHistoryTable({
  rows,
  loading = false,
  searchValue,
  onSearchChange,
  statusValue,
  onStatusChange,
  monthValue,
  onMonthChange,
  typeValue,
  onTypeChange,
  itemsPerPage = 7,
}: PayoutHistoryTableProps) {
  const {isDark} =useResolvedTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(rows[0]?.id ?? null);

  useEffect(() => {
    setCurrentPage(1);
  }, [rows, statusValue, monthValue, typeValue, searchValue]);

  const totalPages = Math.max(1, Math.ceil(rows.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const visibleRows = useMemo(
    () => rows.slice(startIndex, startIndex + itemsPerPage),
    [rows, startIndex, itemsPerPage]
  );

  const paginationItems = buildPaginationItems(safePage, totalPages);

  const toggleRow = (id: string) => {
    setExpandedRowId((current) => (current === id ? null : id));
  };

  const DetailPanelContent = ({ row, isDark }: { row: PayoutHistoryRow; isDark: boolean }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className={`rounded-lg border p-5 ${isDark ? "border-[#262626] bg-[#141414]" : "border-[#E5E5E5] bg-white"}`}>
        <h4 className={`text-sm lg:text-base font-medium mb-4 ${isDark ? "text-white" : "text-[#171717]"}`}>
          Payout Breakdown
        </h4>
        <div className="space-y-3 lg:space-y-4">
          <div className="flex justify-between text-sm lg:text-base">
            <span className={isDark ? "text-[#A0A0A0]" : "text-[#676767]"}>
              Service Earnings
            </span>
            <span className={isDark ? "text-white" : "text-[#171717]"}>
              {row.breakdown?.earnings}
            </span>
          </div>
          <div className="flex justify-between text-sm lg:text-base">
            <span className={isDark ? "text-[#A0A0A0]" : "text-[#676767]"}>
              Platform Fee (12%)
            </span>
            <span className={isDark ? "text-white" : "text-[#171717]"}>
              {row.breakdown?.fee}
            </span>
          </div>
          <div className={`border-t pt-4 flex justify-between text-sm lg:text-base ${isDark ? "border-[#2A2A2A]" : "border-[#E5E5E5]"}`}>
            <span className={isDark ? "text-white" : "text-[#171717]"}>Net Payout</span>
            <span className="text-[#00C48C] font-semibold text-base lg:text-lg ">{row.breakdown?.net}</span>
          </div>
        </div>
      </div>

      <div className={`rounded-lg border p-5 ${isDark ? "border-[#262626] bg-[#141414]" : "border-[#E5E5E5] bg-white"}`}>
        <h4 className={`text-sm lg:text-base font-medium mb-4 ${isDark ? "text-white" : "text-[#171717]"}`}>
          Linked Invoices
        </h4>
        <div className="space-y-3">
          {row.invoiceIds?.map((invoiceId) => (
            <div
              key={invoiceId}
              className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm ${isDark ? "bg-[#202020] text-white/80" : "bg-[#F7F7F7] text-[#171717]"}`}
            >
              <span>{invoiceId}</span>
              <ChevronRight size={18} className={isDark ? "text-white/50" : "text-[#676767]"} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDetailPanel = (row: PayoutHistoryRow) => (
    <tr key={`${row.id}-details`}>
      <td colSpan={7} className={`px-5 py-6 ${isDark ? "bg-[#0A0A0A]":"bg-[#F4F5F7]"}`}>
        <DetailPanelContent row={row} isDark={isDark} />
      </td>
    </tr>
  );

  return (
    <section className={`w-full rounded-2xl border overflow-visible transition-all duration-300 ${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5]"}`}>
      <div className={`flex flex-col gap-4 p-5 lg:p-6 border-b ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-[3px] h-6 bg-[#E5D5B8]" />
            <h3 className={isDark ? "text-white text-lg" : "text-[#323232] text-lg"}>
              Payout History
            </h3>
          </div>

          <div className="flex gap-2">
            <Select value={statusValue} onValueChange={onStatusChange}>
              <SelectTrigger className={`w-[110px] rounded-full h-8 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"}`}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-[#111111] border-[#3D3D3D]" : "text-black bg-white border-[#E3E3E3]"}>
                <SelectItem value="All">Status</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
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
                <SelectItem value="Stripe">Stripe</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative w-full">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#666]" : "text-[#999]"}`} size={18} />
          <input
            type="text"
            placeholder="Search by Shoot ID and Creator Name...."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full border rounded-lg h-10 pl-10 pr-4 text-sm focus:outline-none transition-colors ${isDark
              ? "bg-[#202020] border-[#FFFFFF33] text-white focus:border-[#E8D1AB]"
              : "bg-white border-[#E5E5E5] text-black focus:border-[#E8D1AB]"
              }`}
          />
        </div>
      </div>

      {/* ========================================== */}
      {/* DESKTOP VIEW TABLE LAYOUT (Your shared code) */}
      {/* ========================================== */}
      <div className="hidden lg:block w-full overflow-hidden">
        <table className="w-full text-left table-fixed border-collapse">
          <thead>
            <tr className={`text-sm font-medium border-b ${isDark ? "text-[#E8D1AB] border-[#333333]" : "text-[#000000] border-[#E5E5E5] bg-[#FFFCF6]"}`}>
              <th className="py-5 px-4 font-medium w-[12%] truncate">Shoot ID</th>
              <th className="py-5 px-4 font-medium w-[20%] truncate">Creator Name</th>
              <th className="py-5 px-4 font-medium w-[14%] truncate">Service Type</th>
              <th className="py-5 px-4 font-medium w-[10%] truncate">Net Payout</th>
              <th className="py-5 px-4 font-medium w-[13%] truncate">Payment Method</th>
              <th className="py-5 px-4 font-medium w-[10%] truncate">Status</th>
              <th className="py-5 px-4 font-medium w-[20%] text-right truncate">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="h-[360px] text-center align-middle">
                  <div className="flex h-full min-h-[360px] items-center justify-center">
                    <Loader2 className="animate-spin text-[#E8D1AB]" size={32} />
                  </div>
                </td>
              </tr>
            ) : visibleRows.length > 0 ? (
              visibleRows.flatMap((row) => {
                const isExpanded = expandedRowId === row.id;
                const showApprove = row.status === "Pending";
                const showAlert = row.status === "Rejected";

                return [
                  <tr
                    key={row.id}
                    onClick={() => toggleRow(row.id)}
                    className={`border-b transition-colors cursor-pointer ${isDark ? "border-[#222222] hover:bg-white/[0.02]" : "border-[#F5F5F5] hover:bg-zinc-50"}`}
                  >
                    <td className={`p-5 truncate ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>
                      <div className="flex items-center gap-3 truncate">
                        <ChevronDown
                          size={24}
                          className={`transition-transform shrink-0 ${isExpanded ? "rotate-0" : "-rotate-90"} ${isDark ? "text-white/70" : "text-[#666]"}`}
                        />
                        <span className="truncate">{row.shootId}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-3 truncate">
                        <div
                          className="relative w-13 h-13 shrink-0 rounded-xl overflow-hidden flex items-center justify-center text-black font-medium text-xl"
                          style={{ backgroundColor: row.avatarColor }}
                        >
                          {row.avatarImage ? (
                            <Image src={row.avatarImage} alt={row.creatorName} fill className="object-cover" />
                          ) : (
                            row.initials
                          )}
                        </div>
                        <div className="truncate">
                          <p className={`truncate font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>
                            {row.creatorName}
                          </p>
                          <p className={`truncate ${isDark ? "text-white/40" : "text-[#666]"}`}>
                            {row.date}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={`p-5 truncate ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>
                      {row.serviceType}
                    </td>
                    <td className={`p-5 truncate ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>
                      {row.netPayout}
                    </td>
                    <td className={`p-5 truncate ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>
                      {row.paymentMethod}
                    </td>
                    <td className="p-5 whitespace-nowrap">
                      <PayoutStatusBadge status={row.status} />
                    </td>
                    <td className="p-5">
                      <div className="flex min-h-[40px] items-center justify-end gap-3">
                        {showApprove && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="px-4 py-2 rounded-lg bg-[#EBFFF0] text-[#16A34A] text-xs font-medium shrink-0"
                            >
                              Approve
                            </button>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="text-[#F98A84] text-xs font-medium underline underline-offset-2 shrink-0"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                        {!showApprove && !showAlert && (
                          <button onClick={(e) => e.stopPropagation()} className={`shrink-0 ${isDark ? "text-white" : "text-[#171717]"}`}>
                            <Pencil size={30} />
                          </button>
                        )}
                        {showAlert && (
                          <button onClick={(e) => e.stopPropagation()} className={`shrink-0 ${isDark ? "text-white" : "text-[#171717]"}`}>
                            <CircleAlert size={30} />
                          </button>
                        )}
                        <button type="button" onClick={(e) => e.stopPropagation()} className={`shrink-0 ${isDark ? "text-white" : "text-[#171717]"}`}>
                          <MoreVertical size={30} />
                        </button>
                      </div>
                    </td>
                  </tr>,
                  ...(isExpanded ? [renderDetailPanel(row)] : []),
                ];
              })
            ) : (
              <tr>
                <td colSpan={7} className={`py-10 text-center ${isDark ? "text-white/50" : "text-[#777]"}`}>
                  No payout history found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================================= */}
      {/* NEW MOBILE RESPONSIVE CARD DRAWER LAYOUT (Visible below lg break)         */}
      {/* ========================================================================= */}
      <div className="block lg:hidden">
        {loading ? (
          <div className="h-[200px] flex items-center justify-center">
            <Loader2 className="animate-spin text-[#E8D1AB]" size={32} />
          </div>
        ) : visibleRows.length > 0 ? (
          visibleRows.map((row) => {
            const isExpanded = expandedRowId === row.id;
            return (
              <div
                key={row.id}
                className={`transition-all duration-200 overflow-hidden ${isDark ? "bg-[#171717]" : "bg-white shadow-xs"}`}
              >
                <div
                  onClick={() => toggleRow(row.id)}
                  className="flex items-center justify-between p-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {/* Circle Rotation Trigger Indicator Wrapper */}
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${isDark ? "border-white/20 text-white/80" : "border-black/20 text-black/80"}`}>
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${isExpanded ? "rotate-0" : "-rotate-180"}`}
                      />
                    </div>

                    {/* Initials/Avatar Container Block */}
                    <div
                      className="w-6 h-6 rounded-sm flex items-center justify-center text-black font-semibold text-[10px] shrink-0"
                      style={{ backgroundColor: row.avatarColor }}
                    >
                      {row.avatarImage ? (
                        <div className="relative w-full h-full rounded-sm overflow-hidden">
                          <Image src={row.avatarImage} alt={row.creatorName} fill className="object-cover" />
                        </div>
                      ) : (
                        row.initials
                      )}
                    </div>

                    {/* Metadata Content Stack Labels */}
                    <div>
                      <p className={`text-sm leading-tight ${isDark ? "text-white" : "text-black"}`}>
                        {row.creatorName}
                      </p>
                      <p className={`text-xs mt-0.5 ${isDark ? "text-white/50" : "text-black/50"}`}>
                        {row.date}
                      </p>
                    </div>
                  </div>

                  {/* Right Status Badge Integration Segment */}
                  <PayoutStatusBadge status={row.status} mobile={true} />
                </div>

                {/* Expanded Grid Configuration Panel (Image 2 Representation) */}
                {isExpanded && (
                  <div className={`space-y-4`}>
                    {/* Primary Grid Properties Matrix */}
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm pl-14 pr-4 ">
                      <div>
                        <p className={`text-xs font-medium  ${isDark ? "text-white" : "text-black/40"}`}>Shoot ID</p>
                        <p className={`mt-1 ${isDark ? "text-[#A1A1A1]" : "text-black/90"}`}>{row.shootId}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black/40"}`}>Service Type</p>
                        <p className={`mt-1 ${isDark ? "text-[#A1A1A1]" : "text-black/90"}`}>{row.serviceType}</p>
                      </div>
                      <div>
                        <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black/40"}`}>Payment Method</p>
                        <p className={`mt-1 ${isDark ? "text-[#A1A1A1]" : "text-black/90"}`}>{row.paymentMethod}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black/40"}`}>Net Payout</p>
                        <p className={`mt-1 ${isDark ? "text-[#A1A1A1]" : "text-black/90"}`}>{row.netPayout}</p>
                      </div>
                    </div>

                    {/* Quick Inline Trigger Action Controls row */}
                    <div className="flex items-center justify-between pl-14 pr-4 pt-1">
                      <span className={`text-xs font-medium ${isDark ? "text-white" : "text-black/40"}`}>Actions</span>
                      <div className="flex items-center gap-2">
                        {row.status === "Pending" && (
                          <>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="text-[#FF8B7D] text-xs font-medium px-1"
                            >
                              Decline
                            </button>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="px-2.5 py-1.5 rounded-md bg-[#DCF7E8] text-[#179B57] text-xs font-medium"
                            >
                              Approve
                            </button>
                          </>
                        )}
                        <>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className={`p-1 ${isDark ? "text-white hover:text-white/70" : "text-black/70 hover:text-black"}`}
                          >
                            <Pencil size={20} />
                          </button>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className={`p-1 ${isDark ? "text-white hover:text-white/70" : "text-black/70 hover:text-black"}`}
                          >
                            <MoreVertical size={24} />
                          </button>
                        </>
                      </div>
                    </div>

                    {/* Sub-Panel Layout Extension Element Hook */}
                    <div className={`p-5 ${isDark ? "bg-[#0A0A0A]" : "bg-[#F4F5F7]"}`}>
                      <DetailPanelContent row={row} isDark={isDark} />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className={`py-8 text-center text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>
            No payout history found.
          </div>
        )}
      </div>

      {!loading && rows.length > 0 && (
        <div className={`flex justify-center lg:justify-between items-center p-6 border-t transition-colors duration-300 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
          <div className={`hidden lg:block text-sm ${isDark ? "text-[#666666]" : "text-[#999]"}`}>
            Page {startIndex + 1} to {Math.min(startIndex + itemsPerPage, rows.length)}
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setCurrentPage(safePage - 1)}
              disabled={safePage === 1}
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
                    onClick={() => setCurrentPage(page)}
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
              onClick={() => setCurrentPage(safePage + 1)}
              disabled={safePage === totalPages}
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
