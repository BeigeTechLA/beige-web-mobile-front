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

  const [selectedIds, setSelectedIds] = useState<number[]>([1]);

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[140] flex items-center justify-end bg-black/85 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={onClose} />

        <div className="relative z-[141] w-full max-w-[750px] h-screen bg-black border-l border-white/10 flex flex-col shadow-2xl overflow-hidden"
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
              <div className="rounded-[20px] bg-[#111111] border border-white/5 p-6">
                <p className="text-xs font-bold text-white/45 mb-2 uppercase tracking-wider">Total CP Payout</p>
                <p className="text-3xl font-extrabold text-[#58ACF4]">{data.payout}</p>
              </div>
              <div className="rounded-[20px] bg-[#111111] border border-white/5 p-6">
                <p className="text-xs font-bold text-white/45 mb-2 uppercase tracking-wider">Shoot Amount</p>
                <p className="text-3xl font-extrabold text-[#D296FF]">{data.budget}</p>
              </div>
              <div className="rounded-[20px] bg-[#111111] border border-white/5 p-6">
                <p className="text-xs font-bold text-white/45 mb-2 uppercase tracking-wider">Margin</p>
                <p className="text-3xl font-extrabold text-[#15E8A9]">{data.margin}</p>
              </div>
            </div>

            {/* Compensation Breakdown Card */}
            <div className="bg-[#111111] border border-white/5 rounded-[20px] p-8 space-y-6">
              <h3 className="text-xl font-bold text-white">Compensation Breakdown ({selectedIds.length} Selected)</h3>
              <div className="space-y-4">
                {/* Individual CP Card 1 */}
                <div 
                  onClick={() => toggleSelection(1)}
                  className={`cursor-pointer transition-all duration-200 bg-[#0A0A0A] border rounded-[15px] p-6 space-y-6 ${
                    selectedIds.includes(1) ? "border-[#E8D1AB] shadow-[0_0_15px_rgba(232,209,171,0.1)]" : "border-white/10"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className={`mt-1 w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                        selectedIds.includes(1) ? "bg-[#E8D1AB]" : "border-2 border-white/20"
                      }`}>
                        {selectedIds.includes(1) && <Check size={16} className="text-black" strokeWidth={4} />}
                      </div>
                      <div>
                        <p className="text-xl font-bold text-white leading-tight">Ethan Cole</p>
                        <p className="text-sm text-white/45 mt-0.5">Lead Photographer</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-white">$6,500</p>
                  </div>

                  <div className="grid grid-cols-4 gap-4 py-2 border-t border-white/5 pt-6">
                    <div>
                      <p className="text-xs text-white/45 font-medium mb-1.5">Base Payout</p>
                      <p className="text-lg text-white font-bold">$5,000</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/45 font-medium mb-1.5">Editing Payout</p>
                      <p className="text-lg text-white font-bold">$750</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/45 font-medium mb-1.5">Travel Adjustment</p>
                      <p className="text-lg text-white font-bold">$500</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/45 font-medium mb-1.5">Bonus</p>
                      <p className="text-lg text-white font-bold">$250</p>
                    </div>
                  </div>

                  <div className="inline-flex items-center px-4 py-2 bg-white/[0.03] rounded-lg border border-white/[0.05]">
                    <p className="text-[13px] text-[#D4AF37] font-medium">Note : Select and Approve the Enable Payment</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3" onClick={(e) => e.stopPropagation()}>
                    <button className="h-14 flex items-center justify-center gap-2 rounded-xl bg-[#17D8A2] text-white text-base font-bold hover:bg-[#15c593] transition-all">
                      <CheckCircle2 size={20} />
                      Approve & Pay
                    </button>
                    <button className="h-14 flex items-center justify-center gap-2 rounded-xl bg-[#1B61FF] text-white text-base font-bold hover:bg-[#1655e0] transition-all">
                      <Edit3 size={18} />
                      Modify
                    </button>
                    <button className="h-14 flex items-center justify-center gap-2 rounded-xl bg-[#F04438] text-white text-base font-bold hover:bg-[#d93d32] transition-all">
                      <X size={20} strokeWidth={3} className="border-2 border-white rounded-full p-0.5" />
                      Reject
                    </button>
                  </div>
                </div>

                {/* Individual CP Card 2 */}
                <div 
                  onClick={() => toggleSelection(2)}
                  className={`cursor-pointer transition-all duration-200 bg-[#0A0A0A] border rounded-[15px] p-6 space-y-6 ${
                    selectedIds.includes(2) ? "border-[#E8D1AB] shadow-[0_0_15px_rgba(232,209,171,0.1)]" : "border-white/10"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className={`mt-1 w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                        selectedIds.includes(2) ? "bg-[#E8D1AB]" : "border-2 border-white/20"
                      }`}>
                        {selectedIds.includes(2) && <Check size={16} className="text-black" strokeWidth={4} />}
                      </div>
                      <div>
                        <p className="text-xl font-bold text-white leading-tight">Michael Chen</p>
                        <p className="text-sm text-white/45 mt-0.5">Videographer</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-white">$5,500</p>
                  </div>

                  <div className="grid grid-cols-4 gap-4 py-2 border-t border-white/5 pt-6">
                    <div>
                      <p className="text-xs text-white/45 font-medium mb-1.5">Base Payout</p>
                      <p className="text-lg text-white font-bold">$4,000</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/45 font-medium mb-1.5">Editing Payout</p>
                      <p className="text-lg text-white font-bold">$600</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/45 font-medium mb-1.5">Travel Adjustment</p>
                      <p className="text-lg text-white font-bold">$500</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/45 font-medium mb-1.5">Bonus</p>
                      <p className="text-lg text-white font-bold">$400</p>
                    </div>
                  </div>

                  <div className="inline-flex items-center px-4 py-2 bg-white/[0.03] rounded-lg border border-white/[0.05]">
                    <p className="text-[13px] text-[#D4AF37] font-medium">Note : Select and Approve the Enable Payment</p>
                  </div>

                  {/* Advance Payment Banner */}
                  <div className="bg-[#FFFDF5] border border-[#FBECC6] rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-bold text-[#7A5A1F] leading-none">Approval Pending for the Advance Payment</p>
                      <p className="text-[14px] text-[#B8860B] mt-2 font-medium leading-none">$2,000 on 01-06-2026</p>
                    </div>
                    <div className="px-5 py-3.5 bg-[#F9D4A1] text-[#A6611A] text-[13px] font-bold rounded-2xl flex items-center justify-center text-center leading-tight">
                      Pre-shoot advance
                    </div>
                  </div>

                  <button 
                    onClick={(e) => e.stopPropagation()}
                    className="w-full h-14 flex items-center justify-center gap-2 rounded-xl bg-[#17D8A2] text-white text-base font-bold hover:bg-[#15c593] transition-all"
                  >
                    <CheckCircle2 size={20} />
                    Pay Advance Amount
                  </button>
                </div>
              </div>
            </div>

            {/* Margin Analysis Section */}
            <div className="bg-[#111111] border border-white/5 rounded-[20px] p-8 space-y-6">
              <h3 className="text-xl font-bold text-white">Margin Analysis</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center text-white/45">
                  <span className="text-base font-medium">Shoot Budget</span>
                  <span className="text-base text-white font-bold">$50,000</span>
                </div>
                <div className="flex justify-between items-center text-white/45">
                  <span className="text-base font-medium">Total CP Payout</span>
                  <span className="text-base text-white font-bold">-$12,500</span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center pt-2">
                  <span className="text-base font-bold text-white">Margin</span>
                  <span className="text-xl font-bold text-white">$37,500 (18.5%)</span>
                </div>
              </div>
            </div>

            {/* Audit Log Section */}
            <div className="bg-[#111111] border border-white/5 rounded-[20px] p-8 space-y-6">
              <h3 className="text-xl font-bold text-white">Audit Log</h3>
              <div className="space-y-6">
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
              <CheckCircle2 size={20} />
              Approve All
            </button>
            <button
              onClick={() => setModalState({ isOpen: true, type: "modify" })}
              className="flex-1 h-14 flex items-center justify-center gap-2 rounded-xl bg-[#0061FF] text-white text-base font-bold hover:bg-[#0052d9] transition-all"
            >
              <Edit3 size={18} />
              Modify All
            </button>
            <button
              onClick={() => setModalState({ isOpen: true, type: "reject" })}
              className="flex-1 h-14 flex items-center justify-center gap-2 rounded-xl bg-[#FF4D4F] text-white text-base font-bold hover:bg-[#eb3e40] transition-all"
            >
              <X size={20} strokeWidth={3} className="border-2 border-white rounded-full p-0.5" />
              Reject All
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
