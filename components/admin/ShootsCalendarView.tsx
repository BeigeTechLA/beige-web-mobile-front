"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { adminApi } from "@/lib/api";

type ShootCalendarViewProps = { isDark: boolean };
type CalendarView = "month" | "week" | "day";
type CalendarShoot = { id: number | string; title: string; date: string; start_time?: string | null; end_time?: string | null; time_zone?: string | null };

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_SLOTS = Array.from({ length: 24 }, (_, index) => index);

const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const apiDateKey = (value: string) => String(value || "").slice(0, 10);
const formatShootTitle = (title: string) => String(title || "Untitled Shoot").replace(/^CUSTOM Shoot\b/i, "CUSTOM");
const isSameDay = (first: Date, second: Date) => dateKey(first) === dateKey(second);
const formatTime = (value?: string | null) => {
  if (!value) return "Time TBD";
  const [hourText, minute = "00"] = value.split(":");
  const hour = Number(hourText);
  if (!Number.isFinite(hour)) return value;
  return `${hour % 12 || 12}:${minute.slice(0, 2)} ${hour >= 12 ? "PM" : "AM"}`;
};
const timeSlotLabel = (hour: number) => `${hour % 12 || 12}:00 ${hour >= 12 ? "PM" : "AM"}`;
const shootSlotHour = (shoot: CalendarShoot) => {
  const startHour = Number(shoot.start_time?.split(":")[0]);
  if (!Number.isFinite(startHour)) return TIME_SLOTS[0];
  return Math.min(Math.max(startHour, 0), 23);
};
const shootStartsAtHour = (shoot: CalendarShoot, hour: number) => shootSlotHour(shoot) === hour;

export const ShootsCalendarView = ({ isDark }: ShootCalendarViewProps) => {
  const today = new Date();
  const [view, setView] = useState<CalendarView>("month");
  const [focusDate, setFocusDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [shoots, setShoots] = useState<CalendarShoot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const weekStart = useMemo(() => {
    const date = new Date(focusDate);
    date.setDate(focusDate.getDate() - focusDate.getDay());
    return date;
  }, [focusDate]);
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  }), [weekStart]);

  useEffect(() => {
    let cancelled = false;
    const loadShoots = async () => {
      setIsLoading(true);
      const response = view === "month"
        ? await adminApi.getShootCalendarMonth({ month: focusDate.getMonth() + 1, year: focusDate.getFullYear() })
        : view === "week"
          ? await adminApi.getShootCalendarWeek({ start_date: dateKey(weekStart) })
          : await adminApi.getShootCalendarDay({ date: dateKey(focusDate) });

      if (!cancelled) {
        setShoots(response?.success && Array.isArray(response?.data?.shoots)
          ? response.data.shoots.map((shoot: CalendarShoot) => ({ ...shoot, title: formatShootTitle(shoot.title) }))
          : []);
        setIsLoading(false);
      }
    };
    loadShoots();
    return () => { cancelled = true; };
  }, [view, focusDate, weekStart]);

  const shootsByDate = useMemo(() => shoots.reduce<Record<string, CalendarShoot[]>>((result, shoot) => {
    const normalizedDate = apiDateKey(shoot.date);
    if (!normalizedDate) return result;
    (result[normalizedDate] ||= []).push(shoot);
    return result;
  }, {}), [shoots]);
  const selectedDateShoots = selectedDate ? shootsByDate[dateKey(selectedDate)] || [] : [];

  const changeDate = (offset: number) => {
    const nextDate = new Date(focusDate);
    if (view === "month") nextDate.setMonth(nextDate.getMonth() + offset);
    if (view === "week") nextDate.setDate(nextDate.getDate() + offset * 7);
    if (view === "day") nextDate.setDate(nextDate.getDate() + offset);
    setFocusDate(nextDate);
  };

  const headerLabel = view === "month"
    ? focusDate.toLocaleString("default", { month: "long", year: "numeric" })
    : view === "week"
      ? `${weekDates[0].toLocaleDateString("default", { month: "short", day: "numeric" })} – ${weekDates[6].toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" })}`
      : focusDate.toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const buttonClass = (active: boolean) => `px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${active ? "bg-[#E5D5B8] text-black" : isDark ? "text-white/50 hover:text-white" : "text-black/50 hover:text-black"}`;
  const cellClass = isDark ? "border-white/5 bg-[#161616] hover:bg-[#1A1A1A]" : "border-[#E5E5E5] bg-white hover:bg-black/[0.02]";

  const renderMonth = () => {
    const firstDay = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1).getDay();
    const daysInMonth = new Date(focusDate.getFullYear(), focusDate.getMonth() + 1, 0).getDate();
    return <div className="grid grid-cols-7 border-collapse">
      {WEEKDAYS.map((day) => <div key={day} className={`border-b border-r py-3 text-center text-[10px] font-bold uppercase tracking-widest last:border-r-0 ${isDark ? "border-[#333] bg-black/40 text-white/30" : "border-gray-100 bg-[#EDEBEB] text-[#7C7777]"}`}>{day}</div>)}
      {Array.from({ length: firstDay }).map((_, index) => <div key={`empty-${index}`} className={`h-24 border border-t-0 ${isDark ? "border-white/5 bg-[#0D0D0D]/50" : "border-[#E5E5E5] bg-[#F4F4F4]"}`} />)}
      {Array.from({ length: daysInMonth }, (_, index) => {
        const date = new Date(focusDate.getFullYear(), focusDate.getMonth(), index + 1);
        const dayShoots = shootsByDate[dateKey(date)] || [];
        return <button type="button" key={dateKey(date)} onClick={() => setSelectedDate(date)} className={`h-24 min-w-0 border border-t-0 p-2 text-left text-xs transition-colors lg:h-28 lg:p-3 ${cellClass}`}>
          <div className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${isSameDay(date, today) ? "bg-[#E8D1AB] text-black" : ""}`}>{date.getDate()}</div>
          <div className="space-y-1">{dayShoots.slice(0, 2).map((shoot) => <div key={shoot.id} title={`${shoot.title} · ${formatTime(shoot.start_time)}`} className="flex min-w-0 items-center gap-1"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" /><span className={`min-w-0 flex-1 truncate ${isDark ? "text-white/70" : "text-black/70"}`}>{shoot.title}</span></div>)}{dayShoots.length > 2 && <p className={isDark ? "text-white/40" : "text-black/45"}>+{dayShoots.length - 2} more</p>}</div>
        </button>;
      })}
    </div>;
  };

  const renderSchedule = (isDayView: boolean) => {
    const dates = isDayView ? [focusDate] : weekDates;
    return <div className="overflow-x-auto"><div className="min-w-[520px]"><div className="grid" style={{ gridTemplateColumns: `72px repeat(${dates.length}, minmax(110px, 1fr))` }}>
      <div className={`border-b border-r ${isDark ? "border-[#333] bg-black/40" : "border-gray-100 bg-[#EDEBEB]"}`} />
      {dates.map((date) => <button type="button" onClick={() => setSelectedDate(date)} key={dateKey(date)} className={`border-b border-r py-3 text-center transition-colors ${isDark ? "border-[#333] bg-black/40 hover:bg-white/5" : "border-gray-100 bg-[#EDEBEB] hover:bg-black/5"}`}><p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-white/30" : "text-[#7C7777]"}`}>{date.toLocaleDateString("default", { weekday: "short" })}</p><span className={`mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${isSameDay(date, today) ? "bg-[#E8D1AB] text-black" : ""}`}>{date.getDate()}</span></button>)}
      {TIME_SLOTS.map((hour) => <React.Fragment key={hour}><div className={`h-16 border-b border-r pr-2 pt-2 text-right text-[10px] ${isDark ? "border-white/5 text-white/30" : "border-[#E5E5E5] text-black/40"}`}>{timeSlotLabel(hour)}</div>{dates.map((date) => {
        const slotShoots = (shootsByDate[dateKey(date)] || []).filter((shoot) => shootStartsAtHour(shoot, hour));
        return <div key={`${dateKey(date)}-${hour}`} className={`relative h-16 border-b border-r p-1.5 ${cellClass}`}>{slotShoots.map((shoot) => <div key={shoot.id} title={`${shoot.title} · ${formatTime(shoot.start_time)} – ${formatTime(shoot.end_time)}`} className="mb-1 rounded-md bg-blue-500 px-2 py-1 text-[10px] font-medium text-black"><p className="truncate">{shoot.title}</p><p className="truncate text-[9px] text-black/70">{formatTime(shoot.start_time)} – {formatTime(shoot.end_time)}</p></div>)}</div>;
      })}</React.Fragment>)}
    </div></div></div>;
  };

  return <div className={`w-full ${isDark ? "text-white" : "text-black"}`}><div className={`overflow-hidden rounded-2xl border shadow-2xl ${isDark ? "border-[#333] bg-[#101010]" : "border-gray-200 bg-white shadow-sm"}`}>
    <div className={`flex flex-col justify-between gap-4 border-b p-4 lg:flex-row lg:items-center lg:p-6 ${isDark ? "border-white/5" : "border-gray-100"}`}><div className="flex items-center gap-3"><button type="button" onClick={() => changeDate(-1)} aria-label="Previous period" className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${isDark ? "border-white/10 bg-black text-white/60 hover:bg-white/5" : "border-black/20 bg-[#F0F0F0] text-black hover:bg-gray-200"}`}><ChevronLeft size={18} /></button><span className="min-w-[150px] text-center text-sm font-bold tracking-tight sm:text-base lg:text-lg">{headerLabel}</span><button type="button" onClick={() => changeDate(1)} aria-label="Next period" className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${isDark ? "border-white/10 bg-black text-white/60 hover:bg-white/5" : "border-black/20 bg-[#F0F0F0] text-black hover:bg-gray-200"}`}><ChevronRight size={18} /></button></div><div className="flex items-center gap-2"><button type="button" onClick={() => setFocusDate(today)} className={`rounded-lg border px-3 py-1.5 text-xs transition-colors sm:px-4 sm:text-sm ${isDark ? "border-white/10 text-white/60 hover:border-[#E5D5B8]/40 hover:text-white" : "border-[#E3E3E3] bg-[#F0F0F0] text-gray-600 hover:text-black"}`}>Today</button><div className={`flex overflow-hidden rounded-lg border ${isDark ? "border-white/10 bg-black" : "border-[#E3E3E3] bg-[#F0F0F0]"}`}><button type="button" onClick={() => setView("month")} className={buttonClass(view === "month")}>Month</button><button type="button" onClick={() => setView("week")} className={buttonClass(view === "week")}>Week</button><button type="button" onClick={() => setView("day")} className={buttonClass(view === "day")}>Day</button></div></div></div>
    <div className="relative">{isLoading && <div className={`absolute inset-0 z-10 flex min-h-48 items-center justify-center ${isDark ? "bg-[#101010]/75" : "bg-white/75"}`}><Loader2 className="animate-spin text-[#BFA780]" size={28} /></div>}{view === "month" ? renderMonth() : renderSchedule(view === "day")}</div>
  </div>
  {selectedDate && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-label="Shoot details">
    <div className={`w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl ${isDark ? "border-[#333] bg-[#171717] text-white" : "border-[#E5E5E5] bg-white text-black"}`}>
      <div className={`flex items-start justify-between gap-4 border-b p-5 ${isDark ? "border-white/10" : "border-[#E5E5E5]"}`}><div><p className={`text-xs uppercase tracking-widest ${isDark ? "text-white/45" : "text-black/45"}`}>Shoots</p><h3 className="mt-1 text-lg font-semibold">{selectedDate.toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</h3></div><button type="button" onClick={() => setSelectedDate(null)} aria-label="Close shoot details" className={`rounded-lg p-2 transition-colors ${isDark ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-black/55 hover:bg-black/5 hover:text-black"}`}><X size={18} /></button></div>
      <div className="px-5 pb-2">{selectedDateShoots.length ? <div>{selectedDateShoots.map((shoot, index) => <div key={shoot.id} className={`py-4 ${index > 0 ? isDark ? "border-t border-white/10" : "border-t border-[#E5E5E5]" : ""}`}><p className="font-medium">{shoot.title}</p><p className={`mt-1 text-sm ${isDark ? "text-white/55" : "text-black/55"}`}>{formatTime(shoot.start_time)} – {formatTime(shoot.end_time)}{shoot.time_zone ? ` (${shoot.time_zone})` : ""}</p></div>)}</div> : <p className={`py-4 text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>No shoots scheduled for this date.</p>}</div>
    </div>
  </div>}
  </div>;
};
