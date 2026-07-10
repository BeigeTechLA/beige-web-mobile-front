"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, TrendingUp, Minus, Plus, X } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { normalizeCpRoleLabel, type AddCpCompensationPayload, type PendingCompensationShoot } from "@/lib/api/cpCompensation";

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
  baseTarget: string;
  base: string;
  rateType: "flat" | "hourly";
  hourlyRate: string;
  hours: string;
  hourlyConfirmed: boolean;
  hourlyCommittedTotal: string;
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
const roundMoney = (value: number) => Number(value.toFixed(2));
const normalizeMoneyInput = (value: string) => {
  const cleaned = String(value || "").replace(/[^\d.]/g, "");
  if (!cleaned) return "";

  const [wholePart = "", ...decimalParts] = cleaned.split(".");
  const whole = wholePart || "0";
  if (!cleaned.includes(".")) return whole;

  const decimals = decimalParts.join("").slice(0, 2);
  return decimals.length > 0 ? `${whole}.${decimals}` : `${whole}.`;
};
const toMoney = (value: number) => Number(value.toFixed(2));

const formatShootOptionLabel = (shoot: PendingCompensationShoot) =>
  `#${shoot.booking_id} - ${shoot.shoot_name}`;

const getPercentMeta = (percentage: number) => {
  const displayedPercentage = Number(percentage.toFixed(1));

  if (displayedPercentage <= 25) {
    return {
      color: "#10B981",
      label: "Healthy",
    };
  }

  if (displayedPercentage <= 50) {
    return {
      color: "#F59E0B",
      label: "Review margin",
    };
  }

  return {
    color: "#EF4444",
    label: "High payout risk",
  };
};

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));
const getCreatorTargetAmount = (form?: Partial<CreatorFormState>, rateType?: "flat" | "hourly") => {
  if (rateType === "hourly") {
    return parseAmount(form?.hourlyCommittedTotal || form?.baseTarget || "0");
  }

  return parseAmount(form?.baseTarget || "0");
};

const getCompensationBreakdown = (
  form: Partial<CreatorFormState>,
  rateType: "flat" | "hourly",
  compensationMethod: TabType,
  shootAmount: number
) => {
  const budgetLimit = Math.max(compensationMethod === "manual" ? shootAmount : getCreatorTargetAmount(form, rateType), 0);
  const editingRaw = roundMoney(parseAmount(form.editing || "0"));
  const travelRaw = roundMoney(parseAmount(form.travel || "0"));
  const bonusRaw = roundMoney(parseAmount(form.bonus || "0"));

  let remainingBudget = roundMoney(budgetLimit);
  let base = 0;
  let editing = 0;
  let travel = 0;
  let bonus = 0;

  if (compensationMethod === "manual") {
    editing = roundMoney(Math.min(Math.max(editingRaw, 0), remainingBudget));
    remainingBudget = roundMoney(Math.max(remainingBudget - editing, 0));
    travel = roundMoney(Math.min(Math.max(travelRaw, 0), remainingBudget));
    remainingBudget = roundMoney(Math.max(remainingBudget - travel, 0));
    bonus = roundMoney(Math.min(Math.max(bonusRaw, 0), remainingBudget));
    remainingBudget = roundMoney(Math.max(remainingBudget - bonus, 0));
    base = roundMoney(remainingBudget);
  } else {
    editing = roundMoney(Math.min(Math.max(editingRaw, 0), remainingBudget));
    remainingBudget = roundMoney(Math.max(remainingBudget - editing, 0));
    travel = roundMoney(Math.min(Math.max(travelRaw, 0), remainingBudget));
    remainingBudget = roundMoney(Math.max(remainingBudget - travel, 0));
    bonus = roundMoney(Math.min(Math.max(bonusRaw, 0), remainingBudget));
    remainingBudget = roundMoney(Math.max(remainingBudget - bonus, 0));
    base = roundMoney(remainingBudget);
  }

  return {
    base,
    editing,
    travel,
    bonus,
    total: base + editing + travel + bonus,
    budgetLimit,
  };
};

const getHourlyRateForAmount = (amount: string, hours: string) => {
  const hourCount = Math.max(parseAmount(hours || "1"), 1);
  const rate = parseAmount(amount || "0") / hourCount;
  return rate.toFixed(2);
};

const getMethodBaseTarget = (
  creator: PendingCompensationShoot["creators"][number],
  compensationMethod: TabType,
  equalSplitTarget: number
) => {
  if (compensationMethod === "role") {
    return String(creator.hourly_rate ?? equalSplitTarget);
  }

  return String(equalSplitTarget);
};

const getCreatorFormDefaults = (creatorHourlyRate = "", baseTarget = "0"): CreatorFormState => ({
  baseTarget,
  base: baseTarget,
  rateType: "flat",
  hourlyRate: creatorHourlyRate,
  hours: "1",
  hourlyConfirmed: true,
  hourlyCommittedTotal: baseTarget,
  editing: "0",
  travel: "0",
  bonus: "0",
  notes: "",
});

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
  const [compensationMethod, setCompensationMethod] = useState<TabType>("equal");
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [creatorForms, setCreatorForms] = useState<Record<string, CreatorFormState>>({});
  const [shootSearchQuery, setShootSearchQuery] = useState("");
  const shootDropdownRef = useRef<HTMLDivElement>(null);

  const { isDark } = useResolvedTheme();

  const currentShoot = useMemo(
    () => shoots.find((shoot) => String(shoot.booking_id) === selectedShootId),
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
      ].join(" ").toLowerCase();

      return searchableValue.includes(query);
    });
  }, [shootSearchQuery, shoots]);

  const resetFormState = useCallback(() => {
    setSelectedShootId("");
    setIsDropdownOpen(false);
    setCompensationMethod("equal");
    setSelectedCreators([]);
    setCreatorForms({});
    setShootSearchQuery("");
  }, []);

  const syncCreatorFormsForCompensationMethod = useCallback(() => {
    if (!currentShoot) return;

    const defaultPerCreator = currentShoot.creators.length
      ? toMoney((Number(currentShoot.shoot_amount || 0) * 0.25) / currentShoot.creators.length)
      : 0;

    setCreatorForms((prev) => currentShoot.creators.reduce<Record<string, CreatorFormState>>((acc, creator) => {
      const id = String(creator.creator_id);
      const current = prev[id] || {};
      const hours = current.hours || "1";
      const methodBaseTarget = getMethodBaseTarget(creator, compensationMethod, defaultPerCreator);
      const preservedBaseTarget = compensationMethod === "role"
        ? methodBaseTarget
        : (current.baseTarget || methodBaseTarget);
      const creatorRateType = current.rateType || "flat";
      const hourlyRate = creatorRateType === "hourly"
        ? (current.hourlyRate || getHourlyRateForAmount(preservedBaseTarget, hours))
        : current.hourlyRate || preservedBaseTarget;
      const hourlyCommittedTotal = creatorRateType === "hourly"
        ? preservedBaseTarget
        : current.hourlyCommittedTotal || "";
      const baseAmount = getCompensationBreakdown({
        baseTarget: preservedBaseTarget,
        hourlyRate,
        hours,
        hourlyCommittedTotal,
        editing: current.editing || "0",
        travel: current.travel || "0",
        bonus: current.bonus || "0",
        rateType: creatorRateType,
      }, creatorRateType, compensationMethod, Number(currentShoot.shoot_amount || 0)).base;

      const nextForm: CreatorFormState = {
        baseTarget: preservedBaseTarget,
        base: String(baseAmount),
        rateType: creatorRateType,
        hourlyRate: creatorRateType === "hourly"
          ? (current.hourlyRate || getHourlyRateForAmount(String(baseAmount), hours))
          : hourlyRate,
        hours,
        hourlyConfirmed: current.hourlyConfirmed ?? true,
        hourlyCommittedTotal,
        editing: current.editing || "0",
        travel: current.travel || "0",
        bonus: current.bonus || "0",
        notes: current.notes || "",
      };

      acc[id] = nextForm;
      return acc;
    }, {}));
  }, [compensationMethod, currentShoot]);

  useEffect(() => {
    if (!isOpen) {
      resetFormState();
      return;
    }

    resetFormState();
    if (shoots.length === 1) {
      const shoot = shoots[0];
      setSelectedShootId(String(shoot.booking_id));
      setShootSearchQuery(formatShootOptionLabel(shoot));
    }
  }, [isOpen, resetFormState, shoots]);

  useEffect(() => {
    if (!currentShoot) {
      setSelectedCreators([]);
      setCreatorForms({});
      return;
    }

    const defaultPerCreator = currentShoot.creators.length
      ? toMoney((Number(currentShoot.shoot_amount || 0) * 0.25) / currentShoot.creators.length)
      : 0;

    setSelectedCreators(currentShoot.creators.map((creator) => String(creator.creator_id)));
    setCreatorForms(
      currentShoot.creators.reduce<Record<string, CreatorFormState>>((acc, creator) => {
        const id = String(creator.creator_id);
        const baseTarget = getMethodBaseTarget(creator, compensationMethod, defaultPerCreator);
        acc[id] = getCreatorFormDefaults(baseTarget, baseTarget);
        return acc;
      }, {})
    );
  }, [compensationMethod, currentShoot]);

  useEffect(() => {
    syncCreatorFormsForCompensationMethod();
  }, [currentShoot, compensationMethod, syncCreatorFormsForCompensationMethod]);

  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleDocumentMouseDown = (event: MouseEvent) => {
      if (shootDropdownRef.current && !shootDropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);
    return () => document.removeEventListener("mousedown", handleDocumentMouseDown);
  }, [isDropdownOpen]);

  const shootAmount = Number(currentShoot?.shoot_amount || 0);
  const getCreatorBreakdownForForm = (form: Partial<CreatorFormState>, rateType: "flat" | "hourly") =>
    getCompensationBreakdown(form, rateType, compensationMethod, shootAmount);

  const getCreatorTotal = (creatorId: string) => {
    const form = creatorForms[creatorId];
    if (!form) return 0;
    return getCreatorBreakdownForForm(form, form.rateType).total;
  };

  const totalCompensation = selectedCreators.reduce((sum, creatorId) => sum + getCreatorTotal(creatorId), 0);
  const compensationPercentage = shootAmount > 0 ? (totalCompensation / shootAmount) * 100 : 0;
  const marginAmount = shootAmount - totalCompensation;
  const marginPercentage = shootAmount > 0 ? (marginAmount / shootAmount) * 100 : 0;
  const percentMeta = getPercentMeta(compensationPercentage);
  const progressWidth = clampPercent(compensationPercentage);

  if (!isOpen) return null;

  const handleCheckboxChange = (id: string) => {
    setSelectedCreators((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const updateCreatorForm = (creatorId: string, field: keyof CreatorFormState, value: string) => {
    setCreatorForms((prev) => ({
      ...prev,
      [creatorId]: {
        ...(() => {
          const existing = prev[creatorId] || getCreatorFormDefaults();
          const nextRateType = (field === "rateType" ? value : existing.rateType || "flat") as "flat" | "hourly";
          const isManualHourly = compensationMethod === "manual" && nextRateType === "hourly";
          const draft = {
            ...existing,
            ...(field === "base" ? {} : { [field]: value }),
            rateType: nextRateType,
          };
          const nextHours = draft.hours || "1";
          const shouldAutoCalculateHourlyRate =
            nextRateType === "hourly" &&
            (compensationMethod !== "manual" || field === "hours" || field === "baseTarget" || field === "rateType");
          const budgetLimit = compensationMethod === "manual"
            ? Number(currentShoot?.shoot_amount || 0)
            : getCreatorTargetAmount(draft, nextRateType);
          const editingCandidate = roundMoney(parseAmount(draft.editing || "0"));
          const travelCandidate = roundMoney(parseAmount(draft.travel || "0"));
          const bonusCandidate = roundMoney(parseAmount(draft.bonus || "0"));

          let remainingBudget = roundMoney(Math.max(budgetLimit, 0));
          let nextBaseAmount = 0;
          let nextEditingAmount = editingCandidate;
          let nextTravelAmount = travelCandidate;
          let nextBonusAmount = bonusCandidate;

          if (compensationMethod === "manual") {
            nextEditingAmount = roundMoney(Math.min(Math.max(editingCandidate, 0), remainingBudget));
            remainingBudget = roundMoney(Math.max(remainingBudget - nextEditingAmount, 0));
            nextTravelAmount = roundMoney(Math.min(Math.max(travelCandidate, 0), remainingBudget));
            remainingBudget = roundMoney(Math.max(remainingBudget - nextTravelAmount, 0));
            nextBonusAmount = roundMoney(Math.min(Math.max(bonusCandidate, 0), remainingBudget));
            remainingBudget = roundMoney(Math.max(remainingBudget - nextBonusAmount, 0));
            nextBaseAmount = roundMoney(remainingBudget);
          } else {
            nextEditingAmount = roundMoney(Math.min(Math.max(editingCandidate, 0), remainingBudget));
            remainingBudget = roundMoney(Math.max(remainingBudget - nextEditingAmount, 0));
            nextTravelAmount = roundMoney(Math.min(Math.max(travelCandidate, 0), remainingBudget));
            remainingBudget = roundMoney(Math.max(remainingBudget - nextTravelAmount, 0));
            nextBonusAmount = roundMoney(Math.min(Math.max(bonusCandidate, 0), remainingBudget));
            remainingBudget = roundMoney(Math.max(remainingBudget - nextBonusAmount, 0));
            nextBaseAmount = roundMoney(remainingBudget);
          }

          const nextBase = nextBaseAmount.toFixed(2);

          return {
            ...draft,
            hourlyCommittedTotal: isManualHourly
              ? (existing.hourlyCommittedTotal || "")
              : nextRateType === "hourly"
                ? (existing.baseTarget || getCreatorFormDefaults().baseTarget)
                : (existing.hourlyCommittedTotal || ""),
            base:
              nextBase,
            hourlyConfirmed: isManualHourly ? false : (nextRateType === "hourly" ? true : (existing.hourlyConfirmed ?? true)),
            baseTarget:
              isManualHourly
                ? (field === "baseTarget" ? nextBase : (existing.baseTarget || "0"))
                : compensationMethod === "manual"
                ? nextBase
                : nextRateType === "hourly"
                ? String(existing.baseTarget || getCreatorFormDefaults().baseTarget)
                : (existing.baseTarget || "0"),
            editing: field === "editing" ? value : nextEditingAmount.toFixed(2),
            travel: field === "travel" ? value : nextTravelAmount.toFixed(2),
            bonus: field === "bonus" ? value : nextBonusAmount.toFixed(2),
            hourlyRate:
              isManualHourly
                ? (field === "hourlyRate"
                    ? value
                    : shouldAutoCalculateHourlyRate
                      ? getHourlyRateForAmount(nextBase, nextHours)
                      : (existing.hourlyRate || ""))
                : nextRateType === "hourly"
                ? getHourlyRateForAmount(nextBase, nextHours)
                : (existing.hourlyRate || ""),
          };
        })(),
      },
    }));
  };

  const handleSelectShoot = (shoot: PendingCompensationShoot) => {
    setSelectedShootId(String(shoot.booking_id));
    setShootSearchQuery(formatShootOptionLabel(shoot));
    setIsDropdownOpen(false);
  };

  const toggleHourlyConfirmation = (creatorId: string) => {
    setCreatorForms((prev) => {
      const current = prev[creatorId] || getCreatorFormDefaults();
      const committedTotal = roundMoney(
        parseAmount(current.hourlyRate || current.baseTarget || "0") * Math.max(parseAmount(current.hours || "0"), 1)
      ).toFixed(2);
      const baseAmount = getCompensationBreakdown(
        { ...current, hourlyCommittedTotal: committedTotal, baseTarget: committedTotal },
        current.rateType,
        compensationMethod,
        shootAmount
      ).base;
      return {
        ...prev,
        [creatorId]: {
          ...current,
          hourlyCommittedTotal: committedTotal,
          hourlyConfirmed: true,
          baseTarget: committedTotal,
          base: String(baseAmount),
        },
      };
    });
  };

  const handleFormSubmit = async () => {
    if (!currentShoot) return;

    const creators = selectedCreators.map((creatorId) => {
      const form = creatorForms[creatorId] || {
        baseTarget: "0",
        base: "0",
        rateType: "flat",
        hourlyRate: "",
        hours: "1",
        hourlyConfirmed: false,
        hourlyCommittedTotal: "",
        editing: "0",
        travel: "0",
        bonus: "0",
        notes: "",
      };
      const breakdown = getCreatorBreakdownForForm(form, form.rateType);
      return {
        creator_id: Number(creatorId),
        rate_type: form.rateType,
        items: [
          { label: "Base Payout", amount: breakdown.base },
          { label: "Editing Payout", amount: breakdown.editing },
          { label: "Travel Adjustment", amount: breakdown.travel },
          { label: "Bonus/Other Adjustment", amount: breakdown.bonus },
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-[#101010CC] font-sans backdrop-blur-sm animate-in fade-in duration-200 p-4 lg:p-0">
      <div className={`relative h-full w-full lg:max-w-3xl flex flex-col border rounded-lg lg:rounded-r-none lg:rounded-l-2xl overflow-y-auto animate-in slide-in-from-right duration-200 ${isDark
        ? "border-white/40 bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.62)]"
        : "border-[#D7D7D7] bg-white text-black shadow-2xl"
        }`}>
        <div className="sticky top-0 inset-x-0 flex items-center z-20 justify-between p-6 lg:px-9 lg:py-10 bg-[#000000] border-b border-[#CACACA]">
          <h2 className="text-lg lg:text-3xl font-bold tracking-tight">
            Add Compensation
          </h2>
          <button
            onClick={onClose}
            className="p-3 lg:p-4 rounded-full bg-[#2B2626] text-white transition-colors"
            aria-label="Close compensation drawer"
          >
            <X className="w-5 h-5 lg:h-7 lg:w-7" />
          </button>
        </div>

        <div className="flex-1 space-y-3 lg:space-y-5 p-6 lg:p-9">
          <div ref={shootDropdownRef} className="relative rounded-xl border px-4 py-2 mt-2 transition-colors border-[#5A5A5F] bg-black">
            <div className="absolute -top-3 left-3 px-1 text-sm z-2">
              <span className={`px-2 font-medium text-sm lg:text-base ${isDark ? "bg-black text-white/60" : "bg-white text-black/60"}`}>
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
              <div className={`absolute left-0 right-0 top-[105%] z-50 rounded-lg border shadow-xl max-h-60 overflow-y-auto ${isDark ? "bg-[#141414] border-[#3D3D3D] text-white" : "text-black bg-[#F4F5F7] border-[#D7D7D7]"}`}>
                {filteredShoots.map((shoot) => (
                  <button
                    type="button"
                    key={shoot.booking_id}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelectShoot(shoot)}
                    className="w-full px-4 py-3 text-left text-sm cursor-pointer transition-colors hover:bg-[#3D3D3D]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate">{shoot.shoot_name}</span>
                      <span className="shrink-0 text-xs text-white/50">Booking #{shoot.booking_id}</span>
                    </div>
                  </button>
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

          {currentShoot && (
            <div className="space-y-3 lg:space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col gap-3 lg:gap-5">
                <label className={`text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"}`}>Select Compensation Method</label>
                <div className={`grid grid-cols-2 p-1.5 border rounded-lg h-14 ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-[#F4F5F7] border-[#D7D7D7]"}`}>
                  <button
                    type="button"
                    onClick={() => setCompensationMethod("equal")}
                    className={`h-10 text-sm lg:text-base capitalize rounded-sm transition-all ${compensationMethod === "equal"
                      ? "bg-[#E8D1AB] text-black shadow-md font-semibold"
                      : (isDark ? "text-white/60 hover:text-white" : "text-black/70 hover:text-black")}`}
                  >
                    Equal Split
                  </button>

                  {/* Role Based option temporarily hidden because it is not required right now.
                  <button
                    type="button"
                    onClick={() => setCompensationMethod("role")}
                    className={`h-10 text-sm lg:text-base capitalize rounded-sm transition-all ${compensationMethod === "role"
                      ? "bg-[#E8D1AB] text-black shadow-md font-semibold"
                      : (isDark ? "text-white/60 hover:text-white" : "text-black/70 hover:text-black")}`}
                  >
                    Role Based
                  </button>
                  */}

                  <button
                    type="button"
                    onClick={() => setCompensationMethod("manual")}
                    className={`h-10 text-sm lg:text-base capitalize rounded-sm transition-all ${compensationMethod === "manual"
                      ? "bg-[#E8D1AB] text-black shadow-md font-semibold"
                      : (isDark ? "text-white/60 hover:text-white" : "text-black/70 hover:text-black")}`}
                  >
                    Manual
                  </button>
                </div>
              </div>

              <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 border border-[#E8D1AB33] rounded-lg p-4 ${isDark ? "bg-[#3D3D3D]" : "bg-[#F4F5F7]"}`}>
                <div className="min-w-0">
                  <p className={`text-xs lg:text-[13px] leading-tight ${isDark ? "text-white" : "text-black"}`}>Total Shoot Amount</p>
                  <p className={`text-lg lg:text-xl font-bold leading-tight truncate ${isDark ? "text-white" : "text-black"}`}>
                    {formatCurrency(shootAmount)}
                  </p>
                  <p className={`text-xs lg:text-[13px] leading-tight ${isDark ? "text-white/70" : "text-black/60"}`}>Overall Budget</p>
                </div>

                <div className="min-w-0">
                  <p className={`text-xs lg:text-[13px] leading-tight ${isDark ? "text-white" : "text-black"}`}>Total Compensation</p>
                  <p className="text-lg lg:text-xl font-bold leading-tight truncate" style={{ color: percentMeta.color }}>
                    {formatCurrency(totalCompensation)}
                  </p>
                  <p className={`text-xs lg:text-[13px] leading-tight ${isDark ? "text-white/70" : "text-black/60"}`}>
                    {compensationPercentage.toFixed(1)}% of budget
                  </p>
                </div>

                <div className="min-w-0">
                  <p className={`text-xs lg:text-[13px] leading-tight ${isDark ? "text-white" : "text-black"}`}>Estimated Margin</p>
                  <p className="text-lg lg:text-xl font-bold leading-tight truncate" style={{ color: marginAmount >= 0 ? "#10B981" : "#EF4444" }}>
                    {formatCurrency(marginAmount)}
                  </p>
                  <p className={`text-xs lg:text-[13px] leading-tight ${isDark ? "text-white/70" : "text-black/60"}`}>
                    {marginPercentage.toFixed(1)}% margin
                  </p>
                </div>

                <div className="min-w-0 w-full">
                  <p className={`text-xs lg:text-[13px] leading-tight ${isDark ? "text-white" : "text-black"}`}>Profitability Estimation</p>
                  <div className="flex gap-1">
                    <div className={`w-full h-1.5 rounded-full mt-3 overflow-hidden ${isDark ? "bg-black/40" : "bg-[#3D3D3D]/20"}`}>
                      <div
                        className="h-full transition-all duration-200"
                        style={{ width: `${progressWidth}%`, backgroundColor: percentMeta.color }}
                      />
                    </div>
                    <TrendingUp style={{ color: percentMeta.color }} />
                  </div>
                  <p className={`text-xs lg:text-[13px] leading-tight mt-1.5 ${isDark ? "text-white/70" : "text-black/60"}`}>
                    {percentMeta.label}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:gap-5">
                <label className={`text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"}`}>Select Creative Partner</label>

                {currentShoot.creators.map((creator) => {
                  const creatorId = String(creator.creator_id);
                  const isChecked = selectedCreators.includes(creatorId);
                  const form = creatorForms[creatorId] || {
                    baseTarget: "0",
                    base: "0",
                    hourlyRate: "",
                    hours: "1",
                    hourlyConfirmed: false,
                    hourlyCommittedTotal: "",
                    editing: "0",
                    travel: "0",
                    bonus: "0",
                    notes: "",
                  };

                  return (
                    <div
                      key={creatorId}
                      className={`border rounded-xl transition-all overflow-hidden ${isDark ? "bg-[#1F1F1F]" : "bg-[#F4F5F7]"} ${isChecked ? "border-[#E8D1AB]/40" : isDark ? "border-[#3D3D3D]" : ""}`}
                    >
                      <div className={`flex flex-col p-3 lg:p-6 gap-2 ${isChecked ? "border-b border-[#E8D1AB]/40" : ""}`}>
                        <div className="flex items-center gap-3 lg:gap-5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleCheckboxChange(creatorId)}
                            className="h-4 w-4 lg:h-6 lg:w-6 rounded bg-black text-[#E8D1AB] accent-[#E8D1AB]"
                          />
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`h-11 w-11 lg:h-15 lg:w-15 shrink-0 rounded-full lg:text-xl font-semibold flex items-center justify-center ${isDark ? "bg-[#363434] text-zinc-300" : "text-black bg-[#E8D1AB]"}`}>
                              {(creator.creator_name || "CP").split(" ").map((name) => name[0]).join("")}
                            </div>
                            <div className="min-w-0">
                              <h4 className={`lg:text-lg font-semibold truncate ${isDark ? "text-white" : "text-black"}`}>{creator.creator_name || "Unknown Creator"}</h4>
                              <p className={`text-xs lg:text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>{normalizeCpRoleLabel(creator.cp_role) || "Creative Partner"}</p>
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

                      {isChecked && (
                        <div className={`p-3 lg:p-5 space-y-3 lg:space-y-6 animate-in fade-in duration-150 ${isDark ? "bg-[#0C0C0C]/40" : "bg-[#D7D7D7]/40"}`}>
                          <div className={`grid grid-cols-2 p-1.5 w-full h-11 lg:h-15 border rounded-lg h-14 ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-[#F4F5F7] border-[#D7D7D7]"}`}>
                            <button
                              type="button"
                              onClick={() => updateCreatorForm(creatorId, "rateType", "flat")}
                              className={`h-10 text-sm lg:text-base capitalize rounded-sm transition-all ${form.rateType === "flat"
                                ? "bg-[#E8D1AB33] text-[#E8D1AB] shadow-md font-semibold border border-[#E8D1AB]"
                                : (isDark ? "text-white/60 hover:text-white" : "text-black/70 hover:text-black")}`}
                            >
                              Flat Rates
                            </button>
                            <button
                              type="button"
                              onClick={() => updateCreatorForm(creatorId, "rateType", "hourly")}
                              className={`h-10 text-sm lg:text-base capitalize rounded-sm transition-all ${form.rateType === "hourly"
                                ? "bg-[#E8D1AB33] text-[#E8D1AB] shadow-md font-semibold border border-[#E8D1AB]"
                                : (isDark ? "text-white/60 hover:text-white" : "text-black/70 hover:text-black")}`}
                            >
                              Hourly Rates
                            </button>
                          </div>

                          {form.rateType === "hourly" ? (
                            <div className={`grid grid-cols-1 gap-3 lg:grid-cols-[minmax(160px,1fr)_auto_auto_auto_auto] items-center rounded-xl border px-3 py-3 mt-2 ${isDark ? "border-[#5A5A5F] bg-[#0C0C0C]/40" : "border-[#e5e5e5] bg-[#D7D7D7]/40"}`}>
                              <div className="min-w-[180px] flex flex-col justify-center">
                                <p className={`text-base lg:text-xl leading-none whitespace-nowrap ${isDark ? "text-white" : "text-black"}`}>Per Hour Rate</p>
                                <p className="text-lg lg:text-xl font-semibold leading-none" style={{ color: "#E8D1AB" }}>
                                  {form.hourlyRate ? formatCurrency(parseAmount(form.hourlyRate)) : "—"}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 lg:justify-center">
                                {/* Decrease Button */}
                                <button
                                  type="button"
                                  onClick={() => updateCreatorForm(creatorId, "hours", String(Math.max(parseAmount(form.hours) - 1, 1)))}
                                  className={`flex items-center justify-center h-9 w-9 lg:h-10 lg:w-10 rounded-lg border transition-colors ${
                                    isDark
                                      ? "border-[#3D3D3D] bg-[#171717] text-white hover:bg-white/5"
                                      : "border-[#D7D7D7] bg-[#F4F5F7] text-black hover:bg-white"
                                  }`}
                                  aria-label="Decrease hours"
                                >
                                  <Minus size={14} />
                                </button>

                                <div className={`min-w-[100px] lg:min-w-[124px] rounded-lg border px-3 py-2 text-center ${isDark ? "border-[#3D3D3D] bg-[#171717] text-white" : "border-[#D7D7D7] bg-[#F4F5F7] text-black"}`}>
                                  <span className="text-xs lg:text-sm font-medium whitespace-nowrap">{parseAmount(form.hours)} Hours</span>
                                </div>

                                {/* Increase Button */}
                                <button
                                  type="button"
                                  onClick={() => updateCreatorForm(creatorId, "hours", String(Math.min(parseAmount(form.hours) + 1, 24)))}
                                  disabled={parseAmount(form.hours) >= 24}
                                  className={`flex items-center justify-center h-9 w-9 lg:h-10 lg:w-10 rounded-lg border transition-colors
                                  ${isDark ? "border-[#3D3D3D] bg-[#171717] text-white hover:bg-white/5" : "border-[#D7D7D7] bg-[#F4F5F7] text-black hover:bg-white"} disabled:opacity-30 disabled:cursor-not-allowed`}
                                  aria-label="Increase hours"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>

                              <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-[#D7D7D7] bg-[#F4F5F7]"}`}>
                                <span className={`${isDark ? "text-white/50" : "text-black/50"} text-xs`}>$</span>
                              <input
                                type="text"
                                value={form.hourlyRate}
                                onChange={(event) => {
                                  if (compensationMethod === "manual") {
                                    updateCreatorForm(creatorId, "hourlyRate", normalizeMoneyInput(event.target.value));
                                  }
                                }}
                                  onBlur={() => {
                                    if (compensationMethod === "manual" && form.hourlyRate !== "") {
                                      const parsedHourlyRate = Number(form.hourlyRate);
                                      updateCreatorForm(
                                        creatorId,
                                        "hourlyRate",
                                        Number.isFinite(parsedHourlyRate) ? roundMoney(parsedHourlyRate).toFixed(2) : ""
                                      );
                                    }
                                  }}
                                  readOnly={compensationMethod !== "manual"}
                                  aria-readonly={compensationMethod !== "manual"}
                                  inputMode="decimal"
                                  className={`w-full border-0 bg-transparent text-xs lg:text-sm outline-none ${compensationMethod === "manual" ? "" : "cursor-not-allowed"} ${isDark ? "text-white/90" : "text-black/90"}`}
                                />
                              </div>

                              {compensationMethod !== "equal" && form.rateType === "hourly" && (
                                <button
                                  type="button"
                                  onClick={() => toggleHourlyConfirmation(creatorId)}
                                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs transition-colors ${
                                    form.hourlyConfirmed
                                      ? "text-[#E8D1AB] hover:text-[#f0dec1]"
                                      : "text-[#10B981] hover:text-[#34D399]"
                                  }`}
                                  aria-label={form.hourlyConfirmed ? "Unfinalize hourly rate" : "Finalize hourly rate"}
                                  title={form.hourlyConfirmed ? "Unfinalize hourly rate" : "Finalize hourly rate"}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                              )}

                              <div className={`lg:col-span-4 flex items-center justify-between rounded-md px-4 py-3 min-h-[56px] ${isDark ? "bg-[#1B1B1B] text-white" : "bg-[#3B3B3B] text-white"}`}>
                                <span className="text-sm lg:text-base whitespace-nowrap">Total Hours ({parseAmount(form.hours)})</span>
                                <span className="text-sm lg:text-base font-semibold" style={{ color: "#E8D1AB" }}>
                                  {form.hourlyCommittedTotal ? formatCurrency(getCreatorTargetAmount(form, form.rateType)) : "—"}
                                </span>
                              </div>

                              <p className={`lg:col-span-4 text-[10px] lg:text-[11px] ${isDark ? "text-white/40" : "text-black/40"}`}>
                                Other payouts reduce the remaining base, and the hourly rate updates from that remaining amount.
                              </p>
                            </div>
                          ) : (
                            <div className={`relative rounded-xl border px-4 py-2 mt-2 ${isDark ? "border-[#5A5A5F] bg-[#0C0C0C]/40" : "border-[#e5e5e5] bg-[#D7D7D7]/40"}`}>
                              <div className={`absolute -top-2.5 left-3 px-2 text-sm lg:text-base z-10 ${isDark ? "bg-[#0C0C0C] text-white/60" : "bg-[#D7D7D7] text-black/60"}`}>
                                Base Payout*
                              </div>
                              <input
                                type="text"
                                value={form.base}
                                onChange={(event) => {
                                  if (compensationMethod === "manual") {
                                    updateCreatorForm(creatorId, "baseTarget", normalizeMoneyInput(event.target.value));
                                  }
                                }}
                                readOnly
                                aria-readonly
                                inputMode="decimal"
                                className={`h-11 lg:h-16 w-full cursor-not-allowed border-0 bg-transparent px-0 text-sm lg:text-base outline-none ${isDark ? "text-white/90" : "text-black/90"}`}
                              />
                              <p className={`mt-1 text-[11px] lg:text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>
                                Auto-adjusted from editing, travel, and bonus payouts.
                              </p>
                            </div>
                          )}

                          <p className={`text-sm lg:text-base font-medium uppercase tracking-wider ${isDark ? "text-white" : "text-black"}`}>Other Payouts</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`relative rounded-xl border px-4 py-2 mt-2 ${isDark ? "border-[#5A5A5F] bg-[#0C0C0C]/40" : "border-[#e5e5e5] bg-[#D7D7D7]/40"}`}>
                              <div className={`absolute -top-2.5 left-3 px-2 text-sm lg:text-base z-10 ${isDark ? "bg-[#0C0C0C] text-white/60" : "bg-[#D7D7D7] text-black/60"}`}>
                                Editing Payout
                              </div>
                              <input
                                type="text"
                                value={form.editing}
                                onChange={(event) => updateCreatorForm(creatorId, "editing", normalizeMoneyInput(event.target.value))}
                                inputMode="decimal"
                                className={`h-11 lg:h-16 w-full border-0 bg-transparent px-0 text-sm lg:text-base outline-none ${isDark ? "text-white" : "text-black"}`}
                              />
                            </div>
                            <div className={`relative rounded-xl border px-4 py-2 mt-2 ${isDark ? "border-[#5A5A5F] bg-[#0C0C0C]/40" : "border-[#e5e5e5] bg-[#D7D7D7]/40"}`}>
                              <div className={`absolute -top-2.5 left-3 px-2 text-sm lg:text-base z-10 ${isDark ? "bg-[#0C0C0C] text-white/60" : "bg-[#D7D7D7] text-black/60"}`}>
                                Travel Adjustment
                              </div>
                              <input
                                type="text"
                                value={form.travel}
                                onChange={(event) => updateCreatorForm(creatorId, "travel", normalizeMoneyInput(event.target.value))}
                                inputMode="decimal"
                                className={`h-11 lg:h-16 w-full border-0 bg-transparent px-0 text-sm lg:text-base outline-none ${isDark ? "text-white" : "text-black"}`}
                              />
                            </div>
                          </div>

                          <div className={`relative rounded-xl border px-4 py-2 mt-2 ${isDark ? "border-[#5A5A5F] bg-[#0C0C0C]/40" : "border-[#e5e5e5] bg-[#D7D7D7]/40"}`}>
                            <div className={`absolute -top-2.5 left-3 px-2 text-sm lg:text-base z-10 ${isDark ? "bg-[#0C0C0C] text-white/60" : "bg-[#D7D7D7] text-black/60"}`}>
                              Bonus/other Adjustment
                            </div>
                            <input
                              type="text"
                              value={form.bonus}
                              onChange={(event) => updateCreatorForm(creatorId, "bonus", normalizeMoneyInput(event.target.value))}
                              inputMode="decimal"
                              className={`h-11 lg:h-16 w-full border-0 bg-transparent px-0 text-sm lg:text-base outline-none ${isDark ? "text-white" : "text-black"}`}
                            />
                          </div>

                          <div className={`relative rounded-xl border px-4 py-3 mt-2 ${isDark ? "border-[#5A5A5F] bg-[#0C0C0C]/40" : "border-[#e5e5e5] bg-[#D7D7D7]/40"}`}>
                            <div className={`absolute -top-2.5 left-3 px-2 text-sm lg:text-base z-10 ${isDark ? "bg-[#0C0C0C] text-white/60" : "bg-[#D7D7D7] text-black/60"}`}>
                              Notes
                            </div>
                            <textarea
                              value={form.notes}
                              onChange={(event) => updateCreatorForm(creatorId, "notes", event.target.value)}
                              placeholder="Add specific details or audit descriptions..."
                              className={`h-11 lg:h-16 w-full border-0 bg-transparent px-0 text-sm lg:text-base outline-none ${isDark ? "text-white" : "text-black"}`}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

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
    </div>
  );
}
