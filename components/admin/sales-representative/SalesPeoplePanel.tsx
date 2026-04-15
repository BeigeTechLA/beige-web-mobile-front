"use client";

import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Activity, CalendarDays, Clock3, Loader2, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { salesApi as salesService } from "@/lib/api";
import DatePicker from "@/components/ui/Datepicker";

type SalesPerson = {
  id: number | string;
  name: string;
  email: string;
  user_type?: number | string;
};

type StatusActivityByDate = Record<
  string,
  {
    available_count?: number;
    unavailable_count?: number;
    total_status_changes?: number;
  }
>;

type SalesRepStatusDetails = {
  sales_rep_id: number | string;
  sales_rep_name: string;
  sales_rep_email: string;
  current_status?: {
    is_available?: boolean;
    reason?: string | null;
    updated_at?: string | null;
  };
  activity?: {
    activity_by_date?: StatusActivityByDate;
    total_status_changes_in_range?: number;
  };
  unavailability?: Array<{
    date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    is_full_day?: boolean | null;
    notes?: string | null;
  }>;
};

type SalesRepStatusResponse = {
  error?: boolean;
  filters?: {
    start_date?: string | null;
    end_date?: string | null;
  };
  data?: SalesRepStatusDetails | null;
  message?: string;
  error_message?: string;
  success?: boolean;
};

interface SalesPeoplePanelProps {
  salesPeople: SalesPerson[];
  loading: boolean;
  searchQuery: string;
  isDark: boolean;
}

const formatDateLabel = (dateValue?: string | null) => {
  if (!dateValue) return "N/A";

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  return format(parsedDate, "MMM dd, yyyy");
};

const formatDateTimeLabel = (dateValue?: string | null) => {
  if (!dateValue) return "N/A";

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  return format(parsedDate, "MMM dd, yyyy hh:mm a");
};

const formatTimeLabel = (timeValue?: string | null) => {
  if (!timeValue) return null;

  const [hoursString = "0", minutesString = "0"] = String(timeValue).split(":");
  const hours = Number(hoursString);
  const minutes = Number(minutesString);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return timeValue;
  }

  const timeDate = new Date();
  timeDate.setHours(hours, minutes, 0, 0);

  return format(timeDate, "hh:mm a");
};

const normalizeSelectedDate = (dateValue: Date | null) => {
  if (!dateValue || Number.isNaN(dateValue.getTime())) {
    return null;
  }

  // Keep the picked calendar day stable when converted to query params.
  return new Date(
    dateValue.getFullYear(),
    dateValue.getMonth(),
    dateValue.getDate(),
    12,
    0,
    0,
    0
  );
};

export default function SalesPeoplePanel({
  salesPeople,
  loading,
  searchQuery,
  isDark,
}: SalesPeoplePanelProps) {
  const [selectedRep, setSelectedRep] = useState<SalesPerson | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [statusDetails, setStatusDetails] = useState<SalesRepStatusDetails | null>(null);
  const [statusFilters, setStatusFilters] = useState<{
    start_date?: string | null;
    end_date?: string | null;
  }>({});
  const [statusLoading, setStatusLoading] = useState(false);

  const filteredSalesPeople = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return salesPeople;

    return salesPeople.filter((rep) =>
      [rep.name, rep.email, String(rep.id)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery))
    );
  }, [salesPeople, searchQuery]);

  const activityEntries = useMemo(() => {
    const activityByDate = statusDetails?.activity?.activity_by_date || {};

    return Object.entries(activityByDate).sort(([dateA], [dateB]) =>
      new Date(dateB).getTime() - new Date(dateA).getTime()
    );
  }, [statusDetails]);

  const unavailabilityEntries = useMemo(() => {
    const entries = statusDetails?.unavailability || [];

    return [...entries].sort((entryA, entryB) =>
      new Date(entryA.date || 0).getTime() - new Date(entryB.date || 0).getTime()
    );
  }, [statusDetails]);

  useEffect(() => {
    if (!selectedRep) return;

    const fetchStatusDetails = async () => {
      setStatusLoading(true);
      try {
        const selectedDateValue = selectedDate
          ? format(selectedDate, "yyyy-MM-dd")
          : undefined;
        const response = (await salesService.getSalesRepStatusDetails({
          sales_rep_id: selectedRep.id,
          ...(selectedDateValue
            ? {
                start_date: selectedDateValue,
                end_date: selectedDateValue,
              }
            : {}),
        })) as SalesRepStatusResponse;

        if (response?.error) {
          throw new Error(response?.message || response?.error_message || "Failed to load sales person details");
        }

        setStatusDetails(response?.data || null);
        setStatusFilters(response?.filters || {});
      } catch (error) {
        console.error("Failed to fetch sales rep status details:", error);
        toast.error(error instanceof Error ? error.message : "Failed to load sales person details");
        setStatusDetails(null);
        setStatusFilters({});
      } finally {
        setStatusLoading(false);
      }
    };

    fetchStatusDetails();
  }, [selectedRep, selectedDate]);

  const handleOpenDetails = (rep: SalesPerson) => {
    setSelectedDate(null);
    setStatusDetails(null);
    setStatusFilters({});
    setSelectedRep(rep);
  };

  const handleCloseDetails = () => {
    setSelectedRep(null);
    setSelectedDate(null);
    setStatusDetails(null);
    setStatusFilters({});
  };

  const isCurrentlyAvailable = Boolean(statusDetails?.current_status?.is_available);
  const totalStatusChanges = statusDetails?.activity?.total_status_changes_in_range || 0;
  const appliedRangeLabel = statusFilters.start_date && statusFilters.end_date
    ? statusFilters.start_date === statusFilters.end_date
      ? formatDateLabel(statusFilters.start_date)
      : `${formatDateLabel(statusFilters.start_date)} - ${formatDateLabel(statusFilters.end_date)}`
    : "Last 7 days";

  return (
    <>
      <div className={`overflow-hidden rounded-2xl border transition-colors ${isDark ? "border-[#333] bg-[#171717]" : "border-[#E5E5E5] bg-white"}`}>
        <div className={`hidden lg:block overflow-x-auto ${isDark ? "bg-[#171717]" : "bg-white"}`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-sm ${isDark ? "bg-[#101010] text-[#E8D1AB]" : "bg-[#FFFCF6] text-black"}`}>
                <th className="py-5 px-6 font-medium">Rep ID</th>
                <th className="py-5 px-6 font-medium">Sales Person</th>
                <th className="py-5 px-6 font-medium">Email</th>
                <th className="py-5 px-6 font-medium">Role</th>
                <th className="py-5 px-6 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className={`inline animate-spin ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} />
                  </td>
                </tr>
              ) : filteredSalesPeople.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`py-20 text-center ${isDark ? "text-white/50" : "text-black/50"}`}>
                    No sales people found.
                  </td>
                </tr>
              ) : (
                filteredSalesPeople.map((rep) => (
                  <tr
                    key={rep.id}
                    className={`border-t cursor-pointer transition-colors ${isDark ? "border-[#222] hover:bg-white/[0.02]" : "border-[#EAEAEA] hover:bg-black/[0.015]"}`}
                    onClick={() => handleOpenDetails(rep)}
                  >
                    <td className={`py-5 px-6 text-sm ${isDark ? "text-white/55" : "text-[#666]"}`}>#{rep.id}</td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isDark ? "bg-[#E5D5B8] text-black" : "bg-[#F2E2C3] text-black"}`}>
                          <UserRound size={18} />
                        </div>
                        <div>
                          <p className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{rep.name || "Unnamed"}</p>
                          <p className={`text-xs ${isDark ? "text-white/45" : "text-[#888]"}`}>Active sales account</p>
                        </div>
                      </div>
                    </td>
                    <td className={`py-5 px-6 text-sm ${isDark ? "text-white/80" : "text-[#333]"}`}>{rep.email || "No email"}</td>
                    <td className={`py-5 px-6 text-sm ${isDark ? "text-white/70" : "text-[#555]"}`}>Sales Representative</td>
                    <td className="py-5 px-6 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenDetails(rep);
                        }}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isDark ? "bg-[#E5D5B8] text-black hover:bg-[#D9C7A6]" : "bg-[#E8D1AB] text-black hover:bg-[#DFC79F]"}`}
                      >
                        View Status
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 lg:hidden">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className={`animate-spin ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} />
            </div>
          ) : filteredSalesPeople.length === 0 ? (
            <div className={`rounded-xl border px-4 py-8 text-center text-sm ${isDark ? "border-[#2A2A2A] text-white/50" : "border-[#E5E5E5] text-black/50"}`}>
              No sales people found.
            </div>
          ) : (
            filteredSalesPeople.map((rep) => (
              <button
                key={rep.id}
                type="button"
                onClick={() => handleOpenDetails(rep)}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${isDark ? "border-[#2A2A2A] bg-[#111] hover:border-[#E5D5B8]/30" : "border-[#E8E8E8] bg-[#FCFCFC] hover:border-[#D7BC8A]"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>{rep.name || "Unnamed"}</p>
                    <p className={`mt-1 text-xs ${isDark ? "text-white/55" : "text-[#777]"}`}>#{rep.id}</p>
                    <p className={`mt-2 truncate text-sm ${isDark ? "text-white/75" : "text-[#444]"}`}>{rep.email || "No email"}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${isDark ? "bg-[#E5D5B8] text-black" : "bg-[#F1DEBB] text-black"}`}>
                    View
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <Dialog open={!!selectedRep} onOpenChange={(isOpen) => !isOpen && handleCloseDetails()}>
        <DialogContent className={`max-w-4xl border p-0 overflow-hidden ${isDark ? "border-[#2F2F2F] bg-[#121212] text-white" : "border-[#E5E5E5] bg-white text-black"}`}>
          <DialogHeader className={`border-b px-6 py-5 text-left ${isDark ? "border-white/10" : "border-[#ECECEC]"}`}>
            <DialogTitle className={`text-xl ${isDark ? "text-white" : "text-black"}`}>
              {selectedRep?.name || "Sales Person"} Status Details
            </DialogTitle>
            <DialogDescription className={isDark ? "text-white/60" : "text-[#6B6256]"}>
              Review current availability and status-change activity for the selected sales person.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[80vh] overflow-y-auto p-6 space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className={`flex items-center gap-2 text-sm ${isDark ? "text-white/70" : "text-[#555]"}`}>
                  <Mail size={16} />
                  <span>{selectedRep?.email || "No email"}</span>
                </div>
                <div className={`flex items-center gap-2 text-sm ${isDark ? "text-white/70" : "text-[#555]"}`}>
                  <UserRound size={16} />
                  <span>Rep ID #{selectedRep?.id}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:justify-end">
                <div className="w-full sm:min-w-[220px] sm:max-w-[240px]">
                  <DatePicker
                    label=""
                    value={selectedDate}
                    onChange={(date) => setSelectedDate(normalizeSelectedDate(date))}
                    maxDate={new Date()}
                    format="dd-MM-yyyy"
                    isDark={isDark}
                    sx={{
                      height: 44,
                      "& .MuiInputBase-input": {
                        fontSize: "15px",
                        fontWeight: 500,
                      },
                    }}
                    colors={isDark ? {
                      inputBackground: "#1A1A1A",
                      inputBorder: "rgba(255,255,255,0.08)",
                      paperBackground: "#3A3A3A",
                      accent: "#8FB7E8",
                      accentText: "#101010",
                      hoverAccent: "#A8C7EE",
                      navigationIconColor: "#FFFFFF",
                      calendarHeaderText: "#FFFFFF",
                      weekdayLabelText: "rgba(255,255,255,0.92)",
                      dayNumberText: "#FFFFFF",
                      mutedText: "rgba(255,255,255,0.55)",
                    } : {
                      inputBackground: "#FFFFFF",
                      inputBorder: "#D8D8D8",
                      paperBackground: "#FFFFFF",
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className={`h-11 rounded-lg border px-4 text-sm font-medium transition-colors ${isDark ? "border-white/10 bg-[#1A1A1A] text-white hover:bg-white/5" : "border-[#D8D8D8] bg-white text-black hover:bg-[#F7F7F7]"}`}
                >
                  Last 7 Days
                </button>
              </div>
            </div>

            {statusLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className={`animate-spin ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} size={28} />
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#181818]" : "border-[#E8E8E8] bg-[#FCFCFC]"}`}>
                    <p className={`text-xs uppercase tracking-[0.18em] ${isDark ? "text-white/45" : "text-[#8A8A8A]"}`}>Current Status</p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${isCurrentlyAvailable ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEE2E2] text-[#991B1B]"}`}>
                        {isCurrentlyAvailable ? "Available" : "Unavailable"}
                      </span>
                    </div>
                    <p className={`mt-3 text-sm ${isDark ? "text-white/70" : "text-[#555]"}`}>
                      Updated {formatDateTimeLabel(statusDetails?.current_status?.updated_at)}
                    </p>
                  </div>

                  <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#181818]" : "border-[#E8E8E8] bg-[#FCFCFC]"}`}>
                    <p className={`text-xs uppercase tracking-[0.18em] ${isDark ? "text-white/45" : "text-[#8A8A8A]"}`}>Applied Range</p>
                    <div className="mt-3 flex items-center gap-2">
                      <CalendarDays size={18} className={isDark ? "text-[#E8D1AB]" : "text-[#B38B4D]"} />
                      <p className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>{appliedRangeLabel}</p>
                    </div>
                  </div>

                  <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#181818]" : "border-[#E8E8E8] bg-[#FCFCFC]"}`}>
                    <p className={`text-xs uppercase tracking-[0.18em] ${isDark ? "text-white/45" : "text-[#8A8A8A]"}`}>Status Changes</p>
                    <div className="mt-3 flex items-center gap-2">
                      <Activity size={18} className={isDark ? "text-[#E8D1AB]" : "text-[#B38B4D]"} />
                      <p className={`text-2xl font-semibold ${isDark ? "text-white" : "text-black"}`}>{totalStatusChanges}</p>
                    </div>
                  </div>
                </div>

                {!isCurrentlyAvailable && statusDetails?.current_status?.reason ? (
                  <div className={`rounded-2xl border p-4 ${isDark ? "border-[#3A2E1C] bg-[#1B1610]" : "border-[#E6D3AF] bg-[#FFF8EB]"}`}>
                    <p className={`text-xs uppercase tracking-[0.18em] ${isDark ? "text-[#E8D1AB]" : "text-[#8C6B2F]"}`}>Inactive Reason</p>
                    <p className={`mt-2 text-sm ${isDark ? "text-white/80" : "text-[#4A4032]"}`}>
                      {statusDetails.current_status.reason}
                    </p>
                  </div>
                ) : null}

                <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#181818]" : "border-[#E8E8E8] bg-[#FCFCFC]"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`text-xs uppercase tracking-[0.18em] ${isDark ? "text-white/45" : "text-[#8A8A8A]"}`}>
                        Unavailability
                      </p>
                      <p className={`mt-2 text-sm ${isDark ? "text-white/70" : "text-[#555]"}`}>
                        Dynamic unavailable dates from `sales/status-details`.
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${isDark ? "bg-white/5 text-white/70" : "bg-[#F2F2F2] text-[#444]"}`}>
                      {unavailabilityEntries.length}
                    </span>
                  </div>

                  {unavailabilityEntries.length === 0 ? (
                    <div className={`mt-4 rounded-xl border px-4 py-6 text-sm text-center ${isDark ? "border-white/5 text-white/50" : "border-[#EFEFEF] text-[#666]"}`}>
                      No unavailable dates found for the current response.
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {unavailabilityEntries.map((item, index) => {
                        const startTimeLabel = formatTimeLabel(item.start_time);
                        const endTimeLabel = formatTimeLabel(item.end_time);
                        const timeRangeLabel = item.is_full_day
                          ? "Full day"
                          : startTimeLabel && endTimeLabel
                            ? `${startTimeLabel} - ${endTimeLabel}`
                            : "Unavailable";

                        return (
                          <div
                            key={`${item.date || "unknown"}-${index}`}
                            className={`rounded-xl border p-4 ${isDark ? "border-white/5 bg-[#141414]" : "border-[#EFEFEF] bg-white"}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                                  {formatDateLabel(item.date)}
                                </p>
                                <div className={`mt-2 flex items-center gap-2 text-xs ${isDark ? "text-white/55" : "text-[#666]"}`}>
                                  <Clock3 size={14} />
                                  <span>{timeRangeLabel}</span>
                                </div>
                              </div>
                            </div>

                            {item.notes ? (
                              <p className={`mt-3 text-xs leading-relaxed ${isDark ? "text-white/65" : "text-[#555]"}`}>
                                {item.notes}
                              </p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className={`overflow-hidden rounded-2xl border ${isDark ? "border-white/10" : "border-[#EAEAEA]"}`}>
                  <div className={`grid grid-cols-[1.2fr_1fr_1fr_1fr] gap-3 px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] ${isDark ? "bg-[#161616] text-white/45" : "bg-[#FAF7F1] text-[#8A8A8A]"}`}>
                    <span>Date</span>
                    <span>Available</span>
                    <span>Unavailable</span>
                    <span>Total</span>
                  </div>

                  {activityEntries.length === 0 ? (
                    <div className={`px-4 py-10 text-center text-sm ${isDark ? "text-white/50" : "text-[#666]"}`}>
                      No status changes found for this range.
                    </div>
                  ) : (
                    <div>
                      {activityEntries.map(([dateKey, counts]) => (
                        <div
                          key={dateKey}
                          className={`grid grid-cols-[1.2fr_1fr_1fr_1fr] gap-3 px-4 py-4 text-sm border-t ${isDark ? "border-white/5 text-white/85" : "border-[#EFEFEF] text-[#333]"}`}
                        >
                          <span>{formatDateLabel(dateKey)}</span>
                          <span>{counts.available_count || 0}</span>
                          <span>{counts.unavailable_count || 0}</span>
                          <span>{counts.total_status_changes || 0}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
