"use client";

import React from "react";
import { X, Calendar, MapPin, Clock, Download, Send } from "lucide-react";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { EarningsStatusBadge, Status } from "./EarningsStatusBadge"
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
  paymentReceipts?: Array<{
    id: string;
    title: string;
    subtitle?: string;
    amount: string;
    dateLabel: string;
    downloadUrl?: string | null;
    fileName?: string | null;
  }>;
  onDownloadProof?: () => void;
  onViewTimeline?: () => void;
}

export default function EarningsBreakdownModal({
  isOpen,
  onClose,
  shootData,
  paymentReceipts = [],
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
            <p className={`text-xs lg:text-base mt-0.5 ${isDark ? "text-white/50" : "text-black/50"}`}>
              Detailed compensation and payment information
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-3 lg:p-4 rounded-full transition-colors border cursor-pointer ${isDark
                ? "bg-[#2B2626] border-[#2B2626] text-white hover:text-white/90"
                : "bg-black/5 border-black/5 text-black hover:bg-black/10"
              }`}
          >
            <X size={28} className="w-6 h-6 lg:w-7 lg:h-7" />
          </button>
        </div>

        <hr className={`border-t ${isDark ? "border-[#CACACA]" : "border-black/10"}`} />

        <div className="p-4 lg:p-9">
          <div className="space-y-4 lg:space-y-6">
            {/* Section 1: Shoot Information Card Wrapper */}
            <div className="space-y-3 lg:space-y-4 ">
              <h3 className={`text-base lg:text-xl font-semibold capitalize ${isDark ? "text-white" : "text-black"}`}>
                Shoot Information
              </h3>
              <div className={`rounded-lg p-4 space-y-3 lg:space-y-4 ${isDark ? "bg-[#1F1F1F]" : "bg-black/[0.02] border border-black/5"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-xs lg:text-sm ${isDark ? "text-[#6B6864]" : "text-black/40"}`}>Shoot Name</p>
                    <p className={`text-sm lg:text-base font-semibold mt-0.5 ${isDark ? "text-white" : "text-black"}`}>
                      {data.shootName}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs lg:text-sm ${isDark ? "text-[#6B6864]" : "text-black/40"}`}>Client</p>
                    <p className={`text-sm lg:text-base font-medium mt-0.5 ${isDark ? "text-white" : "text-black"}`}>
                      {data.clientName}
                    </p>
                  </div>
                  {/* <div>
                    <p className={`text-xs lg:text-sm mb-1 ${isDark ? "text-[#6B6864]" : "text-black/40"}`}>Status</p>
                    <EarningsStatusBadge status={data.status} />
                  </div> */}
                </div>

                <hr className={`border-t ${isDark ? "border-white/40" : "border-black/10"}`} />

                <div className={`flex flex-wrap gap-x-4 lg:gap-x-8 gap-y-2 text-xs lg:text-sm ${isDark ? "text-white" : "text-black/80"}`}>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className={isDark ? "text-[#6B6864]" : "text-black/40"} />
                    <span>{data.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className={isDark ? "text-[#6B6864]" : "text-black/40"} />
                    <span>{data.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className={isDark ? "text-[#6B6864]" : "text-black/40"} />
                    <span>{data.timeWindow}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Compensation Breakdown Itemized List */}
            <div className="space-y-3 lg:space-y-4 ">
              <h3 className={`text-base lg:text-xl font-semibold capitalize ${isDark ? "text-white" : "text-black"}`}>
                Compensation Breakdown
              </h3>
              <div className={`space-y-3 lg:space-y-4 rounded-lg p-4 text-sm lg:text-base ${isDark ? "bg-[#1F1F1F]" : "bg-black/[0.02] border border-black/5"}`}>
                <div className="flex justify-between items-center">
                  <span className={isDark ? "text-white/50" : "text-black/50"}>Base Shoot Compensation</span>
                  <span className={`font-semibold ${isDark ? "text-white" : "text-black"}`}>
                    {formatCurrency(data.breakdown.baseShoot)}
                  </span>
                </div>
                <hr className={`border-t ${isDark ? "border-white/40" : "border-black/10"}`} />

                <div className="flex justify-between items-center">
                  <span className={isDark ? "text-white/50" : "text-black/50"}>Editing Compensation</span>
                  <span className={`font-semibold ${isDark ? "text-white" : "text-black"}`}>
                    {formatCurrency(data.breakdown.editing)}
                  </span>
                </div>
                <hr className={`border-t ${isDark ? "border-white/40" : "border-black/10"}`} />

                <div className="flex justify-between items-center">
                  <span className={isDark ? "text-white/50" : "text-black/50"}>Travel Adjustment</span>
                  <span className={`font-semibold ${isDark ? "text-white" : "text-black"}`}>
                    {formatCurrency(data.breakdown.travel)}
                  </span>
                </div>
                <hr className={`border-t ${isDark ? "border-white/40" : "border-black/10"}`} />

                <div className="flex justify-between items-center">
                  <span className={isDark ? "text-white/50" : "text-black/50"}>Bonus Compensation</span>
                  <span className={`font-semibold ${isDark ? "text-white" : "text-black"}`}>
                    {formatCurrency(data.breakdown.bonus)}
                  </span>
                </div>
                <hr className={`border-t ${isDark ? "border-white/40" : "border-black/10"}`} />

                <div className="flex justify-between items-center pt-1">
                  <span className={isDark ? "text-zinc-300" : "text-black/70"}>Total Compensation</span>
                  <span className="text-lg lg:text-2xl font-semibold text-[#E8D1AB]">
                    {formatCurrency(totalCompensation)}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: Payment Breakdown Block Panels */}
            <div className="space-y-3 lg:space-y-4 ">
              <h3 className={`text-base lg:text-xl font-semibold capitalize ${isDark ? "text-white" : "text-black"}`}>
                Payment Breakdown
              </h3>

              <div className="grid grid-cols-1 gap-3 lg:gap-4">
                {/* Advance Payment Module */}
                <div className={`rounded-lg p-3 lg:p-6 flex flex-col gap-2 border ${isDark
                    ? "bg-[#011A12] border-[#011A12]"
                    : "bg-[#E6F4EA] border-[#10B98122]"
                  }`}>
                  <div className="flex justify-between items-center">
                    <p className={`text-xs lg:text-sm font-medium ${isDark ? "text-[#10B981]" : "text-[#137333]"}`}>Advance Payment Received</p>
                    <p className={`text-lg lg:text-2xl font-bold mt-2 tracking-tight ${isDark ? "text-[#10B981]" : "text-[#137333]"}`}>
                      {formatCurrency(data.advance.amount)}
                    </p>
                  </div>
                  <p className={`text-xs ${isDark ? "text-white" : "text-black/70"}`}>
                    Received on {data.advance.date}
                  </p>
                </div>

                {/* Remaining Balance Module */}
                <div className={`rounded-xl p-3 lg:p-6 flex flex-col gap-2 border ${isDark
                    ? "bg-[#210402] border-[#F6605433]"
                    : "bg-[#FCE8E6] border-[#F6605422]"
                  }`}>
                  <div className="flex justify-between items-center">
                    <p className={`text-xs lg:text-sm font-medium ${isDark ? "text-[#F66054]" : "text-[#C5221F]"}`}>Remaining Balance</p>
                    <p className={`text-lg lg:text-2xl font-bold mt-2 tracking-tight ${isDark ? "text-[#F66054]" : "text-[#C5221F]"}`}>
                      {formatCurrency(data.remainingBalance)}
                    </p>
                  </div>
                  <p className={`text-xs ${isDark ? "text-white" : "text-black/70"}`}>
                    Payable after shoot completion and finance approval
                  </p>
                </div>
              </div>
            </div>

            {paymentReceipts.length > 0 && (
              <div className="space-y-3 lg:space-y-4">
                <h3 className="text-base lg:text-xl font-semibold text-white capitalize">
                  Payment Receipts
                </h3>
                <div className="rounded-lg bg-[#1F1F1F] divide-y divide-white/10 overflow-hidden">
                  {paymentReceipts.map((receipt) => (
                    <div key={receipt.id} className="flex items-center justify-between gap-3 p-3 lg:p-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="text-sm font-semibold text-white">{receipt.title}</p>
                          <span className="text-sm font-bold text-[#E8D1AB]">{receipt.amount}</span>
                        </div>
                        <p className="mt-1 text-xs text-white/50 truncate">
                          {receipt.dateLabel}{receipt.subtitle ? ` - ${receipt.subtitle}` : ""}
                        </p>
                      </div>
                      {receipt.downloadUrl ? (
                        <a
                          href={receipt.downloadUrl}
                          download={receipt.fileName || "payment-proof.pdf"}
                          className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/80 transition-colors hover:border-[#E8D1AB] hover:text-[#E8D1AB]"
                          title={`Download ${receipt.fileName || "payment proof"}`}
                        >
                          <Download size={15} />
                        </a>
                      ) : (
                        <span className="shrink-0 text-xs text-white/30">No proof</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 4: Progress Indicator Metric Tracking Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs lg:text-sm">
                <span className={isDark ? "text-white/60" : "text-black/50"}>Payment Progress</span>
                <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{data.paymentProgress}% Paid</span>
              </div>
              <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? "bg-[#1F1F1F]" : "bg-black/10"}`}>
                <div
                  className="h-full bg-[#10B981] rounded-full transition-all duration-300"
                  style={{ width: `${data.paymentProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs pt-0.5">
                <span className={`font-medium ${isDark ? "text-[#10B981]" : "text-[#137333]"}`}>
                  {formatCurrency(data.advance.amount)} paid
                </span>
                <span className={`font-medium ${isDark ? "text-[#F66054]" : "text-[#C5221F]"}`}>
                  {formatCurrency(data.remainingBalance)} remaining
                </span>
              </div>
            </div>
          </div>

          {/* Persistent Shared Action Interactive Footer Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-8 pt-2">
            <button
              onClick={onDownloadProof}
              disabled={paymentReceipts.length !== 1}
              className="h-14 lg:h-12 rounded-lg border border-[#262626] lg:border-[#8E8E8E] bg-[#1F1F1F] lg:bg-[#101010] hover:bg-[#101010]/90 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} className={isDark ? "text-white" : "text-black/70"} />
              <span>{paymentReceipts.length > 1 ? "Use Receipt List" : "Download Payment Proof"}</span>
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
