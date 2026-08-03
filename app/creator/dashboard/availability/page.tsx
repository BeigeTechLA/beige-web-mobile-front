"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  Trash2,
  Calendar,
  MapPin,
  Clock,
  Video,
  Mic,
  Plus,
  CheckCircle,
  Loader2,
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
import { getCrewAvailability, GetUpcomingShoots, AddAvailability } from "@/lib/api";
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
  recurrence: "1",
  includeWeekends: false,
  repeatOn: [],
  monthlyDay: "",
  untilDate: null,
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

const parseDateOnlyToLocalDate = (value) => {
  if (!value) return null;

  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
};

const parseTimeToDate = (value) => {
  const time = formatTimeForApi(value);
  if (!time) return null;

  const [hours, minutes, seconds] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, seconds || 0, 0);
  return date;
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

const createEmptySlotRow = (defaults = {}) => ({
  id: defaults.id ?? null,
  availability_status: String(defaults.availability_status ?? "1"),
  startTime: defaults.start_time ? String(defaults.start_time).slice(0, 5) : "",
  endTime: defaults.end_time ? String(defaults.end_time).slice(0, 5) : "",
  notes: defaults.notes ?? "",
  location: defaults.location ?? "",
  isFullDay: Number(defaults.is_full_day) === 1,
  recurrence: Number(defaults.recurrence || 1),
  recurrence_until: parseDateOnlyToLocalDate(defaults.recurrence_until),
  recurrence_days: defaults.recurrence_days ?? null,
  recurrence_day_of_month: defaults.recurrence_day_of_month ?? null,
});

const normalizeSlotsForApi = (slots = []) =>
  slots.map((slot) => ({
    id: slot.id ?? null,
    availability_status: Number(slot.availability_status) === 1 ? 1 : 2,
    start_time: slot.isFullDay ? null : formatTimeForApi(slot.startTime),
    end_time: slot.isFullDay ? null : formatTimeForApi(slot.endTime),
    notes: slot.notes || "",
    location: slot.location || "",
    is_full_day: slot.isFullDay || !slot.startTime || !slot.endTime ? 1 : 0,
  }));

const getSlotRange = (slot) => {
  if (slot.isFullDay || (!slot.startTime && !slot.endTime)) {
    return { start: 0, end: 24 * 60, fullDay: true };
  }

  const start = timeToMinutes(slot.startTime);
  const end = timeToMinutes(slot.endTime);

  return {
    start,
    end,
    fullDay: false,
  };
};

const slotsOverlap = (left, right) => {
  if (left.fullDay || right.fullDay) {
    return true;
  }

  if (left.start === null || left.end === null || right.start === null || right.end === null) {
    return false;
  }

  return left.start < right.end && right.start < left.end;
};

const normalizeRecurrenceDaysForForm = (value) => {
  if (!value) return [];

  const days = Array.isArray(value)
    ? value
    : (() => {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : String(value).split(",");
        } catch (error) {
          return String(value).split(",");
        }
      })();

  return days
    .map((day) => String(day).trim())
    .filter(Boolean)
    .map((day) => day.slice(0, 3).toLowerCase())
    .map((day) => day.charAt(0).toUpperCase() + day.slice(1));
};

export default function AvailabilityPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDateLocked, setIsDateLocked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [upcomingShoots, setUpcomingShoots] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projectDetails, setProjectDetails] = useState(null);
  const [projectLoading, setProjectLoading] = useState(false);
  const pathname = usePathname();
  const { isDark } = useResolvedTheme();

  const [formData, setFormData] = useState(getDefaultFormData);
  const [slotRows, setSlotRows] = useState([createEmptySlotRow()]);

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

  const loadSlotsForModal = (dayData = null) => {
    const existingSlots = Array.isArray(dayData?.slots) && dayData.slots.length
      ? dayData.slots.map((slot) => createEmptySlotRow(slot))
      : [createEmptySlotRow()];

    const primarySlot = existingSlots[0] || createEmptySlotRow();
    const recurrenceType = Number(primarySlot?.recurrence || dayData?.recurrence || 1);

    setSlotRows(existingSlots);
    setFormData((prev) => ({
      ...getDefaultFormData(),
      recurrence: String(recurrenceType),
      includeWeekends:
        recurrenceType === 2
          ? !(dayData?.recurrence_days && normalizeRecurrenceDaysForForm(dayData.recurrence_days).length === 5)
          : prev.includeWeekends || false,
      repeatOn: recurrenceType === 3
        ? normalizeRecurrenceDaysForForm(primarySlot?.recurrence_days || dayData?.recurrence_days)
        : [],
      monthlyDay: recurrenceType === 4
        ? String(primarySlot?.recurrence_day_of_month || dayData?.recurrence_day_of_month || "")
        : "",
      untilDate: primarySlot?.recurrence_until
        ? parseDateOnlyToLocalDate(primarySlot.recurrence_until)
        : dayData?.recurrence_until
          ? parseDateOnlyToLocalDate(dayData.recurrence_until)
          : null,
    }));
  };

  const validateSlotRows = (rows) => {
    const normalized = rows.map((row) => ({
      ...row,
      availability_status: Number(row.availability_status) === 1 ? 1 : 2,
      startTime: row.startTime ? String(row.startTime).trim() : "",
      endTime: row.endTime ? String(row.endTime).trim() : "",
      notes: row.notes ? String(row.notes).trim() : "",
      location: row.location ? String(row.location).trim() : "",
      isFullDay: Boolean(row.isFullDay),
    }));

    for (const row of normalized) {
      if (![1, 2].includes(Number(row.availability_status))) {
        return { error: "Please choose an availability status for every slot." };
      }

      if (!row.isFullDay) {
        if (!row.startTime || !row.endTime) {
          return { error: "Start time and end time are required for every slot." };
        }

        const startMinutes = timeToMinutes(row.startTime);
        const endMinutes = timeToMinutes(row.endTime);

        if (startMinutes === null || endMinutes === null || startMinutes >= endMinutes) {
          return { error: "Start time must be before end time." };
        }
      }
    }

    for (let i = 0; i < normalized.length; i += 1) {
      for (let j = i + 1; j < normalized.length; j += 1) {
        const left = getSlotRange(normalized[i]);
        const right = getSlotRange(normalized[j]);

        if (slotsOverlap(left, right)) {
          return { error: "This time is already covered by another slot. Please choose a different range." };
        }
      }
    }

    const fingerprints = new Set();
    for (const row of normalized) {
      const fingerprint = [
        row.availability_status,
        row.isFullDay ? "full" : "partial",
        row.startTime || "",
        row.endTime || "",
        row.notes || "",
        row.location || "",
      ].join("|");

      if (fingerprints.has(fingerprint)) {
        return { error: "Duplicate slots are not allowed." };
      }

      fingerprints.add(fingerprint);
    }

    return { rows: normalized };
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
    const validation = validateSlotRows(slotRows);
    if (validation.error) {
      toast.error(validation.error);
      return;
    }

    const normalizedSlots = normalizeSlotsForApi(validation.rows);

    const payload = {
      crew_member_id: crewMemberId,
      date: formattedDate,
      slots: normalizedSlots,
      recurrence: Number(formData.recurrence),
      recurrence_until: formData.untilDate
        ? format(new Date(formData.untilDate), "yyyy-MM-dd")
        : null,
    };

    if (formData.recurrence !== "1") {
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
      setSlotRows([createEmptySlotRow()]);

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
      const typedError = error as {
        response?: {
          data?: {
            message?: string;
            data?: {
              conflicts?: Array<{
                project_id?: number;
                project_name?: string;
                date?: string;
              }>;
            };
          };
          status?: number;
        };
      };
      const errorData = typedError.response?.data;
      const errorStatus = typedError.response?.status;

      if (errorStatus === 409 || errorData?.data?.conflicts?.length) {
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

  const handleModalOpen = (dateValue = null, dayData = null) => {
    setSelectedDate(dateValue);
    setIsDateLocked(Boolean(dateValue));
    loadSlotsForModal(dayData);
    setIsModalOpen(true);
    setIsAnimating(true);
  };

  const handleModalClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsModalOpen(false);
      setSelectedDate(null);
      setIsDateLocked(false);
      setFormData(getDefaultFormData());
      setSlotRows([createEmptySlotRow()]);
    }, 300);
  };

  const handleFormChange = (value, name) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSlotChange = (index, field, value) => {
    setSlotRows((prevRows) =>
      prevRows.map((row, rowIndex) => {
        if (rowIndex !== index) return row;

        if (field === "isFullDay" && value === true) {
          return {
            ...row,
            isFullDay: true,
            startTime: "",
            endTime: "",
          };
        }

        if (field === "startTime") {
          const normalizedStartTime = formatTimeForApi(value);
          const minimumEndTime = addMinutesToTime(normalizedStartTime, 60);
          const currentEndMinutes = timeToMinutes(row.endTime);
          const minimumEndMinutes = timeToMinutes(minimumEndTime);
          const shouldUpdateEndTime =
            normalizedStartTime &&
            (
              currentEndMinutes === null ||
              minimumEndMinutes === null ||
              currentEndMinutes < minimumEndMinutes
            );

          return {
            ...row,
            isFullDay: false,
            startTime: normalizedStartTime || "",
            endTime: shouldUpdateEndTime ? formatTimeForApi(minimumEndTime) || "" : row.endTime,
          };
        }

        if (field === "endTime") {
            const startMinutes = timeToMinutes(row.startTime);
          const normalizedEndTime = formatTimeForApi(value);
          const endMinutes = timeToMinutes(normalizedEndTime);

          if (row.startTime && normalizedEndTime && (startMinutes === null || endMinutes === null || startMinutes >= endMinutes)) {
            toast.error("End time must be after the start time");
            return row;
          }

          return {
            ...row,
            isFullDay: false,
            endTime: normalizedEndTime || "",
          };
        }

        return {
          ...row,
          [field]: value,
        };
      })
    );
  };

  const addSlotRow = () => {
    setSlotRows((prevRows) => [...prevRows, createEmptySlotRow()]);
  };

  const removeSlotRow = (index) => {
    setSlotRows((prevRows) => {
      if (prevRows.length === 1) {
        return [createEmptySlotRow()];
      }

      return prevRows.filter((_, rowIndex) => rowIndex !== index);
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
      const slotCount = Number(availabilityStatus?.slotCount || availabilityStatus?.slots?.length || 0);

      const isAvailable = availabilityValue === true;
      const isNotAvailable = availabilityValue === false;
      const isPartial = Boolean(availabilityStatus?.hasMixedAvailability || (slotCount > 1 && availabilityValue === null));

      const isAssigned =
        availabilityStatus?.projectAssigned === true;
      const primarySlot = Array.isArray(availabilityStatus?.slots) && availabilityStatus.slots.length
        ? availabilityStatus.slots[0]
        : null;
      const startTimeDisplay = formatTimeForDisplay(primarySlot?.start_time || availabilityStatus?.start_time);
      const endTimeDisplay = formatTimeForDisplay(primarySlot?.end_time || availabilityStatus?.end_time);
      const hasTimeRange = Boolean(startTimeDisplay && endTimeDisplay);
      const showAvailabilityCount = !isAssigned && !isNotAvailable && slotCount > 1;
      const showSingleTimeRange = !isAssigned && slotCount === 1 && hasTimeRange;

      const isPastDate = dateString < todayDateString;
      const isToday = dateString === todayDateString;

      // Background logic matching the high-end dashboard
      const cardBackground = isDark
        ? (
          isPastDate
            ? "bg-[#161616] opacity-90"
            : isPartial
              ? "bg-[#1C1912]"
              : isAvailable
                ? "bg-[#111]"
                : isAssigned
                  ? "bg-[#101522]"
                  : "bg-[#161616]"
        )
        : (
          isPastDate
            ? "bg-[#F4F4F4] opacity-80"
            : isPartial
              ? "bg-[#FFF5E8]"
              : isAvailable
                ? "bg-[#F8F4EE]"
                : isAssigned
                  ? "bg-[#EEF4FF]"
                  : "bg-white"
        );

      const textColor = isDark
        ? (isAvailable || isPartial || isAssigned ? "text-white" : "text-white/30")
        : (isAvailable || isPartial || isAssigned ? "text-black" : "text-black/30");
      const borderColor = isDark ? "border-white/5" : "border-[#E5E5E5]";

      const handleDateClick = () => {
        if (isAssigned) {
          showAvailabilityConflictToast(
            "Availability cannot be changed because you have an assigned shoot on this date.",
            [
              {
                project_id: availabilityStatus?.projectDetails?.project_id,
                project_name: availabilityStatus?.projectDetails?.project_name,
                date: dateString,
              },
            ]
          );
          return;
        }

        if (isPastDate) return;

        handleModalOpen(dateString, availabilityStatus);
      };

      const handleDateHover = (e: React.MouseEvent<HTMLDivElement>) => {
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
          className={`h-28 p-3 border text-xs transition-all duration-200 ${cardBackground} ${textColor} ${borderColor} ${isAssigned ? "cursor-pointer" : "cursor-default"} ${isDark
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
              {showAvailabilityCount && (
                <div className="flex items-center gap-1 text-[10px] font-medium">
                  <Clock size={11} className="shrink-0" />
                  <span>{slotCount} available times</span>
                </div>
              )}
              {isAvailable && !isAssigned && !isPartial && !showAvailabilityCount && !showSingleTimeRange && (
                <div className="flex items-center gap-1 text-green-500/70">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="hidden lg:block">Available</span>
                </div>
              )}

              {isNotAvailable && !isAssigned && !isPartial && !showAvailabilityCount && !showSingleTimeRange && (
                <div className="flex items-center gap-1 text-red-400/75">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span className="hidden lg:block">Not Available</span>
                </div>
              )}
              {showSingleTimeRange && (
                <div className={`space-y-1 text-[10px] font-medium ${isNotAvailable ? "text-red-400/70" : "text-green-500/80"} ${isDark && isAvailable ? "text-green-400/90" : ""}`}>
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${isNotAvailable ? "bg-red-400" : "bg-green-500"}`} />
                    <span>{isNotAvailable ? "Not Available" : "Available"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={11} className="shrink-0" />
                    <span>{startTimeDisplay} - {endTimeDisplay}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return calendarDays;
  };

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
              <h3 className={`font-medium mb-2 ${isDark ? "text-white" : "text-black"}`}>Quick Info</h3>
              <p className={`text-sm mb-4 ${isDark ? "text-[#888]" : "text-gray-500"}`}>
                Keep your calendar updated to receive more project invitations. Confirmed bookings will appear with a blue marker.
              </p>
              <Button
                className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all active:scale-95 ${isDark ? "bg-[#E5D5B8] text-black hover:bg-[#d4c3a3]" : "bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/80 shadow-md"}`}
              >
                Sync Calendar
              </Button>
            </div>
          </div>
        </div>

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
              <p className={`text-xs lg:text-sm mb-4 lg:mb-6 ${isDark ? "text-white/40" : "text-black/40"}`}>
                Schedule your working hours
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? "text-white/40" : "text-black/40"}`}>
                    Type
                  </label>
                  <Select
                    value={slotRows[0]?.availability_status || "1"}
                    onValueChange={(value) => handleSlotChange(0, "availability_status", value)}
                  >
                    <SelectTrigger className={`w-full h-12 border ${isDark ? "bg-black border-white/10 text-white" : "bg-neutral-50 border-black/10 text-black"}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${slotRows[0]?.availability_status === "1" ? "bg-green-500" : "bg-red-500"}`} />
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
                    disabled={isDateLocked}
                    onChange={(d) => {
                      if (isDateLocked) return;
                      const nextDate = d ? format(d, "yyyy-MM-dd") : null;
                      setSelectedDate(nextDate);
                      if (formData.recurrence === "4") {
                        handleFormChange(d?.getDate().toString() || "", "monthlyDay");
                      }
                    }}
                  />
                </div>

                <div className="space-y-4">
                  {slotRows.map((slot, index) => (
                    <div
                      key={slot.id ?? index}
                      className={`rounded-2xl border p-4 lg:p-5 space-y-4 transition-colors ${isDark
                        ? "border-white/10 bg-white/[0.03]"
                        : "border-black/10 bg-neutral-50"
                        }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <span className={`text-xs font-semibold uppercase tracking-widest ${isDark ? "text-white/35" : "text-black/35"}`}>
                            Slot {index + 1}
                          </span>
                        </div>

                        {slotRows.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeSlotRow(index)}
                            variant="ghost"
                            className={`h-auto px-0 ${isDark ? "text-white/45 hover:text-white hover:bg-transparent" : "text-black/45 hover:text-black hover:bg-transparent"}`}
                          >
                            <Trash2 size={16} className="mr-2" />
                            Remove
                          </Button>
                        )}
                      </div>

                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? "text-white/40" : "text-black/40"}`}>
                          Type
                        </label>
                        <Select value={slot.availability_status} onValueChange={(value) => handleSlotChange(index, "availability_status", value)}>
                          <SelectTrigger className={`w-full h-12 border ${isDark ? "bg-black border-white/10 text-white" : "bg-neutral-50 border-black/10 text-black"}`}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${slot.availability_status === "1" ? "bg-green-500" : "bg-red-500"}`} />
                              <SelectValue placeholder="Select option" />
                            </div>
                          </SelectTrigger>
                          <SelectContent className={`border ${isDark ? "bg-[#1A1A1A] border-white/10 text-white" : "bg-white border-black/10 text-black"}`}>
                            <SelectItem value="1">Available</SelectItem>
                            <SelectItem value="2">Not Available</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-3 py-1">
                        <input
                          type="checkbox"
                          id={`full-day-${index}`}
                          checked={slot.isFullDay}
                          onChange={(e) => handleSlotChange(index, "isFullDay", e.target.checked)}
                          className={`w-4 h-4 rounded border transition-colors ${isDark
                            ? "border-white/10 bg-black text-[#E8D1AB] focus:ring-[#E8D1AB]"
                            : "border-black/20 bg-neutral-50 text-[#cbb38b] focus:ring-[#cbb38b]"
                            }`}
                        />
                        <label htmlFor={`full-day-${index}`} className={`text-sm font-medium cursor-pointer ${isDark ? "text-white/80" : "text-black/80"}`}>
                          All day availability
                        </label>
                      </div>

                      {!slot.isFullDay && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? "text-white/40" : "text-black/40"}`}>
                              Start Time
                            </label>
                            <TimePicker
                              label=""
                              value={parseTimeToDate(slot.startTime)}
                              onChange={(time) => handleSlotChange(index, "startTime", time)}
                              isDark={isDark}
                            />
                          </div>
                          <div>
                            <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? "text-white/40" : "text-black/40"}`}>
                              End Time
                            </label>
                            <TimePicker
                              label=""
                              value={parseTimeToDate(slot.endTime)}
                              onChange={(time) => handleSlotChange(index, "endTime", time)}
                              minTime={slot.startTime ? addMinutesToTime(slot.startTime, 60) : undefined}
                              isDark={isDark}
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? "text-white/40" : "text-black/40"}`}>
                            Notes
                          </label>
                          <Textarea
                            value={slot.notes || ""}
                            onChange={(e) => handleSlotChange(index, "notes", e.target.value)}
                            placeholder="Optional notes"
                            className={`${isDark ? "bg-black border-white/10 text-white placeholder:text-white/30" : "bg-white border-black/10 text-black placeholder:text-black/30"}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? "text-white/40" : "text-black/40"}`}>
                            Location
                          </label>
                          <Input
                            value={slot.location || ""}
                            onChange={(e) => handleSlotChange(index, "location", e.target.value)}
                            placeholder="Optional location"
                            className={`${isDark ? "bg-black border-white/10 text-white placeholder:text-white/30" : "bg-white border-black/10 text-black placeholder:text-black/30"}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  onClick={addSlotRow}
                  variant="ghost"
                  className={`px-0 h-auto font-medium ${isDark ? "text-[#E8D1AB] hover:text-[#f2e2c6] hover:bg-transparent" : "text-[#8a7043] hover:text-[#6f5636] hover:bg-transparent"}`}
                >
                  <Plus size={16} className="mr-2" />
                  Add Another Slot
                </Button>

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

                    {formData.recurrence === "4" && (
                      <div className={`flex items-center gap-2 text-sm flex-wrap ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>
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
