"use client";

import React, { useState } from "react";
import { X, CheckCircle2, Edit3, Trash2, Clock, Check } from "lucide-react";
import PayoutActionModal from "./PayoutActionModal";

interface CompensationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

export default function CompensationDetailsModal({
  isOpen,
  onClose,
  data,
}: CompensationDetailsModalProps) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "modify" | "approve" | "reject";
  }>({
    isOpen: false,
    type: "modify",
  });

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[140] flex items-center justify-end bg-black/85 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={onClose} />

        <div className="relative z-[141] w-full max-w-[660px] h-screen bg-black border-l border-white/10 flex flex-col shadow-2xl overflow-hidden"
          style={{ fontFamily: "var(--font-instrument-sans)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-10 py-8">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">{data.name}</h2>
              <p className="text-sm text-white/45 mt-1">{data.type}</p>
            </div>
            <button
              onClick={onClose}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/15 transition-all"
            >
              <X size={22} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-10 pb-8 custom-scrollbar space-y-7">
            {/* Metrics Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-[20px] bg-[#171717] p-6">
                <p className="text-xs font-medium text-white/35 mb-2">Total CP Payout</p>
                <p className="text-2xl font-bold text-[#85C1E9]">{data.payout}</p>
              </div>
              <div className="rounded-[20px] bg-[#171717] p-6">
                <p className="text-xs font-medium text-white/35 mb-2">Shoot Budget</p>
                <p className="text-2xl font-bold text-[#C39BD3]">{data.budget}</p>
              </div>
              <div className="rounded-[20px] bg-[#171717] p-6">
                <p className="text-xs font-medium text-white/35 mb-2">Margin</p>
                <p className="text-2xl font-bold text-[#17D8A2]">{data.margin}</p>
              </div>
            </div>

            {/* Compensation Breakdown */}
            <div className="space-y-4 pt-2">
              <h3 className="text-lg font-semibold text-white">Compensation Breakdown</h3>
              <div className="space-y-4">
                {/* Individual CP Card 1 */}
                <div className="bg-[#111111] border border-white/5 rounded-[15px] p-7">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <p className="text-lg font-bold text-white">Ethan Cole</p>
                      <p className="text-sm text-white/30 mt-0.5">Lead Photographer</p>
                    </div>
                    <p className="text-2xl font-bold text-white">$6,500</p>
                  </div>

                  <div className="grid grid-cols-4 gap-6">
                    <div>
                      <p className="text-[11px] text-white/30 font-medium mb-1.5 leading-none">Base Payout</p>
                      <p className="text-base text-white/90 font-medium">$5,000</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-white/30 font-medium mb-1.5 leading-none whitespace-nowrap">Editing Add-on</p>
                      <p className="text-base text-white/90 font-medium">$750</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-white/30 font-medium mb-1.5 leading-none whitespace-nowrap">Travel Adjustment</p>
                      <p className="text-base text-white/90 font-medium">$500</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-white/30 font-medium mb-1.5 leading-none">Bonus</p>
                      <p className="text-base text-white/90 font-medium">$250</p>
                    </div>
                  </div>
                </div>

                {/* Individual CP Card 2 */}
                <div className="bg-[#111111] border border-white/5 rounded-[15px] p-7 space-y-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-lg font-bold text-white">Michael Chen</p>
                      <p className="text-sm text-white/30 mt-0.5">Videographer</p>
                    </div>
                    <p className="text-2xl font-bold text-white">$5,500</p>
                  </div>

                  <div className="grid grid-cols-4 gap-6">
                    <div>
                      <p className="text-[11px] text-white/30 font-medium mb-1.5 leading-none">Base Payout</p>
                      <p className="text-base text-white/90 font-medium">$4,000</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-white/30 font-medium mb-1.5 leading-none whitespace-nowrap">Editing Add-on</p>
                      <p className="text-base text-white/90 font-medium">$600</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-white/30 font-medium mb-1.5 leading-none whitespace-nowrap">Travel Adjustment</p>
                      <p className="text-base text-white/90 font-medium">$500</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-white/30 font-medium mb-1.5 leading-none">Bonus</p>
                      <p className="text-base text-white/90 font-medium">$400</p>
                    </div>
                  </div>

                  {/* Advance Payment Banner */}
                  <div className="bg-[#FFFCEF] rounded-[15px] p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-[#5A4312]">Advance Payment Scheduled</p>
                      <p className="text-[12px] text-[#A67C00] mt-0.5">$2,000 on 2026-06-01</p>
                    </div>
                    <div className="px-5 py-2.5 bg-[#FBD2A0] text-[#8C5E00] text-[11px] font-bold rounded-full">
                      Pre-shoot advance
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Margin Analysis Section */}
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-semibold text-white">Margin Analysis</h3>
              <div className="bg-[#111111] border border-white/5 rounded-[15px] p-7 space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-base text-white/45">Shoot Budget</span>
                  <span className="text-base text-white font-medium">$50,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base text-white/45">Total CP Payout</span>
                  <span className="text-base text-white font-medium">-$12,500</span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center pt-2">
                  <span className="text-base font-bold text-white">Margin</span>
                  <span className="text-xl font-bold text-white">$37,500 (18.5%)</span>
                </div>
              </div>
            </div>

            {/* Audit Log Section */}
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-semibold text-white">Audit Log</h3>
              <div className="bg-[#111111] border border-white/5 rounded-[15px] p-7 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 flex items-center justify-center text-white/30">
                      <Clock size={18} />
                    </div>
                    <p className="text-sm text-white/70 font-medium">Created shoot and assigned CPs</p>
                  </div>
                  <p className="text-[11px] text-white/30 font-medium">28-05-2026 14:32 - Admin/User</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 flex items-center justify-center text-white/30">
                      <Clock size={18} />
                    </div>
                    <p className="text-sm text-white/70 font-medium">Submitted to Finance for approval</p>
                  </div>
                  <p className="text-[11px] text-white/30 font-medium">28-05-2026 14:45 - Admin/User</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-10 py-8 border-t border-white/10 flex flex-row gap-4 bg-black">
            <button
              onClick={() => setModalState({ isOpen: true, type: "approve" })}
              className="flex-1 h-14 flex items-center justify-center gap-2 rounded-xl bg-[#20C997] text-white text-base font-bold hover:bg-[#1fb48b] transition-all"
            >
              <Check size={20} strokeWidth={3} />
              Approve
            </button>
            <button
              onClick={() => setModalState({ isOpen: true, type: "modify" })}
              className="flex-1 h-14 flex items-center justify-center gap-2 rounded-xl bg-[#0061FF] text-white text-base font-bold hover:bg-[#0052d9] transition-all"
            >
              <Edit3 size={18} />
              Modify
            </button>
            <button
              onClick={() => setModalState({ isOpen: true, type: "reject" })}
              className="flex-1 h-14 flex items-center justify-center gap-2 rounded-xl bg-[#FF4D4F] text-white text-base font-bold hover:bg-[#eb3e40] transition-all"
            >
              <X size={20} strokeWidth={3} />
              Reject
            </button>
          </div>
        </div>
      </div>

      <PayoutActionModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        data={data}
        actionType={modalState.type}
      />
    </>
  );
}
