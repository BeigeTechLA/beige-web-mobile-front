"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CreditHistoryRow = {
  id: string;
  userId?: number | null;
  guestEmail?: string;
  date: string;
  clientName: string;
  email: string;
  availablePoints: string;
  usedPoints: string;
  lastActivity: string;
  initials: string;
  avatarColor: string;
  avatarImage?: string;
};

interface CreditHistoryTable {
  rows: CreditHistoryRow[];
  title?: string;
  loading?: boolean;
  monthValue?: string;
  monthOptions?: string[];
  onMonthChange?: (value: string) => void;
  statusValue?: string;
  statusOptions?: string[];
  onStatusChange?: (value: string) => void;
  onRowClick?: (row: CreditHistoryRow) => void;
  itemsPerPage?: number;
}
const formatDate = (dateString: string) => {
  if (!dateString) return "—";

  let date: Date;

  if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split("-");
    date = new Date(`${year}-${month}-${day}`);
  } else {
    date = new Date(dateString);
  }

  if (isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
};

const buildPaginationItems = (
  currentPage: number,
  totalPages: number
): Array<number | "..."> => {
  const items: Array<number | "..."> = [];

  for (let page = 1; page <= totalPages; page += 1) {
    const isBoundary = page === 1 || page === totalPages;
    const isNearCurrent = Math.abs(page - currentPage) <= 1;

    if (isBoundary || isNearCurrent) {
      items.push(page);
      continue;
    }

    const previousItem = items[items.length - 1];
    if (previousItem !== "...") {
      items.push("...");
    }
  }

  return items;
};

export default function CreditHistoryTable({
  rows,
  title = "Credit Points History",
  loading = false,
  monthValue = "Month",
  monthOptions = ["Month", "Last 30 Days", "This Quarter", "This Year"],
  onMonthChange,
  statusValue = "All",
  statusOptions = ["All", "Used", "Available"],
  onStatusChange,
  onRowClick,
  itemsPerPage = 6,
}: CreditHistoryTable) {
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || theme === "dark";

  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [rows, monthValue, statusValue]);

  const visibleRows = useMemo(() => {
    const startIndex = (safePage - 1) * itemsPerPage;
    return rows.slice(startIndex, startIndex + itemsPerPage);
  }, [itemsPerPage, rows, safePage]);

  const startCount = rows.length === 0 ? 0 : (safePage - 1) * itemsPerPage + 1;
  const endCount = Math.min(safePage * itemsPerPage, rows.length);
  const paginationItems = buildPaginationItems(safePage, totalPages);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <section
      className={`overflow-visible rounded-[24px] border transition-colors ${
        isDark
          ? "border-[#2D2D2D] bg-[#171717]"
          : "border-[#E5E5E5] bg-[#FCFBF7]"
      }`}
    >
      <div
        className={`flex flex-col gap-4 border-b px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-6 ${
          isDark ? "border-[#2A2A2A]" : "border-[#ECE2D3]"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="h-7 w-[3px] rounded-full bg-[#E5D5B8]" />
          <h2
            className={`text-lg font-medium ${
              isDark ? "text-white" : "text-[#171717]"
            }`}
          >
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-auto">
          {onMonthChange && (
            <Select value={monthValue} onValueChange={onMonthChange}>
              <SelectTrigger
                className={`w-[110px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${
                  isDark
                    ? "bg-zinc-900 border-[#3D3D3D] text-white/70"
                    : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"
                }`}
              >
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent
                className={
                  isDark
                    ? "bg-[#111111] border-[#3D3D3D]"
                    : "text-black bg-white border-[#E3E3E3]"
                }
              >
                {monthOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {onStatusChange && (
            <Select value={statusValue} onValueChange={onStatusChange}>
              <SelectTrigger
                className={`w-[90px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${
                  isDark
                    ? "bg-zinc-900 border-[#3D3D3D] text-white/70"
                    : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"
                }`}
              >
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent
                className={
                  isDark
                    ? "bg-[#111111] border-[#3D3D3D]"
                    : "text-black bg-white border-[#E3E3E3]"
                }
              >
                {statusOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-left">
          <thead className={isDark ? "bg-[#101010]" : "bg-[#FFF9EE]"}>
            <tr
              className={`text-sm ${
                isDark ? "text-[#E9D2A9]" : "text-[#7E5E2A]"
              }`}
            >
              <th className="px-6 py-5 font-medium">Date</th>
              <th className="px-6 py-5 font-medium">Client Name</th>
              <th className="px-6 py-5 font-medium">Email ID</th>
              <th className="px-6 py-5 font-medium">Total Credits Points Available</th>
              <th className="px-6 py-5 font-medium">Total Credits Used</th>
              <th className="px-6 py-5 font-medium">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="h-[360px] text-center align-middle">
                  <div className="flex h-full min-h-[360px] items-center justify-center">
                    <Loader2 className="animate-spin text-[#E8D1AB]" size={32} />
                  </div>
                </td>
              </tr>
            ) : visibleRows.length > 0 ? (
              visibleRows.map((row,index) => (
                <tr
                  key={`${row.id}-${index}`}
                  onClick={() => onRowClick?.(row)}
                  className={`border-t transition-colors ${
                    isDark
                      ? `border-[#222222] ${onRowClick ? "cursor-pointer hover:bg-white/[0.02]" : "hover:bg-white/[0.02]"}`
                      : `border-[#F1E7D9] ${onRowClick ? "cursor-pointer hover:bg-[#FFFDF9]" : "hover:bg-[#FFFDF9]"}`
                  }`}
                >
                  <td
                    className={`px-6 py-5 text-[15px] ${
                      isDark ? "text-white" : "text-[#171717]"
                    }`}
                  >
                    {formatDate(row.date)}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl text-[15px] font-medium text-[#171717]"
                        style={{ backgroundColor: row.avatarColor }}
                      >
                        {row.avatarImage ? (
                          <Image
                            src={row.avatarImage}
                            alt={row.clientName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          row.initials
                        )}
                      </div>
                      <span
                        className={`text-[15px] font-medium ${
                          isDark ? "text-white" : "text-[#171717]"
                        }`}
                      >
                        {row.clientName}
                      </span>
                    </div>
                  </td>
                  <td
                    className={`px-6 py-5 text-[15px] ${
                      isDark ? "text-[#D1D1D1]" : "text-[#3B3B3B]"
                    }`}
                  >
                    {row.email}
                  </td>
                  <td
                    className={`px-6 py-5 text-[15px] ${
                      isDark ? "text-[#F1E7D9]" : "text-[#171717]"
                    }`}
                  >
                    {row.availablePoints}
                  </td>
                  <td
                    className={`px-6 py-5 text-[15px] ${
                      row.usedPoints.startsWith("-")
                        ? "text-[#FF7A7A]"
                        : isDark
                        ? "text-[#B9D99A]"
                        : "text-[#357A38]"
                    }`}
                  >
                    {row.usedPoints}
                  </td>
                  <td
                    className={`px-6 py-5 text-[15px] ${
                      isDark ? "text-white" : "text-[#171717]"
                    }`}
                  >
                    {formatDate(row.lastActivity)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className={`py-10 text-center ${
                    isDark ? "text-white/50" : "text-[#777]"
                  }`}
                >
                  No credit history found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 lg:hidden">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-[#E8D1AB]" size={32} />
          </div>
        ) : visibleRows.length > 0 ? (
          visibleRows.map((row,index) => (
          <article
            key={`${row.id}-${index}`}
            onClick={() => onRowClick?.(row)}
            className={`rounded-[20px] border p-4 ${
              isDark
                ? `border-[#252525] bg-[#111111] ${onRowClick ? "cursor-pointer" : ""}`
                : `border-[#EFE4D6] bg-white ${onRowClick ? "cursor-pointer" : ""}`
            }`}
          >
            <div className="mb-4 flex items-center gap-3">
              <div
                className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl text-sm font-medium text-[#171717]"
                style={{ backgroundColor: row.avatarColor }}
              >
                {row.avatarImage ? (
                  <Image
                    src={row.avatarImage}
                    alt={row.clientName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  row.initials
                )}
              </div>
              <div>
                <p
                  className={`font-medium ${
                    isDark ? "text-white" : "text-[#171717]"
                  }`}
                >
                  {row.clientName}
                </p>
                <p
                  className={`text-sm ${
                    isDark ? "text-[#9F9F9F]" : "text-[#6F6F6F]"
                  }`}
                >
                  {row.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className={isDark ? "text-[#8B8B8B]" : "text-[#8A7C69]"}>
                  Date
                </p>
                <p className={isDark ? "text-white" : "text-[#171717]"}>
                  {formatDate(row.date)}
                </p>
              </div>
              <div>
                <p className={isDark ? "text-[#8B8B8B]" : "text-[#8A7C69]"}>
                  Last Activity
                </p>
                <p className={isDark ? "text-white" : "text-[#171717]"}>
                  {formatDate(row.lastActivity)}
                </p>
              </div>
              <div>
                <p className={isDark ? "text-[#8B8B8B]" : "text-[#8A7C69]"}>
                  Credits Available
                </p>
                <p className={isDark ? "text-white" : "text-[#171717]"}>
                  {row.availablePoints}
                </p>
              </div>
              <div>
                <p className={isDark ? "text-[#8B8B8B]" : "text-[#8A7C69]"}>
                  Credits Used
                </p>
                <p
                  className={
                    row.usedPoints.startsWith("-")
                      ? "text-[#FF7A7A]"
                      : isDark
                      ? "text-[#B9D99A]"
                      : "text-[#357A38]"
                  }
                >
                  {row.usedPoints}
                </p>
              </div>
            </div>
          </article>
          ))
        ) : (
          <div
            className={`py-10 text-center ${
              isDark ? "text-white/50" : "text-[#777]"
            }`}
          >
            No credit history found.
          </div>
        )}
      </div>

      {!loading && rows.length > 0 && (
        <div
          className={`flex justify-between items-center p-6 border-t transition-colors duration-300 ${
            isDark ? "border-[#333333]" : "border-[#E5E5E5]"
          }`}
        >
          <div className={`hidden lg:block text-sm ${isDark ? "text-[#666666]" : "text-[#999]"}`}>
            Showing {startCount} to {endCount} of {rows.length} entries
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => handlePageChange(safePage - 1)}
              disabled={safePage === 1}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${
                isDark
                  ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10"
                  : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"
              }`}
            >
              Previous
            </button>
            <div className="flex gap-1">
              {paginationItems.map((item, index) =>
                item === "..." ? (
                  <span
                    key={`dots-${index}`}
                    className={`px-2 py-1 text-xs ${isDark ? "text-white/30" : "text-[#999]"}`}
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => handlePageChange(item)}
                    className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${
                      safePage === item
                        ? isDark
                          ? "bg-[#E5D5B8] text-black"
                          : "bg-[#E8D1AB] text-black"
                        : isDark
                        ? "text-white/60 hover:bg-white/5"
                        : "text-[#666] hover:bg-zinc-100"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
            <button
              onClick={() => handlePageChange(safePage + 1)}
              disabled={safePage === totalPages}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${
                isDark
                  ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10"
                  : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"
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
