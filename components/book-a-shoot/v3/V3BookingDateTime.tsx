"use client";

import React, { useMemo, useState } from "react";
import { Calendar, Check, ChevronDown, ChevronUp } from "lucide-react";
import { eachDayOfInterval, endOfMonth, format, isSameDay, startOfDay, startOfMonth } from "date-fns";
import DatePicker from "@/components/ui/Datepicker";
import DropdownSelect from "@/components/book-a-shoot/DropdownSelect";
import type { BookingDataV3 } from "./types";

interface Props {
  data: BookingDataV3;
  updateData: (data: Partial<BookingDataV3>) => void;
}

const parseDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const timeOptions = Array.from({ length: 24 * 4 }, (_, index) => {
  const hour = Math.floor(index / 4);
  const minute = (index % 4) * 15;
  return {
    key: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    value: format(new Date(2026, 0, 1, hour, minute), "h:mm aa"),
  };
});

export function V3BookingDateTime({ data, updateData }: Props) {
  const [updateTime, setUpdateTime] = useState(true);
  const [bookingType, setBookingType] = useState<"single_day" | "multi_day">(data.bookingType || "single_day");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [sameTimings, setSameTimings] = useState(true);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const selectedDates = useMemo(
    () => (data.bookingDays || []).map((day) => parseDate(day.date)).filter((date): date is Date => Boolean(date)),
    [data.bookingDays],
  );
  const reelDays = useMemo(() => {
    const today = startOfDay(new Date());
    const monthStart = startOfMonth(calendarMonth);
    const start = today > monthStart ? today : monthStart;
    return eachDayOfInterval({ start, end: endOfMonth(calendarMonth) });
  }, [calendarMonth]);

  const startDate = parseDate(data.startDate);
  const endDate = parseDate(data.endDate);
  const startTime = startDate ? format(startDate, "HH:mm") : "09:00";
  const endTime = endDate ? format(endDate, "HH:mm") : "17:00";

  const updateSingleDate = (date: Date | null) => {
    if (!date) return;
    const nextStart = new Date(date);
    const nextEnd = new Date(date);
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    nextStart.setHours(startHour, startMinute, 0, 0);
    nextEnd.setHours(endHour, endMinute, 0, 0);
    updateData({ startDate: nextStart.toISOString(), endDate: nextEnd.toISOString() });
  };

  const updateSingleTime = (field: "startDate" | "endDate", value: string) => {
    const base = parseDate(data[field]) || startDate || new Date();
    const [hours, minutes] = value.split(":").map(Number);
    base.setHours(hours, minutes, 0, 0);
    updateData({ [field]: base.toISOString() });
  };

  const toggleDate = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const days = data.bookingDays || [];
    const exists = days.some((day) => day.date === dateKey);
    const next = exists
      ? days.filter((day) => day.date !== dateKey)
      : [...days, { date: dateKey, startTime: startTime || "09:00", endTime: endTime || "17:00" }]
          .sort((a, b) => a.date.localeCompare(b.date));
    updateData({ bookingType: "multi_day", bookingDays: next });
  };

  const updateDay = (index: number, field: "startTime" | "endTime", value: string) => {
    const days = [...(data.bookingDays || [])];
    days[index] = { ...days[index], [field]: value };
    updateData({ bookingType: "multi_day", bookingDays: days });
  };

  const updateAllDays = (field: "startTime" | "endTime", value: string) => {
    updateData({
      bookingType: "multi_day",
      bookingDays: (data.bookingDays || []).map((day) => ({ ...day, [field]: value })),
    });
  };

  const commonStart = data.bookingDays?.[0]?.startTime || "09:00";
  const commonEnd = data.bookingDays?.[0]?.endTime || "17:00";

  return (
    <div>
      <h3 className="mb-4 text-sm font-medium text-white">Do you want to update your booking day and time?</h3>
      <div className="mb-6 flex gap-4">
        {[{ label: "Yes", value: true }, { label: "Keep it same", value: false }].map((option) => (
          <button key={option.label} type="button" onClick={() => setUpdateTime(option.value)}
            className={`flex h-14 items-center gap-6 rounded-2xl border px-6 text-sm ${updateTime === option.value ? "border-[#E8D1AB] bg-[#E8D1AB] text-black" : "border-white/10 bg-[#101010] text-white/60"}`}>
            {option.label}
            <span className={`grid h-5 w-5 place-items-center rounded-full ${updateTime === option.value ? "bg-black" : "border border-white/30"}`}>
              {updateTime === option.value && <span className="h-2 w-2 rounded-full bg-[#E8D1AB]" />}
            </span>
          </button>
        ))}
      </div>

      {updateTime && <div className="space-y-3">
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <button type="button" onClick={() => { setBookingType("single_day"); updateData({ bookingType: "single_day", bookingDays: [] }); }}
            className="flex w-full items-center justify-between bg-[#101010] px-5 py-4 text-sm font-medium text-white">
            Single Day {bookingType === "single_day" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {bookingType === "single_day" && <div className="grid grid-cols-1 gap-4 border-t border-white/10 bg-[#0D0D0D] p-5 md:grid-cols-3">
            <DatePicker
              label="Select Date"
              selectedDate={startDate}
              onChange={updateSingleDate}
              minDate={new Date()}
              sx={{ height: { xs: "56px", lg: "82px" }, borderRadius: "16px" }}
            />
            <DropdownSelect
              title="Start Time"
              options={timeOptions}
              value={startTime}
              onChange={(value) => updateSingleTime("startDate", value)}
              bgColour="bg-[#101010]"
              selectedDisplay="plain"
            />
            <DropdownSelect
              title="End Time"
              options={timeOptions}
              value={endTime}
              onChange={(value) => updateSingleTime("endDate", value)}
              bgColour="bg-[#101010]"
              selectedDisplay="plain"
            />
          </div>}
        </div>

        <div className="overflow-visible rounded-2xl border border-white/10">
          <button type="button" onClick={() => { setBookingType("multi_day"); updateData({ bookingType: "multi_day" }); }}
            className="flex w-full items-center justify-between rounded-2xl bg-[#101010] px-5 py-4 text-sm font-medium text-white">
            Multiple Days {bookingType === "multi_day" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {bookingType === "multi_day" && <div className="border-t border-white/10 bg-[#0D0D0D] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs text-white/50">Select Date</span>
              <label className="relative flex items-center gap-2 text-sm font-semibold text-white">
                {format(calendarMonth, "MMMM yyyy")} <Calendar size={16} />
                <input type="month" value={format(calendarMonth, "yyyy-MM")} min={format(new Date(), "yyyy-MM")}
                  onChange={(event) => { const [year, month] = event.target.value.split("-").map(Number); if (year && month) setCalendarMonth(new Date(year, month - 1, 1)); }}
                  className="absolute h-px w-px opacity-0" />
              </label>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
              {reelDays.map((date) => {
                const selected = selectedDates.some((item) => isSameDay(item, date));
                return <button key={date.toISOString()} type="button" onClick={() => toggleDate(date)}
                  className={`flex h-[60px] w-[60px] shrink-0 flex-col items-center justify-center rounded-full border lg:h-[100px] lg:w-[100px] ${selected ? "border-[#E8D1AB] bg-[#E8D1AB] text-black" : "border-white/10 text-white/45"}`}>
                  <span className="text-2xl font-bold">{format(date, "d")}</span><span className="text-xs uppercase">{format(date, "EEE")}</span>
                </button>;
              })}
            </div>
            <div className="my-4 flex gap-3">
              <span className="rounded-lg bg-[#211F1C] px-4 py-2 text-xs text-[#E8D1AB]">Total Days: {selectedDates.length}</span>
              <span className="rounded-lg bg-[#211F1C] px-4 py-2 text-xs text-[#E8D1AB]">Selected Days: {selectedDates.length ? selectedDates.map((date) => format(date, "dd MMM")).join(", ") : "None"}</span>
            </div>
            {selectedDates.length > 0 && <div className="border-t border-white/10 pt-6">
              <h4 className="mb-4 text-sm font-medium text-white">Are timings same for all selected dates?</h4>
              <div className="mb-5 flex gap-3">
                {[{ label: "Yes", value: true }, { label: "No", value: false }].map((option) => (
                  <button key={option.label} type="button" onClick={() => setSameTimings(option.value)}
                    className={`flex h-12 items-center gap-6 rounded-2xl border px-6 text-sm ${sameTimings === option.value ? "border-[#E8D1AB] bg-[#E8D1AB] text-black" : "border-white/10 text-white/60"}`}>
                    {option.label}<span className={`h-5 w-5 rounded-full ${sameTimings === option.value ? "border-[7px] border-black" : "border border-white/30"}`} />
                  </button>
                ))}
              </div>
              {sameTimings ? <div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <DropdownSelect title="Start Time" options={timeOptions} value={commonStart} onChange={(value) => updateAllDays("startTime", value)} bgColour="bg-[#101010]" selectedDisplay="plain" />
                  <DropdownSelect title="End Time" options={timeOptions} value={commonEnd} onChange={(value) => updateAllDays("endTime", value)} bgColour="bg-[#101010]" selectedDisplay="plain" />
                </div>
                <p className="mt-3 flex items-center gap-2 text-sm text-white/60"><Check size={18} /> Applied to {selectedDates.length} selected dates</p>
              </div> : <div className="space-y-3">
                {(data.bookingDays || []).map((day, index) => <div key={day.date} className="rounded-2xl border border-white/10 bg-[#171717]">
                  <button type="button" onClick={() => setExpandedDate(expandedDate === day.date ? null : day.date)} className="flex w-full items-center justify-between px-5 py-4 text-sm text-white">
                    {format(parseDate(day.date) || new Date(), "MMMM dd, yyyy")}<ChevronDown size={16} className={expandedDate === day.date ? "rotate-180" : ""} />
                  </button>
                  {expandedDate === day.date && <div className="grid grid-cols-1 gap-4 border-t border-white/10 bg-[#101010] p-4 md:grid-cols-2">
                    <DropdownSelect title="Start Time" options={timeOptions} value={day.startTime || "09:00"} onChange={(value) => updateDay(index, "startTime", value)} bgColour="bg-[#101010]" selectedDisplay="plain" />
                    <DropdownSelect title="End Time" options={timeOptions} value={day.endTime || "17:00"} onChange={(value) => updateDay(index, "endTime", value)} bgColour="bg-[#101010]" selectedDisplay="plain" />
                  </div>}
                </div>)}
              </div>}
            </div>}
          </div>}
        </div>
      </div>}
    </div>
  );
}
