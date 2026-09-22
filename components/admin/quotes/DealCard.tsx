"use client";

import React from "react";
import { DealItem } from "./DealColumn";

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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-xl font-medium ${
              isDark ? "bg-[#FFF8E7] text-black" : "bg-zinc-100 text-black"
            }`}
          >
            {deal.initials}
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-medium text-base font-medium">
              <span className={isDark ? "text-white" : "text-black"}>{deal.name}</span>
              <span className="text-[#E8D1AB]">
                ({deal.quoteId})
              </span>
            </div>
            <p
              className={`text-sm ${
                isDark ? "text-white/40" : "text-black/40"
              }`}
            >
              {deal.email}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <span className="rounded-full bg-[#D4FFE4] px-4 py-1.5 text-sm lg:text-base text-center font-medium text-[#16A34A]">
          {deal.status}
        </span>
      </div>

      {/* Divider */}
      <div
        className={`border-t ${
          isDark ? "border-white/50" : "border-black/50"
        }`}
      />

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
