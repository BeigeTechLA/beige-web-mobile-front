"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  MapPin,
  Video,
  X,
} from "lucide-react";
import { adminApi } from "@/lib/api";

type ShootCalendarViewProps = {
  isDark: boolean;
  initialOpenDate?: Date | null;
  onInitialOpenDateHandled?: () => void;
  searchQuery?: string;
  categoryFilter?: string;
  statusFilter?: string;
  paymentFilter?: "all" | "pending" | "paid";
  productionFilter?: string;
  cpAssignmentFilter?: "all" | "assigned" | "not_assigned";
};
type CalendarView = "month" | "week" | "day";
type CalendarFilter = "all" | "shoots" | "meetings" | "deleted";
type CalendarItemKind = "shoot" | "meeting" | "deleted";

type CalendarShoot = {
  id: number | string;
  title: string;
  date: string;
  start_time?: string | null;
  end_time?: string | null;
  time_zone?: string | null;
  type?: string | null;
  event_type?: string | null;
  status?: string | null;
  is_deleted?: boolean | number | null;
  deleted_at?: string | null;
  location?: string | null;
  event_location?: string | { address?: string } | null;
  venue?: string | null;
  client_name?: string | null;
  company_name?: string | null;
  updated_at?: string | null;
  streaming_platforms?: string[] | null;
  equipment?: string[] | null;
  [key: string]: unknown;
};

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const WEEK_START_HOUR = 0;
const WEEK_END_HOUR = 24;
const DAY_START_HOUR = 0;
const DAY_END_HOUR = 24;
const HOUR_HEIGHT = 60;

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const apiDateKey = (value: string) => String(value || "").slice(0, 10);
const formatShootTitle = (title: string) =>
  String(title || "Untitled Shoot").replace(/^CUSTOM Shoot\b/i, "CUSTOM");
const isSameDay = (first: Date, second: Date) =>
  dateKey(first) === dateKey(second);

const parseTimeToMinutes = (value?: string | null) => {
  if (!value) return null;

  const raw = String(value).trim();

  const twelveHourMatch = raw.match(
    /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i,
  );
  if (twelveHourMatch) {
    let hour = Number(twelveHourMatch[1]);
    const minute = Number(twelveHourMatch[2]);
    const meridiem = twelveHourMatch[3].toUpperCase();

    if (
      !Number.isFinite(hour) ||
      !Number.isFinite(minute) ||
      hour < 1 ||
      hour > 12 ||
      minute < 0 ||
      minute > 59
    ) {
      return null;
    }

    if (hour === 12) hour = 0;
    if (meridiem === "PM") hour += 12;
    return hour * 60 + minute;
  }

  const isoTimeMatch = raw.match(/(?:T|\s)(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (isoTimeMatch) {
    const hour = Number(isoTimeMatch[1]);
    const minute = Number(isoTimeMatch[2]);
    if (
      Number.isFinite(hour) &&
      Number.isFinite(minute) &&
      hour >= 0 &&
      hour <= 23 &&
      minute >= 0 &&
      minute <= 59
    ) {
      return hour * 60 + minute;
    }
  }

  const twentyFourHourMatch = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (twentyFourHourMatch) {
    const hour = Number(twentyFourHourMatch[1]);
    const minute = Number(twentyFourHourMatch[2]);
    if (
      Number.isFinite(hour) &&
      Number.isFinite(minute) &&
      hour >= 0 &&
      hour <= 23 &&
      minute >= 0 &&
      minute <= 59
    ) {
      return hour * 60 + minute;
    }
  }

  return null;
};

const formatTime = (value?: string | null) => {
  const minutes = parseTimeToMinutes(value);
  if (minutes === null) return "Time TBD";
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
};

const compactTime = (value?: string | null) => {
  const minutes = parseTimeToMinutes(value);
  if (minutes === null) return "TBD";
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
};

const timelineHourLabel = (hour: number) =>
  `${hour % 12 || 12}${hour >= 12 ? "pm" : "am"}`;

const getItemKind = (item: CalendarShoot): CalendarItemKind => {
  const type = String(item.type || item.event_type || "").toLowerCase();
  const status = String(item.status || "").toLowerCase();

  if (
    item.is_deleted === true ||
    item.is_deleted === 1 ||
    Boolean(item.deleted_at) ||
    type.includes("deleted") ||
    status.includes("deleted") ||
    status.includes("cancelled")
  ) {
    return "deleted";
  }

  if (type.includes("meeting") || status.includes("meeting")) return "meeting";
  return "shoot";
};

const itemColors = (kind: CalendarItemKind) => {
  if (kind === "meeting") {
    return {
      text: "#5BA8FF",
      border: "#355E84",
      bg: "#182532",
      dot: "#5BA8FF",
      badge: "#2E79E8",
    };
  }

  if (kind === "deleted") {
    return {
      text: "#FF7D7D",
      border: "#915B5B",
      bg: "#503733",
      dot: "#FF7B83",
      badge: "#EE555B",
    };
  }

  return {
    text: "#E8D1AB",
    border: "#716550",
    bg: "#2D2A25",
    dot: "#DDBE7A",
    badge: "#12B76A",
  };
};

const getLocation = (item: CalendarShoot) => {
  if (typeof item.event_location === "string") return item.event_location;
  if (item.event_location && typeof item.event_location === "object") {
    return String(item.event_location.address || "");
  }
  return String(item.location || item.venue || "");
};

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

const isoDatePart = (value?: string | null) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const isoTimePart = (value?: string | null) => {
  if (!value) return null;
  const match = String(value).match(/T(\d{2}:\d{2}:\d{2})/);
  return match?.[1] || null;
};

const normalizeCalendarResponse = (response: any): CalendarShoot[] => {
  const payload = response?.success !== undefined ? response : response?.data;
  if (!payload?.success || !payload?.data) return [];

  const data = payload.data;

  const activeShoots: CalendarShoot[] = Array.isArray(data.active_shoots)
    ? data.active_shoots.map((shoot: any) => ({
        ...shoot,
        id: shoot.id,
        title: formatShootTitle(shoot.title),
        date: apiDateKey(shoot.date),
        type: shoot.type || "shoot",
        event_type: shoot.event_type || "shoot",
        is_deleted: false,
      }))
    : [];

  const deletedShoots: CalendarShoot[] = Array.isArray(data.deleted_shoots)
    ? data.deleted_shoots.map((shoot: any) => ({
        ...shoot,
        id: `deleted-${shoot.id}`,
        original_id: shoot.id,
        title: formatShootTitle(shoot.title),
        date: apiDateKey(shoot.date),
        type: "deleted",
        event_type: "deleted_shoot",
        status: shoot.status || "deleted",
        is_deleted: true,
      }))
    : [];

  const meetings: CalendarShoot[] = Array.isArray(data.meetings)
    ? data.meetings.map((meeting: any) => ({
        ...meeting,
        id: `meeting-${meeting.id}`,
        original_id: meeting.id,
        title: meeting.title || "Untitled Meeting",
        date: isoDatePart(meeting.meeting_date_time),
        start_time: isoTimePart(meeting.meeting_date_time),
        end_time: isoTimePart(meeting.meeting_end_time),
        time_zone: meeting.meeting_timezone || null,
        type: "meeting",
        event_type: "meeting",
        status: meeting.meeting_status || "meeting",
        location: meeting.meet_link || null,
      }))
    : [];

  if (activeShoots.length || deletedShoots.length || meetings.length) {
    return [...activeShoots, ...deletedShoots, ...meetings];
  }

  if (Array.isArray(data.shoots)) {
    return data.shoots.map((shoot: CalendarShoot) => ({
      ...shoot,
      title: formatShootTitle(shoot.title),
      date: apiDateKey(shoot.date),
    }));
  }

  return [];
};

export const ShootsCalendarView = ({
  isDark,
  initialOpenDate = null,
  onInitialOpenDateHandled,
  searchQuery = "",
  categoryFilter = "all",
  statusFilter = "all",
  paymentFilter = "all",
  productionFilter = "all",
  cpAssignmentFilter = "all",
}: ShootCalendarViewProps) => {
  const router = useRouter();
  const today = new Date();
  const [view, setView] = useState<CalendarView>("month");
  const [focusDate, setFocusDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [shoots, setShoots] = useState<CalendarShoot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drawerFilter, setDrawerFilter] = useState<CalendarFilter>("all");

  useEffect(() => {
    if (!initialOpenDate) return;

    const targetDate = new Date(initialOpenDate);
    if (Number.isNaN(targetDate.getTime())) {
      onInitialOpenDateHandled?.();
      return;
    }

    targetDate.setHours(0, 0, 0, 0);
    setFocusDate(targetDate);
    setView("day");
    setSelectedDate(null);
    setDrawerFilter("all");
    onInitialOpenDateHandled?.();
  }, [initialOpenDate, onInitialOpenDateHandled]);

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

  useEffect(() => {
    let cancelled = false;

    const loadShoots = async () => {
      try {
        setIsLoading(true);
        const response =
          view === "month"
            ? await adminApi.getShootCalendarMonth({
                month: focusDate.getMonth() + 1,
                year: focusDate.getFullYear(),
              })
            : view === "week"
              ? await adminApi.getShootCalendarWeek({
                  start_date: dateKey(weekStart),
                })
              : await adminApi.getShootCalendarDay({
                  date: dateKey(focusDate),
                });

        if (!cancelled) {
          setShoots(normalizeCalendarResponse(response));
        }
      } catch (error) {
        console.error("Failed to load shoot calendar:", error);
        if (!cancelled) setShoots([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadShoots();
    return () => {
      cancelled = true;
    };
  }, [view, focusDate, weekStart]);

  const filteredShoots = useMemo(() => {
    const normalize = (value: unknown) =>
      String(value ?? "")
        .toLowerCase()
        .replace(/[\s_-]+/g, "")
        .trim();

    const hasValue = (value: unknown) => {
      if (Array.isArray(value)) return value.length > 0;
      return (
        value !== undefined && value !== null && String(value).trim() !== ""
      );
    };

    const search = searchQuery.trim().toLowerCase();

    return shoots.filter((shoot) => {
      const kind = getItemKind(shoot);

      if (search) {
        const searchableText = [
          shoot.title,
          shoot.client_name,
          shoot.company_name,
          shoot.status,
          shoot.type,
          shoot.event_type,
          shoot.location,
          shoot.venue,
          typeof shoot.event_location === "string"
            ? shoot.event_location
            : shoot.event_location?.address,
          shoot.email,
          shoot.guest_email,
          shoot.phone,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(search)) return false;
      }

      if (categoryFilter !== "all") {
        // The calendar API mainly returns title/date/time. Include title so filters
        // such as Corporate/Wedding still work with the calendar response.
        const categorySource = [
          shoot.category,
          shoot.event_type,
          shoot.shoot_type,
          shoot.content_type,
          shoot.event_type_labels,
          shoot.title,
        ]
          .filter(Boolean)
          .map(normalize);

        // Only enforce the category filter when we have something meaningful
        // to evaluate. The title from the calendar API normally provides this.
        if (
          categorySource.length > 0 &&
          !categorySource.some((value) =>
            value.includes(normalize(categoryFilter)),
          )
        ) {
          return false;
        }
      }

      if (statusFilter !== "all") {
        const normalizedStatusFilter = normalize(statusFilter);

        // Deleted/cancelled can be resolved from the calendar response itself.
        if (normalizedStatusFilter === "deleted") {
          if (kind !== "deleted") return false;
        } else if (normalizedStatusFilter === "cancelled") {
          if (kind !== "deleted") return false;
        } else {
          const rawStatusValues = [
            shoot.status,
            shoot.project_status,
            shoot.shoot_status,
            shoot.production_status,
          ].filter(hasValue);

          // Month/week/day endpoints do not return the normal project timeline
          // status. Do not hide valid calendar shoots merely because that field
          // is absent from this endpoint.
          if (rawStatusValues.length > 0) {
            const statusSource = rawStatusValues.map(normalize);
            if (
              !statusSource.some((value) =>
                value.includes(normalizedStatusFilter),
              )
            ) {
              return false;
            }
          }
        }
      }

      if (paymentFilter !== "all") {
        const hasPaymentData =
          hasValue(shoot.payment_status) ||
          hasValue(shoot.paid_amount) ||
          hasValue(shoot.pending_amount);

        if (hasPaymentData) {
          const paymentStatus = normalize(shoot.payment_status);
          const paidAmount = Number(shoot.paid_amount ?? 0);
          const pendingAmount = Number(shoot.pending_amount ?? 0);

          if (paymentFilter === "paid") {
            const isPaid =
              paymentStatus.includes("paid") ||
              (paidAmount > 0 && pendingAmount <= 0);
            if (!isPaid) return false;
          }

          if (paymentFilter === "pending") {
            const isPending =
              paymentStatus.includes("pending") || pendingAmount > 0;
            if (!isPending) return false;
          }
        }
      }

      if (productionFilter !== "all") {
        const productionValues = [
          shoot.production_filter,
          shoot.production_status,
          shoot.production_gap,
          shoot.missing_production_item,
        ].filter(hasValue);

        if (productionValues.length > 0) {
          const productionSource = productionValues.map(normalize);
          if (
            !productionSource.some((value) =>
              value.includes(normalize(productionFilter)),
            )
          ) {
            return false;
          }
        }
      }

      if (cpAssignmentFilter !== "all") {
        const hasCpData =
          Array.isArray(shoot.selected_crew_ids) ||
          Array.isArray(shoot.assigned_crews) ||
          Array.isArray(shoot.assignedCrew) ||
          typeof shoot.has_assigned_cp === "boolean" ||
          typeof shoot.cp_assigned === "boolean";

        if (hasCpData) {
          const selectedCrewIds = Array.isArray(shoot.selected_crew_ids)
            ? shoot.selected_crew_ids
            : [];
          const assignedCrew = Array.isArray(shoot.assigned_crews)
            ? shoot.assigned_crews
            : Array.isArray(shoot.assignedCrew)
              ? shoot.assignedCrew
              : [];
          const hasAssignedCp =
            selectedCrewIds.length > 0 ||
            assignedCrew.length > 0 ||
            shoot.has_assigned_cp === true ||
            shoot.cp_assigned === true;

          if (cpAssignmentFilter === "assigned" && !hasAssignedCp) return false;
          if (cpAssignmentFilter === "not_assigned" && hasAssignedCp)
            return false;
        }
      }

      return true;
    });
  }, [
    shoots,
    searchQuery,
    categoryFilter,
    statusFilter,
    paymentFilter,
    productionFilter,
    cpAssignmentFilter,
  ]);

  const shootsByDate = useMemo(
    () =>
      filteredShoots.reduce<Record<string, CalendarShoot[]>>(
        (result, shoot) => {
          const normalizedDate = apiDateKey(shoot.date);
          if (!normalizedDate) return result;
          (result[normalizedDate] ||= []).push(shoot);
          return result;
        },
        {},
      ),
    [filteredShoots],
  );

  const selectedDateShoots = selectedDate
    ? shootsByDate[dateKey(selectedDate)] || []
    : [];

  const drawerItems = useMemo(() => {
    const filteredItems =
      drawerFilter === "all"
        ? selectedDateShoots
        : selectedDateShoots.filter((item) => {
            const kind = getItemKind(item);
            if (drawerFilter === "shoots") return kind === "shoot";
            if (drawerFilter === "meetings") return kind === "meeting";
            return kind === "deleted";
          });

    return [...filteredItems].sort((a, b) => {
      const aStart = parseTimeToMinutes(a.start_time);
      const bStart = parseTimeToMinutes(b.start_time);

      if (aStart === null && bStart === null) return 0;
      if (aStart === null) return 1;
      if (bStart === null) return -1;

      return aStart - bStart;
    });
  }, [drawerFilter, selectedDateShoots]);

  const changeDate = (offset: number) => {
    const nextDate = new Date(focusDate);
    if (view === "month") nextDate.setMonth(nextDate.getMonth() + offset);
    if (view === "week") nextDate.setDate(nextDate.getDate() + offset * 7);
    if (view === "day") nextDate.setDate(nextDate.getDate() + offset);
    setFocusDate(nextDate);
  };

  const openDay = (date: Date) => {
    setSelectedDate(date);
    setDrawerFilter("all");
  };

  const getCalendarItemId = (item: CalendarShoot) => {
    const rawId = item.original_id ?? item.id;
    return String(rawId ?? "")
      .replace(/^deleted-/, "")
      .replace(/^meeting-/, "")
      .replace(/^#/, "")
      .trim();
  };

  const handleItemDetails = (item: CalendarShoot) => {
    const kind = getItemKind(item);
    const id = getCalendarItemId(item);
    const meetLink = getLocation(item);

    setSelectedDate(null);

    if (kind === "meeting") {
      if (meetLink) {
        window.open(meetLink, "_blank", "noopener,noreferrer");
      }
      return;
    }

    if (id) {
      router.push(`/admin/shoots/${encodeURIComponent(id)}`);
    }
  };

  const formatUpdatedAt = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return `Updated ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  };

  const headerLabel = focusDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const renderTopToolbar = () => (
    <div
      className={`flex min-h-[64px] flex-wrap items-center justify-between gap-4 border-b px-4 lg:px-6 ${isDark ? "border-[#333333] bg-[#111111]" : "border-[#E5E5E5] bg-white"}`}
    >
      <div className="flex min-w-0 items-center gap-5">
        <button
          type="button"
          onClick={() => setFocusDate(new Date())}
          className={`h-10 rounded-lg border px-4 text-sm font-medium transition-colors ${isDark ? "border-[#333333] bg-[#202020] text-white/80 hover:bg-[#2A2A2A]" : "border-[#E5E5E5] bg-white text-black/70 hover:bg-[#F7F7F7]"}`}
        >
          Today
        </button>

        <div
          className={`flex items-center gap-2 ${isDark ? "text-white/35" : "text-black/35"}`}
        >
          <button
            type="button"
            onClick={() => changeDate(-1)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${isDark ? "border-[#333333] bg-[#202020] hover:text-white" : "border-[#E5E5E5] bg-white hover:text-black"}`}
            aria-label="Previous"
          >
            <ChevronLeft size={18} strokeWidth={1.7} />
          </button>
          <button
            type="button"
            onClick={() => changeDate(1)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${isDark ? "border-[#333333] bg-[#202020] hover:text-white" : "border-[#E5E5E5] bg-white hover:text-black"}`}
            aria-label="Next"
          >
            <ChevronRight size={18} strokeWidth={1.7} />
          </button>
        </div>

        <h2
          className={`truncate text-sm font-semibold lg:text-base ${isDark ? "text-white" : "text-black"}`}
        >
          {headerLabel}
        </h2>
      </div>

      <div className="flex shrink-0 items-center gap-5">
        <div
          className={`hidden items-center gap-4 text-sm xl:flex ${isDark ? "text-white/65" : "text-black/60"}`}
        >
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#DDBE7A]" />
            Shoot
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#5BA8FF]" />
            Meeting
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#FF7B83]" />
            Deleted Shoots
          </span>
        </div>

        <div
          className={`flex h-10 overflow-hidden rounded-lg border ${isDark ? "border-white/5 bg-[#202020]" : "border-[#E5E5E5] bg-[#FAFAFA]"}`}
        >
          {(["month", "week", "day"] as CalendarView[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setView(item)}
              className={`min-w-[62px] px-3 text-xs capitalize transition-colors ${
                view === item
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

  const renderMonth = () => {
    const gridDates = getCalendarGridDates(focusDate);

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[920px]">
          <div
            className={`grid grid-cols-7 border-b ${isDark ? "border-[#333333] bg-[#171717]" : "border-[#E5E5E5] bg-[#FAFAFA]"}`}
          >
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className={`flex h-10 items-center justify-center text-xs font-medium tracking-[0.08em] ${isDark ? "text-white/50" : "text-black/45"}`}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {gridDates.map((date, index) => {
              const items = shootsByDate[dateKey(date)] || [];
              const isCurrentMonth = date.getMonth() === focusDate.getMonth();
              const todayCell = isSameDay(date, today);

              return (
                <button
                  type="button"
                  key={dateKey(date)}
                  onClick={() => openDay(date)}
                  className={`relative h-[145px] border-b border-r ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"} p-[7px] text-left transition hover:bg-white/[0.015] ${
                    index % 7 === 6 ? "border-r-0" : ""
                  }`}
                >
                  <div className="flex justify-end">
                    <span
                      className={`flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-[14px] ${
                        todayCell
                          ? "bg-[#E8D1AB] font-semibold text-black"
                          : isCurrentMonth
                            ? "text-[#F2F2F2]"
                            : "text-[#505050]"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1">
                    {items.slice(0, 3).map((item) => {
                      const kind = getItemKind(item);
                      const colors = itemColors(kind);
                      return (
                        <div
                          key={item.id}
                          className="flex h-[22px] min-w-0 items-center rounded-[4px] border px-2 text-[10px] leading-none"
                          style={{
                            borderColor: colors.border,
                            color: colors.text,
                            backgroundColor: `${colors.bg}CC`,
                          }}
                        >
                          <span className="mr-1 shrink-0 opacity-80">
                            {compactTime(item.start_time)}
                          </span>
                          <span className="truncate">{item.title}</span>
                        </div>
                      );
                    })}
                    {items.length > 3 && (
                      <p className="px-1 text-[10px] text-[#777]">
                        +{items.length - 3} more
                      </p>
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

  const getEventGeometry = (
    item: CalendarShoot,
    startHour: number,
    endHour: number,
  ) => {
    const startMinutes = parseTimeToMinutes(item.start_time) ?? startHour * 60;
    const endMinutes =
      parseTimeToMinutes(item.end_time) ??
      Math.min(startMinutes + 60, endHour * 60);
    const visibleStart = Math.max(startMinutes, startHour * 60);
    const visibleEnd = Math.min(
      Math.max(endMinutes, visibleStart + 30),
      endHour * 60,
    );
    return {
      top: ((visibleStart - startHour * 60) / 60) * HOUR_HEIGHT,
      height: Math.max(((visibleEnd - visibleStart) / 60) * HOUR_HEIGHT, 34),
    };
  };

  const renderWeek = () => {
    const startHour = WEEK_START_HOUR;
    const endHour = WEEK_END_HOUR;
    const hours = Array.from(
      { length: endHour - startHour + 1 },
      (_, i) => startHour + i,
    );
    const timelineHeight = (endHour - startHour) * HOUR_HEIGHT;

    return (
      <div className="overflow-x-auto overflow-y-hidden">
        <div className="min-w-[980px]">
          <div
            className="grid border-b border-[#2A2A2A]"
            style={{ gridTemplateColumns: "66px repeat(7, minmax(118px,1fr))" }}
          >
            <div className="border-r border-[#2A2A2A]" />
            {weekDates.map((date) => (
              <button
                type="button"
                key={dateKey(date)}
                onClick={() => openDay(date)}
                className="h-[71px] border-r border-[#2A2A2A] last:border-r-0"
              >
                <p className="mt-2 text-[12px] tracking-[0.08em] text-[#838383]">
                  {WEEKDAYS[date.getDay()]}
                </p>
                <span
                  className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-[14px] font-semibold ${
                    isSameDay(date, today)
                      ? "bg-[#E8D1AB] text-black"
                      : "text-[#A6A6A6]"
                  }`}
                >
                  {date.getDate()}
                </span>
              </button>
            ))}
          </div>

          <div
            className="grid"
            style={{ gridTemplateColumns: "66px repeat(7, minmax(118px,1fr))" }}
          >
            <div
              className="relative border-r border-[#2A2A2A]"
              style={{ height: timelineHeight }}
            >
              {hours.slice(0, -1).map((hour) => (
                <span
                  key={hour}
                  className="absolute right-2 -translate-y-1/2 text-[12px] text-[#929292]"
                  style={{ top: (hour - startHour) * HOUR_HEIGHT }}
                >
                  {timelineHourLabel(hour)}
                </span>
              ))}
            </div>

            {weekDates.map((date) => {
              const items = shootsByDate[dateKey(date)] || [];
              return (
                <div
                  key={dateKey(date)}
                  className="relative border-r border-[#2A2A2A] last:border-r-0"
                  style={{ height: timelineHeight }}
                >
                  {hours.slice(0, -1).map((hour) => (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 border-t border-[#1B1B1B]"
                      style={{ top: (hour - startHour) * HOUR_HEIGHT }}
                    />
                  ))}

                  {items.map((item) => {
                    const kind = getItemKind(item);
                    const colors = itemColors(kind);
                    const geometry = getEventGeometry(item, startHour, endHour);
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => openDay(date)}
                        className="absolute left-0 right-[1px] overflow-hidden rounded-[4px] border px-2 text-left"
                        style={{
                          top: geometry.top,
                          height: geometry.height,
                          borderColor: colors.border,
                          backgroundColor: colors.bg,
                          color: colors.text,
                        }}
                      >
                        <div className="flex h-full flex-col justify-center">
                          <p className="truncate text-[10px] font-medium">
                            {item.title}
                          </p>
                          <p className="mt-[2px] text-[9px] opacity-75">
                            {compactTime(item.start_time)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderDay = () => {
    const dayItems = shootsByDate[dateKey(focusDate)] || [];
    const startHour = DAY_START_HOUR;
    const endHour = DAY_END_HOUR;
    const hours = Array.from(
      { length: endHour - startHour + 1 },
      (_, i) => startHour + i,
    );
    const timelineHeight = (endHour - startHour) * HOUR_HEIGHT;

    return (
      <div>
        <button
          type="button"
          onClick={() => openDay(focusDate)}
          className="flex h-[81px] w-full items-center border-b border-[#2B2B2B] px-8 text-left"
        >
          <div className="mr-4 flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full bg-[#E8D1AB] text-black">
            <span className="text-[9px] font-semibold uppercase leading-none">
              {focusDate.toLocaleDateString("default", { weekday: "short" })}
            </span>
            <span className="mt-[2px] text-[18px] font-bold leading-none">
              {focusDate.getDate()}
            </span>
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[#EAEAEA]">
              {focusDate.toLocaleDateString("default", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="mt-1 text-[12px] text-[#424242]">
              {dayItems.length} events scheduled
            </p>
          </div>
        </button>

        <div className="grid" style={{ gridTemplateColumns: "95px 1fr" }}>
          <div
            className="relative border-r border-[#1F1F1F]"
            style={{ height: timelineHeight }}
          >
            {hours.slice(0, -1).map((hour) => (
              <span
                key={hour}
                className="absolute right-3 -translate-y-1/2 text-[12px] text-[#9A9A9A]"
                style={{ top: (hour - startHour) * HOUR_HEIGHT }}
              >
                {hour % 12 || 12}:00 {hour >= 12 ? "pm" : "am"}
              </span>
            ))}
          </div>

          <div className="relative" style={{ height: timelineHeight }}>
            {hours.slice(0, -1).map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 border-t border-[#111111]"
                style={{ top: (hour - startHour) * HOUR_HEIGHT }}
              />
            ))}

            {dayItems.map((item) => {
              const kind = getItemKind(item);
              const colors = itemColors(kind);
              const geometry = getEventGeometry(item, startHour, endHour);
              const location = getLocation(item);

              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => openDay(focusDate)}
                  className="absolute left-0 right-8 overflow-hidden rounded-[5px] border text-left"
                  style={{
                    top: geometry.top,
                    height: geometry.height,
                    borderColor: colors.border,
                    backgroundColor: colors.bg,
                    color: colors.text,
                    borderLeftWidth: 2,
                  }}
                >
                  <div className="flex h-full items-center justify-between gap-5 px-3">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold">
                        {item.title}
                      </p>
                      <p className="mt-1 text-[12px] opacity-75">
                        {formatTime(item.start_time)} –{" "}
                        {formatTime(item.end_time)}
                      </p>
                      {location && (
                        <p className="mt-1 truncate text-[11px] text-[#696969]">
                          {location}
                        </p>
                      )}
                    </div>

                    <span
                      className="shrink-0 rounded-full px-3 py-1 text-[12px]"
                      style={{
                        backgroundColor:
                          kind === "deleted"
                            ? "#EE555B"
                            : kind === "meeting"
                              ? "#1D1D1D"
                              : "#26323C",
                        color:
                          kind === "deleted"
                            ? "#FFFFFF"
                            : kind === "meeting"
                              ? "#858585"
                              : "#58A9F5",
                      }}
                    >
                      {kind === "deleted"
                        ? "Shoot Deleted"
                        : kind === "meeting"
                          ? "Upcoming"
                          : "In Progress"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderDrawerCard = (item: CalendarShoot) => {
    const kind = getItemKind(item);
    const location = getLocation(item);
    const platforms = Array.isArray(item.streaming_platforms)
      ? item.streaming_platforms
      : [];
    const equipment = Array.isArray(item.equipment) ? item.equipment : [];
    const updatedLabel = formatUpdatedAt(item.updated_at);
    const hasExtraDetails = platforms.length > 0 || equipment.length > 0;

    const badgeConfig =
      kind === "deleted"
        ? {
            label: "Deleted Shoot",
            className: isDark
              ? "bg-[#5A2E31] text-[#FF9292]"
              : "bg-[#FFF0F0] text-[#D64545]",
          }
        : kind === "meeting"
          ? {
              label: "Meeting",
              className: isDark
                ? "bg-[#1D3550] text-[#78B9FF]"
                : "bg-[#EDF6FF] text-[#2F7BF1]",
            }
          : {
              label: "Shoot",
              className: isDark
                ? "bg-[#2A261F] text-[#E8D1AB]"
                : "bg-[#FFF8EC] text-[#9B7B4F]",
            };

    return (
      <article
        key={item.id}
        className={`overflow-hidden rounded-2xl border transition-colors ${
          isDark
            ? "border-[#333333] bg-[#141414] hover:border-[#454545]"
            : "border-[#E5E5E5] bg-white hover:border-[#D6D6D6]"
        }`}
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {kind === "shoot" && (
                  <span
                    className={`rounded-md px-2.5 py-1 text-[10px] font-semibold ${
                      isDark
                        ? "bg-[#123A27] text-[#53D18B]"
                        : "bg-[#EAF8F0] text-[#16824A]"
                    }`}
                  >
                    Active
                  </span>
                )}
                <span
                  className={`rounded-md px-2.5 py-1 text-[10px] font-semibold ${badgeConfig.className}`}
                >
                  {badgeConfig.label}
                </span>
              </div>

              <h3
                className={`truncate text-base font-semibold leading-snug sm:text-[17px] ${
                  isDark ? "text-white" : "text-black"
                }`}
                title={item.title}
              >
                {item.title}
              </h3>
            </div>
          </div>

          <div
            className={`mt-4 grid gap-3 text-xs sm:grid-cols-2 ${
              isDark ? "text-white/50" : "text-black/50"
            }`}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <CalendarDays size={15} className="shrink-0" />
              <span>
                {new Date(
                  `${apiDateKey(item.date)}T00:00:00`,
                ).toLocaleDateString("default", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <Clock3 size={15} className="shrink-0" />
              <span>
                {formatTime(item.start_time)} – {formatTime(item.end_time)}
              </span>
            </div>

            {location && (
              <div className="flex min-w-0 items-center gap-2.5 sm:col-span-2">
                <MapPin size={15} className="shrink-0" />
                <span className="truncate" title={location}>
                  {location}
                </span>
              </div>
            )}
          </div>
        </div>

        {hasExtraDetails && (
          <div
            className={`grid grid-cols-1 border-y sm:grid-cols-2 ${
              isDark
                ? "border-[#303030] bg-[#101010]"
                : "border-[#ECECEC] bg-[#FAFAFA]"
            }`}
          >
            <div
              className={`min-h-[88px] px-5 py-4 sm:border-r ${
                isDark ? "sm:border-[#303030]" : "sm:border-[#ECECEC]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Video
                  size={14}
                  className={isDark ? "text-white/45" : "text-black/40"}
                />
                <p
                  className={`text-[11px] font-medium ${
                    isDark ? "text-white/75" : "text-black/70"
                  }`}
                >
                  Streaming Platforms
                </p>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-2">
                {platforms.map((platform) => (
                  <span
                    key={platform}
                    className={`rounded-md border px-2 py-1 text-[10px] ${
                      isDark
                        ? "border-[#363636] bg-[#1D1D1D] text-white/55"
                        : "border-[#E5E5E5] bg-white text-black/55"
                    }`}
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </div>

            <div className="min-h-[88px] px-5 py-4">
              <div className="flex items-center gap-2">
                <Camera
                  size={14}
                  className={isDark ? "text-white/45" : "text-black/40"}
                />
                <p
                  className={`text-[11px] font-medium ${
                    isDark ? "text-white/75" : "text-black/70"
                  }`}
                >
                  Equipment Assigned
                </p>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-2">
                {equipment.map((name) => (
                  <span
                    key={name}
                    className={`rounded-md border px-2 py-1 text-[10px] ${
                      isDark
                        ? "border-[#363636] bg-[#1D1D1D] text-white/55"
                        : "border-[#E5E5E5] bg-white text-black/55"
                    }`}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div
          className={`flex min-h-[68px] items-center justify-end gap-4 px-5 py-3 sm:px-6 ${
            isDark ? "bg-[#121212]" : "bg-[#FCFCFC]"
          }`}
        >
          <button
            type="button"
            onClick={() => handleItemDetails(item)}
            className="shrink-0 rounded-lg bg-[#E8D1AB] px-5 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-[#DCC49C]"
          >
            {kind === "meeting" ? "Join Meeting" : "View Details"}
          </button>
        </div>
      </article>
    );
  };

  const renderDrawer = () => {
    if (!selectedDate) return null;

    const totalItems = selectedDateShoots.length;

    return (
      <div
        className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-[2px]"
        onClick={() => setSelectedDate(null)}
      >
        <aside
          className={`absolute right-0 top-0 flex h-full w-full max-w-[620px] flex-col border-l shadow-[-18px_0_55px_rgba(0,0,0,0.38)] ${
            isDark
              ? "border-[#333333] bg-[#0E0E0E]"
              : "border-[#E5E5E5] bg-[#F9F9F9]"
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className={`flex min-h-[108px] items-center justify-between border-b px-5 py-5 sm:px-7 ${
              isDark
                ? "border-[#303030] bg-[#111111]"
                : "border-[#E5E5E5] bg-white"
            }`}
          >
            <div className="min-w-0 pr-4">
              <p
                className={`mb-1 text-[11px] font-medium uppercase tracking-[0.12em] ${
                  isDark ? "text-white/35" : "text-black/35"
                }`}
              >
                Day Schedule
              </p>
              <h2
                className={`truncate text-xl font-semibold sm:text-2xl ${
                  isDark ? "text-white" : "text-black"
                }`}
              >
                {selectedDate.toLocaleDateString("default", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </h2>
              <p
                className={`mt-1 text-xs ${
                  isDark ? "text-white/40" : "text-black/40"
                }`}
              >
                {totalItems} {totalItems === 1 ? "event" : "events"} scheduled
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors ${
                isDark
                  ? "border-[#343434] bg-[#202020] text-white/70 hover:bg-[#2A2A2A] hover:text-white"
                  : "border-[#E5E5E5] bg-[#F4F4F4] text-black/55 hover:bg-[#EBEBEB] hover:text-black"
              }`}
              aria-label="Close"
            >
              <X size={21} />
            </button>
          </div>

          <div
            className={`border-b px-5 py-4 sm:px-7 ${
              isDark
                ? "border-[#292929] bg-[#0E0E0E]"
                : "border-[#EBEBEB] bg-[#F9F9F9]"
            }`}
          >
            <div
              className={`grid grid-cols-2 gap-1 rounded-xl border p-1 sm:grid-cols-4 ${
                isDark
                  ? "border-[#303030] bg-[#191919]"
                  : "border-[#E5E5E5] bg-white"
              }`}
            >
              {(
                [
                  ["all", "All"],
                  ["shoots", "Shoots"],
                  ["meetings", "Meetings"],
                  ["deleted", "Deleted"],
                ] as Array<[CalendarFilter, string]>
              ).map(([key, label]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setDrawerFilter(key)}
                  className={`h-10 rounded-lg px-3 text-[13px] font-medium transition-colors ${
                    drawerFilter === key
                      ? "bg-[#E8D1AB] text-black shadow-sm"
                      : isDark
                        ? "text-white/50 hover:bg-white/[0.04] hover:text-white"
                        : "text-black/45 hover:bg-black/[0.035] hover:text-black"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6 custom-scrollbar">
            <div className="space-y-4">
              {drawerItems.length ? (
                drawerItems.map(renderDrawerCard)
              ) : (
                <div
                  className={`rounded-2xl border px-5 py-12 text-center ${
                    isDark
                      ? "border-[#303030] bg-[#141414]"
                      : "border-[#E5E5E5] bg-white"
                  }`}
                >
                  <CalendarDays
                    size={30}
                    className={`mx-auto mb-3 ${
                      isDark ? "text-white/20" : "text-black/20"
                    }`}
                  />
                  <p
                    className={`text-sm font-medium ${
                      isDark ? "text-white/55" : "text-black/55"
                    }`}
                  >
                    No events found
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      isDark ? "text-white/30" : "text-black/30"
                    }`}
                  >
                    There are no items for the selected filter.
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    );
  };

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border ${isDark ? "border-[#333333] bg-[#111111] text-white" : "border-[#E5E5E5] bg-white text-black"}`}
    >
      {renderTopToolbar()}

      <div className="relative min-h-[500px]">
        {isLoading && (
          <div
            className={`absolute inset-0 z-30 flex items-center justify-center ${isDark ? "bg-[#111111]/75" : "bg-white/75"}`}
          >
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
