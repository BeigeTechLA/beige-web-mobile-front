"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */


import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Search, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { BasicDropdown, type DropdownOption } from "@/components/admin/BasicDropdown";
import { LeadsStatusBadge } from "@/components/sales/LeadsStatusBadge";
import DatePicker from "@/components/ui/Datepicker";
import { useDebounce } from "@/hooks/use-debounce";
import { shiftManagementApi } from "@/lib/api";

type HistoryItem = {
  id: string;
  company: string;
  person: string;
  shift: string;
  source: string;
  status: string;
  date: string;
  time: string;
  initials: string;
};

function asText(value: any, fallback: string) {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" && ["n/a", "null", "undefined"].includes(value.trim().toLowerCase())) return fallback;
  if (typeof value === "string" || typeof value === "number") return String(value);
  return String(value.name || value.shift_name || value.sales_rep_name || value.client_name || fallback);
}

function normalizeBookingStatusLabel(value: any) {
  const text = asText(value, "");
  const normalized = text.replace(/[–—]/g, "-").trim().toLowerCase();
  const labels: Record<string, string> = {
    "book a shoot - lead created": "Book a shoot - Lead Created",
    "manual - lead created": "Manual - Lead Created",
    "signed up - lead created": "Signed Up - Lead Created",
    "booking in progress": "Booking In Progress",
    "ready for payment": "Ready for Payment",
    "proposal sent": "Proposal Sent",
    "payment sent": "Payment Sent",
    "payment link sent": "Payment Link Sent",
    booked: "Booked",
    paid: "Paid",
    "partially paid": "Partially Paid",
    "closed - lost": "Closed - Lost",
  };
  return labels[normalized] || text || "Unknown";
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "NA";
}

function ordinalDay(day: number) {
  if (day > 3 && day < 21) return `${day}th`;
  switch (day % 10) {
    case 1: return `${day}st`;
    case 2: return `${day}nd`;
    case 3: return `${day}rd`;
    default: return `${day}th`;
  }
}

function parseAssignmentDate(item: any) {
  const localValue = item.assigned_time_local || item.assigned_at_local;
  if (localValue) {
    const parsedLocal = new Date(String(localValue));
    if (!Number.isNaN(parsedLocal.getTime())) return parsedLocal;
  }

  if (!item.assigned_at) return null;
  const parsed = new Date(item.assigned_at);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatLongDate(value: Date | null) {
  if (!value) return "N/A";
  return `${ordinalDay(value.getDate())} ${value.toLocaleString("en-US", { month: "long" })} ${value.getFullYear()}`;
}

function formatAssignmentTime(item: any) {
  const parsed = parseAssignmentDate(item);
  return parsed
    ? parsed.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    : asText(item.time, "N/A");
}

function convertDateForApi(date: string) {
  if (!date || date === "Select Date") return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const [dd, mm, yyyy] = date.split("-");
  if (!dd || !mm || !yyyy) return undefined;
  return `${yyyy}-${mm}-${dd}`;
}

export default function AssignmentHistoryView({ onBack }: { onBack: () => void }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState({
    shift: "Select Shift",
    person: "Sales Person",
    date: "Select Date",
    status: "Status",
  });
 const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [shiftOptions, setShiftOptions] = useState<DropdownOption[]>([
    { label: "Select Shift", value: "Select Shift" },
  ]);
const [personOptions, setPersonOptions] = useState<DropdownOption[]>([{ label: "Sales Person", value: "Sales Person" }]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const normalizedSearch = debouncedSearch.trim();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const selectedDateLabel = selectedDate ? formatLongDate(selectedDate) : "Select Date";

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || theme === "dark";

  useEffect(() => {
    let ignore = false;

    const loadOptions = async () => {
      const [shiftsResult, peopleResult] = await Promise.allSettled([
        shiftManagementApi.getShifts({ page: 1, limit: 100 }),
        shiftManagementApi.getAllSalespeople({ limit: 100 }),
      ]);

      if (ignore) return;

      if (shiftsResult.status === "fulfilled" && shiftsResult.value?.success !== false) {
        const shiftsRes = shiftsResult.value;
        const shiftsData = shiftsRes?.data?.data || shiftsRes?.data;
        const shiftsList = Array.isArray(shiftsData?.rows) ? shiftsData.rows : [];
        const nextShiftOptions = shiftsList
          .map((shift: any) => {
            const label = shift.name || shift.shift_name;
            const id = String(shift.id || shift.shift_id || "");
            return label && id ? { label, value: id } : null;
          })
          .filter(Boolean) as DropdownOption[];

        setShiftOptions([{ label: "Select Shift", value: "Select Shift" }, ...nextShiftOptions]);
      } else {
        console.error("Failed to load shift options:", shiftsResult.reason);
        setShiftOptions([{ label: "Select Shift", value: "Select Shift" }]);
      }

      if (peopleResult.status === "fulfilled" && peopleResult.value?.success !== false) {
        const peopleRes = peopleResult.value;
        const peopleData = peopleRes?.data?.data || peopleRes?.data;
        const peopleList = Array.isArray(peopleData?.rows) ? peopleData.rows : [];
        const uniquePeople = new Map<string, DropdownOption>();
        peopleList.filter((person: any) => person?.shift_id !== null).forEach((person: any) => {
            const label = person.name || person.salesperson_name || person.email;
            const id = String(person.sales_rep_id || person.id || person.user_id || "");
            if (!label || !id || uniquePeople.has(id)) return;
            uniquePeople.set(id, { label, value: id });
          });

        setPersonOptions([
          { label: "Sales Person", value: "Sales Person" },
          ...Array.from(uniquePeople.values()),
        ]);
      } else {
        console.error("Failed to load salesperson options:", peopleResult.reason);
        setPersonOptions([{ label: "Sales Person", value: "Sales Person" }]);
      }
    };
    void loadOptions();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
      let ignore = false;
      const loadHistory = async () => {
        setLoading(true);

        try {
      const dateParam = convertDateForApi(filters.date);
      const response = await shiftManagementApi.getAssignmentHistory({
        search: normalizedSearch || undefined,
        shift_id: filters.shift === "Select Shift" ? undefined : filters.shift,
        sales_rep_id: filters.person === "Sales Person" ? undefined : filters.person,
        date: dateParam,
        status: filters.status === "Status" ? undefined : filters.status,
        page: 1,
        limit: 20,
      });

      if (response?.success === false) {
        throw new Error(response?.error || "Failed to load assignment history");
      }

      if (ignore) return;
      const data = response?.data?.data || response?.data;
      const list = Array.isArray(data?.rows) ? data.rows : [];
      setItems(list.map((item: any, index: number) => {
        const person = asText(item.sales_rep_name || item.sales_rep || item.person || item.salesperson_name, "Unassigned");
        const assignedDate = parseAssignmentDate(item);
        return {
          id: String(item.id || item.assignment_id || `${item.lead_id || "lead"}-${item.sales_rep_id || "rep"}-${item.assigned_at || index}`),
          company: asText(item.client_name || item.company || item.lead_name || item.client_email || item.guest_email || item.lead, "Unknown Client"),
          person,
          shift: asText(item.shift_name || item.shift, "N/A"),
          source: asText(item.source || item.lead_source, "N/A"),
          status: normalizeBookingStatusLabel(item.status || item.assignment_status),
          date: formatLongDate(assignedDate),
          time: formatAssignmentTime(item),
          initials: getInitials(person),
        };
      }));
          } catch (error) {
      if (!ignore) {
        setItems([]);
        console.error("Failed to load assignment history:", error);
      }
    } finally {
      if (!ignore) {
        setLoading(false);
      }
    }
    };

    void loadHistory();

    return () => {
      ignore = true;
    };
  }, [filters.shift, filters.person, filters.date, filters.status, normalizedSearch]);

  return (
    <div
      className={`min-h-full px-4 py-6 font-[var(--font-geist-sans)] transition-colors duration-300 lg:px-9 lg:py-8 ${
        isDark
          ? "bg-[#101010] text-white"
          : "bg-[#F4F5F7] text-[#323232]"
      }`}
    >
      <button
        type="button"
        onClick={onBack}
        className={`mb-7 flex items-center gap-2 text-sm transition ${
          isDark
            ? "text-white/85 hover:text-[#E5D5B8]"
            : "text-[#323232CC] hover:text-[#BFA780]"
        }`}
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="mb-5">
        <h1
          className={`text-2xl font-semibold ${
            isDark ? "text-white" : "text-[#323232]"
          }`}
        >
          Assignment History
        </h1>
        <p
          className={`mt-1 text-sm ${
            isDark ? "text-white/45" : "text-[#32323299]"
          }`}
        >
          Immutable record of all lead assignments
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <label className="relative flex-1">
          <Search
            className={`absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${
              isDark ? "text-white/28" : "text-[#999999]"
            }`}
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={`h-12 w-full rounded-lg border pl-11 pr-4 text-sm outline-none transition-colors ${
              isDark
                ? "border-[#2D2D2D] bg-[#242424] text-white placeholder:text-white/35 focus:border-[#E5D5B8]/60"
                : "border-[#E5E5E5] bg-white text-[#323232] placeholder:text-[#999999] focus:border-[#E8D1AB]"
            }`}
            placeholder="Search"
          />
        </label>

        <button
          type="button"
          onClick={() => setShowFilters((current) => !current)}
          className={`flex h-12 items-center justify-center gap-2 rounded-lg border px-5 text-sm font-semibold transition ${
            showFilters
              ? "border-[#E5D5B8] bg-[#E5D5B8] text-black"
              : isDark
                ? "border-[#2D2D2D] bg-[#242424] text-white hover:border-[#E5D5B8]/40"
                : "border-[#E3E3E3] bg-white text-[#323232] hover:border-[#E8D1AB]"
          }`}
        >
          <SlidersHorizontal size={16} />
          Filters
        </button>
      </div>

      {showFilters && (
        <section
          className={`mt-5 rounded-xl border p-4 transition-colors duration-300 ${
            isDark
              ? "border-[#2D2D2D] bg-[#171717]"
              : "border-[#E3E3E3] bg-white"
          }`}
        >
          <div className="flex flex-wrap gap-3">
            <BasicDropdown
              label="Select Shift"
              value={filters.shift}
              options={shiftOptions}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  shift: value,
                }))
              }
              styles={
                isDark
                  ? "text-white/70 text-xs"
                  : "text-[#323232] text-xs"
              }
            />

            <BasicDropdown
              label="Sales Person"
              value={filters.person}
              options={personOptions}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  person: value,
                }))
              }
              styles={
                isDark
                  ? "text-white/70 text-xs"
                  : "text-[#323232] text-xs"
              }
            />

            <div className="relative h-8 w-[182px] lg:h-10">
              <div
                className={`pointer-events-none absolute inset-0 z-30 flex items-center justify-between rounded-lg border px-3 text-xs font-medium transition-all lg:px-6 ${
                  isDark
                    ? "border-white/10 bg-[#18181b] text-white/70"
                    : "border-[#E3E3E3] bg-white text-[#323232]"
                }`}
              >
                <span
                  className={
                    selectedDate
                      ? isDark
                        ? "text-white/70"
                        : "text-[#323232]"
                      : isDark
                        ? "text-white/45"
                        : "text-[#999999]"
                  }
                >
                  {selectedDateLabel}
                </span>

                {selectedDate ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedDate(null);
                      setFilters((current) => ({
                        ...current,
                        date: "Select Date",
                      }));
                    }}
                    className={`pointer-events-auto z-40 rounded-full p-1 transition-all duration-150 hover:scale-110 active:scale-95 ${
                      isDark
                        ? "text-white/50 hover:bg-white/10 hover:text-white"
                        : "text-[#666666] hover:bg-black/5 hover:text-black"
                    }`}
                    aria-label="Clear selected date"
                  >
                    <X size={14} />
                  </button>
                ) : (
                  <Calendar
                    size={18}
                    className={isDark ? "text-white/60" : "text-[#666666]"}
                  />
                )}
              </div>

              <div className="absolute inset-0 z-20 [&_.MuiInputBase-input]:!text-transparent [&_.MuiOutlinedInput-notchedOutline]:!border-transparent [&_.MuiSvgIcon-root]:!opacity-0">
                <DatePicker
                  label=""
                  value={selectedDate}
                  onChange={(date) => {
                    const nextDateLabel = date
                      ? format(date, "yyyy-MM-dd")
                      : "Select Date";
                    setSelectedDate(date);
                    setFilters((current) => ({
                      ...current,
                      date: nextDateLabel,
                    }));
                  }}
                  format="do MMMM yyyy"
                  placeholder="Select Date"
                  isDark={isDark}
                  disablePortal
                  colors={{
                    inputBackground: isDark ? "#18181b" : "#FFFFFF",
                    inputText: isDark
                      ? "rgba(255, 255, 255, 0.7)"
                      : "#323232",
                    inputBorder: isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "#E3E3E3",
                    inputBorderHover: isDark
                      ? "rgba(255, 255, 255, 0.2)"
                      : "#D7D7D7",
                    inputBorderFocus: "#E8D1AB",
                    iconColor: isDark
                      ? "rgba(255, 255, 255, 0.8)"
                      : "#666666",
                  }}
                  sx={{
                    height: "40px",
                    borderRadius: "8px",
                    backgroundColor: isDark ? "#18181b" : "#FFFFFF",
                  }}
                />
              </div>
            </div>

            <BasicDropdown
              label="Status"
              value={filters.status}
              options={[
                "Status",
                "Signed Up - Lead Created",
                "Book a shoot - Lead Created",
                "Manual - Lead Created",
                "Booking In Progress",
                "Proposal Sent",
                "Ready for Payment",
                "Payment Sent",
                "Booked",
                "Closed - Lost",
              ]}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  status: value,
                }))
              }
              styles={
                isDark
                  ? "text-white/70 text-xs"
                  : "text-[#323232] text-xs"
              }
            />
          </div>
        </section>
      )}

      <section className="mt-5">
        <div className="relative">
          <div
            className={`absolute left-[7px] top-4 h-[calc(100%-32px)] w-px ${
              isDark ? "bg-[#2D2D2D]" : "bg-[#E3E3E3]"
            }`}
          />

          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Loader2
                className={`animate-spin ${
                  isDark ? "text-[#E5D5B8]" : "text-[#BFA780]"
                }`}
                size={40}
              />
            </div>
          ) : items.length ? (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="relative pl-7">
                  <span className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#E5D5B8]" />

                  <div
                    className={`flex min-h-[58px] items-center justify-between gap-4 rounded-xl border px-5 py-3 transition-colors duration-200 ${
                      isDark
                        ? "border-[#2D2D2D] bg-[#111111] hover:bg-white/[0.02]"
                        : "border-[#E3E3E3] bg-white hover:bg-black/[0.02]"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                          isDark
                            ? "bg-[#2A2A2A] text-white/65"
                            : "bg-[#F4F5F7] text-[#323232]"
                        }`}
                      >
                        {item.initials}
                      </span>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={`text-sm font-medium ${
                              isDark ? "text-white" : "text-[#323232]"
                            }`}
                          >
                            {item.company}
                          </p>
                          <LeadsStatusBadge status={item.status} />
                        </div>

                        <div
                          className={`mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs ${
                            isDark ? "text-white/45" : "text-[#32323299]"
                          }`}
                        >
                          <span>{item.person}</span>
                          <span>{item.shift}</span>
                          <span>{item.source}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 text-right text-xs ${
                        isDark ? "text-white/45" : "text-[#32323299]"
                      }`}
                    >
                      <span className="block">{item.date}</span>
                      <span className="mt-1 block">{item.time}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className={`rounded-xl border px-5 py-8 text-center text-sm ${
                isDark
                  ? "border-[#2D2D2D] bg-[#111111] text-white/45"
                  : "border-[#E3E3E3] bg-white text-[#32323299]"
              }`}
            >
              No assignment history found
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
