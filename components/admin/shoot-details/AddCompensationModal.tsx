"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, ChevronDown, ChevronUp, Minus, Pencil, Plus, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/Datepicker";
import { Textarea } from "@/components/ui/textarea";
import type { CreativeWithDistance } from "@/components/sales/creativeProfileSelectorAdd";
import { compensationApi } from "@/lib/api";
import { toast } from "sonner";

type RateType = "flat" | "hourly";
type Method = "equal" | "role" | "manual";
type AdvancePayment = { id?: number; amount: number; date: string; notes: string; status?: string };
type CpForm = {
  rate_type: RateType;
  base_payout: string;
  editing_payout: string;
  travel_adjustment: string;
  bonus_adjustment: string;
  notes: string;
  hourly_rate: string;
  hours_worked: string;
};
type SummaryCp = CreativeWithDistance & {
  crew_member_id?: number;
  compensation?: {
    total_compensation?: number | string;
    status?: string;
    rate_type?: RateType;
  } | null;
};
type Summary = {
  booking?: {
    booking_id?: number;
    project_name?: string;
    shoot_amount?: number | string;
    event_date?: string;
  };
  summary?: {
    total_shoot_amount?: number | string;
    total_compensation?: number | string;
    compensation_percent?: number | string;
    estimated_margin?: number | string;
    profitability?: string;
    exceeds_25_percent?: boolean;
    cp_count?: number;
    equal_split_amount?: number | string;
  };
  total_shoot_amount: number;
  total_compensation: number;
  estimated_margin: number;
  profitability: string;
  exceeds_25_percent: boolean;
  cps: SummaryCp[];
  submitted?: boolean;
  status?: string;
};
type CpDetail = Partial<CpForm> & {
  advances?: Array<{ id?: number; advance_id?: number; advance_amount?: number | string; amount?: number | string; payment_date?: string; date?: string; notes?: string; status?: string }>;
  total_advanced?: number | string;
  remaining_balance?: number | string;
  total_compensation?: number | string;
};
type CompensationSummaryResponse = Summary | {
  booking?: Summary["booking"];
  summary?: Summary["summary"];
  cps?: SummaryCp[];
  submitted?: boolean;
  status?: string;
};

type Props = {
  isOpen: boolean;
  bookingId: string | number;
  creatives: CreativeWithDistance[];
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatPaymentDate = (date: Date) =>
  `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${date.getFullYear()}`;

const parsePaymentDate = (value?: string) => {
  if (!value) return new Date(2026, 1, 6);
  if (value.includes("-")) {
    const [year, month, day] = value.split("-").map(Number);
    return year && month && day ? new Date(year, month - 1, day) : new Date(2026, 1, 6);
  }
  const [month, day, year] = value.split("/").map(Number);
  return month && day && year ? new Date(year, month - 1, day) : new Date(2026, 1, 6);
};

const toApiDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const unwrap = <T,>(response: T | { data?: T }) => {
  const data = response as T | { data?: T };
  return data && typeof data === "object" && "data" in data && (data as { data?: T }).data
    ? (data as { data: T }).data
    : (data as T);
};

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 500) return "Something went wrong";
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    return data?.message || data?.error || error.message || "Something went wrong";
  }
  return "Something went wrong";
};

const numeric = (value?: string | number | null) => Number(String(value ?? "").replace(/[^\d.-]/g, "")) || 0;

const defaultForm = (rateType: RateType = "flat"): CpForm => ({
  rate_type: rateType,
  base_payout: "0",
  editing_payout: "0",
  travel_adjustment: "0",
  bonus_adjustment: "0",
  notes: "",
  hourly_rate: "500",
  hours_worked: "10",
});

const methodToApi = (method: Method) => (method === "equal" ? "equal_split" : method === "role" ? "role_based" : "manual");
const cpKey = (cp: { id?: number; crew_member_id?: number }) => cp.crew_member_id ?? cp.id ?? 0;

const normalizeSummary = (data: CompensationSummaryResponse): Summary => {
  const nested = data.summary;
  return {
    ...data,
    total_shoot_amount: numeric(nested?.total_shoot_amount ?? data.total_shoot_amount ?? data.booking?.shoot_amount),
    total_compensation: numeric(nested?.total_compensation ?? data.total_compensation),
    estimated_margin: numeric(nested?.estimated_margin ?? data.estimated_margin),
    profitability: nested?.profitability ?? data.profitability ?? "healthy",
    exceeds_25_percent: Boolean(nested?.exceeds_25_percent ?? data.exceeds_25_percent),
    cps: data.cps ?? [],
    submitted: data.submitted,
    status: data.status,
  };
};

export function AddCompensationModal({
  isOpen,
  bookingId,
  creatives,
  onClose,
  onSubmit,
  isSubmitting,
}: Props) {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("equal");
  const [expandedId, setExpandedId] = useState<number | null>(creatives[0]?.id ?? null);
  const [rateTypes, setRateTypes] = useState<Record<number, RateType>>({});
  const [hours, setHours] = useState<Record<number, number>>({});
  const [advanceCreative, setAdvanceCreative] = useState<SummaryCp | null>(null);
  const [advancePayments, setAdvancePayments] = useState<Record<number, AdvancePayment>>({});
  const [summary, setSummary] = useState<Summary | null>(null);
  const [cpForms, setCpForms] = useState<Record<number, CpForm>>({});
  const [cpDetails, setCpDetails] = useState<Record<number, CpDetail>>({});
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingCpId, setLoadingCpId] = useState<number | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [touchedCpIds, setTouchedCpIds] = useState<Record<number, boolean>>({});
  const cpList = useMemo<SummaryCp[]>(() => (summary?.cps?.length ? summary.cps : creatives), [creatives, summary?.cps]);
  const shootAmount = summary?.total_shoot_amount ?? 50000;
  const fallbackTotalCompensation = useMemo(() => Math.max(cpList.length, 1) * 6250, [cpList.length]);
  const totalCompensation = summary?.total_compensation ?? fallbackTotalCompensation;
  const estimatedMargin = summary?.estimated_margin ?? Math.max(shootAmount - totalCompensation, 0);
  const profitability = summary?.profitability || (method === "role" ? "Acceptable" : "Healthy");
  const exceeds25 = summary?.exceeds_25_percent ?? method === "role";
  const isSubmitted = submitted || summary?.submitted || summary?.status === "submitted";

  useEffect(() => {
    if (isOpen && expandedId === null && cpList[0]) setExpandedId(cpKey(cpList[0]));
  }, [cpList, expandedId, isOpen]);

  const handleApiError = (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      router.push("/login");
      return;
    }
    toast.error(getErrorMessage(error));
  };

  const fetchSummary = async () => {
    if (!bookingId) return;
    setLoadingSummary(true);
    try {
      const response = await compensationApi.getBookingCompensation(bookingId);
      const data = normalizeSummary(unwrap<CompensationSummaryResponse>(response));
      setSummary(data);
      setSubmitted(Boolean(data.submitted || data.status === "submitted"));
      if (data.cps?.[0] && expandedId === null) setExpandedId(cpKey(data.cps[0]));
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, bookingId]);

  const updateForm = (creativeId: number, patch: Partial<CpForm>, markTouched = true) => {
    if (markTouched) setTouchedCpIds((current) => ({ ...current, [creativeId]: true }));
    setCpForms((current) => ({
      ...current,
      [creativeId]: { ...(current[creativeId] || defaultForm(rateTypes[creativeId] || "flat")), ...patch },
    }));
  };

  const getForm = (creativeId: number) => cpForms[creativeId] || defaultForm(rateTypes[creativeId] || "flat");
  const getCrewMemberId = (creativeId: number) => cpList.find((cp) => cpKey(cp) === creativeId)?.crew_member_id ?? creativeId;

  const calculateCpTotal = (creativeId: number) => {
    const form = getForm(creativeId);
    return form.rate_type === "hourly"
      ? numeric(form.hourly_rate) * numeric(form.hours_worked) + numeric(form.editing_payout) + numeric(form.travel_adjustment) + numeric(form.bonus_adjustment)
      : numeric(form.base_payout) + numeric(form.editing_payout) + numeric(form.travel_adjustment) + numeric(form.bonus_adjustment);
  };

  const fetchCpDetail = async (creativeId: number) => {
    if (!bookingId || cpDetails[creativeId]) return;
    setLoadingCpId(creativeId);
    try {
      const response = await compensationApi.getCpCompensation(bookingId, getCrewMemberId(creativeId));
      const detail = unwrap<CpDetail>(response);
      setCpDetails((current) => ({ ...current, [creativeId]: detail }));
      const rateType = (detail.rate_type as RateType) || rateTypes[creativeId] || "flat";
      setRateTypes((current) => ({ ...current, [creativeId]: rateType }));
      setHours((current) => ({ ...current, [creativeId]: numeric(detail.hours_worked) || current[creativeId] || 10 }));
      setCpForms((current) => ({
        ...current,
        [creativeId]: {
          rate_type: rateType,
          base_payout: String(detail.base_payout ?? (method === "equal" ? (shootAmount * 0.2) / Math.max(cpList.length, 1) : 0)),
          editing_payout: String(detail.editing_payout ?? 0),
          travel_adjustment: String(detail.travel_adjustment ?? 0),
          bonus_adjustment: String(detail.bonus_adjustment ?? 0),
          notes: String(detail.notes ?? ""),
          hourly_rate: String(detail.hourly_rate ?? 500),
          hours_worked: String(detail.hours_worked ?? 10),
        },
      }));
      const latestAdvance = detail.advances?.[0];
      if (latestAdvance) {
        setAdvancePayments((current) => ({
          ...current,
          [creativeId]: {
            id: latestAdvance.id ?? latestAdvance.advance_id,
            amount: numeric(latestAdvance.advance_amount ?? latestAdvance.amount),
            date: formatPaymentDate(parsePaymentDate(latestAdvance.payment_date ?? latestAdvance.date)),
            notes: latestAdvance.notes || "",
            status: latestAdvance.status,
          },
        }));
      }
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 404 &&
        String((error.response.data as { message?: string } | undefined)?.message || "")
          .toLowerCase()
          .includes("compensation not found")
      ) {
        const rateType = rateTypes[creativeId] || (method === "role" ? "hourly" : "flat");
        const base = method === "equal" ? ((shootAmount * 0.2) / Math.max(cpList.length, 1)).toFixed(0) : "0";
        setCpDetails((current) => ({ ...current, [creativeId]: {} }));
        setRateTypes((current) => ({ ...current, [creativeId]: rateType }));
        setHours((current) => ({ ...current, [creativeId]: current[creativeId] || 10 }));
        setCpForms((current) => ({
          ...current,
          [creativeId]: current[creativeId] || {
            ...defaultForm(rateType),
            base_payout: base,
            editing_payout: method === "manual" ? "0" : "750",
            travel_adjustment: "500",
          },
        }));
        return;
      }
      handleApiError(error);
    } finally {
      setLoadingCpId(null);
    }
  };

  useEffect(() => {
    if (isOpen && expandedId) fetchCpDetail(expandedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedId, isOpen]);

  useEffect(() => {
    if (!isOpen || method !== "equal") return;
    const base = ((shootAmount * 0.2) / Math.max(cpList.length, 1)).toFixed(0);
    setCpForms((current) => {
      const next = { ...current };
      cpList.forEach((cp) => {
        const key = cpKey(cp);
        next[key] = { ...(next[key] || defaultForm("flat")), rate_type: "flat", base_payout: base };
      });
      return next;
    });
    setRateTypes((current) => {
      const next = { ...current };
      cpList.forEach((cp) => {
        next[cpKey(cp)] = "flat";
      });
      return next;
    });
  }, [cpList, isOpen, method, shootAmount]);

  useEffect(() => {
    if (!isOpen || method !== "role") return;
    setCpForms((current) => {
      const next = { ...current };
      cpList.forEach((cp) => {
        const key = cpKey(cp);
        next[key] = { ...(next[key] || defaultForm("hourly")), rate_type: "hourly" };
      });
      return next;
    });
    setRateTypes((current) => {
      const next = { ...current };
      cpList.forEach((cp) => {
        next[cpKey(cp)] = "hourly";
      });
      return next;
    });
  }, [cpList, isOpen, method]);

  useEffect(() => {
    if (!isOpen || method !== "manual") return;
    setCpForms((current) => {
      const next = { ...current };
      cpList.forEach((cp) => {
        const key = cpKey(cp);
        next[key] = { ...(next[key] || defaultForm("flat")), rate_type: "flat" };
      });
      return next;
    });
    setRateTypes((current) => {
      const next = { ...current };
      cpList.forEach((cp) => {
        next[cpKey(cp)] = "flat";
      });
      return next;
    });
  }, [cpList, isOpen, method]);

  const saveDraft = async (forceCpIds: number[] = [], refreshAfterSave = true) => {
    const forced = new Set(forceCpIds);
    const cpsToSave = cpList.filter((cp) => touchedCpIds[cpKey(cp)] || forced.has(cpKey(cp)));
    await compensationApi.saveBookingCompensation(bookingId, {
      compensation_method: methodToApi(method),
      cps: cpsToSave.map((cp) => {
        const key = cpKey(cp);
        const form = getForm(key);
        return {
          crew_member_id: cp.crew_member_id ?? key,
          rate_type: form.rate_type,
          base_payout: numeric(form.base_payout),
          editing_payout: numeric(form.editing_payout),
          travel_adjustment: numeric(form.travel_adjustment),
          bonus_adjustment: numeric(form.bonus_adjustment),
          notes: form.notes,
          ...(form.rate_type === "hourly"
            ? { hourly_rate: numeric(form.hourly_rate), hours_worked: numeric(form.hours_worked) }
            : {}),
        };
      }),
    });
    if (refreshAfterSave) await fetchSummary();
  };

  const handleSubmitToFinance = async () => {
    const cpsToSubmit = cpList.filter((cp) => touchedCpIds[cpKey(cp)]);
    if (cpsToSubmit.length === 0) {
      toast.error("Please edit compensation for at least one CP");
      return;
    }
    for (const cp of cpsToSubmit) {
      const key = cpKey(cp);
      const form = getForm(key);
      if (form.rate_type === "flat" && calculateCpTotal(key) <= 0) {
        toast.error("Flat compensation total must be greater than 0");
        return;
      }
      if (form.rate_type === "hourly" && (numeric(form.hourly_rate) <= 0 || numeric(form.hours_worked) <= 0)) {
        toast.error("Hourly rate and hours worked must be greater than 0");
        return;
      }
    }
    setSubmitLoading(true);
    try {
      await saveDraft([], false);
      await compensationApi.submitBookingCompensation(bookingId);
      setSubmitted(true);
      toast.success("Compensation submitted to finance");
      await fetchSummary();
      onSubmit();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        router.push("/login");
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/75 font-sans backdrop-blur-sm">
      <div className="flex h-full w-full flex-col overflow-hidden bg-[#050505] text-white shadow-[-18px_0_50px_rgba(0,0,0,0.5)] sm:max-w-[740px] sm:border-l sm:border-white/15">
        <header className="flex min-h-[82px] items-start justify-between gap-3 border-b border-white/15 px-4 pb-4 pt-4 sm:min-h-[100px] sm:px-6 sm:pb-5 sm:pt-5">
          <div className="min-w-0">
            <h2 className="text-[21px] font-semibold leading-tight sm:text-[28px]">Add Compensation</h2>
            <p className="mt-1.5 text-[13px] text-white/50 sm:text-[15px]">Configure compensation for selected CPs</p>
          </div>
          <button onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#292525] text-white/90 hover:bg-[#353030] sm:h-12 sm:w-12">
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </header>

        <div className="no-scrollbar overflow-y-auto px-4 pb-5 sm:px-7">
          <p className="mb-3 mt-6 text-[15px] font-medium">Select Compensation Method</p>
          <div className="grid min-h-[50px] grid-cols-3 rounded-[8px] border border-white/10 bg-[#1A1A1A] p-1.5 text-[12px] text-white/70 sm:text-[14px]">
            {([["equal", "Equal Split"], ["role", "Role Based"], ["manual", "Manual"]] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => !isSubmitted && setMethod(value)}
                className={`rounded-[5px] px-2 ${method === value ? "bg-[#E8D1AB] text-black" : "hover:text-white"}`}
                disabled={isSubmitted}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="my-4 grid min-h-[100px] grid-cols-1 items-start gap-3 rounded-[8px] bg-[#2D2921] px-4 py-3 min-[420px]:grid-cols-2 sm:grid-cols-4">
            <Metric label="Total Shoot Amount" value={loadingSummary ? "Loading..." : money(shootAmount)} note="Overall Budget" />
            <Metric label="Total Compensation" value={money(totalCompensation)} note={`${shootAmount ? ((totalCompensation / shootAmount) * 100).toFixed(1) : "0.0"}% of budget`} />
            <Metric label="Estimated Margin" value={money(estimatedMargin)} note={`${shootAmount ? ((estimatedMargin / shootAmount) * 100).toFixed(1) : "0.0"}% margin`} green />
            <div>
              <p className="text-[12px] text-white sm:text-[13px]">Profitability Estimation</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-1.5 flex-1 rounded-full bg-[#3B3B3B]">
                  <div className={`h-full rounded-full ${profitability.toLowerCase().includes("acceptable") || exceeds25 ? "w-1/2 bg-[#FF9D00]" : method === "manual" ? "w-[94%] bg-[#12B981]" : "w-2/3 bg-[#12B981]"}`} />
                </div>
                <TrendingUp
                  strokeWidth={2.5}
                  className={`h-5 w-5 shrink-0 sm:h-6 sm:w-6 ${
                    profitability.toLowerCase().includes("acceptable") || exceeds25 ? "text-[#FF9D00]" : "text-[#12B981]"
                  }`}
                />
              </div>
              <p className="mt-2 text-[12px] text-white/55 sm:text-[13px]">{profitability}</p>
            </div>
            {exceeds25 && (
              <div className="flex items-start gap-3 rounded-[8px] bg-[#FFF3C4] px-4 py-3 text-[12px] text-[#A85B00] min-[420px]:col-span-2 sm:col-span-4 sm:text-[13px]">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                <span><strong>Warning: Payout Exceeds 25%</strong><br />Consider reducing compensation to maintain healthy margins.</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {cpList.map((creative, index) => {
              const key = cpKey(creative);
              const expanded = expandedId === key;
              const form = getForm(key);
              const rateType = form.rate_type || rateTypes[key] || "flat";
              const count = numeric(form.hours_worked) || hours[key] || 10;
              const cpTotal = creative.compensation?.total_compensation ? numeric(creative.compensation.total_compensation) : calculateCpTotal(key);
              const name =
                creative.name ||
                [creative.first_name, creative.last_name].filter(Boolean).join(" ") ||
                `Creative ${index + 1}`;
              const role = creative.specialities || creative.role || "Creative Partner";

              return (
                <section key={key} className="overflow-hidden rounded-[8px] bg-[#202020]">
                  <button
                    onClick={() => setExpandedId(expanded ? null : key)}
                    className="flex min-h-[92px] w-full flex-wrap items-center gap-3 border-b border-white/25 px-4 py-4 text-left sm:flex-nowrap sm:px-5"
                  >
                    <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#393939] text-[15px]">
                      {(creative.first_name?.[0] || name[0] || "C").toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-semibold">{name}</span>
                      <span className="block truncate text-[12px] text-white/45">{role}</span>
                    </span>
                    <span className="order-4 w-full rounded-full bg-[#F0DDB8] px-4 py-2 text-[12px] text-black sm:order-none sm:w-auto">
                      <strong className="text-[16px]">{creative.compensation === null ? "Not Set" : money(cpTotal || 0)}</strong>{" "}
                      <span className="text-black/50">{isSubmitted ? "Submitted" : creative.compensation?.status || "Total Compensation"}</span>
                    </span>
                    {expanded ? <ChevronUp size={22} className="ml-auto text-[#E8D1AB] sm:ml-0" /> : <ChevronDown size={22} className="ml-auto sm:ml-0" />}
                  </button>

                  {expanded && (
                    <div className="p-4 sm:p-5">
                      <div className="grid min-h-[54px] grid-cols-2 rounded-[12px] border border-white/15 bg-[#181818] p-1.5 text-[14px] sm:h-[58px] sm:text-[16px]">
                        <RateTab active={rateType === "flat"} onClick={() => {
                          if (isSubmitted) return;
                          setRateTypes((old) => ({ ...old, [key]: "flat" }));
                          updateForm(key, { rate_type: "flat" });
                        }}>
                          Flat Rates
                        </RateTab>
                        <RateTab active={rateType === "hourly"} onClick={() => {
                          if (isSubmitted) return;
                          setRateTypes((old) => ({ ...old, [key]: "hourly" }));
                          updateForm(key, { rate_type: "hourly" });
                        }}>
                          Hourly Rates
                        </RateTab>
                      </div>

                      {rateType === "flat" ? (
                        <Field label="Base Payout*" value={form.base_payout} onChange={(value) => updateForm(key, { base_payout: value })} disabled={isSubmitted} />
                      ) : (
                        <>
                          <div className="mt-5 grid grid-cols-[1fr_auto_auto] items-center gap-2.5 rounded-[13px] border border-white/25 bg-[#101010] px-4 py-4 sm:h-[120px] sm:grid-cols-[minmax(120px,1fr)_48px_minmax(105px,160px)_48px_minmax(105px,160px)_20px] sm:py-0">
                            <div className="min-w-0">
                              <p className="whitespace-nowrap text-[15px] font-medium">Per Hour Rate</p>
                              <p className="mt-2 text-[22px] font-semibold leading-none text-[#E8D1AB]">{money(numeric(form.hourly_rate))}.00</p>
                            </div>
                            <SmallButton onClick={() => {
                              if (isSubmitted) return;
                              const next = Math.max(1, count - 1);
                              setHours((old) => ({ ...old, [key]: next }));
                              updateForm(key, { hours_worked: String(next) });
                            }}>
                              <Minus size={17} />
                            </SmallButton>
                            <span className="col-span-3 flex h-12 w-full items-center justify-center rounded-[9px] border border-white/20 bg-[#181818] text-[15px] font-semibold sm:col-span-1">{count} Hours</span>
                            <SmallButton onClick={() => {
                              if (isSubmitted) return;
                              const next = count + 1;
                              setHours((old) => ({ ...old, [key]: next }));
                              updateForm(key, { hours_worked: String(next) });
                            }}>
                              <Plus size={17} />
                            </SmallButton>
                            <div className="col-span-3 flex h-12 w-full items-center rounded-[9px] border border-white/20 bg-[#181818] px-4 text-[15px] text-white sm:col-span-1"><span className="mr-3 text-white/35">$</span><input value={form.hourly_rate} onChange={(event) => updateForm(key, { hourly_rate: event.target.value.replace(/[^\d.]/g, "") })} disabled={isSubmitted} className="w-full bg-transparent outline-none" /></div>
                            <Check size={19} strokeWidth={2.5} className="hidden text-[#00D084] sm:block" />
                          </div>
                          <div className="mt-6 flex min-h-[70px] flex-col items-start justify-center gap-2 rounded-[15px] bg-[#292929] px-4 py-4 text-[16px] min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between sm:px-9 sm:text-[18px]">
                            <span className="font-medium">Total Hours ({count})</span>
                            <strong className="text-[22px] text-[#E8D1AB]">{money(numeric(form.hourly_rate) * count)}.00</strong>
                          </div>
                        </>
                      )}

                      <p className="mb-3 mt-5 text-[16px] font-medium text-white">Other Payouts</p>
                      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                        <Field label="Editing Payout" value={form.editing_payout} onChange={(value) => updateForm(key, { editing_payout: value })} disabled={isSubmitted} />
                        <Field label="Travel Adjustment" value={form.travel_adjustment} onChange={(value) => updateForm(key, { travel_adjustment: value })} disabled={isSubmitted} />
                      </div>
                      <Field label="Bonus/other Adjustment" value={form.bonus_adjustment} onChange={(value) => updateForm(key, { bonus_adjustment: value })} disabled={isSubmitted} />
                      <fieldset className="mt-4 rounded-[12px] border border-white/25 px-6 pb-4 pt-1">
                        <legend className="px-2 text-[16px] leading-none text-white/55">Notes</legend>
                        <Textarea value={form.notes} onChange={(event) => updateForm(key, { notes: event.target.value })} disabled={isSubmitted} className="min-h-[68px] resize-none rounded-none border-0 bg-transparent px-0 py-2 text-[16px] text-white placeholder:text-white/35 focus:ring-0" />
                      </fieldset>
                      <button onClick={() => {
                        if (isSubmitted) return;
                        setTouchedCpIds((current) => ({ ...current, [key]: true }));
                        setAdvanceCreative(creative);
                      }} disabled={isSubmitted} className="mt-4 flex items-center gap-2 text-[17px] font-normal text-[#E8D1AB] transition-opacity hover:opacity-75">
                        {advancePayments[key] ? <Pencil size={23} /> : <span className="text-[25px] font-light leading-none">+</span>}
                        <span className="underline decoration-[#E8D1AB] underline-offset-3">
                          {advancePayments[key] ? "Edit Advance Payment" : "Add Advance Payment"}
                        </span>
                      </button>
                      {advancePayments[key] && (
                        <div className="mt-5 flex flex-col gap-2 rounded-[12px] bg-[#2B2B2B] px-5 py-4 text-[15px] min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between sm:text-[17px]">
                          <span>Advance: {money(advancePayments[key].amount)} on {advancePayments[key].date}</span>
                          <strong className="text-[#E8D1AB]">Remaining: {money(Math.max(calculateCpTotal(key) - advancePayments[key].amount, 0))}</strong>
                        </div>
                      )}
                      {loadingCpId === key && <p className="mt-3 text-[13px] text-white/45">Loading compensation details...</p>}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>

        <footer className="grid grid-cols-1 gap-3 border-t border-white/10 bg-black px-4 py-4 min-[420px]:grid-cols-2 sm:gap-4 sm:px-8 sm:py-5">
          <Button onClick={onClose} className="h-[52px] rounded-[9px] bg-[#202020] text-[15px] font-semibold text-white hover:bg-[#2A2A2A]">
            Back
          </Button>
          <Button onClick={handleSubmitToFinance} disabled={isSubmitting || submitLoading || isSubmitted} className="h-[52px] rounded-[9px] bg-[#E8D1AB] text-[15px] font-semibold text-black hover:bg-[#DCC397]">
            {isSubmitted ? "Submitted" : isSubmitting || submitLoading ? "Submitting..." : "Submit To Finance"}
          </Button>
        </footer>
      </div>
      <AdvancePaymentModal
        creative={advanceCreative}
        initialValue={advanceCreative ? advancePayments[cpKey(advanceCreative)] : undefined}
        total={advanceCreative ? calculateCpTotal(cpKey(advanceCreative)) : 6250}
        bookingId={bookingId}
        onBeforeSave={() => saveDraft(advanceCreative ? [cpKey(advanceCreative)] : [], false)}
        onClose={() => setAdvanceCreative(null)}
        onSave={async (payment) => {
          if (!advanceCreative) return;
          const key = cpKey(advanceCreative);
          setAdvancePayments((current) => ({ ...current, [key]: payment }));
          setCpDetails((current) => {
            const next = { ...current };
            delete next[key];
            return next;
          });
          await fetchCpDetail(key);
          await fetchSummary();
          setAdvanceCreative(null);
        }}
      />
    </div>
  );
}

function Metric({ label, value, note, green }: { label: string; value: string; note: string; green?: boolean }) {
  return (
    <div>
      <p className="text-[12px] text-white sm:text-[13px]">{label}</p>
      <p className={`mt-1.5 text-[20px] font-semibold sm:text-[23px] ${green ? "text-emerald-400" : label === "Total Compensation" ? "text-[#E8D1AB]" : ""}`}>{value}</p>
      <p className="mt-1 text-[11px] text-white/45 sm:text-[12px]">{note}</p>
    </div>
  );
}

function Field({ label, value, onChange, disabled }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  return (
    <fieldset className="mt-4 min-h-[84px] rounded-[12px] border border-white/25 px-6 pb-3 pt-1">
      <legend className="px-2 text-[16px] leading-none text-white/55">{label}</legend>
      <input value={value} onChange={(event) => onChange(event.target.value.replace(/[^\d.]/g, ""))} disabled={disabled} className="w-full bg-transparent pt-4 text-[16px] text-white outline-none" />
    </fieldset>
  );
}

function RateTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-[10px] ${active ? "border border-[#BDA276] bg-[#403C34] text-[#E8D1AB]" : "text-white/75"}`}>
      {children}
    </button>
  );
}

function SmallButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[9px] bg-[#E8D1AB] text-black">
      {children}
    </button>
  );
}

function AdvancePaymentModal({ creative, initialValue, total, bookingId, onBeforeSave, onClose, onSave }: { creative: SummaryCp | null; initialValue?: AdvancePayment; total: number; bookingId: string | number; onBeforeSave: () => Promise<void>; onClose: () => void; onSave: (payment: AdvancePayment) => Promise<void> }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date | null>(new Date(2026, 1, 6));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const numericAmount = Math.min(Number(amount) || 0, total);
  const name = creative
    ? creative.name || [creative.first_name, creative.last_name].filter(Boolean).join(" ") || "Creative Partner"
    : "";

  useEffect(() => {
    setAmount(initialValue ? String(initialValue.amount) : "");
    setDate(parsePaymentDate(initialValue?.date));
    setNotes(initialValue?.notes || "");
  }, [creative, initialValue]);

  if (!creative) return null;

  const saveAdvance = async () => {
    if (numericAmount <= 0 || numericAmount > total || !date) {
      toast.error("Enter a valid advance amount");
      return;
    }
    setSaving(true);
    try {
      await onBeforeSave();
      const response = await compensationApi.addAdvancePayment(bookingId, creative.crew_member_id ?? creative.id, {
        advance_amount: numericAmount,
        payment_date: toApiDate(date),
        notes,
      });
      const saved = unwrap<{ id?: number; advance_id?: number }>(response);
      toast.success("Advance payment saved");
      await onSave({ id: saved?.id ?? saved?.advance_id, amount: numericAmount, date: formatPaymentDate(date), notes });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = "/login";
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4">
      <div className="no-scrollbar max-h-[94vh] w-full max-w-[680px] overflow-y-auto rounded-[14px] border border-white/20 bg-black text-white shadow-2xl">
        <header className="flex items-center justify-between gap-4 border-b border-white/20 px-4 py-4 sm:px-8 sm:py-6">
          <h3 className="text-[22px] font-semibold sm:text-[27px]">Advance Payment</h3>
          <button onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#292525] sm:h-14 sm:w-14">
            <X className="h-6 w-6 sm:h-7 sm:w-7" />
          </button>
        </header>

        <div className="space-y-5 px-4 py-5 sm:px-8 sm:py-7">
          <div className="rounded-[8px] bg-[#302C24] px-5 py-4">
            <p className="text-[13px]">Total Compensation for {name}</p>
            <p className="mt-1 text-[22px] font-semibold text-[#E8D1AB]">{money(total)}</p>
          </div>

          <fieldset className="min-h-[82px] rounded-[12px] border border-white/30 px-4 pb-3 sm:min-h-[90px] sm:px-5">
            <legend className="px-2 text-[14px] text-white/55 sm:text-[16px]">Enter Advance Amount</legend>
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))}
              placeholder="$0"
              inputMode="decimal"
              className="w-full bg-transparent pt-5 text-[18px] outline-none placeholder:text-white/40"
            />
          </fieldset>

          <DatePicker
            label="Payment Date"
            value={date}
            onChange={setDate}
            format="MM/dd/yyyy"
            floating
            isDark
            disablePortal
            sx={{ minHeight: "90px", borderRadius: "12px" }}
            labelSx={{ fontSize: "16px" }}
          />

          <fieldset className="rounded-[12px] border border-white/30 px-4 pb-4 sm:px-5">
            <legend className="px-2 text-[14px] text-white/55 sm:text-[16px]">Notes</legend>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add notes about this advance payment..." className="min-h-[110px] resize-none rounded-none border-0 bg-transparent px-0 py-4 text-[15px] text-white placeholder:text-white/40 focus:ring-0 sm:min-h-[140px] sm:text-[16px]" />
          </fieldset>

          {numericAmount > 0 && (
            <div className="space-y-3 rounded-[12px] bg-[#2B2B2B] px-4 py-5 text-[15px] sm:px-5 sm:text-[17px]">
              <div className="flex items-center justify-between gap-3"><span>Advance Payment</span><strong>{money(numericAmount)}</strong></div>
              <div className="flex items-center justify-between gap-3"><span>Remaining Balance</span><strong className="text-emerald-400">{money(total - numericAmount)}</strong></div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 pt-3 min-[420px]:grid-cols-2 sm:gap-5">
            <Button onClick={onClose} className="h-14 rounded-[8px] bg-[#242424] text-[16px] text-white hover:bg-[#303030]">Cancel</Button>
            <Button onClick={saveAdvance} disabled={saving || numericAmount <= 0 || numericAmount > total || !date} className="h-14 rounded-[8px] bg-[#E8D1AB] text-[16px] text-black hover:bg-[#DCC397]">{saving ? "Saving..." : "Save Advance"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
