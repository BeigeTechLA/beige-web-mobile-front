"use client";

import React, { useState } from "react";
import { X, CheckCircle2, Edit3, XCircle, Clock } from "lucide-react";
import { ShootCPRow } from "@/components/admin/finances/CPPayoutTable";
import { formatCurrency } from "@/lib/utils";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

interface CompensationItem {
  id: string;
  name: string;
  role: string;
  total: number;
  base: number;
  editing: number;
  travel: number;
  bonus: number;
  hasAdvance?: boolean;
  advanceAmount?: number;
  advanceDate?: string;
}

interface CompensationModalProps {
  isOpen: boolean;
  onClose: () => void;
  rowContext: ShootCPRow | null;
  onModifyClick: () => void;
  onApproveClick: () => void;
  onRejectClick: () => void;
}

export default function CompensationModal({
  isOpen,
  onClose,
  rowContext,
  onModifyClick,
  onApproveClick,
  onRejectClick
}: CompensationModalProps) {
  const [selectedCreators, setSelectedCreators] = useState<string[]>(["c1"]);

  const { isDark } = useResolvedTheme()

  if (!isOpen || !rowContext) return null;

  const compensationList: CompensationItem[] = [
    {
      id: "c1",
      name: "Ethan Cole",
      role: "Lead Photographer",
      total: 6500,
      base: 5000,
      editing: 750,
      travel: 500,
      bonus: 250,
    },
    {
      id: "c2",
      name: "Michael Chen",
      role: "Videographer",
      total: 5500,
      base: 4000,
      editing: 600,
      travel: 500,
      bonus: 400,
      hasAdvance: true,
      advanceAmount: 2000,
      advanceDate: "01-06-2026",
    },
  ];

  const handleCheckboxChange = (id: string) => {
    setSelectedCreators((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-[#101010CC] font-sans backdrop-blur-sm animate-in fade-in duration-200 p-4 lg:p-0">
      {/* Backdrop Trigger Dismissal */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-Over Drawer Container Panel */}
      <div className={`relative h-full w-full lg:max-w-3xl flex flex-col border rounded-lg lg:rounded-r-none lg:rounded-l-2xl overflow-y-auto animate-in slide-in-from-right duration-200 ${isDark
        ? "border-white/40 bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.62)]"
        : "border-[#D7D7D7] bg-white text-black shadow-2xl"
        }`}>
        {/* Header Block Section */}
        <div className="sticky top-0 inset-x-0 flex items-start justify-between p-5 lg:px-9 lg:py-10 bg-[#000000]  border-b border-[#CACACA]">
          <div className="flex flex-col gap-1.5 lg:gap-4">
            <h2 className="text-lg lg:text-3xl font-bold tracking-tight">
              {rowContext.shootName || "Corporate Shoot"}
            </h2>
            <p className="text-sm lg:text-base text-white/50 font-normal capitalize">
              {rowContext.category || "Videography"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 lg:p-4 rounded-full bg-[#2B2626] text-white transition-colors"
          >
            <X className="w-5 h-5 lg:h-7 lg:w-7" />
          </button>
        </div>

        <div className="space-y-3 lg:space-y-5 p-5 lg:p-9">
          {/* Quick Statistics Horizontal Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
            <div className="bg-[#171717] border border-[#3D3D3D] rounded-lg p-2.5 lg:p-4">
              <p className="text-sm text-white">Total CP Payout</p>
              <p className="text-lg lg:text-2xl font-bold text-[#83B7FA] mt-0.5 lg:mt-1">
                {formatCurrency(rowContext.cpPayout || 12500)}
              </p>
            </div>
            <div className="bg-[#171717] border border-[#3D3D3D] rounded-lg p-2.5 lg:p-4">
              <p className="text-sm text-white">Shoot Amount</p>
              <p className="text-lg lg:text-2xl font-bold text-[#C97DFF] mt-0.5 lg:mt-1">
                {formatCurrency(rowContext.shootBudget || 50000)}
              </p>
            </div>
            <div className="bg-[#171717] border border-[#3D3D3D] rounded-lg p-2.5 lg:p-4">
              <p className="text-sm text-white">Margin</p>
              <p className="text-lg lg:text-2xl font-bold text-[#10B981] mt-0.5 lg:mt-1">
                {rowContext.margin || "18.5"}%
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-3 lg:space-y-5 bg-[#171717] border border-[#3D3D3D] rounded-lg p-3 lg:p-4">
            {/* Dynamic Itemization List Module */}
            <div className="space-y-3">
              <h3 className="lg:text-lg text-white text-semibold capitalize">
                Compensation Breakdown ({selectedCreators.length} Selected)
              </h3>

              <div className="space-y-4 ">
                {compensationList.map((creator) => {
                  const isChecked = selectedCreators.includes(creator.id);
                  return (
                    <div
                      key={creator.id}
                      className={`flex gap-3 border rounded-lg p-3 lg:p-4 bg-[#141414] transition-all ${isChecked ? "border-[#E8D1AB]" : "border-[#FFFFFF33]"}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCheckboxChange(creator.id)}
                        className="hidden lg:block mt-1 h-4 w-4 rounded border-black bg-black text-[#E8D1AB] focus:ring-0 focus:ring-offset-0 accent-[#E8D1AB]"
                      />

                      <div className="space-y-2 lg:space-y-4 w-full">
                        {/* Header Row Line item info */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                             <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCheckboxChange(creator.id)}
                        className="lg:hidden block mt-1 h-4 w-4 rounded border-black bg-black text-[#E8D1AB] focus:ring-0 focus:ring-offset-0 accent-[#E8D1AB]"
                      />
                            <div>
                              <h4 className="text-sm lg:text-base font-medium text-[#E8D1AB]">
                                {creator.name}
                              </h4>
                              <p className="text-xs lg:text-sm text-white">{creator.role}</p>
                            </div>
                          </div>
                          <span className="lg:text-xl font-bold text-[#E8D1AB]">
                            {formatCurrency(creator.total)}
                          </span>
                        </div>

                        {/* Financial Metric Allocation Subgrid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 py-2.5 lg:py-4 border-y border-[#FFFFFF33] text-left">
                          <div>
                            <p className="text-xs lg:text-sm text-white/50">Base Payout</p>
                            <p className="text-xs lg:text-sm text-white font-medium">
                              {formatCurrency(creator.base)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs lg:text-sm text-white/50">Editing Payout</p>
                            <p className="text-xs lg:text-sm text-white font-medium">
                              {formatCurrency(creator.editing)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs lg:text-sm text-white/50">Travel Adjustment</p>
                            <p className="text-xs lg:text-sm text-white font-medium">
                              {formatCurrency(creator.travel)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs lg:text-sm text-white/50">Bonus</p>
                            <p className="text-xs lg:text-sm text-white font-medium">
                              {formatCurrency(creator.bonus)}
                            </p>
                          </div>
                        </div>

                        {/* Context Notice Alert Safeguard */}
                        <div className="text-xs text-[#E8D1AB] bg-[#211F1C] font-medium rounded-lg p-3 w-fit">
                          Note : Select and Approve to Enable Payment
                        </div>

                        {/* Pre-Shoot Advance Section Drawer */}
                        {creator.hasAdvance && (
                          <div className="space-y-3">
                            <div className="flex flex-col lg:flex-row items-start gap-2 lg:items-center lg:justify-between bg-[#FFFBEB] rounded-lg p-3">
                              <div className="text-xs lg:text-sm">
                                <p className="font-medium text-[#7B3306]">
                                  Approval Pending for the Advance Payment
                                </p>
                                <p className="text-[#BB4D00]">
                                  {formatCurrency(creator.advanceAmount || 0)} on {creator.advanceDate}
                                </p>
                              </div>
                              <span className="text-sm lg:text-base font-semibold text-[#BA6605] bg-[#FACD9A] px-5 py-3 rounded-full">
                                Pre-shoot advance
                              </span>
                            </div>

                            <button className="w-full h-12 rounded-lg flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#10B981]/90 text-white font-semibold text-sm transition-colors">
                              <CheckCircle2 size={16} />
                              Pay Advance Amount
                            </button>
                          </div>
                        )}

                        {/* Context Action Button Panel inside individual active items */}
                        {!creator.hasAdvance && isChecked && (
                          <div className="flex flex-col gap-3">
                            <button
                              onClick={onApproveClick}
                              className="lg:hidden flex h-12 rounded-lg flex items-center justify-center gap-1.5 bg-[#10B981] hover:bg-[#10B981]/90 text-white font-semibold text-sm transition-colors">
                              <CheckCircle2 size={16} /> Approve
                            </button>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:mt-4 animate-in fade-in duration-150">
                              <button
                                onClick={onApproveClick}
                                className="hidden lg:flex h-12 rounded-lg flex items-center justify-center gap-1.5 bg-[#10B981] hover:bg-[#10B981]/90 text-white font-semibold text-sm transition-colors">
                                <CheckCircle2 size={16} /> Approve
                              </button>
                              <button
                                onClick={onModifyClick}
                                className="h-12 rounded-lg  flex items-center justify-center gap-1.5 bg-[#155DFC] hover:bg-[#155DFC]/90 text-white font-semibold text-sm">
                                <Edit3 size={16} /> Modify
                              </button>
                              <button
                                onClick={onRejectClick}
                                className="h-12 rounded-lg flex items-center justify-center gap-1.5 bg-[#EF4444] hover:bg-[#EF4444]/90 text-white font-semibold text-sm">
                                <XCircle size={16} /> Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Margin Analysis Data Grid Section */}
          <div className="flex-1 space-y-2 lg:space-y-4 bg-[#171717] border border-[#3D3D3D] rounded-lg p-4">
            <h3 className="lg:text-lg text-white text-semibold capitalize">
              Margin Analysis
            </h3>
            <div className="space-y-3 text-sm lg:text-base">
              <div className="flex justify-between items-center text-white/40">
                <span>Shoot Budget</span>
                <span className="font-semibold text-zinc-100">
                  {formatCurrency(rowContext.shootBudget || 50000)}
                </span>
              </div>
              <div className="flex justify-between items-center text-white/40">
                <span>Total CP Payout</span>
                <span className="font-semibold text-zinc-100">
                  -{formatCurrency(rowContext.cpPayout || 12500)}
                </span>
              </div>
              <div className="w-full h-px border-b border-white/30" />
              <div className="flex justify-between items-center font-medium">
                <span className="text-white">Margin</span>
                <span className="text-[#E8D1AB] font-bold">
                  {formatCurrency((rowContext.shootBudget || 50000) - (rowContext.cpPayout || 12500))} ({rowContext.margin || "18.5"}%)
                </span>
              </div>
            </div>
          </div>

          {/* Audit Ledger Traces Trail */}
          <div className="flex-1 space-y-2 lg:space-y-4 bg-[#171717] border border-[#3D3D3D] rounded-lg p-4">
            <h3 className="lg:text-lg text-white text-semibold capitalize">
              Audit Log
            </h3>
            <div className="flex items-start gap-3 text-xs lg:text-sm">
              <Clock size={20} className="text-[#99A1AF] shrink-0" />
              <div className="flex-1 flex flex-col lg:flex-row justify-between gap-1 lg:gap-4">
                <span className="text-white">Created shoot and assigned CPs</span>
                <span className="text-white/50 whitespace-nowrap text-xs">28-05-2026 14:32 • Admin User</span>
              </div>
            </div>
            <div className="flex items-start gap-3 text-xs lg:text-sm">
              <Clock size={20} className="text-[#99A1AF] shrink-0" />
              <div className="flex-1 flex flex-col lg:flex-row justify-between gap-1 lg:gap-4">
                <span className="text-white">Submitted to Finance for approval</span>
                <span className="text-white/50 whitespace-nowrap text-xs">28-05-2026 14:45 • Admin User</span>
              </div>
            </div>
          </div>
        </div>

        {/* Persistent Base Sticky Double Action Control Drawer */}
        <div className="sticky bottom-0 inset-x-0 bg-[#0C0C0C] p-5 lg:p-9 flex flex-col gap-3 z-10 mt-auto">
          <button
              onClick={onApproveClick}
              className="h-12 rounded-lg lg:hidden flex items-center justify-center gap-1.5 bg-[#10B981] hover:bg-[#10B981]/90 text-white font-semibold text-sm transition-colors">
              <CheckCircle2 size={16} /> Approve All
            </button>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
            <button
              onClick={onApproveClick}
              className="h-12 rounded-lg hidden lg:flex items-center justify-center gap-1.5 bg-[#10B981] hover:bg-[#10B981]/90 text-white font-semibold text-sm transition-colors">
              <CheckCircle2 size={16} /> Approve All
            </button>
            <button
              onClick={onModifyClick}
              className="h-12 rounded-lg  flex items-center justify-center gap-1.5 bg-[#155DFC] hover:bg-[#155DFC]/90 text-white font-semibold text-sm">
              <Edit3 size={16} /> Modify
            </button>
            <button
              onClick={onRejectClick}
              className="h-12 rounded-lg flex items-center justify-center gap-1.5 bg-[#EF4444] hover:bg-[#EF4444]/90 text-white font-semibold text-sm">
              <XCircle size={16} /> Reject All
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}