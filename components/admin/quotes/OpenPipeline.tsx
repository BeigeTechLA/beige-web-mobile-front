"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  Info,
} from "lucide-react";
import { salesApi, type QuoteAnalyticsParams, type QuoteAnalyticsQuoteListData, type QuoteAnalyticsQuoteRow } from "@/lib/api";
import Link from "next/link";

type OpenPipelineData = {
  count: number;
  value: number;
  by_status: {
    status: "sent" | "accepted" | "partially_paid";
    count: number;
    value: number;
  }[];
};

type PaginationItem = number | "...";

export const QUOTE_STATUS_PILL_STYLES: Record<string, string> = {
  accepted: "bg-[#D4FFE4] text-[#16A34A]",
  confirmed: "bg-[#D4FFE4] text-[#16A34A]",
  paid: "bg-[#D4FFE4] text-[#16A34A]",
  pending: "bg-[#FFF0CF] text-[#C06D24]",
  sent: "bg-[#AAD0FF] text-[#0C52A8]",
  viewed: "bg-[#AAD0FF] text-[#0C52A8]",
  partially_paid: "bg-[#FFF4C2] text-[#B8860B]",
  draft: "bg-[#E5E5E5] text-[#525252]",
  rejected: "bg-[#FFD6D6] text-[#DC2626]",
  cancelled: "bg-[#FFD6D6] text-[#DC2626]",
  expired: "bg-[#E5E5E5] text-[#525252]",
};

export const getQuoteStatusPillClasses = (status?: string | null) =>
  QUOTE_STATUS_PILL_STYLES[(status || "").toLowerCase()] ?? "bg-[#AAD0FF] text-[#0C52A8]";

export const formatQuoteStatusText = (status?: string | null) => {
  const normalized = String(status || "-").replace(/_/g, " ");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

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

export default function OpenPipelineWidget({
  isDark = true,
  data,
  filters = {},
}: {
  isDark?: boolean;
  data?: OpenPipelineData;
  filters?: QuoteAnalyticsParams;
}) {
  const [activeSection, setActiveSection] = useState<
    "sent" | "accepted" | "partiallyPaid" | null
  >(null);
  // const [page, setPage] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<number | null>();
  // const [isExpanded, setIsExpanded] = useState(false);

  const pipelineCount = data?.count ?? 0;
  const pipelineValue = data?.value ?? 0;

  const sentPipeline =
    data?.by_status?.find((item) => item.status === "sent");

  const acceptedPipeline =
    data?.by_status?.find((item) => item.status === "accepted");

  const partiallyPaidPipeline =
    data?.by_status?.find((item) => item.status === "partially_paid");

  const sentCount = sentPipeline?.count ?? 0;
  const acceptedCount = acceptedPipeline?.count ?? 0;
  const partiallyPaidCount = partiallyPaidPipeline?.count ?? 0;

  const sentValue = sentPipeline?.value ?? 0;
  const acceptedValue = acceptedPipeline?.value ?? 0;
  const partiallyPaidValue = partiallyPaidPipeline?.value ?? 0;

  const getPipelinePercentage = (value: number) => {
    if (!pipelineValue || pipelineValue <= 0) return 0;
    return Math.min(100, Math.max(0, (value / pipelineValue) * 100));
  };

  const getCardWidthClass = (section: "sent" | "accepted" | "partiallyPaid") => {
    if (!activeSection) return "md:flex-1";
    return activeSection === section ? "md:flex-[3]" : "md:flex-1";
  };

  const [page, setPage] = useState(1);
  const [quotesData, setQuotesData] = useState<QuoteAnalyticsQuoteListData | null>(null);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const activeStatus = activeSection === "partiallyPaid" ? "partially_paid" : activeSection;
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);
  const stableFilters = useMemo(() => JSON.parse(filtersKey) as QuoteAnalyticsParams, [filtersKey]);

  useEffect(() => {
    setPage(1);
  }, [filtersKey, activeStatus]);

  useEffect(() => {
    if (!activeStatus) return;

    const fetchQuotes = async () => {
      setIsLoadingQuotes(true);
      setQuotesData(null);

      try {
        const response = await salesApi.getQuoteAnalyticsQuotes({
          bucket: "open_pipeline",
          status: activeStatus,
          page,
          limit: 10,
          ...stableFilters,
        });

        if (response.success) {
          setQuotesData(response.data);
        }
      } finally {
        setIsLoadingQuotes(false);
      }
    };

    void fetchQuotes();
  }, [activeStatus, page, stableFilters]);


  const rows = quotesData?.rows ?? [];
  const totalPages = Math.max(1, quotesData?.pagination?.total_pages ?? 1);
  const safeCurrentPage = Math.min(page, totalPages);
  const paginationItems = buildPaginationItems(safeCurrentPage, totalPages);

  const toggleSection = (section: "sent" | "accepted" | "partiallyPaid") => {
    setActiveSection((prev) => (prev === section ? null : section));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`w-full overflow-visible rounded-2xl border transition-all duration-300 ${isDark ? "border-white/10 bg-[#171717]" : "border-[#E5E5E5] bg-white"}`}>
      {/* Top Main Section */}
      <div className="p-5 lg:p-6">
        {/* Header Row */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-4 mb-3 lg:mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-7 w-[3px] bg-[#E8D1AB] rounded-full inline-block" />
              <span className={`text-base ${isDark ? "text-white" : "text-black"}`}>
                Open Pipeline
              </span>
              <div className="relative flex items-center group">
                <Info
                  size={16}
                  strokeWidth={1.5}
                  className={`cursor-pointer transition-colors text-black fill-[#E8D1AB]`}
                />

                {/* Tooltip Popup */}
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none w-48">
                  <div
                    className={`px-3 py-2 text-xs rounded-lg shadow-xl border text-center transition-all ${isDark
                      ? "bg-[#252525] text-white border-white/10"
                      : "bg-white text-black border-black/10"
                      }`}
                  >
                    The proposals that have not yet been paid, lost, or expired
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

            <div className={`text-2xl lg:text-4xl font-bold mt-2 capitalize ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>
              ${(pipelineValue / 1000000).toFixed(1)}M
            </div>
            <p className={`text-sm lg:text-base mt-1 ${isDark ? "text-white/40" : "text-black/40"}`}>
              Total Active Pipeline Value
            </p>
          </div>

          {/* Active Quotes Badge Box */}
          <div
            className={`w-full lg:w-fit p-4 lg:px-5 flex flex-row-reverse lg:flex-col items-center justify-between rounded-2xl border text-center min-w-[120px] ${isDark
              ? "text-white bg-[linear-gradient(180deg,rgba(11,11,11,0.50)_0%,rgba(0,0,0,0.40)_100%)] border-white/5"
              : "bg-zinc-50 border-black/5 text-black"
              }`}
          >
            <div
              className={`text-[32px] font-semibold`}
            >
              {pipelineCount}
            </div>
            <div
              className={`text-xl mt-0.5`}
            >
              Active Quotes
            </div>
          </div >
        </div >

        {/* Pipeline Breakdown Bar Cards */}
        < div className={`p-2 lg:p-5 rounded-lg flex flex-col md:flex-row gap-4 ${isDark ? "bg-[#101010]" : "bg-zinc-50 border border-black/5"}`}
        >
          {/* Sent Card */}
          < div className={`p-3 rounded-xl transition-all duration-500 ${getCardWidthClass("sent")}`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className={`text-base lg:text-xl ${isDark ? "text-white/70" : "text-black/70"}`}>
                  Sent
                </span>
                <p className="text-sm lg:text-base font-semibold text-[#8B85FF] mt-0.5">
                  {sentCount} Quotes
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleSection("sent")}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 backdrop-blur-[76px] ${isDark
                  ? "bg-white/20 text-white/70 hover:bg-white/20"
                  : "bg-black/10 text-black/70 hover:bg-black/20"
                  }`}
              >
                <ArrowUpRight
                  size={18}
                  className={`transition-transform duration-300 ${activeSection === "sent" ? "rotate-180" : ""
                    }`}
                />
              </button>
            </div>
            <div className="h-13 lg:h-14 w-full rounded-lg overflow-hidden flex items-center bg-[#101010] p-1">
              <div className="h-full w-1 bg-white/80 rounded-full mr-2 shrink-0" />
              <div
                className="h-full w-full rounded-md bg-[linear-gradient(90deg,rgba(255,255,255,0.00)_0%,rgba(213,210,255,0.50)_39%,#7E72FF_100%)] transition-all duration-500"
              />
            </div>
          </div >

          {/* Accepted Card */}
          < div className={`p-3 rounded-xl transition-all duration-500 ${getCardWidthClass("accepted")}`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span
                  className={`text-base lg:text-xl ${isDark ? "text-white/70" : "text-black/70"}`}
                >
                  Accepted
                </span>
                <p className="text-sm lg:text-base font-semibold text-[#4ADE80] mt-0.5">
                  {acceptedCount} Quotes
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleSection("accepted")}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 backdrop-blur-[76px] ${isDark
                  ? "bg-white/20 text-white/70 hover:bg-white/20"
                  : "bg-black/10 text-black/70 hover:bg-black/20"
                  }`}
              >
                <ArrowUpRight
                  size={18}
                  className={`transition-transform duration-300 ${activeSection === "accepted" ? "rotate-180" : ""
                    }`}
                />
              </button>
            </div>
            <div className="h-13 lg:h-14 w-full rounded-lg overflow-hidden flex items-center bg-[#101010] p-1">
              <div className="h-full w-1 bg-white/80 rounded-full mr-2 shrink-0" />
              <div
                className="h-full w-full rounded-md bg-[linear-gradient(90deg,rgba(255,255,255,0.00)_0%,rgba(130,245,154,0.50)_39%,#35C653_100%)] transition-all duration-500"
              />
            </div>
          </div >

          {/* Partially Paid Card */}
          < div className={`p-3 rounded-xl transition-all duration-500 ${getCardWidthClass("partiallyPaid")}`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span
                  className={`text-base lg:text-xl ${isDark ? "text-white/70" : "text-black/70"}`}
                >
                  Partially Paid
                </span>
                <p className="text-sm lg:text-base font-semibold text-[#E8D1AB] mt-0.5">
                  {partiallyPaidCount} Quotes
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleSection("partiallyPaid")}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 backdrop-blur-[76px] ${isDark
                  ? "bg-white/20 text-white/70 hover:bg-white/20"
                  : "bg-black/10 text-black/70 hover:bg-black/20"
                  }`}
              >
                <ArrowUpRight
                  size={18}
                  className={`transition-transform duration-300 ${activeSection === "partiallyPaid" ? "rotate-180" : ""
                    }`}
                />
              </button>
            </div>
            <div className="h-13 lg:h-14 w-full rounded-lg overflow-hidden flex items-center bg-[#101010] p-1">
              <div className="h-full w-1 bg-white/80 rounded-full mr-2 shrink-0" />
              <div
                className="h-full w-full rounded-md bg-[linear-gradient(90deg,rgba(255,255,255,0.00)_0%,rgba(255,237,135,0.50)_39%,#DBC548_100%)] transition-all duration-500"
              />
            </div>
          </div >
        </div >
      </div >

      {/* Expandable Section */}
      <div
        className={`grid transition-all duration-500 ease-in-out ${activeSection !== null ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
      >
        <div className="overflow-hidden">
          <div
            className={`border-t rounded-b-2xl ${isDark ? "border-[#3D3D3D] bg-[#101010]" : "border-black/10 bg-white"}`}
          >
            <div className="overflow-x-auto overflow-y-hidden [-webkit-overflow-scrolling:touch]">
              <table className="w-full md:min-w-[1280px] text-left border-collapse table-fixed">
                <thead>
                  {/* Desktop Headers */}
                  <tr
                    className={`hidden rounded-b-lg border-b text-sm font-medium capitalize md:table-row ${isDark
                      ? "border-[#3D3D3D] bg-[#101010] text-[#E8D1AB]"
                      : "border-[#E5E5E5] bg-[#FFFCF6] text-black"
                      }`}
                  >
                    <th className="w-[22%] whitespace-nowrap px-5 py-4">Client Name & Quote No</th>
                    {/* <th className="w-[12%] whitespace-nowrap p-4">Project</th> */}
                    <th className="w-[17%] whitespace-nowrap p-4">Booking Status</th>
                    <th className="w-[12%] whitespace-nowrap p-4">Amount</th>
                    <th className="w-[11%] whitespace-nowrap p-4">Quote Status</th>
                    <th className="w-[11%] whitespace-nowrap p-4">Validity</th>
                    <th className="w-[10%] whitespace-nowrap p-4">Sales Rep</th>
                    <th className="w-[5%] whitespace-nowrap p-4 text-center">Action</th>
                  </tr>

                  {/* Mobile Headers */}
                  <tr
                    className={`border-b text-sm font-medium md:hidden w-full ${isDark
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
                  {isLoadingQuotes ? (
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
                        className={`px-6 py-20 text-center ${isDark ? "text-white" : "text-black"
                          }`}
                      >
                        No quotes available
                      </td>
                    </tr>
                  ) : (
                    rows.map((item: QuoteAnalyticsQuoteRow) => {
                      const isExpanded = expandedRowId === item.sales_quote_id;
                      return (
                        <React.Fragment key={item.sales_quote_id}>
                          {/* Main Row */}
                          <tr
                            onClick={() => {
                              if (window.innerWidth < 768) {
                                setExpandedRowId(isExpanded ? null : item.sales_quote_id);
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
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
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
                                <div
                                  className={`w-8 h-8 lg:h-12 lg:w-12 rounded-lg flex items-center justify-center font-medium text-sm lg:text-xl shrink-0 bg-[#E8D1AB] text-black`}
                                >
                                  {getInitials(item.client?.name || "Client")}
                                </div>

                                {/* Client Text Info */}
                                <div className="min-w-0 flex-1">
                                  <div className="truncate">
                                    <span className={`font-medium mr-1 ${isDark ? "text-white" : "text-black"}`}>
                                      {item.client?.name || "-"}
                                    </span>
                                    <Link
                                      href={`/admin/quotes/${item.sales_quote_id}`}
                                      onClick={(event) => event.stopPropagation()}
                                      className={`text-[10px] lg:text-xs hover:underline ${isDark ? "text-[#E8D1AB]" : "text-black/40"}`}
                                    >
                                      ({item.quote_number || "-"})
                                    </Link>
                                  </div>
                                  <div className={`truncate text-xs lg:text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>
                                    {item.client?.email || "-"}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Desktop Specific Cells */}
                            {/* <td className="hidden p-4 md:table-cell truncate max-w-[150px]">
                              {item.project || "-"}
                            </td> */}

                            <td className="hidden p-4 md:table-cell align-middle">
                              {item.lead_source ? (
                                <span className="inline-flex whitespace-nowrap items-center justify-center rounded-full bg-[#D4FFE4] px-3 py-1.5 text-xs font-medium text-[#16A34A] lg:text-sm">
                                  Converted to Booking
                                </span>
                              ) : (
                                <span className="inline-flex whitespace-nowrap items-center justify-center rounded-full bg-[#FFF0CF] px-3 py-1.5 text-xs font-medium text-[#C06D24] lg:text-sm">
                                  Pending Booking
                                </span>
                              )}
                            </td>

                            <td className="hidden p-4 md:table-cell">
                              <div className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
                                ${Number(item.quote_value || 0).toLocaleString()}
                              </div>
                              {item.collected_amount > 0 && (
                                <div className="whitespace-nowrap text-[10px] text-[#14BC52] lg:text-xs">
                                  PAID - ${Number(item.collected_amount).toLocaleString()}
                                </div>
                              )}
                              {item.outstanding_amount > 0 && (
                                <div className="whitespace-nowrap text-[10px] text-[#F29831] lg:text-xs">
                                  PENDING - ${Number(item.outstanding_amount).toLocaleString()}
                                </div>
                              )}
                            </td>

                            {/* Quote Status Badge */}
                            <td className="hidden p-4 md:table-cell">
                              <span className={`inline-flex whitespace-nowrap items-center justify-center rounded-full px-3 py-1.5 text-xs font-medium lg:text-sm ${getQuoteStatusPillClasses(item.quote_status)}`}>
                                {formatQuoteStatusText(item.quote_status)}
                              </span>
                            </td>

                            {/* Mobile Booking Status Right Alignment */}
                            <td className="p-4 text-right md:hidden">
                              <span className={`inline-flex whitespace-nowrap items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${getQuoteStatusPillClasses(item.quote_status)}`}>
                                {formatQuoteStatusText(item.quote_status)}
                              </span>
                            </td>

                            <td className="hidden p-4 md:table-cell whitespace-nowrap">
                              {item.validity?.valid_until
                                ? new Date(item.validity.valid_until).toLocaleDateString("en-US", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                                : "-"}
                            </td>

                            <td className={`hidden p-4 md:table-cell whitespace-nowrap ${isDark ? "text-white/90" : "text-black/90"}`}>
                              {item.sales_rep?.name || "-"}
                            </td>

                            {/* Action Menu */}
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
                                      <p className={`mb-1 ${isDark ? "text-white/50" : "text-black/50"}`}>Project</p>
                                      <p className="font-medium text-sm truncate">{item.project}</p>
                                    </div> */}
                                    <div className="text-right">
                                      <p className={`mb-1 ${isDark ? "text-white/50" : "text-black/50"}`}>Booking Status</p>
                                      {item.lead_source ? (
                                        <span className="inline-flex whitespace-nowrap items-center justify-center px-3 py-1 rounded-full text-xs font-medium bg-[#D4FFE4] text-[#16A34A]">
                                          Converted to Booking
                                        </span>
                                      ) : (
                                        <span className="inline-flex whitespace-nowrap items-center justify-center px-3 py-1 rounded-full text-xs font-medium bg-[#FFF0CF] text-[#C06D24]">
                                          Pending Booking
                                        </span>
                                      )}
                                    </div>
                                    <div>
                                      <p className={`mb-1 ${isDark ? "text-white/50" : "text-black/50"}`}>Amount</p>
                                      <p className="font-semibold text-sm">${Number(item.quote_value || 0).toLocaleString()}</p>

                                      {item.collected_amount > 0 && (
                                        <div className="text-[10px] text-[#14BC52]">
                                          PAID - ${Number(item.collected_amount).toLocaleString()}
                                        </div>
                                      )}
                                      {item.outstanding_amount > 0 && (
                                        <div className="text-[10px] text-[#F29831]">
                                          PENDING - ${Number(item.outstanding_amount).toLocaleString()}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <p className={`mb-1 ${isDark ? "text-white/50" : "text-black/50"}`}>Sales Rep</p>
                                      <p className="font-medium text-sm">{item.sales_rep?.name || "-"}</p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                                    <div>
                                      <p className={`mb-1 ${isDark ? "text-white/50" : "text-black/50"}`}>Validity</p>
                                      <p className="font-medium text-sm">{item.validity?.valid_until
                                        ? new Date(item.validity.valid_until).toLocaleDateString("en-US", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        })
                                        : "-"}</p>
                                    </div>
                                    <div className="flex flex-col items-end justify-end" onClick={(e) => e.stopPropagation()}>
                                      <p className={`mb-1 ${isDark ? "text-white/50" : "text-black/50"}`}>Action</p>
                                      <button
                                        type="button"
                                        className={`p-1 rounded-lg transition-colors ${isDark ? "hover:text-white" : "hover:text-black"}`}
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
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Pagination Footer */}
            {!isLoadingQuotes && rows.length > 0 && (
              <div
                className={`p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-2xl ${isDark
                  ? "border-white/10 bg-[#101010]"
                  : "border-black/10 bg-zinc-50"
                  }`}
              >
                <div className={`hidden lg:block lg:text-base ${isDark ? "text-white" : "text-black"}`}>
                  Page {safeCurrentPage} of {totalPages}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={safeCurrentPage === 1}
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
                        className={`w-8 h-8 flex items-center justify-center text-xs lg:text-sm font-medium rounded-lg transition-all ${safeCurrentPage === item
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
                    disabled={safeCurrentPage === totalPages}
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
    </div >
  );
}
