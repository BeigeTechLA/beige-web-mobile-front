"use client";

import React, { useState } from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

type QuoteAnalyticsItem = {
  id: string | number;
  rep: string;
  quoteSent: number;
  quoteValue: string;
  dealWon: number;
  winRate: string;
  wonRevenue: string;
  avgDealSizeOpen: string;
  openPipeline: string;
  followUpsOverdue: number;
};

type QuoteAnalyticsTableProps = {
  isDark?: boolean;
};

// Dummy Data matching screenshot specifications
const DUMMY_ANALYTICS_DATA: QuoteAnalyticsItem[] = [
  {
    id: 1,
    rep: "John Smith",
    quoteSent: 42,
    quoteValue: "$8.4L",
    dealWon: 12,
    winRate: "28.6%",
    wonRevenue: "$3.2L",
    avgDealSizeOpen: "$26.7K",
    openPipeline: "$4.1M",
    followUpsOverdue: 1,
  },
  {
    id: 2,
    rep: "Michael Chen",
    quoteSent: 36,
    quoteValue: "$6.8L",
    dealWon: 9,
    winRate: "25.0%",
    wonRevenue: "$2.4L",
    avgDealSizeOpen: "$26.7K",
    openPipeline: "$3.6M",
    followUpsOverdue: 3,
  },
  {
    id: 3,
    rep: "Olivia Brown",
    quoteSent: 28,
    quoteValue: "$5.2L",
    dealWon: 7,
    winRate: "25.0%",
    wonRevenue: "$1.8L",
    avgDealSizeOpen: "$25.7K",
    openPipeline: "$2.7M",
    followUpsOverdue: 5,
  },
  {
    id: 4,
    rep: "Lisa Smith",
    quoteSent: 22,
    quoteValue: "$4.1L",
    dealWon: 4,
    winRate: "18.2%",
    wonRevenue: "$1.3L",
    avgDealSizeOpen: "$32.5K",
    openPipeline: "$2.0M",
    followUpsOverdue: 2,
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

  if (left > 2) {
    items.push("...");
  }

  for (let page = left; page <= right; page += 1) {
    items.push(page);
  }

  if (right < totalPages - 1) {
    items.push("...");
  }

  if (totalPages > 1) {
    items.push(totalPages);
  }

  return items;
};

const TableRow = ({
  item,
  isExpanded,
  onToggle,
  isDark = true,
}: {
  item: QuoteAnalyticsItem;
  isExpanded: boolean;
  onToggle: () => void;
  isDark: boolean;
}) => {
  return (
    <React.Fragment>
      <tr
        onClick={() => {
          if (typeof window !== "undefined" && window.innerWidth < 1024) {
            onToggle();
          }
        }}
        className={`transition-colors lg:cursor-default ${
          typeof window !== "undefined" && window.innerWidth < 1024
            ? "cursor-pointer"
            : ""
        } ${
          isDark
            ? isExpanded
              ? "bg-[#202020]"
              : "border-white/[0.05] hover:bg-white/[0.02]"
          : "hover:bg-black/[0.02]"
          }`}
      >
        {/* Rep Column (Mobile Accordion Lead) */}
        <td className="p-4">
          <div className="flex items-center gap-3">
            {/* Mobile Chevron */}
            <div
              className={`lg:hidden border rounded-full w-6 h-6 flex items-center justify-center transition-colors shrink-0 ${
                isExpanded
                ? isDark
                  ? "border-[#E8D1AB] text-[#E8D1AB]"
                  : "border-black text-black"
                : isDark
                  ? "border-[#4B4B4B] text-[#777674]"
                  : "border-[#E3E3E3] text-black/40"
                }`}
            >
              {isExpanded ? (
                <ChevronUp size={14} strokeWidth={2.5} />
              ) : (
                <ChevronDown size={14} strokeWidth={2.5} />
              )}
            </div>

            <span
              className={`text-sm lg:text-base font-medium ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              {item.rep}
            </span>
          </div>
        </td>

        {/* Desktop Data Columns */}
        <td
          className={`p-4 hidden lg:table-cell ${
            isDark ? "text-white" : "text-black"
          }`}
        >
          {item.quoteSent}
        </td>

        <td
          className={`p-4 hidden lg:table-cell ${
            isDark ? "text-white" : "text-black"
          }`}
        >
          {item.quoteValue}
        </td>

        <td
          className={`p-4 hidden lg:table-cell ${
            isDark ? "text-white" : "text-black"
          }`}
              >
          {item.dealWon}
        </td>

        <td
          className={`p-4 hidden lg:table-cell ${
            isDark ? "text-white" : "text-black"
          }`}
        >
          {item.winRate}
        </td>

        <td
          className={`p-4 hidden lg:table-cell ${
            isDark ? "text-white" : "text-black"
          }`}
          >
          {item.wonRevenue}
        </td>

        <td
          className={`p-4 hidden lg:table-cell ${
            isDark ? "text-white" : "text-black"
          }`}
        >
          {item.avgDealSizeOpen}
        </td>

        <td
          className={`p-4 hidden lg:table-cell ${
            isDark ? "text-white" : "text-black"
          }`}
        >
          {item.openPipeline}
        </td>

        {/* Follow-ups Badge Column */}
        <td className="p-4 text-right lg:text-left">
          <span className="inline-flex items-center justify-center rounded-full px-3 py-1.5 lg:px-5 lg:py-3 text-sm lg:text-base font-medium whitespace-nowrap bg-[#FFF0CF] text-[#C06D24]">
            {item.followUpsOverdue} overdue
          </span>
        </td>
      </tr>

      {/* Mobile Expanded Details Section */}
      {isExpanded && (
        <tr
          className={`lg:hidden transition-colors ${
            isDark ? "bg-[#202020]" : "bg-black/[0.02]"
          }`}
        >
          <td
            colSpan={2}
            className={`px-4 py-6 border-t ${
              isDark ? "border-white/[0.05]" : "border-black/[0.05]"
              }`}
          >
            <div className="pl-9 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p
                    className={`text-xs mb-1 ${
                      isDark ? "text-[#F5F5F5]" : "text-black/50"
                    }`}
                  >
                    Quote Sent
                  </p>
                  <p
                    className={`text-sm ${
                      isDark ? "text-[#A1A1A1]" : "text-black"
                    }`}
                  >
                    {item.quoteSent}
                  </p>
                </div>
                <div>
                  <p
                    className={`text-xs mb-1 ${
                      isDark ? "text-[#F5F5F5]" : "text-black/50"
                    }`}
                  >
                    Quote Value
                  </p>
                  <p
                    className={`text-sm ${
                      isDark ? "text-[#A1A1A1]" : "text-black"
                    }`}
                  >
                    {item.quoteValue}
                  </p>
                </div>
                <div>
                  <p
                    className={`text-xs mb-1 ${
                      isDark ? "text-[#F5F5F5]" : "text-black/50"
                    }`}
                  >
                    Deal Won
                  </p>
                  <p
                    className={`text-sm ${
                      isDark ? "text-[#A1A1A1]" : "text-black"
                    }`}
                  >
                    {item.dealWon}
                  </p>
                  </div>
                <div>
                  <p
                    className={`text-xs mb-1 ${
                      isDark ? "text-[#F5F5F5]" : "text-black/50"
                    }`}
                  >
                    Win Rate
                  </p>
                  <p
                    className={`text-sm ${
                      isDark ? "text-[#A1A1A1]" : "text-black"
                    }`}
                  >
                    {item.winRate}
                  </p>
                </div>
                <div>
                  <p
                    className={`text-xs mb-1 ${
                      isDark ? "text-[#F5F5F5]" : "text-black/50"
                    }`}
                  >
                    Won Revenue
                  </p>
                  <p
                    className={`text-sm ${
                      isDark ? "text-[#A1A1A1]" : "text-black"
                    }`}
                  >
                    {item.wonRevenue}
                  </p>
                </div>
                <div>
                  <p
                    className={`text-xs mb-1 ${
                      isDark ? "text-[#F5F5F5]" : "text-black/50"
                    }`}
                  >
                    Avg. Deal Size Open
                  </p>
                  <p
                    className={`text-sm ${
                      isDark ? "text-[#A1A1A1]" : "text-black"
                    }`}
                  >
                    {item.avgDealSizeOpen}
                  </p>
              </div>
              <div>
                  <p
                    className={`text-xs mb-1 ${
                      isDark ? "text-[#F5F5F5]" : "text-black/50"
                    }`}
                  >
                    Open Pipeline
                </p>
                  <p
                    className={`text-sm ${
                      isDark ? "text-[#A1A1A1]" : "text-black"
                    }`}
                >
                    {item.openPipeline}
                  </p>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
};

export const QuotesAnalyticsTable = ({ isDark = true }: QuoteAnalyticsTableProps) => {
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<string | number | null>(
    null
  );

  const totalPages = 10;
  const safeCurrentPage = page;
  const paginationItems = buildPaginationItems(safeCurrentPage, totalPages);

  return (
    <div
      className={`overflow-hidden rounded-lg lg:rounded-2xl border transition-colors ${
        isDark ? "border-white/10 bg-[#171717]" : "border-[#E5E5E5] bg-white"
      }`}
    >
      <table className="w-full text-left border-collapse">
        <thead>
          {/* Desktop Headers */}
          <tr
            className={`hidden lg:table-row border-b rounded-b-lg lg:rounded-b-2xl text-left text-sm transition-colors ${
              isDark
              ? "border-white/[0.04] bg-[#101010] text-[#E7D2AB]"
              : "border-[#E5E5E5] bg-[#FFFCF6] text-black"
              }`}
          >
            {[
              "Rep",
              "Quote Sent",
              "Quote Value",
              "Deal Won",
              "Win Rate",
              "Won Revenue",
              "Avg. Deal Size Open",
              "Open Pipeline",
              "Follow-ups",
            ].map((label) => (
              <th key={label} className="p-4 font-medium">
                {label}
              </th>
            ))}
          </tr>
          {/* Mobile Headers */}
          <tr
            className={`lg:hidden border-b text-sm transition-colors ${
              isDark
              ? "border-white/[0.04] bg-[#101010] text-[#E7D2AB]"
              : "border-[#E5E5E5] bg-[#FFFCF6] text-black"
              }`}
          >
            <th className="p-4 font-medium">Rep</th>
            <th className="p-4 text-right font-medium">Follow-ups</th>
          </tr>
        </thead>

        <tbody className="text-sm lg:text-base">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <tr
                key={index}
                className={`border-t ${isDark ? "border-white/[0.05]" : "border-black/[0.05]"}`}
              >
                <td colSpan={9} className="p-4">
                  <div
                    className={`h-5 lg:h-10 animate-pulse rounded ${isDark ? "bg-white/5" : "bg-black/5"}`}
                  />
                </td>
              </tr>
            ))
          ) : DUMMY_ANALYTICS_DATA.length === 0 ? (
            <tr>
              <td
                colSpan={9}
                className={`px-6 py-20 text-center ${isDark ? "text-white" : "text-black"}`}
              >
                No analytics data available
              </td>
            </tr>
          ) : (
            DUMMY_ANALYTICS_DATA.map((item) => (
              <TableRow
                key={String(item.id)}
                item={item}
                isDark={isDark}
                isExpanded={expandedRowId === item.id}
                onToggle={() => {
                  setExpandedRowId(expandedRowId === item.id ? null : item.id);
                }}
              />
            ))
          )}
        </tbody>

        {/* Integrated Pagination Footer */}
        {!loading && DUMMY_ANALYTICS_DATA.length > 0 && (
          <tfoot>
            <tr
              className={`border-t transition-colors ${
                isDark ? "border-[#333333] bg-[#101010]" : "border-[#E5E5E5] bg-white"
              }`}
            >
              <td colSpan={9} className="p-4">
                <div className="flex gap-4 items-center justify-center lg:justify-between">
                  <div
                    className={`hidden lg:block text-sm ${
                      isDark ? "text-white" : "text-black"
                    }`}
                  >
                    {`Page ${safeCurrentPage} to ${totalPages}`}
                  </div>
                  <div className="flex items-center gap-2 self-auto">
                    <button
                      type="button"
                      onClick={() =>
                        setPage((currentValue) => Math.max(1, currentValue - 1))
                      }
                      disabled={safeCurrentPage === 1}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${
                        isDark
                        ? "bg-[#111] text-white/60 border-[#333] hover:bg-white/10 hover:text-white"
                        : "bg-white text-[#333] border-[#E5E5E5] hover:bg-black/5"
                        }`}
                    >
                      <ChevronLeft size={24} />
                    </button>

                    {paginationItems.map((item, index) =>
                      item === "..." ? (
                        <span
                          key={`ellipsis-${index}`}
                          className={`px-2 text-sm ${
                            isDark ? "text-white/60" : "text-[#666]"
                          }`}
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setPage(item)}
                          className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${
                            safeCurrentPage === item
                            ? "bg-[#E5D5B8] text-black"
                            : isDark
                              ? "text-white/60 hover:bg-white/5"
                              : "text-[#666] hover:bg-black/5"
                            }`}
                        >
                          {item}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setPage((currentValue) =>
                          Math.min(totalPages, currentValue + 1)
                        )
                      }
                      disabled={safeCurrentPage === totalPages}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${
                        isDark
                        ? "bg-[#111] text-white/60 border-[#333] hover:bg-white/10 hover:text-white"
                        : "bg-white text-[#333] border-[#E5E5E5] hover:bg-black/5"
                        }`}
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};