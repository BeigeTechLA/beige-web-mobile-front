"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

import Topbar from "@/components/admin/Topbar";
import { DateRangeButton } from "@/components/admin/DateRangeButton";
import { adminApi } from "@/lib/api"; // change to the real path of your big api file
import type { FinanceAnalyticsData } from "@/lib/api"; // same path

import { endOfDay, endOfMonth, endOfWeek, endOfYear, format, startOfDay, startOfMonth, startOfWeek, startOfYear } from "date-fns";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import RevenueOverviewChart from "@/components/admin/finances/RevenueOverviewChart";
import TopCPsByPayout, { type SelectedPayoutCP } from "@/components/admin/finances/TopCPsByPayout";
import TopCPsByShoots, { type SelectedShootCP } from "@/components/admin/finances/TopCPsByShoots";
import AvgPayoutMarginCount from "@/components/admin/finances/AvgPayoutMarginCount";
import TopOverdueCPs, { type OverdueCP } from "@/components/admin/finances/TopOverdueCPs";
import CPPayoutTimeline, { type SelectedPayoutBucket } from "@/components/admin/finances/CPPayoutTimeline";
import ShootDistribution from "@/components/admin/finances/ShootDistribution";
import AvgClientSpendPerShoot from "@/components/admin/finances/AvgClientSpendPerShoot";
import TopClients from "@/components/admin/finances/TopClients";
import ClientPaymentOverview from "@/components/admin/finances/ClientPaymentOverview";
import OutstandingPayment from "@/components/admin/finances/OutstandingPayment";
import DisputesSummary from "@/components/admin/finances/DisputesSummary";
import TopDisputeReasons from "@/components/admin/finances/TopDisputeReasons";
import OverdueShootBreakdownPanel from "@/components/admin/finances/analytics/OverdueShootBreakdownPanel";
import PartnerShootHistoryPanel from "@/components/admin/finances/analytics/PartnerShootHistoryPanel";
import PayoutSchedulePanel from "@/components/admin/finances/analytics/PayoutSchedulePanel";
import PartnerPayoutHistoryPanel from "@/components/admin/finances/analytics/PartnerPayoutHistoryPanel";


export default function FinanceAnalyticsPage() {
  const pathname = usePathname();
  const { isDark } = useResolvedTheme();

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<FinanceAnalyticsData | null>(null);
  const [selectedOverdueCP, setSelectedOverdueCP] = useState<OverdueCP | null>(null);
  const [selectedShootCP, setSelectedShootCP] = useState<SelectedShootCP | null>(null);
  const [selectedClient, setSelectedClient] = useState<SelectedShootCP | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<SelectedPayoutBucket | null>(null);
  const [selectedPayoutCP, setSelectedPayoutCP] = useState<SelectedPayoutCP | null>(null);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [period, setPeriod] = useState<"week" | "month" | "year" | "all" | "custom">("all");

  const handleRangeChange = (start: Date | null, end: Date | null) => {
    setPeriod(start && end ? "custom" : "all");
    setStartDate(start);
    setEndDate(end);
  };

  const handlePeriodChange = (next: "week" | "month" | "year" | "all" | "custom") => {
    setPeriod(next);
    if (next === "all" || next === "custom") {
      if (next === "all") handleRangeChange(null, null);
      return;
    }
    const now = new Date();
    const start = next === "week" ? startOfWeek(now, { weekStartsOn: 1 }) : next === "month" ? startOfMonth(now) : startOfYear(now);
    const end = next === "week" ? endOfWeek(now, { weekStartsOn: 1 }) : next === "month" ? endOfMonth(now) : endOfYear(now);
    setStartDate(startOfDay(start));
    setEndDate(endOfDay(end));
  };

  useEffect(() => {
    const controller = new AbortController();
    setSelectedOverdueCP(null);
    setSelectedShootCP(null);
    setSelectedClient(null);
    setSelectedBucket(null);
    setSelectedPayoutCP(null);

    const load = async () => {
      if (Boolean(startDate) !== Boolean(endDate)) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
      const params =
        startDate && endDate
          ? {
              start_date: format(startDate, "yyyy-MM-dd"),
              end_date: format(endDate, "yyyy-MM-dd"),
              timezone,
            }
          : { timezone }; // no dates = all-time data

      try {
        const res = await adminApi.getFinanceAnalytics(params, controller.signal);
        if (res.canceled) return; // a newer request replaced this one
        if (res.success && res.data) {
          setAnalytics(res.data);
        } else {
          setAnalytics(null);
          const msg = res.error || "Failed to load finance analytics";
          toast.error(
            /forbidden|permission|not allowed/i.test(msg)
              ? "You don't have access to Finance Analytics. Ask an admin for the permission, then sign in again."
              : msg
          );
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setAnalytics(null);
        toast.error(error instanceof Error ? error.message : "Failed to load finance analytics");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [startDate, endDate]);

  return (
    <>
      <Topbar pathname={pathname} />

      <div
        className="overflow-hidden p-4 pb-20 lg:p-6 lg:px-10 lg:py-9 space-y-3 lg:space-y-6"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className={`mb-1 text-lg font-semibold transition-colors duration-100 lg:text-2xl lg:leading-[32px] ${isDark ? "text-white" : "text-black"}`}>
              Finance
            </h1>
            <p className={`text-xs transition-colors duration-100 lg:text-sm ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
              CP earnings, client revenue, and dispute analytics
            </p>
          </div>

          <DateRangeButton
            startDate={startDate}
            endDate={endDate}
            onRangeChange={handleRangeChange}
          />
        </div>

        <>
          <RevenueOverviewChart
            data={analytics?.revenue ?? null}
            loading={loading}
            range={period}
            onRangeChange={handlePeriodChange}
          />
          <div className={`transition-colors duration-300 border rounded-2xl p-5 w-full space-y-3 lg:space-y-6 ${isDark ? "bg-[#171717] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
            {/* Header */}
            <div className="flex items-center gap-2">
              <div className="w-[3px] h-6 bg-[#E5D5B8]" />
              <p className="font-medium text-sm lg:text-base">Creative Partner Analysis</p>
            </div>

            <div className="grid min-w-0 grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-3 lg:gap-6">
              <div className="min-w-0">
                <TopCPsByPayout
                  data={analytics?.creative_partners.top_by_payout ?? null}
                  loading={loading}
                  selectedId={selectedPayoutCP?.id ?? null}
                  onSelectCP={setSelectedPayoutCP}
                />
              </div>
              <div className="min-w-0"><AvgPayoutMarginCount data={analytics?.creative_partners.averages ?? null} loading={loading} /></div>
            </div>

            <PartnerPayoutHistoryPanel
              open={!!selectedPayoutCP}
              onClose={() => setSelectedPayoutCP(null)}
              cpId={selectedPayoutCP?.id ?? ""}
              cpName={selectedPayoutCP?.name ?? ""}
              totalPayout={selectedPayoutCP?.payout ?? 0}
              startDate={startDate ? format(startDate, "yyyy-MM-dd") : null}
              endDate={endDate ? format(endDate, "yyyy-MM-dd") : null}
            />

            <div className="min-w-0">
              <TopCPsByShoots
                data={analytics?.creative_partners.top_by_shoots ?? null}
                loading={loading}
                selectedId={selectedShootCP?.id ?? null}
                onSelectCP={setSelectedShootCP}
              />
              <PartnerShootHistoryPanel
                open={!!selectedShootCP}
                cpName={selectedShootCP?.name ?? ""}
                entityType="cp"
                entityId={selectedShootCP?.id ?? ""}
                startDate={startDate ? format(startDate, "yyyy-MM-dd") : null}
                endDate={endDate ? format(endDate, "yyyy-MM-dd") : null}
              />
            </div>

            <div className="grid min-w-0 grid-cols-1 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] gap-3 lg:gap-6">
              <div className="min-w-0">
                <CPPayoutTimeline
                  data={analytics?.creative_partners.payout_timeline ?? null}
                  loading={loading}
                  selectedId={selectedBucket?.id ?? null}
                  onSelectBucket={(bucket) => {
                    setSelectedBucket(bucket);
                    if (bucket) setSelectedOverdueCP(null);
                  }}
                />
              </div>
              <div className="min-w-0">
                <TopOverdueCPs
                  data={analytics?.creative_partners.top_overdue ?? null}
                  loading={loading}
                  selectedId={selectedOverdueCP?.id ?? null}
                  onSelectCP={(cp) => {
                    setSelectedOverdueCP(cp);
                    if (cp) setSelectedBucket(null);
                  }}
                />
              </div>
            </div>

            <PayoutSchedulePanel
              open={!!selectedBucket}
              bucketId={selectedBucket?.id ?? ""}
              bucketLabel={selectedBucket?.label ?? ""}
              loading={loading}
              startDate={startDate ? format(startDate, "yyyy-MM-dd") : null}
              endDate={endDate ? format(endDate, "yyyy-MM-dd") : null}
            />
            <OverdueShootBreakdownPanel
              open={!!selectedOverdueCP}
              onClose={() => setSelectedOverdueCP(null)}
              cpId={selectedOverdueCP?.id ?? ""}
              cpName={selectedOverdueCP?.name ?? ""}
              totalOverdue={selectedOverdueCP?.amount ?? 0}
              avatarUrl={selectedOverdueCP?.avatarUrl}
              loading={loading}
              startDate={startDate ? format(startDate, "yyyy-MM-dd") : null}
              endDate={endDate ? format(endDate, "yyyy-MM-dd") : null}
            />

          </div>

          <div className={`transition-colors duration-300 border rounded-2xl p-5 w-full space-y-3 lg:space-y-6 ${isDark ? "bg-[#171717] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
            {/* Header */}
            <div className="flex items-center gap-2">
              <div className="w-[3px] h-6 bg-[#E5D5B8]" />
              <p className="font-medium text-sm lg:text-base">Client Analytics</p>
            </div>

            <div className="grid min-w-0 grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-3 lg:gap-6">
              <div className="min-w-0"><TopClients
                shootsData={analytics?.clients.top_by_shoots ?? null}
                spendData={analytics?.clients.top_by_spend ?? null}
                loading={loading}
                selectedId={selectedClient?.id ?? null}
                onSelectClient={(client) => {
                  setSelectedClient(client);
                  if (client) setSelectedShootCP(null);
                }}
              /></div>
              <div className="min-w-0 space-y-3 lg:space-y-4">
                <AvgClientSpendPerShoot
                  data={analytics?.clients ?? null}
                  revenueSeries={analytics?.revenue.series ?? null}
                  loading={loading}
                />
                <ShootDistribution data={analytics?.clients.top_by_shoots ?? null} loading={loading} />
              </div>
            </div>
            <PartnerShootHistoryPanel
              open={!!selectedClient}
              cpName={selectedClient?.name ?? ""}
              entityType="client"
              entityId={selectedClient?.id ?? ""}
              startDate={startDate ? format(startDate, "yyyy-MM-dd") : null}
              endDate={endDate ? format(endDate, "yyyy-MM-dd") : null}
            />

            <div className="grid min-w-0 grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,7fr)] gap-3 lg:gap-6">
              <div className="min-w-0"><ClientPaymentOverview data={analytics?.clients.payment_overview ?? null} loading={loading} /></div>
              <OutstandingPayment data={analytics?.clients.outstanding ?? null} loading={loading} />
            </div>
          </div>

          <div className={`transition-colors duration-300 border rounded-2xl p-5 w-full space-y-3 lg:space-y-6 ${isDark ? "bg-[#171717] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
            {/* Header */}
            <div className="flex items-center gap-2">
              <div className="w-[3px] h-6 bg-[#E5D5B8]" />
              <p className="font-medium text-sm lg:text-base">Disputes Analytics</p>
            </div>

            <DisputesSummary data={analytics?.disputes ?? null} loading={loading} />
            <TopDisputeReasons data={analytics?.disputes.top_reasons ?? null} loading={loading} />
          </div>
        </>

        {/* --- FLOATING MOBILE BUTTON PANEL --- */}
        {/* <div className={`lg:hidden w-full fixed flex items-center justify-center gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] transition-colors duration-100 ${isDark ? "bg-[#0f0f0f]" : "bg-white"}`}>

        </div> */}
      </div >
    </>
  );
}
