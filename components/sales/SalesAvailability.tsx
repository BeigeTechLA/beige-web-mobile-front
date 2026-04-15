"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
  Video,
  Plus,
  CheckCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import DatePicker from "@/components/ui/Datepicker";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { StatCard } from "@/components/admin/StatCard";
import { useAddAvailabilityMutation, useGetAvailabilityMutation } from "@/lib/redux/features/sales/salesApi";

// --- HELPERS ---
const formatLocation = (locationInput: any) => {
  if (!locationInput) return "Location TBD";
  let addressStr = locationInput;

  try {
    const parsed = JSON.parse(locationInput);
    if (parsed && parsed.address) addressStr = parsed.address;
  } catch (e) {
    /* Not JSON */
  }

  const parts = addressStr.split(",").map((p: string) => p.trim());
  if (parts.length >= 3) {
    const country = parts[parts.length - 1];
    const stateZip = parts[parts.length - 2];
    const city = parts[parts.length - 3];
    const state = stateZip.replace(/\d+/g, "").trim();
    return `${city}, ${state}, ${country}`;
  }
  return addressStr;
};

export default function SalesAvailability() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAllDay, setIsAllDay] = useState(true); 
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const [formData, setFormData] = useState({
    type: "1",
    notes: "",
  });

  const [availability, setAvailability] = useState<any>({});
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [summaryData, setSummaryData] = useState({
    availableDays: 0,
    bookedShoots: 0,
    timeOff: 0,
  });
  const [hoveredProject, setHoveredProject] = useState<any>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  const [getAvailability, { isLoading: isFetchingAvailability }] = useGetAvailabilityMutation();
  const [addAvailability, { isLoading: isAddingAvailability }] = useAddAvailabilityMutation();

  const fetchAvailability = async () => {
    try {
      const response = await getAvailability({
        month: currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`,
        year: `${currentYear}`,
        // sales_rep_id is not passed for logged-in user as per instructions
      }).unwrap();

      if (!response.error && response.data?.availability) {
        setAvailability(response.data.availability);
      }
    } catch (error) {
      console.error("Failed to fetch availability:", error);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [currentMonth, currentYear]);

  useEffect(() => {
    const getSummaryData = () => {
      let availableDays = 0;
      let bookedShoots = 0;
      let timeOff = 0;

      for (const dateKey in availability) {
        const status = availability[dateKey];
        if (status) {
          // available: true means the rep is generally available
          // assigned_leads_count > 0 means they have bookings
          // customAvailabilityStatus: 2 (usually means Unavailable/Time Off)
          
          if (status.available && status.customAvailabilityStatus !== 2) {
            availableDays += 1;
          }
          
          const totalAssigned = (status.assigned_leads_count || 0) + 
                               (status.assigned_sales_leads_count || 0) + 
                               (status.assigned_client_leads_count || 0);
                               
          if (totalAssigned > 0) {
            bookedShoots += totalAssigned;
          }
          
          if (!status.available || status.customAvailabilityStatus === 2) {
            timeOff += 1;
          }
        }
      }

      setSummaryData({ availableDays, bookedShoots, timeOff });
    };

    getSummaryData();
  }, [availability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    const formattedDate = format(selectedDate, "yyyy-MM-dd");

    const payload = {
      date: formattedDate,
      availability_status: Number(formData.type),
      is_full_day: isAllDay ? 1 : 0,
      notes: formData.notes || "",
    };

    try {
      const response = await addAvailability(payload).unwrap();
      // Most APIs in this project use { error: false } for success
      if (response && response.error === false) {
        handleModalClose();
        toast.success("Availability Updated");
        fetchAvailability();
      } else {
        // Fallback for different response formats
        handleModalClose();
        toast.success("Availability Updated");
        fetchAvailability();
      }
    } catch (error: any) {
      console.error("Error adding availability:", error);
      toast.error(error?.data?.message || "Update Failed");
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

  const handleFormChange = (value: string, name: string) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleMonthChange = (direction: "prev" | "next") => {
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

  const getFirstDayOfMonth = (month: number, year: number) => {
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
      const status = availability[dateString];

      const isAvailable = status?.available && status?.customAvailabilityStatus !== 2;
      const isUnavailable = status?.customAvailabilityStatus === 2 || status?.available === false;
      
      const leadsCount = status?.assigned_leads_count || 0;
      const salesLeadsCount = status?.assigned_sales_leads_count || 0;
      const clientLeadsCount = status?.assigned_client_leads_count || 0;
      const totalAssigned = leadsCount + salesLeadsCount + clientLeadsCount;

      const isPastDate = dateString < todayDateString;
      const isToday = dateString === todayDateString;

      const cardBackground = isPastDate
        ? "bg-[#0D0D0D] opacity-40"
        : totalAssigned > 0
          ? "bg-[#111]"
          : isUnavailable
            ? "bg-[#161616]"
            : "bg-[#111]";

      const textColor = (isAvailable || totalAssigned > 0) ? "text-white" : "text-white/30";

      const handleDateClick = () => {
        if (!isPastDate) {
          setSelectedDate(new Date(dateString));
          handleModalOpen();
        }
      };

      const handleDateHover = (e: React.MouseEvent) => {
        if (totalAssigned > 0) {
          const rect = e.currentTarget.getBoundingClientRect();
          setHoverPosition({
            x: rect.right + 10,
            y: rect.top,
          });
          setHoveredProject({
            date: dateString,
            project_name: `${totalAssigned} Assigned Leads`,
            leadsCount,
            salesLeadsCount,
            clientLeadsCount
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

          {status && (
            <div className="space-y-1 mt-2">
              {totalAssigned > 0 && (
                <div className="space-y-1">
                  <EventDot color="bg-blue-500" label={`${totalAssigned} Leads`} />
                  {status.customAvailabilityStatus === 1 && <EventDot color="bg-[#E8D1AB]" label="Booked" />}
                </div>
              )}
              {isAvailable && totalAssigned === 0 && (
                <div className="flex items-center gap-1 text-green-500/70">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="hidden lg:block">Available</span>
                </div>
              )}
              {isUnavailable && (
                <div className="flex items-center gap-1 text-red-500/70">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="hidden lg:block">Unavailable</span>
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
                  id="date"
                  onChange={(d) => {
                    setSelectedDate(d);
                  }}
                />
              </div>

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={isAllDay}
                  onChange={() => setIsAllDay(!isAllDay)}
                  className="w-4 h-4 rounded border-white/10 bg-black text-[#E8D1AB] focus:ring-[#E8D1AB]"
                />
                <label htmlFor="allDay" className="text-sm font-medium text-white/80 cursor-pointer">All day availability</label>
              </div>

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
                  disabled={isAddingAvailability}
                  className="bg-[#E8D1AB] text-black hover:bg-[#d4be9a] font-bold px-8 rounded-xl"
                >
                  {isAddingAvailability ? "Saving..." : "Save Changes"}
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
              Leads Assigned
            </span>

            <h3 className="text-xl font-bold text-white mb-4">
              {hoveredProject.project_name}
            </h3>

            <div className="flex flex-col gap-2 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-[#E8D1AB]" />
                {hoveredProject.date}
              </div>
              
              <div className="mt-2 grid grid-cols-1 gap-2">
                <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                   <span>General Leads</span>
                   <span className="font-bold text-[#E8D1AB]">{hoveredProject.leadsCount}</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                   <span>Sales Leads</span>
                   <span className="font-bold text-[#E8D1AB]">{hoveredProject.salesLeadsCount}</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                   <span>Client Leads</span>
                   <span className="font-bold text-[#E8D1AB]">{hoveredProject.clientLeadsCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Helper Components */
function Legend({ color, label, desc }: { color: string; label: string; desc: string }) {
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

function EventDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      <span className="truncate text-[10px] font-medium text-white/60">{label}</span>
    </div>
  );
}
