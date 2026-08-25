"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  Calendar,
  MapPin,
  Clock,
  Video,
  Mic,
  Plus,
  CheckCircle,
  Loader2,
  Pencil,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

// Assuming standard Next.js path aliases (@/)
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AddAvailability,
  GetUpcomingShoots,
  connectCreatorGoogleCalendar,
  disconnectCreatorGoogleCalendar,
  getCreatorCalendarStatus,
  getCreatorAvailabilityRules,
  getCrewAvailability,
  getProjectDetails,
  saveCreatorAvailabilityRules,
  syncCreatorGoogleCalendar,
} from "@/lib/api";
import DatePicker from "@/components/ui/Datepicker";
import TimePicker from "@/components/ui/Timepicker";
import { format } from "date-fns";
import { toast } from "sonner";
import { StatCard } from "@/components/admin/StatCard";
import Topbar from "@/components/admin/Topbar";

// --- HELPERS ---
const formatLocation = (locationInput) => {
  if (!locationInput) return "Location TBD";
  let addressStr = locationInput;

  try {
    const parsed = JSON.parse(locationInput);
    if (parsed && parsed.address) addressStr = parsed.address;
  } catch (e) {
    /* Not JSON */
  }

  const parts = addressStr.split(",").map((p) => p.trim());
  if (parts.length >= 3) {
    const country = parts[parts.length - 1];
    const stateZip = parts[parts.length - 2];
    const city = parts[parts.length - 3];
    const state = stateZip.replace(/\d+/g, "").trim();
    return `${city}, ${state}, ${country}`;
  }
  return addressStr;
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getDefaultFormData = () => ({
  type: "1",
  recurrence: "1",
  includeWeekends: false,
  repeatOn: [],
  monthlyDay: "",
  untilDate: null,
  startTime: null,
  endTime: null,
  notes: "",
});

const parseLocalDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const formatTimeForApi = (value) => {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return format(value, "HH:mm:ss");
  }

  const text = String(value).trim();
  const match = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);

  if (!match) return null;

  const hours = Math.min(Number(match[1]), 23).toString().padStart(2, "0");
  const minutes = Math.min(Number(match[2]), 59).toString().padStart(2, "0");
  const seconds = Math.min(Number(match[3] || "0"), 59).toString().padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
};

const formatTimeForDisplay = (value) => {
  const time = formatTimeForApi(value);
  if (!time) return "";

  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return format(date, "h:mm a");
};

const timeToMinutes = (value) => {
  const time = formatTimeForApi(value);

  if (!time) return null;

  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

const parseTimeToDate = (value) => {
  const time = formatTimeForApi(value);
  if (!time) return null;

  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const addMinutesToTime = (value, minutesToAdd = 60) => {
  const time = formatTimeForApi(value);

  if (!time) return null;

  const [hours, minutes] = time.split(":").map(Number);

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  date.setMinutes(date.getMinutes() + minutesToAdd);

  return date;
};

const hasMinimumOneHourGap = (startValue, endValue) => {
  const startMinutes = timeToMinutes(startValue);
  const endMinutes = timeToMinutes(endValue);

  if (startMinutes === null || endMinutes === null) {
    return false;
  }

  return endMinutes - startMinutes >= 60;
};

type GoogleCalendarStatus = {
  connected?: boolean;
  provider_account_email?: string | null;
  sync_status?: string;
  last_synced_at?: string | null;
};

type WeeklyRule = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  timezone: string;
  minimum_notice_minutes: number;
  is_active: number;
};

type SelectedDay = {
  date: string;
  status: {
    available?: boolean | null;
    projectAssigned?: boolean;
    projectDetails?: {
      project_name?: string;
      start_time?: string | null;
      end_time?: string | null;
      event_location?: string | null;
    } | null;
    customAvailabilityStatus?: number | string | null;
    start_time?: string | null;
    end_time?: string | null;
    is_full_day?: number | string | null;
    calendarBusy?: boolean;
    calendarBusyBlocks?: Array<{
      start_at?: string;
      end_at?: string;
      source?: string;
    }>;
    weeklyRules?: Array<{
      start_time?: string;
      end_time?: string;
      timezone?: string;
      minimum_notice_minutes?: number;
    }>;
  } | null;
};

type ApiErrorShape = {
  response?: {
    status?: number;
    data?: {
      message?: string;
      data?: {
        conflicts?: unknown[];
      };
    };
  };
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  return fallback;
};

const WEEK_DAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const DEFAULT_CREATOR_TIMEZONE = "Asia/Kolkata";

const DEFAULT_WEEKLY_RULES: WeeklyRule[] = [
  1, 2, 3, 4, 5
].map((day) => ({
  day_of_week: day,
  start_time: "10:00:00",
  end_time: "18:00:00",
  timezone: DEFAULT_CREATOR_TIMEZONE,
  minimum_notice_minutes: 1440,
  is_active: 1,
}));

const SUPPORTED_CREATOR_TIME_ZONES = [
  { value: "Asia/Kolkata", label: "India / Kolkata (IST)" },
  { value: "America/New_York", label: "New York / Toronto (ET)" },
  { value: "America/Chicago", label: "Chicago / Winnipeg (CT)" },
  { value: "America/Denver", label: "Denver / Edmonton (MT)" },
  { value: "America/Phoenix", label: "Phoenix / Arizona (MST)" },
  { value: "America/Los_Angeles", label: "Los Angeles / Vancouver (PT)" },
  { value: "America/Anchorage", label: "Anchorage / Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Honolulu / Hawaii (HST)" },
  { value: "America/Halifax", label: "Halifax / Atlantic Canada (AT)" },
  { value: "America/St_Johns", label: "St. John's / Newfoundland (NT)" },
  { value: "America/Regina", label: "Regina / Saskatchewan (CST)" },
];

const getSupportedTimeZones = () => {
  return SUPPORTED_CREATOR_TIME_ZONES;
};

const getTimeZoneLabel = (timeZone: string) =>
  SUPPORTED_CREATOR_TIME_ZONES.find((item) => item.value === timeZone)?.label ||
  timeZone;

const normalizeWeeklyRules = (rules: unknown): WeeklyRule[] => {
  if (!Array.isArray(rules)) return [];

  return rules
    .map((rule) => {
      if (!rule || typeof rule !== "object") return null;
      const data = rule as Partial<WeeklyRule>;
      return {
        day_of_week: Number(data.day_of_week),
        start_time: formatTimeForApi(data.start_time) || "10:00:00",
        end_time: formatTimeForApi(data.end_time) || "18:00:00",
        timezone: data.timezone || DEFAULT_CREATOR_TIMEZONE,
        minimum_notice_minutes: Number(data.minimum_notice_minutes ?? 1440),
        is_active: Number(data.is_active ?? 1),
      };
    })
    .filter((rule): rule is WeeklyRule =>
      Boolean(rule) &&
      Number.isInteger(rule.day_of_week) &&
      rule.day_of_week >= 0 &&
      rule.day_of_week <= 6
    );
};

const getWeeklySummary = (rules: WeeklyRule[]) => {
  if (!rules.length) return "Not set";

  const labels = rules
    .sort((a, b) => a.day_of_week - b.day_of_week)
    .map((rule) => WEEK_DAYS.find((day) => day.value === rule.day_of_week)?.label)
    .filter(Boolean);

  return labels.join(", ");
};

const getRuleTimeSummary = (rules: WeeklyRule[]) => {
  if (!rules.length) return "Set your normal working hours";

  const firstRule = rules[0];
  return `${formatTimeForDisplay(firstRule.start_time)} - ${formatTimeForDisplay(firstRule.end_time)}`;
};

const formatDayHeading = (dateString: string) => {
  const date = parseLocalDate(dateString);
  return date ? format(date, "EEEE, MMM d, yyyy") : dateString;
};

const formatDateTimeInTimeZone = (value?: string, timeZone = DEFAULT_CREATOR_TIMEZONE) => {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
};

export default function AvailabilityPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAllDay, setIsAllDay] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [upcomingShoots, setUpcomingShoots] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projectDetails, setProjectDetails] = useState(null);
  const [projectLoading, setProjectLoading] = useState(false);
  const pathname = usePathname();
  const { isDark } = useResolvedTheme();

  const [formData, setFormData] = useState(getDefaultFormData);

  const [availability, setAvailability] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [summaryData, setSummaryData] = useState({
    availableDays: 0,
    bookedShoots: 0,
    timeOff: 0,
  });
  const [hoveredProject, setHoveredProject] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [calendarStatus, setCalendarStatus] = useState<GoogleCalendarStatus | null>(null);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [isCalendarSyncing, setIsCalendarSyncing] = useState(false);
  const [weeklyRules, setWeeklyRules] = useState<WeeklyRule[]>(DEFAULT_WEEKLY_RULES);
  const [hasSavedWeeklyRules, setHasSavedWeeklyRules] = useState(false);
  const [isRulesLoading, setIsRulesLoading] = useState(false);
  const [isRulesSaving, setIsRulesSaving] = useState(false);
  const [isWeeklyModalOpen, setIsWeeklyModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(null);
  const supportedTimeZones = useMemo(() => getSupportedTimeZones(), []);
  const selectedWeeklyTimezone = weeklyRules[0]?.timezone || DEFAULT_CREATOR_TIMEZONE;
  const selectedMinimumNoticeHours = Math.round((weeklyRules[0]?.minimum_notice_minutes || 1440) / 60);

  useEffect(() => {
    const userStr = localStorage.getItem("revure_user");
    const user = userStr ? JSON.parse(userStr) : null;
    const crewMemberId = user?.crew_member_id;

    if (!crewMemberId) return;

    getCrewAvailability({
      crew_member_id: crewMemberId,
      month: currentMonth,
      year: currentYear,
    }).then((response) => {
      console.log("API Response:", response);
      if (response?.data?.data?.availability) {
        setAvailability(response.data.data.availability);
      }
    });
  }, [currentMonth, currentYear]);

  const refreshCalendarStatus = async (crewMemberId) => {
    try {
      const response = await getCreatorCalendarStatus({ crew_member_id: crewMemberId });
      setCalendarStatus(response?.data?.data || null);
    } catch (error) {
      console.error("Failed to fetch calendar status", error);
      setCalendarStatus(null);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("revure_user");
    const user = userStr ? JSON.parse(userStr) : null;
    const crewMemberId = user?.crew_member_id;

    if (!crewMemberId) return;

    refreshCalendarStatus(crewMemberId);
  }, []);

  const refreshWeeklyRules = async (crewMemberId) => {
    setIsRulesLoading(true);
    try {
      const response = await getCreatorAvailabilityRules({ crew_member_id: crewMemberId });
      const rules = normalizeWeeklyRules(response?.data?.data?.rules);
      if (rules.length) {
        setWeeklyRules(rules);
        setHasSavedWeeklyRules(true);
      } else {
        setWeeklyRules(DEFAULT_WEEKLY_RULES);
        setHasSavedWeeklyRules(false);
      }
    } catch (error) {
      console.error("Failed to fetch weekly availability rules", error);
    } finally {
      setIsRulesLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("revure_user");
    const user = userStr ? JSON.parse(userStr) : null;
    const crewMemberId = user?.crew_member_id;

    if (!crewMemberId) return;

    refreshWeeklyRules(crewMemberId);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("calendar") !== "google") return;

    const status = params.get("status");
    const reason = params.get("reason");
    const userStr = localStorage.getItem("revure_user");
    const user = userStr ? JSON.parse(userStr) : null;
    const crewMemberId = user?.crew_member_id;

    if (status === "connected") {
      toast.success("Google Calendar connected");
    } else if (status === "failed") {
      toast.error(reason || "Google Calendar connection failed");
    }

    if (crewMemberId) {
      refreshCalendarStatus(crewMemberId);
      reloadAvailability(crewMemberId);
    }

    params.delete("calendar");
    params.delete("status");
    params.delete("reason");
    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState({}, "", nextUrl);
  }, []);


  useEffect(() => {
    const userStr = localStorage.getItem("revure_user");
    const user = userStr ? JSON.parse(userStr) : null;
    const crewMemberId = user?.crew_member_id;

    if (!crewMemberId) return;

    if (crewMemberId) {
      GetUpcomingShoots({ crew_member_id: parseInt(crewMemberId) })
        .then((response) => {
          if (!response?.error && Array.isArray(response?.data)) {
            setUpcomingShoots(response.data);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch upcoming shoots", err);
        });
    } else {
      console.error('Crew member ID not found in localStorage');
    }
  }, []);


  useEffect(() => {
    const userStr = localStorage.getItem("revure_user");
    const user = userStr ? JSON.parse(userStr) : null;
    const crewMemberId = user?.crew_member_id;

    if (!crewMemberId) return;

    if (crewMemberId) {
      getCrewAvailability({
        crew_member_id: parseInt(crewMemberId),
        month: currentMonth,
        year: currentYear,
      })
        .then((response) => {
          if (!response?.error && Array.isArray(response?.data)) {
            setUpcomingShoots(response.data);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch upcoming shoots", err);
        });
    } else {
      console.error('Crew member ID not found in localStorage');
    }
  }, []);

  //   const handleViewDetails = async (projectId) => {
  //     setIsSidebarOpen(true);
  //     setProjectLoading(true);

  //     try {
  //       const response = await getProjectDetails({
  //         project_id: projectId,
  //       });

  //       if (!response?.error) {
  //         setProjectDetails(response.data);
  //       }
  //     } catch (err) {
  //       console.error("Failed to fetch project details", err);
  //     } finally {
  //       setProjectLoading(false);
  //     }
  //   };

  useEffect(() => {
    const getSummaryData = () => {
      let availableDays = 0;
      let bookedShoots = 0;
      let timeOff = 0;

      for (const dateKey in availability) {
        const availabilityStatus = availability[dateKey];
        if (availabilityStatus) {
          if (availabilityStatus.available) {
            availableDays += 1;
          }
          if (availabilityStatus.projectAssigned) {
            bookedShoots += 1;
          }
          if (
            availabilityStatus.available === false &&
            availabilityStatus.projectAssigned !== true
          ) {
            timeOff += 1;
          }
        }
      }

      setSummaryData({ availableDays, bookedShoots, timeOff });
    };

    getSummaryData();
  }, [availability]);

  const showAvailabilityConflictToast = (message, conflicts = []) => {
    const firstConflict = conflicts[0];
    const conflictDate = parseLocalDate(firstConflict?.date);
    const formattedConflictDate = conflictDate
      ? format(conflictDate, "MMM d, yyyy")
      : firstConflict?.date;
    const additionalConflictCount = Math.max(conflicts.length - 1, 0);
    const conflictDescription = firstConflict
      ? `${firstConflict.project_name || "An assigned shoot"} is already scheduled${formattedConflictDate ? ` on ${formattedConflictDate}` : ""}.${additionalConflictCount > 0
        ? ` ${additionalConflictCount} more assigned ${additionalConflictCount === 1 ? "shoot also conflicts" : "shoots also conflict"}.`
        : ""
      }`
      : message;

    toast.error("Availability Conflict", {
      description: conflictDescription,
      duration: 6000,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (typeof window === "undefined") return;
    const user = JSON.parse(localStorage.getItem("revure_user") || "{}");
    const crewMemberId = user?.crew_member_id;

    const selectedDateValue = parseLocalDate(selectedDate);
    if (!selectedDateValue) {
      toast.error("Please select a date");
      return;
    }

    const formattedDate = format(selectedDateValue, "yyyy-MM-dd");
    const startTime = formatTimeForApi(formData.startTime);
    const endTime = formatTimeForApi(formData.endTime);
    const hasTimeRange = Boolean(startTime && endTime);

    if (
      !isAllDay &&
      !hasMinimumOneHourGap(formData.startTime, formData.endTime)
    ) {
      toast.error(
        "End time must be at least 1 hour after the start time"
      );
      return;
    }

    const payload = {
      crew_member_id: crewMemberId,
      date: formattedDate,
      availability_status: Number(formData.type),
      is_full_day: isAllDay || !hasTimeRange ? 1 : 0,
      start_time: isAllDay ? null : startTime,
      end_time: isAllDay ? null : endTime,
      recurrence: Number(formData.recurrence),
      notes: formData.notes || "",
    };

    if (formData.recurrence !== "1") {
      if (formData.untilDate) {
        payload.recurrence_until = format(
          new Date(formData.untilDate),
          "yyyy-MM-dd"
        );
      }

      if (formData.recurrence === "2") {
        if (!formData.includeWeekends) {
          payload.recurrence_days = ["mon", "tue", "wed", "thu", "fri"];
        }
      } else if (formData.recurrence === "3") {
        payload.recurrence_days = (formData.repeatOn || []).map((day) =>
          day.toLowerCase()
        );
      } else if (formData.recurrence === "4") {
        payload.recurrence_day_of_month = Number(formData.monthlyDay);
      }
    }

    setIsSubmitting(true);

    try {
      await AddAvailability(payload);
      setIsModalOpen(false);

      toast.success("Availability Updated", {
        description: "Your schedule has been successfully updated.",
      });

      const response = await getCrewAvailability({
        crew_member_id: crewMemberId,
        month: currentMonth,
        year: currentYear,
      });

      if (response?.data?.data?.availability) {
        setAvailability(response.data.data.availability);
      }
    } catch (error: unknown) {
      console.error("Error adding availability:", error);
      const apiError = error as ApiErrorShape;
      const errorData = apiError?.response?.data;

      if (apiError?.response?.status === 409 || errorData?.data?.conflicts?.length) {
        showAvailabilityConflictToast(
          errorData?.message,
          errorData?.data?.conflicts || []
        );
      } else {
        toast.error(
          errorData?.message ||
          "Something went wrong while updating availability"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalOpen = () => {
    setFormData(getDefaultFormData());
    setIsAllDay(false);
    setIsModalOpen(true);
    setIsAnimating(true);
  };

  const handleModalClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsModalOpen(false);
      setFormData(getDefaultFormData());
      setIsAllDay(false);
    }, 300);
  };

  const handleFormChange = (value, name) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAllDayChange = () => {
    setIsAllDay(!isAllDay);
    if (!isAllDay) {
      setFormData({ ...formData, startTime: null, endTime: null });
    }
  };

  const handleTimeChange = (time, field) => {
    setIsAllDay(false);

    setFormData((prevData) => {
      if (field === "startTime") {
        const minimumEndTime = addMinutesToTime(time, 60);

        const currentEndMinutes = timeToMinutes(prevData.endTime);
        const minimumEndMinutes = timeToMinutes(minimumEndTime);

        /*
         * If the existing end time becomes invalid after changing start time,
         * automatically reset it to one hour after the new start time.
         */
        const shouldUpdateEndTime =
          time &&
          (
            currentEndMinutes === null ||
            minimumEndMinutes === null ||
            currentEndMinutes < minimumEndMinutes
          );

        return {
          ...prevData,
          startTime: time,
          endTime: shouldUpdateEndTime
            ? minimumEndTime
            : prevData.endTime,
        };
      }

      if (field === "endTime") {
        if (
          prevData.startTime &&
          time &&
          !hasMinimumOneHourGap(prevData.startTime, time)
        ) {
          toast.error(
            "End time must be at least 1 hour after the start time"
          );

          return prevData;
        }

        return {
          ...prevData,
          endTime: time,
        };
      }

      return {
        ...prevData,
        [field]: time,
      };
    });
  };
  const handleMonthChange = (direction) => {
    if (direction === "prev") {
      setCurrentMonth((prevMonth) => (prevMonth === 1 ? 12 : prevMonth - 1));
      if (currentMonth === 1) {
        setCurrentYear(currentYear - 1);
      }
    } else if (direction === "next") {
      setCurrentMonth((prevMonth) => (prevMonth === 12 ? 1 : prevMonth + 1));
      if (currentMonth === 12) {
        setCurrentYear(currentYear + 1);
      }
    }
  };

  const reloadAvailability = async (crewMemberId) => {
    const response = await getCrewAvailability({
      crew_member_id: crewMemberId,
      month: currentMonth,
      year: currentYear,
    });

    if (response?.data?.data?.availability) {
      setAvailability(response.data.data.availability);
    }
  };

  const handleGoogleConnect = async () => {
    if (isCalendarLoading) return;

    const user = JSON.parse(localStorage.getItem("revure_user") || "{}");
    const crewMemberId = user?.crew_member_id;

    if (!crewMemberId) {
      toast.error("Creator profile was not found");
      return;
    }

    setIsCalendarLoading(true);
    try {
      const response = await connectCreatorGoogleCalendar({ crew_member_id: crewMemberId });
      const authUrl = response?.data?.data?.auth_url;

      if (!authUrl) {
        toast.error("Google Calendar connect URL was not returned");
        return;
      }

      window.location.href = authUrl;
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to start Google Calendar connect"));
    } finally {
      setIsCalendarLoading(false);
    }
  };

  const handleGoogleSync = async () => {
    if (isCalendarSyncing) return;

    const user = JSON.parse(localStorage.getItem("revure_user") || "{}");
    const crewMemberId = user?.crew_member_id;

    if (!crewMemberId) {
      toast.error("Creator profile was not found");
      return;
    }

    setIsCalendarSyncing(true);
    try {
      await syncCreatorGoogleCalendar({ crew_member_id: crewMemberId });
      await Promise.all([
        refreshCalendarStatus(crewMemberId),
        reloadAvailability(crewMemberId),
      ]);
      toast.success("Google Calendar synced");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to sync Google Calendar"));
      await refreshCalendarStatus(crewMemberId);
    } finally {
      setIsCalendarSyncing(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    if (isCalendarLoading) return;

    const user = JSON.parse(localStorage.getItem("revure_user") || "{}");
    const crewMemberId = user?.crew_member_id;

    if (!crewMemberId) {
      toast.error("Creator profile was not found");
      return;
    }

    setIsCalendarLoading(true);
    try {
      await disconnectCreatorGoogleCalendar({ crew_member_id: crewMemberId });
      await Promise.all([
        refreshCalendarStatus(crewMemberId),
        reloadAvailability(crewMemberId),
      ]);
      toast.success("Google Calendar disconnected");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to disconnect Google Calendar"));
    } finally {
      setIsCalendarLoading(false);
    }
  };

  const updateWeeklyRule = (dayOfWeek: number, changes: Partial<WeeklyRule>) => {
    setWeeklyRules((currentRules) =>
      currentRules.map((rule) =>
        rule.day_of_week === dayOfWeek ? { ...rule, ...changes } : rule
      )
    );
  };

  const toggleWeeklyDay = (dayOfWeek: number) => {
    setWeeklyRules((currentRules) => {
      const existing = currentRules.find((rule) => rule.day_of_week === dayOfWeek);

      if (existing) {
        return currentRules.filter((rule) => rule.day_of_week !== dayOfWeek);
      }

      return [
        ...currentRules,
        {
          day_of_week: dayOfWeek,
          start_time: "10:00:00",
          end_time: "18:00:00",
          timezone: currentRules[0]?.timezone || DEFAULT_CREATOR_TIMEZONE,
          minimum_notice_minutes: currentRules[0]?.minimum_notice_minutes || 1440,
          is_active: 1,
        },
      ].sort((a, b) => a.day_of_week - b.day_of_week);
    });
  };

  const updateAllWeeklyRules = (changes: Partial<WeeklyRule>) => {
    setWeeklyRules((currentRules) =>
      currentRules.map((rule) => ({ ...rule, ...changes }))
    );
  };

  const handleSaveWeeklyRules = async () => {
    if (isRulesSaving) return;

    const invalidRule = weeklyRules.find((rule) =>
      !hasMinimumOneHourGap(rule.start_time, rule.end_time)
    );

    if (invalidRule) {
      toast.error("Each working day needs at least a 1 hour window");
      return;
    }

    const user = JSON.parse(localStorage.getItem("revure_user") || "{}");
    const crewMemberId = user?.crew_member_id;

    if (!crewMemberId) {
      toast.error("Creator profile was not found");
      return;
    }

    setIsRulesSaving(true);
    try {
      await saveCreatorAvailabilityRules({
        crew_member_id: crewMemberId,
        rules: weeklyRules,
      });
      await reloadAvailability(crewMemberId);
      setHasSavedWeeklyRules(weeklyRules.length > 0);
      setIsWeeklyModalOpen(false);
      toast.success("Weekly availability saved");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to save weekly availability"));
    } finally {
      setIsRulesSaving(false);
    }
  };

  const handleDateLeave = () => {
    setHoveredProject(null);
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const renderCalendarDays = () => {
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const calendarDays = [];

    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} className={`h-28 border transition-colors ${isDark
        ? "bg-[#0D0D0D]/50 border-white/5"
        : "bg-[#F4F4F4] border-[#E5E5E5]"
        }`} />);
    }

    const today = new Date();
    const todayDateString = format(today, "yyyy-MM-dd");

    for (let i = 1; i <= daysInMonth; i++) {
      const dateString = `${currentYear}-${currentMonth < 10 ? "0" + currentMonth : currentMonth
        }-${i < 10 ? "0" + i : i}`;
      const availabilityStatus = availability[dateString];

      const availabilityValue = availabilityStatus?.available;

      const isAvailable = availabilityValue === true;
      const isNotAvailable = availabilityValue === false;
      const isNeutral =
        availabilityValue === null ||
        availabilityValue === undefined;

      const isAssigned =
        availabilityStatus?.projectAssigned === true;
      const hasCalendarBusy =
        availabilityStatus?.calendarBusy === true;
      const startTimeDisplay = formatTimeForDisplay(availabilityStatus?.start_time);
      const endTimeDisplay = formatTimeForDisplay(availabilityStatus?.end_time);
      const hasTimeRange = Boolean(startTimeDisplay && endTimeDisplay);

      const isPastDate = dateString < todayDateString;
      const isToday = dateString === todayDateString;

      // Background logic matching the high-end dashboard
      const cardBackground = isDark
        ? (isPastDate ? "bg-[#161616] opacity-90" : isAvailable ? "bg-[#111]" : "bg-[#161616]")
        : (isPastDate ? "bg-[#F4F4F4] opacity-80" : isAvailable ? "bg-[#F8F4EE]" : "bg-white");

      const textColor = isDark
        ? (isAvailable ? "text-white" : "text-white/30")
        : (isAvailable ? "text-black" : "text-black/30");
      const borderColor = isDark ? "border-white/5" : "border-[#E5E5E5]";

      const handleDateClick = () => {
        setSelectedDay({
          date: dateString,
          status: availabilityStatus || null,
        });
      };

      const handleDateHover = (e) => {
        if (isAssigned && availabilityStatus?.projectDetails) {
          const rect = e.currentTarget.getBoundingClientRect();
          setHoverPosition({
            x: rect.right + 10,
            y: rect.top,
          });
          setHoveredProject({
            date: dateString,
            ...availabilityStatus.projectDetails,
          });
        }
      };

      calendarDays.push(
        <div
          key={i}
          onClick={handleDateClick}
          onMouseEnter={handleDateHover}
          onMouseLeave={handleDateLeave}
          className={`h-28 p-3 border text-xs transition-all duration-200 ${cardBackground} ${textColor} ${borderColor} cursor-pointer ${isDark
            ? "hover:border-[#E8D1AB]/30 hover:bg-[#1A1A1A]"
            : "hover:border-black/20 hover:bg-black/[0.02]"
            } group`}
        >
          <div
            className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold mb-1 transition-colors ${isToday ? "bg-[#E8D1AB] text-black" : "group-hover:text-[#E8D1AB]"
              }`}
          >
            {i}
          </div>

          {availabilityStatus && (
            <div className="space-y-1 mt-2">
              {isAssigned && (
                <div className="space-y-1">
                  {availabilityStatus.projectDetails?.project_name && (
                    <>
                      <EventDot color="bg-blue-500" label="Shoot" isDark={isDark} />
                      <EventDot color="bg-[#E8D1AB]" label="Booked" isDark={isDark} />
                    </>
                  )}
                </div>
              )}
              {isAvailable && !isAssigned && (
                <div className="flex items-center gap-1 text-green-500/70">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="hidden lg:block">Available</span>
                </div>
              )}

              {hasCalendarBusy && !isAssigned && (
                <div className="flex items-center gap-1 text-amber-500/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="hidden lg:block">Calendar Busy</span>
                </div>
              )}

              {isNotAvailable && !isAssigned && (
                <div className="flex items-center gap-1 text-red-400/75">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span className="hidden lg:block">Not Available</span>
                </div>
              )}
              {hasTimeRange && (
                <div className={`hidden lg:flex items-center gap-1 ${isAvailable ? (isDark ? "text-white/45" : "text-black/45") : "text-red-400/70"}`}>
                  <Clock size={11} />
                  <span>{startTimeDisplay} - {endTimeDisplay}</span>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return calendarDays;
  };

  const selectedDayStatus = selectedDay?.status;
  const selectedDayTimezone =
    selectedDayStatus?.weeklyRules?.find((rule) => rule.timezone)?.timezone ||
    weeklyRules.find((rule) => rule.timezone)?.timezone ||
    DEFAULT_CREATOR_TIMEZONE;
  const selectedDayBusyBlocks = selectedDayStatus?.calendarBusyBlocks || [];
  const selectedDayWorkingRules = selectedDayStatus?.weeklyRules || [];
  const selectedDayHasWorkingHours = Boolean(
    selectedDayStatus?.start_time &&
    selectedDayStatus?.end_time
  );
  const selectedDayIsTimeOff =
    selectedDayStatus?.available === false &&
    selectedDayStatus?.projectAssigned !== true;

  return (
    <>
      <Topbar pathname={pathname} />
<div 
  className={`mx-4 lg:mx-8 mt-6 mb-20 rounded-2xl transition-all duration-700 overflow-hidden
    ${isDark 
      ? `bg-[#0A0A0A] 
         border border-[#E8D1AB]/30 
         shadow-[inset_0_0_12px_rgba(232,209,171,0.1),0_0_2px_rgba(232,209,171,0.8),0_0_15px_rgba(232,209,171,0.3),0_0_40px_rgba(232,209,171,0.15)]` 
      : "bg-white border-zinc-200 shadow-sm"
    }`}
>      
  <div className="p-10 lg:p-16 space-y-8 lg:space-y-12 pb-24">
  {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
          <div>
            <h1 className={`text-lg lg:text-2xl font-semibold transition-colors ${isDark ? "text-white" : "text-black"}`}>Manage Availability</h1>
            <p className={`mt-1 text-xs lg:text-sm transition-colors ${isDark ? "text-white/55" : "text-black/60"}`}>Set your available dates and times for upcoming projects</p>
          </div>

          <Button
            onClick={handleModalOpen}
            className="bg-[#E8D1AB] text-black rounded-lg lg:rounded-xl h-10 lg:h-12 px-4 lg:px-8 hover:bg-[#d4be9a] transition-colors lg:font-bold flex items-center gap-2"
          >
            <Plus size={20} />
            Add Availability
          </Button>
        </div>

        {/* Summary Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Available Days"
            value={summaryData.availableDays}
            icon={CheckCircle}
            iconColor="text-green-500"
            hoverBorder="hover:border-green-500/30"
            isDark={isDark}
          />
          <StatCard
            label="Booked Shoots"
            value={summaryData.bookedShoots}
            icon={Video}
            iconColor="text-[#E8D1AB]"
            hoverBorder="hover:border-[#E8D1AB]/30"
            isDark={isDark}
          />
          <StatCard
            label="Time Off"
            value={`${summaryData.timeOff} days`}
            icon={Clock}
            iconColor="text-red-400"
            hoverBorder="hover:border-red-400/30"
            isDark={isDark}
          />
        </div>

        <div className={`border rounded-2xl p-5 lg:p-6 transition-colors ${isDark ? "bg-[#101010] border-[#333]" : "bg-white border-gray-200 shadow-sm"}`}>
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${isDark ? "bg-black border-white/10 text-[#E8D1AB]" : "bg-[#F8F4EE] border-black/10 text-black"}`}>
                  <Clock size={18} />
                </div>
                <div>
                  <h2 className={`text-base lg:text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>
                    Normal Working Schedule
                  </h2>
                  <p className={`mt-1 text-xs lg:text-sm ${isDark ? "text-white/45" : "text-black/50"}`}>
                    Set once. Edit only when your regular availability changes.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 xl:min-w-[760px]">
              <div className={`rounded-lg border px-4 py-3 ${isDark ? "bg-black/30 border-white/10" : "bg-neutral-50 border-black/10"}`}>
                <p className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? "text-white/35" : "text-black/40"}`}>Days</p>
                <p className={`mt-1 truncate text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>
                  {hasSavedWeeklyRules ? getWeeklySummary(weeklyRules) : "Not set"}
                </p>
              </div>
              <div className={`rounded-lg border px-4 py-3 ${isDark ? "bg-black/30 border-white/10" : "bg-neutral-50 border-black/10"}`}>
                <p className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? "text-white/35" : "text-black/40"}`}>Hours</p>
                <p className={`mt-1 truncate text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>
                  {hasSavedWeeklyRules ? getRuleTimeSummary(weeklyRules) : "Not set"}
                </p>
              </div>
              <div className={`rounded-lg border px-4 py-3 ${isDark ? "bg-black/30 border-white/10" : "bg-neutral-50 border-black/10"}`}>
                <p className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? "text-white/35" : "text-black/40"}`}>Booking Notice</p>
                <p className={`mt-1 truncate text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>
                  {hasSavedWeeklyRules ? `${Math.round((weeklyRules[0]?.minimum_notice_minutes || 0) / 60)} hours` : "Not set"}
                </p>
              </div>
              <div className={`rounded-lg border px-4 py-3 ${isDark ? "bg-black/30 border-white/10" : "bg-neutral-50 border-black/10"}`}>
                <p className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? "text-white/35" : "text-black/40"}`}>Timezone</p>
                <p className={`mt-1 truncate text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>
                  {hasSavedWeeklyRules ? getTimeZoneLabel(weeklyRules[0]?.timezone || DEFAULT_CREATOR_TIMEZONE) : "Not set"}
                </p>
              </div>
            </div>

            <Button
              onClick={() => setIsWeeklyModalOpen(true)}
              disabled={isRulesLoading}
              className="bg-[#E8D1AB] text-black rounded-lg h-10 px-5 hover:bg-[#d4be9a] transition-colors font-semibold shrink-0"
            >
              <Pencil size={16} />
              {hasSavedWeeklyRules ? "Edit Schedule" : "Set Schedule"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Main Calendar Section */}
          <div className="col-span-12 lg:col-span-9 space-y-4 lg:space-y-6">
            <div className={`transition-colors duration-200 border rounded-2xl overflow-hidden shadow-2xl ${isDark ? "bg-[#101010] border-[#333]" : "bg-white border-gray-200"}`}>
              {/* Calendar Controls */}
              <div className={`p-4 lg:p-6 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${isDark ? "border-white/5" : "border-gray-100"}`}>
                <div className="flex items-center gap-4">
                  <div className={`flex items-center rounded-lg gap-2 lg:gap-4 p-1`}>
                    <button
                      onClick={() => handleMonthChange("prev")}
                      className={`h-8 w-8 flex items-center justify-center rounded-md transition-colors border ${isDark ? "hover:bg-white/5 text-white/60 bg-black border-white/10" : "hover:bg-gray-200 text-[#000000] bg-[#F0F0F0] border-[#0A0A0A33]"}`}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className={`lg:text-lg font-bold tracking-tight ${isDark ? "text-white" : "text-black"}`}>
                      {new Date(currentYear, currentMonth - 1).toLocaleString(
                        "default",
                        {
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </span>
                    <button
                      onClick={() => handleMonthChange("next")}
                      className={`h-8 w-8 flex items-center justify-center rounded-md transition-colors border ${isDark ? "hover:bg-white/5 text-white/60 bg-black border-white/10" : "hover:bg-gray-200 text-[#000000] bg-[#F0F0F0] border-[#0A0A0A33]"}`}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`px-4 py-2 border rounded-lg text-sm transition-all ${isDark ? "bg-transparent border-white/10 text-white/60 hover:text-white hover:border-[#E5D5B8]/40" : "bg-[#F0F0F0] border-[#E3E3E3] text-gray-600 hover:text-black shadow-sm"}`}
                    onClick={() => {
                      setCurrentMonth(new Date().getMonth() + 1);
                      setCurrentYear(new Date().getFullYear());
                    }}
                  >
                    Today
                  </Button>
                  {/* <div className="h-4 w-[1px] bg-white/10 mx-2" /> */}
                  {/* <Select>
                  <SelectTrigger className="w-[140px] bg-black border-white/10 text-white text-xs">
                    <SelectValue placeholder="All Events" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-white/10 text-white">
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="shoots">Shoots Only</SelectItem>
                  </SelectContent>
                </Select> */}
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 border-collapse">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (d, index) => (
                    <div
                      key={index}
                      className={`py-3 text-center text-[10px] font-bold uppercase tracking-widest border-b border-r last:border-r-0 ${isDark ? "text-white/30 bg-black/40 border-[#333]" : "text-[#7C7777] bg-[#EDEBEB] border-gray-100"}`}
                    >
                      {d}
                    </div>
                  )
                )}
                {renderCalendarDays()}
              </div>
            </div>
          </div>

          {/* Sidebar Info Section */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <div className={`rounded-lg lg:rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3`}>
              <Info className="text-blue-400 shrink-0 mt-0.5" size={18} />
              <p className={`text-xs leading-relaxed ${isDark ? "text-blue-200/70 " : "text-blue-400"}`}>
                Your availability is automatically blocked for confirmed shoots.
              </p>
            </div>

            <div className={`border rounded-2xl p-4 lg:p-6 transition-colors ${isDark ? "bg-[#101010] border-[#333]" : "bg-white border-gray-200 shadow-sm"}`}>
              <h3 className={`font-medium mb-2 lg:mb-4 ${isDark ? "text-white" : "text-black"}`}>Color Legend</h3>
              <div className="space-y-2 lg:space-y-4">
                <Legend color={isDark ? "bg-[#444]" : "bg-[#ECE7E2]"} label="Disabled" desc="Past or unavailable" isDark={isDark} />
                <Legend color="bg-[#E8D1AB]" label="Today" desc="Current date" isDark={isDark} />
                <Legend color="bg-blue-500" label="Shoots" desc="Confirmed projects" isDark={isDark} />
                <Legend color="bg-purple-500" label="Equipment" desc="Allocated gear" isDark={isDark} />
                <Legend color="bg-red-500" label="Conflicts" desc="Action required" isDark={isDark} />
              </div>
            </div>

            <div className={`border rounded-2xl p-4 lg:p-6 transition-colors ${isDark ? "bg-[#101010] border-[#333]" : "bg-white border-gray-200 shadow-sm"}`}>
              <h3 className={`font-medium mb-2 ${isDark ? "text-white" : "text-black"}`}>Google Calendar</h3>
              <p className={`text-sm mb-4 ${isDark ? "text-[#888]" : "text-gray-500"}`}>
                BEIGE only checks busy time ranges and does not read personal event details.
              </p>

              {calendarStatus?.connected ? (
                <div className="space-y-3">
                  <div className={`rounded-lg border p-3 ${isDark ? "border-white/10 bg-black/30" : "border-black/10 bg-neutral-50"}`}>
                    <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                      Connected
                    </p>
                    {calendarStatus.provider_account_email && (
                      <p className={`mt-1 truncate text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>
                        {calendarStatus.provider_account_email}
                      </p>
                    )}
                    <p className={`mt-1 text-xs ${calendarStatus.sync_status === "failed" ? "text-red-400" : isDark ? "text-white/40" : "text-black/40"}`}>
                      {calendarStatus.sync_status === "failed"
                        ? "Last sync failed"
                        : calendarStatus.last_synced_at
                          ? `Last synced ${format(new Date(calendarStatus.last_synced_at), "MMM d, h:mm a")}`
                          : "Ready to sync"}
                    </p>
                  </div>
                  <Button
                    onClick={handleGoogleSync}
                    disabled={isCalendarSyncing}
                    className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all active:scale-95 ${isDark ? "bg-[#E5D5B8] text-black hover:bg-[#d4c3a3]" : "bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/80 shadow-md"}`}
                  >
                    {isCalendarSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar size={16} />}
                    Sync Google Calendar
                  </Button>
                  <Button
                    onClick={handleGoogleDisconnect}
                    disabled={isCalendarLoading}
                    variant="outline"
                    className={`w-full rounded-lg ${isDark ? "border-white/10 bg-transparent text-white/70 hover:text-white" : "border-black/10 bg-white text-black/70 hover:text-black"}`}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleGoogleConnect}
                  disabled={isCalendarLoading}
                  className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all active:scale-95 ${isDark ? "bg-[#E5D5B8] text-black hover:bg-[#d4c3a3]" : "bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/80 shadow-md"}`}
                >
                  {isCalendarLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar size={16} />}
                  Connect Google Calendar
                </Button>
              )}
            </div>

            <div className={`border rounded-2xl p-4 lg:p-6 transition-colors ${isDark ? "bg-[#101010] border-[#333]" : "bg-white border-gray-200 shadow-sm"}`}>
              <h3 className={`font-medium mb-2 ${isDark ? "text-white" : "text-black"}`}>Quick Info</h3>
              <p className={`text-sm mb-4 ${isDark ? "text-[#888]" : "text-gray-500"}`}>
                Connected calendars refresh automatically when availability is checked. Use sync only when you need an immediate refresh.
              </p>
            </div>
          </div>
        </div>

        {isWeeklyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg">
            <div
              className={`w-full max-w-4xl mx-3 lg:mx-0 p-5 lg:p-7 relative shadow-2xl border max-h-[90vh] overflow-y-auto ${isDark ? "bg-[#111111] border-white/10 text-white" : "bg-white border-black/5 text-black"}`}
            >
              <button
                onClick={() => setIsWeeklyModalOpen(false)}
                className={`absolute top-4 right-4 transition-colors ${isDark ? "text-white/40 hover:text-[#E8D1AB]" : "text-black/40 hover:text-[#cbb38b]"}`}
              >
                <X size={20} />
              </button>

              <div className="mb-6 pr-8">
                <h2 className={`text-lg lg:text-2xl font-bold ${isDark ? "text-white" : "text-black"}`}>
                  Normal Working Schedule
                </h2>
                <p className={`mt-1 text-xs lg:text-sm ${isDark ? "text-white/45" : "text-black/45"}`}>
                  This is your default BEIGE availability. Calendar sync only removes busy time from these hours.
                </p>
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 mb-5 rounded-xl border p-4 ${isDark ? "border-white/10 bg-black/25" : "border-black/10 bg-neutral-50"}`}>
                <div>
                  <label className={`block text-[10px] uppercase font-bold tracking-widest mb-2 ${isDark ? "text-white/35" : "text-black/40"}`}>
                    Timezone
                  </label>
                  <Select
                    value={selectedWeeklyTimezone}
                    onValueChange={(value) => updateAllWeeklyRules({ timezone: value })}
                  >
                    <SelectTrigger className={`h-[44px] rounded-lg text-sm ${isDark ? "bg-black border-white/10 text-white" : "bg-white border-black/10 text-black"}`}>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent className={`max-h-72 border ${isDark ? "bg-[#1A1A1A] border-white/10 text-white" : "bg-white border-black/10 text-black"}`}>
                      {supportedTimeZones.map((timeZone) => (
                        <SelectItem key={timeZone.value} value={timeZone.value}>
                          {timeZone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className={`block text-[10px] uppercase font-bold tracking-widest mb-2 ${isDark ? "text-white/35" : "text-black/40"}`}>
                    Minimum Booking Notice
                  </label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={0}
                      value={selectedMinimumNoticeHours}
                      onChange={(event) =>
                        updateAllWeeklyRules({
                          minimum_notice_minutes: Math.max(Number(event.target.value || 0), 0) * 60,
                        })
                      }
                      className={`h-[44px] rounded-lg text-sm ${isDark ? "bg-black border-white/10 text-white" : "bg-white border-black/10 text-black"}`}
                    />
                    <span className={`text-sm ${isDark ? "text-white/45" : "text-black/45"}`}>hours</span>
                  </div>
                </div>
              </div>

              <div className={`hidden md:grid grid-cols-8 gap-3 px-3 pb-2 text-[10px] uppercase font-bold tracking-widest ${isDark ? "text-white/35" : "text-black/40"}`}>
                <span className="col-span-2">Day</span>
                <span className="col-span-3">Start</span>
                <span className="col-span-3">End</span>
              </div>

              <div className="space-y-2">
                {WEEK_DAYS.map((day) => {
                  const rule = weeklyRules.find((item) => item.day_of_week === day.value);
                  const isEnabled = Boolean(rule);

                  return (
                    <div
                      key={day.value}
                      className={`grid grid-cols-8 gap-3 items-center rounded-lg border p-3 ${isDark ? "border-white/10 bg-black/25" : "border-black/10 bg-neutral-50"}`}
                    >
                      <label className="col-span-8 md:col-span-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => toggleWeeklyDay(day.value)}
                          className={`w-4 h-4 rounded border ${isDark ? "border-white/10 bg-black" : "border-black/20 bg-white"}`}
                        />
                        <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>
                          {day.label}
                        </span>
                      </label>

                      <div className="col-span-4 md:col-span-3">
                        <TimePicker
                          label="Start"
                          value={parseTimeToDate(rule?.start_time)}
                          onChange={(time) =>
                            updateWeeklyRule(day.value, {
                              start_time: formatTimeForApi(time) || "10:00:00",
                            })
                          }
                          disabled={!isEnabled}
                          isDark={isDark}
                          height="42px"
                          fontSize="13px"
                        />
                      </div>

                      <div className="col-span-4 md:col-span-3">
                        <TimePicker
                          label="End"
                          value={parseTimeToDate(rule?.end_time)}
                          onChange={(time) =>
                            updateWeeklyRule(day.value, {
                              end_time: formatTimeForApi(time) || "18:00:00",
                            })
                          }
                          minTime={parseTimeToDate(rule?.start_time) || undefined}
                          disabled={!isEnabled}
                          isDark={isDark}
                          height="42px"
                          fontSize="13px"
                        />
                      </div>

                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className={`text-xs ${isDark ? "text-white/35" : "text-black/45"}`}>
                  {weeklyRules.length ? `${weeklyRules.length} working days enabled` : "No working days enabled"} · Booking notice prevents last-minute shoot requests.
                </p>
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    onClick={() => setIsWeeklyModalOpen(false)}
                    disabled={isRulesSaving}
                    variant="ghost"
                    className={`transition-colors ${isDark ? "text-white/45 hover:text-white" : "text-black/45 hover:text-black"}`}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveWeeklyRules}
                    disabled={isRulesSaving || isRulesLoading}
                    className="min-w-[140px] bg-[#E8D1AB] text-black rounded-lg h-10 px-5 hover:bg-[#d4be9a] transition-colors font-semibold"
                  >
                    {isRulesSaving ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving
                      </span>
                    ) : (
                      "Save Schedule"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedDay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg">
            <div
              className={`w-full max-w-2xl mx-3 lg:mx-0 p-5 lg:p-7 relative shadow-2xl border max-h-[90vh] overflow-y-auto ${isDark ? "bg-[#111111] border-white/10 text-white" : "bg-white border-black/5 text-black"}`}
            >
              <button
                onClick={() => setSelectedDay(null)}
                className={`absolute top-4 right-4 transition-colors ${isDark ? "text-white/40 hover:text-[#E8D1AB]" : "text-black/40 hover:text-[#cbb38b]"}`}
              >
                <X size={20} />
              </button>

              <div className="mb-6 pr-8">
                <p className={`text-[10px] uppercase font-bold tracking-widest mb-2 ${isDark ? "text-[#E8D1AB]" : "text-[#9B7B4F]"}`}>
                  Availability Slots
                </p>
                <h2 className={`text-xl lg:text-2xl font-bold ${isDark ? "text-white" : "text-black"}`}>
                  {formatDayHeading(selectedDay.date)}
                </h2>
                <p className={`mt-1 text-xs lg:text-sm ${isDark ? "text-white/45" : "text-black/45"}`}>
                  {getTimeZoneLabel(selectedDayTimezone)}
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div className={`rounded-xl border p-3 ${isDark ? "bg-black/30 border-white/10" : "bg-neutral-50 border-black/10"}`}>
                  <p className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${isDark ? "text-white/35" : "text-black/40"}`}>Status</p>
                  <p className={`text-sm font-semibold ${selectedDayStatus?.available ? "text-green-500" : selectedDayIsTimeOff ? "text-red-400" : isDark ? "text-white" : "text-black"}`}>
                    {selectedDayStatus?.projectAssigned
                      ? "Booked"
                      : selectedDayIsTimeOff
                        ? "Not Available"
                        : selectedDayStatus?.available
                          ? "Available"
                          : "Not Set"}
                  </p>
                </div>
                <div className={`rounded-xl border p-3 ${isDark ? "bg-black/30 border-white/10" : "bg-neutral-50 border-black/10"}`}>
                  <p className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${isDark ? "text-white/35" : "text-black/40"}`}>Working Hours</p>
                  <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>
                    {selectedDayHasWorkingHours
                      ? `${formatTimeForDisplay(selectedDayStatus?.start_time)} - ${formatTimeForDisplay(selectedDayStatus?.end_time)}`
                      : "Not set"}
                  </p>
                </div>
                <div className={`rounded-xl border p-3 ${isDark ? "bg-black/30 border-white/10" : "bg-neutral-50 border-black/10"}`}>
                  <p className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${isDark ? "text-white/35" : "text-black/40"}`}>Calendar Busy</p>
                  <p className="text-sm font-semibold text-amber-500">
                    {selectedDayBusyBlocks.length} slot{selectedDayBusyBlocks.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className={`rounded-xl border p-3 ${isDark ? "bg-black/30 border-white/10" : "bg-neutral-50 border-black/10"}`}>
                  <p className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${isDark ? "text-white/35" : "text-black/40"}`}>Shoots</p>
                  <p className={`text-sm font-semibold ${selectedDayStatus?.projectAssigned ? "text-blue-400" : isDark ? "text-white" : "text-black"}`}>
                    {selectedDayStatus?.projectAssigned ? "1 booked" : "0 booked"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {selectedDayWorkingRules.length > 0 ? (
                  selectedDayWorkingRules.map((rule, index) => (
                    <div
                      key={`${rule.start_time}-${rule.end_time}-${index}`}
                      className={`rounded-xl border p-4 flex items-start gap-3 ${isDark ? "bg-black/25 border-white/10" : "bg-neutral-50 border-black/10"}`}
                    >
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-green-500" />
                      <div>
                        <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>Working Slot</p>
                        <p className={`text-sm mt-1 ${isDark ? "text-white/55" : "text-black/55"}`}>
                          {formatTimeForDisplay(rule.start_time)} - {formatTimeForDisplay(rule.end_time)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`rounded-xl border p-4 ${isDark ? "bg-black/25 border-white/10 text-white/45" : "bg-neutral-50 border-black/10 text-black/45"}`}>
                    No regular working slot is set for this day.
                  </div>
                )}

                {selectedDayBusyBlocks.map((block, index) => (
                  <div
                    key={`${block.start_at}-${block.end_at}-${index}`}
                    className={`rounded-xl border p-4 flex items-start gap-3 ${isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"}`}
                  >
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <div>
                      <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>Google Calendar Busy</p>
                      <p className={`text-sm mt-1 ${isDark ? "text-white/55" : "text-black/55"}`}>
                        {formatDateTimeInTimeZone(block.start_at, selectedDayTimezone)} - {formatDateTimeInTimeZone(block.end_at, selectedDayTimezone)}
                      </p>
                    </div>
                  </div>
                ))}

                {selectedDayIsTimeOff && (
                  <div className={`rounded-xl border p-4 flex items-start gap-3 ${isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200"}`}>
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-red-400" />
                    <div>
                      <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>Manual Time Off</p>
                      <p className={`text-sm mt-1 ${isDark ? "text-white/55" : "text-black/55"}`}>
                        {selectedDayHasWorkingHours
                          ? `${formatTimeForDisplay(selectedDayStatus?.start_time)} - ${formatTimeForDisplay(selectedDayStatus?.end_time)}`
                          : "Full day"}
                      </p>
                    </div>
                  </div>
                )}

                {selectedDayStatus?.projectAssigned && (
                  <div className={`rounded-xl border p-4 flex items-start gap-3 ${isDark ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-200"}`}>
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>
                        {selectedDayStatus.projectDetails?.project_name || "Booked Shoot"}
                      </p>
                      <p className={`text-sm mt-1 ${isDark ? "text-white/55" : "text-black/55"}`}>
                        {selectedDayStatus.projectDetails?.start_time && selectedDayStatus.projectDetails?.end_time
                          ? `${formatTimeForDisplay(selectedDayStatus.projectDetails.start_time)} - ${formatTimeForDisplay(selectedDayStatus.projectDetails.end_time)}`
                          : "Time not set"}
                      </p>
                      {selectedDayStatus.projectDetails?.event_location && (
                        <p className={`text-xs mt-1 ${isDark ? "text-white/35" : "text-black/45"}`}>
                          {formatLocation(selectedDayStatus.projectDetails.event_location)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Availability Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg">
            <div
              className={`w-full max-w-lg mx-2 lg:mx-0 p-4 lg:p-8 relative shadow-2xl transition-colors duration-200 border
      ${isAnimating ? "animate-in fade-in zoom-in duration-200" : "animate-out fade-out zoom-out duration-200"}
      ${isDark ? "bg-[#111111] border-white/10 text-white" : "bg-white border-black/5 text-black"}
      max-h-[90vh] overflow-y-auto`}
            >
              <button
                onClick={handleModalClose}
                className={`absolute top-3 right-3 lg:top-6 lg:right-6 transition-colors ${isDark ? "text-white/40 hover:text-[#E8D1AB]" : "text-black/40 hover:text-[#cbb38b]"}`}
              >
                <X size={20} />
              </button>

              <h2 className={`text-lg lg:text-2xl font-bold mb-1 ${isDark ? "text-white" : "text-black"}`}>
                Add Availability
              </h2>
              <p className={`text-xs lg:text-sm mb-4 lg:mb-8 ${isDark ? "text-white/40" : "text-black/40"}`}>
                Schedule your working hours
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? "text-white/40" : "text-black/40"}`}>
                    Type
                  </label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleFormChange(value, "type")}
                  >
                    <SelectTrigger className={`w-full h-12 border ${isDark ? "bg-black border-white/10 text-white" : "bg-neutral-50 border-black/10 text-black"}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${formData.type === "1" ? "bg-green-500" : "bg-red-500"}`} />
                        <SelectValue placeholder="Select option" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className={`border ${isDark ? "bg-[#1A1A1A] border-white/10 text-white" : "bg-white border-black/10 text-black"}`}>
                      <SelectItem value="1">Available</SelectItem>
                      <SelectItem value="2">Not Available</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? "text-white/40" : "text-black/40"}`}>
                    Date
                  </label>
                  <DatePicker
                    label=""
                    value={parseLocalDate(selectedDate)}
                    minDate={new Date()}
                    isDark={isDark}
                    onChange={(d) => {
                      setSelectedDate(d);
                      if (formData.recurrence === "4") {
                        handleFormChange(d?.getDate().toString(), "monthlyDay");
                      }
                    }}
                  />
                </div>

                {!isAllDay && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? "text-white/40" : "text-black/40"}`}>
                        Start Time
                      </label>
                      <TimePicker
                        label=""
                        value={formData.startTime}
                        onChange={(time) => handleTimeChange(time, "startTime")}
                        isDark={isDark}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? "text-white/40" : "text-black/40"}`}>
                        End Time
                      </label>
                      <TimePicker
                        label=""
                        value={formData.endTime}
                        onChange={(time) => handleTimeChange(time, "endTime")}
                        minTime={
                          formData.startTime
                            ? addMinutesToTime(formData.startTime, 60)
                            : undefined
                        }
                        isDark={isDark}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    id="allDay"
                    checked={isAllDay}
                    onChange={handleAllDayChange}
                    className={`w-4 h-4 rounded border transition-colors ${isDark
                      ? "border-white/10 bg-black text-[#E8D1AB] focus:ring-[#E8D1AB]"
                      : "border-black/20 bg-neutral-50 text-[#cbb38b] focus:ring-[#cbb38b]"
                      }`}
                  />
                  <label htmlFor="allDay" className={`text-sm font-medium cursor-pointer ${isDark ? "text-white/80" : "text-black/80"}`}>
                    All day availability
                  </label>
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? "text-white/40" : "text-black/40"}`}>
                    Recurrence
                  </label>
                  <Select value={formData.recurrence} onValueChange={(value) => handleFormChange(value, "recurrence")}>
                    <SelectTrigger className={`w-full h-12 border ${isDark ? "bg-black border-white/10 text-white" : "bg-neutral-50 border-black/10 text-black"}`}>
                      <SelectValue placeholder="Does not repeat" />
                    </SelectTrigger>
                    <SelectContent className={`border ${isDark ? "bg-[#1A1A1A] border-white/10 text-white" : "bg-white border-black/10 text-black"}`}>
                      <SelectItem value="1">Does Not Repeat</SelectItem>
                      <SelectItem value="2">Daily</SelectItem>
                      <SelectItem value="3">Weekly</SelectItem>
                      <SelectItem value="4">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.recurrence !== "1" && (
                  <div className={`space-y-4 p-4 rounded-xl border transition-colors ${isDark ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"}`}>
                    {formData.recurrence === "2" && (
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="incWeekends"
                          checked={formData.includeWeekends}
                          onChange={(e) => handleFormChange(e.target.checked, "includeWeekends")}
                          className={`rounded border ${isDark ? "border-white/10 bg-black" : "border-black/20 bg-neutral-50"}`}
                        />
                        <label htmlFor="incWeekends" className={`text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
                          Include Weekends
                        </label>
                      </div>
                    )}

                    {formData.recurrence === "3" && (
                      <div className="space-y-3">
                        <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-white/40" : "text-black/40"}`}>
                          Repeat on
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                            const isSelected = formData.repeatOn.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => {
                                  const current = formData.repeatOn || [];
                                  const updated = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
                                  handleFormChange(updated, "repeatOn");
                                }}
                                className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${isSelected
                                  ? isDark
                                    ? "bg-[#E8D1AB] text-black border-[#E8D1AB]"
                                    : "bg-[#cbb38b] text-white border-[#cbb38b]"
                                  : isDark
                                    ? "bg-black text-white/60 border-white/10 hover:border-white/30"
                                    : "bg-neutral-50 text-black/60 border-black/10 hover:border-black/30"
                                  }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* MONTHLY */}
                    {formData.recurrence === "4" && (
                      <div className={`flex items-center gap-2 text-sm ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>
                        <span>Repeat on Day</span>
                        <input
                          type="text"
                          value={formData.monthlyDay ?? ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            if (val === "" || (Number(val) >= 1 && Number(val) <= 31)) {
                              handleFormChange(val, "monthlyDay");
                            }
                          }}
                          className={`w-14 px-2 py-1 rounded-lg border text-center outline-none focus:ring-2 transition-colors ${isDark
                            ? "bg-neutral-800 border-neutral-700 text-white focus:ring-[#E8D1AB]"
                            : "bg-white border-neutral-200 text-neutral-900 focus:ring-[#cbb38b]"
                            }`}
                        />
                        <span>of each month</span>
                      </div>
                    )}
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-white/40" : "text-black/40"}`}>
                        Until Date
                      </label>
                      <DatePicker
                        label=""
                        value={formData.untilDate}
                        minDate={parseLocalDate(selectedDate) || new Date()}
                        isDark={isDark}
                        onChange={(d) => handleFormChange(d, "untilDate")}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={handleModalClose}
                    disabled={isSubmitting}
                    variant="ghost"
                    className={`transition-colors ${isDark ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"}`}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className={`min-w-[150px] font-bold px-8 rounded-xl transition-colors text-black ${isDark ? "bg-[#E8D1AB] hover:bg-[#d4be9a]" : "bg-[#cbb38b] hover:bg-[#bfa57c]"}`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Hover Card for Project Details */}
        {hoveredProject && (
          <div
            className={`fixed z-50 w-[420px] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150 border transition-colors ${isDark
              ? "bg-[#111111] border-[#E8D1AB]/30 text-white"
              : "bg-white border-[#cbb38b]/40 text-black"
              }`}
            style={{
              top: hoverPosition.y,
              left: hoverPosition.x,
            }}
            onMouseLeave={handleDateLeave}
          >
            {/* Header */}
            <div className={`p-6 border-b ${isDark ? "border-white/10" : "border-black/5"}`}>
              <span className={`inline-block mb-3 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${isDark
                ? "bg-[#E8D1AB]/10 text-[#E8D1AB] border-[#E8D1AB]/20"
                : "bg-[#cbb38b]/15 text-[#cbb38b] border-[#cbb38b]/30"
                }`}>
                Active Project
              </span>

              <h3 className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-black"}`}>
                {hoveredProject.project_name}
              </h3>

              <div className={`flex flex-wrap gap-4 text-xs ${isDark ? "text-white/60" : "text-black/60"}`}>
                <span className="flex items-center gap-2">
                  <Calendar size={14} className={isDark ? "text-[#E8D1AB]" : "text-[#cbb38b]"} />
                  {hoveredProject.date}
                </span>

                <span className="flex items-center gap-2">
                  <MapPin size={14} className={isDark ? "text-[#E8D1AB]" : "text-[#cbb38b]"} />
                  {formatLocation(hoveredProject.event_location)}
                </span>

                <span className="flex items-center gap-2">
                  <Clock size={14} className={isDark ? "text-[#E8D1AB]" : "text-[#cbb38b]"} />
                  12:00 PM – 4:00 PM
                </span>
              </div>
            </div>

            {/* Middle Section */}
            <div className={`grid grid-cols-2 divide-x border-b ${isDark
              ? "divide-white/10 border-white/10 bg-white/[0.01]"
              : "divide-black/5 border-black/5 bg-black/[0.01]"
              }`}>
              {/* Streaming */}
              <div className="p-5">
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? "text-white/40" : "text-black/40"}`}>
                  Streaming Platforms
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium border rounded-lg ${isDark ? "border-white/5 bg-black text-white/80" : "border-black/5 bg-neutral-50 text-black/80"
                    }`}>
                    <Video size={12} className={isDark ? "text-[#E8D1AB]" : "text-[#cbb38b]"} /> YouTube
                  </span>
                  <span className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium border rounded-lg ${isDark ? "border-white/5 bg-black text-white/80" : "border-black/5 bg-neutral-50 text-black/80"
                    }`}>
                    <Mic size={12} className={isDark ? "text-[#E8D1AB]" : "text-[#cbb38b]"} /> Twitch
                  </span>
                  <span className={`px-2 py-1 text-[10px] font-medium border rounded-lg ${isDark ? "border-white/5 bg-black text-white/40" : "border-black/5 bg-neutral-50 text-black/40"
                    }`}>
                    +4
                  </span>
                </div>
              </div>

              {/* Equipment */}
              <div className="p-5">
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? "text-white/40" : "text-black/40"
                  }`}>
                  Equipment Assigned
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium border rounded-lg ${isDark ? "border-white/5 bg-black text-white/80" : "border-black/5 bg-neutral-50 text-black/80"
                    }`}>
                    📷 Camera
                  </span>
                  <span className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium border rounded-lg ${isDark ? "border-white/5 bg-black text-white/80" : "border-black/5 bg-neutral-50 text-black/80"
                    }`}>
                    🎥 Video
                  </span>
                  <span className={`px-2 py-1 text-[10px] font-medium border rounded-lg ${isDark ? "border-white/5 bg-black text-white/40" : "border-black/5 bg-neutral-50 text-black/40"
                    }`}>
                    +3
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`p-4 px-6 flex items-center justify-between ${isDark ? "bg-black/20" : "bg-neutral-50"
              }`}>
              <span className={`text-[10px] font-medium uppercase tracking-tight ${isDark ? "text-white/30" : "text-black/40"
                }`}>
                Last Updated 4h ago
              </span>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
}

/* Helper Components */
function Legend({ color, label, desc, isDark = true }: { color: string; label: string; desc: string; isDark?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
      <div>
        <p className={`text-sm font-medium mb-1 ${isDark ? "text-[#E0E0E0]" : "text-[#3A3A3A]"}`}>{label}</p>
        <p className={`text-xs ${isDark ? "text-[#666]" : "text-[#929292]"}`}>{desc}</p>
      </div>
    </div>
  );
}

function EventDot({ color, label, isDark = true }: { color: string; label: string; isDark?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      <span className={`truncate text-[10px] font-medium ${isDark ? "text-white/60" : "text-black/60"}`}>{label}</span>
    </div>
  );
}
