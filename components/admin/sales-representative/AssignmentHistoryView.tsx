"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */


import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Search, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { BasicDropdown, type DropdownOption } from "@/components/admin/BasicDropdown";
import { LeadsStatusBadge } from "@/components/sales/LeadsStatusBadge";
import DatePicker from "@/components/ui/Datepicker";
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const selectedDateLabel = selectedDate ? formatLongDate(selectedDate) : "Select Date";

  useEffect(() => {
    const loadOptions = async () => {
      const [shiftsRes, peopleRes] = await Promise.all([
        shiftManagementApi.getShifts({ page: 1, limit: 100 }),
        shiftManagementApi.getAllSalespeople({ limit: 100 }),
      ]);
      const shiftsData = shiftsRes?.data?.data || shiftsRes?.data;
      const shiftsList = Array.isArray(shiftsData?.rows) ? shiftsData.rows : [];
      const nextShiftOptions = shiftsList
        .map((shift: any) => {
          const label = shift.name || shift.shift_name;
          const id = String(shift.id || shift.shift_id || "");
          return label && id ? { label, value: id } : null;
        })
        .filter(Boolean);
      setShiftOptions([{ label: "Select Shift", value: "Select Shift" }, ...nextShiftOptions]);

      const peopleData = peopleRes?.data?.data || peopleRes?.data;
      const peopleList = Array.isArray(peopleData?.rows) ? peopleData.rows : [];
      const uniquePeople = new Map<string, DropdownOption>();
      peopleList.filter((person: any) => person?.shift_id !== null).forEach((person: any) => {
        const label = person.name || person.salesperson_name || person.email;
        const id = String(person.sales_rep_id || person.id || person.user_id || "");
        if (!label || !id || uniquePeople.has(id)) return;
        uniquePeople.set(id, { label, value: id });
      });
      setPersonOptions([{ label: "Sales Person", value: "Sales Person" }, ...Array.from(uniquePeople.values())]);
    };
    void loadOptions();
  }, []);

  useEffect(() => {
      let ignore = false;
      const loadHistory = async () => {
        setLoading(true);

        try {
      const dateParam = convertDateForApi(filters.date);
      const response = await shiftManagementApi.getAssignmentHistory({
        search: search || undefined,
        shift_id: filters.shift === "Select Shift" ? undefined : filters.shift,
        sales_rep_id: filters.person === "Sales Person" ? undefined : filters.person,
        date: dateParam,
        status: filters.status === "Status" ? undefined : filters.status,
        page: 1,
        limit: 20,
      });
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

    const timeoutId = setTimeout(() => {
      void loadHistory();
    }, search ? 400 : 0);

    return () => {
      ignore = true;
      clearTimeout(timeoutId);
    };
  }, [filters.shift, filters.person, filters.date, filters.status, search]);

  return (
    <div className="min-h-full bg-[#101010] px-4 py-6 font-[var(--font-geist-sans)] text-white lg:px-9 lg:py-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-7 flex items-center gap-2 text-sm text-white/85 transition hover:text-[#E5D5B8]"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="mb-5">
        <h1 className="text-2xl font-semibold">Assignment History</h1>
        <p className="mt-1 text-sm text-white/45">Immutable record of all lead assignments</p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <label className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/28" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="h-12 w-full rounded-lg border border-[#2D2D2D] bg-[#242424] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35" placeholder="Search" />
        </label>
        <button
          type="button"
          onClick={() => setShowFilters((current) => !current)}
          className={`flex h-12 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition ${
            showFilters
              ? "bg-[#E5D5B8] text-black"
              : "bg-[#242424] text-white"
          }`}
        >
          <SlidersHorizontal size={16} />
          Filters
        </button>
      </div>

{showFilters && (
  <section className="mt-5 rounded-xl bg-[#171717] p-4">
    <div className="flex flex-wrap gap-3">
          <BasicDropdown label="Select Shift" value={filters.shift} options={shiftOptions} onChange={(value) => setFilters((current) => ({ ...current, shift: value }))} styles="text-white/70 text-xs" />
          <BasicDropdown label="Sales Person" value={filters.person} options={personOptions} onChange={(value) => setFilters((current) => ({ ...current, person: value }))} styles="text-white/70 text-xs" />
          <div className="relative h-8 w-[182px] lg:h-10">
            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-between rounded-lg border border-white/10 bg-[#18181b] px-3 text-xs font-medium text-white/70 transition-all lg:px-6">
              <span className={selectedDate ? "text-white/70" : "text-white/45"}>
                {selectedDateLabel}
              </span>
              {selectedDate ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedDate(null);
                    setFilters((current) => ({ ...current, date: "Select Date" }));
                  }}
                  className="pointer-events-auto z-40 rounded-full p-1 text-white/50 transition-all duration-150 hover:scale-110 hover:bg-white/10 hover:text-white active:scale-95"
                >
                  <X size={14} />
                </button>
              ) : (
                <Calendar size={18} className="text-white/60" />
              )}
            </div>
            <div className="absolute inset-0 z-20 [&_.MuiInputBase-input]:!text-transparent [&_.MuiOutlinedInput-notchedOutline]:!border-transparent [&_.MuiSvgIcon-root]:!opacity-0">
              <DatePicker
                label=""
                value={selectedDate}
                onChange={(date) => {
                  const nextDateLabel = date ? format(date, "yyyy-MM-dd") : "Select Date";
                  setSelectedDate(date);
                  setFilters((current) => ({
                    ...current,
                    date: nextDateLabel,
                  }));
                }}
                format="do MMMM yyyy"
                placeholder="Select Date"
                isDark
                disablePortal
                colors={{
                  inputBackground: "#18181b",
                  inputText: "rgba(255, 255, 255, 0.7)",
                  inputBorder: "rgba(255, 255, 255, 0.1)",
                  inputBorderHover: "rgba(255, 255, 255, 0.2)",
                  inputBorderFocus: "#E8D1AB",
                  iconColor: "rgba(255, 255, 255, 0.8)",
                }}
                sx={{
                  height: "40px",
                  borderRadius: "8px",
                  backgroundColor: "#18181b",
                }}
              />
            </div>
          </div>
          <BasicDropdown label="Status" value={filters.status} options={["Status", "Signed Up - Lead Created", "Book a shoot - Lead Created", "Manual - Lead Created", "Booking In Progress", "Proposal Sent", "Ready for Payment", "Payment Sent", "Booked", "Closed - Lost"]} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} styles="text-white/70 text-xs" />
           </div>
  </section>
      )}

      <section className="mt-5">
              <div className="relative">
                <div className="absolute left-[7px] top-4 h-[calc(100%-32px)] w-px bg-[#2D2D2D]" />
                {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Loader2 className={`animate-spin text-[#BFA780]`} size={40} />
        </div>
      ) : items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="relative pl-7">
              <span className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#E5D5B8]" />
              <div className="flex min-h-[58px] items-center justify-between gap-4 rounded-xl border border-[#2D2D2D] bg-[#111] px-5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2A2A2A] text-[10px] font-semibold text-white/65">
                    {item.initials}</span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-white">
                        {item.company}
                      </p>
                      <LeadsStatusBadge status={item.status} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/45">
                      <span>{item.person}</span>
                      <span>{item.shift}</span>
                      <span>{item.source}</span>
                    </div>
                  </div>
                </div>
                <span className="shrink-0 text-right text-xs text-white/45">
                  <span className="block">{item.date}</span>
                  <span className="mt-1 block">{item.time}</span>
                </span>
              </div>
            </div>
          ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[#2D2D2D] bg-[#111] px-5 py-8 text-center text-sm text-white/45">
            No assignment history found
          </div>
        )}
        </div>
      </section>
    </div>
  );
}
