"use client";


import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Search, SlidersHorizontal } from "lucide-react";
import { BasicDropdown, type DropdownOption } from "@/components/admin/BasicDropdown";
import DatePicker from "@/components/ui/Datepicker";
import { shiftManagementApi } from "@/lib/api";

type HistoryItem = {
  company: string;
  person: string;
  shift: string;
  source: string;
  status: string;
  time: string;
  initials: string;
};

function asText(value: any, fallback: string) {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number") return String(value);
  return String(value.name || value.shift_name || value.sales_rep_name || value.client_name || fallback);
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

function convertDateForApi(date: string) {
  if (!date || date === "DD-MM-YYYY") return undefined;
  const [dd, mm, yyyy] = date.split("-");
  if (!dd || !mm || !yyyy) return undefined;
  return `${yyyy}-${mm}-${dd}`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "Signed Up - Lead Created": "bg-[#D7C4FF] text-[#6E4BD9]",
    "Book a Shoot - Lead Created": "bg-[#BFE0FF] text-[#1E65C8]",
    "Manual - Lead Created": "bg-[#9DEBFA] text-[#12788B]",
    "Booking In Progress": "bg-[#FFF2C5] text-[#B97300]",
    "Closed - Lost": "bg-[#FFC6C6] text-[#D13B3B]",
    "Ready for Payment": "bg-[#FFE0B8] text-[#B56A17]",
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles[status] || "bg-[#2B2B2B] text-white/60"}`}>
      {status}
    </span>
  );
}

export default function AssignmentHistoryView({ onBack }: { onBack: () => void }) {
  const [filters, setFilters] = useState({
    shift: "Select Shift",
    person: "Sales Person",
    date: "DD-MM-YYYY",
    status: "Status",
  });
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [shiftOptions, setShiftOptions] = useState<DropdownOption[]>([{ label: "Select Shift", value: "Select Shift" }]);
  const [personOptions, setPersonOptions] = useState<DropdownOption[]>([{ label: "Sales Person", value: "Sales Person" }]);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const selectedDateLabel = selectedDate ? format(selectedDate, "dd-MM-yyyy") : "DD-MM-YYYY";

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
    const loadHistory = async () => {
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
      const data = response?.data?.data || response?.data;
      const list = Array.isArray(data?.rows) ? data.rows : [];
      setItems(list.map((item: any) => {
        const person = asText(item.sales_rep_name || item.sales_rep || item.person || item.salesperson_name, "Unassigned");
        return {
          company: asText(item.client_name || item.company || item.lead_name || item.lead, "Unknown Company"),
          person,
          shift: asText(item.shift_name || item.shift, "N/A"),
          source: asText(item.source || item.lead_source, "N/A"),
          status: asText(item.status || item.assignment_status, "Booking In Progress"),
          time: item.time || (item.assigned_at ? new Date(item.assigned_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A"),
          initials: getInitials(person),
        };
      }));
    };
    void loadHistory();
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
        <button className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[#242424] px-5 text-sm font-semibold text-white">
          <SlidersHorizontal size={16} />
          Filters
        </button>
      </div>

      <section className="mt-5 rounded-xl bg-[#171717] p-4">
        <div className="flex flex-wrap gap-3">
          <BasicDropdown label="Select Shift" value={filters.shift} options={shiftOptions} onChange={(value) => setFilters((current) => ({ ...current, shift: value }))} styles="text-white/70 text-xs" />
          <BasicDropdown label="Sales Person" value={filters.person} options={personOptions} onChange={(value) => setFilters((current) => ({ ...current, person: value }))} styles="text-white/70 text-xs" />
          <div className="relative h-8 w-[182px] lg:h-10">
            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-between rounded-lg border border-white/10 bg-[#18181b] px-3 text-xs font-medium text-white/70 transition-all lg:px-6">
              <span className={selectedDate ? "text-white/70" : "text-white/45"}>
                {selectedDateLabel}
              </span>
              <Calendar size={18} className="text-white/60" />
            </div>
            <div className="absolute inset-0 z-20 [&_.MuiInputBase-input]:!text-transparent [&_.MuiOutlinedInput-notchedOutline]:!border-transparent [&_.MuiSvgIcon-root]:!opacity-0">
              <DatePicker
                label=""
                value={selectedDate}
                onChange={(date) => {
                  const nextDateLabel = date ? format(date, "dd-MM-yyyy") : "DD-MM-YYYY";
                  setSelectedDate(date);
                  setFilters((current) => ({
                    ...current,
                    date: nextDateLabel,
                  }));
                }}
                format="dd-MM-yyyy"
                placeholder="DD-MM-YYYY"
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
          <BasicDropdown label="Status" value={filters.status} options={["Status", "Signed Up - Lead Created", "Book a Shoot - Lead Created", "Manual - Lead Created", "Booking In Progress", "Closed - Lost", "Ready for Payment"]} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} styles="text-white/70 text-xs" />
        </div>
      </section>

      <section className="mt-5">
        <div className="relative">
          <div className="absolute left-[7px] top-4 h-[calc(100%-32px)] w-px bg-[#2D2D2D]" />
          <div className="space-y-3">
            {items.map((item) => (
              <div key={`${item.company}-${item.time}`} className="relative pl-7">
                <span className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#E5D5B8]" />
                <div className="flex min-h-[58px] items-center justify-between gap-4 rounded-xl border border-[#2D2D2D] bg-[#111] px-5 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2A2A2A] text-[10px] font-semibold text-white/65">{item.initials}</span>
                    <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-white">{item.company}</p>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/45">
                      <span>{item.person}</span>
                      <span>{item.shift}</span>
                      <span>{item.source}</span>
                    </div>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-white/45">{item.time}</span>
                </div>
              </div>
            ))}
            {!items.length ? (
              <div className="rounded-xl border border-[#2D2D2D] bg-[#111] px-5 py-8 text-center text-sm text-white/45">No assignment history found</div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
