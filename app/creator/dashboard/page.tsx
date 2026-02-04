"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { toast } from "sonner"; // Using sonner for the high-end look of the first code
import { useAuth } from "@/lib/hooks/useAuth";

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
import Map, { Marker } from "react-map-gl/mapbox";
import 'mapbox-gl/dist/mapbox-gl.css';

import {
  GetCreatorDashboardCount,
  getCrewAvailability,
  GetCreatorDashboardDetails,
  GetCreatorStats
} from "@/lib/api";

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

function makeConicGradient(slices: DonutSlice[]) {
  const total = slices.reduce((a, b) => a + b.value, 0) || 1;
  let start = 0;
  const parts: string[] = [];

  for (const s of slices) {
    const deg = (s.value / total) * 360;
    const end = start + deg;
    parts.push(`${s.colorHex} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`);
    start = end;
  }

  if (start < 360 && slices.length) {
    parts.push(`${slices[slices.length - 1].colorHex} ${start.toFixed(2)}deg 360deg`);
  }
  return `conic-gradient(${parts.join(", ")})`;
}

/**
 * DonutChartCard - Updated with Luxury Theme
 */
function DonutChartCard({
  title,
  subtitle,
  rightFilter,
  slices,
}: {
  title: string;
  subtitle?: string;
  rightFilter?: React.ReactNode;
  slices: DonutSlice[];
}) {
  const gradient = useMemo(() => makeConicGradient(slices), [slices]);
  const total = slices.reduce((a, b) => a + b.value, 0) || 0;

  return (
    <div className="bg-[#0B0B0B] border border-white/5 rounded-2xl p-6 transition-all hover:border-white/10">
      <div className="flex items-center justify-between mb-4 lg:mb-8">
        <div className="flex items-center gap-2">
          {/* The vertical accent line from your screenshot */}
          <div className="w-1 h-5 bg-[#E8D1AB] rounded-full" />
          <h3 className="font-medium lg:text-lg text-white/90">{title}</h3>
        </div>
        {rightFilter}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8 items-center">
        <div className="flex items-center justify-center relative">
          <div className="relative w-44 h-44 rounded-full" style={{ background: gradient }}>
            <div className="absolute inset-[35px] rounded-full bg-[#0B0B0B]" />
            {/* Inner Center Text like your screenshot */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 lg:space-y-4">
          {slices.map((s) => {
            return (
              <div key={s.label} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  {/* Circle with number inside - matching screenshot legend */}
                  <div
                    className="w-10 h-7 rounded-full border flex items-center justify-center text-[10px] font-bold"
                    style={{ borderColor: s.colorHex, color: 'white', backgroundColor: `${s.colorHex}15` }}
                  >
                    {s.value}
                  </div>
                  <p className="text-xs font-medium text-white/50 group-hover:text-white transition-colors">
                    {s.label}
                  </p>
                </div>
              </div>
            );
          })}
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

          setAllShoots(fetchedAllShoots);
          setPendingRequests(fetchedPending);

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
          await getMarkers(fetchedPending, 'pending');

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
    <div className="max-w-7xl mx-auto space-y-4 lg:space-y-8 pb-12 text-white bg-[#111] p-4 md:p-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Welcome back, {user?.name || "Partner"}</h1>
          <p className="text-sm lg:text-base text-white/60">Performance overview and shoot schedule</p>
        </div>
        {/* <div className="flex items-center gap-3">

        </div> */}
      </div>

      {/* Stats Cards (Luxury Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

      {/* Main Content Grid: Map & Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">

        {/* Map Section */}
        <div className="lg:col-span-2 bg-[#111] border border-white/5 rounded-lg lg:rounded-xl overflow-hidden relative min-h-[500px]">
          {/* Map Controls */}
          <div className="absolute top-4 left-3 lg:left-4 z-10 flex flex-col lg:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                placeholder="Search events..."
                className="pl-10 h-10 bg-[#0B0F14]/90 border border-white/10 rounded-lg text-sm w-48 focus:outline-none focus:border-[#E8D1AB]/50 transition-all text-white placeholder:text-white/30"
                value={mapSearch}
                onChange={(e) => setMapSearch(e.target.value)}
              />
            </div>
            <Select value={mapStatusFilter} onValueChange={setMapStatusFilter}>
              <SelectTrigger className="h-10 w-36 bg-[#0B0F14]/90 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0B0F14] border-white/10 text-white">
                <SelectItem value="all">All events</SelectItem>
                <SelectItem value="active">Active shoots</SelectItem>
                <SelectItem value="pending">Requests</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Map
            {...viewState}
            onMove={(evt) => setViewState(evt.viewState)}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            mapboxAccessToken={NEXT_PUBLIC_MAPBOX_TOKEN}
          >
            {filteredMarkers.map((marker, idx) => (
              <Marker key={idx} latitude={marker.lat} longitude={marker.lng} anchor="bottom">
                <div
                  onClick={() => { setProjectDetailsData(marker.originalData); setProjectDetailsOpen(true); }}
                  className={`p-1.5 rounded-full border-2 cursor-pointer transition-transform hover:scale-125 ${marker.type === 'active' ? 'bg-[#E8D1AB] border-black text-black' : 'bg-yellow-500 border-black text-black'
                    }`}
                >
                  {marker.type === 'active' ? <Camera size={14} /> : <Clock size={14} />}
                </div>
              </Marker>
            ))}
          </Map>

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 bg-[#0B0F14]/95 border border-white/10 p-4 rounded-xl shadow-2xl w-56">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-3">Status Legend</h4>
            <div className="space-y-2.5">
              <LegendItem color="bg-[#E8D1AB]" label="Active Shoots" count={allShoots.length} />
              <LegendItem color="bg-yellow-500" label="Pending Requests" count={pendingRequests.length} />
              <LegendItem color="bg-blue-400" label="Upcoming" count={dashboardStats.upcomingShoots} />
              <LegendItem color="bg-white/20" label="Equipment" count={dashboardStats.equipmentRequests} />
            </div>
          </div>
        </div>

        {/* Availability Calendar */}
        <div className="bg-[#111] border border-white/5 rounded-xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-white flex items-center gap-2">
              <CalendarIcon size={18} className="text-[#E8D1AB]" />
              Availability
            </h3>
            <div className="flex gap-1">
              <button onClick={handlePreviousMonth} className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"><ChevronLeft size={18} /></button>
              <button onClick={handleNextMonth} className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"><ChevronRight size={18} /></button>
            </div>
          </div>

          <div className="text-center font-bold text-sm mb-6 text-[#E8D1AB] uppercase tracking-widest">
            {date.toLocaleString("default", { month: "long", year: "numeric" })}
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-white/20 uppercase">{d.slice(0, 1)}</div>
            ))}
          </div>

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
                let style = "border-white/5 text-white/60 hover:border-white/20";

                if (dayData && dayData.available === true && !dayData.projectAssigned) {
                  style = "border-[#E8D1AB]/30 bg-[#E8D1AB]/5 text-[#E8D1AB]";
                }

                if (dayData && dayData.available === false && !dayData.projectAssigned) {
                  style = "border-red-600/40 bg-black text-[#E8D1AB]";
                }

                if (dayData?.projectAssigned === true) {
                  style = "border-[#E8D1AB]/50 bg-[#E8D1AB]/10 text-[#E8D1AB]";
                }
                if (isToday) {
                  style = "bg-[#E8D1AB] text-black border-[#E8D1AB] font-bold";
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
                      <span className="w-1 h-1 bg-[#E8D1AB] rounded-full mt-0.5" />
                    )}
                  </button>
                );
              }
              return days;
            })()}
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
            <div className="flex items-center justify-between text-[11px] text-white/40">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E8D1AB]/20 border border-[#E8D1AB]/50" />
                <span>Shoot Assigned</span>
              </div>
              <span className="font-mono">Active</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-white/40">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/10 border border-red-500/40" />
                <span>Unavailable</span>
              </div>
              <span className="font-mono">Blocked</span>
            </div>
            <Button
              className="w-full mt-6 bg-white/10 text-white border border-white/10 hover:bg-white/15"
              onClick={() => router.push("/creator/dashboard/availability")}
            >
              Go to Availability
            </Button>
          </div>
        </div>
      </div>

      {/* Donut Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <DonutChartCard
          title="Shoot Status"
          subtitle="Pipeline performance metrics"
          slices={shootStatusSlices}
        />
        <DonutChartCard
          title="Shoot Categories"
          subtitle="Distribution of media types"
          rightFilter={
            <div className="flex bg-[#0B0F14] p-1 rounded-lg border border-white/5">
              <button
                onClick={() => setCategoryTypeFilter(categoryTypeFilter === "photography" ? "all" : "photography")}
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${categoryTypeFilter === "photography" ? "bg-[#E8D1AB] text-black" : "text-white/40 hover:text-white"}`}
              >Photo</button>
              <button
                onClick={() => setCategoryTypeFilter(categoryTypeFilter === "videography" ? "all" : "videography")}
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${categoryTypeFilter === "videography" ? "bg-[#E8D1AB] text-black" : "text-white/40 hover:text-white"}`}
              >Video</button>
            </div>
          }
          slices={shootCategorySlices}
        />
      </div>

      {/* --- MODALS --- */}

      {/* Accept Shoot Modal */}
      <Dialog open={!!acceptShootEvent} onOpenChange={() => setAcceptShootEvent(null)}>
        <DialogContent className="bg-[#111] border-white/10 text-white max-w-sm text-center">
          <div className="py-6">
            <div className="w-16 h-16 bg-[#E8D1AB]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-[#E8D1AB]" />
            </div>
            <h2 className="text-xl font-bold mb-2">Accept Request?</h2>
            <p className="text-white/40 text-sm mb-8 px-4">
              Confirming will add <span className="text-white font-medium">{acceptShootEvent?.project_name}</span> to your production schedule.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 hover:bg-white/5" onClick={() => setAcceptShootEvent(null)}>Cancel</Button>
              <Button className="flex-1 bg-[#E8D1AB] text-black hover:bg-[#d4be9a] font-bold" onClick={() => handleAcceptProject(acceptShootEvent.project_id, 1)}>Confirm</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Decline Equipment Modal */}
      <Dialog open={!!declineEquipmentItem} onOpenChange={() => setDeclineEquipmentItem(null)}>
        <DialogContent className="bg-[#111] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="text-red-500" />
              Decline Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label className="text-white/40 text-xs uppercase tracking-widest">Reason for declining</Label>
              {["Schedule conflict", "Equipment unavailable", "Location too far", "Other"].map((reason) => (
                <div key={reason} className="flex items-center space-x-3 bg-[#0B0F14] p-3 rounded-lg border border-white/5 cursor-pointer hover:border-white/10 transition-all">
                  <input type="radio" name="decline-reason" id={reason} className="accent-[#E8D1AB]" />
                  <Label htmlFor={reason} className="text-white/70 font-normal cursor-pointer flex-1">{reason}</Label>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="ghost" className="flex-1" onClick={() => setDeclineEquipmentItem(null)}>Cancel</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold" onClick={() => { toast.error("Request declined"); setDeclineEquipmentItem(null); }}>Decline Request</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Details Modal */}
      <Dialog open={projectDetailsOpen} onOpenChange={setProjectDetailsOpen}>
        <DialogContent className="bg-[#111] border-white/10 text-white max-w-lg p-0 overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-[#0B0F14]">
            <DialogTitle className="text-xl font-bold text-[#E8D1AB]">Project Overview</DialogTitle>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <Label className="text-white/40 text-[10px] uppercase tracking-[0.2em]">Project Name</Label>
                <p className="font-bold text-lg leading-tight">{projectDetailsData?.project?.project_name || projectDetailsData?.project_name || "Untitled"}</p>
              </div>
              <div className="text-right space-y-1">
                <Label className="text-white/40 text-[10px] uppercase tracking-[0.2em]">Scheduled Date</Label>
                <p className="text-[#E8D1AB] font-mono">{projectDetailsData?.project?.event_date || projectDetailsData?.event_date || "TBD"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-6">
              <div className="space-y-1">
                <Label className="text-white/40 text-[10px] uppercase tracking-[0.2em]">Time Window</Label>
                <p className="text-white/80">
                  {projectDetailsData?.project?.start_time && projectDetailsData?.project?.end_time
                    ? `${projectDetailsData.project.start_time} - ${projectDetailsData.project.end_time}`
                    : "TBD"}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-white/40 text-[10px] uppercase tracking-[0.2em]">Location</Label>
                <div className="flex items-center gap-2 text-white/80">
                  <MapPin size={14} className="text-[#E8D1AB]" />
                  <span className="truncate">{formatDisplayLocation(projectDetailsData?.project?.event_location || projectDetailsData?.display_location)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <Button onClick={() => setProjectDetailsOpen(false)} className="bg-transparent border border-white/10 hover:border-[#E8D1AB] hover:text-[#E8D1AB] text-white px-8 transition-all">
                Close Details
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ----------------------
// SHARED UI COMPONENTS
// ----------------------

/**
 * StatCard - Large Value with Subtle Top-Right Icon
 */
function StatCard({ label, value, icon, iconColor, hoverBorder }: any) {
  return (
    <div className={`bg-[#111] rounded-lg lg:rounded-xl p-4 lg:p-6 border border-white/5 relative overflow-hidden group ${hoverBorder} transition-all duration-300 min-h-[120px] flex flex-col justify-center`}>
      {/* <div className="hidden lg:absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-300">
        {React.cloneElement(icon, { size: 48, className: iconColor })}
      </div> */}
      <div className="absolute top-2 right-2 lg:top-0 lg:right-0 p-3 lg:p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-300">
        {React.cloneElement(icon, {
          // Responsive size logic
          size: "100%",
          className: `${iconColor} w-8 h-8 lg:w-12 lg:h-12`
        })}
      </div>
      <div className="relative z-10">
        <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">{label}</p>
        <p className="text-2xl lg:text-4xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

/**
 * LegendItem for Map Status
 */
function LegendItem({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <span className={`w-2 h-2 rounded-full ${color} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />
        <span className="text-xs text-white/50 group-hover:text-white/80 transition-colors">{label}</span>
      </div>
      <span className="text-xs font-mono font-bold text-white/80">{count}</span>
    </div>
  );
}