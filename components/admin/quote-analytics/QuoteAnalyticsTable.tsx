"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { currency, QuoteAnalyticsRecord } from "./types";

const ROWS_PER_PAGE = 5;

type QuoteAnalyticsTableProps = {
  records: QuoteAnalyticsRecord[];
  isLoading?: boolean;
};

export function QuoteAnalyticsTable({ records, isLoading = false }: QuoteAnalyticsTableProps) {
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // ---- paginate ------------------------------------------------------------------------
  const totalRecords = records.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / ROWS_PER_PAGE));
  const currentPageClamped = Math.min(currentPage, totalPages);

  const displayedRecords = useMemo(() => {
    const start = (currentPageClamped - 1) * ROWS_PER_PAGE;
    return records.slice(start, start + ROWS_PER_PAGE);
  }, [records, currentPageClamped]);

  // ---- row expand / navigate ---------------------------------------------------------
  const toggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRows((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRowClick = (id: string) => {
    router.push(`/admin/quotes/analytics/${id}`);
  };

  const columns: string[] = [
    "Rep",
    "Quote Sent",
    "Quote Value",
    "Deal Won",
    "Win Rate",
    "Won Revenue",
    "Avg. Deal Size",
    "Open Pipeline",
    "Follow-ups",
  ];

  return (
    <div className="space-y-4">
      {/* Table */}
      <section className="overflow-hidden rounded-[14px] border border-[#252525] bg-[#171717]">
        {/* --- DESKTOP TABLE --- */}
        <div className="hidden md:block w-full overflow-x-auto">
          <table className="w-full table-fixed text-left">
            <thead className="bg-black">
              <tr className="border-b border-[#252525]">
                {columns.map((label) => (
                  <th
                    key={label}
                    className={`whitespace-nowrap px-4 py-3.5 text-[14px] font-medium text-[#E8D1AB] ${
                      label === "Rep"
                        ? "rounded-tl-[14px] w-[11%]"
                        : label === "Follow-ups"
                          ? "rounded-tr-[14px] w-[12%]"
                          : "w-auto"
                    }`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="text-[15px]">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="h-64">
                    <div className="flex items-center justify-center">
                      <Loader2
                        aria-label="Loading quote analytics"
                        className="h-8 w-8 animate-spin text-[#E8D1AB]"
                      />
                    </div>
                  </td>
                </tr>
              ) : displayedRecords.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-10 text-center text-[#888]">
                    No quote analytics found.
                  </td>
                </tr>
              ) : (
                displayedRecords.map((record) => (
                  <tr
                    key={record.id}
                    onClick={() => handleRowClick(record.id)}
                    className="cursor-pointer border-b border-[#212121] transition-colors last:border-0 hover:bg-white/[0.03]"
                  >
                    <td className="whitespace-nowrap px-4 py-4 text-[15px] font-medium text-white">
                      {record.client}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[15px] text-white">
                      {record.quotesSent}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[15px] text-white">
                      {currency(record.quoteValue)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[15px] text-white">
                      {record.dealWon}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[15px] text-white">
                      {record.winRate}%
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[15px] text-white">
                      {currency(record.wonRevenue)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[15px] text-white">
                      {currency(record.averageDealSize)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[15px] text-white">
                      {currency(record.openPipeline)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex whitespace-nowrap rounded-full bg-[#fff0cf] px-3 py-1.5 text-[13px] font-medium text-[#9a651f]">
                        {record.followUps} overdue
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- MOBILE COLLAPSIBLE VIEW --- */}
        <div className="block md:hidden w-full">
          <div className="flex justify-between bg-black px-4 py-3.5 text-[14px] font-medium text-[#E8D1AB]">
            <p>Rep</p>
            <p>Win Rate</p>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2
                aria-label="Loading quote analytics"
                className="h-8 w-8 animate-spin text-[#E8D1AB]"
              />
            </div>
          ) : displayedRecords.length === 0 ? (
            <div className="px-4 py-10 text-center text-white/50">
              No quote analytics found.
            </div>
          ) : (
            displayedRecords.map((record) => {
              const isExpanded = expandedRows.has(record.id);
              return (
                <div
                  key={record.id}
                  className={`border-b border-[#212121] px-4 py-4 last:border-0 ${
                    isExpanded ? "bg-white/[0.02]" : ""
                  }`}
                >
                  <div
                    className="flex cursor-pointer items-center justify-between gap-2"
                    onClick={() => handleRowClick(record.id)}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => toggleRow(record.id, e)}
                        className={`rounded-full border border-[#3a3a3a] p-1 transition-transform duration-200 ${
                          isExpanded ? "rotate-180 border-[#fff0cf]" : ""
                        }`}
                      >
                        <ChevronDown
                          size={14}
                          className={isExpanded ? "text-[#fff0cf]" : "text-[#777]"}
                        />
                      </button>
                      <p className="text-[15px] font-medium text-white">{record.client}</p>
                    </div>
                    <span className="inline-flex whitespace-nowrap rounded-full bg-[#fff0cf] px-3 py-1 text-[11px] font-medium text-[#9a651f]">
                      {record.winRate}%
                    </span>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-3 pt-4 text-[13px]">
                          <div>
                            <p className="text-[11px] font-medium text-white">Quote Sent</p>
                            <p className="text-[13px] text-white">{record.quotesSent}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] font-medium text-white">Quote Value</p>
                            <p className="text-[13px] text-white">{currency(record.quoteValue)}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-white">Deal Won</p>
                            <p className="text-[13px] text-white">{record.dealWon}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] font-medium text-white">Won Revenue</p>
                            <p className="text-[13px] text-white">{currency(record.wonRevenue)}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-white">Avg. Deal Size</p>
                            <p className="text-[13px] text-white">{currency(record.averageDealSize)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] font-medium text-white">Open Pipeline</p>
                            <p className="text-[13px] text-white">{currency(record.openPipeline)}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[11px] font-medium text-white">Follow-ups</p>
                            <p className="text-[13px] text-white">{record.followUps} overdue</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-[#252525] bg-[#101010] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[14px] text-[#c5c5c5]">
              Showing {(currentPageClamped - 1) * ROWS_PER_PAGE + 1} to{" "}
              {Math.min(currentPageClamped * ROWS_PER_PAGE, totalRecords)} of {totalRecords}{" "}
              results
            </span>

            <div className="flex items-center gap-[2px]">
              <button
                aria-label="Previous page"
                disabled={currentPageClamped === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="grid h-7 w-7 place-items-center rounded-[6px] text-[#777] transition-colors hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
              >
                <ChevronLeft size={12} />
              </button>

              {(() => {
                const rangePages: (number | "...")[] = [];
                const delta = 1;
                const left = currentPageClamped - delta;
                const right = currentPageClamped + delta + 1;

                for (let i = 1; i <= totalPages; i++) {
                  if (i === 1 || i === totalPages || (i >= left && i < right)) {
                    rangePages.push(i);
                  } else if (i === left - 1 || i === right) {
                    rangePages.push("...");
                  }
                }

                return rangePages
                  .filter((val, index, arr) => val !== "..." || arr[index - 1] !== "...")
                  .map((page, index) =>
                    page === "..." ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="flex h-7 w-7 items-center justify-center text-[12px] text-white/30"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`grid h-7 w-7 place-items-center rounded-[6px] border text-[12px] transition-colors ${
                          currentPageClamped === page
                            ? "border-[#5a5141] bg-[#1b1b1b] text-[#fff0cf]"
                            : "border-transparent text-[#777] hover:text-white"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  );
              })()}

              <button
                aria-label="Next page"
                disabled={currentPageClamped === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="grid h-7 w-7 place-items-center rounded-[6px] text-[#777] transition-colors hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
