"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
  Video,
  Mic,
  Plus,
  CheckCircle,
} from "lucide-react";

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
import { getCrewAvailability, GetUpcomingShoots, getProjectDetails, AddAvailability } from "@/lib/api";
import DatePicker from "@/components/ui/Datepicker";
import TimePicker from "@/components/ui/Timepicker";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { StatCard } from "@/components/admin/StatCard";

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

export default function AvailabilityPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAllDay, setIsAllDay] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [upcomingShoots, setUpcomingShoots] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projectDetails, setProjectDetails] = useState(null);
  const [projectLoading, setProjectLoading] = useState(false);

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
            !availabilityStatus.available &&
            !availabilityStatus.projectAssigned
          ) {
            timeOff += 1;
          }
        }
      }

      setSummaryData({ availableDays, bookedShoots, timeOff });
    };

    getSummaryData();
  }, [availability]);

  const handleSubmit = async (e) => {
    e.preventDefault();

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

    if (!isAllDay && !hasTimeRange) {
      toast.error("Please select both start and end time");
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

    try {
      await AddAvailability(payload);
      setIsModalOpen(false);

      toast.custom(
        (t) => (
          <div
            className={`${t.visible ? "animate-enter" : "animate-leave"
              } max-w-lg w-full bg-[#111] border border-[#E8D1AB]/40 shadow-lg rounded-xl pointer-events-auto flex relative overflow-hidden`}
          >
            <div className="flex-1 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="w-10 h-10 rounded-full bg-[#E8D1AB]/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-[#E8D1AB]" />
                  </div>
                </div>
                <div className="ml-3 flex-1 pr-6">
                  <p className="text-base font-bold text-white">
                    Availability Updated
                  </p>
                  <p className="mt-1 text-sm text-white/60 leading-relaxed">
                    Your schedule has been successfully updated.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ),
        { position: "bottom-right" }
      );

      const response = await getCrewAvailability({
        crew_member_id: crewMemberId,
        month: currentMonth,
        year: currentYear,
      });

      if (response?.data?.data?.availability) {
        setAvailability(response.data.data.availability);
      }
    } catch (error) {
      console.error("Error adding availability:", error);
      toast.error("Update Failed");
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
    setFormData((prevData) => ({
      ...prevData,
      [field]: time,
    }));
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
      calendarDays.push(<div key={`empty-${i}`} className="h-28 bg-[#0D0D0D]/50 border border-white/5" />);
    }

    const today = new Date();
    const todayDateString = format(today, "yyyy-MM-dd");

    for (let i = 1; i <= daysInMonth; i++) {
      const dateString = `${currentYear}-${currentMonth < 10 ? "0" + currentMonth : currentMonth
        }-${i < 10 ? "0" + i : i}`;
      const availabilityStatus = availability[dateString];

      const isAvailable = availabilityStatus?.available || availabilityStatus?.projectAssigned;
      const isAssigned = availabilityStatus?.projectAssigned;
      const startTimeDisplay = formatTimeForDisplay(availabilityStatus?.start_time);
      const endTimeDisplay = formatTimeForDisplay(availabilityStatus?.end_time);
      const hasTimeRange = Boolean(startTimeDisplay && endTimeDisplay);

      const isPastDate = dateString < todayDateString;
      const isToday = dateString === todayDateString;

      // Background logic matching the high-end dashboard
      const cardBackground = isPastDate
        ? "bg-[#0D0D0D] opacity-40"
        : isAvailable
          ? "bg-[#111]"
          : "bg-[#161616]";

      const textColor = isAvailable ? "text-white" : "text-white/30";

      const handleDateClick = () => {
        if (!isPastDate) {
          setSelectedDate(dateString);
          handleModalOpen();
        }
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
          className={`h-28 p-3 border border-white/5 text-xs transition-all duration-200
    ${cardBackground} ${textColor}
    ${!isPastDate ? "cursor-pointer" : ""} hover:border-[#E8D1AB]/30 hover:bg-[#1A1A1A] group`}
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
                      <EventDot color="bg-blue-500" label="Shoot" />
                      <EventDot color="bg-[#E8D1AB]" label="Booked" />
                    </>
                  )}
                </div>
              )}
              {isAvailable && !isAssigned && (
                <>
                  <div className="flex items-center gap-1 text-green-500/70">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="hidden lg:block">Available</span>
                  </div>
                </>
              )}
              {!isAvailable && !isAssigned && (
                <div className="flex items-center gap-1 text-red-400/75">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span className="hidden lg:block">Not Available</span>
                </div>
              )}
              {hasTimeRange && (
                <div className={`hidden lg:flex items-center gap-1 ${isAvailable ? "text-white/45" : "text-red-200/60"}`}>
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


  return (
    <div className="mx-auto space-y-4 lg:space-y-8 pb-6 lg:pb-12 px-0 bg-transparent text-white">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Manage Availability</h1>
          <p className="text-white/60 text-sm lg:text-base">Set your available dates and times for upcoming projects</p>
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
        />
        <StatCard
          label="Booked Shoots"
          value={summaryData.bookedShoots}
          icon={Video}
          iconColor="text-[#E8D1AB]"
          hoverBorder="hover:border-[#E8D1AB]/30"
        />
        <StatCard
          label="Time Off"
          value={`${summaryData.timeOff} days`}
          icon={Clock}
          iconColor="text-red-400"
          hoverBorder="hover:border-red-400/30"
        />
      </div>

      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        {/* Main Calendar Section */}
        <div className="col-span-12 lg:col-span-9 space-y-4 lg:space-y-6">
          <div className="bg-[#111] border border-white/5 rounded-lg lg:rounded-2xl overflow-hidden shadow-2xl">
            {/* Calendar Controls */}
            <div className="p-4 lg:p-6 border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-black rounded-lg border border-white/10 p-1">
                  <button
                    onClick={() => handleMonthChange("prev")}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/60 transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => handleMonthChange("next")}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/60 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <span className="lg:text-lg font-bold text-white tracking-tight">
                  {format(new Date(currentYear, currentMonth - 1), 'MMMM yyyy')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-white/10 text-white/60 hover:text-white hover:border-[#E8D1AB]/40"
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
                    className="py-3 text-center text-[10px] font-bold uppercase tracking-widest text-white/30 bg-black/40 border-b border-r border-white/5"
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
          <div className="rounded-lg lg:rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3">
            <Info className="text-blue-400 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-blue-200/70 leading-relaxed">
              Your availability is automatically blocked for confirmed shoots.
            </p>
          </div>

          <div className="bg-[#111] border border-white/5 rounded-lg lg:rounded-xl p-4 lg:p-6">
            <h3 className="text-sm font-bold text-white mb-4 lg:mb-6 uppercase tracking-wider">Color Legend</h3>
            <div className="space-y-2 lg:space-y-4">
              <Legend color="bg-white/20" label="Disabled" desc="Past or unavailable" />
              <Legend color="bg-[#E8D1AB]" label="Today" desc="Current date" />
              <Legend color="bg-blue-500" label="Shoots" desc="Confirmed projects" />
              <Legend color="bg-purple-500" label="Equipment" desc="Allocated gear" />
              <Legend color="bg-red-500" label="Conflicts" desc="Action required" />
            </div>
          </div>

          <div className="bg-[#111] border border-white/5 rounded-lg lg:rounded-xl p-4 lg:p-6">
            <h3 className="text-sm font-bold text-white mb-4 lg:mb-6 uppercase tracking-wider">Quick Info</h3>
            <p className="text-xs text-white/40 leading-relaxed mb-4">
              Keep your calendar updated to receive more project invitations. Confirmed bookings will appear with a blue marker.
            </p>
            <Button variant="outline" className="w-full border-white/10 text-white/60 hover:text-[#E8D1AB] text-xs">
              Sync Calendar
            </Button>
          </div>
        </div>
      </div>

      {/* Availability Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg">
          <div
            className={`w-full max-w-lg bg-[#111] border border-white/10 text-white rounded-xl lg:rounded-2xl mx-2 lg:mx-0 p-4 lg:p-8 relative shadow-2xl
            ${isAnimating ? "animate-in fade-in zoom-in duration-200" : "animate-out fade-out zoom-out duration-200"}
            max-h-[90vh] overflow-y-auto`}
          >
            <button
              onClick={handleModalClose}
              className="absolute top-3 right-3 lg:top-6 lg:right-6 text-white/40 hover:text-[#E8D1AB] transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg lg:text-2xl font-bold mb-1 text-white">Add Availability</h2>
            <p className="text-white/40 text-xs lg:text-sm mb-4 lg:mb-8">Schedule your working hours</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Type</label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleFormChange(value, "type")}
                >
                  <SelectTrigger className="w-full bg-black border-white/10 text-white h-12">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${formData.type === "1" ? "bg-green-500" : "bg-red-500"}`} />
                      <SelectValue placeholder="Select option" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                    <SelectItem value="1">Available</SelectItem>
                    <SelectItem value="2">Not Available</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Date</label>
                <DatePicker
                  label=""
                  value={parseLocalDate(selectedDate)}
                  minDate={new Date()}
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
                    <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Start Time</label>
                    <TimePicker
                      label=""
                      value={formData.startTime}
                      onChange={(time) => handleTimeChange(time, "startTime")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">End Time</label>
                    <TimePicker
                      label=""
                      value={formData.endTime}
                      onChange={(time) => handleTimeChange(time, "endTime")}
                      minTime={formData.startTime || undefined}
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
                  className="w-4 h-4 rounded border-white/10 bg-black text-[#E8D1AB] focus:ring-[#E8D1AB]"
                />
                <label htmlFor="allDay" className="text-sm font-medium text-white/80 cursor-pointer">All day availability</label>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Recurrence</label>
                <Select value={formData.recurrence} onValueChange={(value) => handleFormChange(value, "recurrence")}>
                  <SelectTrigger className="w-full bg-black border-white/10 text-white h-12">
                    <SelectValue placeholder="Does not repeat" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                    <SelectItem value="1">Does Not Repeat</SelectItem>
                    <SelectItem value="2">Daily</SelectItem>
                    <SelectItem value="3">Weekly</SelectItem>
                    <SelectItem value="4">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.recurrence !== "1" && (
                <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/5">
                  {formData.recurrence === "2" && (
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="incWeekends"
                        checked={formData.includeWeekends}
                        onChange={(e) => handleFormChange(e.target.checked, "includeWeekends")}
                        className="rounded border-white/10 bg-black"
                      />
                      <label htmlFor="incWeekends" className="text-sm text-white/60">Include Weekends</label>
                    </div>
                  )}

                  {formData.recurrence === "3" && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Repeat on</label>
                      <div className="flex flex-wrap gap-2">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              const current = formData.repeatOn || [];
                              const updated = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
                              handleFormChange(updated, "repeatOn");
                            }}
                            className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${formData.repeatOn.includes(day)
                              ? "bg-[#E8D1AB] text-black border-[#E8D1AB]"
                              : "bg-black text-white/60 border-white/10 hover:border-white/30"
                              }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MONTHLY */}
                  {formData.recurrence === "4" && (
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
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
                        // Added text-gray-900 and dark:text-white below
                        className="w-14 px-2 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white text-center outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <span>of each month</span>
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">Until Date</label>
                    <DatePicker
                      label=""
                      value={formData.untilDate}
                      minDate={parseLocalDate(selectedDate) || new Date()}
                      onChange={(d) => handleFormChange(d, "untilDate")}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  onClick={handleModalClose}
                  variant="ghost"
                  className="text-white/40 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#E8D1AB] text-black hover:bg-[#d4be9a] font-bold px-8 rounded-xl"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hover Card for Project Details */}
      {hoveredProject && (
        <div
          className="fixed z-50 w-[420px] bg-[#111] border border-[#E8D1AB]/30 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150"
          style={{
            top: hoverPosition.y,
            left: hoverPosition.x,
          }}
          onMouseLeave={handleDateLeave}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <span className="inline-block mb-3 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-[#E8D1AB]/10 text-[#E8D1AB] border border-[#E8D1AB]/20">
              Active Project
            </span>

            <h3 className="text-xl font-bold text-white mb-4">
              {hoveredProject.project_name}
            </h3>

            <div className="flex flex-wrap gap-4 text-xs text-white/60">
              <span className="flex items-center gap-2">
                <Calendar size={14} className="text-[#E8D1AB]" />
                {hoveredProject.date}
              </span>

              <span className="flex items-center gap-2">
                <MapPin size={14} className="text-[#E8D1AB]" />
                {formatLocation(hoveredProject.event_location)}
              </span>

              <span className="flex items-center gap-2">
                <Clock size={14} className="text-[#E8D1AB]" />
                12:00 PM – 4:00 PM
              </span>
            </div>
          </div>

          {/* Middle Section */}
          <div className="grid grid-cols-2 divide-x divide-white/10 border-b border-white/10 bg-white/[0.01]">
            {/* Streaming */}
            <div className="p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">
                Streaming Platforms
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium border border-white/5 bg-black rounded-lg text-white/80">
                  <Video size={12} className="text-[#E8D1AB]" /> YouTube
                </span>
                <span className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium border border-white/5 bg-black rounded-lg text-white/80">
                  <Mic size={12} className="text-[#E8D1AB]" /> Twitch
                </span>
                <span className="px-2 py-1 text-[10px] font-medium border border-white/5 bg-black rounded-lg text-white/40">
                  +4
                </span>
              </div>
            </div>

            {/* Equipment */}
            <div className="p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">
                Equipment Assigned
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium border border-white/5 bg-black rounded-lg text-white/80">
                  📷 Camera
                </span>
                <span className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium border border-white/5 bg-black rounded-lg text-white/80">
                  🎥 Video
                </span>
                <span className="px-2 py-1 text-[10px] font-medium border border-white/5 bg-black rounded-lg text-white/40">
                  +3
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 px-6 flex items-center justify-between bg-black/20">
            <span className="text-[10px] font-medium text-white/30 uppercase tracking-tight">
              Last Updated 4h ago
            </span>

            {/* <button className="text-[10px] font-bold uppercase tracking-widest text-[#E8D1AB] hover:text-white transition-colors">
        View Details →
      </button> */}
          </div>
        </div>
      )}
    </div>
  );
}

/* Helper Components */
function Legend({ color, label, desc }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
      <div>
        <p className="text-xs font-bold text-white leading-none mb-1">{label}</p>
        <p className="text-[10px] text-white/30">{desc}</p>
      </div>
    </div>
  );
}

function EventDot({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      <span className="truncate text-[10px] font-medium text-white/60">{label}</span>
    </div>
  );
}
