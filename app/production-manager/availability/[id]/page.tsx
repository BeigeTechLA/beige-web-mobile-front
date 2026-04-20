"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle,
  Calendar,
  MapPin,
  Clock,
  Video,
  Mic,
  Copy,
  ArrowLeft,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Topbar from "@/components/production-manager/Topbar";
import { adminApi, getCrewAvailability } from "@/lib/api";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import DottedDivider from "@/components/admin/DottedDivider";
import { useTheme } from "next-themes";

const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";

// --- HELPERS ---
const formatLocation = (locationInput: string) => {
  if (!locationInput || locationInput === '""' || locationInput === 'null') return "Location TBD";

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

// Helper for time formatting
const formatTimeRange = (start?: string, end?: string) => {
  if (!start || !end) return "12:00 PM - 4:00 PM";
  try {
    const s = format(parseISO(`2000-01-01T${start}`), "h:mm a");
    const e = format(parseISO(`2000-01-01T${end}`), "h:mm a");
    return `${s} - ${e}`;
  } catch (error) {
    return `${start} - ${end}`;
  }
};

interface CrewMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role?: {
    role_name: string;
  };
  skills?: any;
  status: string;
  crew_member_files?: any[];
  city?: string;
  state?: string;
  country?: string;
  linkedin_link?: string;
  behance_link?: string;
  portfolio_link?: string;
}

interface ProjectDetails {
  project_id?: number;
  project_name?: string;
  date?: string;
  event_location?: string;
  start_time?: string;
  end_time?: string;
  status?: number;
}

interface AvailabilityStatus {
  available?: boolean;
  projectAssigned?: boolean;
  projectDetails?: ProjectDetails;
}

export default function AvailabilityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const id = params?.id as string;

  const { theme } = useTheme();

  const [member, setMember] = useState<CrewMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [availability, setAvailability] = useState<Record<string, AvailabilityStatus>>({});
  const [summaryData, setSummaryData] = useState({
    availableDays: 0,
    bookedShoots: 0,
    timeOff: 0,
  });

  const [mounted, setMounted] = useState(false);

  // --- NEW SIDEBAR STATE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarDate, setSidebarDate] = useState<string | null>(null);

  useEffect(() => { setMounted(true) }, [])

  // Fetch Member Details
  useEffect(() => {
    if (!id) return;

    const fetchMember = async () => {
      try {
        const response = await adminApi.getCrewMemberDetail(id);
        if (response && response.data) {
          setMember(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch member details:", error);
        toast.error("Failed to load member details");
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id]);

  // Fetch Availability
  useEffect(() => {
    if (!id) return;

    const fetchAvailability = async () => {
      try {
        const response = await getCrewAvailability({
          crew_member_id: parseInt(id),
          month: currentMonth,
          year: currentYear,
        });

        if (response && response.data && response.data.data && response.data.data.availability) {
          setAvailability(response.data.data.availability);
        } else {
          setAvailability({});
        }
      } catch (error) {
        console.error("Failed to fetch availability:", error);
      }
    };

    fetchAvailability();
  }, [id, currentMonth, currentYear]);

  // Calculate Summary
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

  const getFirstDayOfMonth = (month: number, year: number) => {
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

      const cardBackground = isDark
        ? (isPastDate ? "bg-[#161616] opacity-90" : isAvailable ? "bg-[#111]" : "bg-[#161616]")
        : (isPastDate ? "bg-[#F4F4F4] opacity-80" : isAvailable ? "bg-[#F8F4EE]" : "bg-white");

      // const cardBackground = isPastDate
      //   ? "bg-[#161616] opacity-90"
      //   : isAvailable
      //     ? "bg-[#111]"
      //     : "bg-[#161616]";

      const textColor = isDark
        ? (isAvailable ? "text-white" : "text-white/30")
        : (isAvailable ? "text-black" : "text-black/30");

      const borderColor = isDark ? "border-white/5" : "border-[#E5E5E5]";
      calendarDays.push(
        <div
          key={i}
          onClick={() => {
            if (isAssigned) {
              setSidebarDate(dateString);
              setIsSidebarOpen(true);
            }
          }}
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

  const copyAvailabilityLink = () => {
    const link = `${window.location.origin}/availability/${id}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard");
  }

  if (loading) {
        <div className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 border-[#3D3D3D] bg-[#171717]" 
        }`}>
        <Loader2 className={`animate-spin text-[#BFA780]`} size={40} />
      </div>   
      }

  const profilePhoto = member?.crew_member_files?.find(
    (file: any) => file.file_type === 'profile_photo'
  );
  const imageUrl = profilePhoto
    ? `${S3_PREFIX}${profilePhoto.file_path}`
    : null;

  const fullName = `${member?.first_name || ''} ${member?.last_name || ''}`.trim() || "Unknown";

  let displayRole = "N/A";
  if (member?.role?.role_name) {
    displayRole = member.role.role_name;
  }

  const isDark = !mounted || theme === "dark";
  const location = [member?.city, member?.state, member?.country].filter(Boolean).join(', ') || "Location Unknown";

  return (
    <>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{ [id]: fullName }}
      />
      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 relative min-h-screen">
        <div className={`space-y-8 pb-12 font-instrument-sans transition-colors ${isDark ? "text-white" : "text-black"
          }`}>
          {/* Header with Back Button */}
          <div>
            <button
              onClick={() => router.back()}
              className={`flex items-center gap-2 transition-colors mb-6 text-sm ${isDark ? "text-white/60 hover:text-white" : "text-black hover:text-black/60 "}`}
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className={`flex items-center gap-2 text-sm ${isDark ? "text-white/40 " : "text-black/70 "} mb-2`}>
              <span>Availability Management</span>
              <span>/</span>
              <span className={isDark ? "text-white" : "text-black"}>Creative Partner Profile Details</span>
            </div>
          </div>

          {/* Profile Card */}
          <div className={`border rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all ${isDark ? "bg-[#111] border-[#333]" : "bg-[#FFFCF6] border-[#D8D8D8] shadow-sm"
            }`}>
            <div className="flex items-center gap-6">
              <div className={`w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 ${isDark ? "bg-[#222]" : "bg-gray-100"
                }`}>
                {imageUrl ? (
                  <img src={imageUrl} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-2xl font-bold ${isDark ? "text-white/20" : "text-black/10"
                    }`}>
                    {fullName.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-black"}`}>{fullName}</h1>
                  {member?.status === 'approved' && (
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle size={12} className="text-green-500" />
                    </div>
                  )}
                </div>
                <p className={isDark ? "text-white/60" : "text-black/60"}>{displayRole}</p>
                <div className={`flex items-center gap-2 text-sm mt-1 ${isDark ? "text-white/40" : "text-black/40"}`}>
                  <MapPin size={14} />
                  {location}
                </div>

                <div className="flex gap-3 mt-4">
                  {member?.linkedin_link && (
                    <a href={member.linkedin_link} target="_blank" rel="noopener noreferrer" className={`px-3 py-1.5 border rounded-lg text-xs transition-colors flex items-center gap-2 ${isDark
                      ? "bg-[#1A1A1A] border-white/10 text-white/60 hover:text-white"
                      : "bg-white border-black/10 text-black/60 hover:text-black hover:border-black/20"
                      }`}>
                      Linkedin
                    </a>
                  )}
                  {member?.behance_link && (
                    <a href={member.behance_link} target="_blank" rel="noopener noreferrer" className={`px-3 py-1.5 border rounded-lg text-xs transition-colors flex items-center gap-2 ${isDark
                      ? "bg-[#1A1A1A] border-white/10 text-white/60 hover:text-white"
                      : "bg-white border-black/10 text-black/60 hover:text-black hover:border-black/20"
                      }`}>
                      Behance
                    </a>
                  )}
                  {member?.portfolio_link && (
                    <a href={member.portfolio_link} target="_blank" rel="noopener noreferrer" className={`px-3 py-1.5 border rounded-lg text-xs transition-colors flex items-center gap-2 ${isDark
                      ? "bg-[#1A1A1A] border-white/10 text-white/60 hover:text-white"
                      : "bg-white border-black/10 text-black/60 hover:text-black hover:border-black/20"
                      }`}>
                      Portfolio
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div>
              <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${member?.status === 'approved' ? "bg-[#F0FFF4] text-[#22C55E] border-[#22C55E]/20" :
                member?.status === 'pending' ? "bg-[#FFF9E5] text-[#B18A00] border-[#B18A00]/20" :
                  "bg-[#F0FFF4] text-[#22C55E] border-[#22C55E]/20"
                }`}>
                {member?.status ? member.status.charAt(0).toUpperCase() + member.status.slice(1) : 'Approved'}
              </span>
            </div>
          </div>

          <div>
            <h2 className={`text-xl font-bold mb-6 ${isDark ? "text-white" : "text-black"}`}>Availability</h2>
            {/* <DottedDivider /> */}

            <div className="grid grid-cols-12 gap-6">
              {/* Main Calendar Section */}
              <div className="col-span-12 lg:col-span-9 space-y-6">
                <div className={`transition-colors duration-200 border rounded-2xl overflow-hidden shadow-2xl ${isDark ? "bg-[#101010] border-[#333]" : "bg-white border-gray-200"
                  }`}>
                  {/* Calendar Controls */}
                  <div className={`p-4 lg:p-6 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${isDark ? "border-white/5" : "border-gray-100"
                    }`}>
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center rounded-lg gap-2 lg:gap-4 p-1`}>
                        <button
                          onClick={() => handleMonthChange("prev")}
                          className={`h-8 w-8 flex items-center justify-center rounded-md transition-colors border ${isDark ? "hover:bg-white/5 text-white/60 bg-black border-white/10" : "hover:bg-gray-200 text-[#000000] bg-[#F0F0F0] border-[#0A0A0A33]"
                            }`}
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
                          className={`h-8 w-8 flex items-center justify-center rounded-md transition-colors border ${isDark ? "hover:bg-white/5 text-white/60 bg-black border-white/10" : "hover:bg-gray-200 text-[#000000] bg-[#F0F0F0] border-[#0A0A0A33]"
                            }`}
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>

                      {/* <span className="text-lg font-bold text-white tracking-tight">
                        {new Date(currentYear, currentMonth - 1).toLocaleString(
                          "default",
                          {
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </span> */}
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
                      <Button
                        variant="outline"
                        size="sm"
                        className={`px-4 py-2 border rounded-lg text-sm transition-all ${isDark ? "bg-transparent border-white/10 text-white/60 hover:text-white hover:border-[#E5D5B8]/40" : "bg-[#F0F0F0] border-[#E3E3E3] text-gray-600 hover:text-black shadow-sm"}`}
                      >
                        Sort by
                        <ChevronLeft className="rotate-[-90deg] ml-2" size={14} />
                      </Button>
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
              <div className="col-span-12 lg:col-span-3 space-y-6">

                <div className={`border rounded-2xl p-4 lg:p-6 transition-colors ${isDark ? "bg-[#101010] border-[#333]" : "bg-white border-gray-200 shadow-sm"
                  }`}>
                  <h3 className={`font-medium mb-2 lg:mb-4 ${isDark ? "text-white" : "text-black"}`}>Color Legend</h3>
                  <div className="space-y-4">
                    <Legend color={isDark ? "bg-[#444]" : "bg-[#ECE7E2]"} label="Disabled" desc="Time off or blocked" isDark={isDark} />
                    <Legend color="bg-[#A8A29E]" label="Today's" desc="Time off or blocked" isDark={isDark} />
                    <Legend color="bg-blue-500" label="Shoots" desc="Confirmed shoots" isDark={isDark} />
                    <Legend color="bg-[#EF4444]" label="Booked" desc="Scheduling conflicts" isDark={isDark} />
                  </div>
                </div>

                <div className={`border rounded-2xl p-4 lg:p-6 transition-colors ${isDark ? "bg-[#101010] border-[#333]" : "bg-white border-gray-200 shadow-sm"
                  }`}>
                  <h3 className={`font-medium mb-4 ${isDark ? "text-white" : "text-black"}`}>This Month</h3>
                  <div className="space-y-2">
                    <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? "bg-[#1A1A1A]" : "bg-[#F0F0F0]"}`}>
                      <span className="text-[#999] text-sm">Available Days</span>
                      <span className={`text-sm lg:text-base ${isDark ? "text-white" : "text-[#303030]"} text-right`}>{summaryData.availableDays}</span>
                    </div>
                    <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? "bg-[#1A1A1A]" : "bg-[#F0F0F0]"}`}>
                      <span className="text-[#999] text-sm">Booked Shoots</span>
                      <span className={`text-sm lg:text-base ${isDark ? "text-white" : "text-[#303030]"} text-right`}>{summaryData.bookedShoots}</span>
                    </div>
                    <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? "bg-[#1A1A1A]" : "bg-[#F0F0F0]"}`}>
                      <span className="text-[#999] text-sm">Time Off</span>
                      <span className={`text-sm lg:text-base ${isDark ? "text-white" : "text-[#303030]"} text-right`}>{summaryData.timeOff} days</span>
                    </div>
                  </div>
                </div>

                <div className={`border rounded-2xl p-4 lg:p-6 transition-colors ${isDark ? "bg-[#101010] border-[#333]" : "bg-white border-gray-200 shadow-sm"
                  }`}>
                  <h3 className={`font-medium mb-2 ${isDark ? "text-white" : "text-black"}`}>Share Availability</h3>
                  <p className={`text-sm mb-4 ${isDark ? "text-[#888]" : "text-gray-500"}`}>Share your availability link with production teams</p>
                  <Button
                    onClick={copyAvailabilityLink}
                    className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all active:scale-95 ${isDark ? "bg-[#E5D5B8] text-black hover:bg-[#d4c3a3]" : "bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/80 shadow-md"
                      }`}>
                    <Copy size={16} className="mr-2" />
                    Copy Link
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- SIDEBAR MODAL (Same as Screenshot UI) --- */}
        {isSidebarOpen && sidebarDate && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            />

            {/* Panel */}
            <div className="relative w-full max-w-md bg-[#080808] border-l border-white/10 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="p-8 pb-4 flex items-center justify-between">
                <h2 className="text-3xl font-bold text-white tracking-tight">
                  {format(parseISO(sidebarDate), "MMMM d, yyyy")}
                </h2>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-6">
                {availability[sidebarDate]?.projectDetails ? (
                  <div className="bg-[#111] border border-white/5 rounded-[24px] p-6 space-y-6 ring-1 ring-white/5">
                    <div className="flex justify-between items-start">
                      <span className="px-3 py-1 bg-[#22C55E] text-white text-[10px] font-bold uppercase tracking-widest rounded-md">
                        Initiated
                      </span>
                      {/* Avatars Placeholder */}
                      <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-[#111]" />
                        <div className="w-6 h-6 rounded-full bg-purple-500 border-2 border-[#111]" />
                        <div className="w-6 h-6 rounded-full bg-pink-500 border-2 border-[#111]" />
                        <div className="w-6 h-6 rounded-full bg-[#E8D1AB] text-black text-[8px] flex items-center justify-center border-2 border-[#111] font-bold">+3</div>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-white leading-tight">
                      {availability[sidebarDate].projectDetails?.project_name}
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-white/50 text-sm">
                        <Calendar size={16} />
                        <span>{format(parseISO(sidebarDate), "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-start gap-3 text-white/50 text-sm">
                        <MapPin size={16} className="mt-0.5" />
                        <span className="leading-snug">
                          {formatLocation(availability[sidebarDate].projectDetails?.event_location || "")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-white/50 text-sm">
                        <Clock size={16} />
                        <span>
                          {formatTimeRange(
                            availability[sidebarDate].projectDetails?.start_time,
                            availability[sidebarDate].projectDetails?.end_time
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
                        Updated recently
                      </span>
                      <Button
                        className="bg-[#E8D1AB] hover:bg-[#d4be9a] text-black font-bold h-10 px-6 rounded-xl"
                        onClick={() => router.push(`/production-manager/shoots/${availability[sidebarDate].projectDetails?.project_id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/20 italic">No project details available.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* Helper Components preserved exactly */
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