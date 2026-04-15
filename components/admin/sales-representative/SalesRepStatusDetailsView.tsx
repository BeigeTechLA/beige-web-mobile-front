"use client";

import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FolderKanban,
  Loader2,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import DatePicker from "@/components/ui/Datepicker";
import { salesApi as salesService } from "@/lib/api";

type StatusActivityByDate = Record<string, { available_count?: number; unavailable_count?: number; total_status_changes?: number }>;
type AssignedLeadItem = {
  lead_id: number | string;
  booking_id?: number | string | null;
  client_name?: string | null;
  guest_email?: string | null;
  phone?: string | null;
  lead_status?: string | null;
  intent?: string | null;
  lead_source?: string | null;
  last_activity_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};
type SalesRepStatusDetails = {
  sales_rep_id: number | string;
  sales_rep_name: string;
  sales_rep_email: string;
  current_status?: { is_available?: boolean; reason?: string | null; updated_at?: string | null };
  activity?: { activity_by_date?: StatusActivityByDate; total_status_changes_in_range?: number };
  unavailability?: Array<{ date?: string | null; start_time?: string | null; end_time?: string | null; is_full_day?: boolean | null; notes?: string | null }>;
  assigned_leads?: { total_count?: number; sales_leads_count?: number; client_leads_count?: number; sales_leads?: AssignedLeadItem[]; client_leads?: AssignedLeadItem[] };
};
type SalesRepStatusResponse = {
  error?: boolean;
  filters?: { start_date?: string | null; end_date?: string | null };
  data?: SalesRepStatusDetails | null;
  message?: string;
  error_message?: string;
};
type LeadSectionConfig = {
  title: string;
  count: number;
  totalLeads: number;
  leads: AssignedLeadItem[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

interface SalesRepStatusDetailsViewProps {
  salesRepId: number | string;
  isDark: boolean;
  onBack: () => void;
}

const LEADS_PER_PAGE = 10;

const formatDateLabel = (dateValue?: string | null) => {
  if (!dateValue) return "N/A";
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return dateValue;
  return format(parsedDate, "MMM dd, yyyy");
};

const formatDateTimeLabel = (dateValue?: string | null) => {
  if (!dateValue) return "N/A";
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return dateValue;
  return format(parsedDate, "MMM dd, yyyy hh:mm a");
};

const formatTimeLabel = (timeValue?: string | null) => {
  if (!timeValue) return null;
  const [hoursString = "0", minutesString = "0"] = String(timeValue).split(":");
  const hours = Number(hoursString);
  const minutes = Number(minutesString);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return timeValue;
  const timeDate = new Date();
  timeDate.setHours(hours, minutes, 0, 0);
  return format(timeDate, "hh:mm a");
};

const normalizeSelectedDate = (dateValue: Date | null) => {
  if (!dateValue || Number.isNaN(dateValue.getTime())) return null;
  return new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate(), 12, 0, 0, 0);
};

const formatDisplayLabel = (value?: string | null, fallback = "N/A") => {
  if (!value) return fallback;
  const normalizedValue = String(value).trim();
  if (!normalizedValue) return fallback;
  return normalizedValue.replace(/_/g, " ").replace(/\s+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const getLeadDisplayName = (lead: AssignedLeadItem) =>
  lead.client_name?.trim() || lead.guest_email?.trim() || "Unknown Client";

const buildPageNumbers = (currentPage: number, totalPages: number) => {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
};

export default function SalesRepStatusDetailsView({ salesRepId, isDark, onBack }: SalesRepStatusDetailsViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [salesLeadsPage, setSalesLeadsPage] = useState(1);
  const [clientLeadsPage, setClientLeadsPage] = useState(1);
  const [statusDetails, setStatusDetails] = useState<SalesRepStatusDetails | null>(null);
  const [statusFilters, setStatusFilters] = useState<{ start_date?: string | null; end_date?: string | null }>({});
  const [statusLoading, setStatusLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const activityEntries = useMemo(() => {
    const activityByDate = statusDetails?.activity?.activity_by_date || {};
    return Object.entries(activityByDate).sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime());
  }, [statusDetails]);

  const unavailabilityEntries = useMemo(() => {
    const entries = statusDetails?.unavailability || [];
    return [...entries].sort((entryA, entryB) => new Date(entryA.date || 0).getTime() - new Date(entryB.date || 0).getTime());
  }, [statusDetails]);

  const salesLeadEntries = useMemo(
    () => statusDetails?.assigned_leads?.sales_leads || [],
    [statusDetails?.assigned_leads?.sales_leads]
  );
  const clientLeadEntries = useMemo(
    () => statusDetails?.assigned_leads?.client_leads || [],
    [statusDetails?.assigned_leads?.client_leads]
  );
  const totalAssignedLeads = statusDetails?.assigned_leads?.total_count || 0;
  const totalAssignedSalesLeads = statusDetails?.assigned_leads?.sales_leads_count || 0;
  const totalAssignedClientLeads = statusDetails?.assigned_leads?.client_leads_count || 0;
  const salesLeadsTotalPages = Math.ceil(salesLeadEntries.length / LEADS_PER_PAGE);
  const clientLeadsTotalPages = Math.ceil(clientLeadEntries.length / LEADS_PER_PAGE);

  const paginatedSalesLeadEntries = useMemo(() => salesLeadEntries.slice((salesLeadsPage - 1) * LEADS_PER_PAGE, salesLeadsPage * LEADS_PER_PAGE), [salesLeadEntries, salesLeadsPage]);
  const paginatedClientLeadEntries = useMemo(() => clientLeadEntries.slice((clientLeadsPage - 1) * LEADS_PER_PAGE, clientLeadsPage * LEADS_PER_PAGE), [clientLeadEntries, clientLeadsPage]);

  useEffect(() => {
    const fetchStatusDetails = async () => {
      setStatusLoading(true);
      setLoadError(null);
      try {
        const selectedDateValue = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;
        const response = (await salesService.getSalesRepStatusDetails({
          sales_rep_id: salesRepId,
          ...(selectedDateValue ? { start_date: selectedDateValue, end_date: selectedDateValue } : {}),
        })) as SalesRepStatusResponse;
        if (response?.error) throw new Error(response?.message || response?.error_message || "Failed to load sales person details");
        setStatusDetails(response?.data || null);
        setStatusFilters(response?.filters || {});
      } catch (error) {
        console.error("Failed to fetch sales rep status details:", error);
        const message = error instanceof Error ? error.message : "Failed to load sales person details";
        toast.error(message);
        setLoadError(message);
        setStatusDetails(null);
        setStatusFilters({});
      } finally {
        setStatusLoading(false);
      }
    };
    void fetchStatusDetails();
  }, [salesRepId, selectedDate]);

  useEffect(() => { setSalesLeadsPage(1); }, [salesLeadEntries.length]);
  useEffect(() => { setClientLeadsPage(1); }, [clientLeadEntries.length]);

  const isCurrentlyAvailable = Boolean(statusDetails?.current_status?.is_available);
  const totalStatusChanges = statusDetails?.activity?.total_status_changes_in_range || 0;
  const appliedRangeLabel = statusFilters.start_date && statusFilters.end_date
    ? statusFilters.start_date === statusFilters.end_date
      ? formatDateLabel(statusFilters.start_date)
      : `${formatDateLabel(statusFilters.start_date)} - ${formatDateLabel(statusFilters.end_date)}`
    : "Last 7 days";

  const leadSections: LeadSectionConfig[] = [
    { title: "Assigned Sales Leads", count: totalAssignedSalesLeads, totalLeads: salesLeadEntries.length, leads: paginatedSalesLeadEntries, currentPage: salesLeadsPage, totalPages: salesLeadsTotalPages, onPageChange: setSalesLeadsPage },
    { title: "Assigned Client Leads", count: totalAssignedClientLeads, totalLeads: clientLeadEntries.length, leads: paginatedClientLeadEntries, currentPage: clientLeadsPage, totalPages: clientLeadsTotalPages, onPageChange: setClientLeadsPage },
  ].filter((section) => section.totalLeads > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button type="button" onClick={onBack} className={`h-auto p-0 text-sm font-medium ${isDark ? "bg-transparent text-white hover:bg-transparent hover:text-white/75" : "bg-transparent text-black hover:bg-transparent hover:text-black/70"}`}>
          <ArrowLeft size={18} className="mr-2" />
          Back To Sales People
        </Button>
      </div>

      <div className={`rounded-2xl border p-6 ${isDark ? "border-[#2F2F2F] bg-[#121212]" : "border-[#E5E5E5] bg-white"}`}>
        <div className="flex flex-col gap-3">
          <h1 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-black"}`}>{statusDetails?.sales_rep_name || `Sales Person #${salesRepId}`}</h1>
          <p className={`${isDark ? "text-white/60" : "text-[#6B6256]"}`}>Review current availability and status-change activity for the selected sales person.</p>
        </div>
      </div>

      <div className={`rounded-2xl border p-6 ${isDark ? "border-[#2F2F2F] bg-[#121212]" : "border-[#E5E5E5] bg-white"}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className={`flex items-center gap-2 text-sm ${isDark ? "text-white/70" : "text-[#555]"}`}><Mail size={16} /><span>{statusDetails?.sales_rep_email || "No email"}</span></div>
            <div className={`flex items-center gap-2 text-sm ${isDark ? "text-white/70" : "text-[#555]"}`}><UserRound size={16} /><span>Rep ID #{statusDetails?.sales_rep_id || salesRepId}</span></div>
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
                sx={{ height: 44, "& .MuiInputBase-input": { fontSize: "15px", fontWeight: 500 } }}
                colors={isDark ? {
                  inputBackground: "#1A1A1A", inputBorder: "rgba(255,255,255,0.08)", paperBackground: "#3A3A3A", accent: "#8FB7E8", accentText: "#101010", hoverAccent: "#A8C7EE", navigationIconColor: "#FFFFFF", calendarHeaderText: "#FFFFFF", weekdayLabelText: "rgba(255,255,255,0.92)", dayNumberText: "#FFFFFF", mutedText: "rgba(255,255,255,0.55)",
                } : {
                  inputBackground: "#FFFFFF", inputBorder: "#D8D8D8", paperBackground: "#FFFFFF",
                }}
              />
            </div>
            <button type="button" onClick={() => setSelectedDate(null)} className={`h-11 rounded-lg border px-4 text-sm font-medium transition-colors ${isDark ? "border-white/10 bg-[#1A1A1A] text-white hover:bg-white/5" : "border-[#D8D8D8] bg-white text-black hover:bg-[#F7F7F7]"}`}>Last 7 Days</button>
          </div>
        </div>

        {statusLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className={`animate-spin ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} size={28} /></div>
        ) : loadError ? (
          <div className={`mt-6 rounded-xl border px-4 py-10 text-center text-sm ${isDark ? "border-white/10 text-white/60" : "border-[#E8E8E8] text-[#666]"}`}>{loadError}</div>
        ) : !statusDetails ? (
          <div className={`mt-6 rounded-xl border px-4 py-10 text-center text-sm ${isDark ? "border-white/10 text-white/60" : "border-[#E8E8E8] text-[#666]"}`}>No sales person details found.</div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#181818]" : "border-[#E8E8E8] bg-[#FCFCFC]"}`}>
                <p className={`text-xs uppercase tracking-[0.18em] ${isDark ? "text-white/45" : "text-[#8A8A8A]"}`}>Current Status</p>
                <div className="mt-3 flex items-center gap-3"><span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${isCurrentlyAvailable ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEE2E2] text-[#991B1B]"}`}>{isCurrentlyAvailable ? "Available" : "Unavailable"}</span></div>
                <p className={`mt-3 text-sm ${isDark ? "text-white/70" : "text-[#555]"}`}>Updated {formatDateTimeLabel(statusDetails.current_status?.updated_at)}</p>
              </div>
              <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#181818]" : "border-[#E8E8E8] bg-[#FCFCFC]"}`}>
                <p className={`text-xs uppercase tracking-[0.18em] ${isDark ? "text-white/45" : "text-[#8A8A8A]"}`}>Applied Range</p>
                <div className="mt-3 flex items-center gap-2"><CalendarDays size={18} className={isDark ? "text-[#E8D1AB]" : "text-[#B38B4D]"} /><p className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>{appliedRangeLabel}</p></div>
              </div>
              <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#181818]" : "border-[#E8E8E8] bg-[#FCFCFC]"}`}>
                <p className={`text-xs uppercase tracking-[0.18em] ${isDark ? "text-white/45" : "text-[#8A8A8A]"}`}>Status Changes</p>
                <div className="mt-3 flex items-center gap-2"><Activity size={18} className={isDark ? "text-[#E8D1AB]" : "text-[#B38B4D]"} /><p className={`text-2xl font-semibold ${isDark ? "text-white" : "text-black"}`}>{totalStatusChanges}</p></div>
              </div>
            </div>

            {totalAssignedLeads > 0 ? (
              <div className="grid gap-4 md:grid-cols-3">
                <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#181818]" : "border-[#E8E8E8] bg-[#FCFCFC]"}`}>
                  <p className={`text-xs uppercase tracking-[0.18em] ${isDark ? "text-white/45" : "text-[#8A8A8A]"}`}>Total Assigned Leads</p>
                  <div className="mt-3 flex items-center gap-2"><FolderKanban size={18} className={isDark ? "text-[#E8D1AB]" : "text-[#B38B4D]"} /><p className={`text-2xl font-semibold ${isDark ? "text-white" : "text-black"}`}>{totalAssignedLeads}</p></div>
                </div>
                {totalAssignedSalesLeads > 0 ? <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#181818]" : "border-[#E8E8E8] bg-[#FCFCFC]"}`}><p className={`text-xs uppercase tracking-[0.18em] ${isDark ? "text-white/45" : "text-[#8A8A8A]"}`}>Sales Leads</p><div className="mt-3 flex items-center gap-2"><FolderKanban size={18} className={isDark ? "text-[#E8D1AB]" : "text-[#B38B4D]"} /><p className={`text-2xl font-semibold ${isDark ? "text-white" : "text-black"}`}>{totalAssignedSalesLeads}</p></div></div> : null}
                {totalAssignedClientLeads > 0 ? <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#181818]" : "border-[#E8E8E8] bg-[#FCFCFC]"}`}><p className={`text-xs uppercase tracking-[0.18em] ${isDark ? "text-white/45" : "text-[#8A8A8A]"}`}>Client Leads</p><div className="mt-3 flex items-center gap-2"><FolderKanban size={18} className={isDark ? "text-[#E8D1AB]" : "text-[#B38B4D]"} /><p className={`text-2xl font-semibold ${isDark ? "text-white" : "text-black"}`}>{totalAssignedClientLeads}</p></div></div> : null}
              </div>
            ) : null}

            {!isCurrentlyAvailable && statusDetails.current_status?.reason ? <div className={`rounded-2xl border p-4 ${isDark ? "border-[#3A2E1C] bg-[#1B1610]" : "border-[#E6D3AF] bg-[#FFF8EB]"}`}><p className={`text-xs uppercase tracking-[0.18em] ${isDark ? "text-[#E8D1AB]" : "text-[#8C6B2F]"}`}>Inactive Reason</p><p className={`mt-2 text-sm ${isDark ? "text-white/80" : "text-[#4A4032]"}`}>{statusDetails.current_status.reason}</p></div> : null}

            {unavailabilityEntries.length > 0 ? (
              <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#181818]" : "border-[#E8E8E8] bg-[#FCFCFC]"}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-xs uppercase tracking-[0.18em] ${isDark ? "text-white/45" : "text-[#8A8A8A]"}`}>Unavailability</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${isDark ? "bg-white/5 text-white/70" : "bg-[#F2F2F2] text-[#444]"}`}>{unavailabilityEntries.length}</span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {unavailabilityEntries.map((item, index) => {
                    const startTimeLabel = formatTimeLabel(item.start_time);
                    const endTimeLabel = formatTimeLabel(item.end_time);
                    const timeRangeLabel = item.is_full_day ? "Full day" : startTimeLabel && endTimeLabel ? `${startTimeLabel} - ${endTimeLabel}` : "Unavailable";
                    return (
                      <div key={`${item.date || "unknown"}-${index}`} className={`rounded-xl border p-4 ${isDark ? "border-white/5 bg-[#141414]" : "border-[#EFEFEF] bg-white"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>{formatDateLabel(item.date)}</p>
                            <div className={`mt-2 flex items-center gap-2 text-xs ${isDark ? "text-white/55" : "text-[#666]"}`}><Clock3 size={14} /><span>{timeRangeLabel}</span></div>
                          </div>
                        </div>
                        {item.notes ? <p className={`mt-3 text-xs leading-relaxed ${isDark ? "text-white/65" : "text-[#555]"}`}>{item.notes}</p> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {leadSections.map((section) => (
              <div key={section.title} className={`overflow-hidden rounded-2xl border ${isDark ? "border-white/10 bg-[#121212]" : "border-[#EAEAEA] bg-white"}`}>
                <div className={`flex items-center justify-between gap-3 px-4 py-4 border-b ${isDark ? "border-white/5 bg-[#161616]" : "border-[#EFEFEF] bg-[#FAF7F1]"}`}>
                  <p className={`text-xs uppercase tracking-[0.18em] ${isDark ? "text-white/45" : "text-[#8A8A8A]"}`}>{section.title}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${isDark ? "bg-white/5 text-white/70" : "bg-[#F2F2F2] text-[#444]"}`}>{section.count}</span>
                </div>
                <div className={`hidden lg:grid grid-cols-[0.7fr_0.8fr_1.5fr_1.1fr_1fr_1fr_1.2fr] gap-3 px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] ${isDark ? "bg-[#161616] text-white/45" : "bg-[#FAF7F1] text-[#8A8A8A]"}`}><span>Lead ID</span><span>Booking</span><span>Client</span><span>Status</span><span>Intent</span><span>Source</span><span>Last Activity</span></div>
                <div>
                  {section.leads.map((lead) => (
                    <div key={`${section.title}-${lead.lead_id}-${lead.booking_id ?? "no-booking"}`} className={`border-t ${isDark ? "border-white/5" : "border-[#EFEFEF]"}`}>
                      <div className={`hidden lg:grid grid-cols-[0.7fr_0.8fr_1.5fr_1.1fr_1fr_1fr_1.2fr] gap-3 px-4 py-4 text-sm ${isDark ? "text-white/85" : "text-[#333]"}`}>
                        <span>#{lead.lead_id}</span>
                        <span>{lead.booking_id ? `#${lead.booking_id}` : "N/A"}</span>
                        <div className="min-w-0">
                          <p className={`truncate font-medium ${isDark ? "text-white" : "text-black"}`}>{getLeadDisplayName(lead)}</p>
                          <p className={`mt-1 truncate text-xs ${isDark ? "text-white/55" : "text-[#666]"}`}>{lead.guest_email || "No email"}</p>
                          {lead.phone ? <p className={`mt-1 truncate text-xs ${isDark ? "text-white/45" : "text-[#777]"}`}>{lead.phone}</p> : null}
                        </div>
                        <span>{formatDisplayLabel(lead.lead_status)}</span>
                        <span>{formatDisplayLabel(lead.intent)}</span>
                        <span>{formatDisplayLabel(lead.lead_source)}</span>
                        <span>{formatDateTimeLabel(lead.last_activity_at || lead.updated_at || lead.created_at)}</span>
                      </div>
                      <div className="space-y-3 p-4 lg:hidden">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{getLeadDisplayName(lead)}</p>
                            <p className={`mt-1 text-xs ${isDark ? "text-white/55" : "text-[#666]"}`}>{`Lead #${lead.lead_id}${lead.booking_id ? ` | Booking #${lead.booking_id}` : ""}`}</p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${isDark ? "bg-white/5 text-white/70" : "bg-[#F2F2F2] text-[#444]"}`}>{formatDisplayLabel(lead.lead_status)}</span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div><p className={`text-[10px] uppercase tracking-[0.18em] ${isDark ? "text-white/40" : "text-[#8A8A8A]"}`}>Email</p><p className={`mt-1 text-sm break-all ${isDark ? "text-white/80" : "text-[#333]"}`}>{lead.guest_email || "No email"}</p></div>
                          <div><p className={`text-[10px] uppercase tracking-[0.18em] ${isDark ? "text-white/40" : "text-[#8A8A8A]"}`}>Source</p><p className={`mt-1 text-sm ${isDark ? "text-white/80" : "text-[#333]"}`}>{formatDisplayLabel(lead.lead_source)}</p></div>
                          <div><p className={`text-[10px] uppercase tracking-[0.18em] ${isDark ? "text-white/40" : "text-[#8A8A8A]"}`}>Intent</p><p className={`mt-1 text-sm ${isDark ? "text-white/80" : "text-[#333]"}`}>{formatDisplayLabel(lead.intent)}</p></div>
                          <div><p className={`text-[10px] uppercase tracking-[0.18em] ${isDark ? "text-white/40" : "text-[#8A8A8A]"}`}>Last Activity</p><p className={`mt-1 text-sm ${isDark ? "text-white/80" : "text-[#333]"}`}>{formatDateTimeLabel(lead.last_activity_at || lead.updated_at || lead.created_at)}</p></div>
                        </div>
                        {lead.phone ? <div className={`flex items-center gap-2 text-sm ${isDark ? "text-white/65" : "text-[#555]"}`}><Phone size={14} /><span>{lead.phone}</span></div> : null}
                      </div>
                    </div>
                  ))}
                </div>
                {section.totalPages > 1 ? (
                  <div className={`flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/5" : "border-[#EFEFEF]"}`}>
                    <p className={`text-sm ${isDark ? "text-white/55" : "text-[#666]"}`}>Showing {((section.currentPage - 1) * LEADS_PER_PAGE) + 1} to {Math.min(section.currentPage * LEADS_PER_PAGE, section.totalLeads)} of {section.totalLeads} leads</p>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => section.onPageChange(Math.max(1, section.currentPage - 1))} disabled={section.currentPage === 1} className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? "border-white/10 bg-[#181818] text-white hover:bg-white/5" : "border-[#D8D8D8] bg-white text-black hover:bg-[#F7F7F7]"}`}><ChevronLeft size={16} /></button>
                      {buildPageNumbers(section.currentPage, section.totalPages).map((page) => (
                        <button key={`${section.title}-page-${page}`} type="button" onClick={() => section.onPageChange(page)} className={`flex h-9 min-w-[36px] items-center justify-center rounded-lg border px-3 text-sm font-medium transition-all ${section.currentPage === page ? isDark ? "border-[#E8D1AB] bg-[#E5D5B8] text-black" : "border-[#E8D1AB] bg-[#E8D1AB] text-black" : isDark ? "border-white/10 bg-[#181818] text-white/70 hover:bg-white/5" : "border-[#D8D8D8] bg-white text-[#666] hover:bg-[#F7F7F7]"}`}>{page}</button>
                      ))}
                      <button type="button" onClick={() => section.onPageChange(Math.min(section.totalPages, section.currentPage + 1))} disabled={section.currentPage === section.totalPages} className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? "border-white/10 bg-[#181818] text-white hover:bg-white/5" : "border-[#D8D8D8] bg-white text-black hover:bg-[#F7F7F7]"}`}><ChevronRight size={16} /></button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}

            {activityEntries.length > 0 ? (
              <div className={`overflow-hidden rounded-2xl border ${isDark ? "border-white/10" : "border-[#EAEAEA]"}`}>
                <div className={`grid grid-cols-[1.2fr_1fr_1fr_1fr] gap-3 px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] ${isDark ? "bg-[#161616] text-white/45" : "bg-[#FAF7F1] text-[#8A8A8A]"}`}><span>Date</span><span>Available</span><span>Unavailable</span><span>Total</span></div>
                <div>
                  {activityEntries.map(([dateKey, counts]) => (
                    <div key={dateKey} className={`grid grid-cols-[1.2fr_1fr_1fr_1fr] gap-3 px-4 py-4 text-sm border-t ${isDark ? "border-white/5 text-white/85" : "border-[#EFEFEF] text-[#333]"}`}>
                      <span>{formatDateLabel(dateKey)}</span>
                      <span>{counts.available_count || 0}</span>
                      <span>{counts.unavailable_count || 0}</span>
                      <span>{counts.total_status_changes || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
