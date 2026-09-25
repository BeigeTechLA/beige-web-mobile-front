"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";

type DisputesAnalyticsProps = {
  isDark: boolean;
  selectedDate?: Date | null;
};

const metrics = [
  {
    label: "Disputes Raised",
    value: "76",
    width: "74%",
    valueColor: "#FFFFFF",
    gradient: "linear-gradient(90deg,#4B4B4B 0%,#7A7A7A 42%,#DCDCDC 100%)",
  },
  {
    label: "Resolved Disputes",
    value: "47",
    width: "31%",
    valueColor: "#57C78B",
    gradient: "linear-gradient(90deg,#252B28 0%,#587866 46%,#68C691 100%)",
  },
  {
    label: "Pending Disputes",
    value: "60",
    width: "52%",
    valueColor: "#E4B95B",
    gradient: "linear-gradient(90deg,#38342F 0%,#7D7058 46%,#F0BB4D 100%)",
  },
  {
    label: "Active Disputes",
    value: "88",
    width: "90%",
    valueColor: "#65B7E9",
    gradient: "linear-gradient(90deg,#3D484E 0%,#607A89 46%,#5DB0E1 100%)",
  },
];

const reasons = [
  {
    rank: "01",
    name: "Late Delivery",
    cases: "24",
    progress: 78,
    color: "#E7B64D",
  },
  {
    rank: "02",
    name: "Quality Mismatch",
    cases: "18",
    progress: 62,
    color: "#BCE8E8",
  },
  {
    rank: "03",
    name: "Scope Disagreement",
    cases: "15",
    progress: 50,
    color: "#3DBEEB",
  },
  {
    rank: "04",
    name: "Billing Error",
    cases: "10",
    progress: 30,
    color: "#E4B4DA",
  },
  {
    rank: "05",
    name: "Editing Issue",
    cases: "05",
    progress: 15,
    color: "#F15D64",
  },
];

export default function DisputesAnalytics({ isDark }: DisputesAnalyticsProps) {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <section
      className={`w-full rounded-2xl border p-5 transition-colors duration-300 lg:p-6 ${
        isDark
          ? "border-[#3D3D3D] bg-[#171717] text-white"
          : "border-[#E5E5E5] bg-white text-[#202020]"
      }`}
    >
      <div className="mb-5 flex items-center gap-2">
        <span className="h-6 w-[3px] rounded-full bg-[#E8D1AB]" />
        <h2 className="text-sm font-medium lg:text-base">Disputes Analytics</h2>
      </div>

      <div
        className={`rounded-2xl p-4 lg:p-5 ${
          isDark ? "bg-[#101010]" : "border border-[#F0F0F0] bg-white"
        }`}
      >
        <div className="space-y-5">
          {metrics.map((metric) => (
            <div key={metric.label} className="group">
              <div className="mb-2 flex items-center gap-1.5">
                <span className="text-[10px] font-medium lg:text-xs">
                  {metric.label}
                </span>
                <Info size={9} className="text-[#E8D1AB]" />
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_48px] items-center gap-4">
                <div
                  className={`h-7 overflow-hidden rounded-r-full transition-opacity group-hover:opacity-95 ${
                    isDark ? "bg-white/[0.015]" : "bg-black/[0.02]"
                  }`}
                >
                  <div
                    className="h-full rounded-r-full transition-[filter] duration-200 group-hover:brightness-110"
                    style={{
                      width: metric.width,
                      background: metric.gradient,
                    }}
                  />
                </div>

                <span
                  className="text-right text-xl font-semibold leading-none lg:text-2xl"
                  style={{ color: metric.valueColor }}
                >
                  {metric.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className={`mt-4 overflow-hidden rounded-2xl border ${
          isDark ? "border-[#2E2E2E] bg-[#101010]" : "border-[#E5E5E5] bg-white"
        }`}
      >
        <div
          className={`border-b px-4 py-4 text-sm font-medium lg:px-5 lg:text-base ${
            isDark
              ? "border-[#222222] bg-[#0A0A0A]"
              : "border-[#EEEEEE] bg-[#FFFCF6]"
          }`}
        >
          Top Dispute Reasons
        </div>

        <div
          className={`grid grid-cols-[34px_1.1fr_60px_2fr] border-b px-4 py-3 text-[9px] lg:grid-cols-[40px_1.15fr_70px_2.1fr] lg:px-5 lg:text-[10px] ${
            isDark
              ? "border-[#222222] text-white/35"
              : "border-[#EEEEEE] text-black/40"
          }`}
        >
          <span>#</span>
          <span>Name</span>
          <span className="text-right">Cases</span>
          <span className="pl-4">Progress</span>
        </div>

        <div>
          {reasons.map((reason) => (
            <div
              key={reason.rank}
              className={`grid min-h-[38px] grid-cols-[34px_1.1fr_60px_2fr] items-center border-b px-4 transition-colors last:border-b-0 lg:grid-cols-[40px_1.15fr_70px_2.1fr] lg:px-5 ${
                isDark
                  ? "border-[#202020] hover:bg-white/[0.02]"
                  : "border-[#EEEEEE] hover:bg-black/[0.02]"
              }`}
            >
              <span
                className={`text-[9px] lg:text-[10px] ${
                  isDark ? "text-white/35" : "text-black/40"
                }`}
              >
                {reason.rank}
              </span>

              <span className="text-[10px] font-medium lg:text-xs">
                {reason.name}
              </span>

              <span
                className={`text-right text-[10px] font-medium lg:text-xs ${
                  isDark ? "text-white/75" : "text-black/65"
                }`}
              >
                {reason.cases}
              </span>

              <div className="pl-4">
                <div
                  className={`h-px w-full ${
                    isDark ? "bg-[#252732]" : "bg-black/10"
                  }`}
                >
                  <div
                    className="h-px"
                    style={{
                      width: `${reason.progress}%`,
                      backgroundColor: reason.color,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          className={`flex items-center justify-between border-t px-4 py-3 lg:px-5 ${
            isDark ? "border-[#2A2A2A]" : "border-[#EEEEEE]"
          }`}
        >
          <span
            className={`text-[10px] lg:text-xs ${
              isDark ? "text-white/60" : "text-black/55"
            }`}
          >
            Page 1 to 10
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className={`flex h-8 w-8 items-center justify-center rounded-md ${
                isDark
                  ? "text-white/35 hover:bg-white/5"
                  : "text-black/35 hover:bg-black/5"
              }`}
            >
              <ChevronLeft size={14} />
            </button>

            {[1, 2, 3].map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`h-8 min-w-8 rounded-md px-2 text-[10px] lg:text-xs ${
                  currentPage === page
                    ? isDark
                      ? "border border-[#E8D1AB]/40 bg-[#1C1C1C] text-white"
                      : "border border-[#D6C19D] bg-[#F7F0E4] text-black"
                    : isDark
                      ? "text-white/40 hover:bg-white/5"
                      : "text-black/40 hover:bg-black/5"
                }`}
              >
                {page}
              </button>
            ))}

            <span className={isDark ? "text-white/30" : "text-black/30"}>
              ...
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((page) => page + 1)}
              className={`flex h-8 w-8 items-center justify-center rounded-md ${
                isDark
                  ? "text-white/35 hover:bg-white/5"
                  : "text-black/35 hover:bg-black/5"
              }`}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
