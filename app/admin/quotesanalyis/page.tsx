"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Camera,
  CalendarCheck,
  CircleDollarSign,
  Contact,
  CreditCard,
  Download,
  FileSpreadsheet,
  Loader2,
  Layers,
  ListPlus,
  Percent,
  Tag,
  Tags,
  Database,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useTheme } from "next-themes";

import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import apiClient from "@/lib/apiClient";

const DEFAULT_REPORT_FILENAME = "Quotes_SelfServe_Analysis.xlsx";
const DEFAULT_SHOOTS_REPORT_FILENAME = "Shoots_Report.xlsx";
const DEFAULT_LEADS_REPORT_FILENAME = "Sales_Leads_Report.xlsx";

const REPORT_SECTIONS = [
  { label: "Services", icon: Layers },
  { label: "Add-ons", icon: Tag },
  { label: "Custom Line Items", icon: ListPlus },
  { label: "Discounts", icon: Percent },
  { label: "Master Data", icon: Database },
];

const SHOOTS_REPORT_SECTIONS = [
  { label: "Shoot Details", icon: Camera },
  { label: "Category", icon: Tags },
  { label: "Amount", icon: CircleDollarSign },
];

const LEADS_REPORT_SECTIONS = [
  { label: "Lead Details", icon: Contact },
  { label: "Booking Info", icon: CalendarCheck },
  { label: "Payment Data", icon: CreditCard },
];

const LEADS_DATE_FILTER_OPTIONS = [
  { label: "All time", value: "all_time" },
  { label: "Last 7 days", value: "last_7_days" },
  { label: "Last 15 days", value: "last_15_days" },
  { label: "Last 1 month", value: "last_1_month" },
  { label: "Last 2 months", value: "last_2_months" },
  { label: "Custom range", value: "custom" },
] as const;

type LeadsDateFilter = (typeof LEADS_DATE_FILTER_OPTIONS)[number]["value"];

const getFilenameFromContentDisposition = (contentDisposition?: string) => {
  if (!contentDisposition) return null;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].replace(/["']/g, ""));
  }

  const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  return filenameMatch?.[1] || null;
};

export default function QuotesAnalysisReportPage() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGeneratingShoots, setIsGeneratingShoots] = useState(false);
  const [shootsErrorMessage, setShootsErrorMessage] = useState<string | null>(null);
  const [isGeneratingLeads, setIsGeneratingLeads] = useState(false);
  const [leadsErrorMessage, setLeadsErrorMessage] = useState<string | null>(null);
  const [leadsDateFilter, setLeadsDateFilter] = useState<LeadsDateFilter>("all_time");
  const [leadsStartDate, setLeadsStartDate] = useState("");
  const [leadsEndDate, setLeadsEndDate] = useState("");

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";

  const panelClasses = useMemo(
    () =>
      isDark
        ? "border-white/10 bg-[#141414] text-white"
        : "border-[#D8D8D8] bg-white text-[#101010] shadow-[0_8px_24px_0_rgba(149,157,165,0.10)]",
    [isDark],
  );

  const inputClasses = isDark
    ? "border-white/10 bg-white/5 text-white"
    : "border-[#00000014] bg-[#00000005] text-[#101010]";
  const selectContentClasses = isDark
    ? "border-white/10 bg-[#141414] text-white"
    : "border-[#D8D8D8] bg-white text-[#101010]";
  const selectItemClasses = isDark
    ? "focus:bg-white/10 focus:text-white"
    : "focus:bg-[#00000008] focus:text-[#101010]";
  const isCustomLeadsRange = leadsDateFilter === "custom";
  const hasIncompleteLeadsRange = isCustomLeadsRange && (!leadsStartDate || !leadsEndDate);
  const hasInvalidLeadsRange = isCustomLeadsRange && !!leadsStartDate && !!leadsEndDate && leadsEndDate < leadsStartDate;
  const isLeadsGenerateDisabled = isGeneratingLeads || hasIncompleteLeadsRange || hasInvalidLeadsRange;

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const response = await apiClient.getInstance().post("/generate-quotes-report", undefined, {
        responseType: "blob",
      });

      const contentType =
        response.headers["content-type"] ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const blob = new Blob([response.data], { type: contentType });
      const downloadUrl = window.URL.createObjectURL(blob);
      const filename =
        getFilenameFromContentDisposition(response.headers["content-disposition"]) ||
        DEFAULT_REPORT_FILENAME;

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Quotes analysis report download started");
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : (error as { status?: number })?.status;
      const message =
        status === 403
          ? "You don't have access to this report."
          : error instanceof Error
            ? error.message
            : "Failed to generate quotes analysis report.";

      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateShootsReport = async () => {
    setIsGeneratingShoots(true);
    setShootsErrorMessage(null);

    try {
      const response = await apiClient.getInstance().post("/generate-shoots-report", undefined, {
        responseType: "blob",
      });

      const contentType =
        response.headers["content-type"] ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const blob = new Blob([response.data], { type: contentType });
      const downloadUrl = window.URL.createObjectURL(blob);
      const filename =
        getFilenameFromContentDisposition(response.headers["content-disposition"]) ||
        DEFAULT_SHOOTS_REPORT_FILENAME;

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Shoots report download started");
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : (error as { status?: number })?.status;
      const message =
        status === 403
          ? "You don't have access to this report."
          : error instanceof Error
            ? error.message
            : "Failed to generate shoots report.";

      setShootsErrorMessage(message);
      toast.error(message);
    } finally {
      setIsGeneratingShoots(false);
    }
  };

  const handleGenerateLeadsReport = async () => {
    if (hasIncompleteLeadsRange || hasInvalidLeadsRange) {
      return;
    }

    setIsGeneratingLeads(true);
    setLeadsErrorMessage(null);

    try {
      const leadsReportBody =
        leadsDateFilter === "all_time"
          ? undefined
          : leadsDateFilter === "custom"
            ? { preset: "custom", start_date: leadsStartDate, end_date: leadsEndDate }
            : { preset: leadsDateFilter };

      const response = await apiClient.getInstance().post("/generate-leads-report", leadsReportBody, {
        responseType: "blob",
      });

      const contentType =
        response.headers["content-type"] ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const blob = new Blob([response.data], { type: contentType });
      const downloadUrl = window.URL.createObjectURL(blob);
      const filename =
        getFilenameFromContentDisposition(response.headers["content-disposition"]) ||
        DEFAULT_LEADS_REPORT_FILENAME;

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Sales leads report download started");
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : (error as { status?: number })?.status;
      const message =
        status === 403
          ? "You don't have access to this report."
          : error instanceof Error
            ? error.message
            : "Failed to generate sales leads report.";

      setLeadsErrorMessage(message);
      toast.error(message);
    } finally {
      setIsGeneratingLeads(false);
    }
  };

  return (
    <>
      <Topbar
        pathname={pathname}
        title="Quotes Analysis Report"
        breadcrumbOverrides={{ quotesanalyis: "quotes analysis report" }}
      />

      <div
        className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="mb-6">
          <h1
            className={`mb-1 text-lg font-semibold transition-colors duration-100 lg:text-2xl lg:leading-[32px] ${isDark ? "text-white" : "text-[#000]"
              }`}
          >
            Quotes Analysis Report
          </h1>
          <p
            className={`max-w-3xl text-xs transition-colors duration-100 lg:text-sm ${isDark ? "text-white/70" : "text-[#000000B2]"
              }`}
          >
            Generate and download all three analysis reports as Excel files.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <section
            className={`max-w-2xl rounded-lg border p-5 transition-all duration-300 hover:shadow-[0_10px_30px_0_rgba(0,0,0,0.18)] hover:border-[#E5D5B8]/60 lg:p-6 ${panelClasses} ${isGenerating ? "border-[#E5D5B8]/70" : ""
              }`}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${isDark
                      ? "bg-gradient-to-br from-[#E5D5B8]/25 to-[#E5D5B8]/5 text-[#E5D5B8]"
                      : "bg-gradient-to-br from-[#F4F0E8] to-[#EDE6D8] text-[#171717]"
                    }`}
                >
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Excel report</h2>
                  <p className={`mt-1 text-sm ${isDark ? "text-white/60" : "text-[#00000099]"}`}>
                    The file will download automatically when it is ready.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {REPORT_SECTIONS.map(({ label, icon: Icon }) => (
                      <span
                        key={label}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors duration-200 ${isDark
                            ? "border-white/10 bg-white/5 text-white/70"
                            : "border-[#00000014] bg-[#00000005] text-[#00000099]"
                          }`}
                      >
                        <Icon size={12} />
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="h-11 w-full shrink-0 bg-[#E5D5B8] px-5 font-semibold text-black transition-all duration-200 hover:bg-[#d4c3a3] disabled:opacity-80 sm:w-auto"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Generate Report
                  </>
                )}
              </Button>
            </div>

            {isGenerating && (
              <div className={`mt-5 h-1 w-full overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-black/10"}`}>
                <div className="h-full w-1/3 animate-[loading-bar_1.1s_ease-in-out_infinite] rounded-full bg-[#E5D5B8]" />
              </div>
            )}

            {errorMessage && (
              <div
                className={`mt-5 rounded-md border px-4 py-3 text-sm ${isDark ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-red-200 bg-red-50 text-red-700"
                  }`}
                role="alert"
              >
                {errorMessage}
              </div>
            )}

            <p className={`mt-5 text-xs ${isDark ? "text-white/40" : "text-[#00000066]"}`}>
              Reports reflect live data at the time of generation.
            </p>
          </section>

          <section
            className={`max-w-2xl rounded-lg border p-5 transition-all duration-300 hover:shadow-[0_10px_30px_0_rgba(0,0,0,0.18)] hover:border-[#E5D5B8]/60 lg:p-6 ${panelClasses} ${isGeneratingShoots ? "border-[#E5D5B8]/70" : ""
              }`}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${isDark
                      ? "bg-gradient-to-br from-[#E5D5B8]/25 to-[#E5D5B8]/5 text-[#E5D5B8]"
                      : "bg-gradient-to-br from-[#F4F0E8] to-[#EDE6D8] text-[#171717]"
                    }`}
                >
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Excel report</h2>
                  <p className={`mt-1 text-sm ${isDark ? "text-white/60" : "text-[#00000099]"}`}>
                    The file will download automatically when it is ready.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {SHOOTS_REPORT_SECTIONS.map(({ label, icon: Icon }) => (
                      <span
                        key={label}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors duration-200 ${isDark
                            ? "border-white/10 bg-white/5 text-white/70"
                            : "border-[#00000014] bg-[#00000005] text-[#00000099]"
                          }`}
                      >
                        <Icon size={12} />
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGenerateShootsReport}
                disabled={isGeneratingShoots}
                className="h-11 w-full shrink-0 bg-[#E5D5B8] px-5 font-semibold text-black transition-all duration-200 hover:bg-[#d4c3a3] disabled:opacity-80 sm:w-auto"
              >
                {isGeneratingShoots ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Generate Report
                  </>
                )}
              </Button>
            </div>

            {isGeneratingShoots && (
              <div className={`mt-5 h-1 w-full overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-black/10"}`}>
                <div className="h-full w-1/3 animate-[loading-bar_1.1s_ease-in-out_infinite] rounded-full bg-[#E5D5B8]" />
              </div>
            )}

            {shootsErrorMessage && (
              <div
                className={`mt-5 rounded-md border px-4 py-3 text-sm ${isDark ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-red-200 bg-red-50 text-red-700"
                  }`}
                role="alert"
              >
                {shootsErrorMessage}
              </div>
            )}

            <p className={`mt-5 text-xs ${isDark ? "text-white/40" : "text-[#00000066]"}`}>
              Reports reflect live data at the time of generation.
            </p>
          </section>

          <section
            className={`max-w-2xl rounded-lg border p-5 transition-all duration-300 hover:shadow-[0_10px_30px_0_rgba(0,0,0,0.18)] hover:border-[#E5D5B8]/60 lg:p-6 ${panelClasses} ${isGeneratingLeads ? "border-[#E5D5B8]/70" : ""
              }`}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${isDark
                      ? "bg-gradient-to-br from-[#E5D5B8]/25 to-[#E5D5B8]/5 text-[#E5D5B8]"
                      : "bg-gradient-to-br from-[#F4F0E8] to-[#EDE6D8] text-[#171717]"
                    }`}
                >
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Excel report</h2>
                  <p className={`mt-1 text-sm ${isDark ? "text-white/60" : "text-[#00000099]"}`}>
                    The file will download automatically when it is ready.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {LEADS_REPORT_SECTIONS.map(({ label, icon: Icon }) => (
                      <span
                        key={label}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors duration-200 ${isDark
                            ? "border-white/10 bg-white/5 text-white/70"
                            : "border-[#00000014] bg-[#00000005] text-[#00000099]"
                          }`}
                      >
                        <Icon size={12} />
                        {label}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    <Select
                      value={leadsDateFilter}
                      onValueChange={(value) => {
                        setLeadsDateFilter(value as LeadsDateFilter);
                        setLeadsErrorMessage(null);
                      }}
                    >
                      <SelectTrigger className={inputClasses}>
                        <SelectValue placeholder="All time" />
                      </SelectTrigger>
                      <SelectContent className={selectContentClasses}>
                        {LEADS_DATE_FILTER_OPTIONS.map(({ label, value }) => (
                          <SelectItem key={value} value={value} className={selectItemClasses}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {isCustomLeadsRange && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          type="date"
                          aria-label="Start date"
                          value={leadsStartDate}
                          onChange={(event) => {
                            setLeadsStartDate(event.target.value);
                            setLeadsErrorMessage(null);
                          }}
                          className={inputClasses}
                        />
                        <Input
                          type="date"
                          aria-label="End date"
                          value={leadsEndDate}
                          onChange={(event) => {
                            setLeadsEndDate(event.target.value);
                            setLeadsErrorMessage(null);
                          }}
                          className={inputClasses}
                        />
                      </div>
                    )}

                    {hasInvalidLeadsRange && (
                      <p className={`text-xs ${isDark ? "text-red-200" : "text-red-700"}`}>
                        End date cannot be before start date.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGenerateLeadsReport}
                disabled={isLeadsGenerateDisabled}
                className="h-11 w-full shrink-0 bg-[#E5D5B8] px-5 font-semibold text-black transition-all duration-200 hover:bg-[#d4c3a3] disabled:opacity-80 sm:w-auto"
              >
                {isGeneratingLeads ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Generate Report
                  </>
                )}
              </Button>
            </div>

            {isGeneratingLeads && (
              <div className={`mt-5 h-1 w-full overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-black/10"}`}>
                <div className="h-full w-1/3 animate-[loading-bar_1.1s_ease-in-out_infinite] rounded-full bg-[#E5D5B8]" />
              </div>
            )}

            {leadsErrorMessage && (
              <div
                className={`mt-5 rounded-md border px-4 py-3 text-sm ${isDark ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-red-200 bg-red-50 text-red-700"
                  }`}
                role="alert"
              >
                {leadsErrorMessage}
              </div>
            )}

            <p className={`mt-5 text-xs ${isDark ? "text-white/40" : "text-[#00000066]"}`}>
              Reports reflect live data at the time of generation.
            </p>
          </section>
        </div>
      </div>

      <style jsx global>{`
        @keyframes loading-bar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(300%);
          }
        }
      `}</style>
    </>
  );
}
