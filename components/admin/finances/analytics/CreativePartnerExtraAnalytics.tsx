"use client";

import React, { useMemo, useState } from "react";
import { Info, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = { isDark: boolean; selectedDate?: Date | null };
type PayoutRow = {
  label: string;
  amount: string;
  upcoming: number;
  soon: number;
  later: number;
  overdue: number;
};
type OverdueRow = { name: string; amount: number; days: number };

const previewPayouts: PayoutRow[] = [
  {
    label: "This Week",
    amount: "$48M",
    upcoming: 30,
    soon: 18,
    later: 31,
    overdue: 0,
  },
  {
    label: "Next Week",
    amount: "$72M",
    upcoming: 16,
    soon: 31,
    later: 18,
    overdue: 0,
  },
  {
    label: "2-4 Weeks",
    amount: "$99M",
    upcoming: 30,
    soon: 10,
    later: 39,
    overdue: 21,
  },
  {
    label: "Overdue",
    amount: "$102M",
    upcoming: 42,
    soon: 6,
    later: 0,
    overdue: 52,
  },
];

const previewOverdue: OverdueRow[] = [
  { name: "Ethan Carter", amount: 10000, days: 12 },
  { name: "Sophia Johnson", amount: 7560, days: 9 },
  { name: "John Lee", amount: 5125, days: 7 },
  { name: "Arvi Ross", amount: 3456, days: 5 },
  { name: "Raj Yadav", amount: 1500, days: 1 },
];

const colors = {
  upcoming: "#55B98F",
  soon: "#9757DB",
  later: "#598FEF",
  overdue: "#DB5D77",
};
const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export default function CreativePartnerExtraAnalytics({ isDark }: Props) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [period, setPeriod] = useState("month");
  const [sort, setSort] = useState("days");

  const overdueRows = useMemo(() => {
    const filtered = previewOverdue.filter((row) =>
      row.name.toLowerCase().includes(search.trim().toLowerCase()),
    );
    if (status === "over30") return filtered.filter((row) => row.days > 30);
    if (status === "over7") return filtered.filter((row) => row.days > 7);
    return filtered.sort((a, b) =>
      sort === "amount" ? b.amount - a.amount : b.days - a.days,
    );
  }, [search, status, sort]);

  const panel = isDark
    ? "border-[#303030] bg-[#101010] text-white"
    : "border-[#E5E5E5] bg-white text-[#202020]";
  const muted = "text-[#777777]";
  const dropdown = isDark
    ? "border-[#454545] bg-[#1B1B1B] text-white/80"
    : "border-[#DADADA] bg-white text-[#333333]";
  const dropdownContent = isDark
    ? "border-[#454545] bg-[#191919] text-white"
    : "border-[#DADADA] bg-white text-[#202020]";

  return (
    <div className="mt-4 grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[1.62fr_1fr]">
      <div className={`min-w-0 overflow-hidden rounded-2xl border ${panel}`}>
        <div
          className={`flex min-h-[54px] items-center gap-2 border-b px-5 py-4 text-sm font-medium lg:text-base ${isDark ? "border-[#222222] bg-[#080808]" : "border-[#EAEAEA] bg-[#FFFCF6]"}`}
        >
          CP Payout Timeline <Info size={12} className="text-[#E8D1AB]" />
        </div>
        <div className="space-y-6 px-4 pb-5 pt-5 lg:px-5">
          {previewPayouts.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[75px_minmax(0,1fr)_52px] items-center gap-3 sm:grid-cols-[95px_minmax(0,1fr)_60px]"
            >
              <span className={`text-[11px] lg:text-xs ${muted}`}>
                {row.label}
              </span>
              <div
                className={`flex h-8 w-full overflow-hidden rounded-lg ${isDark ? "bg-[#1D1D1D]" : "bg-[#F0F0F0]"}`}
                title={`${row.label} payout distribution (preview data)`}
              >
                {(["upcoming", "soon", "later", "overdue"] as const).map(
                  (key) =>
                    row[key] > 0 ? (
                      <span
                        key={key}
                        className="h-full"
                        style={{
                          width: `${row[key]}%`,
                          backgroundColor: colors[key],
                        }}
                      />
                    ) : null,
                )}
              </div>
              <span className="text-right text-xs font-medium lg:text-sm">
                {row.amount}
              </span>
            </div>
          ))}
          <div
            className={`rounded-lg border p-3 ${isDark ? "border-[#303030] bg-[#070707]" : "border-[#EAEAEA] bg-[#FFFCF6]"}`}
          >
            <p className="mb-2 text-xs font-semibold">Color Legend</p>
            <div
              className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-[10px] ${muted}`}
            >
              {(
                [
                  ["Upcoming", colors.upcoming],
                  ["Due Soon (1-2 Week)", colors.soon],
                  ["Later (3-4 Week)", colors.later],
                  ["Overdue", colors.overdue],
                ] as const
              ).map(([name, color]) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`min-w-0 overflow-hidden rounded-2xl border ${isDark ? "border-[#81454C] bg-[#241B1C] text-white" : "border-[#E5B9BB] bg-[#FFF5F5] text-[#202020]"}`}
      >
        <div className="flex min-w-0 items-center justify-between gap-2 px-4 pb-3 pt-4 lg:px-5">
          <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[13px] font-medium lg:text-base">
            Top Overdue CPs{" "}
            <Info size={11} className="shrink-0 text-[#E8D1AB]" />
          </div>
          <div className="flex min-w-0 shrink-0 items-center gap-1.5">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger
                className={`h-8 w-[70px] rounded-full px-2 text-[10px] shadow-none focus:ring-0 lg:w-[82px] ${dropdown}`}
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className={dropdownContent}>
                <SelectItem value="all">Status</SelectItem>
                <SelectItem value="over7">Over 7 days</SelectItem>
                <SelectItem value="over30">Over 30 days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger
                className={`h-8 w-[67px] rounded-full px-2 text-[10px] shadow-none focus:ring-0 lg:w-[77px] ${dropdown}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={dropdownContent}>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger
                className={`h-8 w-[54px] rounded-full px-2 text-[10px] shadow-none focus:ring-0 lg:w-[67px] ${dropdown}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={dropdownContent}>
                <SelectItem value="days">All</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="relative mx-4 mb-4 lg:mx-5">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by CP Name..."
            className={`h-10 w-full rounded-lg border pl-10 pr-3 text-xs outline-none ${isDark ? "border-[#393536] bg-[#151515] text-white placeholder:text-white/35" : "border-[#E8C8C8] bg-white text-black placeholder:text-black/45"}`}
          />
        </div>
        <div className="overflow-x-auto">
          <div className="grid min-w-[340px] grid-cols-[minmax(0,1.3fr)_minmax(90px,1fr)_80px] gap-2 border-y border-[#81454C] px-4 py-3 text-[10px] font-medium text-[#E8D1AB] lg:px-5 lg:text-xs">
            <span>CP Name</span>
            <span>Overdue Amount</span>
            <span>Days Overdue</span>
          </div>
          <div className="min-w-[340px] px-4 py-2 lg:px-5">
            {overdueRows.length === 0 ? (
              <p className={`py-10 text-center text-xs ${muted}`}>
                No matching creative partners
              </p>
            ) : (
              overdueRows.map((row) => (
                <div
                  key={row.name}
                  className="grid min-h-[45px] grid-cols-[minmax(0,1.3fr)_minmax(90px,1fr)_80px] items-center gap-2 text-[11px] lg:text-xs"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E8D1AB] text-[10px] font-semibold text-[#171717]">
                      {row.name
                        .split(" ")
                        .map((name) => name[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <span className="truncate">{row.name}</span>
                  </div>
                  <span className="text-[#E8D1AB]">{money(row.amount)}</span>
                  <span className="text-[#FF6372]">
                    {String(row.days).padStart(2, "0")} Day
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
