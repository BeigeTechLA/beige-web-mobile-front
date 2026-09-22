"use client";

import React, { useState } from "react";
import {
  ArrowUpRight,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

type QuoteOverdueItem = {
  id: string;
  clientName: string;
  quoteNo: string;
  email: string;
  project: string;
  bookingStatus: "Converted to Booking" | "Pending";
  amount: string;
  paidAmount?: string;
  pendingAmount?: string;
  quoteStatus: "Sent" | "Accepted" | "Partially Paid";
  validity: string;
  salesRep: string;
  avatarBg: string;
  avatarText: string;
};

const DUMMY_OVERDUE_QUOTES: QuoteOverdueItem[] = [
  {
    id: "1",
    clientName: "Ethan Carter",
    quoteNo: "QT-01",
    email: "ethan155@gmail.com",
    project: "Corporate video pro....",
    bookingStatus: "Converted to Booking",
    amount: "$13,475.70",
    paidAmount: "$10,475.70",
    pendingAmount: "$3000.00",
    quoteStatus: "Sent",
    validity: "April 15, 2026",
    salesRep: "John Smith",
    avatarBg: "bg-[#FFF4D3]",
    avatarText: "text-black",
  },
  {
    id: "2",
    clientName: "Rami Guzman",
    quoteNo: "QT-02",
    email: "rami142@gmail.com",
    project: "Product launch....",
    bookingStatus: "Pending",
    amount: "$5000.00",
    pendingAmount: "$5000.00",
    quoteStatus: "Accepted",
    validity: "April 15, 2026",
    salesRep: "Sarah Johnson",
    avatarBg: "bg-[#D6E0FF]",
    avatarText: "text-black",
  },
  {
    id: "3",
    clientName: "John Lee",
    quoteNo: "QT-03",
    email: "john@gmail.com",
    project: "Commercial shoot....",
    bookingStatus: "Pending",
    amount: "$2000.00",
    paidAmount: "$2000.00",
    quoteStatus: "Accepted",
    validity: "April 15, 2026",
    salesRep: "Michael Chen",
    avatarBg: "bg-[#E2F0D9]",
    avatarText: "text-black",
  },
  {
    id: "4",
    clientName: "Kevin Brooks",
    quoteNo: "QT-04",
    email: "brookkevin@gmail.com",
    project: "Animated video",
    bookingStatus: "Converted to Booking",
    amount: "$1,400.00",
    paidAmount: "$700.00",
    pendingAmount: "$700.00",
    quoteStatus: "Accepted",
    validity: "April 15, 2026",
    salesRep: "Emily Rodriguez",
    avatarBg: "bg-[#D9F2E6]",
    avatarText: "text-black",
  },
  {
    id: "5",
    clientName: "Lisa Anderson",
    quoteNo: "QT-05",
    email: "ethancole@gmail.com",
    project: "Social Media Photo....",
    bookingStatus: "Pending",
    amount: "$5000.00",
    pendingAmount: "$5000.00",
    quoteStatus: "Sent",
    validity: "April 15, 2026",
    salesRep: "John Smith",
    avatarBg: "bg-[#F7D6E0]",
    avatarText: "text-black",
  },
  {
    id: "6",
    clientName: "Sukuna Cole",
    quoteNo: "QT-06",
    email: "sukuna@gmail.com",
    project: "Corporate video pro....",
    bookingStatus: "Converted to Booking",
    amount: "$2000.00",
    paidAmount: "$2000.00",
    quoteStatus: "Sent",
    validity: "April 15, 2026",
    salesRep: "Sarah Johnson",
    avatarBg: "bg-[#F3D3BD]",
    avatarText: "text-black",
  },
];

type PaginationItem = number | "...";

const buildPaginationItems = (
  currentPage: number,
  totalPages: number
): PaginationItem[] => {
  if (totalPages <= 1) return [1];
  const items: PaginationItem[] = [];
  const delta = 1;
  const left = Math.max(2, currentPage - delta);
  const right = Math.min(totalPages - 1, currentPage + delta);

  items.push(1);
  if (left > 2) items.push("...");
  for (let page = left; page <= right; page += 1) items.push(page);
  if (right < totalPages - 1) items.push("...");
  if (totalPages > 1) items.push(totalPages);

  return items;
};

export default function QuotesOverdueWidget({
  isDark = true,
}: {
  isDark?: boolean;
}) {
  const [showTable, setShowTable] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const totalPages = 10;
  const paginationItems = buildPaginationItems(page, totalPages);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderBookingStatus = (status: "Converted to Booking" | "Pending") => {
    if (status === "Converted to Booking") {
      return (
        <span className="inline-flex items-center justify-center px-3 py-1 lg:px-5 lg:py-3 rounded-full text-xs lg:text-sm font-medium bg-[#D4FFE4] text-[#16A34A]">
          Converted to Booking
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center px-3 py-1 lg:px-5 lg:py-3 rounded-full text-xs lg:text-sm font-medium bg-[#FFF0CF] text-[#C06D24]">
        Pending
      </span>
    );
  };

  const renderQuoteStatus = (status: "Sent" | "Accepted" | "Partially Paid") => {
    if (status === "Sent") {
      return (
        <span className="inline-flex items-center justify-center px-3 py-1 lg:px-5 lg:py-3 rounded-full text-xs lg:text-sm font-medium bg-[#AAD0FF] text-[#0C52A8]">
          Sent
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center px-3 py-1 lg:px-5 lg:py-3 rounded-full text-xs lg:text-sm font-medium bg-[#D4FFE4] text-[#16A34A]">
        Accepted
      </span>
    );
  };

  return (
    <div
      className={`w-full overflow-hidden rounded-lg lg:rounded-2xl border transition-all duration-300 ${isDark ? "border-white/10 bg-[#141414]" : "border-[#E5E5E5] bg-white"}`}
    >
      {/* Top Banner Widget */}
      <div className="p-5 lg:p-6 relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Summary Box */}
          <div className="flex lg:flex-col items-start lg:items-center justify-between min-w-[160px]">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-7 w-[3px] bg-[#E8D1AB] rounded-full inline-block" />
                <span className={`text-base ${isDark ? "text-white" : "text-black"}`}>
                  Quotes Overdue
                </span>
              </div>
              <div className={`text-3xl lg:text-4xl font-bold mt-2 capitalize ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>
                14
              </div>
              <p className={`text-base mt-1 ${isDark ? "text-white/40" : "text-black/40"}`}>
                Need Follow-Up
              </p>
            </div>

            {/* Toggle Table Trigger Button */}
            <button
              type="button"
              onClick={() => setShowTable((prev) => !prev)}
              className={`lg:mt-6 w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-105 ${isDark
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-black/10 text-black hover:bg-black/20"
                }`}
              title={showTable ? "Hide details table" : "Show details table"}
            >
              <ArrowUpRight
                size={18}
                className={`transition-transform duration-300 ${showTable ? "rotate-180" : ""
                  }`}
              />
            </button>
          </div>

          {/* Right Pipeline Breakdown Card */}
          <div className={`flex-1 rounded-xl p-5 ${isDark? "bg-[#101010]": "bg-zinc-50"}`}>
            <p className={`text-base mb-3 ${isDark ? "text-white/60" : "text-black/60"}`}>
              Pipeline At Risk
            </p>

            {/* Mobile Vertical Layout */}
            <div className="flex flex-col gap-4 lg:hidden">
              {/* Sent Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-sm uppercase text-[#B2E1F5] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B2E1F5]" />
                  <span>SENT - 6 QUOTES</span>
                </div>
                <div className="h-14 w-full rounded-lg bg-[linear-gradient(189deg,#B2E1F5_8.02%,#137FAD_83.16%)] flex items-center justify-center text-black font-semibold text-base">
                  $1.6M
                </div>
              </div>

              {/* Accepted Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-sm uppercase text-[#51DB6B] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#51DB6B]" />
                  <span>ACCEPTED - 5 QUOTES</span>
                </div>
                <div className="h-14 w-[80%] rounded-lg bg-[linear-gradient(189deg,#D9FFDC_8.02%,#63B868_83.16%)] flex items-center justify-center text-black font-semibold text-base">
                  $1.3M
                </div>
              </div>

              {/* Partially Paid Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-sm uppercase text-[#D9C555] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D9C555]" />
                  <span>PARTIALLY PAID - 3 QUOTES</span>
                </div>
                <div className="h-14 w-[60%] rounded-lg bg-[linear-gradient(189deg,#FFF7D9_8.02%,#D0BB6B_83.16%)] flex items-center justify-center text-black font-semibold text-base">
                  $0.9M
                </div>
              </div>
            </div>

            {/* Desktop Horizontal Layout */}
            <div className="hidden lg:block">
            {/* Category Status Labels */}
              <div className="flex w-full gap-2 mb-3 text-base uppercase">
              <div className="w-[42%] flex items-center gap-1.5 text-[#B2E1F5]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B2E1F5]" />
                <span>SENT - 6 QUOTES</span>
              </div>
              <div className="w-[34%] flex items-center gap-1.5 text-[#51DB6B]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#51DB6B]" />
                <span>ACCEPTED - 5 QUOTES</span>
              </div>
              <div className="w-[24%] flex items-center gap-1.5 text-[#D9C555]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D9C555]" />
                <span>PARTIALLY PAID - 3 QUOTES</span>
              </div>
            </div>

            {/* Horizontal Segment Bar */}
              <div className="h-14 w-full rounded-xl overflow-hidden flex shadow-inner text-black font-semibold text-xl">
              <div className="w-[42%] bg-[linear-gradient(189deg,#B2E1F5_8.02%,#137FAD_83.16%)] flex items-center justify-center">
                $1.6M
              </div>
              <div className="w-[34%] bg-[linear-gradient(189deg,#D9FFDC_8.02%,#63B868_83.16%)] flex items-center justify-center">
                $1.3M
              </div>
              <div className="w-[24%] bg-[linear-gradient(189deg,#FFF7D9_8.02%,#D0BB6B_83.16%)] flex items-center justify-center">
                $0.9M
                </div>
              </div>
            </div>

            {/* Total Divider */}
            <div className="relative mt-5 pt-1 text-center">
              <div className={`absolute inset-0 flex items-center ${isDark ? "border-white/10" : "border-black/10"}`}>
                <div className={`w-full border-t ${isDark ? "border-white/10" : "border-black/10"}`}/>
              </div>
              <span
                className={`relative px-3 text-xl font-semibold ${isDark
                  ? "bg-[#101010] text-[#E8D1AB]"
                  : "bg-zinc-50 text-black"
                  }`}
              >
                Total $3.8M
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Expandable Table Section */}
      {showTable && (
        <div
          className={`border-t transition-all ${isDark ? "border-[#3D3D3D] bg-[#101010]" : "border-black/10 bg-white"}`}
        >
          <div className="w-full overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr
                  className={`hidden rounded-b-lg border-b text-sm font-medium capitalize md:table-row ${
                    isDark
                      ? "border-[#3D3D3D] bg-[#101010] text-[#E8D1AB]"
                      : "border-[#E5E5E5] bg-[#FFFCF6] text-black"
                    }`}
                >
                  <th className="px-5 py-4 w-[22%]">Client Name & Quote No</th>
                  <th className="p-4 w-[15%]">Project</th>
                  <th className="p-4 w-[15%]">Booking Status</th>
                  <th className="p-4 w-[12%]">Amount</th>
                  <th className="p-4 w-[10%]">Quote Status</th>
                  <th className="p-4 w-[13%]">Validity</th>
                  <th className="p-4 w-[10%]">Sales Rep</th>
                  <th className="p-4 text-center w-[8%]">Action</th>
                </tr>

                {/* Mobile Headers */}
                <tr
                  className={`border-b text-sm font-medium md:hidden ${
                    isDark
                      ? "border-[#3D3D3D] bg-[#101010] text-[#E8D1AB]"
                      : "border-[#E5E5E5] bg-[#FFFCF6] text-black"
                  }`}
                >
                  <th className="px-4 py-3 text-left">Client Name</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap w-auto">
                    Quote Status
                  </th>
                </tr>
              </thead>

              <tbody className="text-sm lg:text-base">
                {DUMMY_OVERDUE_QUOTES.map((item) => {
                  const isExpanded = expandedRowId === item.id;

                  return (
                    <React.Fragment key={item.id}>
                      {/* Main Row */}
                      <tr
                        onClick={() => {
                          if (window.innerWidth < 768) {
                            setExpandedRowId(isExpanded ? null : item.id);
                          }
                        }}
                        className={`transition-colors cursor-pointer ${
                          isDark
                            ? "bg-[#171717] hover:bg-white/[0.02] text-white border-white/10"
                            : "bg-black/10 hover:bg-black/[0.02] text-black border-black/10"
                        } ${
                          isExpanded
                            ? isDark
                              ? "bg-[#202020] border-none"
                              : "bg-[#F9F9F9] border-none"
                            : ""
                          }`}
                      >
                        {/* Client Name & Avatar + Chevron on Mobile */}
                        <td className="px-4 py-3 md:px-5 md:py-4">
                          <div className="flex items-center gap-2.5 md:gap-3">
                            {/* Mobile Chevron */}
                            <div
                              className={`shrink-0 md:hidden border rounded-full w-6 h-6 flex items-center justify-center transition-colors pointer-events-auto ${
                                isExpanded
                                  ? isDark
                                    ? "border-[#E8D1AB] text-[#E8D1AB]"
                                    : "border-black text-black"
                                  : isDark
                                  ? "border-white/20 text-white/60"
                                  : "border-black/20 text-black/60"
                              }`}
                            >
                              {isExpanded ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              )}
                            </div>

                            {/* Avatar */}
                            <div
                              className={`w-8 h-8 lg:h-12 lg:w-12 rounded-lg flex items-center justify-center font-medium text-xs lg:text-xl shrink-0 ${item.avatarBg} ${item.avatarText}`}
                            >
                              {getInitials(item.clientName)}
                            </div>

                            {/* Client Text Info */}
                            <div className="min-w-0 flex-1">
                              <div className="truncate">
                                <span
                                  className={`font-medium mr-1 ${
                                    isDark ? "text-white" : "text-black"
                                  }`}
                                >
                                  {item.clientName}
                                </span>
                                <span
                                  className={`text-[10px] lg:text-xs ${
                                    isDark ? "text-[#E8D1AB]" : "text-black/40"
                                  }`}
                                >
                                  ({item.quoteNo})
                                </span>
                              </div>
                              <div
                                className={`text-xs lg:text-sm truncate ${
                                  isDark ? "text-white/40" : "text-black/40"
                                }`}
                              >
                                {item.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Desktop Specific Cells */}
                        <td className="hidden p-4 md:table-cell truncate max-w-[150px]">
                          {item.project}
                        </td>

                        <td className="hidden p-4 md:table-cell align-middle">
                          {renderBookingStatus(item.bookingStatus)}
                        </td>

                        <td className="hidden p-4 md:table-cell">
                          <div
                            className={`font-medium ${
                              isDark ? "text-white" : "text-black"
                            }`}
                          >
                            {item.amount}
                          </div>
                          {item.paidAmount && (
                            <div className="text-[10px] lg:text-xs text-[#14BC52]">
                              PAID - {item.paidAmount}
                            </div>
                          )}
                          {item.pendingAmount && (
                            <div className="text-[10px] lg:text-xs text-[#F29831]">
                              PENDING - {item.pendingAmount}
                            </div>
                          )}
                        </td>

                        {/* Quote Status Badge (Desktop) */}
                        <td className="hidden p-4 md:table-cell">
                          {renderQuoteStatus(item.quoteStatus)}
                        </td>

                        {/* Quote Status Badge (Mobile Right Alignment) */}
                        <td className="px-4 py-3 text-right md:hidden whitespace-nowrap">
                          {renderQuoteStatus(item.quoteStatus)}
                        </td>

                        <td className="hidden p-4 md:table-cell whitespace-nowrap">
                          {item.validity}
                        </td>

                        <td
                          className={`hidden p-4 md:table-cell whitespace-nowrap ${
                            isDark ? "text-white/90" : "text-black/90"
                          }`}
                        >
                          {item.salesRep}
                        </td>

                        {/* Action Menu (Desktop) */}
                        <td className="hidden p-4 text-center md:table-cell">
                          <button
                            type="button"
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark
                              ? "hover:text-white/80"
                              : "hover:text-black/80"
                              }`}
                          >
                            <MoreVertical size={30} />
                          </button>
                        </td>
                      </tr>

                      {/* Mobile Expanded Sub-row View */}
                      {isExpanded && (
                        <tr
                          className={`md:hidden ${
                            isDark ? "bg-[#202020]" : "bg-[#F9F9F9]"
                          }`}
                        >
                          <td
                            colSpan={2}
                            className="relative overflow-visible pl-6 pr-4 pb-4 pt-2"
                          >
                            <div className="space-y-4 text-xs">
                              <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                                <div>
                                  <p
                                    className={`mb-1 ${
                                      isDark
                                        ? "text-white/50"
                                        : "text-black/50"
                                    }`}
                                  >
                                    Project
                                  </p>
                                  <p className="font-medium text-sm truncate">
                                    {item.project}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p
                                    className={`mb-1 ${
                                      isDark
                                        ? "text-white/50"
                                        : "text-black/50"
                                    }`}
                                  >
                                    Booking Status
                                  </p>
                                  {renderBookingStatus(item.bookingStatus)}
                                </div>
                                <div>
                                  <p
                                    className={`mb-1 ${
                                      isDark
                                        ? "text-white/50"
                                        : "text-black/50"
                                    }`}
                                  >
                                    Amount
                                  </p>
                                  <p className="font-semibold text-sm">
                                    {item.amount}
                                  </p>
                                  {item.paidAmount && (
                                    <div className="text-[10px] text-[#14BC52]">
                                      PAID - {item.paidAmount}
                                    </div>
                                  )}
                                  {item.pendingAmount && (
                                    <div className="text-[10px] text-[#F29831]">
                                      PENDING - {item.pendingAmount}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p
                                    className={`mb-1 ${
                                      isDark
                                        ? "text-white/50"
                                        : "text-black/50"
                                    }`}
                                  >
                                    Sales Rep
                                  </p>
                                  <p className="font-medium text-sm">
                                    {item.salesRep}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                                <div>
                                  <p
                                    className={`mb-1 ${
                                      isDark
                                        ? "text-white/50"
                                        : "text-black/50"
                                    }`}
                                  >
                                    Validity
                                  </p>
                                  <p className="font-medium text-sm">
                                    {item.validity}
                                  </p>
                                </div>
                                <div
                                  className="flex flex-col items-end justify-end"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <p
                                    className={`mb-1 ${
                                      isDark
                                        ? "text-white/50"
                                        : "text-black/50"
                                    }`}
                                  >
                                    Action
                                  </p>
                                  <button
                                    type="button"
                                    className={`p-1 rounded-lg transition-colors ${
                                      isDark
                                        ? "hover:text-white"
                                        : "hover:text-black"
                                    }`}
                                  >
                                    <MoreVertical size={24} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Integrated Pagination Footer */}
          <div
            className={`p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${isDark
              ? "border-white/10 bg-[#101010]"
              : "border-black/10 bg-zinc-50"
              }`}
          >
            <div
              className={`hidden lg:block text-sm lg:text-base ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              Page {page} to {totalPages}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className={`p-2 rounded-lg border transition-all disabled:opacity-30 ${isDark
                  ? "bg-[#111] text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                  : "bg-white text-black/60 border-black/10 hover:bg-black/5"
                  }`}
              >
                <ChevronLeft size={20} />
              </button>

              {paginationItems.map((item, index) =>
                item === "..." ? (
                  <span
                    key={`ellipsis-${index}`}
                    className={`px-2 text-xs lg:text-sm ${isDark ? "text-white/40" : "text-black/40"}`}
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    className={`w-8 h-8 flex items-center justify-center text-xs lg:text-sm font-medium rounded-lg transition-all ${page === item
                      ? "bg-[#E5D5B8] text-black font-bold"
                      : isDark
                        ? "text-white/60 hover:bg-white/5"
                        : "text-black/60 hover:bg-black/5"
                      }`}
                  >
                    {item}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={page === totalPages}
                className={`p-2 rounded-lg border transition-all disabled:opacity-30 ${isDark
                  ? "bg-[#111] text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                  : "bg-white text-black/60 border-black/10 hover:bg-black/5"
                  }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}