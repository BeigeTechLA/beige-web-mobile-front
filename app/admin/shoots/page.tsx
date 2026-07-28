"use client";
import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { ShootsTable } from '@/components/admin/ShootsTable';

import { Grid3X3, List, Search, RotateCcw, SlidersHorizontal, Loader2, ArrowUpToLine, Download, Pencil, X } from 'lucide-react';
import { SortDateButton } from '@/components/admin/SortDateButton';
import { Button } from '@/src/components/landing/ui/button';
import Topbar from "@/components/admin/Topbar";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useRouter, usePathname } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  format as formatDateFns,
  startOfDay,
} from "date-fns";

import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import DatePicker from "@/components/ui/Datepicker";

const SHOOTS_FILTERS_STORAGE_KEY = "admin-shoots-filters-v1";

const FILTER_STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "initiated", label: "Initiated" },
  { value: "preproduction", label: "Pre Production" },
  { value: "shootday", label: "Shoot Day" },
  { value: "postproduction", label: "Post Production" },
  { value: "revision", label: "Revision" },
  { value: "completed", label: "Completed" },
  { value: "assetsdelivered", label: "Assets Delivered" },
  { value: "cancelled", label: "Cancelled" },
] as const;
const RANGE_FILTER_OPTIONS = new Set([
  "all",
  "today",
  "next_7_days",
  "next_15_days",
  "next_30_days",
  "last_7_days",
  "last_15_days",
  "last_30_days",
  "custom",
]);
const PAYMENT_FILTER_OPTIONS = new Set(["all", "pending", "paid"]);
type PaymentFilter = "all" | "pending" | "paid";

const isPaymentFilter = (value: string): value is PaymentFilter =>
  PAYMENT_FILTER_OPTIONS.has(value);

const normalizeRangeFilter = (value: string) => {
  if (value === "in_1_month") return "next_30_days";
  if (value === "last_1_month") return "last_30_days";
  return RANGE_FILTER_OPTIONS.has(value) ? value : "all";
};

export default function ShootsPage() {
  const router = useRouter()
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const { canCreate } = usePermissions("shoots");

  useEffect(() => setMounted(true), []);
  const pathname = usePathname();

  // --- Filter States ---
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [customRangeStartDate, setCustomRangeStartDate] = useState<Date | null>(null);
  const [customRangeEndDate, setCustomRangeEndDate] = useState<Date | null>(null);
  const [draftCustomRangeStartDate, setDraftCustomRangeStartDate] = useState<Date | null>(null);
  const [draftCustomRangeEndDate, setDraftCustomRangeEndDate] = useState<Date | null>(null);
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [productionFilter, setProductionFilter] = useState("all");
  const [range, setRange] = useState("all");
  const [cpAssignmentFilter, setCpAssignmentFilter] = useState<"all" | "assigned" | "not_assigned">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [hasRestoredFilters, setHasRestoredFilters] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [exportStartDate, setExportStartDate] =
    useState<Date | null>(null);

  const [exportEndDate, setExportEndDate] =
    useState<Date | null>(null);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(SHOOTS_FILTERS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed.searchQuery === "string") setSearchQuery(parsed.searchQuery);
      if (typeof parsed.categoryFilter === "string") setCategoryFilter(parsed.categoryFilter);
      if (typeof parsed.statusFilter === "string") setStatusFilter(parsed.statusFilter);
      if (typeof parsed.paymentFilter === "string") {
        setPaymentFilter(isPaymentFilter(parsed.paymentFilter) ? parsed.paymentFilter : "all");
      }
      if (typeof parsed.productionFilter === "string") setProductionFilter(parsed.productionFilter);
      if (typeof parsed.range === "string") {
        setRange(normalizeRangeFilter(parsed.range));
      }
      if (parsed.cpAssignmentFilter === "all" || parsed.cpAssignmentFilter === "assigned" || parsed.cpAssignmentFilter === "not_assigned") {
        setCpAssignmentFilter(parsed.cpAssignmentFilter);
      }
      if (parsed.viewMode === "grid" || parsed.viewMode === "list") {
        setViewMode(parsed.viewMode);
      }
      if (typeof parsed.selectedDate === "string") {
        const parsedDate = new Date(parsed.selectedDate);
        if (!Number.isNaN(parsedDate.getTime())) {
          setSelectedDate(parsedDate);
        }
      }
      if (typeof parsed.customRangeStartDate === "string") {
        const parsedStartDate = new Date(parsed.customRangeStartDate);
        if (!Number.isNaN(parsedStartDate.getTime())) {
          setCustomRangeStartDate(parsedStartDate);
        }
      }
      if (typeof parsed.customRangeEndDate === "string") {
        const parsedEndDate = new Date(parsed.customRangeEndDate);
        if (!Number.isNaN(parsedEndDate.getTime())) {
          setCustomRangeEndDate(parsedEndDate);
        }
      }
    } catch (error) {
      console.error("Failed to restore shoots filters:", error);
    } finally {
      setHasRestoredFilters(true);
    }
  }, []);

  useEffect(() => {
    if (!hasRestoredFilters) return;
    try {
      window.sessionStorage.setItem(
        SHOOTS_FILTERS_STORAGE_KEY,
        JSON.stringify({
          searchQuery,
          categoryFilter,
          statusFilter,
          paymentFilter,
          productionFilter,
          range,
          cpAssignmentFilter,
          viewMode,
          selectedDate: selectedDate ? selectedDate.toISOString() : null,
          customRangeStartDate: customRangeStartDate ? customRangeStartDate.toISOString() : null,
          customRangeEndDate: customRangeEndDate ? customRangeEndDate.toISOString() : null,
        })
      );
    } catch (error) {
      console.error("Failed to persist shoots filters:", error);
    }
  }, [
    hasRestoredFilters,
    searchQuery,
    categoryFilter,
    statusFilter,
    paymentFilter,
    productionFilter,
    range,
    cpAssignmentFilter,
    viewMode,
    selectedDate,
    customRangeStartDate,
    customRangeEndDate,
  ]);

  const resetAllFilters = () => {
    setSelectedDate(null);
    setCustomRangeStartDate(null);
    setCustomRangeEndDate(null);
    setDraftCustomRangeStartDate(null);
    setDraftCustomRangeEndDate(null);
    setIsCustomRangeOpen(false);
    setSearchQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setPaymentFilter("all");
    setProductionFilter("all");
    setRange("all");
    setCpAssignmentFilter("all");
    setViewMode("list");
    try {
      window.sessionStorage.removeItem(SHOOTS_FILTERS_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear shoots filters:", error);
    }
  };

  const handleDateSort = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      console.log(date);
    } else {
      console.log("unfiltered");
    }
  };

  const openCustomRangeDialog = () => {
    setDraftCustomRangeStartDate(customRangeStartDate);
    setDraftCustomRangeEndDate(customRangeEndDate);
    setIsCustomRangeOpen(true);
  };

  const handleRangeChange = (value: string) => {
    if (value === "custom") {
      setRange("custom");
      openCustomRangeDialog();
      return;
    }

    setRange(value);
    setCustomRangeStartDate(null);
    setCustomRangeEndDate(null);
    setDraftCustomRangeStartDate(null);
    setDraftCustomRangeEndDate(null);
    setIsCustomRangeOpen(false);
  };

  const handleCustomRangeApply = () => {
    if (!draftCustomRangeStartDate || !draftCustomRangeEndDate) {
      toast.error("Select both start and end dates for the custom range.");
      return;
    }

    if (startOfDay(draftCustomRangeStartDate) > startOfDay(draftCustomRangeEndDate)) {
      toast.error("Start date cannot be after end date.");
      return;
    }

    setCustomRangeStartDate(startOfDay(draftCustomRangeStartDate));
    setCustomRangeEndDate(startOfDay(draftCustomRangeEndDate));
    setRange("custom");
    setIsCustomRangeOpen(false);
  };

  const handleCustomRangeCancel = () => {
    setIsCustomRangeOpen(false);
    setDraftCustomRangeStartDate(null);
    setDraftCustomRangeEndDate(null);

    if (!customRangeStartDate && !customRangeEndDate) {
      setRange("all");
    }
  };

  const clearCustomRange = () => {
    setIsCustomRangeOpen(false);
    setDraftCustomRangeStartDate(null);
    setDraftCustomRangeEndDate(null);
    setCustomRangeStartDate(null);
    setCustomRangeEndDate(null);
    setRange("all");
  };

  const currentCustomRangeLabel =
    range === "custom" && customRangeStartDate && customRangeEndDate
      ? `${formatDateFns(startOfDay(customRangeStartDate), "MMM dd, yyyy")} - ${formatDateFns(startOfDay(customRangeEndDate), "MMM dd, yyyy")}`
      : "";

      const handleExportShoots = async () => {
      if (isExporting) {
        return;
      }

      if (Boolean(exportStartDate) !== Boolean(exportEndDate)) {
        toast.error("Select both dates or leave both blank to export all records.");
        return;
      }

      const normalizedStartDate = exportStartDate ? startOfDay(exportStartDate) : null;
      const normalizedEndDate = exportEndDate ? startOfDay(exportEndDate) : null;
      const today = startOfDay(new Date());

      if (
        normalizedStartDate &&
        normalizedEndDate &&
        (normalizedStartDate > today || normalizedEndDate > today)
      ) {
        toast.error("Future dates are not allowed.");
        return;
      }

      if (
        normalizedStartDate &&
        normalizedEndDate &&
        normalizedStartDate > normalizedEndDate
      ) {
        toast.error("Start date cannot be after end date.");
        return;
      }

      const formattedStartDate = normalizedStartDate
        ? formatDateFns(normalizedStartDate, "yyyy-MM-dd")
        : undefined;

      const formattedEndDate = normalizedEndDate
        ? formatDateFns(normalizedEndDate, "yyyy-MM-dd")
        : undefined;

      setIsExporting(true);

      try {
        const customRangeStart = customRangeStartDate ? startOfDay(customRangeStartDate) : null;
        const customRangeEnd = customRangeEndDate ? startOfDay(customRangeEndDate) : null;

        const blob = await adminApi.exportShootsCsv({
          ...(formattedStartDate ? { start_date: formattedStartDate } : {}),
          ...(formattedEndDate ? { end_date: formattedEndDate } : {}),
          ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
          ...(statusFilter !== "all" ? { status: statusFilter } : {}),
          ...(range !== "all" ? { range } : {}),
          ...(range === "custom" && customRangeStart
            ? { start_date: formatDateFns(customRangeStart, "yyyy-MM-dd") }
            : {}),
          ...(range === "custom" && customRangeEnd
            ? { end_date: formatDateFns(customRangeEnd, "yyyy-MM-dd") }
            : {}),
          ...(range === "custom" && !customRangeStart && !customRangeEnd && selectedDate
            ? { date_on: formatDateFns(startOfDay(selectedDate), "yyyy-MM-dd") }
            : {}),
          ...(categoryFilter !== "all" ? { category: categoryFilter } : {}),
          ...(cpAssignmentFilter !== "all" ? { cp_assignment: cpAssignmentFilter } : {}),
          ...(productionFilter !== "all" ? { production_filter: productionFilter } : {}),
        });

        if (!(blob instanceof Blob) || blob.size === 0) {
          throw new Error("Invalid or empty export response.");
        }

        const downloadUrl =
          window.URL.createObjectURL(blob);

        const downloadLink =
          document.createElement("a");

        downloadLink.href = downloadUrl;
        downloadLink.download =
          formattedStartDate && formattedEndDate
            ? `shoots-${formattedStartDate}-to-${formattedEndDate}.csv`
            : "shoots-all-records.csv";

        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();

        window.URL.revokeObjectURL(downloadUrl);

        setIsExportOpen(false);
        setExportStartDate(null);
        setExportEndDate(null);
        toast.success("Shoots exported successfully.");
      } catch (error) {
        console.error("Export Shoots Error:", error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to export shoots."
        );
      } finally {
        setIsExporting(false);
      }
    };

  // Constant default to dark
  const isDark = !mounted || theme === "dark";

  return (
    <>
      <Topbar pathname={pathname}
        actions={
          <div className="flex flex-col lg:flex-row gap-2 lg:gap-3">
            {/* <Button className="text-sm font-semibold text-white h-12 px-4 lg:px-7 rounded-lg bg-[#202020] border border-white/20 hover:bg-white/10 transition-colors ">
              <ArrowUpToLine /> Export
            </Button> */}
            <Button
              onClick={() => router.push("/book-a-shoot")}
              disabled={!canCreate}
              title={canCreate ? "Book a Shoot" : "Create permission not allowed"}
              className="bg-[#E8D1AB] text-black h-12 px-4 lg:px-7"
            >
              Book a Shoot
            </Button>
          </div>
        }
      />

      <div className="overflow-hidden p-4 pb-30 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
        {/* Header */}
        <div className="flex justify-between items-start lg:items-end">
          <div>
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"}`}>Shoots Management</h1>
            <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>Track and manage your photography and videography project</p>
          </div>
          {/* <SortDateButton
            selectedDate={selectedDate}
            onDateChange={handleDateSort}
          /> */}
        </div>
        {/* Search Bar */}
        <div className="flex flex-col gap-3">
          <h3 className={`text-xl font-semibold ${isDark ? "text-white" : "text-[#000000]"}`}>All Shoots</h3>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            {/* Search */}
            <div className="relative w-full flex items-center">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#666]" : "text-[#999]"}`} size={18} />
              <input
                type="text"
                placeholder="Search by project name, email, or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border rounded-lg h-12 pl-10 pr-4 text-sm focus:outline-none transition-colors ${isDark ? "bg-zinc-900 border-[#333333] text-white focus:border-[#E8D1AB]" : "bg-white border-[#E5E5E5] text-black focus:border-[#E8D1AB]"
                  }`}
              />
            </div>

            <div className="flex items-center gap-2 lg:gap-3 justify-between lg:justify-end">
              {/* Filters button */}
              <Button
                className={`h-8 lg:h-12 text-xs lg:text-sm px-3 lg:px-5 transition-colors lg:font-medium border rounded-lg lg:rounded-xl ${isDark ? "border-[#FFFFFF33] bg-[#202020] text-white hover:bg-[#333]" : "border-[#E5E5E5] bg-[#FFFCF6] text-black hover:bg-[#E8D1AB]"}`}
                onClick={() => setShowFilters((prev) => !prev)}
              >
                <SlidersHorizontal size={24} className={`mr-1 transition-colors ${isDark ? "text-white" : "text-black"}`} />
                Filter
              </Button>

              {/* View Toggle */}
              <div className={`hh-12 w-fit flex items-center justify-end border rounded-lg lg:rounded-xl ${isDark ? "border-[#FFFFFF33] bg-[#202020]" : "border-[#E5E5E5] bg-[#FFFCF6]"}`}>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-3.5 transition-colors rounded-l-lg lg:rounded-l-xl ${viewMode === "list"
                    ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                    : isDark
                      ? "bg-transparent text-white/40 hover:text-white"
                      : "bg-transparent text-[#666] hover:text-black"
                    }`}
                >
                  <List size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-3.5 transition-colors rounded-r-lg lg:rounded-r-xl ${viewMode === "grid"
                    ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                    : isDark
                      ? "bg-transparent text-white/40 hover:text-white"
                      : "bg-transparent text-[#666] hover:text-black"
                    }`}
                >
                  <Grid3X3 size={18} />
                </button>
              </div>
            </div>

          </div>

          {/* Filters Group */}
          {
            showFilters && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-col gap-1">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className={`w-[130px] rounded-lg h-8 lg:h-12 text-xs lg:text-sm focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#333333] text-white/70" : "bg-white border-[#E5E5E5] text-[#666]"}`}>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className={`${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5] text-black"}`}>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="wedding">Wedding</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      {/* ... add others as needed */}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className={`w-[120px] rounded-lg h-8 lg:h-12 text-xs lg:text-sm focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#333333] text-white/70" : "bg-white border-[#E5E5E5] text-[#666]"}`}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className={`${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5] text-black"}`}>
                      {FILTER_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <Select
                    value={paymentFilter}
                    onValueChange={(value) => {
                      if (isPaymentFilter(value)) setPaymentFilter(value);
                    }}
                  >
                    <SelectTrigger className={`w-[120px] rounded-lg h-8 lg:h-12 text-xs lg:text-sm focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#333333] text-white/70" : "bg-white border-[#E5E5E5] text-[#666]"}`}>
                      <SelectValue placeholder="Payment" />
                    </SelectTrigger>
                    <SelectContent className={`${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5] text-black"}`}>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <Select value={productionFilter} onValueChange={setProductionFilter}>
                    <SelectTrigger className={`w-[260px] rounded-lg h-8 lg:h-12 text-xs lg:text-sm focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#333333] text-white/70" : "bg-white border-[#E5E5E5] text-[#666]"}`}>
                      <SelectValue placeholder="Production Filter" />
                    </SelectTrigger>
                    <SelectContent className={`${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5] text-black"}`}>
                      <SelectItem value="all">All Production</SelectItem>
                      <div className="pl-3 pr-2 pt-2 pb-1 text-xs font-semibold tracking-wide text-[#E8D1AB] text-left">
                        Pre Production
                      </div>
                      <SelectItem value="pre_production_file_not_provided">File Not Provided</SelectItem>
                      <SelectItem value="pre_production_meeting_not_done">Meeting Not Scheduled</SelectItem>
                      <div className="pl-3 pr-2 pt-2 pb-1 text-xs font-semibold tracking-wide text-[#E8D1AB] text-left">
                        Post Production
                      </div>
                      <SelectItem value="post_production_file_not_uploaded">File Not Uploaded</SelectItem>
                      <SelectItem value="post_production_meeting_not_done">Meeting Not Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <Select value={range === "all" ? "" : range} onValueChange={handleRangeChange}>
                    <SelectTrigger className={`w-[130px] rounded-lg h-8 lg:h-12 text-xs lg:text-sm focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#333333] text-white/70" : "bg-white border-[#E5E5E5] text-[#666]"}`}>
                      <SelectValue placeholder="Shoot Date" />
                    </SelectTrigger>
                    <SelectContent
                      className={`${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5] text-black"} max-h-56`}
                      viewportClassName="!h-auto max-h-56 overflow-y-auto"
                    >
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="next_7_days">Next 7 Days</SelectItem>
                      <SelectItem value="next_15_days">Next 15 Days</SelectItem>
                      <SelectItem value="next_30_days">Next 30 Days</SelectItem>
                      <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                      <SelectItem value="last_15_days">Last 15 Days</SelectItem>
                      <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                      <SelectItem
                        value="custom"
                        onClick={(event) => {
                          event.preventDefault();
                          setRange("custom");
                          openCustomRangeDialog();
                        }}
                        onSelect={(event) => {
                          event.preventDefault();
                          setRange("custom");
                          openCustomRangeDialog();
                        }}
                      >
                        Custom Range
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <Select value={cpAssignmentFilter} onValueChange={(v: "all" | "assigned" | "not_assigned") => setCpAssignmentFilter(v)}>
                    <SelectTrigger className={`w-[170px] rounded-lg h-8 lg:h-12 text-xs lg:text-sm focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#333333] text-white/70" : "bg-white border-[#E5E5E5] text-[#666]"}`}>
                      <SelectValue placeholder="CP Assignment" />
                    </SelectTrigger>
                    <SelectContent className={`${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5] text-black"}`}>
                      <SelectItem value="all">All CP Assignment</SelectItem>
                      <SelectItem value="assigned">CP Assigned</SelectItem>
                      <SelectItem value="not_assigned">CP Not Assigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  onClick={resetAllFilters}
                  aria-label="Reset filters"
                  title="Reset filters"
                  className={`h-8 lg:h-12 w-8 lg:w-12 p-0 rounded-lg flex items-center justify-center ${isDark ? "bg-[#202020] text-white border border-white/10 hover:bg-[#2a2a2a]" : "bg-white text-[#333] border border-[#E5E5E5] hover:bg-[#F7F7F7]"}`}
                >
                  <RotateCcw size={18} />
                </Button>
                <Popover
                  open={isExportOpen}
                  onOpenChange={(open) => {
                    if (!isExporting) {
                      setIsExportOpen(open);
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      disabled={isExporting}
                      aria-label="Export shoots"
                      title="Export shoots"
                      className={`h-8 lg:h-12 px-3 lg:px-4 rounded-lg flex items-center justify-center gap-2 ${
                        isDark
                          ? "bg-[#202020] text-white border border-white/10 hover:bg-[#2a2a2a]"
                          : "bg-white text-[#333] border border-[#E5E5E5] hover:bg-[#F7F7F7]"
                      }`}
                    >
                      {isExporting ? (
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                      ) : (
                        <ArrowUpToLine size={18} />
                      )}

                      <span className="hidden lg:inline">
                        {isExporting ? "Exporting..." : "Export"}
                      </span>
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent
                    align="end"
                    sideOffset={10}
                    className={`w-[340px] rounded-2xl border p-5 ${
                      isDark
                        ? "border-[#3D3D3D] bg-[#171717] text-white"
                        : "border-[#E5E5E5] bg-white text-black"
                    }`}
                  >
                    <div className="space-y-5">
                      <div>
                        <h3 className="text-sm font-semibold">
                          Export Shoots
                        </h3>

                        <p
                          className={`mt-1 text-xs ${
                            isDark
                              ? "text-white/55"
                              : "text-black/55"
                          }`}
                        >
                          Leave both dates blank to download all shoots, or pick a date range to filter the export.
                        </p>
                      </div>

                      <DatePicker
                        label="Start Date"
                        value={exportStartDate}
                        onChange={(date) => {
                          if (!date) {
                            setExportStartDate(null);
                            return;
                          }

                          const normalizedDate = startOfDay(date);
                          const today = startOfDay(new Date());

                          if (normalizedDate > today) {
                            return;
                          }

                          setExportStartDate(normalizedDate);

                          if (
                            exportEndDate &&
                            normalizedDate > startOfDay(exportEndDate)
                          ) {
                            setExportEndDate(normalizedDate);
                          }
                        }}
                        maxDate={
                          exportEndDate
                            ? startOfDay(exportEndDate)
                            : startOfDay(new Date())
                        }
                        disabled={isExporting}
                        isDark={isDark}
                        disablePortal
                        format="MM/dd/yyyy"
                        sx={{ height: "42px" }}
                      />

                      <DatePicker
                        label="End Date"
                        value={exportEndDate}
                        onChange={(date) => {
                          if (!date) {
                            setExportEndDate(null);
                            return;
                          }

                          const normalizedDate = startOfDay(date);
                          const today = startOfDay(new Date());

                          if (normalizedDate > today) {
                            return;
                          }

                          if (
                            exportStartDate &&
                            normalizedDate < startOfDay(exportStartDate)
                          ) {
                            return;
                          }

                          setExportEndDate(normalizedDate);
                        }}
                        minDate={
                          exportStartDate
                            ? startOfDay(exportStartDate)
                            : undefined
                        }
                        maxDate={startOfDay(new Date())}
                        disabled={isExporting}
                        isDark={isDark}
                        disablePortal
                        format="MM/dd/yyyy"
                        sx={{ height: "42px" }}
                      />

                      {(exportStartDate || exportEndDate) && (
                        <button
                          type="button"
                          onClick={() => {
                            setExportStartDate(null);
                            setExportEndDate(null);
                          }}
                          disabled={isExporting}
                          className={`text-xs font-medium underline underline-offset-4 transition-colors ${
                            isDark
                              ? "text-white/70 hover:text-white"
                              : "text-black/60 hover:text-black"
                          }`}
                        >
                          Reset dates
                        </button>
                      )}

                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          type="button"
                          disabled={isExporting}
                          onClick={() => setIsExportOpen(false)}
                          className={
                            isDark
                              ? "border border-[#3D3D3D] bg-transparent text-white hover:bg-white/5"
                              : "border border-[#E3E3E3] bg-white text-black hover:bg-black/5"
                          }
                        >
                          Cancel
                        </Button>

                        <Button
                          type="button"
                          disabled={isExporting}
                          onClick={() => {
                            void handleExportShoots();
                          }}
                          className="bg-[#E5D5B8] text-black hover:bg-[#d4c3a3]"
                        >
                          {isExporting ? (
                            <>
                              <Loader2
                                size={16}
                                className="mr-2 animate-spin"
                              />
                              Exporting...
                            </>
                          ) : (
                            <>
                              <Download
                                size={16}
                                className="mr-2"
                              />
                              Download CSV
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )
          }
        </div>

        {isCustomRangeOpen && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-6"
            onClick={handleCustomRangeCancel}
          >
            <div
              className={`w-full max-w-2xl rounded-2xl border p-5 shadow-2xl ${isDark ? "border-[#3A3A3A] bg-[#171717] text-white" : "border-[#E5E5E5] bg-white text-black"}`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Custom Range</h3>
                  <p className={`mt-1 text-sm ${isDark ? "text-white/60" : "text-black/55"}`}>
                    Choose a start and end date to filter shoots.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <DatePicker
                  label="Start Date"
                  value={draftCustomRangeStartDate}
                  onChange={(date) => {
                    const nextStartDate = date ? startOfDay(date) : null;
                    setDraftCustomRangeStartDate(nextStartDate);

                    if (
                      nextStartDate &&
                      draftCustomRangeEndDate &&
                      nextStartDate > startOfDay(draftCustomRangeEndDate)
                    ) {
                      setDraftCustomRangeEndDate(nextStartDate);
                    }
                  }}
                  isDark={isDark}
                  disablePortal
                  format="MM/dd/yyyy"
                />

                <DatePicker
                  label="End Date"
                  value={draftCustomRangeEndDate}
                  onChange={(date) => {
                    const nextEndDate = date ? startOfDay(date) : null;
                    setDraftCustomRangeEndDate(nextEndDate);

                    if (
                      nextEndDate &&
                      draftCustomRangeStartDate &&
                      nextEndDate < startOfDay(draftCustomRangeStartDate)
                    ) {
                      setDraftCustomRangeStartDate(nextEndDate);
                    }
                  }}
                  isDark={isDark}
                  disablePortal
                  format="MM/dd/yyyy"
                />
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  onClick={handleCustomRangeCancel}
                  className={isDark ? "border border-[#3D3D3D] bg-transparent text-white hover:bg-white/5" : "border border-[#E3E3E3] bg-white text-black hover:bg-black/5"}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={handleCustomRangeApply}
                  className="bg-[#E8D1AB] text-black hover:bg-[#d4c3a3]"
                >
                  Apply Range
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentCustomRangeLabel && (
          <div className={`mb-3 flex flex-col gap-3 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-[#3A3A3A] bg-[#171717] text-white" : "border-[#E5E5E5] bg-white text-black"}`}>
            <div className="flex items-center gap-2">
              <span className={`font-semibold uppercase tracking-wide ${isDark ? "text-[#E8D1AB]" : "text-[#B38B4D]"}`}>
                Saved Range
              </span>
              <span>{currentCustomRangeLabel}</span>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                type="button"
                onClick={openCustomRangeDialog}
                aria-label="Edit custom range"
                title="Edit custom range"
                className={`h-8 w-8 p-0 rounded-lg flex items-center justify-center ${isDark ? "bg-[#202020] text-white border border-white/10 hover:bg-[#2a2a2a]" : "bg-white text-[#333] border border-[#E5E5E5] hover:bg-[#F7F7F7]"}`}
              >
                <Pencil size={15} />
              </Button>

              <Button
                type="button"
                onClick={clearCustomRange}
                aria-label="Clear custom range"
                title="Clear custom range"
                className={`h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-medium ${isDark ? "bg-[#202020] text-white border border-white/10 hover:bg-[#2a2a2a]" : "bg-white text-[#333] border border-[#E5E5E5] hover:bg-[#F7F7F7]"}`}
              >
                <X size={15} />
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* <DottedDivider className="my-0" />  */}
        <ShootsTable
          externalSelectedDate={selectedDate}
          customRangeStartDate={customRangeStartDate}
          customRangeEndDate={customRangeEndDate}
          isCustomRangeOpen={isCustomRangeOpen}
          filtersReady={hasRestoredFilters}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          paymentFilter={paymentFilter}
          setPaymentFilter={setPaymentFilter}
          productionFilter={productionFilter}
          setProductionFilter={setProductionFilter}
          range={range}
          setRange={setRange}
          cpAssignmentFilter={cpAssignmentFilter}
          setCpAssignmentFilter={setCpAssignmentFilter}
          viewMode={viewMode}
          setViewMode={setViewMode}
          showHeaderControls={true}
          showHeaderFilters={false}
          showViewToggle={false}
        />

        {/* --- FLOATING MOBILE BUTTON --- */}
        <div className={`lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"}`}>
          <Button
            onClick={() => router.push('/book-a-shoot')}
            disabled={!canCreate}
            title={canCreate ? "Book a Shoot" : "Create permission not allowed"}
            className="w-full bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
          >
            Book a Shoot
          </Button>
        </div>
      </div>
    </>
  );
}
