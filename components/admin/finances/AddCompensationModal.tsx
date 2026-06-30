"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import { X, ChevronDown, TrendingUp, Plus, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import type { AddCpCompensationPayload, PendingCompensationShoot } from "@/lib/api/cpCompensation";
import { any, string } from "zod";
import AdvancePaymentModal from "./AdvancePaymentModal";
import SuccessModal from "./SuccessModal";


interface AddCompensationModalProps {
  isOpen: boolean;
  onClose: () => void;
  shoots: PendingCompensationShoot[];
  loading?: boolean;
  isSubmitting?: boolean;
  onSubmit: (payload: AddCpCompensationPayload) => Promise<void>;
}

type TabType = "equal" | "role" | "manual";

type CreatorFormState = {
  base: string;
  editing: string;
  travel: string;
  bonus: string;
  notes: string;
};

const methodToApi = (method: TabType): AddCpCompensationPayload["compensation_method"] => {
  if (method === "role") return "role_based";
  if (method === "manual") return "manual";
  return "equal_split";
};

const parseAmount = (value: string) => Number(String(value || "0").replace(/[$,]/g, "")) || 0;

const formatShootOptionLabel = (shoot: PendingCompensationShoot) =>
  `#${shoot.booking_id} - ${shoot.shoot_name}`;

export default function AddCompensationModal({
  isOpen,
  onClose,
  shoots,
  loading = false,
  isSubmitting = false,
  onSubmit
}: AddCompensationModalProps) {
  const [selectedShootId, setSelectedShootId] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [compensationMethod, setCompensationMethod] = useState<"equal" | "role" | "manual">("equal");
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
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
  const [creatorForms, setCreatorForms] = useState<Record<string, CreatorFormState>>({});
  const [shootSearchQuery, setShootSearchQuery] = useState("");

  const { isDark } = useResolvedTheme()

  const currentShoot = useMemo(
    () => shoots.find(s => String(s.booking_id) === selectedShootId),
    [selectedShootId, shoots]
  );

  const filteredShoots = useMemo(() => {
    const query = shootSearchQuery.trim().toLowerCase();
    if (!query) return shoots;

    return shoots.filter((shoot) => {
      const searchableValue = [
        shoot.booking_id,
        shoot.shoot_name,
        shoot.shoot_type || "",
        shoot.content_type || "",
        shoot.customer?.name || "",
        shoot.customer?.email || "",
        shoot.creators.map((creator) => creator.creator_name || creator.creator_email || "").join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return searchableValue.includes(query);
    });
  }, [shootSearchQuery, shoots]);

  useEffect(() => {
    if (!currentShoot) {
      setSelectedCreators([]);
      setCreatorForms({});
      return;
    }

    const defaultPerCreator = currentShoot.creators.length
      ? Math.round((Number(currentShoot.shoot_amount || 0) * 0.25) / currentShoot.creators.length)
      : 0;

    setSelectedCreators(currentShoot.creators.map((creator) => String(creator.creator_id)));
    setCreatorForms(
      currentShoot.creators.reduce<Record<string, CreatorFormState>>((acc, creator) => {
        const id = String(creator.creator_id);
        acc[id] = {
          base: String(defaultPerCreator),
          editing: "0",
          travel: "0",
          bonus: "0",
          notes: ""
        };
        return acc;
      }, {})
    );
  }, [currentShoot]);

  if (!isOpen) return null;

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
  const updateCreatorForm = (creatorId: string, field: keyof CreatorFormState, value: string) => {
    setCreatorForms((prev) => ({
      ...prev,
      [creatorId]: {
        ...(prev[creatorId] || { base: "0", editing: "0", travel: "0", bonus: "0", notes: "" }),
        [field]: value,
      },
    }));
  };

  const getCreatorTotal = (creatorId: string) => {
    const form = creatorForms[creatorId];
    if (!form) return 0;
    return parseAmount(form.base) + parseAmount(form.editing) + parseAmount(form.travel) + parseAmount(form.bonus);
  };

  const handleFormSubmit = async () => {
    if (!currentShoot) return;
    const creators = selectedCreators.map((creatorId) => {
      const form = creatorForms[creatorId] || { base: "0", editing: "0", travel: "0", bonus: "0", notes: "" };
      return {
        creator_id: Number(creatorId),
        rate_type: rateType,
        items: [
          { label: "Base Payout", amount: parseAmount(form.base) },
          { label: "Editing Payout", amount: parseAmount(form.editing) },
          { label: "Travel Adjustment", amount: parseAmount(form.travel) },
          { label: "Bonus/Other Adjustment", amount: parseAmount(form.bonus) },
        ],
        notes: form.notes || null,
      };
    });

    await onSubmit({
      booking_id: currentShoot.booking_id,
      compensation_method: methodToApi(compensationMethod),
      creators,
    });
  };

  const handleSelectShoot = (shoot: PendingCompensationShoot) => {
    setSelectedShootId(String(shoot.booking_id));
    setShootSearchQuery(formatShootOptionLabel(shoot));
    setIsDropdownOpen(false);
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
            <div className="flex h-11 lg:h-16 w-full items-center justify-between gap-3 text-sm lg:text-base">
              <input
                value={isDropdownOpen ? shootSearchQuery : currentShoot ? formatShootOptionLabel(currentShoot) : shootSearchQuery}
                onChange={(event) => {
                  setShootSearchQuery(event.target.value);
                  setSelectedShootId("");
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder={loading ? "Loading pending shoots..." : "Search booking ID, shoot, customer, creator..."}
                className={`h-full min-w-0 flex-1 border-0 bg-transparent outline-none ${isDark ? "text-white placeholder:text-white/40" : "text-black placeholder:text-black/40"}`}
              />
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="shrink-0 text-white/60"
                aria-label="Toggle shoot list"
              >
                <ChevronDown size={18} />
              </button>
            </div>

            {isDropdownOpen && (
              <div className={`absolute left-0 right-0 top-[105%] z-50 rounded-lg border shadow-xl max-h-48 overflow-y-auto ${isDark ? "bg-[#141414] border-[#3D3D3D] text-white" : "text-black bg-[#F4F5F7] border-[#D7D7D7]"}`}>
                {filteredShoots.map((shoot) => (
                  <div
                    key={shoot.booking_id}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelectShoot(shoot)}
                    className="px-4 py-3 text-sm cursor-pointer transition-colors hover:bg-[#3D3D3D]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate">{shoot.shoot_name}</span>
                      <span className="shrink-0 text-xs text-white/50">Booking #{shoot.booking_id}</span>
                    </div>
                  </div>
                ))}
                {!loading && shoots.length === 0 && (
                  <div className="px-4 py-3 text-sm text-white/50">No pending compensation shoots found.</div>
                )}
                {!loading && shoots.length > 0 && filteredShoots.length === 0 && (
                  <div className="px-4 py-3 text-sm text-white/50">No shoots matched your search.</div>
                )}
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
              <div className={`grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-9 border border-[#E8D1AB33] rounded-lg p-4 lg:p-5 ${isDark ? "bg-[#3D3D3D]" : "bg-[#F4F5F7]"}`}>
                <div>
                  <p className={`text-xs lg:text-sm ${isDark ? "text-white" : "text-black"}`}>Total Shoot Amount</p>
                  <p className={`text-lg lg:text-2xl font-bold ${isDark ? "text-white" : "text-black"}`}>
                    {formatCurrency(currentShoot.shoot_amount || 0)}
                  </p>
                  <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-black/60"}`}>Overall Budget</p>
                </div>

                <div>
                  <p className={`text-xs lg:text-sm ${isDark ? "text-white" : "text-black"}`}>Total Compensation</p>
                  <p className={`text-lg lg:text-2xl font-bold text-[#E8D1AB]`}>
                    {formatCurrency(selectedCreators.reduce((sum, creatorId) => sum + getCreatorTotal(creatorId), 0))}
                  </p>
                  <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-black/60"}`}>25.0% of budget</p>
                </div>

                <div>
                  <p className={`text-xs lg:text-sm ${isDark ? "text-white" : "text-black"}`}>Estimated Margin</p>
                  <p className={`text-lg lg:text-2xl font-bold text-[#10B981]`}>
                    {formatCurrency(Math.max((currentShoot.shoot_amount || 0) - selectedCreators.reduce((sum, creatorId) => sum + getCreatorTotal(creatorId), 0), 0))}
                  </p>
                  <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-black/60"}`}>{currentShoot.margin_percent ?? 0}% margin</p>
                </div>

                <div className="lg:col-span-2 w-full">
                  <p className={`text-xs lg:text-sm ${isDark ? "text-white" : "text-black"}`}>Profitability Estimation</p>
                  <div className="flex gap-1">
                    <div className={`w-full h-1.5 rounded-full mt-3 overflow-hidden ${isDark ? "bg-black/40" : "bg-[#3D3D3D]/20"}`}>
                      <div className="bg-[#10B981] h-full w-[75%]" />
                    </div>
                    <TrendingUp className="text-[#10B981]" />
                  </div>
                  <p className={`text-xs lg:text-sm mt-1.5 ${isDark ? "text-white/70" : "text-black/60"}`}>
                    {Number(currentShoot.margin_percent || 0) >= 20 ? "Healthy" : "Review margin"}
                  </p>
                </div>
              </div>

              {/* Creative Partner Target Allocation List Block */}
              <div className="flex flex-col gap-3 lg:gap-5 ">
                <label className={`text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"} `}>Select Creative Partner</label>

                {currentShoot.creators.map((creator) => {
                  const creatorId = String(creator.creator_id);
                  const isChecked = selectedCreators.includes(creatorId);
                  const form = creatorForms[creatorId] || { base: "0", editing: "0", travel: "0", bonus: "0", notes: "" };
                  return (
                    <div
                      key={creatorId}
                      className={`border rounded-xl transition-all overflow-hidden ${isDark ? "bg-[#1F1F1F]" : "bg-[#F4F5F7]"} ${isChecked ? "border-[#E8D1AB]/40" : isDark ? "border-[#3D3D3D]" : ""}`}
                    >
                      {/* Accordion List Item Collapsed Summary Section */}
                      <div className={`flex flex-col p-3 lg:p-6 gap-2 ${isChecked ? "border-b border-[#E8D1AB]/40" : ""}`}>
                        <div className={`flex items-center gap-3 lg:gap-5`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleCheckboxChange(creatorId)}
                            className="h-4 w-4 lg:h-6 lg:w-6 rounded bg-black text-[#E8D1AB] accent-[#E8D1AB]"
                          />
                          <div className="flex items-center gap-3">
                            <div className={`h-11 w-11 lg:h-15 lg:w-15 shrink-0 rounded-full lg:text-xl font-semibold flex items-center justify-center ${isDark ? "bg-[#363434] text-zinc-300" : "text-black bg-[#E8D1AB]"}`}>
                              {(creator.creator_name || "CP").split(" ").map(n => n[0]).join("")}
                            </div>
                            <div>
                              <h4 className={`lg:text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>{creator.creator_name || "Unknown Creator"}</h4>
                              <p className={`text-xs lg:text-sm  ${isDark ? "text-white/50" : "text-black/50"}`}>{creator.cp_role || "Creative Partner"}</p>
                            </div>
                            <div className="hidden bg-[#E8D1AB] text-[#171717] font-semibold text-sm lg:text-lg px-3 py-2 lg:px-6 lg:py-2.5 rounded-full lg:flex items-center gap-1.5">
                              {formatCurrency(getCreatorTotal(creatorId))} <span className="text-[#171717]/60 font-normal">Total Compensation</span>
                            </div>
                          </div>
                        </div>
                        <div className="lg:hidden bg-[#E8D1AB] text-[#171717] font-semibold text-sm px-3 py-2 rounded-full flex justify-center gap-1.5">
                          {formatCurrency(getCreatorTotal(creatorId))} <span className="text-[#171717]/60 font-normal">Total Compensation</span>
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
                              value={form.base}
                              onChange={(event) => updateCreatorForm(creatorId, "base", event.target.value)}
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
                                value={form.editing}
                                onChange={(event) => updateCreatorForm(creatorId, "editing", event.target.value)}
                                className={`h-11 lg:h-16 w-full border-0 bg-transparent px-0 text-sm lg:text-base outline-none ${isDark ? "text-white " : "text-black "}`}
                              />
                            </div>
                            <div className={`relative rounded-xl border px-4 py-2 mt-2 ${isDark ? "border-[#5A5A5F] bg-[#0C0C0C]/40" : "border-[#e5e5e5] bg-[#D7D7D7]/40 "}`}>
                              <div className={`absolute -top-2.5 left-3 px-2 text-sm lg:text-base z-10  ${isDark ? "bg-[#0C0C0C] text-white/60" : "bg-[#D7D7D7] text-black/60"}`}>
                                Travel Adjustment
                              </div>
                              <input
                                type="text"
                                value={form.travel}
                                onChange={(event) => updateCreatorForm(creatorId, "travel", event.target.value)}
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
                              value={form.bonus}
                              onChange={(event) => updateCreatorForm(creatorId, "bonus", event.target.value)}
                              className={`h-11 lg:h-16 w-full border-0 bg-transparent px-0 text-sm lg:text-base outline-none ${isDark ? "text-white " : "text-black "}`}
                            />
                          </div>

                          <div className={`relative rounded-xl border px-4 py-3 mt-2 ${isDark ? "border-[#5A5A5F] bg-[#0C0C0C]/40" : "border-[#e5e5e5] bg-[#D7D7D7]/40 "}`}>
                            <div className={`absolute -top-2.5 left-3 px-2 text-sm lg:text-base z-10  ${isDark ? "bg-[#0C0C0C] text-white/60" : "bg-[#D7D7D7] text-black/60"}`}>
                              Notes
                            </div>
                            <textarea
                              value={form.notes}
                              onChange={(event) => updateCreatorForm(creatorId, "notes", event.target.value)}
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
            disabled={isSubmitting || !selectedShootId || selectedCreators.length === 0}
            onClick={handleFormSubmit}
            className="h-12 rounded-lg flex items-center justify-center bg-[#E8D1AB] hover:bg-[#E8D1AB]/90 text-black font-bold text-sm transition-colors shadow-md disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
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
