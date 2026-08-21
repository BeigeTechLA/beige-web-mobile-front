"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format,
  isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Copy, Loader2, MapPin, X } from "lucide-react";
import { adminApi } from "@/lib/api";
import { safeJsonParse } from "@/lib/safeJsonParse";

type RecordValue = Record<string, unknown>;
type OperatingHour = RecordValue & {
  day_of_week?: number | string;
  is_open?: boolean | number | string;
};
export interface AvailabilityRecord {
  studio_availability_id?: string | number | null;
  studio_id?: string | number | null;
  availability_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  status?: string | null;
  notes?: string | null;
  metadata?: RecordValue | null;
  created_by_user_id?: string | number | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface BookingDetails {
  client_name?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  payment_status?: string | null;
  total_value_amount?: string | number | null;
  budget?: string | number | null;
  assigned_crews?: unknown[];
  assignedCrew?: unknown[];
  equipment_reserved?: unknown[];
  equipment?: unknown[];
  [key: string]: unknown;
}

type StudioSettings = {
  studio_name?: string | null;
  city?: string | null;
  state?: string | null;
  location?: string | null;
  minimum_booking_hours?: number | string | null;
  buffer_time_minutes?: number | string | null;
  [key: string]: unknown;
};

type AvailabilityEvent = {
  id: string;
  date: string;
  start: string;
  end: string;
  title: string;
  status: "booked" | "blocked" | "conflict" | "available";
  raw: AvailabilityRecord;
};

interface StudioAvailabilityProps {
  isDark: boolean;
  availability?: unknown;
  operatingHours?: unknown;
  studioName?: string;
  studioSettings?: StudioSettings;
}

const getText = (record: RecordValue, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const normalizeEvents = (value: unknown): AvailabilityEvent[] => {
  const parsed = safeJsonParse<unknown>(value, []);
  const source = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object"
      ? Object.entries(parsed as RecordValue).flatMap(([date, item]) =>
        Array.isArray(item)
          ? item.map((entry) => ({ ...(entry as RecordValue), date }))
          : [{ ...(item as RecordValue), date }],
      )
      : [];

  return source.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const record = item as RecordValue;
    const date = getText(record, ["date", "availability_date", "start_date"]);
    if (!date) return [];
    const rawStatus = getText(record, ["status", "type", "availability_status"]).toLowerCase();
    const status: AvailabilityEvent["status"] = rawStatus.includes("conflict")
      ? "conflict"
      : rawStatus.includes("block") || rawStatus.includes("off") || rawStatus.includes("unavailable")
        ? "blocked"
      : rawStatus.includes("available") || rawStatus.includes("open") ? "available" : "booked";
    return [{
      id: String(record.id ?? record.availability_id ?? index),
      date: date.slice(0, 10),
      start: getText(record, ["start_time", "starts_at", "opens_at"]),
      end: getText(record, ["end_time", "ends_at", "closes_at"]),
      title: getText(record, ["title", "project_name", "shoot_name", "name"]) || (status === "blocked" ? "Blocked time" : "Reserved shoot"),
      status,
      raw: record as AvailabilityRecord,
    }];
  });
};

const formatTime = (value: string) => {
  if (!value) return "All day";
  const [hourText, minute = "00"] = value.split(":");
  const hour = Number(hourText);
  if (Number.isNaN(hour)) return value;
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
};

const dateKey = (date: Date) => format(date, "yyyy-MM-dd");

const asRecord = (value: unknown): RecordValue =>
  value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};

const firstText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
};

const formatMoney = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? `$${amount.toLocaleString()}` : "Details unavailable";
};

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";

const normalizeStatus = (value: unknown) => {
  const status = firstText(value, "Unavailable").replace(/[_-]+/g, " ");
  return status.replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const statusClasses = (value: string) => {
  const normalized = value.toLowerCase();
  if (normalized.includes("conflict") || normalized.includes("cancel")) return "bg-red-500/20 text-red-400";
  if (normalized.includes("block") || normalized.includes("unavailable")) return "bg-white/10 text-white/60";
  return "bg-emerald-500/20 text-emerald-400";
};

const formatDateValue = (value: string) => format(new Date(`${value}T00:00:00`), "MMM d, yyyy");

const extractArray = (record: RecordValue, keys: string[]) => {
  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key];
  }
  return [];
};

export default function StudioAvailability({
  isDark, availability, operatingHours, studioName = "Studio", studioSettings,
}: StudioAvailabilityProps) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedEvent, setSelectedEvent] = useState<AvailabilityEvent | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const events = useMemo(() => normalizeEvents(availability), [availability]);
  const hours = useMemo(() => {
    const parsed = safeJsonParse<unknown>(operatingHours, []);
    return Array.isArray(parsed) ? parsed as OperatingHour[] : [];
  }, [operatingHours]);
  const openDays = useMemo(() => new Set(
    hours.filter((item) => item.is_open === true || item.is_open === 1 || item.is_open === "1" || item.is_open === "true")
      .map((item) => Number(item.day_of_week)),
  ), [hours]);
  const calendarDays = eachDayOfInterval({ start: startOfWeek(startOfMonth(currentMonth)), end: endOfWeek(endOfMonth(currentMonth)) });
  const monthEvents = events.filter((event) => event.date.startsWith(format(currentMonth, "yyyy-MM")));
  const availableDays = monthEvents.filter((event) => event.status === "available").length;
  const bookedCount = monthEvents.filter((event) => event.status === "booked").length;
  const blockedCount = monthEvents.filter((event) => event.status === "blocked").length;
  const muted = isDark ? "text-white/50" : "text-gray-500";
  const panel = isDark ? "bg-[#171717] border-white/10" : "bg-white border-gray-200";
  const eventsForDay = (date: Date) => events.filter((event) => event.date === dateKey(date));

  useEffect(() => {
    let active = true;
    const metadata = asRecord(selectedEvent?.raw.metadata);
    const projectId = metadata.stream_project_booking_id;

    setBookingDetails(null);
    setBookingError("");
    if (!selectedEvent || projectId == null) return;

    setBookingLoading(true);
    // TODO: replace with the booking-details endpoint when backend exposes one by studio_booking_id.
    adminApi.getProjectDetails(String(projectId)).then((response) => {
      if (!active) return;
      if (response.success && response.data) {
        setBookingDetails(asRecord(response.data) as BookingDetails);
      } else {
        setBookingError(response.error || "Booking details unavailable");
      }
    }).catch(() => {
      if (active) setBookingError("Unable to load booking details");
    }).finally(() => {
      if (active) setBookingLoading(false);
    });

    return () => { active = false; };
  }, [selectedEvent]);

  useEffect(() => {
    if (!selectedEvent) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedEvent(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedEvent]);

  const copyLink = async () => {
    await navigator.clipboard?.writeText(window.location.href);
  };

  return (
    <div className="space-y-5 lg:space-y-7">
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-9">
          <section className={`overflow-hidden rounded-2xl border ${panel}`}>
            <div className={`flex flex-col justify-between gap-4 border-b p-4 lg:flex-row lg:items-center lg:p-6 ${isDark ? "border-white/10" : "border-gray-100"}`}>
              <div className="flex items-center gap-3">
                <button aria-label="Previous month" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className={`rounded-lg border p-2 ${isDark ? "border-white/10 bg-[#202020]" : "border-gray-200 bg-gray-50"}`}><ChevronLeft size={17} /></button>
                <span className="min-w-36 text-center text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</span>
                <button aria-label="Next month" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className={`rounded-lg border p-2 ${isDark ? "border-white/10 bg-[#202020]" : "border-gray-200 bg-gray-50"}`}><ChevronRight size={17} /></button>
              </div>
              <button onClick={() => setCurrentMonth(startOfMonth(new Date()))} className={`rounded-lg border px-4 py-2 text-sm ${isDark ? "border-white/10 text-white/70" : "border-gray-200 text-gray-600"}`}>Today</button>
            </div>
            <div className="overflow-x-auto p-3 lg:p-5">
              <div className="min-w-[650px]">
                <div className={`grid grid-cols-7 rounded-t-xl ${isDark ? "bg-[#202020]" : "bg-gray-100"}`}>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className={`py-3 text-center text-xs font-semibold uppercase tracking-wider ${muted}`}>{day}</div>)}
                </div>
                <div className={`grid grid-cols-7 overflow-hidden rounded-b-xl border-l border-t ${isDark ? "border-black bg-[#141414]" : "border-gray-200 bg-[#fcfbf8]"}`}>
                  {calendarDays.map((day) => {
                    const dayEvents = eventsForDay(day);
                    const isOpen = openDays.size === 0 || openDays.has(day.getDay());
                    return <div key={day.toISOString()} className={`min-h-[105px] border-b border-r p-2 ${isDark ? "border-black" : "border-gray-200"} ${!isSameMonth(day, currentMonth) ? "opacity-35" : ""}`}>
                      <div className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full text-sm ${isSameDay(day, new Date()) ? "bg-[#E5D5B8] font-bold text-black" : ""}`}>{format(day, "d")}</div>
                      {isSameMonth(day, currentMonth) && isOpen && dayEvents.length === 0 && <span className={`text-[10px] ${isDark ? "text-emerald-300/60" : "text-emerald-700/70"}`}>Available</span>}
                      <div className="space-y-1">
                        {dayEvents.map((event) => <button key={event.id} onClick={() => setSelectedEvent(event)} className={`flex max-w-full items-center gap-1 rounded px-1.5 py-1 text-left text-[10px] ${event.status === "conflict" ? "bg-red-500/15 text-red-400" : event.status === "blocked" ? "bg-white/10 text-white/50" : "bg-blue-500/15 text-blue-300"}`}><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${event.status === "conflict" ? "bg-red-500" : event.status === "blocked" ? "bg-white/50" : "bg-blue-500"}`} /><span className="truncate">{event.start ? formatTime(event.start) : event.title}</span></button>)}
                      </div>
                    </div>;
                  })}
                </div>
              </div>
            </div>
            {events.length === 0 && <p className={`px-5 pb-5 text-sm ${muted}`}>No booked, blocked, or conflict events were returned. Open days are calculated from operating hours.</p>}
          </section>
        </div>

        <aside className="col-span-12 space-y-5 lg:col-span-3">
          <section className={`rounded-2xl border p-4 lg:p-5 ${panel}`}>
            <h3 className="mb-4 font-semibold">Color Legend</h3>
            {[['bg-white/80', 'Disabled', 'Time off or blocked'], ['bg-blue-500', 'Shoots', 'Confirmed shoots'], ['bg-red-500', 'Conflicts', 'Scheduling conflicts']].map(([color, label, description]) => <div key={label} className="mb-3 flex gap-3"><span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${color}`} /><div><p className="text-sm">{label}</p><p className={`text-xs ${muted}`}>{description}</p></div></div>)}
          </section>
          <section className={`rounded-2xl border p-4 lg:p-5 ${panel}`}>
            <h3 className="mb-4 font-semibold">This Month</h3>
            {[['Available Days', String(availableDays)], ['Booked Shoots', String(bookedCount)], ['Time Off', `${blockedCount} day${blockedCount === 1 ? "" : "s"}`]].map(([label, value]) => <div key={label} className={`mb-2 flex justify-between rounded-lg p-3 text-sm ${isDark ? "bg-[#202020]" : "bg-gray-50"}`}><span className={muted}>{label}</span><span className={isDark ? "text-[#E5D5B8]" : "text-gray-800"}>{value}</span></div>)}
            {monthEvents.length === 0 && <p className={`mt-3 text-xs ${muted}`}>No availability data for this month.</p>}
          </section>
          <section className={`rounded-2xl border p-4 lg:p-5 ${panel}`}>
            <h3 className="font-semibold">Share Availability</h3><p className={`my-3 text-sm ${muted}`}>Share {studioName}&apos;s availability link with production teams.</p><button onClick={copyLink} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E5D5B8] py-3 text-sm font-medium text-black"><Copy size={16} /> Copy Link</button>
          </section>
        </aside>
      </div>

      {selectedEvent && (() => {
        const raw = selectedEvent.raw;
        const metadata = asRecord(raw.metadata);
        const booking = asRecord(bookingDetails);
        const client = asRecord(booking.client || booking.client_user || booking.user || booking.lead_details);
        const clientName = firstText(booking.client_name, client.client_name, client.name, client.full_name, booking.guest_email) || "Details unavailable";
        const crews = extractArray(booking, ["assigned_crews", "assignedCrew", "crew"]);
        const equipment = extractArray(booking, ["equipment_reserved", "equipment", "reserved_equipment"]);
        const location = [studioSettings?.city, studioSettings?.state].filter(Boolean).join(", ") || studioSettings?.location || studioName;
        const status = normalizeStatus(raw.status || selectedEvent.status);
        const detailRows = [
          ["Phone", firstText(booking.client_phone, client.phone, client.phone_number)],
          ["Email", firstText(booking.client_email, client.email, booking.guest_email)],
          ["Payment Status", firstText(booking.payment_status, booking.paymentStatus)],
          ["Total Value", booking.total_value_amount ?? booking.total_amount ?? booking.budget ? formatMoney(booking.total_value_amount ?? booking.total_amount ?? booking.budget) : "Details unavailable"],
        ];
        return <div role="dialog" aria-modal="true" aria-labelledby="availability-shoot-details" className="fixed inset-0 z-50 flex justify-end bg-black/70" onClick={() => setSelectedEvent(null)}>
          <section className={`h-full w-full max-w-2xl overflow-y-auto border-l p-6 shadow-2xl lg:p-8 ${isDark ? "border-white/10 bg-[#090909]" : "border-gray-200 bg-white"}`} onClick={(event) => event.stopPropagation()}>
            <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-6"><h2 id="availability-shoot-details" className="text-2xl font-semibold">Shoot Details</h2><button aria-label="Close details" onClick={() => setSelectedEvent(null)} className="rounded-full bg-white/10 p-3"><X size={20} /></button></div>
            <div className="space-y-6">
              <section><span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${statusClasses(status)}`}>{status}</span><h3 className="mt-4 text-xl font-medium">{raw.notes || selectedEvent.title || "Reserved Shoot"}</h3><div className={`mt-3 flex flex-wrap gap-4 text-sm ${muted}`}><span className="flex items-center gap-2"><CalendarDays size={16} />{formatDateValue(selectedEvent.date)}</span>{selectedEvent.start && <span className="flex items-center gap-2"><Clock3 size={16} />{formatTime(selectedEvent.start)}{selectedEvent.end ? ` - ${formatTime(selectedEvent.end)}` : ""}</span>}<span className="flex items-center gap-2"><MapPin size={16} />{location}</span></div></section>

              <section className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#111]" : "border-gray-200"}`}><h4 className="mb-4 font-semibold">Client Information</h4>{bookingLoading ? <div className={`flex items-center gap-2 text-sm ${muted}`}><Loader2 className="animate-spin" size={16} />Loading booking details...</div> : bookingError ? <p className={`text-sm ${muted}`}>{bookingError}</p> : <><div className="flex items-center gap-3"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d9eaff] text-lg font-semibold text-[#162235]">{initials(clientName)}</div><div><p className="font-medium">{clientName}</p><p className={`text-xs ${muted}`}>Booking client</p></div></div><div className="mt-4 grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-4">{detailRows.map(([label, value]) => <div key={label}><p className={`text-xs ${muted}`}>{label}</p><p className="mt-1 break-words text-sm">{value || "Details unavailable"}</p></div>)}</div></>}</section>

              <section className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#111]" : "border-gray-200"}`}><h4 className="mb-4 font-semibold">Assigned Crew ({crews.length})</h4>{crews.length ? <div className="grid gap-3 sm:grid-cols-2">{crews.map((member, index) => { const item = asRecord(member); const name = firstText(item.name, item.full_name, item.first_name && `${item.first_name} ${firstText(item.last_name)}`) || "Crew member"; return <div key={`${name}-${index}`} className="flex items-center gap-3 rounded-xl bg-white/5 p-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d9b38c] text-xs font-semibold text-black">{initials(name)}</div><div><p className="text-sm">{name}</p><p className={`text-xs ${muted}`}>{firstText(item.role, item.primary_role) || "Role unavailable"}</p></div></div>; })}</div> : <p className={`text-sm ${muted}`}>Details unavailable</p>}</section>

              <section className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#111]" : "border-gray-200"}`}><h4 className="mb-4 font-semibold">Time &amp; Budget</h4><div className="grid grid-cols-2 gap-4"><div><p className={`text-xs ${muted}`}>Duration (hours)</p><p className="mt-1 text-sm">{firstText(metadata.duration_hours, booking.duration_hours) || "Details unavailable"}</p></div><div><p className={`text-xs ${muted}`}>Budget ($)</p><p className="mt-1 text-sm">{booking.total_value_amount || booking.total_amount || booking.budget ? formatMoney(booking.total_value_amount || booking.total_amount || booking.budget) : "Details unavailable"}</p></div></div></section>

              <section className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#111]" : "border-gray-200"}`}><h4 className="mb-4 font-semibold">Studio Settings Applied</h4><div className="grid grid-cols-2 gap-4 sm:grid-cols-4"><div><p className={`text-xs ${muted}`}>Minimum Booking</p><p className="mt-1 text-sm">{studioSettings?.minimum_booking_hours != null ? `${studioSettings.minimum_booking_hours} Hours` : "N/A"}</p></div><div><p className={`text-xs ${muted}`}>Buffer Time</p><p className="mt-1 text-sm">{studioSettings?.buffer_time_minutes != null ? `${studioSettings.buffer_time_minutes} Minutes` : "N/A"}</p></div><div><p className={`text-xs ${muted}`}>Cleaning Slot Blocked</p><p className="mt-1 text-sm">N/A</p></div><div><p className={`text-xs ${muted}`}>Overtime Used</p><p className="mt-1 text-sm">N/A</p></div></div></section>

              <section className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#111]" : "border-gray-200"}`}><h4 className="mb-4 font-semibold">Equipment Reserved</h4>{equipment.length ? <div className="flex flex-wrap gap-2">{equipment.map((item, index) => <span key={index} className="rounded-md bg-white/10 px-2.5 py-1 text-xs text-white/70">{typeof item === "string" ? item : firstText(asRecord(item).name, asRecord(item).equipment_name) || "Equipment"}</span>)}</div> : <p className={`text-sm ${muted}`}>Details unavailable</p>}</section>

              <section className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#111]" : "border-gray-200"}`}><h4 className="mb-4 font-semibold">Record Metadata</h4><div className="grid gap-4 text-sm sm:grid-cols-2"><div><p className={`text-xs ${muted}`}>Availability ID</p><p className="mt-1">{raw.studio_availability_id ?? "Not provided"}</p></div><div><p className={`text-xs ${muted}`}>Studio ID</p><p className="mt-1">{raw.studio_id ?? "Not provided"}</p></div><div><p className={`text-xs ${muted}`}>Created</p><p className="mt-1">{raw.created_at ? format(new Date(raw.created_at), "MMM d, yyyy h:mm a") : "Not provided"}</p></div><div><p className={`text-xs ${muted}`}>Updated</p><p className="mt-1">{raw.updated_at ? format(new Date(raw.updated_at), "MMM d, yyyy h:mm a") : "Not provided"}</p></div></div></section>
            </div>
          </section>
        </div>;
      })()}
    </div>
  );
}
