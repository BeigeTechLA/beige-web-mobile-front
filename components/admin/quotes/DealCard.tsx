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
      className={`rounded-xl transition-all ${
        isDark
          ? "bg-[#202020] text-white"
          : "border border-gray-200 bg-white text-black shadow-sm"
      }`}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between p-3 lg:p-5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 lg:h-12 lg:w-12 shrink-0 items-center justify-center rounded-lg text-sm lg:text-xl font-medium ${
              isDark ? "bg-[#FFF8E7] text-black" : "bg-zinc-100 text-black"
            }`}
          >
            {deal.initials}
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-medium text-sm lg:text-base font-medium">
              <span className={isDark ? "text-white" : "text-black"}>{deal.name}</span>
              <span className="text-[#E8D1AB]">
                ({deal.quoteId})
              </span>
            </div>
            <p
              className={`text-xs lg:text-sm ${
                isDark ? "text-white/40" : "text-black/40"
              }`}
            >
              {deal.email}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={`inline-flex whitespace-nowrap items-center justify-center px-3 py-1 lg:px-4 lg:py-2 rounded-full text-xs lg:text-sm font-medium ${getQuoteStatusPillClasses(
            deal.status
          )}`}
        >
          {formatQuoteStatusText(deal.status)}
        </span>
      </div>

      {/* Divider */}
      <div
        className={`border-t ${
          isDark ? "border-white/50" : "border-black/50"
        }`}
      />

      {/* Details Grid */}
      <div className="space-y-2 pt-2 text-xs lg:text-sm p-3 lg:p-5">
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
