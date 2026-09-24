"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { usePathname } from "next/navigation";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import Cookies from "js-cookie";
import {
  Loader2,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { salesApi } from "@/lib/api";
import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { QuotesAnalyticsTable } from "@/components/admin/quotes/QuotesAnalyticsTable";
import QuotesOverdueWidget from "@/components/admin/quotes/QuotesOverdue";
import OpenPipelineWidget from "@/components/admin/quotes/OpenPipeline";
import ConversionPerformanceWidget from "@/components/admin/quotes/ConversionPerformance";
import QuotePerformanceWidget from "@/components/admin/quotes/QuotePerformance";
// import { shootTypes } from "@/app/data/shootData";
import DateFilter, {
  type DatePreset,
} from "@/components/admin/quotes/DateFilter";

type SalesRepOption = {
  id: string;
  name: string;
  role?: string;
  email?: string;
};

export default function QuotePricingPage() {
  const pathname = usePathname();
  const { isDark } = useResolvedTheme();

  const [loading, setLoading] = useState(true);
  const [quoteAnalyticsData, setQuoteAnalyticsData] = useState<any>(null);
  const [overdueQuotes, setOverdueQuotes] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [isDateOpen, setIsDateOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState<DatePreset>("all");
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [selectedSalesperson, setSelectedSalesperson] = useState("");
  const [salespersonOptions, setSalespersonOptions] = useState<SalesRepOption[]>([]);
  const [quoteStatusOptions, setQuoteStatusOptions] = useState<any[]>([]);
  const [paymentStatusOptions, setPaymentStatusOptions] = useState<any[]>([]);
  const [leadSourceOptions, setLeadSourceOptions] = useState<any[]>([]);
  const [serviceOptions, setServiceOptions] = useState<any[]>([]);
  const [customerTypeOptions, setCustomerTypeOptions] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [selectedQuoteStatus, setSelectedQuoteStatus] = useState("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("");
  const [selectedLeadSource, setSelectedLeadSource] = useState("");
  const [selectedCustomerType, setSelectedCustomerType] = useState("");
  const [overduePage, setOverduePage] = useState(1);
  const [overdueLoading, setOverdueLoading] = useState(false);

  const analyticsParams = useMemo<Record<string, string>>(() => {
    const params: Record<string, string> = {};

    if (selectedSalesperson && selectedSalesperson !== "all") params.sales_rep_id = selectedSalesperson;
    if (selectedService && selectedService !== "all") params.service = selectedService;
    if (selectedQuoteStatus && selectedQuoteStatus !== "all") params.quote_status = selectedQuoteStatus;
    if (selectedPaymentStatus && selectedPaymentStatus !== "all") params.payment_status = selectedPaymentStatus;
    if (selectedLeadSource && selectedLeadSource !== "all") params.lead_source = selectedLeadSource;
    if (selectedCustomerType && selectedCustomerType !== "all") params.customer_type = selectedCustomerType;

    if (selectedDate === "all") {
      params.date_preset = "all_time";
    } else if (selectedDate === "custom") {
      if (selectedStartDate) params.start_date = format(selectedStartDate, "yyyy-MM-dd");
      if (selectedEndDate) params.end_date = format(selectedEndDate, "yyyy-MM-dd");
    } else {
      const datePresetMap: Record<string, string> = {
        today: "today", yesterday: "yesterday", last7Days: "last_7_days",
        last30Days: "last_30_days", thisMonth: "this_month", lastMonth: "last_month",
        thisQuarter: "this_quarter", lastQuarter: "last_quarter", yearToDate: "year_to_date",
      };
      params.date_preset = datePresetMap[selectedDate];
    }

    return params;
   }, [selectedDate, selectedStartDate, selectedEndDate, selectedSalesperson, selectedService, selectedQuoteStatus, selectedPaymentStatus, selectedLeadSource, selectedCustomerType]);

const fetchQuoteAnalytics = useCallback(async () => {
  try {
    setLoading(true);
    const response = await salesApi.getQuoteAnalytics(analyticsParams);

    if (!response?.success) {
      toast.error(response?.error || "Failed to fetch quote analytics");
      return;
    }

    setQuoteAnalyticsData(response.data);
    console.log("Quote Analytics Response:", response.data);
  } catch (error) {
    console.error("Quote Analytics Error:", error);
    toast.error("Failed to fetch quote analytics");
  } finally {
    setLoading(false);
  }
}, [
  analyticsParams,
]);

const fetchQuoteAnalyticsQuotes = useCallback(async () => {
  try {
    setOverdueLoading(true);
    const [overdueResponse] = await Promise.all([
      salesApi.getQuoteAnalyticsQuotes({
        bucket: "overdue_follow_ups",
        page: overduePage,
        limit: 10,
        ...analyticsParams,
      }),
    ]);

    if (overdueResponse?.success) {
      setOverdueQuotes(overdueResponse.data);
    }
  } catch (error) {
    console.error("Quote Analytics Quotes Error:", error);
  } finally {
    setOverdueLoading(false);
  }
}, [analyticsParams, overduePage]);

  useEffect(() => {
  void fetchQuoteAnalytics();
}, [fetchQuoteAnalytics]);

  useEffect(() => {
  void fetchQuoteAnalyticsQuotes();
}, [fetchQuoteAnalyticsQuotes]);


  useEffect(() => {
    const fetchSalesReps = async () => {
      const response = await salesApi.getSalesReps();
      if (!response?.success || !Array.isArray(response.data)) {
        setSalespersonOptions([]);
        return;
      }

      const uniqueSalespersonMap = new Map<string, SalesRepOption>();
      response.data.forEach((salesRep: { id?: unknown; name?: unknown; role?: unknown; email?: unknown }) => {
        const id = String(salesRep?.id ?? "").trim();
        const name = String(salesRep?.name ?? "").trim();
        if (!id || !name || uniqueSalespersonMap.has(id)) return;
        uniqueSalespersonMap.set(id, {
          id,
          name,
          role: String(salesRep?.role ?? "").trim() || undefined,
          email: String(salesRep?.email ?? "").trim() || undefined,
        });
      });

      setSalespersonOptions(Array.from(uniqueSalespersonMap.values()));
    };
    
    void fetchSalesReps();
  }, []);

  useEffect(() => {
  const fetchQuoteAnalyticsFilters = async () => {
    const response = await salesApi.getQuoteAnalyticsFilters();

    if (!response?.success || !response.data) {
      return;
    }

    setQuoteStatusOptions(response.data.quote_statuses ?? []);
    setPaymentStatusOptions(response.data.payment_statuses ?? []);
    setLeadSourceOptions(response.data.lead_sources ?? []);
    setCustomerTypeOptions(response.data.customer_types ?? []);
    setServiceOptions(response.data.services ?? []);
  };

  void fetchQuoteAnalyticsFilters();
}, []);

  return (
    <>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{ create: "Master Pricing" }}
        actions={
          <></>
        }
      />

      <div
        className="overflow-hidden p-4 pb-20 lg:p-6 lg:px-10 lg:py-9 space-y-6"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="flex items-center lg:items-end gap-4 justify-between">
          <div>
            <h1 className={`mb-1 text-base font-semibold transition-colors duration-100 lg:text-2xl lg:leading-[32px] ${isDark ? "text-white" : "text-black"}`}>
              Quote Analytics
            </h1>
            <p className={`text-xs transition-colors duration-100 lg:text-sm ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
              Monitor quote performance, conversion, revenue, and pipeline health.
            </p>
          </div>
          <Button
            className={`shrink-0 flex items-center justify-between gap-1 lg:gap-2 px-3 py-1.5 lg:px-5 lg:py-3 transition-all text-xs lg:text-sm lg:font-medium shadow-sm whitespace-nowrap rounded-lg lg:rounded-xl border ${isDark
              ? "bg-[#202020] border-white/20 text-white hover:text-[#C4C4C4] hover:border-white/30"
              : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232] hover:opacity-80"
              }`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={24} />
            <span>Filters</span>
          </Button>
        </div>

        {
          showFilters &&
          <div className={`flex flex-wrap lg:flex-nowrap gap-4 rounded-lg lg:rounded-xl p-3.5 ${isDark ? "bg-[#171717]" : "bg-[#E8E8E8]"}`}>
            {/* Date */}
           <DateFilter
            isDark={isDark}
            onChange={(preset, dateRange) => {
              setSelectedDate(preset);
              setSelectedStartDate(dateRange.startDate);
              setSelectedEndDate(dateRange.endDate);
            }}
          />

            {/* Sales Rep */}
            <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
              <SelectTrigger
                className={`h-12 p-2.5 lg:p-4 w-fit lg:w-full rounded-lg lg:rounded-xl text-xs lg:text-sm medium focus:ring-[#E5D5B8]/40 ${isDark
                  ? "border-white/20 bg-[#202020] text-white"
                  : "border-[#E3E3E3] bg-white text-black/70"
                  }`}
              >
                <SelectValue placeholder="Sales Rep" className="text-sm medium" />
              </SelectTrigger>
              <SelectContent
                className={
                  isDark
                    ? "border-white/20 bg-[#161616] text-white text-sm medium"
                    : "border-[#E3E3E3] bg-white text-black text-sm medium"
                }
              >
                <SelectItem value="all">All Salesperson</SelectItem>
                {salespersonOptions.map((salesperson) => (
                  <SelectItem key={salesperson.id} value={salesperson.id}>
                    <div className="flex flex-col leading-tight">
                      <span className="capitalize">{salesperson.name}</span>
                      {salesperson.email ? (
                        <span className={`mt-0.5 text-xs ${isDark ? "text-white/60" : "text-black/60"}`}>
                          {salesperson.email}
                        </span>
                      ) : null}
                      {salesperson.role ? (
                        <span className={`mt-0.5 text-xs capitalize ${isDark ? "text-white/45" : "text-black/45"}`}>
                          {salesperson.role}
                        </span>
                      ) : null}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Service */}
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger
                className={`h-12 p-2.5 lg:p-4 w-fit lg:w-full rounded-lg lg:rounded-xl text-xs lg:text-sm medium focus:ring-[#E5D5B8]/40 ${isDark
                  ? "border-white/20 bg-[#202020] text-white"
                  : "border-[#E3E3E3] bg-white text-black/70"
                  }`}
              >
                <SelectValue placeholder="Service" className="text-sm medium" />              </SelectTrigger>
              <SelectContent
                className={
                  isDark
                    ? "border-white/20 bg-[#161616] text-white text-sm medium"
                    : "border-[#E3E3E3] bg-white text-black text-sm medium"
                }
              >
                <SelectItem value="all">All Services</SelectItem>
                {serviceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col leading-tight">
                      <span className="capitalize">{option.label ?? option.value}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Quote Status: Optiosn to be updated as per availability */}
            <Select value={selectedQuoteStatus} onValueChange={setSelectedQuoteStatus}>
              <SelectTrigger
                className={`h-12 p-2.5 lg:p-4 w-fit lg:w-full rounded-lg lg:rounded-xl text-xs lg:text-sm medium focus:ring-[#E5D5B8]/40 ${isDark
                  ? "border-white/20 bg-[#202020] text-white"
                  : "border-[#E3E3E3] bg-white text-black/70"
                  }`}
              >
                <SelectValue placeholder="Quote Status" className="text-sm medium" />
              </SelectTrigger>
              <SelectContent
                className={
                  isDark
                    ? "border-white/20 bg-[#161616] text-white text-sm medium"
                    : "border-[#E3E3E3] bg-white text-black text-sm medium"
                }
              >
                <SelectItem value="all">All Statuses</SelectItem>
                {quoteStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col leading-tight capitalize">
                      <span className="capitalize">{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Payment Status: Options to be updated as per availability */}
            <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
              <SelectTrigger
                className={`h-12 p-2.5 lg:p-4 w-fit lg:w-full rounded-lg lg:rounded-xl text-xs lg:text-sm medium focus:ring-[#E5D5B8]/40 ${isDark
                  ? "border-white/20 bg-[#202020] text-white"
                  : "border-[#E3E3E3] bg-white text-black/70"
                  }`}
              >
                <SelectValue placeholder="Payment Status" className="text-sm medium" />
              </SelectTrigger>
              <SelectContent
                className={
                  isDark
                    ? "border-white/20 bg-[#161616] text-white text-sm medium"
                    : "border-[#E3E3E3] bg-white text-black text-sm medium"
                }
              >
                <SelectItem value="all">All Statuses</SelectItem>
                {paymentStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col leading-tight capitalize">
                      <span className="capitalize">{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Lead Source: Options to be updated as per availability */}
            {/* <Select value={selectedLeadSource} onValueChange={setSelectedLeadSource}>
              <SelectTrigger
                className={`h-12 p-2.5 lg:p-4 w-fit lg:w-full rounded-lg lg:rounded-xl text-xs lg:text-sm medium focus:ring-[#E5D5B8]/40 ${isDark
                  ? "border-white/20 bg-[#202020] text-white"
                  : "border-[#E3E3E3] bg-white text-black/70"
                  }`}
              >
                <SelectValue placeholder="Lead Source" className="text-sm medium" />
              </SelectTrigger>
              <SelectContent
                className={
                  isDark
                    ? "border-white/20 bg-[#161616] text-white text-sm medium"
                    : "border-[#E3E3E3] bg-white text-black text-sm medium"
                }
              >
                <SelectItem value="all">All Lead Sources</SelectItem>
                {leadSourceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col leading-tight">
                      <span className="capitalize">{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select> */}

            {/* Customer Type: Options to be updated as per availability */}
            <Select value={selectedCustomerType} onValueChange={setSelectedCustomerType}>
              <SelectTrigger
                className={`h-12 p-2.5 lg:p-4 w-fit lg:w-full rounded-lg lg:rounded-xl text-xs lg:text-sm medium focus:ring-[#E5D5B8]/40 ${isDark
                  ? "border-white/20 bg-[#202020] text-white"
                  : "border-[#E3E3E3] bg-white text-black/70"
                  }`}
              >
                <SelectValue placeholder="Customer Type" className="text-sm medium" />
              </SelectTrigger>
              <SelectContent className={isDark ? "border-white/20 bg-[#161616] text-white text-sm medium"
                : "border-[#E3E3E3] bg-white text-black text-sm medium"
              }
              >
                <SelectItem value="all">All Customer Types</SelectItem>
                {customerTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col leading-tight">
                      <span className="capitalize">{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div >
        }

        {loading ? (
          <div
            className={`flex min-h-[480px] flex-col items-center justify-center gap-3 rounded-lg border lg:rounded-2xl ${isDark ? "border-white/10 bg-[#171717] text-white" : "border-[#E5E5E5] bg-white text-black"}`}
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-8 w-8 animate-spin text-[#E8D1AB]" />
            <span className="text-sm">Loading quote analytics…</span>
          </div>
        ) : (
          <div className="space-y-3 lg:space-y-6">
            <div className="w-full flex flex-col lg:flex-row items-stretch gap-5">
              <div className="w-full lg:w-3/5 flex flex-col">
              <QuotePerformanceWidget
                data={quoteAnalyticsData?.performance_chart ?? []}
                overview={quoteAnalyticsData?.overview}
              />
              </div>
              <div className="w-full lg:w-2/5 flex flex-col">
                <ConversionPerformanceWidget
                  data={quoteAnalyticsData?.overview ?? undefined}
                />
              </div>
            </div>
            <div>
              <OpenPipelineWidget
                data={quoteAnalyticsData?.overview?.open_pipeline ?? undefined}
                filters={analyticsParams}
                />
            </div>
            <div>
              <QuotesOverdueWidget
                data={quoteAnalyticsData?.overview?.overdue_follow_ups ?? undefined}
                loading={overdueLoading}
                quotesData={overdueQuotes}
                onPageChange={setOverduePage}
              />
            </div>
            <div>
              <QuotesAnalyticsTable isDark={isDark}
              loading={loading}
              data={quoteAnalyticsData?.rep_performance ?? []}
              />
            </div>
          </div>
        )}

        {/* --- FLOATING MOBILE BUTTON PANEL --- */}
        {/* <div className={`lg:hidden w-full fixed flex items-center justify-center gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] transition-colors duration-100 ${isDark ? "bg-[#0f0f0f]" : "bg-white"}`}>

        </div> */}
      </div >
    </>
  );
}
