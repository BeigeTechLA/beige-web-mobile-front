"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Camera,
  User,
  X,
} from "lucide-react";
import type { CpCalendarItem } from "@/lib/api/cpCompensation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CalendarView = "month" | "week" | "day";

type CpCompensationCalendarViewProps = {
  isDark: boolean;
  items: CpCalendarItem[];
  loading?: boolean;
  onItemClick?: (item: CpCalendarItem) => void;
  onRangeChange?: (range: { start: string; end: string; status?: string }) => void;
};

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const STATUS_OPTIONS = [
  "Pending",
  "Approval Pending",
  "Approved",
  "Partially Paid",
  "Rejected",
] as const;

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const isSameDay = (a: Date, b: Date) => dateKey(a) === dateKey(b);

const parseKey = (key: string) => new Date(`${key}T12:00:00`);


const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);


const getCalendarGridDates = (focusDate: Date) => {
  const first = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
};

const statusColors = (status: CpCalendarItem["status"], isDark: boolean) => {
  switch (status) {
    case "Approved":
      return isDark
        ? { text: "#53D18B", border: "#2D5E44", bg: "#13271D", dot: "#53D18B" }
        : { text: "#16824A", border: "#BFE5CF", bg: "#EAF8F0", dot: "#34B873" };
    case "Partially Paid":
      return isDark
        ? { text: "#78B9FF", border: "#355E84", bg: "#182532", dot: "#5BA8FF" }
        : { text: "#2F7BF1", border: "#B9D9FF", bg: "#EDF6FF", dot: "#5BA8FF" };
    case "Approval Pending":
      return isDark
        ? { text: "#F5C26B", border: "#7A6030", bg: "#2D2616", dot: "#F5C26B" }
        : { text: "#A86B00", border: "#F0D9A8", bg: "#FFF6E3", dot: "#F5A623" };
    case "Rejected":
      return isDark
        ? { text: "#FF9292", border: "#915B5B", bg: "#503733", dot: "#FF7B83" }
        : { text: "#D64545", border: "#F1BABA", bg: "#FFF0F0", dot: "#FF7B83" };
    default: // Pending
      return isDark
        ? { text: "#C4A6FF", border: "#5B4A86", bg: "#241D33", dot: "#A98BFF" }
        : { text: "#6D4BC7", border: "#D6C8F5", bg: "#F5F0FF", dot: "#8F6CF0" };
  }
};

const getDueMeta = (dueDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = parseKey(dueDate);
  due.setHours(0, 0, 0, 0);
  const days = Math.ceil((due.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { label: "Overdue", tone: "overdue" as const };
  if (days <= 3) return { label: "Due soon", tone: "soon" as const };
  return { label: "", tone: "none" as const };
};

export const CpCompensationCalendarView = ({
  isDark,
  items,
  loading = false,
  onItemClick,
  onRangeChange,
}: CpCompensationCalendarViewProps) => {
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState<CalendarView>("month");
  const [focusDate, setFocusDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  // "All" = no status sent to backend
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const itemsByDate = useMemo(
    () =>
      items.reduce<Record<string, CpCalendarItem[]>>((result, item) => {
        if (!item.dueDate) return result;
        (result[item.dueDate] ||= []).push(item);
        return result;
      }, {}),
    [items],
  );

  const weekStart = useMemo(() => {
    const date = new Date(focusDate);
    date.setDate(focusDate.getDate() - focusDate.getDay());
    return date;
  }, [focusDate]);

  const weekDates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + index);
        return date;
      }),
    [weekStart],
  );

  const rangeStart =
    view === "month"
      ? dateKey(getCalendarGridDates(focusDate)[0])
      : view === "week"
        ? dateKey(weekDates[0])
        : dateKey(focusDate);
  const rangeEnd =
    view === "month"
      ? dateKey(getCalendarGridDates(focusDate)[41])
      : view === "week"
        ? dateKey(weekDates[6])
        : dateKey(focusDate);

  useEffect(() => {
    onRangeChange?.({
      start: rangeStart,
      end: rangeEnd,
      status: statusFilter === "All" ? undefined : statusFilter,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeStart, rangeEnd, statusFilter]);

  const selectedItems = selectedDate
    ? itemsByDate[dateKey(selectedDate)] || []
    : [];

  const changeDate = (offset: number) => {
    const next = new Date(focusDate);
    if (view === "month") {
      next.setDate(1);
      next.setMonth(next.getMonth() + offset);
    }
    if (view === "week") next.setDate(next.getDate() + offset * 7);
    if (view === "day") next.setDate(next.getDate() + offset);
    setFocusDate(next);
  };

  const headerLabel = focusDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const border = isDark ? "border-[#333333]" : "border-[#E5E5E5]";

  /* ---------- Toolbar ---------- */
  const renderToolbar = () => (
    <div
      className={`flex flex-col items-stretch gap-3 border-b p-3 sm:min-h-[64px] sm:flex-row sm:items-center sm:justify-between md:px-4 sm:py-0 lg:p-6 ${border} ${isDark ? "bg-[#111111]" : "bg-white"}`}
    >
      <div className="flex flex-wrap min-w-0 items-center gap-3 sm:gap-5">
        <button
          type="button"
          onClick={() => setFocusDate(new Date())}
          className={`h-10 rounded-lg border px-4 text-sm font-medium transition-colors ${isDark ? "border-[#333333] bg-[#202020] text-white/80 hover:bg-[#2A2A2A]" : "border-[#E5E5E5] bg-white text-black/70 hover:bg-[#F7F7F7]"}`}
        >
          Today
        </button>
        <div className={`flex items-center gap-2 ${isDark ? "text-white/35" : "text-black/35"}`}>
          {[-1, 1].map((offset) => (
            <button
              key={offset}
              type="button"
              onClick={() => changeDate(offset)}
              aria-label={offset < 0 ? "Previous" : "Next"}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${isDark ? "border-[#333333] bg-[#202020] hover:text-white" : "border-[#E5E5E5] bg-white hover:text-black"}`}
            >
              {offset < 0 ? <ChevronLeft size={18} strokeWidth={1.7} /> : <ChevronRight size={18} strokeWidth={1.7} />}
            </button>
          ))}
        </div>
        <h2 className={`truncate text-sm font-semibold lg:text-base ${isDark ? "text-white" : "text-black"}`}>
          {headerLabel}
        </h2>
      </div>

      <div className="flex flex-wrap w-full items-center justify-end gap-3 sm:w-auto lg:gap-5">
        <div className="flex items-center gap-3 lg:gap-5">
          <div className={`hidden items-center gap-4 text-sm xl:flex ${isDark ? "text-white/65" : "text-black/60"}`}>
            {STATUS_OPTIONS.map((s) => (
              <span key={s} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColors(s, isDark).dot }} />
                {s}
              </span>
            ))}
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
            <SelectTrigger
              className={`h-10 w-[150px] rounded-full text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"}`}
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent
              className={isDark ? "bg-[#111111] border-[#3D3D3D]" : "text-black bg-white border-[#E3E3E3]"}
            >
              <SelectItem value="All">All Status</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className={`flex h-10 overflow-hidden rounded-lg border ${isDark ? "border-white/5 bg-[#202020]" : "border-[#E5E5E5] bg-[#FAFAFA]"}`}>
          {(["month", "week", "day"] as CalendarView[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setView(item)}
              className={`min-w-[62px] px-3 text-xs capitalize transition-colors ${view === item
                  ? "bg-[#E5D5B8] text-black"
                  : isDark
                    ? "text-white/40 hover:text-white"
                    : "text-[#666] hover:text-black"
                }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  /* ---------- Status filter ---------- */
  const renderStatusFilter = () => (
    <div
      className={`flex flex-wrap items-center gap-2 border-b px-3 py-3 sm:px-4 lg:px-6 ${border} ${isDark ? "bg-[#111111]" : "bg-white"}`}
    >
      <span className={`mr-1 text-xs font-medium ${isDark ? "text-white/50" : "text-black/50"}`}>
        Status:
      </span>

      <button
        type="button"
        onClick={() => setStatusFilter([])}
        aria-pressed={statusFilter.length === 0}
        className={`h-8 rounded-full border px-3 text-xs font-medium transition-colors ${statusFilter.length === 0
            ? "border-[#E5D5B8] bg-[#E5D5B8] text-black"
            : isDark
              ? "border-[#333333] bg-[#202020] text-white/60 hover:text-white"
              : "border-[#E5E5E5] bg-white text-black/60 hover:text-black"
          }`}
      >
        All ({items.length})
      </button>

      {STATUS_OPTIONS.map((status) => {
        const colors = statusColors(status, isDark);
        const active = statusFilter.includes(status);
        return (
          <button
            key={status}
            type="button"
            onClick={() => toggleStatus(status)}
            aria-pressed={active}
            className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-medium transition-colors ${active
                ? ""
                : isDark
                  ? "border-[#333333] bg-[#202020] text-white/60 hover:text-white"
                  : "border-[#E5E5E5] bg-white text-black/60 hover:text-black"
              }`}
            style={
              active
                ? { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }
                : undefined
            }
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.dot }} />
            {status}
            <span className="opacity-60">{statusCounts[status] || 0}</span>
          </button>
        );
      })}

      {statusFilter.length > 0 && (
        <button
          type="button"
          onClick={() => setStatusFilter([])}
          className={`ml-1 text-xs underline-offset-2 hover:underline ${isDark ? "text-white/50" : "text-black/50"}`}
        >
          Clear
        </button>
      )}
    </div>
  );

  /* ---------- Shared item card ---------- */
  const renderItemCard = (item: CpCalendarItem, compact = false) => {
    const colors = statusColors(item.status, isDark);
    const due = getDueMeta(item.dueDate);
    return (
      <button
        type="button"
        key={item.id}
        onClick={(e) => {
          e.stopPropagation();
          onItemClick?.(item);
        }}
        className="w-full rounded-lg border p-3 text-left transition-opacity hover:opacity-90"
        style={{ borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }}
      >
        <div className="flex items-start justify-between gap-2">
          <p className={`truncate font-semibold ${compact ? "text-[11px]" : "text-[13px]"}`}>
            {item.creatorName}
          </p>
          <span className={`shrink-0 font-bold ${compact ? "text-[11px]" : "text-[13px]"}`}>
            {formatCurrency(item.amount)}
          </span>
        </div>
        <p className={`mt-1 truncate opacity-75 ${compact ? "text-[10px]" : "text-[12px]"}`}>
          {item.shootName}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ border: `1px solid ${colors.border}` }}>
            {item.status}
          </span>
          {due.label && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${due.tone === "overdue" ? "text-red-400" : "text-amber-400"}`}>
              <AlertTriangle className="h-3 w-3" />
              {due.label}
            </span>
          )}
        </div>
      </button>
    );
  };

  /* ---------- Month ---------- */
  const renderMonth = () => {
    const gridDates = getCalendarGridDates(focusDate);
    return (
      <div className="overflow-x-auto">
        <div className="min-w-[700px] sm:min-w-[920px]">
          <div className={`grid grid-cols-7 border-b ${border} ${isDark ? "bg-[#171717]" : "bg-[#FAFAFA]"}`}>
            {WEEKDAYS.map((day) => (
              <div key={day} className={`flex h-10 items-center justify-center text-xs font-medium tracking-[0.08em] ${isDark ? "text-white/50" : "text-black/45"}`}>
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {gridDates.map((date, index) => {
              const dayItems = itemsByDate[dateKey(date)] || [];
              const isCurrentMonth = date.getMonth() === focusDate.getMonth();
              const todayCell = isSameDay(date, today);
              const dayTotal = dayItems.reduce((sum, i) => sum + i.amount, 0);
              return (
                <button
                  type="button"
                  key={dateKey(date)}
                  onClick={() => setSelectedDate(date)}
                  className={`relative h-[145px] border-b border-r p-[7px] text-left transition-colors ${border} ${isDark ? "hover:bg-white/[0.015]" : "bg-white hover:bg-[#FAFAFA]"} ${index % 7 === 6 ? "border-r-0" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-1 text-xs font-bold ${isDark ? "text-[#E8D1AB]" : "text-[#6F542B]"
                      }`}>
                      {dayItems.length > 0 ? formatCurrency(dayTotal) : ""}
                    </span>
                    <span
                      className={`flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-[14px] ${todayCell
                          ? "bg-[#E8D1AB] font-semibold text-black"
                          : isCurrentMonth
                            ? isDark ? "text-[#F2F2F2]" : "text-[#323232]"
                            : isDark ? "text-[#505050]" : "text-[#B8B8B8]"
                        }`}
                    >
                      {date.getDate()}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {dayItems.slice(0, 3).map((item) => {
                      const colors = statusColors(item.status, isDark);
                      return (
                        <div
                          key={item.id}
                          className="flex h-[22px] min-w-0 items-center justify-between gap-1 rounded-[4px] border px-2 text-[10px] leading-none"
                          style={{ borderColor: colors.border, color: colors.text, backgroundColor: colors.bg }}
                        >
                          <span className="truncate">{item.creatorName}</span>
                          <span className="shrink-0 font-semibold">{formatCurrency(item.amount)}</span>
                        </div>
                      );
                    })}
                    {dayItems.length > 3 && (
                      <p className="px-1 text-[10px] text-[#777]">+{dayItems.length - 3} more</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  /* ---------- Week ---------- */
  const renderWeek = () => (
    <div className="overflow-x-auto">
      <div className="grid min-w-[840px] grid-cols-7 sm:min-w-[980px]">
        {weekDates.map((date, index) => {
          const dayItems = itemsByDate[dateKey(date)] || [];
          const todayCell = isSameDay(date, today);
          return (
            <div
              key={dateKey(date)}
              className={`min-h-[420px] border-r ${border} ${index === 6 ? "border-r-0" : ""}`}
            >
              <button
                type="button"
                onClick={() => setSelectedDate(date)}
                className={`flex h-[71px] w-full flex-col items-center border-b ${border} ${isDark ? "hover:bg-white/[0.02]" : "bg-white hover:bg-[#FAFAFA]"}`}
              >
                <p className="mt-2 text-[12px] tracking-[0.08em] text-[#838383]">{WEEKDAYS[date.getDay()]}</p>
                <span
                  className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full text-[14px] font-semibold ${todayCell ? "bg-[#E8D1AB] text-black" : isDark ? "text-[#A6A6A6]" : "text-[#323232]"
                    }`}
                >
                  {date.getDate()}
                </span>
              </button>
              <div className="space-y-2 p-2">
                {dayItems.map((item) => renderItemCard(item, true))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ---------- Day ---------- */
  const renderDay = () => {
    const dayItems = itemsByDate[dateKey(focusDate)] || [];
    const total = dayItems.reduce((sum, i) => sum + i.amount, 0);
    return (
      <div>
        <div className={`flex min-h-[81px] items-center border-b px-3 py-4 sm:px-8 ${border} ${isDark ? "bg-[#111111]" : "bg-white"}`}>
          <div className="mr-4 flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full bg-[#E8D1AB] text-black">
            <span className="text-[9px] font-semibold uppercase leading-none">
              {focusDate.toLocaleDateString("default", { weekday: "short" })}
            </span>
            <span className="mt-[2px] text-[18px] font-bold leading-none">{focusDate.getDate()}</span>
          </div>
          <div>
            <p className={`text-[15px] font-semibold ${isDark ? "text-[#EAEAEA]" : "text-[#323232]"}`}>
              {focusDate.toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <p className="mt-1 text-[12px] text-[#777777]">
              {dayItems.length} {dayItems.length === 1 ? "compensation" : "compensations"} due · {formatCurrency(total)}
            </p>
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:p-6">
          {dayItems.length ? (
            dayItems.map((item) => renderItemCard(item))
          ) : (
            <p className={`col-span-full py-12 text-center text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>
              No compensation due on this day.
            </p>
          )}
        </div>
      </div>
    );
  };

  /* ---------- Drawer ---------- */
  const renderDrawer = () => {
    if (!selectedDate) return null;
    const total = selectedItems.reduce((sum, i) => sum + i.amount, 0);
    return (
      <div
        className={`fixed inset-0 z-[120] backdrop-blur-[2px] ${isDark ? "bg-black/60" : "bg-black/35"}`}
        onClick={() => setSelectedDate(null)}
      >
        <aside
          className={`absolute right-0 top-0 flex h-full w-full max-w-[560px] flex-col border-l shadow-[-18px_0_55px_rgba(0,0,0,0.38)] ${isDark ? "border-[#333333] bg-[#0E0E0E]" : "border-[#E5E5E5] bg-[#F9F9F9]"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`flex min-h-[108px] items-center justify-between border-b px-5 py-5 sm:px-7 ${isDark ? "border-[#303030] bg-[#111111]" : "border-[#E5E5E5] bg-white"}`}>
            <div className="min-w-0 pr-4">
              <p className={`mb-1 text-[11px] font-medium uppercase tracking-[0.12em] ${isDark ? "text-white/35" : "text-black/35"}`}>
                Compensation Due
              </p>
              <h2 className={`truncate text-xl font-semibold sm:text-2xl ${isDark ? "text-white" : "text-black"}`}>
                {selectedDate.toLocaleDateString("default", { month: "long", day: "numeric", year: "numeric" })}
              </h2>
              <p className={`mt-1 text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>
                {selectedItems.length} {selectedItems.length === 1 ? "payout" : "payouts"} · {formatCurrency(total)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              aria-label="Close"
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors ${isDark ? "border-[#343434] bg-[#202020] text-white/70 hover:bg-[#2A2A2A] hover:text-white" : "border-[#E5E5E5] bg-[#F4F4F4] text-black/55 hover:bg-[#EBEBEB] hover:text-black"}`}
            >
              <X size={21} />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
            {selectedItems.length ? (
              selectedItems.map((item) => {
                const colors = statusColors(item.status, isDark);
                const due = getDueMeta(item.dueDate);
                return (
                  <article
                    key={item.id}
                    className={`overflow-hidden rounded-2xl border ${isDark ? "border-[#333333] bg-[#141414]" : "border-[#E5E5E5] bg-white"}`}
                  >
                    <div className="p-5">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-md px-2.5 py-1 text-[10px] font-semibold"
                          style={{ color: colors.text, backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}
                        >
                          {item.status}
                        </span>
                        {due.label && (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${due.tone === "overdue" ? "text-red-400" : "text-amber-400"}`}>
                            <AlertTriangle className="h-3 w-3" />
                            {due.label}
                          </span>
                        )}
                        {item.isDefaultDueDate && (
                          <span className={`text-[10px] ${isDark ? "text-white/35" : "text-black/35"}`}>
                            Default due date
                          </span>
                        )}
                      </div>
                      <div className="flex items-start justify-between gap-2 sm:gap-4">
                        <h3 className={`truncate text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>
                          {item.creatorName}
                        </h3>
                        <p className={`shrink-0 text-lg font-bold ${isDark ? "text-white" : "text-black"}`}>
                          {formatCurrency(item.amount)}
                        </p>
                      </div>

                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between gap-3">
                          <span className={isDark ? "text-white/60" : "text-black/60"}>
                            Total Amount
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>

                        <div className="flex justify-between gap-3">
                          <span className={isDark ? "text-white/60" : "text-black/60"}>
                            Paid Amount
                          </span>
                          <span className="font-semibold text-emerald-500">
                            {formatCurrency(item.paidAmount)}
                          </span>
                        </div>

                        <div className="flex justify-between gap-3">
                          <span className={isDark ? "text-white/60" : "text-black/60"}>
                            Remaining Amount
                          </span>
                          <span className="font-semibold text-amber-500">
                            {formatCurrency(item.remainingAmount)}
                          </span>
                        </div>
                      </div>
                      <div className={`mt-4 grid gap-3 text-xs ${isDark ? "text-white/50" : "text-black/50"}`}>
                        {item.creatorRoles.length > 0 && (
                          <div className="flex items-center gap-2.5">
                            <User size={15} className="shrink-0" />
                            <span className="truncate capitalize">{item.creatorRoles.join(", ")}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2.5">
                          <Camera size={15} className="shrink-0" />
                          <span className="truncate">{item.shootName}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <CalendarDays size={15} className="shrink-0" />
                          <span>
                            Due{" "}
                            {parseKey(item.dueDate).toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`flex min-h-[68px] items-center justify-end px-5 py-3 ${isDark ? "bg-[#121212]" : "bg-[#FCFCFC]"}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate(null);
                          onItemClick?.(item);
                        }}
                        className="rounded-lg bg-[#E8D1AB] px-5 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-[#DCC49C]"
                      >
                        View Details
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className={`rounded-2xl border px-5 py-12 text-center ${isDark ? "border-[#303030] bg-[#141414]" : "border-[#E5E5E5] bg-white"}`}>
                <CalendarDays size={30} className={`mx-auto mb-3 ${isDark ? "text-white/20" : "text-black/20"}`} />
                <p className={`text-sm font-medium ${isDark ? "text-white/55" : "text-black/55"}`}>
                  No compensation due
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    );
  };

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border transition-colors duration-300 ${isDark ? "border-[#333333] bg-[#111111] text-white" : "border-[#E5E5E5] bg-white text-[#171717]"}`}
    >
      {renderToolbar()}
      <div className="relative min-h-[500px]">
        {loading && (
          <div className={`absolute inset-0 z-30 flex items-center justify-center ${isDark ? "bg-[#111111]/75" : "bg-white/75"}`}>
            <Loader2 className="animate-spin text-[#E8D1AB]" size={28} />
          </div>
        )}
        {view === "month" && renderMonth()}
        {view === "week" && renderWeek()}
        {view === "day" && renderDay()}
      </div>
      {renderDrawer()}
    </div>
  );
};

export default CpCompensationCalendarView;