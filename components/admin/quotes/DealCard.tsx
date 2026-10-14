"use client";

import React from "react";
import { DealItem } from "./DealColumn";
import { formatQuoteStatusText, getQuoteStatusPillClasses } from "./OpenPipeline";

type DealCardProps = {
  deal: DealItem;
  isDark?: boolean;
};

// Component 1: DealCard
export const DealCard = ({ deal, isDark = true }: DealCardProps) => {
  return (
    <div
      className={`rounded-xl transition-all ${isDark
        ? "bg-[#202020] text-white"
        : "border border-gray-200 bg-white text-black shadow-sm"
        }`}
    >
      {/* Header Info */}
      <div className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-xl font-medium ${isDark ? "bg-[#FFF8E7] text-black" : "bg-zinc-100 text-black"
              }`}
          >
            {deal.initials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-1.5 text-base font-medium lg:flex-nowrap">
              <span
                title={deal.name}
                className={`min-w-0 max-w-full truncate ${isDark ? "text-white" : "text-black"}`}
              >
                {deal.name}
              </span>
              <span className="shrink-0 whitespace-nowrap text-[#E8D1AB]">
                ({deal.quoteId})
              </span>
            </div>
            <p
              title={deal.email}
              className={`truncate text-sm ${isDark ? "text-white/40" : "text-black/40"}`}
            >
              {deal.email}
            </p>
          </div>
        </div>

        {/* Status badge: full-width pill on mobile, compact on desktop */}
        <span className="w-full shrink-0 whitespace-nowrap rounded-full bg-[#D4FFE4] px-4 py-1.5 text-center text-sm font-medium text-[#16A34A] lg:w-auto lg:text-base">
          {deal.status}
        </span>
      </div>

      {/* Divider */}
      <div className={`border-t ${isDark ? "border-white/50" : "border-black/50"}`} />

      {/* Details Grid */}
      <div className="space-y-2 pt-5 text-xs lg:text-sm p-5">
        <div className="flex justify-between">
          <span className="text-[#E8D1AB] font-medium">
            Project
          </span>
          <span className="font-medium truncate max-w-[170px]">
            {deal.project}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-[#E8D1AB] font-medium">
            Booking Status
          </span>
          <span className="font-medium text-[#39DE76]">
            {deal.bookingStatus}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-[#E8D1AB] font-medium">
            Amount
          </span>
          <span className="text-[#E8D1AB]">{deal.amount}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-[#E8D1AB] font-medium">
            Paid
          </span>
          <span>{deal.paid}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-[#E8D1AB] font-medium">
            Pending
          </span>
          <span className="font-medium text-[#F19831]">{deal.pending}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-[#E8D1AB] font-medium">
            Validity
          </span>
          <span>{deal.validity}</span>
        </div>
      </div>
    </div>
  );
};
