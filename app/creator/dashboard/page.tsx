"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Camera,
  Calendar as CalendarIcon,
  Clock,
  Box,
  Search,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Users,
  Activity,
  XCircle,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner"; // Using sonner for the high-end look of the first code
import { useAuth } from "@/lib/hooks/useAuth";
import { useGetCurrentUserQuery } from "@/lib/redux/features/auth/authApi";
import Topbar from "@/components/admin/Topbar";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import Map, { Marker, NavigationControl, GeolocateControl } from "react-map-gl/mapbox";
import 'mapbox-gl/dist/mapbox-gl.css';

import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
} from "recharts";
import {
  GetCreatorDashboardCount,
  getCrewAvailability,
  GetCreatorDashboardDetails,
  GetCreatorStats,
  CheckVerificationStatus,
  ConfirmCPEventLocation
} from "@/lib/api";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

// ----------------------------
// CONSTANTS & HELPERS
// ----------------------------
const NEXT_PUBLIC_MAPBOX_TOKEN = "pk.eyJ1IjoiYW1yaWtzaW5naDc4NiIsImEiOiJja29wZ2RicXQwa3ZpMnJudXE4OHJmd2NoIn0.NHIyPWX9FfNSCFRUwpvGfw";

/**
 * Format location string for clean display
 */
const formatDisplayLocation = (location?: string) => {
  if (!location || location === "Location TBD") return "Location TBD";
  let addressStr = location;
  try {
    const parsed = typeof location === 'string' ? JSON.parse(location) : location;
    if (parsed && parsed.address) addressStr = parsed.address;
  } catch (e) { }

  if (addressStr.includes(",")) {
    const parts = addressStr.split(",").map((p) => p.trim());
    if (parts.length >= 3) {
      const city = parts[parts.length - 3];
      const state = parts[parts.length - 2].replace(/[0-9]/g, "").trim();
      return `${city}, ${state}`;
    }
    return parts[0];
  }
  return addressStr;
};

const isUpcomingDate = (dateStr?: string) => {
  if (!dateStr) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return true;
  return d.getTime() >= today.getTime();
};

const isCompletedFlag = (item: any) => {
  const flag = item?.is_completed ?? item?.project?.is_completed;
  return flag === true || flag === 1;
};

const CHART_COLORS = {
  purple: "#A179F8",
  blue: "#49B6F5",
  orange: "#F5B849",
  green: "#26BF94",
  darkBg: "#111",
  muted: "rgba(255,255,255,0.05)"
};

/**
 * Maps icon types to Lucide components
 */
const getIcon = (iconType: string) => {
  switch (iconType) {
    case "FileText": return <FileText className="text-white/70" />;
    case "Users": return <Users className="text-white/70" />;
    case "Activity": return <Activity className="text-white/70" />;
    case "XCircle": return <XCircle className="text-white/70" />;
    default: return <Activity className="text-white/70" />;
  }
};

// ----------------------
// DONUT CHART HELPERS
// ----------------------
type DonutSlice = {
  label: string;
  value: number;
  colorHex: string;
  bulletClass: string;
  subLabel?: string;
};

function ShootStatusGaugeCard({
  title = "Shoot Status",
  slices,
  rightControl,
  isDark = true,
}: {
  title?: string;
  slices: DonutSlice[];
  rightControl?: React.ReactNode;
  isDark?: boolean;
}) {
  const chartData = slices
    .filter((item) => item.value > 0)
    .map((item) => ({
      name: item.label,
      value: item.value,
      fill: item.colorHex,
    }));
  const total = slices.reduce((sum, item) => sum + item.value, 0);
  const displayData = chartData.length > 0 ? chartData : [{ name: "No Shoots", value: 1, fill: isDark ? "#141414" : "#F5F5F5" }];

  return (
    <div className={`w-full rounded-2xl border min-h-[392px] flex flex-col transition-all duration-300 ${
      isDark ? "bg-[#171717] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-black"
    }`}>
      <div className={`rounded-2xl flex justify-between items-center border-b p-5 shrink-0 transition-colors duration-300 ${
        isDark ? "bg-[#101010] border-b-[#3D3D3D]" : "bg-[#FFFCF6] border-b-[#E5E5E5]"
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <h3 className={`text-sm lg:text-base ${isDark ? "text-white" : "text-[#000000]"}`}>{title}</h3>
        </div>
        {rightControl || (
          <button
            type="button"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] lg:text-xs transition-colors border ${
              isDark
                ? "bg-[#1A1A1A] border-white/10 text-white/70"
                : "bg-white border-[#E5E5E5] text-[#333]"
            }`}
          >
            All Time
          </button>
        )}
      </div>

      <div className="p-4 lg:p-8 xl:p-10 flex flex-col lg:flex-row items-center justify-between gap-6 flex-1 overflow-visible">
        <div className="relative w-full max-w-[390px] h-[220px] lg:h-[250px] flex items-center justify-center overflow-visible">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="82%"
              innerRadius="58%"
              outerRadius="104%"
              barSize={38}
              data={displayData}
              startAngle={0}
              endAngle={180}
            >
              <RadialBar
                cornerRadius={0}
                background={{ fill: isDark ? "#141414" : "#F5F5F5" }}
                dataKey="value"
              />
            </RadialBarChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className={`lg:text-[26px] font-bold tracking-tight translate-y-[130%] ${
              isDark ? "text-[#E8D1AB]" : "text-[#000]"
            }`}>
              {total.toLocaleString()}
            </span>
          </div>
          <div
            className={`absolute left-1/2 -translate-x-1/2 h-[1px] flex items-center justify-center pointer-events-none ${
              isDark ? "bg-white/20" : "bg-black/10"
            }`}
            style={{
              top: "82%",
              width: "76%",
            }}
          >
            <div className={`w-3 h-3 rounded-full border-2 shadow-[0_0_8px_rgba(232,209,171,0.6)] ${
              isDark ? "bg-[#E8D1AB] border-[#101010]" : "bg-[#000] border-white"
            }`} />
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full lg:w-auto min-w-[240px]">
          {slices.map((item) => (
            <div key={item.label} className="flex items-center justify-between lg:justify-start gap-6 group">
              <div
                className={`w-16 py-1.5 rounded-full border text-xs font-bold text-center transition-all ${
                  isDark ? "text-white" : "text-[#333]"
                }`}
                style={{
                  borderColor: item.colorHex,
                  backgroundColor: "transparent",
                }}
              >
                {item.value.toLocaleString()}
              </div>
              <span className={`text-sm font-medium whitespace-nowrap transition-colors ${
                isDark ? "text-white/40 group-hover:text-white/70" : "text-[#666] group-hover:text-black"
              }`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----------------------
// MAIN PAGE COMPONENT
// ----------------------
export default function CreatorDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useResolvedTheme();

  const pathname = usePathname();
  const [showTempEventPopup, setShowTempEventPopup] = useState(false);
  const [isConfirmingTempEvent, setIsConfirmingTempEvent] = useState(false);
  const isCreatorUser = (user as any)?.user_type_id === 2 || (user as any)?.userTypeId === 2;
  const { data: currentUserData, refetch: refetchCurrentUser } = useGetCurrentUserQuery(undefined, {
    skip: !isCreatorUser,
  });
  const tempEventLocation = currentUserData?.temp_event_popup?.event_location?.address;

  // Basic Top Counts State
  const [dashboardStats, setDashboardStats] = useState({
    completedShoots: 0,
    upcomingShoots: 0,
    pendingRequests: 0,
    equipmentRequests: 0,
  });

  // Detailed Stats State
  const [creatorStats, setCreatorStats] = useState({
    completedShoots: 0,
    pendingShoots: 0,
    rejectedShoots: 0,
    shootRequests: 0,
    photographyShoots: 0
  });

  const [allShoots, setAllShoots] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  // Filter & UI States
  const [mapSearch, setMapSearch] = useState("");
  const [mapStatusFilter, setMapStatusFilter] = useState("all");
  const [categoryTypeFilter, setCategoryTypeFilter] = useState<"all" | "photography" | "videography">("all");
  const [activeMetricCard, setActiveMetricCard] = useState<"completed" | "upcoming" | "pending">("completed");

  const [date, setDate] = useState(new Date());
  const [acceptShootEvent, setAcceptShootEvent] = useState<any>(null);
  const [declineEquipmentItem, setDeclineEquipmentItem] = useState<any>(null);

  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [projectDetailsData, setProjectDetailsData] = useState<any>(null);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);

  const [availability, setAvailability] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [verificationStatus, setVerificationStatus] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);

  const [viewState, setViewState] = useState({
    latitude: 39.8283,
    longitude: -98.5795,
    zoom: 3,
  });

  // --- MONTH HANDLERS ---
  const handlePreviousMonth = () => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() - 1);
    setDate(newDate);
    setCurrentMonth(newDate.getMonth() + 1);
    setCurrentYear(newDate.getFullYear());
  };

  const handleNextMonth = () => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + 1);
    setDate(newDate);
    setCurrentMonth(newDate.getMonth() + 1);
    setCurrentYear(newDate.getFullYear());
  };

  const handleAcceptProject = (projectId: number, status: number) => {
    if (status === 1) {
      toast.success("Shoot request accepted");
    } else {
      toast.error("Shoot request declined");
    }
    setAcceptShootEvent(null);
  };

  const handleConfirmTempEvent = async () => {
    setIsConfirmingTempEvent(true);
    try {
      const response = await ConfirmCPEventLocation();

      if (response && !response.error) {
        toast.success("Event confirmed successfully");
        setShowTempEventPopup(false);
        refetchCurrentUser();
        return;
      }

      toast.error(response?.error || "Failed to confirm event");
    } catch (error) {
      console.error("Confirm temp event error:", error);
      toast.error("Failed to confirm event");
    } finally {
      setIsConfirmingTempEvent(false);
    }
  };

  useEffect(() => {
    if (isCreatorUser && currentUserData?.temp_event_popup?.show === true) {
      setShowTempEventPopup(true);
    } else {
      setShowTempEventPopup(false);
    }
  }, [isCreatorUser, currentUserData]);

  useEffect(() => {
    const syncStatusWithBackend = async () => {
      const userStr = localStorage.getItem("revure_user");
      const localUser = userStr ? JSON.parse(userStr) : null;
      const crewId = user?.crew_member_id || localUser?.crew_member_id;

      if (!crewId) {
        setIsSyncing(false);
        return;
      }

      try {
        // 1. Ask backend for the REAL current status
        const response = await CheckVerificationStatus({ crew_member_id: crewId });

        if (response && !response.error && response.data?.data) {
          const latestStatus = Number(response.data.data.is_crew_verified);

          // 2. Update React State (Unlocks the current page)
          setVerificationStatus(latestStatus);

          // 3. Update LocalStorage (Unlocks the Sidebar links)
          const updatedUser = { ...localUser, is_crew_verified: latestStatus };
          localStorage.setItem("revure_user", JSON.stringify(updatedUser));

          console.log("Status synced from backend:", latestStatus);
        }
      } catch (err) {
        console.error("Sync failed:", err);
        // Fallback to local storage if API fails
        const status = (user as any)?.is_crew_verified ?? localUser?.is_crew_verified ?? 0;
        setVerificationStatus(Number(status));
      } finally {
        setIsSyncing(false);
      }
    };

    syncStatusWithBackend();
  }, [user]);

  // 1. Fetch Stats (Logic from your code)
  useEffect(() => {
    const fetchStatsData = async () => {
      const userStr = localStorage.getItem("revure_user");
      const localUser = userStr ? JSON.parse(userStr) : null;
      const crewMemberId = user?.crew_member_id || localUser?.crew_member_id;

      if (!crewMemberId) return;

      try {
        const responseCount = await GetCreatorDashboardCount({ crew_member_id: crewMemberId });
        if (responseCount && !responseCount.error) {
          setDashboardStats({
            completedShoots: responseCount.data.data.completedShoots,
            upcomingShoots: responseCount.data.data.upcomingShoots,
            pendingRequests: responseCount.data.data.pendingRequests,
            equipmentRequests: responseCount.data.data.equipmentRequests,
          });
        }

        const responseStats = await GetCreatorStats({ crew_member_id: crewMemberId });
        if (responseStats && !responseStats.error) {
          setCreatorStats(responseStats.data.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };
    fetchStatsData();
  }, [user]);

  // 2. Fetch Dashboard Details (Logic from your code)
  useEffect(() => {
    const fetchDashboardDetails = async () => {
      const userStr = localStorage.getItem("revure_user");
      const localUser = userStr ? JSON.parse(userStr) : null;
      const crewMemberId = user?.crew_member_id || localUser?.crew_member_id;

      if (!crewMemberId) return;

      try {
        const response = await GetCreatorDashboardDetails({ crew_member_id: crewMemberId });
        if (response && !response.error) {
          const fetchedAllShoots = response.data.data.allShoots || [];
          const fetchedPending = response.data.data.pendingRequests || [];
          const upcomingPending = fetchedPending.filter((item: any) => {
            const dateStr =
              item?.project?.event_date ||
              item?.event_date ||
              item?.project?.shoot_date ||
              item?.shoot_date;
            return isUpcomingDate(dateStr) && !isCompletedFlag(item);
          });

          setAllShoots(fetchedAllShoots);
          setPendingRequests(upcomingPending);
          setDashboardStats((prev) => ({
            ...prev,
            pendingRequests: upcomingPending.length,
          }));

          const newMarkers: any[] = [];
          const getMarkers = async (list: any[], markerType: 'active' | 'pending') => {
            for (const item of list) {
              const loc = item.project?.event_location || item.display_location;
              if (loc && loc !== "Location TBD") {
                const coords = await geocodeAddress(loc);
                if (coords) {
                  newMarkers.push({ ...coords, type: markerType, originalData: item });
                }
              }
            }
          }

          await getMarkers(fetchedAllShoots, 'active');
          await getMarkers(upcomingPending, 'pending');

          setMapMarkers(newMarkers);

          if (newMarkers.length > 0) {
            setViewState(prev => ({
              ...prev,
              latitude: newMarkers[0].lat,
              longitude: newMarkers[0].lng,
              zoom: 6
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard details:", error);
      }
    };
    fetchDashboardDetails();
  }, [user]);

  // useEffect(() => {
  //   const userStr = localStorage.getItem("revure_user");
  //   const localUser = userStr ? JSON.parse(userStr) : null;
  //   // Map the status: 0=Pending, 1=Verified, 2=Rejected
  //   const status = user?.is_crew_verified ?? localUser?.is_crew_verified ?? 0;
  //   setVerificationStatus(Number(status));
  // }, [user]);

  useEffect(() => {
    const userStr = localStorage.getItem("revure_user");
    const localUser = userStr ? JSON.parse(userStr) : null;

    // Use (user as any) to bypass the TypeScript check
    const status = (user as any)?.is_crew_verified ?? localUser?.is_crew_verified ?? 0;

    setVerificationStatus(Number(status));
    console.log("Verification Status:", status);
    console.log("User Object:", user);
    console.log("verification status::::", verificationStatus);
  }, [user]);

  // if (verificationStatus === null) return null;

  // Geocoding Logic
  const geocodeAddress = async (address: string) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${NEXT_PUBLIC_MAPBOX_TOKEN}&limit=1`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        return { lng, lat };
      }
    } catch (error) {
      console.error("Geocoding failed for:", address, error);
    }
    return null;
  };

  // Availability Logic
  useEffect(() => {
    const userStr = localStorage.getItem("revure_user");
    const localUser = userStr ? JSON.parse(userStr) : null;
    const crewMemberId = localUser?.crew_member_id;

    if (!crewMemberId) return;

    getCrewAvailability({
      crew_member_id: crewMemberId,
      month: currentMonth,
      year: currentYear,
    }).then((response) => {
      if (response?.data?.data?.availability) {
        setAvailability(response.data.data.availability);
      }
    });
  }, [currentMonth, currentYear]);

  // Helper Component for Pending/Rejected States
  function VerificationStatusOverlay({ status }: { status: number }) {
    const isPending = status === 0;

    if (isSyncing) {
      return (
        <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#E8D1AB]/20 border-t-[#E8D1AB] rounded-full animate-spin mb-4" />
          <p className="text-[#E8D1AB] font-medium tracking-widest text-xs uppercase">Verifying Profile...</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
        <div className="mb-8 relative">
          <div className="w-24 h-24 rounded-full bg-[#E8D1AB]/5 border border-[#E8D1AB]/20 flex items-center justify-center animate-pulse">
            {isPending ? (
              <Clock size={40} className="text-[#E8D1AB]" />
            ) : (
              <AlertTriangle size={40} className="text-red-500" />
            )}
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mb-4">
          {isPending ? "Application Under Review" : "Application Status"}
        </h2>

        <p className="text-white/60 max-w-md leading-relaxed mb-8">
          {isPending
            ? "Welcome to the Beige collective. Our curation team is currently reviewing your portfolio and credentials. We maintain a high standard for our creators to ensure premium quality for our clients."
            : "Thank you for your interest in joining Beige. At this time, our team has decided not to move forward with your application. We appreciate your talent and wish you the best in your creative journey."
          }
        </p>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-sm w-full">
          <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#E8D1AB] mb-2">Next Steps</h4>
          <p className="text-sm text-white/80">
            {isPending
              ? "Reviews typically take 2-3 business days. You'll receive an email once your dashboard is fully activated."
              : "If you feel this was an error or your portfolio has significantly changed, feel free to contact our support team."
            }
          </p>
        </div>

        {isPending && (
          <Button
            variant="outline"
            className="mt-8 border-white/10 hover:bg-white/5 text-white/40"
            onClick={() => window.location.reload()}
          >
            Refresh Status
          </Button>
        )}
      </div>
    );
  }

  // Map Filter Logic
  const filteredMarkers = useMemo(() => {
    return mapMarkers.filter((marker) => {
      const matchesStatus = mapStatusFilter === "all" || marker.type === mapStatusFilter;
      const projectName = (marker.originalData?.project?.project_name || marker.originalData?.project_name || "").toLowerCase();
      const location = (marker.originalData?.project?.event_location || marker.originalData?.display_location || "").toLowerCase();
      const matchesSearch = projectName.includes(mapSearch.toLowerCase()) || location.includes(mapSearch.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [mapMarkers, mapSearch, mapStatusFilter]);

  // Donut Chart Slices (Updated to Gold Theme)
  const shootStatusSlices: DonutSlice[] = [
    {
      label: "Successful Shoots",
      value: creatorStats.completedShoots,
      colorHex: CHART_COLORS.purple,
      bulletClass: "bg-[#A879FF]"
    },
    {
      label: "Pending Shoots",
      value: creatorStats.pendingShoots,
      colorHex: CHART_COLORS.blue,
      bulletClass: "bg-[#36C1FF]"
    },
    {
      label: "Rejected Shoots",
      value: creatorStats.rejectedShoots,
      colorHex: CHART_COLORS.orange,
      bulletClass: "bg-[#FFC13F]"
    },
    {
      label: "Shoot Requests",
      value: creatorStats.shootRequests,
      colorHex: CHART_COLORS.green,
      bulletClass: "bg-[#2ED499]"
    },
  ];

  const shootCategorySlices: DonutSlice[] = useMemo(() => {
    const slices = [
      {
        label: "Photography Shoots",
        value: creatorStats.photographyShoots,
        colorHex: CHART_COLORS.purple,
        bulletClass: "bg-[#A879FF]"
      },
      {
        label: "Videography Shoots",
        value: Math.max(0, creatorStats.completedShoots - creatorStats.photographyShoots),
        colorHex: CHART_COLORS.blue,
        bulletClass: "bg-[#36C1FF]"
      },
      {
        label: "Rejected Shoots",
        value: creatorStats.rejectedShoots,
        colorHex: CHART_COLORS.orange,
        bulletClass: "bg-[#FFC13F]"
      },
      {
        label: "Shoot Requests",
        value: creatorStats.shootRequests,
        colorHex: CHART_COLORS.green,
        bulletClass: "bg-[#2ED499]"
      },
    ];

    if (categoryTypeFilter === "photography")
      return slices.filter(s => s.label.includes("Photography") || s.label.includes("Rejected") || s.label.includes("Requests"));
    if (categoryTypeFilter === "videography")
      return slices.filter(s => s.label.includes("Videography") || s.label.includes("Rejected") || s.label.includes("Requests"));

    return slices;
  }, [creatorStats, categoryTypeFilter]);

  if (verificationStatus === null) return null;

  if (verificationStatus !== 1) {
    return <VerificationStatusOverlay status={verificationStatus} />;
  }

  // ----------------------
  // RENDER
  // ----------------------
  return (
    <>
      <Topbar pathname={pathname} />

      <div
        className="overflow-hidden pb-30 p-4 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-5"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"
              }`}>Welcome back, {user?.name || "Partner"}</h1>
            <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>Performance overview and shoot schedule</p>
          </div>
        </div>

        {/* Stats Cards (Luxury Style) */}
        {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Completed Shoots"
          value={dashboardStats.completedShoots}
          icon={<Camera />}
          iconColor="text-[#E8D1AB]"
          hoverBorder="hover:border-[#E8D1AB]/30"
        />
        <StatCard
          label="Upcoming Shoots"
          value={dashboardStats.upcomingShoots}
          icon={<CalendarIcon />}
          iconColor="text-blue-400"
          hoverBorder="hover:border-blue-400/30"
        />
        <StatCard
          label="Pending Requests"
          value={dashboardStats.pendingRequests}
          icon={<Clock />}
          iconColor="text-yellow-500"
          hoverBorder="hover:border-yellow-500/30"
        />
        <StatCard
          label="Equipment Req."
          value={dashboardStats.equipmentRequests}
          icon={<Box />}
          iconColor="text-white/40"
          hoverBorder="hover:border-white/20"
        />
      </div> */}
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-2xl border p-4 transition-colors duration-300 ${isDark ? "bg-[#101010] border-[#3D3D3D]" : "bg-[#F4F5F7] border-[#E3E3E3]"}`}>
          <MetricCard
            id="completed"
            label="Completed Shoots"
            value={dashboardStats.completedShoots}
            icon={Camera}
            activeMetricCard={activeMetricCard}
            setActiveMetricCard={setActiveMetricCard}
            isDark={isDark}
            onClick={() => setMapStatusFilter("active")}
          />
          <MetricCard
            id="upcoming"
            label="Upcoming Shoots"
            value={dashboardStats.upcomingShoots}
            icon={CalendarIcon}
            activeMetricCard={activeMetricCard}
            setActiveMetricCard={setActiveMetricCard}
            isDark={isDark}
            onClick={() => setMapStatusFilter("active")}
          />
          <MetricCard
            id="pending"
            label="Pending Requests"
            value={dashboardStats.pendingRequests}
            icon={Clock}
            activeMetricCard={activeMetricCard}
            setActiveMetricCard={setActiveMetricCard}
            isDark={isDark}
            onClick={() => setMapStatusFilter("pending")}
          />
        </div>

        {/* Main Content Grid: Map & Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Map Section */}
          <div className={`lg:col-span-2 rounded-2xl border overflow-hidden flex flex-col min-h-[560px] transition-all duration-300 ${isDark
            ? "bg-[#171717] border-[#3D3D3D] text-white"
            : "bg-white border-[#E5E5E5] text-black shadow-sm"
            }`}>
            <div className={`rounded-t-2xl flex items-center justify-between border-b p-5 shrink-0 transition-colors duration-300 ${isDark
              ? "bg-[#101010] border-b-[#3D3D3D]"
              : "bg-[#FFFCF6] border-b-[#E5E5E5]"
              }`}>
              <div className="flex items-center gap-2">
                <div className="w-[3px] h-6 bg-[#E5D5B8]" />
                <h3 className={`text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-[#000000]"}`}>Shoot Map</h3>
              </div>
              <div className={`text-xs ${isDark ? "text-white/40" : "text-[#32323299]"}`}>
                {filteredMarkers.length} events
              </div>
            </div>
            <div className="relative flex-1 min-h-[500px]">
            {/* Map Controls */}
            <div className="absolute top-4 left-3 lg:left-4 z-10 flex flex-col lg:flex-row gap-2">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${isDark ? "text-white/40" : "text-black/40"}`} />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={mapSearch}
                  onChange={(e) => setMapSearch(e.target.value)}
                  className={`pl-10 h-10 border rounded-lg text-sm w-48 focus:outline-none focus:border-[#E8D1AB]/50 transition-all ${isDark
                    ? "bg-[#0B0F14]/90 border-white/10 text-white placeholder:text-white/30"
                    : "bg-[#FFFDF9]/95 border-[#E5E5E5] text-black placeholder:text-black/40 shadow-sm"
                    }`}
                />
              </div>

              {/* Filter Select Dropdown Trigger */}
              <Select value={mapStatusFilter} onValueChange={setMapStatusFilter}>
                <SelectTrigger className={`h-10 w-36 border transition-colors ${isDark
                  ? "bg-[#0B0F14]/90 border-white/10 text-white"
                  : "bg-[#FFFDF9]/95 border-[#E5E5E5] text-black shadow-sm"
                  }`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={`border transition-colors ${isDark ? "bg-[#0B0F14] border-white/10 text-white" : "bg-[#FFFDF9] border-[#E5E5E5] text-black"
                  }`}>
                  <SelectItem value="all">All events</SelectItem>
                  <SelectItem value="active">Active shoots</SelectItem>
                  <SelectItem value="pending">Requests</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mapbox Layer Element */}
            <Map
              {...viewState}
              onMove={(evt) => setViewState(evt.viewState)}
              style={{ width: "100%", height: "100%" }}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              mapboxAccessToken={NEXT_PUBLIC_MAPBOX_TOKEN}
            >
              <NavigationControl position="top-right" showCompass={false} />
              <GeolocateControl
                position="top-right"
                trackUserLocation={true}
                showUserLocation={true}
                onGeolocate={(e: any) => {
                  setViewState((prev) => ({
                    ...prev,
                    latitude: e.coords.latitude,
                    longitude: e.coords.longitude,
                    zoom: 14,
                  }));
                }}
              />
              {filteredMarkers.map((marker, idx) => (
                <Marker key={idx} latitude={marker.lat} longitude={marker.lng} anchor="bottom">
                  <div
                    onClick={() => { setProjectDetailsData(marker.originalData); setProjectDetailsOpen(true); }}
                    className={`p-1.5 rounded-full border-2 cursor-pointer transition-transform hover:scale-125 ${marker.type === 'active'
                      ? 'bg-[#E8D1AB] border-black text-black'
                      : 'bg-yellow-500 border-black text-black'
                      }`}
                  >
                    {marker.type === 'active' ? <Camera size={14} /> : <Clock size={14} />}
                  </div>
                </Marker>
              ))}
            </Map>

            {/* Map Floating Legend */}
            <div className={`absolute bottom-4 left-4 border p-4 rounded-xl shadow-2xl w-56 transition-all ${isDark
              ? "bg-[#0B0F14]/95 border-white/10"
              : "bg-[#FFFDF9]/95 border-[#E5E5E5]"
              }`}>
              <h4 className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-3 ${isDark ? "text-white/40" : "text-black/40"
                }`}>
                Status Legend
              </h4>
              <div className="space-y-2.5">
                <LegendItem color="bg-[#E8D1AB]" label="Active Shoots" count={allShoots.length} isDark={isDark} />
                <LegendItem color="bg-yellow-500" label="Pending Requests" count={pendingRequests.length} isDark={isDark} />
                <LegendItem color="bg-blue-400" label="Upcoming" count={dashboardStats.upcomingShoots} isDark={isDark} />
                <LegendItem
                  color={isDark ? "bg-white/20" : "bg-black/15"}
                  label="Equipment"
                  count={dashboardStats.equipmentRequests}
                  isDark={isDark}
                />
              </div>
            </div>
            </div>
          </div>

          {/* Availability Calendar */}
          <div className={`rounded-2xl border flex flex-col transition-all duration-300 ${isDark
            ? "bg-[#171717] border-[#3D3D3D] text-white"
            : "bg-white border-[#E5E5E5] text-black shadow-sm"
            }`}>
            {/* Header Section */}
            <div className={`rounded-t-2xl flex items-center justify-between border-b p-5 shrink-0 transition-colors duration-300 ${isDark
              ? "bg-[#101010] border-b-[#3D3D3D]"
              : "bg-[#FFFCF6] border-b-[#E5E5E5]"
              }`}>
              <div className="flex items-center gap-2">
                <div className="w-[3px] h-6 bg-[#E5D5B8]" />
                <h3 className={`text-sm lg:text-base font-medium flex items-center gap-2 ${isDark ? "text-white" : "text-[#000000]"}`}>
                  <CalendarIcon size={18} className="text-[#E8D1AB]" />
                  Availability
                </h3>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={handlePreviousMonth}
                  className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-white/5 text-white/40 hover:text-white" : "hover:bg-black/5 text-black/40 hover:text-black"
                    }`}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={handleNextMonth}
                  className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-white/5 text-white/40 hover:text-white" : "hover:bg-black/5 text-black/40 hover:text-black"
                    }`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">

            {/* Current Month Banner */}
            <div className="text-center font-bold text-sm mb-6 text-[#E8D1AB] uppercase tracking-widest">
              {date.toLocaleString("default", { month: "long", year: "numeric" })}
            </div>

            {/* Weekday Abbreviations Row */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} className={`text-center text-[10px] font-bold uppercase ${isDark ? "text-white/20" : "text-black/30"}`}>
                  {d.slice(0, 1)}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {(() => {
                const year = date.getFullYear();
                const month = date.getMonth();
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const today = new Date(); today.setHours(0, 0, 0, 0);

                const days = [];
                for (let i = 0; i < firstDay; i++) days.push(<div key={`e-${i}`} />);

                for (let d = 1; d <= daysInMonth; d++) {
                  const curDate = new Date(year, month, d);
                  const isToday = curDate.getTime() === today.getTime();
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const dayData = (availability as any)?.[dateStr];

                  // Base Dynamic Styles for standard days
                  let style = isDark
                    ? "border-white/5 text-white/60 hover:border-white/20 hover:bg-white/5"
                    : "border-[#E5E5E5] text-black/60 hover:border-[#E8D1AB]/50 hover:bg-[#FDF9F0]";

                  // Condition 1: Available (unassigned)
                  if (dayData && dayData.available === true && !dayData.projectAssigned) {
                    style = isDark
                      ? "border-[#E8D1AB]/30 bg-[#E8D1AB]/5 text-[#E8D1AB]"
                      : "border-[#E8D1AB]/40 bg-[#FDF9F0] text-[#8A7043]";
                  }

                  // Condition 2: Explicitly Unavailable
                  if (dayData && dayData.available === false && !dayData.projectAssigned) {
                    style = isDark
                      ? "border-red-600/40 bg-black text-[#E8D1AB]"
                      : "border-red-200 bg-red-50 text-black";
                  }

                  // Condition 3: Project Assigned
                  if (dayData?.projectAssigned === true) {
                    style = isDark
                      ? "border-[#E8D1AB]/50 bg-[#E8D1AB]/10 text-[#E8D1AB]"
                      : "border-[#E8D1AB]/60 bg-[#E8D1AB]/15 text-[#735A2B]";
                  }

                  // Condition 4: Today (highest override)
                  if (isToday) {
                    style = "bg-[#E8D1AB] text-black border-[#E8D1AB] font-bold shadow-sm";
                  }

                  days.push(
                    <button
                      key={d}
                      onClick={() => {
                        if (dayData?.projectDetails) {
                          setProjectDetailsData({ project: dayData.projectDetails });
                          setProjectDetailsOpen(true);
                        } else {
                          toast(`Date selected: ${dateStr}`);
                        }
                      }}
                      className={`aspect-square flex flex-col items-center justify-center text-xs rounded-lg border transition-all ${style}`}
                    >
                      {d}
                      {dayData?.projectAssigned === true && !isToday && (
                        <span className={`w-1 h-1 rounded-full mt-0.5 ${isDark || (dayData?.projectAssigned === true) ? "bg-[#E8D1AB]" : "bg-[#735A2B]"
                          }`} />
                      )}
                    </button>
                  );
                }
                return days;
              })()}
            </div>

            {/* Legend & Action Footer */}
            <div className={`mt-8 pt-6 border-t space-y-3 ${isDark ? "border-white/5" : "border-[#E5E5E5]"}`}>
              <div className={`flex items-center justify-between text-xs ${isDark ? "text-white/40" : "text-black/50"}`}>
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E8D1AB]/20 border border-[#E8D1AB]/50" />
                  <span>Shoot Assigned</span>
                </div>
                <span className="font-mono">Active</span>
              </div>
              <div className={`flex items-center justify-between text-xs ${isDark ? "text-white/40" : "text-black/50"}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full border ${isDark ? "bg-red-500/10 border-red-500/40" : "bg-red-50 border-red-300"}`} />
                  <span>Unavailable</span>
                </div>
                <span className="font-mono">Blocked</span>
              </div>
              <Button
                onClick={() => router.push("/creator/dashboard/availability")}
                className={`w-full mt-6 border transition-colors ${isDark
                  ? "bg-white/10 text-white border-white/10 hover:bg-white/15"
                  : "bg-[#E8D1AB] text-black border-[#E8D1AB] hover:bg-[#E8D1AB]/80 shadow-sm"
                  }`}
              >
                Go to Availability
              </Button>
            </div>
            </div>
          </div>
        </div>

        {/* Admin-style Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mt-5 lg:pb-0">
          <div>
            <ShootStatusGaugeCard
              slices={shootStatusSlices}
              isDark={isDark}
            />
          </div>
          <div>
            <ShootStatusGaugeCard
              title="Shoot Categories"
              rightControl={
                <div className={`flex p-1 rounded-lg border transition-all ${isDark
                  ? "bg-[#0B0F14] border-white/5"
                  : "bg-[#FFFCF6] border-[#E5E5E5]"
                  }`}>
                  <button
                    type="button"
                    onClick={() => setCategoryTypeFilter(categoryTypeFilter === "photography" ? "all" : "photography")}
                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${categoryTypeFilter === "photography" ? "bg-[#E8D1AB] text-black" : (isDark ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black")}`}
                  >
                    Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryTypeFilter(categoryTypeFilter === "videography" ? "all" : "videography")}
                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${categoryTypeFilter === "videography" ? "bg-[#E8D1AB] text-black" : (isDark ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black")}`}
                  >
                    Video
                  </button>
                </div>
              }
              slices={shootCategorySlices}
              isDark={isDark}
            />
          </div>
        </div>

        {/* --- MODALS --- */}
        <Dialog open={showTempEventPopup} onOpenChange={setShowTempEventPopup}>
          <DialogContent className={`max-w-md overflow-hidden rounded-xl lg:rounded-4xl border p-0 text-center shadow-[0_28px_90px_rgba(0,0,0,0.4)] transition-all ${isDark
            ? "border-white/10 bg-[#0A0A0A] text-white shadow-[0_28px_90px_rgba(0,0,0,0.6)]"
            : "border-[#E5E5E5] bg-[#FFFCF6] text-black shadow-[0_28px_90px_rgba(0,0,0,0.15)]"
            }`}>
            <DialogTitle className="sr-only">Switch to this event location?</DialogTitle>

            <div className={`px-7 py-7 border-b transition-colors ${isDark
              ? "border-white/10 bg-[linear-gradient(180deg,#141414_0%,#0E0E0E_100%)]"
              : "border-[#E5E5E5] bg-[linear-gradient(180deg,#FFFDF9_0%,#FDF6EB_100%)]"
              }`}>
              {/* Icon Frame */}
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] border border-[#E8D1AB]/20 bg-[#E8D1AB]/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <CalendarIcon size={30} className="text-[#E8D1AB]" />
              </div>

              <h2 className="lg:text-xl font-bold mb-2">Switch to this event location?</h2>
              <p className={`mx-auto mb-8 max-w-sm px-4 text-sm transition-colors ${isDark ? "text-white/50" : "text-black/60"}`}>
                {tempEventLocation
                  ? `"We’ll temporarily set your location to ${tempEventLocation} to match this event for a better experience."`
                  : "Do you want to continue with this event?"}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  disabled={isConfirmingTempEvent}
                  onClick={() => setShowTempEventPopup(false)}
                  className={`h-12 flex-1 rounded-lg lg:rounded-2xl border transition-colors ${isDark
                    ? "border-white/10 bg-[#111111] text-white/85 hover:bg-white/5"
                    : "border-[#E5E5E5] bg-[#F5F5F5] text-black/85 hover:bg-black/5"
                    }`}
                >
                  Not now
                </Button>
                <Button
                  disabled={isConfirmingTempEvent}
                  onClick={handleConfirmTempEvent}
                  className="h-12 flex-1 rounded-lg lg:rounded-2xl bg-[#E8D1AB] text-black hover:bg-[#d4be9a] font-semibold transition-colors"
                >
                  {isConfirmingTempEvent ? "Please wait..." : "Yes, update location"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Accept Shoot Modal */}
        <Dialog open={!!acceptShootEvent} onOpenChange={() => setAcceptShootEvent(null)}>
          <DialogContent className={`max-w-md overflow-hidden rounded-xl lg:rounded-4xl border p-0 text-center shadow-[0_28px_90px_rgba(0,0,0,0.4)] transition-all ${isDark
            ? "border-white/10 bg-[#0A0A0A] text-white shadow-[0_28px_90px_rgba(0,0,0,0.6)]"
            : "border-[#E5E5E5] bg-[#FFFCF6] text-black shadow-[0_28px_90px_rgba(0,0,0,0.15)]"
            }`}>
            <DialogTitle className="sr-only">Accept Request?</DialogTitle>
            <div className={`px-7 py-7 border-b transition-colors ${isDark
              ? "border-white/10 bg-[linear-gradient(180deg,#141414_0%,#0E0E0E_100%)]"
              : "border-[#E5E5E5] bg-[linear-gradient(180deg,#FFFDF9_0%,#FDF6EB_100%)]"
              }`}>
              {/* Icon Frame */}
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] border border-[#E8D1AB]/20 bg-[#E8D1AB]/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <CheckCircle2 size={32} className="text-[#E8D1AB]" />
              </div>

              <h2 className="text-xl font-bold mb-2">Accept Request?</h2>

              <p className={`mx-auto mb-8 max-w-sm px-4 text-sm transition-colors ${isDark ? "text-white/50" : "text-black/60"
                }`}>
                Confirming will add{" "}
                <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
                  {acceptShootEvent?.project_name}
                </span>{" "}
                to your production schedule.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setAcceptShootEvent(null)}
                  className={`h-12 flex-1 rounded-2xl border transition-colors ${isDark
                    ? "border-white/10 bg-[#111111] text-white/85 hover:bg-white/5"
                    : "border-[#E5E5E5] bg-[#F5F5F5] text-black/85 hover:bg-black/5"
                    }`}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleAcceptProject(acceptShootEvent.project_id, 1)}
                  className="h-12 flex-1 rounded-2xl bg-[#E8D1AB] text-black hover:bg-[#d4be9a] font-semibold transition-colors"
                >
                  Confirm
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Decline Equipment Modal */}
        <Dialog open={!!declineEquipmentItem} onOpenChange={() => setDeclineEquipmentItem(null)}>
          <DialogContent className={`max-w-xl overflow-hidden rounded-xl lg:rounded-4xl border p-0 shadow-[0_28px_90px_rgba(0,0,0,0.4)] transition-all ${isDark
            ? "border-white/10 bg-[#0A0A0A] text-white shadow-[0_28px_90px_rgba(0,0,0,0.6)]"
            : "border-[#E5E5E5] bg-[#FFFCF6] text-black shadow-[0_28px_90px_rgba(0,0,0,0.15)]"
            }`}>
            {/* Header Section */}
            <DialogHeader className={`px-7 py-6 border-b transition-colors ${isDark
              ? "border-white/10 bg-[linear-gradient(180deg,#141414_0%,#0E0E0E_100%)]"
              : "border-[#E5E5E5] bg-[linear-gradient(180deg,#FFFDF9_0%,#FDF6EB_100%)]"
              }`}>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="text-red-500" />
                Decline Request
              </DialogTitle>
            </DialogHeader>

            {/* Form Options Content */}
            <div className="space-y-5 px-7 py-6">
              <div className="space-y-3">
                <Label className={`text-xs uppercase tracking-widest ${isDark ? "text-white/40" : "text-black/40"}`}>
                  Reason for declining
                </Label>

                {["Schedule conflict", "Equipment unavailable", "Location too far", "Other"].map((reason) => (
                  <div
                    key={reason}
                    className={`flex items-center space-x-3 p-4 rounded-2xl border cursor-pointer transition-all ${isDark
                      ? "bg-[#111111] border-white/10 hover:border-white/20 hover:bg-[#151515]"
                      : "bg-[#FFFDF9] border-[#E5E5E5] hover:border-[#E8D1AB]/60 hover:bg-[#FDF9F0]"
                      }`}
                  >
                    <input type="radio" name="decline-reason" id={reason} className="accent-[#E8D1AB]" />
                    <Label
                      htmlFor={reason}
                      className={`font-normal cursor-pointer flex-1 transition-colors ${isDark ? "text-white/70" : "text-black/80"
                        }`}
                    >
                      {reason}
                    </Label>
                  </div>
                ))}
              </div>

              {/* Action Footer Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setDeclineEquipmentItem(null)}
                  className={`h-12 flex-1 rounded-2xl border transition-colors ${isDark
                    ? "border-white/10 bg-[#111111] text-white/85 hover:bg-white/5"
                    : "border-[#E5E5E5] bg-[#F5F5F5] text-black/85 hover:bg-black/5"
                    }`}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => { toast.error("Request declined"); setDeclineEquipmentItem(null); }}
                  className="h-12 flex-1 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
                >
                  Decline Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Project Details Modal */}
        <Dialog open={projectDetailsOpen} onOpenChange={setProjectDetailsOpen}>
          <DialogContent className={`max-w-2xl overflow-hidden rounded-xl lg:rounded-4xl border p-0 shadow-[0_28px_90px_rgba(0,0,0,0.4)] transition-all ${isDark
            ? "border-white/10 bg-[#0A0A0A] text-white shadow-[0_28px_90px_rgba(0,0,0,0.6)]"
            : "border-[#E5E5E5] bg-[#FFFCF6] text-black shadow-[0_28px_90px_rgba(0,0,0,0.15)]"
            }`}>
            {/* Header Section */}
            <div className={`p-6 border-b transition-colors ${isDark
              ? "border-white/10 bg-[linear-gradient(180deg,#141414_0%,#0E0E0E_100%)]"
              : "border-[#E5E5E5] bg-[linear-gradient(180deg,#FFFDF9_0%,#FDF6EB_100%)]"
              }`}>
              <DialogTitle className="text-xl font-bold text-[#E8D1AB]">Project Overview</DialogTitle>
            </div>

            {/* Content Details Body */}
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <Label className={`text-[10px] uppercase tracking-[0.2em] ${isDark ? "text-white/40" : "text-black/40"}`}>
                    Project Name
                  </Label>
                  <p className="font-bold text-lg leading-tight">
                    {projectDetailsData?.project?.project_name || projectDetailsData?.project_name || "Untitled"}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <Label className={`text-[10px] uppercase tracking-[0.2em] ${isDark ? "text-white/40" : "text-black/40"}`}>
                    Scheduled Date
                  </Label>
                  <p className="text-[#E8D1AB] font-mono">
                    {projectDetailsData?.project?.event_date || projectDetailsData?.event_date || "TBD"}
                  </p>
                </div>
              </div>

              <div className={`grid grid-cols-2 gap-8 border-t pt-6 transition-colors ${isDark ? "border-white/5" : "border-[#E5E5E5]"
                }`}>
                <div className="space-y-1">
                  <Label className={`text-[10px] uppercase tracking-[0.2em] ${isDark ? "text-white/40" : "text-black/40"}`}>
                    Time Window
                  </Label>
                  <p className={isDark ? "text-white/80" : "text-black/80"}>
                    {projectDetailsData?.project?.start_time && projectDetailsData?.project?.end_time
                      ? `${projectDetailsData.project.start_time} - ${projectDetailsData.project.end_time}`
                      : "TBD"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className={`text-[10px] uppercase tracking-[0.2em] ${isDark ? "text-white/40" : "text-black/40"}`}>
                    Location
                  </Label>
                  <div className={`flex items-center gap-2 text-sm ${isDark ? "text-white/80" : "text-black/80"}`}>
                    <MapPin size={14} className="text-[#E8D1AB]" />
                    <span className="truncate">
                      {formatDisplayLocation(projectDetailsData?.project?.event_location || projectDetailsData?.display_location)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex justify-end pt-6">
                <Button
                  onClick={() => setProjectDetailsOpen(false)}
                  className={`h-12 rounded-2xl border hover:border-[#E8D1AB] hover:text-[#E8D1AB] px-8 transition-all ${isDark
                    ? "bg-[#111111] border-white/10 text-white"
                    : "bg-[#F5F5F5] border-black/10 text-black"
                    }`}
                >
                  Close Details
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

// ----------------------
// SHARED UI COMPONENTS
// ----------------------

function MetricCard({
  id,
  label,
  value,
  icon: Icon,
  activeMetricCard,
  setActiveMetricCard,
  isDark,
  onClick,
}: {
  id: "completed" | "upcoming" | "pending";
  label: string;
  value: number;
  icon: React.ElementType;
  activeMetricCard: "completed" | "upcoming" | "pending";
  setActiveMetricCard: (id: "completed" | "upcoming" | "pending") => void;
  isDark: boolean;
  onClick: () => void;
}) {
  const isActive = activeMetricCard === id;

  return (
    <button
      type="button"
      onClick={() => {
        setActiveMetricCard(id);
        onClick();
      }}
      className={`relative group text-left cursor-pointer rounded-lg p-4 border transition-all duration-200 min-h-[150px] ${
        isActive
          ? "bg-[#ECD7B4] text-[#171717] border-transparent"
          : isDark
            ? "bg-[#101010] text-white border-transparent hover:border-white/30"
            : "bg-[#F4F5F7] text-[#323232] border-transparent hover:border-[#ECD7B4]"
      }`}
    >
      <div className="flex justify-between items-start mb-7">
        <span className={`text-sm font-medium ${isActive ? "text-black/70" : isDark ? "text-zinc-400" : "text-zinc-500"}`}>
          {label}
        </span>
        <div className={`p-2 rounded-full ${isActive ? "bg-[#171717] text-[#E8D1AB]" : isDark ? "bg-[#2C2C2C] text-white/60" : "bg-white text-[#E8D1AB]"}`}>
          <Icon size={20} />
        </div>
      </div>

      <div className="text-[26px] font-bold mb-2">{value}</div>

      <div className={`text-xs flex gap-1 items-center ${isActive ? "text-[#171717]" : isDark ? "text-white/70" : "text-zinc-500"}`}>
        <span className={`font-bold ${isActive ? "text-[#047726]" : "text-[#0DAE3D]"}`}>+0%</span>
        all time
      </div>

      <ArrowUpRight
        size={14}
        className={`absolute bottom-4 right-4 transition-colors ${
          isActive ? "text-black/60" : isDark ? "text-zinc-500 group-hover:text-white/80" : "text-zinc-400 group-hover:text-black"
        }`}
      />
    </button>
  );
}

/**
 * LegendItem for Map Status
 */
function LegendItem({ color, label, count, isDark = true }: { color: string; label: string; count: number; isDark?: boolean }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        {/* Color Pill Indicator */}
        <span className={`w-2 h-2 rounded-full ${color} transition-shadow ${isDark ? "shadow-[0_0_8px_rgba(0,0,0,0.5)]" : "shadow-[0_1px_3px_rgba(0,0,0,0.15)]"
          }`} />

        {/* Label Text */}
        <span className={`text-xs transition-colors ${isDark
          ? "text-white/50 group-hover:text-white/80"
          : "text-black/60 group-hover:text-black/90 font-medium"
          }`}>
          {label}
        </span>
      </div>

      {/* Count Badge */}
      <span className={`text-xs font-mono font-bold transition-colors ${isDark ? "text-white/80" : "text-black/80"
        }`}>
        {count}
      </span>
    </div>
  );
}
