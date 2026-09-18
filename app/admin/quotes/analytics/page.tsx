"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { usePathname } from "next/navigation";
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
  Video,
  Camera,
  Scissors,
  Radio,
  MapPin,
  Package,
  Zap,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Search,
  Loader2,
  ChevronDown,
  AlertCircle,
  RefreshCw,
  ArrowUpToLine,
  Calendar,
  SlidersHorizontal,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { salesApi } from "@/lib/api";
import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { Box } from "@mui/material";

import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import { format } from "date-fns";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { QuotesAnalyticsTable } from "@/components/admin/quotes/QuotesAnalyticsTable";
import QuotesOverdueWidget from "@/components/admin/quotes/QuotesOverdue";
import OpenPipelineWidget from "@/components/admin/quotes/OpenPipeline";
import ConversionPerformanceWidget from "@/components/admin/quotes/ConversionPerformance";
import QuotePerformanceWidget from "@/components/admin/quotes/QuotePerformance";

type SalesRepOption = {
  id: string;
  name: string;
  role?: string;
};

export default function QuotePricingPage() {
  const pathname = usePathname();
  const { isDark } = useResolvedTheme();

  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [isDateOpen, setIsDateOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSalesperson, setSelectedSalesperson] = useState("");
  const [salespersonOptions, setSalespersonOptions] = useState<SalesRepOption[]>([]);


  useEffect(() => {
    const fetchSalesReps = async () => {
      const response = await salesApi.getSalesReps();
      if (!response?.success || !Array.isArray(response.data)) {
        setSalespersonOptions([]);
        return;
      }

      const uniqueSalespersonMap = new Map<string, SalesRepOption>();
      response.data.forEach((salesRep: { id?: unknown; name?: unknown; role?: unknown }) => {
        const id = String(salesRep?.id ?? "").trim();
        const name = String(salesRep?.name ?? "").trim();
        if (!id || !name || uniqueSalespersonMap.has(id)) return;
        uniqueSalespersonMap.set(id, { id, name, role: String(salesRep?.role ?? "").trim() || undefined });
      });

      setSalespersonOptions(Array.from(uniqueSalespersonMap.values()));
    };

    void fetchSalesReps();
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className={`mb-1 text-lg font-semibold transition-colors duration-100 lg:text-2xl lg:leading-[32px] ${isDark ? "text-white" : "text-black"}`}>
              Quote Analytics
            </h1>
            <p className={`text-xs transition-colors duration-100 lg:text-sm ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
              Monitor quote performance, conversion, revenue, and pipeline health.
            </p>
          </div>
          <Button
            className={`shrink-0 flex items-center justify-between gap-1 lg:gap-2 px-3 py-1.5 lg:px-5 lg:py-3 transition-all text-xs lg:text-sm lg:font-medium shadow-sm whitespace-nowrap rounded-xl border ${isDark
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
          <div className={`flex gap-4 rounded-lg lg:rounded-xl p-3.5 ${isDark ? "bg-[#171717]" : "bg-[#E8E8E8]"}`}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Box sx={{ position: "relative" }}>
                <div className="flex items-center gap-2">
                  {/* Styled Trigger Button */}
                  <button
                    onClick={() => setIsDateOpen(true)}
                    className={`h-12 shrink-0 flex items-center justify-between gap-1 lg:gap-3 p-4 transition-all text-xs lg:text-base lg:font-medium shadow-sm whitespace-nowrap rounded-lg lg:rounded-xl border  ${isDark
                      ? "bg-[#202020] border-white/20 text-white hover:text-[#C4C4C4] hover:border-white/30"
                      : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232] hover:opacity-80"
                      }`}
                  >
                    <span className="whitespace-nowrap text-sm medium">
                      {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Date"}
                    </span>
                    <ChevronDown className={`w-4 h-4 lg:w-6 lg:h-6 shrink-0 ${isDark ? "text-white" : "text-[#323232]"}`} />
                  </button>

                  {selectedDate && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate(null);
                        setIsDateOpen(false);
                      }}
                      className={`h-8 w-8 lg:h-10 lg:w-10 rounded-full border transition-all flex items-center justify-center ${isDark ? "border-white/10 bg-[#1A1A1A] text-[#C4C4C4] hover:text-white hover:border-white/30" : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232] hover:opacity-80"}`}
                      aria-label="Clear date filter"
                    >
                      <X className="w-4 h-4 lg:w-5 lg:h-5" />
                    </button>
                  )}
                </div>

                {/* Hidden MUI DatePicker */}
                <div className="invisible absolute top-0 left-0 h-0 w-0">
                  <DesktopDatePicker
                    open={isDateOpen}
                    onOpen={() => setIsDateOpen(true)}
                    onClose={() => setIsDateOpen(false)}
                    value={selectedDate}
                    onChange={(newValue) => {
                      setSelectedDate(newValue);
                      setIsDateOpen(false);
                    }}
                    slotProps={{
                      desktopPaper: {
                        sx: {
                          backgroundColor: isDark ? "#171717" : "#E8E8E8",
                          border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #E3E3E3",
                          borderRadius: "16px",
                          color: isDark ? "#fff" : "#323232",
                          "& .MuiPickersDay-root": {
                            color: isDark ? "#fff" : "#323232",
                            "&.Mui-selected": {
                              backgroundColor: "#E8D1AB",
                              color: "#000",
                              "&:hover": { backgroundColor: "#D4C3A3" },
                            },
                          },
                          "& .MuiTypography-root": {
                            color: isDark ? "rgba(255,255,255,0.6)" : "#323232CC"
                          },
                          "& .MuiSvgIcon-root": {
                            color: isDark ? "#E8D1AB" : "#323232CC"
                          },
                        },
                      },
                    }}
                  />
                </div>
              </Box>
            </LocalizationProvider>

            <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
              <SelectTrigger
                className={`h-12 p-4 rounded-lg lg:rounded-xl text-sm medium focus:ring-[#E5D5B8]/40 ${isDark
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
                      <span>{salesperson.name}</span>
                      {salesperson.role ? (
                        <span className={`mt-1 text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>
                          {salesperson.role}
                        </span>
                      ) : null}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
              <SelectTrigger
                className={`h-12 p-4 rounded-lg lg:rounded-xl text-sm medium focus:ring-[#E5D5B8]/40 ${isDark
                  ? "border-white/20 bg-[#202020] text-white"
                  : "border-[#E3E3E3] bg-white text-black/70"
                  }`}
              >
                <SelectValue placeholder="Shoot Type" className="text-sm medium" />
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
                      <span>{salesperson.name}</span>
                      {salesperson.role ? (
                        <span className={`mt-1 text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>
                          {salesperson.role}
                        </span>
                      ) : null}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
              <SelectTrigger
                className={`h-12 p-4 rounded-lg lg:rounded-xl text-sm medium focus:ring-[#E5D5B8]/40 ${isDark
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
                <SelectItem value="all">All Salesperson</SelectItem>
                {salespersonOptions.map((salesperson) => (
                  <SelectItem key={salesperson.id} value={salesperson.id}>
                    <div className="flex flex-col leading-tight">
                      <span>{salesperson.name}</span>
                      {salesperson.role ? (
                        <span className={`mt-1 text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>
                          {salesperson.role}
                        </span>
                      ) : null}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
              <SelectTrigger
                className={`h-12 p-4 rounded-lg lg:rounded-xl text-sm medium focus:ring-[#E5D5B8]/40 ${isDark
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
                <SelectItem value="all">All Salesperson</SelectItem>
                {salespersonOptions.map((salesperson) => (
                  <SelectItem key={salesperson.id} value={salesperson.id}>
                    <div className="flex flex-col leading-tight">
                      <span>{salesperson.name}</span>
                      {salesperson.role ? (
                        <span className={`mt-1 text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>
                          {salesperson.role}
                        </span>
                      ) : null}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
              <SelectTrigger
                className={`h-12 p-4 rounded-lg lg:rounded-xl text-sm medium focus:ring-[#E5D5B8]/40 ${isDark
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
                <SelectItem value="all">All Salesperson</SelectItem>
                {salespersonOptions.map((salesperson) => (
                  <SelectItem key={salesperson.id} value={salesperson.id}>
                    <div className="flex flex-col leading-tight">
                      <span>{salesperson.name}</span>
                      {salesperson.role ? (
                        <span className={`mt-1 text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>
                          {salesperson.role}
                        </span>
                      ) : null}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
              <SelectTrigger
                className={`h-12 p-4 rounded-lg lg:rounded-xl text-sm medium focus:ring-[#E5D5B8]/40 ${isDark
                  ? "border-white/20 bg-[#202020] text-white"
                  : "border-[#E3E3E3] bg-white text-black/70"
                  }`}
              >
                <SelectValue placeholder="Customer Type" className="text-sm medium" />
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
                      <span>{salesperson.name}</span>
                      {salesperson.role ? (
                        <span className={`mt-1 text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>
                          {salesperson.role}
                        </span>
                      ) : null}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }

        <div className="space-y-3 lg:space-y-6">
          <div className="w-full flex flex-col lg:flex-row gap-5">
            <div className="w-full lg:w-3/5 h-full">
              <QuotePerformanceWidget />
            </div>
            <div className="w-full lg:w-2/5 h-full">
              <ConversionPerformanceWidget />
            </div>
          </div>
          <div>
            <OpenPipelineWidget />
          </div>
          <div>
            <QuotesOverdueWidget />
          </div>
          <div>
            <QuotesAnalyticsTable isDark={isDark} />
          </div>
        </div>

        {/* --- FLOATING MOBILE BUTTON PANEL --- */}
        {/* <div className={`lg:hidden w-full fixed flex items-center justify-center gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] transition-colors duration-100 ${isDark ? "bg-[#0f0f0f]" : "bg-white"}`}>

        </div> */}
      </div>
    </>
  );
}
