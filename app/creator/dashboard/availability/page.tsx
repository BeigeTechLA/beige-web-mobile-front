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
import { getCrewAvailability, GetUpcomingShoots, getProjectDetails, AddAvailability } from "@/lib/api";
import DatePicker from "@/components/ui/Datepicker";
import TimePicker from "@/components/ui/Timepicker";
import { format } from "date-fns";
import toast from "react-hot-toast";
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

export default function AvailabilityPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAllDay, setIsAllDay] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [upcomingShoots, setUpcomingShoots] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projectDetails, setProjectDetails] = useState(null);
  const [projectLoading, setProjectLoading] = useState(false);
  const pathname = usePathname();
  const { isDark } = useResolvedTheme();

  const [formData, setFormData] = useState({
    type: "1",
    recurrence: "1",
    includeWeekends: false,
    repeatOn: [],
    monthlyDay: "",
    untilDate: null,
    startTime: "",
    endTime: "",
    notes: "",
  });

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

    const formattedDate = format(new Date(selectedDate), "yyyy-MM-dd");

    let payload = {
      crew_member_id: crewMemberId,
      date: formattedDate,
      availability_status: Number(formData.type),
      is_full_day: isAllDay ? 1 : 0,
      start_time: isAllDay ? null : formData.startTime,
      end_time: isAllDay ? null : formData.endTime,
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
    setIsModalOpen(true);
    setIsAnimating(true);
  };

  const handleModalClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsModalOpen(false);
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
      setFormData({ ...formData, startTime: "", endTime: "" });
    }
  };

  const handleTimeChange = (time, field) => {
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

      const isAvailable = availabilityStatus?.available || availabilityStatus?.projectAssigned;
      const isAssigned = availabilityStatus?.projectAssigned;

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
                      <EventDot color="bg-blue-500" label="Shoot" />
                      <EventDot color="bg-[#E8D1AB]" label="Booked" />
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
      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-6">
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
                    id="date"
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
                      <TimePicker isDark={isDark} setTime={(time) => handleTimeChange(time, "startTime")} />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? "text-white/40" : "text-black/40"}`}>
                        End Time
                      </label>
                      <TimePicker isDark={isDark} setTime={(time) => handleTimeChange(time, "endTime")} />
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
                      <DatePicker id="untilDate" isDark={isDark} onChange={(d) => handleFormChange(d, "untilDate")} />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={handleModalClose}
                    variant="ghost"
                    className={`transition-colors ${isDark ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"}`}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className={`font-bold px-8 rounded-xl transition-colors text-black ${isDark ? "bg-[#E8D1AB] hover:bg-[#d4be9a]" : "bg-[#cbb38b] hover:bg-[#bfa57c]"}`}
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

function EventDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      <span className="truncate text-[10px] font-medium text-white/60">{label}</span>
    </div>
  );
}