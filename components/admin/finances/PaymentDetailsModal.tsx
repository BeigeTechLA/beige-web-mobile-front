"use client";

import React from "react";
import { X } from "lucide-react";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { TransactionStatusBadge, TransactionStatus } from "./TransactionsTable";

export interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  payoutData: {
    accountHolder?: string;
    accountNumber?: string;
    payoutAmount?: string;
    phoneNumber?: string;
    date?: string;
    accountType?: string;
    branchName?: string;
    status: TransactionStatus | undefined;
    initialsLeft?: string;
    initialsRight?: string;
  };
}

export default function PaymentDetailsModal({
  isOpen,
  onClose,
  payoutData,
}: PaymentDetailsModalProps) {
  const { isDark } = useResolvedTheme();

  if (!isOpen) return null;
  const activeStatus: TransactionStatus = payoutData.status ?? "Pending";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101010CC] font-sans backdrop-blur-sm animate-in fade-in duration-200 p-4">
      {/* Backdrop Trigger Dismissal */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Container Card Frame */}
      <div className={`relative h-auto w-full lg:max-w-2xl flex flex-col border rounded-lg lg:rounded-2xl overflow-y-auto animate-in slide-in-from-bottom duration-200 ${isDark
        ? "border-white/40 bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.62)]"
        : "border-[#D7D7D7] bg-white text-black shadow-2xl"
        }`}
      >
        {/* Header Block Section */}
        <div className="flex items-center justify-between p-4 lg:p-9">
          <h2 className="text-xl lg:text-3xl font-bold tracking-tight">Earnings Breakdown</h2>
          <button
            onClick={onClose}
            className={`p-3 lg:p-4 rounded-full transition-colors border ${isDark ? "bg-[#2B2626] text-white hover:text-white/90 border-[#2B2626]":"bg-[#F0F0F0] text-black hover:text-black/90 border-[#F0F0F0]"}`}
          >
            <X size={28} className="w-6 h-6 lg:w-7 lg:h-7" />
          </button>
        </div>

        <hr className={`border-t ${isDark ? "border-[#CACACA]" : "border-[#000000]/30"}`} />

        <div className="p-4 lg:p-9">
          {/* Informational Key-Value Metrics Stack Matrix Grid Layout */}
          <div className="space-y-4 lg:space-y-6 text-base lg:text-xl">
            <div className="flex justify-between items-center">
              <span className={isDark ? "text-[#AEAEAE]" : "text-black/50"}>Account Holder</span>
              <span className="font-medium">{payoutData.accountHolder}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className={isDark ? "text-[#AEAEAE]" : "text-black/50"}>Account Number</span>
              <span className="font-medium">{payoutData.accountNumber}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className={isDark ? "text-[#AEAEAE]" : "text-black/50"}>Payout Amount</span>
              <span className="font-medium text-[#16A34A]">{payoutData.payoutAmount}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className={isDark ? "text-[#AEAEAE]" : "text-black/50"}>Phone Number</span>
              <span className="font-medium">{payoutData.phoneNumber}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className={isDark ? "text-[#AEAEAE]" : "text-black/50"}>Date</span>
              <span className="font-medium">{payoutData.date}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className={isDark ? "text-[#AEAEAE]" : "text-black/50"}>Account Type</span>
              <span className="font-medium">{payoutData.accountType}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className={isDark ? "text-[#AEAEAE]" : "text-black/50"}>Branch Name</span>
              <span className="font-medium">{payoutData.branchName}</span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className={isDark ? "text-[#AEAEAE]" : "text-black/50"}>Status</span>
              <TransactionStatusBadge status={activeStatus} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}