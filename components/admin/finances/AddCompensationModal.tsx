"use client";

import React, { use, useState } from "react";
import { X, ChevronDown, TrendingDown, TrendingUp, Plus, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { any, string } from "zod";
import AdvancePaymentModal from "./AdvancePaymentModal";
import SuccessModal from "./SuccessModal";


interface AddCompensationModalProps {
  isOpen: boolean;
  onClose: () => void;
  // onSubmit: (payload: any) => void;
}

type TabType = "equal" | "role" | "manual";

const tabs: { label: string; value: TabType }[] = [
  { label: "Equal Split", value: "equal" },
  { label: "Role Based", value: "role" },
  { label: "Manual", value: "manual" },
];

// Mock Data populated for the Shoots dropdown selection matrix
const MOCK_SHOOT_DROPDOWN_DATA = [
  {
    id: "SHT-001",
    name: "Corporate Shoot - Videography",
    shootBudget: 50000,
    cpPayout: 12500,
    margin: 18.5,
    profitability: "Healthy",
    creators: [
      { id: "c1", name: "Ethan Cole", role: "Lead Photographer", total: 6500, base: 5000, editing: 750, travel: 500, bonus: 250 },
      { id: "c2", name: "Michael Chen", role: "Videographer", total: 6000, base: 4500, editing: 600, travel: 500, bonus: 400 }
    ]
  },
  {
    id: "SHT-002",
    name: "Nike Summer Campaign - Photography",
    shootBudget: 12000,
    cpPayout: 3000,
    margin: 25.0,
    profitability: "Excellent",
    creators: [
      { id: "c3", name: "Elena Rostova", role: "Creative Director", total: 3000, base: 2000, editing: 500, travel: 300, bonus: 200 }
    ]
  },
  {
    id: "SHT-003",
    name: "Revurge Core Apparel Shoot",
    shootBudget: 24000,
    cpPayout: 4200,
    margin: 14.0,
    profitability: "Moderate",
    creators: [
      { id: "c4", name: "Marcus Chen", role: "Editor", total: 4200, base: 3000, editing: 800, travel: 200, bonus: 200 },
      { id: "c3", name: "Elena Rostova", role: "Creative Director", total: 3000, base: 2000, editing: 500, travel: 300, bonus: 200 }
    ]
  }
];

export default function AddCompensationModal({
  isOpen,
  onClose,
  // onSubmit
}: AddCompensationModalProps) {
  const [selectedShootId, setSelectedShootId] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [compensationMethod, setCompensationMethod] = useState<"equal" | "role" | "manual">("equal");
  const [selectedCreators, setSelectedCreators] = useState<string[]>(["c1"]);
  const [rowContext, setRowContext] = useState(any);
  const [rateType, setRateType] = useState<"flat" | "hourly">("flat");
  const [isAdvancePaymentOpen, setIsAdvancePaymentOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  // const totalShootAmount = 50000;
  // const totalCompensation = MOCK_SHOOT_DROPDOWN_DATA
  //   .flatMap(shoot => shoot.creators)
  //   .reduce((sum, creator) => sum + creator.total, 0);
  // const estimatedMargin = totalShootAmount - totalCompensation;
  // const marginPercentage = ((estimatedMargin / totalShootAmount) * 100).toFixed(1);
  // const compensationPercentage = ((totalCompensation / totalShootAmount) * 100).toFixed(1);
  // const compensationPercentageNum = parseFloat(compensationPercentage);

  // const showWarning = compensationPercentageNum > 25;

  const { isDark } = useResolvedTheme()
  if (!isOpen) return null;

  const currentShoot = MOCK_SHOOT_DROPDOWN_DATA.find(s => s.id === selectedShootId);

  const handleCheckboxChange = (id: string) => {
    setSelectedCreators((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAdvancePayment = (id: string) => {
    const selectedRow = MOCK_SHOOT_DROPDOWN_DATA.find(
      (item) => item.id === id
    );

    setRowContext(selectedRow);
    setIsAdvancePaymentOpen(true);
  };

  const handleFormSubmit = () => {
    setIsSuccessOpen(false);
    if (!selectedShootId) return;
    // onSubmit({
    //   shootId: selectedShootId,
    //   compensationMethod,
    //   selectedCreators,
    //   rateType,
    // });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-[#101010CC] font-sans backdrop-blur-sm animate-in fade-in duration-200 p-4 lg:p-0">
      {/* Slide-Over Drawer Container Panel */}
      <div className={`relative h-full w-full lg:max-w-3xl flex flex-col border rounded-lg lg:rounded-r-none lg:rounded-l-2xl overflow-y-auto animate-in slide-in-from-right duration-200 ${isDark
        ? "border-white/40 bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.62)]"
        : "border-[#D7D7D7] bg-white text-black shadow-2xl"
        }`}>
        {/* Header Block Section */}
        <div className="sticky top-0 inset-x-0 flex items-center z-20 justify-between p-6 lg:px-9 lg:py-10 bg-[#000000] border-b border-[#CACACA]">
          <h2 className="text-lg lg:text-3xl font-bold tracking-tight">
            Add Compensation
          </h2>
          <button
            onClick={onClose}
            className="p-3 lg:p-4 rounded-full bg-[#2B2626] text-white transition-colors"
            aria-label="Close template drawer"
          >
            <X className="w-5 h-5 lg:h-7 lg:w-7" />
          </button>
        </div>

        {/* Scrollable Form Workspace Container */}
        <div className="flex-1 space-y-3 lg:space-y-5 p-6 lg:p-9">

          {/* Out-of-Bounds Intersecting Select Shoot Dropdown */}
          <div className="relative rounded-xl border px-4 py-2 mt-2 transition-colors border-[#5A5A5F] bg-black">
            <div className="absolute -top-3 left-3 px-1 text-sm z-2">
              <span className={`px-2 font-medium  text-sm lg:text-base  ${isDark ? "bg-black text-white/60" : "bg-white text-black/60"}`}>
                Select Shoot*
              </span>
            </div>
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex h-11 lg:h-16 w-full items-center justify-between cursor-pointer text-sm lg:text-base"
            >
              <span className={`${selectedShootId ? (isDark ? "text-white" : "text-black") : (isDark ? "text-white/40" : "text-black/40")}`}>
                {currentShoot ? currentShoot.name : "Select Shoot to Proceed"}
              </span>
              <ChevronDown size={18} className="text-white/60" />
            </div>

            {isDropdownOpen && (
              <div className={`absolute left-0 right-0 top-[105%] z-50 rounded-lg border shadow-xl max-h-48 overflow-y-auto ${isDark ? "bg-[#141414] border-[#3D3D3D] text-white" : "text-black bg-[#F4F5F7] border-[#D7D7D7]"}`}>
                {MOCK_SHOOT_DROPDOWN_DATA.map((shoot) => (
                  <div
                    key={shoot.id}
                    onClick={() => {
                      setSelectedShootId(shoot.id);
                      setIsDropdownOpen(false);
                    }}
                    className="px-4 py-3 text-sm cursor-pointer transition-colors hover:bg-[#3D3D3D]"
                  >
                    {shoot.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Renders sub-components and fields only when a shoot context is bound */}
          {currentShoot && (
            <div className="space-y-3 lg:space-y-6 animate-in fade-in duration-200">

              {/* Select Compensation Method Segment Selector Switch */}
              <div className="flex flex-col gap-3 lg:gap-5 ">
                <label className={`text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"} `}>Select Compensation Method</label>
                <div className={`grid grid-cols-3 p-1.5 border rounded-lg h-14 ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-[#F4F5F7] border-[#D7D7D7]"}`}>
                  {(["equal", "role", "manual"] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setCompensationMethod(method)}
                      className={`h-10 text-sm lg:text-base capitalize rounded-sm transition-all ${compensationMethod === method
                        ? "bg-[#E8D1AB] text-black shadow-md font-semibold"
                        : (isDark ? "text-white/60 hover:text-white" : "text-black/70 hover:text-black")}`}
                    >
                      {method === "equal" ? "Equal Split" : method === "role" ? "Role Based" : "Manual"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Summary Metadata Cards Layout Component */}
              <div className={`border border-[#E8D1AB33] rounded-lg p-4 lg:p-5 ${isDark ? "bg-[#3D3D3D]" : "bg-[#F4F5F7]"}`}>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-9">
                  <div>
                    <p className={`text-xs lg:text-sm ${isDark ? "text-white" : "text-black"}`}>Total Shoot Amount</p>
                    <p className={`text-lg lg:text-2xl font-bold ${isDark ? "text-white" : "text-black"}`}>
                      ${(currentShoot.shootBudget)}
                    </p>
                    <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-black/60"}`}>Overall Budget</p>
                  </div>

                  <div>
                    <p className={`text-xs lg:text-sm ${isDark ? "text-white" : "text-black"}`}>Total Compensation</p>
                    <p className={`text-lg lg:text-2xl font-bold text-[#E8D1AB]`}>
                      ${(currentShoot.cpPayout)}
                    </p>
                    <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-black/60"}`}>25.0% of budget</p>
                  </div>

                  <div>
                    <p className={`text-xs lg:text-sm ${isDark ? "text-white" : "text-black"}`}>Estimated Margin</p>
                    <p className={`text-lg lg:text-2xl font-bold text-[#10B981]`}>
                      ${(currentShoot.shootBudget - currentShoot.cpPayout)}
                    </p>
                    <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-black/60"}`}>{currentShoot.margin}% margin</p>
                  </div>

                  <div className="lg:col-span-2 w-full">
                    <p className={`text-xs lg:text-sm ${isDark ? "text-white" : "text-black"}`}>Profitability Estimation</p>
                    <div className="flex gap-1">
                      <div className={`w-full h-1.5 rounded-full mt-3 overflow-hidden ${isDark ? "bg-black/40" : "bg-[#3D3D3D]/20"}`}>
                        <div className="bg-[#10B981] h-full w-[75%]" />
                      </div>
                      <TrendingUp className="text-[#10B981]" />
                    </div>
                    <p className={`text-xs lg:text-sm mt-1.5 ${isDark ? "text-white/70" : "text-black/60"}`}>{currentShoot.profitability}</p>
                  </div>
                </div>

                {/* Warning Banner */}
                {/* {showWarning && (
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
                )} */}
              </div>

              {/* Creative Partner Target Allocation List Block */}
              <div className="flex flex-col gap-3 lg:gap-5 ">
                <label className={`text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"} `}>Select Creative Partner</label>

                {currentShoot.creators.map((creator) => {
                  const isChecked = selectedCreators.includes(creator.id);
                  return (
                    <div
                      key={creator.id}
                      className={`border rounded-xl transition-all overflow-hidden ${isDark ? "bg-[#1F1F1F]" : "bg-[#F4F5F7]"} ${isChecked ? "border-[#E8D1AB]/40" : isDark ? "border-[#3D3D3D]" : ""}`}
                    >
                      {/* Accordion List Item Collapsed Summary Section */}
                      <div className={`flex flex-col p-3 lg:p-6 gap-2 ${isChecked ? "border-b border-[#E8D1AB]/40" : ""}`}>
                        <div className={`flex items-center gap-3 lg:gap-5`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleCheckboxChange(creator.id)}
                            className="h-4 w-4 lg:h-6 lg:w-6 rounded bg-black text-[#E8D1AB] accent-[#E8D1AB]"
                          />
                          <div className="flex items-center gap-3">
                            <div className={`h-11 w-11 lg:h-15 lg:w-15 shrink-0 rounded-full lg:text-xl font-semibold flex items-center justify-center ${isDark ? "bg-[#363434] text-zinc-300" : "text-black bg-[#E8D1AB]"}`}>
                              {creator.name.split(" ").map(n => n[0]).join("")}
                            </div>
                            <div>
                              <h4 className={`lg:text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>{creator.name}</h4>
                              <p className={`text-xs lg:text-sm  ${isDark ? "text-white/50" : "text-black/50"}`}>{creator.role}</p>
                            </div>
                            <div className="hidden bg-[#E8D1AB] text-[#171717] font-semibold text-sm lg:text-lg px-3 py-2 lg:px-6 lg:py-2.5 rounded-full lg:flex items-center gap-1.5">
                              {formatCurrency(creator.total)} <span className="text-[#171717]/60 font-normal">Total Compensation</span>
                            </div>
                          </div>
                        </div>
                        <div className="lg:hidden bg-[#E8D1AB] text-[#171717] font-semibold text-sm px-3 py-2 rounded-full flex justify-center gap-1.5">
                          {formatCurrency(creator.total)} <span className="text-[#171717]/60 font-normal">Total Compensation</span>
                        </div>
                      </div>

                      {/* Expanded Data Input Sub-grid Block Form Layer (Only open if profile checkbox checked) */}
                      {isChecked && (
                        <div className={`p-3 lg:p-5 space-y-3 lg:space-y-6 animate-in fade-in duration-150 ${isDark ? "bg-[#0C0C0C]/40" : "bg-[#D7D7D7]/40"}`}>
                          {/* Inner Flat Rates / Hourly Rates Tab Segment Control */}
                          <div className={`grid grid-cols-2 p-1.5 w-full h-11 lg:h-15 border rounded-lg h-14 ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-[#F4F5F7] border-[#D7D7D7]"}`}>
                            <button
                              type="button"
                              onClick={() => setRateType("flat")}
                              className={`h-10 text-sm lg:text-base capitalize rounded-sm transition-all ${rateType === "flat"
                                ? "bg-[#E8D1AB33] text-[#E8D1AB] shadow-md font-semibold border border-[#E8D1AB]"
                                : (isDark ? "text-white/60 hover:text-white" : "text-black/70 hover:text-black")}`}
                            >
                              Flat Rates
                            </button>
                            <button
                              type="button"
                              onClick={() => setRateType("hourly")}
                              className={`h-10 text-sm lg:text-base capitalize rounded-sm transition-all ${rateType === "hourly"
                                ? "bg-[#E8D1AB33] text-[#E8D1AB] shadow-md font-semibold border border-[#E8D1AB]"
                                : (isDark ? "text-white/60 hover:text-white" : "text-black/70 hover:text-black")}`}
                            >
                              Hourly Rates
                            </button>
                          </div>

                          {/* Interactive Top-Border Out-of-Bounds Input Text Components Matrix */}
                          <div className={`relative rounded-xl border px-4 py-2 mt-2 ${isDark ? "border-[#5A5A5F] bg-[#0C0C0C]/40" : "border-[#e5e5e5] bg-[#D7D7D7]/40 "}`}>
                            <div className={`absolute -top-2.5 left-3 px-2 text-sm lg:text-base z-10  ${isDark ? "bg-[#0C0C0C] text-white/60" : "bg-[#D7D7D7] text-black/60"}`}>
                              Base Payout*
                            </div>
                            <input
                              type="text"
                              defaultValue={creator.base}
                              className={`h-11 lg:h-16 w-full border-0 bg-transparent px-0 text-sm lg:text-base outline-none ${isDark ? "text-white " : "text-black "}`}
                            />
                          </div>

                          <p className={`text-sm lg:text-base font-medium uppercase tracking-wider ${isDark ? "text-white " : "text-black "}`}>Other Payouts</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`relative rounded-xl border px-4 py-2 mt-2 ${isDark ? "border-[#5A5A5F] bg-[#0C0C0C]/40" : "border-[#e5e5e5] bg-[#D7D7D7]/40 "}`}>
                              <div className={`absolute -top-2.5 left-3 px-2 text-sm lg:text-base z-10  ${isDark ? "bg-[#0C0C0C] text-white/60" : "bg-[#D7D7D7] text-black/60"}`}>
                                Editing Payout
                              </div>
                              <input
                                type="text"
                                defaultValue={creator.editing}
                                className={`h-11 lg:h-16 w-full border-0 bg-transparent px-0 text-sm lg:text-base outline-none ${isDark ? "text-white " : "text-black "}`}
                              />
                            </div>
                            <div className={`relative rounded-xl border px-4 py-2 mt-2 ${isDark ? "border-[#5A5A5F] bg-[#0C0C0C]/40" : "border-[#e5e5e5] bg-[#D7D7D7]/40 "}`}>
                              <div className={`absolute -top-2.5 left-3 px-2 text-sm lg:text-base z-10  ${isDark ? "bg-[#0C0C0C] text-white/60" : "bg-[#D7D7D7] text-black/60"}`}>
                                Travel Adjustment
                              </div>
                              <input
                                type="text"
                                defaultValue={creator.travel}
                                className={`h-11 lg:h-16 w-full border-0 bg-transparent px-0 text-sm lg:text-base outline-none ${isDark ? "text-white " : "text-black "}`}
                              />
                            </div>
                          </div>

                          <div className={`relative rounded-xl border px-4 py-2 mt-2 ${isDark ? "border-[#5A5A5F] bg-[#0C0C0C]/40" : "border-[#e5e5e5] bg-[#D7D7D7]/40 "}`}>
                            <div className={`absolute -top-2.5 left-3 px-2 text-sm lg:text-base z-10  ${isDark ? "bg-[#0C0C0C] text-white/60" : "bg-[#D7D7D7] text-black/60"}`}>
                              Bonus/other Adjustment
                            </div>
                            <input
                              type="text"
                              defaultValue={creator.bonus}
                              className={`h-11 lg:h-16 w-full border-0 bg-transparent px-0 text-sm lg:text-base outline-none ${isDark ? "text-white " : "text-black "}`}
                            />
                          </div>

                          <div className={`relative rounded-xl border px-4 py-3 mt-2 ${isDark ? "border-[#5A5A5F] bg-[#0C0C0C]/40" : "border-[#e5e5e5] bg-[#D7D7D7]/40 "}`}>
                            <div className={`absolute -top-2.5 left-3 px-2 text-sm lg:text-base z-10  ${isDark ? "bg-[#0C0C0C] text-white/60" : "bg-[#D7D7D7] text-black/60"}`}>
                              Notes
                            </div>
                            <textarea
                              placeholder="Add specific details or audit descriptions..."
                              className={`h-11 lg:h-16 w-full border-0 bg-transparent px-0 text-sm lg:text-base outline-none ${isDark ? "text-white " : "text-black "}`}
                            />
                          </div>

                          <button
                            onClick={() => handleAdvancePayment(creator.id)}
                            type="button"
                            className="text-base lg:text-lg text-[#E8D1AB] hover:underline font-medium flex items-center gap-1">
                            <Plus size={20} /> Add Advance Payment
                          </button>
                        </div>
                      )
                      }
                    </div>
                  );
                })}
              </div>

            </div>
          )}
        </div>

        {/* Bottom Persistent Form Sticky Controls Container Panel */}
        <div className={`sticky bottom-0 inset-x-0 p-4 lg:p-6 grid grid-cols-2 gap-4 z-40 mt-auto ${isDark ? "bg-black" : "bg-white"}`}>
          <button
            type="button"
            onClick={onClose}
            className={`h-12 rounded-lg flex items-center justify-center border font-semibold text-sm transition-colors shadow-md ${isDark ? "bg-[#1F1F1F] border-[#262626] hover:bg-[#3D3D3D] text-white" : "bg-[#F0F0F0] border-[#E3E3E3] hover:bg-[#E3E3E3] text-black"}`}
          >
            Back
          </button>
          <button
            type="button"
            disabled={!selectedShootId || selectedCreators.length === 0}
            onClick={() => { setIsSuccessOpen(true) }}
            className="h-12 rounded-lg flex items-center justify-center bg-[#E8D1AB] hover:bg-[#E8D1AB]/90 text-black font-bold text-sm transition-colors shadow-md disabled:opacity-30 disabled:cursor-not-allowed"
          >
            SUBmit
          </button>
        </div>

      </div>
      <AdvancePaymentModal
        isOpen={isAdvancePaymentOpen}
        onClose={() => setIsAdvancePaymentOpen(false)}
      />

      <SuccessModal
        isOpen={isSuccessOpen}
        onSubmit={handleFormSubmit}
        title="Request Sent Successfully"
        subtext="This compensation request is now sent to the Finance for approval."
        buttonText="Done"
      />

    </div >
  );
}