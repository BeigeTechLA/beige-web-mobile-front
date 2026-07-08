"use client";

import React from "react";
import { X, Calendar, MapPin, Clock, Download, Send } from "lucide-react";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { EarningsStatusBadge, Status } from "./EarningsStatusBadge";
import { formatCurrency } from "@/lib/utils";

interface EarningsBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  shootData?: {
    shootName: string;
    clientName: string;
    status: Status;
    date: string;
    location: string;
    timeWindow: string;
    breakdown: {
      baseShoot: number;
      editing: number;
      travel: number;
      bonus: number;
    };
    advance: {
      amount: number;
      date: string;
    };
    remainingBalance: number;
    paymentProgress: number; // e.g., 25
  };
  onDownloadProof?: () => void;
  onViewTimeline?: () => void;
}

export default function EarningsBreakdownModal({
  isOpen,
  onClose,
  shootData,
  onDownloadProof,
  onViewTimeline,
}: EarningsBreakdownModalProps) {
  const { isDark } = useResolvedTheme();

  if (!isOpen) return null;

  // Fallback structural initialization matching the exact image example values
  const data = shootData || {
    shootName: "",
    clientName: "",
    status: "",
    date: "",
    location: "",
    timeWindow: "",
    breakdown: {
      baseShoot: 0,
      editing: 0,
      travel: 0,
      bonus: 0,
    },
    advance: {
      amount: 0,
      date: "",
    },
    remainingBalance: 0,
    paymentProgress: 0,
  };

  const totalCompensation =
    data.breakdown.baseShoot +
    data.breakdown.editing +
    data.breakdown.travel +
    data.breakdown.bonus;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-[#101010CC] font-sans backdrop-blur-sm animate-in fade-in duration-200 p-0">
      {/* Backdrop Trigger Dismissal */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Container Card Frame */}
      <div className={`relative h-full w-full lg:max-w-2xl flex flex-col border rounded-lg lg:rounded-r-none lg:rounded-l-2xl overflow-y-auto animate-in slide-in-from-right duration-200 ${isDark
        ? "border-white/40 bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.62)]"
        : "border-[#D7D7D7] bg-white text-black shadow-2xl"
        }`}
      >
        {/* Header Block Section */}
        <div className="flex items-start justify-between p-4 lg:p-9">
          <div>
            <h2 className="text-xl lg:text-3xl font-bold tracking-tight">Earnings Breakdown</h2>
            <p className="text-xs lg:text-base text-white/50 mt-0.5">
              Detailed compensation and payment information
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 lg:p-4 rounded-full bg-[#2B2626] text-white hover:text-white/90 transition-colors border border-[#2B2626]"
          >
            <X size={28} className="w-6 h-6 lg:w-7 lg:h-7" />
          </button>
        </div>

        <hr className={`border-t ${isDark ? "border-[#CACACA]" : "border-[#000000]/30"}`} />

        <div className="p-4 lg:p-9">
          <div className="space-y-4 lg:space-y-6">
            {/* Section 1: Shoot Information Card Wrapper */}
            <div className="space-y-3 lg:space-y-4 ">
              <h3 className="text-base lg:text-xl font-semibold text-white capitalize">
                Shoot Information
              </h3>
              <div className="rounded-lg bg-[#1F1F1F] p-4 space-y-3 lg:space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[#6B6864] text-xs lg:text-sm">Shoot Name</p>
                    <p className="text-sm lg:text-base font-semibold text-white mt-0.5">
                      {data.shootName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#6B6864] text-xs lg:text-sm">Client</p>
                    <p className="text-sm lg:text-base font-medium text-white mt-0.5">
                      {data.clientName}
                    </p>
                  </div>
                  {/* <div>
                    <p className="text-[#6B6864] text-xs lg:text-sm">Status</p>
                    <EarningsStatusBadge status={data.status} />
                  </div> */}
                </div>

                <hr className={`border-t ${isDark ? "border-white/40" : "border-[#000000]/30"}`} />

                <div className="flex flex-wrap gap-x-4 lg:gap-x-8 gap-y-2 text-xs lg:text-sm text-white">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-[#6B6864]" />
                    <span>{data.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-[#6B6864]" />
                    <span>{data.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-[#6B6864]" />
                    <span>{data.timeWindow}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Compensation Breakdown Itemized List */}
            <div className="space-y-3 lg:space-y-4 ">
              <h3 className="text-base lg:text-xl font-semibold text-white capitalize">
                Compensation Breakdown
              </h3>
              <div className="space-y-3 lg:space-y-4 rounded-lg bg-[#1F1F1F] p-4 text-sm lg:text-base">
                <div className="flex justify-between items-center">
                  <span className="text-xs lg:text-sm text-white/50">Base Shoot Compensation</span>
                  <span className="font-semibold text-white">
                    {formatCurrency(data.breakdown.baseShoot)}
                  </span>
                </div>
                <hr className={`border-t ${isDark ? "border-white/40" : "border-[#000000]/30"}`} />

                <div className="flex justify-between items-center">
                  <span className="text-xs lg:text-sm text-white/50">Editing Compensation</span>
                  <span className="font-semibold text-white">
                    {formatCurrency(data.breakdown.editing)}
                  </span>
                </div>
                <hr className={`border-t ${isDark ? "border-white/40" : "border-[#000000]/30"}`} />

                <div className="flex justify-between items-center">
                  <span className="text-xs lg:text-sm text-white/50">Travel Adjustment</span>
                  <span className="font-semibold text-white">
                    {formatCurrency(data.breakdown.travel)}
                  </span>
                </div>
                <hr className={`border-t ${isDark ? "border-white/40" : "border-[#000000]/30"}`} />

                <div className="flex justify-between items-center">
                  <span className="text-xs lg:text-sm text-white/50">Bonus Compensation</span>
                  <span className="font-semibold text-white">
                    {formatCurrency(data.breakdown.bonus)}
                  </span>
                </div>
                <hr className={`border-t ${isDark ? "border-white/40" : "border-[#000000]/30"}`} />

                <div className="flex justify-between items-center pt-1">
                  <span className="font-medium text-zinc-300">Total Compensation</span>
                  <span className="text-lg lg:text-2xl font-semibold text-[#E8D1AB]">
                    {formatCurrency(totalCompensation)}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: Payment Breakdown Block Panels */}
            <div className="space-y-3 lg:space-y-4 ">
              <h3 className="text-base lg:text-xl font-semibold text-white capitalize">
                Payment Breakdown
              </h3>

              <div className="grid grid-cols-1 gap-3 lg:gap-4">
                {/* Advance Payment Module */}
                <div className="rounded-lg bg-[#011A12] border border-[#011A12] p-3 lg:p-6 flex flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <p className="text-xs lg:text-sm font-medium text-[#10B981]">Advance Payment Received</p>
                    <p className="text-lg lg:text-2xl font-bold text-[#10B981] mt-2 tracking-tight">
                      {formatCurrency(data.advance.amount)}
                    </p>
                  </div>
                  <p className="text-xs text-white">
                    Received on {data.advance.date}
                  </p>
                </div>

                {/* Remaining Balance Module */}
                <div className="rounded-xl bg-[#210402] border border-[#F6605433] p-3 lg:p-6 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <p className="text-xs lg:text-sm font-medium text-[#F66054]">Remaining Balance</p>
                    <p className="text-lg lg:text-2xl font-bold text-[#F66054] mt-2 tracking-tight">
                      {formatCurrency(data.remainingBalance)}
                    </p>
                  </div>
                  <p className="text-xs text-white">
                    Payable after shoot completion and finance approval
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4: Progress Indicator Metric Tracking Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs lg:text-sm">
                <span className="text-white/60">Payment Progress</span>
                <span className="text-white font-medium">{data.paymentProgress}% Paid</span>
              </div>
              <div className="w-full h-2.5 bg-[#1F1F1F] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#10B981] rounded-full transition-all duration-300"
                  style={{ width: `${data.paymentProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs pt-0.5">
                <span className="text-[#10B981] font-medium">
                  {formatCurrency(data.advance.amount)} paid
                </span>
                <span className="text-[#F66054] font-medium">
                  {formatCurrency(data.remainingBalance)} remaining
                </span>
              </div>
            </div>
          </div>

          {/* Persistent Shared Action Interactive Footer Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-8 pt-2">
            <button
              onClick={onDownloadProof}
              className="h-14 lg:h-12 rounded-lg border border-[#262626] lg:border-[#8E8E8E] bg-[#1F1F1F] lg:bg-[#101010] hover:bg-[#101010]/90 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Download size={16} className="text-white" />
              <span>Download Payment Proof</span>
            </button>
            <button
              onClick={onViewTimeline}
              className="h-14 lg:h-12 rounded-lg bg-[#E8D1AB] hover:bg-[#E5D5B8] text-[#101010] font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Send size={16} />
              <span>View Payout Timeline</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}