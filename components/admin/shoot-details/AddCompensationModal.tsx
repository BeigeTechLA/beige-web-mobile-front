"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Minus, Calendar, Edit2, ChevronDown, ChevronUp, Check, Sparkles, AlertTriangle, TrendingUp } from "lucide-react";
import { DatePicker } from "@/components/ui/Datepicker";
import { parse, format } from "date-fns";

type Creative = {
  id: number;
  name: string;
  initials: string;
  role: string;
  totalCompensation: number;
  isExpanded?: boolean;
  paymentType?: "flat" | "hourly";
  basePayout?: number;
  perHourRate?: number;
  totalHours?: number;
  editingPayout?: number;
  travelAdjustment?: number;
  bonusAdjustment?: number;
  notes?: string;
  advancePayment?: {
    amount: number;
    date: string;
    notes?: string;
  };
};

type AddCompensationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  selectedCreativeIds: number[];
};

export function AddCompensationModal({
  open,
  onOpenChange,
  projectId,
  selectedCreativeIds,
}: AddCompensationModalProps) {
  const [compensationMethod, setCompensationMethod] = useState<"equal" | "role" | "manual">("equal");

  const [creatives, setCreatives] = useState<Creative[]>([
    {
      id: 1,
      name: "Ethan Cole",
      initials: "EC",
      role: "Lead Photographer",
      totalCompensation: 6250,
      isExpanded: true,
      paymentType: "flat",
      basePayout: 5000,
      perHourRate: 500,
      totalHours: 10,
      editingPayout: 750,
      travelAdjustment: 500,
      bonusAdjustment: 0,
      notes: "",
    },
    {
      id: 2,
      name: "Michael Chen",
      initials: "MC",
      role: "Videographer",
      totalCompensation: 6250,
      isExpanded: false,
      paymentType: "flat",
      basePayout: 5000,
      perHourRate: 500,
      totalHours: 10,
      editingPayout: 750,
      travelAdjustment: 500,
      bonusAdjustment: 0,
      notes: "",
    },
  ]);

  const [advancePaymentModalOpen, setAdvancePaymentModalOpen] = useState(false);
  const [selectedCreativeForAdvance, setSelectedCreativeForAdvance] = useState<Creative | null>(null);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [advancePaymentDate, setAdvancePaymentDate] = useState<Date | null>(null);
  const [advanceNotes, setAdvanceNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const totalShootAmount = 50000;
  const totalCompensation = creatives.reduce((sum, c) => sum + c.totalCompensation, 0);
  const estimatedMargin = totalShootAmount - totalCompensation;
  const marginPercentage = ((estimatedMargin / totalShootAmount) * 100).toFixed(1);
  const compensationPercentage = ((totalCompensation / totalShootAmount) * 100).toFixed(1);
  const compensationPercentageNum = parseFloat(compensationPercentage);

  useEffect(() => {
    if (compensationMethod === "equal") {
      setCreatives([
        {
          id: 1,
          name: "Ethan Cole",
          initials: "EC",
          role: "Lead Photographer",
          totalCompensation: 6250,
          isExpanded: true,
          paymentType: "flat",
          basePayout: 5000,
          perHourRate: 500,
          totalHours: 10,
          editingPayout: 750,
          travelAdjustment: 500,
          bonusAdjustment: 0,
          notes: "",
        },
        {
          id: 2,
          name: "Michael Chen",
          initials: "MC",
          role: "Videographer",
          totalCompensation: 6250,
          isExpanded: false,
          paymentType: "flat",
          basePayout: 5000,
          perHourRate: 500,
          totalHours: 10,
          editingPayout: 750,
          travelAdjustment: 500,
          bonusAdjustment: 0,
          notes: "",
        },
      ]);
    } else if (compensationMethod === "role") {
      setCreatives([
        {
          id: 1,
          name: "Ethan Cole",
          initials: "EC",
          role: "Lead Photographer",
          totalCompensation: 6825,
          isExpanded: true,
          paymentType: "flat",
          basePayout: 5500,
          perHourRate: 500,
          totalHours: 10,
          editingPayout: 750,
          travelAdjustment: 500,
          bonusAdjustment: 75,
          notes: "",
        },
        {
          id: 2,
          name: "Michael Chen",
          initials: "MC",
          role: "Videographer",
          totalCompensation: 6825,
          isExpanded: false,
          paymentType: "flat",
          basePayout: 5500,
          perHourRate: 500,
          totalHours: 10,
          editingPayout: 750,
          travelAdjustment: 500,
          bonusAdjustment: 75,
          notes: "",
        },
      ]);
    }
  }, [compensationMethod]);

  const getProfitabilityStatus = () => {
    if (compensationPercentageNum <= 25) {
      return { status: "Healthy", color: "#10B981", barColor: "#10B981" };
    } else if (compensationPercentageNum <= 30) {
      return { status: "Acceptable", color: "#F59E0B", barColor: "#F59E0B" };
    } else {
      return { status: "Warning", color: "#EF4444", barColor: "#EF4444" };
    }
  };

  const profitability = getProfitabilityStatus();
  const showWarning = compensationPercentageNum > 25;

  const toggleCreativeExpand = (creativeId: number) => {
    setCreatives(creatives.map(c =>
      c.id === creativeId ? { ...c, isExpanded: !c.isExpanded } : c
    ));
  };

  const updateCreativePayment = (creativeId: number, field: keyof Creative, value: any) => {
    setCreatives(creatives.map(c => {
      if (c.id === creativeId) {
        const updated = { ...c, [field]: value };
        const base = updated.paymentType === "flat" ? (updated.basePayout || 0) : (updated.perHourRate || 0) * (updated.totalHours || 0);
        const otherPayouts = (updated.editingPayout || 0) + (updated.travelAdjustment || 0) + (updated.bonusAdjustment || 0);
        updated.totalCompensation = base + otherPayouts;
        return updated;
      }
      return c;
    }));
  };

  const handleAddAdvancePayment = (creative: Creative) => {
    setSelectedCreativeForAdvance(creative);
    setAdvanceAmount(creative.advancePayment?.amount || 0);
    setAdvancePaymentDate(creative.advancePayment?.date ? new Date(creative.advancePayment.date) : null);
    setAdvanceNotes(creative.advancePayment?.notes || "");
    setAdvancePaymentModalOpen(true);
  };

  const handleSaveAdvance = () => {
    if (selectedCreativeForAdvance) {
      setCreatives(creatives.map(c =>
        c.id === selectedCreativeForAdvance.id ? {
          ...c,
          advancePayment: {
            amount: advanceAmount,
            date: advancePaymentDate ? format(advancePaymentDate, "MM/dd/yyyy") : "",
            notes: advanceNotes,
          }
        } : c
      ));
      setAdvancePaymentModalOpen(false);
    }
  };

  const handleSubmitToFinance = async () => {
    setIsSubmitting(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setShowSuccessModal(true);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    onOpenChange(false);
  };

  const remainingBalance = selectedCreativeForAdvance ? selectedCreativeForAdvance.totalCompensation - advanceAmount : 0;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-[ #00000065]">
          <div className="w-[calc(100vw-25px)] max-w-[560px] overflow-hidden rounded-[2px] border border-white/25 bg-black p-0 text-white shadow-[0_18px_60px_rgba(0,0,0,0.55)] sm:max-w-[600px]">
            <div className="flex items-center justify-between border-b border-white/20 px-5 py-4">
              <div className="pt-5">
                <h2 className="text-[22px] font-semibold leading-none">Add Compensation</h2>
                <p className="mt-1 text-[13px] text-white/55">Configure compensation for selected CPs</p>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2B2525] text-white/90 transition hover:bg-[#3A3333]"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="max-h-[calc(90vh-60px)] overflow-y-auto px-5 py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="mb-5">
                <label className="mb-3 block text-[13px] font-medium text-white/80">Select Compensation Method</label>
                <div className="flex gap-1 rounded-[8px] border border-white/25 bg-[#111111] p-1">
                  {(["equal", "role", "manual"] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setCompensationMethod(method)}
                      className={`flex-1 rounded-[6px] px-3 py-2 text-[13px] font-medium transition-colors ${compensationMethod === method
                        ? "bg-[#E8D1AB] text-black"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                        }`}
                    >
                      {method === "equal" ? "Equal Split" : method === "role" ? "Role Based" : "Manual"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-5 rounded-[8px] border border-white/25 bg-[#E8D1AB]/20 p-4">
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <p className="text-[11px] text-white/70">Total Shoot Amount</p>
                    <p className="text-[18px] font-semibold text-white">${totalShootAmount.toLocaleString()}</p>
                    <p className="text-[11px] text-white/50">Overall Budget</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-white/70">Total Compensation</p>
                    <p className="text-[18px] font-semibold text-[#E8D1AB]">${totalCompensation.toLocaleString()}</p>
                    <p className="text-[11px] text-white/50">{compensationPercentage}% of budget</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-white/70">Estimated Margin</p>
                    <p className="text-[18px] font-semibold text-[#10B981]">${estimatedMargin.toLocaleString()}</p>
                    <p className="text-[11px] text-white/50">{marginPercentage}% margin</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-white/70">Profitability Estimation</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#2A2A2A]">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(parseFloat(marginPercentage), 100)}%`,
                            backgroundColor: profitability.barColor
                          }}
                        />
                      </div>
                      <TrendingUp className="h-3.5 w-3.5" style={{ color: profitability.color }} />
                    </div>
                    <p className="mt-1 text-[11px]" style={{ color: profitability.color }}>
                      {profitability.status}
                    </p>
                  </div>
                </div>

                {showWarning && (
                  <div className="mt-4 rounded-[6px] border border-[#FEE685] bg-[#FEF3C6] p-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: '#B45309' }} />
                      <div>
                        <p className="text-[13px] font-medium text-[#7B3306]">
                          Warning: Payout Exceeds 25%
                        </p>
                        <p className="mt-0.5 text-[12px] text-[#BB4D00]">
                          Consider reducing compensation to maintain healthy margins.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {creatives.map((creative) => (
                  <div key={creative.id} className="overflow-hidden rounded-[8px] border border-white/25 bg-[#1F1F1F]">
                    <div
                      className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-white/5"
                      onClick={() => toggleCreativeExpand(creative.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2A2A2A] text-[13px] font-medium text-white">
                          {creative.initials}
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-white">{creative.name}</p>
                          <p className="text-[11px] text-white/50">{creative.role}</p>
                        </div>

                        <div className="rounded-[20px] bg-[#E8D1AB] px-3 py-1">
                          <span className="text-[13px] font-medium text-[#171717]">${creative.totalCompensation.toLocaleString()}</span>
                          <span className="ml-1 text-[11px] text-[#171717]/60">Total Compensation</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {creative.isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-[#E8D1AB]" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-[#E8D1AB]" />
                        )}
                      </div>
                    </div>

                    {creative.isExpanded && (
                      <div className="border-t border-white/25 px-4 py-4">
                        <div className="mb-4 flex gap-1 rounded-[6px] border border-white/25 bg-[#101010] p-1">
                          <button
                            type="button"
                            onClick={() => updateCreativePayment(creative.id, "paymentType", "flat")}
                            className={`flex-1 rounded-[4px] px-3 py-1.5 text-[12px] font-medium transition-colors ${creative.paymentType === "flat"
                              ? "bg-[#E8D1AB]/20 text-[#E8D1AB]"
                              : "text-white/60 hover:text-white hover:bg-white/5"
                              }`}
                          >
                            Flat Rates
                          </button>
                          <button
                            type="button"
                            onClick={() => updateCreativePayment(creative.id, "paymentType", "hourly")}
                            className={`flex-1 rounded-[4px] px-3 py-1.5 text-[12px] font-medium transition-colors ${creative.paymentType === "hourly"
                              ? "bg-[#E8D1AB]/20 text-[#E8D1AB]"
                              : "text-white/60 hover:text-white hover:bg-white/5"
                              }`}
                          >
                            Hourly Rates
                          </button>
                        </div>

                        {creative.paymentType === "flat" ? (
                          <fieldset className="mb-4 rounded-[8px] border border-white/25 px-4 pb-3 pt-1.5">
                            <legend className="px-1 text-[11px] leading-none text-white/55">Base Payout*</legend>
                            <Input
                              value={creative.basePayout?.toString() || ""}
                              onChange={(e) => updateCreativePayment(creative.id, "basePayout", parseInt(e.target.value) || 0)}
                              placeholder="$0"
                              className="h-9 rounded-none border-0 bg-transparent px-0 py-0 text-[14px] text-white placeholder:text-white/35 focus-visible:ring-0"
                            />
                          </fieldset>
                        ) : (
                          <>
                            <div className="mb-4">
                              <div className="flex items-center justify-between rounded-[6px] border-[0.5px] border-white/25 bg-[#101010] px-6 py-3">
                                <div>
                                  <p className="text-[13px] font-medium text-white">Per Hour Rate</p>
                                  <p className="text-[14px] text-[#E8D1AB]">${creative.perHourRate?.toFixed(2) || "0.00"}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => updateCreativePayment(creative.id, "totalHours", Math.max(1, (creative.totalHours || 1) - 1))}
                                    className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-[#E8D1AB]/20 text-[#E8D1AB] transition hover:bg-[#E8D1AB]/30"
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>
                                  <div className="flex h-7 items-center rounded-[4px] border border-white/25 bg-[#111111] px-3">
                                    <span className="text-[12px] text-white">{creative.totalHours || 0} Hours</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => updateCreativePayment(creative.id, "totalHours", (creative.totalHours || 0) + 1)}
                                    className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-[#E8D1AB]/20 text-[#E8D1AB] transition hover:bg-[#E8D1AB]/30"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                  <div className="ml-2 flex h-7 items-center rounded-[4px] border border-white/25 bg-[#111111] px-3">
                                    <span className="text-[12px] text-white/50">$</span>
                                    <input
                                      type="number"
                                      value={creative.perHourRate || 0}
                                      onChange={(e) => updateCreativePayment(creative.id, "perHourRate", parseInt(e.target.value) || 0)}
                                      className="ml-1 w-20 bg-transparent text-[12px] text-white outline-none"
                                    />
                                  </div>
                                  <Check className="h-3.5 w-3.5 text-[#10B981]" />
                                </div>
                              </div>
                              <div className="mt-3 flex items-center justify-between rounded-[6px] bg-[#282727] px-3 py-2">
                                <span className="text-[13px] text-white/70">Total Hours ({creative.totalHours || 0})</span>
                                <span className="text-[14px] font-medium text-[#E8D1AB]">
                                  ${((creative.perHourRate || 0) * (creative.totalHours || 0)).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </>
                        )}

                        <div className="mb-4 grid grid-cols-2 gap-3">
                          <fieldset className="rounded-[8px] border border-white/25 px-4 pb-3 pt-1.5">
                            <legend className="px-1 text-[11px] leading-none text-white/55">Editing Payout</legend>
                            <Input
                              value={creative.editingPayout?.toString() || ""}
                              onChange={(e) => updateCreativePayment(creative.id, "editingPayout", parseInt(e.target.value) || 0)}
                              placeholder="$0"
                              className="h-9 rounded-none border-0 bg-transparent px-0 py-0 text-[14px] text-white placeholder:text-white/35 focus-visible:ring-0"
                            />
                          </fieldset>
                          <fieldset className="rounded-[8px] border border-white/25 px-4 pb-3 pt-1.5">
                            <legend className="px-1 text-[11px] leading-none text-white/55">Travel Adjustment</legend>
                            <Input
                              value={creative.travelAdjustment?.toString() || ""}
                              onChange={(e) => updateCreativePayment(creative.id, "travelAdjustment", parseInt(e.target.value) || 0)}
                              placeholder="$0"
                              className="h-9 rounded-none border-0 bg-transparent px-0 py-0 text-[14px] text-white placeholder:text-white/35 focus-visible:ring-0"
                            />
                          </fieldset>
                        </div>

                        <fieldset className="mb-4 rounded-[8px] border border-white/25 px-4 pb-3 pt-1.5">
                          <legend className="px-1 text-[11px] leading-none text-white/55">Bonus/other Adjustment</legend>
                          <Input
                            value={creative.bonusAdjustment?.toString() || ""}
                            onChange={(e) => updateCreativePayment(creative.id, "bonusAdjustment", parseInt(e.target.value) || 0)}
                            placeholder="$0"
                            className="h-9 rounded-none border-0 bg-transparent px-0 py-0 text-[14px] text-white placeholder:text-white/35 focus-visible:ring-0"
                          />
                        </fieldset>

                        <fieldset className="mb-4 rounded-[8px] border border-white/25 px-4 pb-3 pt-1.5">
                          <legend className="px-1 text-[11px] leading-none text-white/55">Notes</legend>
                          <Textarea
                            value={creative.notes || ""}
                            onChange={(e) => updateCreativePayment(creative.id, "notes", e.target.value)}
                            placeholder="Add notes..."
                            className="min-h-[48px] resize-none rounded-none border-0 bg-transparent px-0 py-0 text-[13px] text-white placeholder:text-white/35 focus:ring-0"
                          />
                        </fieldset>

                        {creative.advancePayment ? (
                          <div className="mb-2">
                            <button
                              type="button"
                              onClick={() => handleAddAdvancePayment(creative)}
                              className="mb-2 flex items-center gap-1.5 text-[13px] text-[#E8D1AB] underline transition hover:text-[#d4c09a]"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              Edit Advance Payment
                            </button>
                            <div className="flex items-center justify-between rounded-[6px] bg-[#101010] px-3 py-2">
                              <span className="text-[12px] text-white/60">
                                Advance: ${creative.advancePayment.amount.toLocaleString()} on {creative.advancePayment.date}
                              </span>
                              <span className="text-[12px] text-[#E8D1AB]">
                                Remaining: ${(creative.totalCompensation - creative.advancePayment.amount).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddAdvancePayment(creative)}
                            className="mb-2 flex items-center gap-1.5 text-[13px] text-[#E8D1AB] underline transition hover:text-[#d4c09a]"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add Advance Payment
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-white/20 px-5 py-4">
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="h-[38px] rounded-[4px] bg-[#242222] text-[12px] font-medium text-white hover:bg-[#2f2b2b]"
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleSubmitToFinance}
                disabled={isSubmitting}
                className="h-[38px] rounded-[4px] bg-[#E8D1AB] text-[12px] font-medium text-black hover:bg-[#e0c594] disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit To Finance"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80">
          <div className="w-[calc(100vw-24px)] max-w-[420px] overflow-hidden rounded-[16px] border border-white/20 bg-[#000] p-8 text-white shadow-[0_18px_60px_rgba(0,0,0,0.7)]">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center justify-center">
                  {[...Array(8)].map((_, i) => (
                    <Sparkles
                      key={i}
                      className="absolute h-4 w-4 animate-pulse"
                      style={{
                        color: ['#E8D1AB', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'][i],
                        transform: `rotate(${i * 45}deg) translateY(-35px)`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#E8D1AB]">
                  <Check className="h-8 w-8 text-[#171717]" strokeWidth={3} />
                </div>
              </div>

              <h3 className="mb-2 text-[20px] font-semibold text-white">
                Request Sent Successfully
              </h3>

              <p className="mb-6 max-w-[320px] text-[14px] text-white/60">
                This compensation request is now sent to the Finance for approval.
              </p>

              <Button
                onClick={handleCloseSuccessModal}
                className="h-[38px] w-full rounded-[4px] bg-[#E8D1AB] text-[13px] font-medium text-black hover:bg-[#e0c594]"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}


      {selectedCreativeForAdvance && advancePaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[calc(100vw-24px)] max-w-[420px] overflow-hidden rounded-[16px] border-[0.5px] border-[#FFFFFF]/40 bg-[#000] p-0 text-white shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between border-b border-white/20 px-5 py-4">
              <h2 className="text-[20px] font-semibold leading-none text-white">Advance Payment</h2>
              <button
                type="button"
                onClick={() => setAdvancePaymentModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2B2525] text-white/90 transition hover:bg-[#3A3333]"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="px-5 py-5">
              <div className="mb-4 rounded-[8px] border border-white/25 bg-[#101010] p-4">
                <p className="text-[12px] text-white/55">Total Compensation for {selectedCreativeForAdvance.name}</p>
                <p className="mt-1 text-[20px] font-semibold text-[#E8D1AB]">${selectedCreativeForAdvance.totalCompensation.toLocaleString()}</p>
              </div>

              <fieldset className="mb-4 rounded-[8px] border border-white/25 px-4 pb-3 pt-1.5">
                <legend className="px-1 text-[11px] leading-none text-white/55">Enter Advance Amount</legend>
                <Input
                  type="number"
                  value={advanceAmount || ""}
                  onChange={(e) => setAdvanceAmount(parseInt(e.target.value) || 0)}
                  placeholder="$0"
                  className="h-9 rounded-none border-0 bg-transparent px-0 py-0 text-[14px] text-white placeholder:text-white/35 focus-visible:ring-0"
                />
              </fieldset>

              <div className="mb-4 text-[12px]">
                <span className="text-white/60">Remaining Balance: </span>
                <span className="font-medium text-[#10B981]">${remainingBalance.toLocaleString()}</span>
              </div>

              <fieldset className="mb-4 rounded-[8px] border border-white/25 px-4 pb-3 pt-1.5">
                <legend className="px-1 text-[11px] leading-none text-white/55">Payment Date</legend>
                <div className="relative">
                  <DatePicker
                    label=""
                    value={advancePaymentDate}
                    onChange={setAdvancePaymentDate}
                    format="MM/dd/yyyy"
                    disablePortal
                    colors={{
                      inputBackground: "transparent",
                      inputBorder: "transparent",
                      inputBorderHover: "transparent",
                      inputBorderFocus: "transparent",
                    }}
                    sx={{
                      height: "40px",
                      borderRadius: "0px",
                      "& fieldset": {
                        border: "0 !important",
                      },
                      "& .MuiOutlinedInput-root": {
                        paddingRight: "0px",
                      },
                      "& .MuiInputBase-input": {
                        padding: "8px 0",
                      },
                      "& .MuiInputAdornment-root": {
                        marginLeft: "0px",
                        marginRight: "-10px",
                      },
                      "& .MuiIconButton-root": {
                        padding: "4px",
                        marginRight: "-6px",
                      },
                    }}
                    isDark
                    labelSx={{ display: "none" }}
                  />
                </div>
              </fieldset>

              <fieldset className="mb-5 rounded-[8px] border border-white/25 px-4 pb-3 pt-1.5">
                <legend className="px-1 text-[11px] leading-none text-white/55">Notes</legend>
                <Textarea
                  value={advanceNotes}
                  onChange={(e) => setAdvanceNotes(e.target.value)}
                  placeholder="Add notes about this advance payment..."
                  className="min-h-[48px] resize-none rounded-none border-0 bg-transparent px-0 py-0 text-[13px] text-white placeholder:text-white/35 focus:ring-0"
                />
              </fieldset>

              {advanceAmount > 0 && (
                <div className="mb-4 rounded-[6px] bg-[#101010] p-3">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-white/60">Advance Payment</span>
                    <span className="font-medium text-white">${advanceAmount.toLocaleString()}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[12px]">
                    <span className="text-white/60">Remaining Balance</span>
                    <span className="font-medium text-[#10B981]">${remainingBalance.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={() => setAdvancePaymentModalOpen(false)}
                  className="h-[38px] rounded-[4px] bg-[#242222] text-[12px] font-medium text-white hover:bg-[#2f2b2b]"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveAdvance}
                  className="h-[38px] rounded-[4px] bg-[#E8D1AB] text-[12px] font-medium text-black hover:bg-[#e0c594]"
                >
                  Save Advance
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}