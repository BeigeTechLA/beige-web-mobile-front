"use client";

import React, { useState } from "react";
import {
  ArrowUpRight,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { formatQuoteStatusText, getQuoteStatusPillClasses } from "./OpenPipeline";
import Link from "next/link";

// const DUMMY_OVERDUE_QUOTES: QuoteOverdueItem[] = [
//   {
//     id: "1",
//     clientName: "Ethan Carter",
//     quoteNo: "QT-01",
//     email: "ethan155@gmail.com",
//     project: "Corporate video pro....",
//     bookingStatus: "Converted to Booking",
//     amount: "$13,475.70",
//     paidAmount: "$10,475.70",
//     pendingAmount: "$3000.00",
//     quoteStatus: "Sent",
//     validity: "April 15, 2026",
//     salesRep: "John Smith",
//     avatarBg: "bg-[#FFF4D3]",
//     avatarText: "text-black",
//   },
//   {
//     id: "2",
//     clientName: "Rami Guzman",
//     quoteNo: "QT-02",
//     email: "rami142@gmail.com",
//     project: "Product launch....",
//     bookingStatus: "Pending",
//     amount: "$5000.00",
//     pendingAmount: "$5000.00",
//     quoteStatus: "Accepted",
//     validity: "April 15, 2026",
//     salesRep: "Sarah Johnson",
//     avatarBg: "bg-[#D6E0FF]",
//     avatarText: "text-black",
//   },
//   {
//     id: "3",
//     clientName: "John Lee",
//     quoteNo: "QT-03",
//     email: "john@gmail.com",
//     project: "Commercial shoot....",
//     bookingStatus: "Pending",
//     amount: "$2000.00",
//     paidAmount: "$2000.00",
//     quoteStatus: "Accepted",
//     validity: "April 15, 2026",
//     salesRep: "Michael Chen",
//     avatarBg: "bg-[#E2F0D9]",
//     avatarText: "text-black",
//   },
//   {
//     id: "4",
//     clientName: "Kevin Brooks",
//     quoteNo: "QT-04",
//     email: "brookkevin@gmail.com",
//     project: "Animated video",
//     bookingStatus: "Converted to Booking",
//     amount: "$1,400.00",
//     paidAmount: "$700.00",
//     pendingAmount: "$700.00",
//     quoteStatus: "Accepted",
//     validity: "April 15, 2026",
//     salesRep: "Emily Rodriguez",
//     avatarBg: "bg-[#D9F2E6]",
//     avatarText: "text-black",
//   },
//   {
//     id: "5",
//     clientName: "Lisa Anderson",
//     quoteNo: "QT-05",
//     email: "ethancole@gmail.com",
//     project: "Social Media Photo....",
//     bookingStatus: "Pending",
//     amount: "$5000.00",
//     pendingAmount: "$5000.00",
//     quoteStatus: "Sent",
//     validity: "April 15, 2026",
//     salesRep: "John Smith",
//     avatarBg: "bg-[#F7D6E0]",
//     avatarText: "text-black",
//   },
//   {
//     id: "6",
//     clientName: "Sukuna Cole",
//     quoteNo: "QT-06",
//     email: "sukuna@gmail.com",
//     project: "Corporate video pro....",
//     bookingStatus: "Converted to Booking",
//     amount: "$2000.00",
//     paidAmount: "$2000.00",
//     quoteStatus: "Sent",
//     validity: "April 15, 2026",
//     salesRep: "Sarah Johnson",
//     avatarBg: "bg-[#F3D3BD]",
//     avatarText: "text-black",
//   },
// ];

type OverdueQuoteRow = {
  sales_quote_id: number;
  quote_number: string;
  quote_date: string;
  client: {
    id: number;
    name: string;
    email: string;
    phone: string;
    type: string;
  };
  project: string;
  days_open: number;
  quote_value: number;
  collected_amount: number;
  outstanding_amount: number;
  quote_status: "sent" | "accepted" | "partially_paid";
  payment_status: string;
  lead_source: string;
  shoot_type: string | null;
  sales_rep: {
    id: number;
    name: string;
    email: string;
  };
  validity: {
    days: number;
    valid_until: string;
    is_expired: boolean;
  };
  sent_at: string;
  last_follow_up_at: string | null;
};

type OverdueFollowUpsData = {
  count: number;
  value: number;
  by_status: {
    status: "sent" | "accepted" | "partially_paid";
    count: number;
    value: number;
  }[];
};

type OverdueQuotesResponse = {
  rows: OverdueQuoteRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};
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
  loading = false,
  data,
  quotesData,
  onPageChange,
}: {
  isDark?: boolean;
  loading?: boolean;
  data?: OverdueFollowUpsData;
  quotesData?: OverdueQuotesResponse | null;
  onPageChange?: (page: number) => void;
}) {
  const [showTable, setShowTable] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const overdueCount = data?.count ?? 0;
  const overdueValue = data?.value ?? 0;

  const sentOverdue = data?.by_status?.find(
    (item) => item.status === "sent"
  );

  const acceptedOverdue = data?.by_status?.find(
    (item) => item.status === "accepted"
  );

  const partiallyPaidOverdue = data?.by_status?.find(
    (item) => item.status === "partially_paid"
  );

  const sentCount = sentOverdue?.count ?? 0;
  const acceptedCount = acceptedOverdue?.count ?? 0;
  const partiallyPaidCount = partiallyPaidOverdue?.count ?? 0;

  const sentValue = sentOverdue?.value ?? 0;
  const acceptedValue = acceptedOverdue?.value ?? 0;
  const partiallyPaidValue = partiallyPaidOverdue?.value ?? 0;

  const getPipelinePercentage = (value: number) => {
    if (!overdueValue || overdueValue <= 0) return 0;
    return Math.min(100, Math.max(0, (value / overdueValue) * 100));
  };

  const sentPercentage = getPipelinePercentage(sentValue);
  const acceptedPercentage = getPipelinePercentage(acceptedValue);
  const partiallyPaidPercentage = getPipelinePercentage(partiallyPaidValue);

const rows = quotesData?.rows ?? [];
const totalPages = quotesData?.pagination?.total_pages ?? 1;
const paginationItems = buildPaginationItems(page, totalPages);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={`w-full overflow-hidden rounded-lg lg:rounded-2xl border transition-all duration-300 ${isDark ? "border-white/10 bg-[#141414]" : "border-[#E5E5E5] bg-white"}`}
    >
      {/* Top Banner Widget */}
      <div className="p-5 lg:p-6 relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Summary Box */}
          <div className="flex flex-col justify-between min-w-[160px]">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-7 w-[3px] bg-[#E8D1AB] rounded-full inline-block" />
                <span className={`text-base ${isDark ? "text-white" : "text-black"}`}>
                  Quotes Overdue
                </span>
              </div>
              <div className={`text-2xl lg:text-4xl font-bold mt-2 capitalize ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>
                {overdueCount}
              </div>
              <p className={`text-sm lg:text-base mt-1 ${isDark ? "text-white/40" : "text-black/40"}`}>
                Need Follow-Up
              </p>
            </div>

            {/* Toggle Table Trigger Button */}
            <button
              type="button"
              onClick={() => setShowTable((prev) => !prev)}
              className={`mt-6 w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-105 ${isDark
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
            <p className={`text-sm lg:text-base mb-3 ${isDark ? "text-white/60" : "text-black/60"}`}>
              Pipeline At Risk
            </p>

            {/* Category Status Labels */}
          <div className="hidden lg:flex w-full gap-4 mb-3 text-sm lg:text-base uppercase">

            <div className="lg:hidden flex flex-col gap-3 mb-3 text-sm uppercase">

              <div className="flex items-center gap-1.5 text-[#B2E1F5]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B2E1F5] shrink-0" />
                <span>SENT - {sentCount} QUOTES</span>
              </div>

              <div className="flex items-center gap-1.5 text-[#51DB6B]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#51DB6B] shrink-0" />
                <span>ACCEPTED - {acceptedCount} QUOTES</span>
              </div>

              <div className="flex items-center gap-1.5 text-[#D9C555]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D9C555] shrink-0" />
                <span>PARTIALLY PAID - {partiallyPaidCount} QUOTES</span>
              </div>

            </div>
            <div className="flex-1 flex items-center gap-1.5 text-[#B2E1F5] whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B2E1F5] shrink-0" />
              <span>SENT - {sentCount} QUOTES</span>
            </div>

            <div className="flex-1 flex items-center gap-1.5 text-[#51DB6B] whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#51DB6B] shrink-0" />
              <span>ACCEPTED - {acceptedCount} QUOTES</span>
            </div>

            <div className="flex-1 flex items-center gap-1.5 text-[#D9C555] whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D9C555] shrink-0" />
              <span>PARTIALLY PAID - {partiallyPaidCount} QUOTES</span>
            </div>
          </div>

            {/* Horizontal Segment Bar */}
            <div className="h-14 w-full rounded-xl overflow-hidden flex shadow-inner text-black font-semibold text-sm lg:text-xl">
              <div
                className="bg-[linear-gradient(189deg,#B2E1F5_8.02%,#137FAD_83.16%)] flex items-center justify-center transition-all duration-500"
                style={{ width: `${sentPercentage}%` }}
              >
                {sentPercentage > 0 && `${(sentValue / 1000).toFixed(1)}K`}
              </div>

              <div
                className="bg-[linear-gradient(189deg,#D9FFDC_8.02%,#63B868_83.16%)] flex items-center justify-center transition-all duration-500"
                style={{ width: `${acceptedPercentage}%` }}
              >
                {acceptedPercentage > 0 && `${(acceptedValue / 1000).toFixed(1)}K`}
              </div>

              <div
                className="bg-[linear-gradient(189deg,#FFF7D9_8.02%,#D0BB6B_83.16%)] flex items-center justify-center transition-all duration-500"
                style={{ width: `${partiallyPaidPercentage}%` }}
              >
                {partiallyPaidPercentage > 0 &&
                  `${(partiallyPaidValue / 1000).toFixed(1)}K`}
              </div>
            </div>

            {/* Total Divider */}
            <div className="relative mt-5 pt-1 text-center">
              <div className={`absolute inset-0 flex items-center ${isDark ? "border-white/10" : "border-black/10"}`}>
                <div className={`w-full border-t ${isDark ? "border-white/10" : "border-black/10"}`}/>
              </div>
              <span
                className={`relative px-3 text-sm lg:text-xl font-semibold ${isDark
                  ? "bg-[#101010] text-[#E8D1AB]"
                  : "bg-zinc-50 text-black"
                  }`}
              >
                Total ${(overdueValue / 1000).toFixed(1)}K
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className={`border-b text-xs lg:text-sm font-medium ${isDark
                    ? "border-white/10 bg-[#101010] text-[#E8D1AB]"
                    : "border-black/10 bg-zinc-100 text-black/70"
                    }`}
                >
                  <th className="px-5 py-4">Client Name & Quote No</th>
                  {/* <th className="p-4">Project</th> */}
                  <th className="p-4">Payment Status</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Quote Status</th>
                  <th className="p-4">Validity</th>
                  <th className="p-4">Sales Rep</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody className="text-sm lg:text-base">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-0">
                      <div className="flex flex-col items-center justify-center gap-3 px-6 py-20">
                        <Loader2
                          size={28}
                          strokeWidth={2.5}
                          className={`animate-spin ${isDark ? "text-[#E8D1AB]" : "text-black/60"
                            }`}
                        />
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className={`px-6 py-20 text-center ${isDark ? "text-white" : "text-black"}`}
                    >
                      No overdue quotes found
                    </td>
                  </tr>
                ) : (
                  rows.map((item) => {
                  const isExpanded = expandedRowId === String(item.sales_quote_id);

                  return (
                    <React.Fragment key={item.sales_quote_id}>
                      <tr
                        onClick={() => {
                          if (
                            typeof window !== "undefined" &&
                            window.innerWidth < 1024
                          ) {
                            setExpandedRowId(
                            isExpanded ? null : String(item.sales_quote_id)
                          );
                          }
                        }}
                        className={`transition-colors ${isDark
                          ? "bg-[#171717] hover:bg-white/[0.02] text-white"
                          : "bg-black/10 hover:bg-black/[0.02] text-black"
                          }`}
                      >
                        {/* Client Name & Avatar */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 lg:h-12 lg:w-12 rounded-lg flex items-center justify-center font-medium text-sm lg:text-xl shrink-0 bg-[#E8D1AB] text-black"
                            >
                              {getInitials(item.client.name)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
                                  {item.client.name}
                                </span>
                              <Link
                                href={`/admin/quotes/${item.sales_quote_id}`}
                                className={`text-[10px] lg:text-xs hover:underline ${
                                  isDark ? "text-[#E8D1AB]" : "text-black/40"
                                }`}
                              >
                                ({item.quote_number || "-"})
                              </Link>
                              </div>
                              <div className={`text-xs lg:text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>
                                {item.client.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Project */}
                        {/* <td className={`p-4 truncate max-w-[150px]`}>
                          {item.project}
                        </td> */}

                        {/* Booking Status Badge */}
                        <td className="p-4">
                          {item.lead_source ? (
                            <span
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (item.lead_id) {
                                  window.location.href = `/admin/sales-representative/${item.lead_id}`;
                                }
                              }}
                              className="inline-flex whitespace-nowrap items-center justify-center px-3 py-1 lg:px-4 lg:py-2 rounded-full text-xs lg:text-sm font-medium bg-[#D4FFE4] text-[#16A34A] cursor-pointer hover:bg-[#c2f7d5] transition-colors"
                            >
                              Converted to Booking
                            </span>
                          ) : (
                            <span className="inline-flex whitespace-nowrap items-center justify-center px-3 py-1 lg:px-4 lg:py-2 rounded-full text-xs lg:text-sm font-medium bg-[#FFF0CF] text-[#C06D24]">
                              Pending Booking
                            </span>
                          )}
                        </td>
                        {/* Amount */}
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className={`font-semibold ${isDark ? "text-white" : "text-black"}`}>
                              ${item.quote_value.toLocaleString()}
                            </span>
                            {item.collected_amount > 0 && (
                              <span className="text-[10px]  text-green-600 uppercase whitespace-nowrap">
                                Paid: ${item.collected_amount.toLocaleString()}
                              </span>
                            )}
                            {item.outstanding_amount > 0 && (
                              <span className="text-[12px]  text-orange-400 uppercase whitespace-nowrap mt-0.5">
                                Pending: ${item.outstanding_amount.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Quote Status Badge */}
                      <td className="p-4">
                        <span className={`inline-flex whitespace-nowrap items-center justify-center px-3 py-1 lg:px-4 lg:py-2 rounded-full text-xs lg:text-sm font-medium ${getQuoteStatusPillClasses(item.quote_status)}`}>
                          {formatQuoteStatusText(item.quote_status)}
                        </span>
                      </td>

                        {/* Validity */}
                        <td className={`p-4 whitespace-nowrap`}>
                          {item.validity.valid_until
                            ? new Date(item.validity.valid_until).toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </td>

                        {/* Sales Rep */}
                        <td className={`p-4 whitespace-nowrap ${isDark ? "text-white/90" : "text-black/90"}`}>
                          {item.sales_rep.name}
                        </td>

                        {/* Action Menu */}
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            className={`p-1.5 rounded-lg transition-colors ${isDark
                              ? "hover:text-white/80"
                              : "hover:text-black/80"
                              }`}
                          >
                            <MoreVertical size={30} />
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })
                )}
              </tbody>
            </table>
          </div>

          {/* Integrated Pagination Footer */}
          {!loading && (
          <div
            className={`p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${isDark
              ? "border-white/10 bg-[#101010]"
              : "border-black/10 bg-zinc-50"
              }`}
          >
            <div className={`text-sm lg:text-base ${isDark ? "text-white" : "text-black" }`}>
              Page {page} to {totalPages}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const nextPage = Math.max(1, page - 1);
                  setPage(nextPage);
                  onPageChange?.(nextPage);
                }}
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
                    onClick={() => {
                      setPage(item);
                      onPageChange?.(item);
                    }}
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
                onClick={() => {
                  const nextPage = Math.min(totalPages, page + 1);
                  setPage(nextPage);
                  onPageChange?.(nextPage);
                }}
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
          )}
        </div>
      )}
    </div>
  );
}
