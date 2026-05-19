"use client";
import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";

import { ShootsTable } from '@/components/admin/ShootsTable';
import { Grid3X3, List, Search, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { SortDateButton } from '@/components/admin/SortDateButton';
import { Button } from '@/src/components/landing/ui/button';
import { useRouter, usePathname } from 'next/navigation';
import Topbar from "@/components/admin/Topbar";
import DottedDivider from '@/components/admin/DottedDivider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export default function ShootsPage() {
  const router = useRouter()
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const pathname = usePathname();

  // --- Filter States ---
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productionFilter, setProductionFilter] = useState("all");
  const [range, setRange] = useState("all");
  const [cpAssignmentFilter, setCpAssignmentFilter] = useState<"all" | "assigned" | "not_assigned">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [hasRestoredFilters, setHasRestoredFilters] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(SHOOTS_FILTERS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed.searchQuery === "string") setSearchQuery(parsed.searchQuery);
      if (typeof parsed.categoryFilter === "string") setCategoryFilter(parsed.categoryFilter);
      if (typeof parsed.statusFilter === "string") setStatusFilter(parsed.statusFilter);
      if (typeof parsed.productionFilter === "string") setProductionFilter(parsed.productionFilter);
      if (typeof parsed.range === "string") setRange(parsed.range);
      if (parsed.cpAssignmentFilter === "all" || parsed.cpAssignmentFilter === "assigned" || parsed.cpAssignmentFilter === "not_assigned") {
        setCpAssignmentFilter(parsed.cpAssignmentFilter);
      }
      // if (parsed.viewMode === "grid" || parsed.viewMode === "list") {
      //   setViewMode(parsed.viewMode);
      // }
      if (typeof parsed.selectedDate === "string") {
        const parsedDate = new Date(parsed.selectedDate);
        if (!Number.isNaN(parsedDate.getTime())) {
          setSelectedDate(parsedDate);
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
          productionFilter,
          range,
          cpAssignmentFilter,
          viewMode,
          selectedDate: selectedDate ? selectedDate.toISOString() : null,
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
    productionFilter,
    range,
    cpAssignmentFilter,
    viewMode,
    selectedDate,
  ]);

  const resetAllFilters = () => {
    setSelectedDate(null);
    setSearchQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
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
            <Button onClick={() => router.push("/book-a-shoot")} className="bg-[#E5D5B8] text-black h-12 px-4 lg:px-7">
              Book a Shoot
            </Button>
          </div>
        }
      />

      <div className="overflow-hidden p-4 pb-30 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
        {/* Header */}
        <div className="flex justify-between items-start lg:items-end">
          <div>
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"
              }`}>Shoots Management</h1>
            <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"
              }`}>Track and manage your photography and videography project</p>

          </div>
          <SortDateButton
            selectedDate={selectedDate}
            onDateChange={handleDateSort}
          />
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
                placeholder="Search project name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border rounded-lg h-12 pl-10 pr-4 text-sm focus:outline-none transition-colors ${isDark ? "bg-zinc-900 border-[#333333] text-white focus:border-[#E8D1AB]" : "bg-white border-[#E5E5E5] text-black focus:border-[#E8D1AB]"
                  }`}
              />
            </div>

            <div className="flex items-center gap-2 lg:gap-3 justify-between lg:justify-end">
              {/* Filters button */}
              <Button
                className={`h-12 px-3 lg:px-5 transition-colors text-sm font-medium border rounded-lg lg:rounded-xl ${isDark ? "border-[#FFFFFF33] bg-[#202020] text-white hover:bg-[#333]" : "border-[#E5E5E5] bg-[#FFFCF6] text-black hover:bg-[#E8D1AB]"}`}
                onClick={() => setShowFilters((prev) => !prev)}
              >
                <SlidersHorizontal size={24} className={`mr-1 transition-colors ${isDark ? "text-white" : "text-black"}`} />
                Filter
              </Button>

              {/* View Toggle */}
              {/* <div className={`hh-12 w-fit flex items-center justify-end border rounded-lg lg:rounded-xl ${isDark ? "border-[#FFFFFF33] bg-[#202020]" : "border-[#E5E5E5] bg-[#FFFCF6]"}`}>
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
              </div> */}
            </div>

          </div>

          {/* Filters Group */}
          {
            showFilters && (
              <div className="flex flex-wrap items-center gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className={`w-[130px] rounded-lg h-12 text-sm focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#333333] text-white/70" : "bg-white border-[#E5E5E5] text-[#666]"}`}>
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

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className={`w-[120px] rounded-lg h-12 text-sm focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#333333] text-white/70" : "bg-white border-[#E5E5E5] text-[#666]"}`}>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className={`${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5] text-black"}`}>
                    {FILTER_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={productionFilter} onValueChange={setProductionFilter}>
                  <SelectTrigger className={`w-[260px] rounded-lg h-12 text-sm focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#333333] text-white/70" : "bg-white border-[#E5E5E5] text-[#666]"}`}>
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

                <Select value={range} onValueChange={setRange}>
                  <SelectTrigger className={`w-[110px] rounded-lg h-12 text-sm focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#333333] text-white/70" : "bg-white border-[#E5E5E5] text-[#666]"}`}>
                    <SelectValue placeholder="Range" />
                  </SelectTrigger>
                  <SelectContent className={`${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5] text-black"}`}>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                    {selectedDate && <SelectItem value="custom">Selected Date</SelectItem>}
                  </SelectContent>
                </Select>
                <Select value={cpAssignmentFilter} onValueChange={(v: "all" | "assigned" | "not_assigned") => setCpAssignmentFilter(v)}>
                  <SelectTrigger className={`w-[170px] rounded-lg h-12 text-sm focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#333333] text-white/70" : "bg-white border-[#E5E5E5] text-[#666]"}`}>
                    <SelectValue placeholder="CP Assignment" />
                  </SelectTrigger>
                  <SelectContent className={`${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5] text-black"}`}>
                    <SelectItem value="all">All CP Assignment</SelectItem>
                    <SelectItem value="assigned">CP Assigned</SelectItem>
                    <SelectItem value="not_assigned">CP Not Assigned</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={resetAllFilters}
                  aria-label="Reset filters"
                  title="Reset filters"
                  className={`h-12 w-12 p-0 rounded-lg flex items-center justify-center ${isDark ? "bg-[#202020] text-white border border-white/10 hover:bg-[#2a2a2a]" : "bg-white text-[#333] border border-[#E5E5E5] hover:bg-[#F7F7F7]"}`}
                >
                  <RotateCcw size={18} />
                </Button>
              </div>
            )
          }
        </div>

        {/* <DottedDivider className="my-0" />  */}
        <ShootsTable
          externalSelectedDate={selectedDate}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          productionFilter={productionFilter}
          setProductionFilter={setProductionFilter}
          range={range}
          setRange={setRange}
          cpAssignmentFilter={cpAssignmentFilter}
          setCpAssignmentFilter={setCpAssignmentFilter}
          viewMode={"list"}
          // viewMode={viewMode}
          setViewMode={setViewMode}
          showHeaderControls={true}
          showHeaderFilters={false}
          showViewToggle={false}
        />

        {/* --- FLOATING MOBILE BUTTON --- */}
        <div className={`lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"}`}>
          <Button
            onClick={() => router.push('/book-a-shoot')}
            className="w-full bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
          >
            Book a Shoot
          </Button>
        </div>
      </div>
    </>
  );
}
