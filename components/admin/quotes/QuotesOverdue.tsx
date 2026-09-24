"use client";

import React, { useState } from "react";
import {
  ArrowUpRight,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ChevronUp,
  ChevronDown,
  Info,
} from "lucide-react";
import Link from "next/link";
import { formatQuoteStatusText, getQuoteStatusPillClasses } from "./OpenPipeline";

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
      className={`w-full overflow-visible rounded-lg lg:rounded-2xl border transition-all duration-300 ${isDark ? "border-white/10 bg-[#141414]" : "border-[#E5E5E5] bg-white"}`}
    >
      {/* Top Banner Widget */}
      <div className="p-5 lg:p-6 relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Summary Box */}
          <div className="flex lg:flex-col items-start justify-between min-w-[160px]">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-7 w-[3px] bg-[#E8D1AB] rounded-full inline-block" />
                <span className={`text-base ${isDark ? "text-white" : "text-black"}`}>
                  Quotes Overdue
                </span>
                <div className="relative flex items-center group">
                  <Info
                    size={16}
                    strokeWidth={1.5}
                    className={`cursor-pointer transition-colors text-black fill-[#E8D1AB]`}
                  />
                  {/* Tooltip Popup */}
                  <div className="absolute right-0 bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none w-48">
                    <div
                      className={`px-3 py-2 text-xs rounded-lg shadow-xl border text-center transition-all ${isDark
                        ? "bg-[#252525] text-white border-white/10"
                        : "bg-white text-black border-black/10"
                        }`}
                    >
                      Active proposals with no recorded follow-up in the last 72 hours
                    </div>
                    {/* Tooltip Arrow */}
                    <div
                      className={`w-2 h-2 -mt-1 rotate-45 border-r border-b ${isDark
                        ? "bg-[#252525] border-white/10"
                        : "bg-white border-black/10"
                        }`}
                    />
                  </div>
                </div>
              </div>
              <div className={`text-3xl lg:text-4xl font-bold mt-2 capitalize ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>
                {overdueCount}
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
                className={`transition-transform duration-300 ${showTable ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* Right Pipeline Breakdown Card */}
          <div className={`flex-1 rounded-xl p-5 ${isDark ? "bg-[#101010]" : "bg-zinc-50"}`}>
            <p className={`text-base mb-3 ${isDark ? "text-white/60" : "text-black/60"}`}>
              Pipeline At Risk
            </p>

            {/* Mobile Vertical Layout */}
            <div className="flex flex-col gap-4 lg:hidden">
              {/* Sent Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-sm uppercase text-[#B2E1F5] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B2E1F5]" />
                  <span>SENT - {sentCount} QUOTES</span>
                </div>
                <div
                  className="h-14 rounded-lg bg-[linear-gradient(189deg,#B2E1F5_8.02%,#137FAD_83.16%)] flex items-center justify-center text-black font-semibold text-base"
                  style={{ width: `${sentPercentage}%` }}
                >
                  {sentPercentage > 0 && `${(sentValue / 1000).toFixed(1)}K`}
                </div>
              </div>

              {/* Accepted Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-sm uppercase text-[#51DB6B] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#51DB6B]" />
                  <span>ACCEPTED - {acceptedCount} QUOTES</span>
                </div>
                <div
                  className="h-14 w-[80%] rounded-lg bg-[linear-gradient(189deg,#D9FFDC_8.02%,#63B868_83.16%)] flex items-center justify-center text-black font-semibold text-base"
                  style={{ width: `${acceptedPercentage}%` }}
                >
                  {acceptedPercentage > 0 && `${(acceptedValue / 1000).toFixed(1)}K`}
                </div>
              </div>

              {/* Partially Paid Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-sm uppercase text-[#D9C555] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D9C555]" />
                  <span>PARTIALLY PAID - {partiallyPaidCount} QUOTES</span>
                </div>
                <div
                  className="h-14 w-[60%] rounded-lg bg-[linear-gradient(189deg,#FFF7D9_8.02%,#D0BB6B_83.16%)] flex items-center justify-center text-black font-semibold text-base"
                  style={{ width: `${partiallyPaidPercentage}%` }}
                >
                  {partiallyPaidPercentage > 0 &&
                    `${(partiallyPaidValue / 1000).toFixed(1)}K`}
                </div>
              </div>
            </div>

            {/* Desktop Horizontal Layout */}
            <div className="hidden lg:block">
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
              <div className="h-14 w-full rounded-xl overflow-hidden flex shadow-inner text-black font-semibold text-xl">
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
                  <div className={`w-full border-t ${isDark ? "border-white/10" : "border-black/10"}`} />
                </div>
                <span
                  className={`relative px-3 text-xl font-semibold ${isDark
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
      </div>

      {/* Collapsible Expandable Table Section */}
      <div
        className={`grid transition-all duration-500 ease-in-out ${showTable ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
      >
        <div className="overflow-hidden">
        <div className={`border-t rounded-b-2xl ${isDark ? "border-[#3D3D3D] bg-[#101010]" : "border-black/10 bg-white"}`}>
          <div className="w-full overflow-x-auto overflow-y-hidden [-webkit-overflow-scrolling:touch]">
            <table className="w-full md:min-w-[1280px] text-left border-collapse table-fixed">
              <thead>
                {/* Desktop Table Header */}
                <tr
                  className={`hidden rounded-b-lg border-b text-sm font-medium capitalize md:table-row ${isDark
                    ? "border-[#3D3D3D] bg-[#101010] text-[#E8D1AB]"
                    : "border-[#E5E5E5] bg-[#FFFCF6] text-black"
                    }`}
                >
                  <th className="w-[22%] whitespace-nowrap px-5 py-4">Client Name & Quote No</th>
                  {/* <th className="w-[12%] whitespace-nowrap p-4">Project</th> */}
                  <th className="w-[17%] whitespace-nowrap p-4">Payment Status</th>
                  <th className="w-[12%] whitespace-nowrap p-4">Amount</th>
                  <th className="w-[11%] whitespace-nowrap p-4">Quote Status</th>
                  <th className="w-[11%] whitespace-nowrap p-4">Validity</th>
                  <th className="w-[10%] whitespace-nowrap p-4">Sales Rep</th>
                  <th className="w-[5%] whitespace-nowrap p-4 text-center">Action</th>
                </tr>

                {/* Mobile Header Row */}
                <tr
                  className={`border-b text-sm font-medium md:hidden ${isDark
                    ? "border-[#3D3D3D] bg-[#101010] text-[#E8D1AB]"
                    : "border-[#E5E5E5] bg-[#FFFCF6] text-black"
                    }`}
                >
                  <th className="px-4 py-3 text-left w-3/5">Client Name</th>
                  <th className="px-4 py-3 text-right w-2/5">Quote Status</th>
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
                          className={`transition-colors cursor-pointer ${isDark
                            ? "bg-[#171717] hover:bg-white/[0.02] text-white border-white/10"
                            : "bg-black/10 hover:bg-black/[0.02] text-black border-black/10"
                            } ${isExpanded
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
                                className={`shrink-0 md:hidden border rounded-full w-6 h-6 flex items-center justify-center transition-colors pointer-events-auto ${isExpanded
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
                              <div className={`w-8 h-8 lg:h-12 lg:w-12 rounded-lg flex items-center justify-center font-medium text-xs lg:text-xl shrink-0 bg-[#E8D1AB] text-black`}>
                                {getInitials(item.client.name)}
                              </div>

                              {/* Client Text Info */}
                              <div className="min-w-0 flex-1">
                                <div className="truncate">
                                  <span className={`font-medium mr-1 ${isDark ? "text-white" : "text-black"}`}>
                                    {item.client.name}
                                  </span>
                                  <Link
                                    href={`/admin/quotes/${item.sales_quote_id}`}
                                    onClick={(event) => event.stopPropagation()}
                                    className={`text-[10px] lg:text-xs hover:underline ${isDark ? "text-[#E8D1AB]" : "text-black/40"}`}
                                  >
                                    ({item.quote_number})
                                  </Link>
                                </div>
                                <div className={`text-xs lg:text-sm truncate ${isDark ? "text-white/40" : "text-black/40"}`}>
                                  {item.client.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Desktop Specific Cells */}
                          {/* <td className="hidden p-4 md:table-cell truncate max-w-[150px]">
                            {item.project}
                          </td> */}

                          {/* Booking Status Badge */}
                          <td className="hidden p-4 md:table-cell">
                            {item.lead_source ? (
                              <span className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-[#D4FFE4] px-3 py-1.5 text-center text-xs font-medium capitalize text-[#16A34A] lg:text-sm">
                                {item.lead_source}
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-[#FFF0CF] px-3 py-1.5 text-center text-xs font-medium text-[#C06D24] lg:text-sm">
                                Pending
                              </span>
                            )}
                          </td>
                          {/* Amount */}
                          <td className="hidden p-4 md:table-cell">
                            <div className={`font-medium ${isDark ? "text-white" : "text-black"}`}
                            >
                              ${item.quote_value.toLocaleString()}
                            </div>
                            {item.collected_amount > 0 && (
                              <div className="whitespace-nowrap text-[10px] text-[#14BC52] lg:text-xs">
                                PAID - ${item.collected_amount.toLocaleString()}
                              </div>
                            )}
                            {item.outstanding_amount > 0 && (
                              <div className="whitespace-nowrap text-[10px] text-[#F29831] lg:text-xs">
                                PENDING - ${item.outstanding_amount.toLocaleString()}
                              </div>
                            )}
                          </td>

                          {/* Quote Status Badge */}
                          <td className="hidden p-4 md:table-cell">
                            <span className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium lg:text-sm ${getQuoteStatusPillClasses(item.quote_status)}`}>
                              {formatQuoteStatusText(item.quote_status)}
                            </span>
                          </td>

                          <td className="p-4 text-right md:hidden">
                            <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${getQuoteStatusPillClasses(item.quote_status)}`}>
                              {formatQuoteStatusText(item.quote_status)}
                            </span>
                          </td>

                          {/* Validity */}
                          <td className="hidden p-4 whitespace-nowrap md:table-cell">
                            {item.validity.valid_until
                              ? new Date(item.validity.valid_until).toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                              : "-"}
                          </td>

                          {/* Sales Rep */}
                          <td className={`hidden p-4 whitespace-nowrap md:table-cell ${isDark ? "text-white/90" : "text-black/90"}`}>
                            {item.sales_rep.name}
                          </td>

                          {/* Action Menu (Desktop) */}
                          <td className="hidden p-4 text-center md:table-cell">
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

                        {/* Mobile Expanded Sub-row View */}
                        {isExpanded && (
                          <tr className={`md:hidden ${isDark ? "bg-[#202020]" : "bg-[#F9F9F9]"}`}>
                            <td
                              colSpan={2}
                              className="relative overflow-visible pl-6 pr-4 pb-4 pt-2"
                            >
                              <div className="space-y-4 text-xs">
                                <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                                  {/* <div>
                                    <p
                                      className={`mb-1 ${isDark
                                        ? "text-white/50"
                                        : "text-black/50"
                                        }`}
                                    >
                                      Project
                                    </p>
                                    <p className="font-medium text-sm truncate">
                                      {item.project}
                                    </p>
                                  </div> */}
                                  <div className="text-right">
                                    <p
                                      className={`mb-1 ${isDark
                                        ? "text-white/50"
                                        : "text-black/50"
                                        }`}
                                    >
                                      Booking Status
                                    </p>
                                    {item.quote_status.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                                  </div>
                                  <div>
                                    <p
                                      className={`mb-1 ${isDark
                                        ? "text-white/50"
                                        : "text-black/50"
                                        }`}
                                    >
                                      Amount
                                    </p>
                                    <p className="font-semibold text-sm">
                                      ${item.quote_value.toLocaleString()}
                                    </p>
                                    {item.collected_amount && (
                                      <div className="text-[10px] text-[#14BC52]">
                                        PAID - ${item.collected_amount.toLocaleString()}
                                      </div>
                                    )}
                                    {item.outstanding_amount && (
                                      <div className="text-[10px] text-[#F29831]">
                                        PENDING - ${item.outstanding_amount.toLocaleString()}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p
                                      className={`mb-1 ${isDark
                                        ? "text-white/50"
                                        : "text-black/50"
                                        }`}
                                    >
                                      Sales Rep
                                    </p>
                                    <p className="font-medium text-sm">
                                      {item.sales_rep.name}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                                  <div>
                                    <p
                                      className={`mb-1 ${isDark
                                        ? "text-white/50"
                                        : "text-black/50"
                                        }`}
                                    >
                                      Validity
                                    </p>
                                    <p className="font-medium text-sm">
                                      {item.validity.valid_until
                                        ? new Date(item.validity.valid_until).toLocaleDateString("en-US", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        })
                                        : "-"}
                                    </p>
                                  </div>
                                  <div
                                    className="flex flex-col items-end justify-end"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <p
                                      className={`mb-1 ${isDark
                                        ? "text-white/50"
                                        : "text-black/50"
                                        }`}
                                    >
                                      Action
                                    </p>
                                    <button
                                      type="button"
                                      className={`p-1 rounded-lg transition-colors ${isDark
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
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Integrated Pagination Footer */}
          {!loading && (
            <div
              className={`p-5 border-t rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-4 ${isDark
                ? "border-white/10 bg-[#101010]"
                : "border-black/10 bg-zinc-50"
                }`}
            >
              <div
                className={`hidden lg:block text-sm lg:text-base ${isDark ? "text-white" : "text-black"
                  }`}
              >
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
        </div>
      </div>
    </div>
  );
}
