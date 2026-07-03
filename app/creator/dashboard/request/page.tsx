"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Search,
  Check,
  X,
  Camera,
  Ban,
  AlertTriangle,
  CheckCircle2,
  Grid3X3,
  List,
  MoreVertical,
  ChevronRight,
  Pencil,
  Trash2,
  Info
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// UI Components
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { getStatusCount, getPendingProjects, GetUpcomingShoots, getAcceptedShoots, acceptOrDeclineProject } from "@/lib/api";
// import ProjectDetailsModal from "@/Crew/ProfileDetailsModal";
import ProjectDetailsContainer from "@/Crew/ProjectDetailsContainer";
import { getProject } from "@/lib/api";

import { toast } from "sonner";
import { MobileRow } from "@/components/creator-profile/MobileRow";
import { StatCard } from "@/components/admin/StatCard";
import Topbar from "@/components/admin/Topbar";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

export default function RequestsShootsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /* ---------------- VIEW TOGGLE STATE ---------------- */
  const view = (searchParams.get("view") as "grid" | "list") || "grid";
  const [isOpen, setIsOpen] = useState(false);
  const activeTab = (searchParams.get("tab") as "requests" | "shoots") || "requests";

  // Modals & Data State
  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [projectDetailsData, setProjectDetailsData] = useState(null);
  const [acceptShootEvent, setAcceptShootEvent] = useState<any>(null);
  const [declineShootEvent, setDeclineShootEvent] = useState<any>(null);

  // Filter States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [declineReason, setDeclineReason] = useState("Schedule conflict");
  const [declineComments, setDeclineComments] = useState("");

  // Business Logic States
  const [crewMemberId, setCrewMemberId] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [shoots, setShoots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [computedStats, setComputedStats] = useState<{
    pendingRequests: number;
    confirmedRequests: number;
    completedShoots: number;
    declinedRequests: number;
  } | null>(null);

  const { isDark } = useResolvedTheme()

  /* ---------------- LOAD USER ---------------- */
  useEffect(() => {
    const userStr = localStorage.getItem("revure_user");
    if (userStr) {
      try {
        const revure_user = JSON.parse(userStr);
        if (revure_user?.crew_member_id) setCrewMemberId(revure_user.crew_member_id);
      } catch (e) {
        console.error("User parse error", e);
      }
    }
  }, []);

  useEffect(() => {
    if (crewMemberId) fetchData();
  }, [crewMemberId]);

  useEffect(() => {
    setStatusFilter("all");
  }, [activeTab]);

  const getCrewMemberId = () => {
    const userStr = localStorage.getItem("revure_user");
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      return user?.crew_member_id ?? null;
    } catch {
      return null;
    }
  };

  /* ---------------- FETCH DATA ---------------- */
  const fetchData = async () => {
    const crew_member_id = getCrewMemberId();
    if (!crew_member_id) {
      toast.error("Invalid user session");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    try {
      const statsPayload = {
        creator_id: crew_member_id,
        crew_member_id: crew_member_id
      };
      const statsResponse = await getStatusCount(statsPayload);
      if (statsResponse && statsResponse.error === false) {
        setDashboardStats(statsResponse.data);
      }

      const commonPayload = { crew_member_id };
      const [pendingRes, upcomingRes, acceptedRes] = await Promise.all([
        getPendingProjects(commonPayload),
        GetUpcomingShoots(commonPayload),
        getAcceptedShoots(commonPayload),
      ]);

      const allProjects: any[] = [];
      const pendingFiltered =
        pendingRes && pendingRes.error === false && Array.isArray(pendingRes.data)
          ? pendingRes.data.filter((p: any) => {
            const dateStr = p.event_date || p.shoot_date;
            return isUpcomingDate(dateStr);
          })
          : [];
      if (pendingFiltered.length > 0) {
        allProjects.push(
          ...pendingFiltered.map((p: any) => ({
            ...p,
            status: "Pending",
            project_id: p.project_id || p.id,
          }))
        );
      }
      const upcomingFiltered =
        upcomingRes && upcomingRes.error === false && Array.isArray(upcomingRes.data)
          ? upcomingRes.data.filter((p: any) => {
            const dateStr = p.event_date || p.shoot_date;
            return isUpcomingDate(dateStr);
          })
          : [];
      if (upcomingFiltered.length > 0) {
        allProjects.push(
          ...upcomingFiltered.map((p: any) => ({
            ...p,
            status: "Confirmed",
            project_id: p.project_id || p.id,
          }))
        );
      }
      setProjects(allProjects);

      if (acceptedRes && acceptedRes.error === false && Array.isArray(acceptedRes.data)) {
        const acceptedProjects = acceptedRes.data.map((p: any) => ({
          ...p,
          status: p.is_completed ? "Completed" : "Confirmed",
          project_id: p.project_id || p.id,
        }));
        setShoots(acceptedProjects);
        const completedCount = acceptedProjects.filter((p: any) => isCompletedFlag(p)).length;
        const confirmedCount = acceptedProjects.filter((p: any) => !isCompletedFlag(p)).length;
        setComputedStats({
          pendingRequests: pendingFiltered.length,
          confirmedRequests: confirmedCount,
          completedShoots: completedCount,
          declinedRequests: dashboardStats?.declinedRequests || 0,
        });
      } else {
        setShoots([]);
        setComputedStats({
          pendingRequests: pendingFiltered.length,
          confirmedRequests: 0,
          completedShoots: 0,
          declinedRequests: dashboardStats?.declinedRequests || 0,
        });
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const formatLocation = (locationInput) => {
    if (!locationInput || locationInput === "Location TBD") return "Location TBD";
    let addressStr = locationInput;
    try {
      const parsed = typeof locationInput === 'string' ? JSON.parse(locationInput) : locationInput;
      if (parsed && parsed.address) addressStr = parsed.address;
    } catch (e) { }

    const parts = addressStr.split(',').map(p => p.trim());
    if (parts.length >= 3) {
      const country = parts[parts.length - 1];
      const stateZip = parts[parts.length - 2];
      const city = parts[parts.length - 3];
      const state = stateZip.replace(/\d+/g, '').trim();
      return `${city}, ${state}, ${country}`;
    }
    return addressStr;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "TBD";
    const dateOnlyMatch = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const date = dateOnlyMatch
      ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
      : new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).replace(/ /g, ' ').replace(/(\w{3}) (\d{4})/, '$1, $2');
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
    return flag === true || flag === 1 || flag === "1";
  };

  /* ---------------- ACTIONS ---------------- */
  const handleAcceptProject = async (projectId: number, accept: boolean) => {
    const crew_member_id = getCrewMemberId();
    if (!crew_member_id) {
      toast.error("Invalid user session");
      return;
    }

    try {
      const response = await acceptOrDeclineProject({
        project_id: projectId,
        crew_member_id,
        crew_accept: accept ? 1 : 2,
      });

      if (response && response.error === false) {
        toast.success(accept ? "Shoot request accepted" : "Shoot request declined");
        setAcceptShootEvent(null);
        setDeclineShootEvent(null);
        setDeclineReason("Schedule conflict");
        setDeclineComments("");
        await fetchData();
      } else {
        toast.error(response?.message || "Failed to update project status");
      }
    } catch (err) {
      console.error("Action Error:", err);
      toast.error("An unexpected error occurred");
    }
  };

  const handleOpenProjectDetails = async (projectId: number) => {
    try {
      const res = await getProject(projectId);
      if (!res?.error && res?.data) {
        setProjectDetailsData(res.data);
        setProjectDetailsOpen(true);
      } else {
        toast.error(res?.message || "Failed to load project details");
      }
    } catch (e) {
      toast.error("Failed to load project details");
    }
  };

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleViewChange = (mode: 'grid' | 'list') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", mode);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setIsOpen(false);
  };

  const handleTabChange = (tabName: "requests" | "shoots") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabName);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };


  /* ---------------- FILTERING ---------------- */
  const visibleProjects = activeTab === "requests" ? projects : shoots;
  const filteredProjects = visibleProjects.filter((p) => {
    const title = (p.project_name || p.title || "").toLowerCase();
    const matchesSearch = title.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E8D1AB]" />
      </div>
    );
  }

  if (projectDetailsOpen && projectDetailsData) {
    return (
      <ProjectDetailsContainer
        apiResponse={projectDetailsData}
        currentCrewMemberId={crewMemberId}
        onBack={() => {
          setProjectDetailsOpen(false);
          setProjectDetailsData(null);
        }}
        pathname={pathname}
      />
    );
  }


  return (
    <>
      <Topbar pathname={pathname} />
      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8">
        {/* Header */}
        <div className="space-y-4 lg:space-y-8">
          {/* 1. Simple Header: Title & Description */}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Requests & Shoots</h1>
            <p className={`mt-1 text-xs lg:text-sm transition-colors ${isDark ? "text-white/45" : "text-[#171717B2]"}`}>Manage your production schedule and requests</p>
          </div>

          {/* 2. Tabs */}
          <div
            // className="inline-flex items-center gap-1 rounded-xl bg-[#171717] border border-white/10 p-1"
            className={`flex items-center gap-1 p-1 rounded-xl w-fit border transition-all duration-300 ${isDark
              ? "bg-[#111] border-[#333]"
              : "bg-[#fff] border-[#E5E5E5]"
              }`}
          >
            <button
              onClick={() => handleTabChange("requests")}
              className={`px-4 lg:px-6 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all duration-300 ${activeTab === "requests"
                ? (isDark
                  ? "bg-[#E5D5B8] text-black shadow-lg"
                  : "bg-[#E8D1AB] text-black shadow-sm")
                : (isDark
                  ? "text-[#777] hover:text-white"
                  : "text-[#888] hover:text-black")
                }`}
            >
              Requests
            </button>
            <button
              onClick={() => handleTabChange("shoots")}
              className={`px-4 lg:px-6 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all duration-300 ${activeTab === "shoots"
                ? (isDark
                  ? "bg-[#E5D5B8] text-black shadow-lg"
                  : "bg-[#E8D1AB] text-black shadow-sm")
                : (isDark
                  ? "text-[#777] hover:text-white"
                  : "text-[#888] hover:text-black")
                }`}
            >
              Shoots
            </button>
          </div>

          {/* 3. Stats Cards Section */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Pending Requests"
              value={(computedStats?.pendingRequests ?? dashboardStats?.pendingRequests) || 0}
              icon={Clock}
              iconColor="text-yellow-500"
              valueColor="text-yellow-500"
              hoverBorder="hover:border-yellow-500/30"
              isDark={isDark}
            />
            <StatCard
              label="Confirmed Shoots"
              value={(computedStats?.confirmedRequests ?? dashboardStats?.confirmedRequests) || 0}
              icon={Camera}
              iconColor="text-[#E8D1AB]"
              hoverBorder="hover:border-[#E8D1AB]/30"
              isDark={isDark}
            />
            <StatCard
              label="Completed"
              value={(computedStats?.completedShoots ?? dashboardStats?.completedShoots) || 0}
              icon={CheckCircle2}
              iconColor="text-green-400"
              valueColor="text-green-400"
              hoverBorder="hover:border-green-400/30"
              isDark={isDark}
            />
            <StatCard
              label="Declined"
              value={(computedStats?.declinedRequests ?? dashboardStats?.declinedRequests) || 0}
              icon={Ban}
              iconColor="text-red-400"
              valueColor="text-red-400"
              hoverBorder="hover:border-red-400/30"
              isDark={isDark}
            />
          </div>

          {/* 3. Filter Bar: Search, Select, and View Toggle */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Search Box - Now Left Aligned */}
            {/* <div className="relative w-full lg:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search projects..."
                className="pl-10 bg-[#1A1A1A] border-white/5 w-full md:w-[250px]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div> */}

            <div className={`relative flex w-full lg:max-w-xl items-center gap-1 p-1 rounded-xl border transition-all duration-300 ${isDark ? "bg-[#111] border-[#333]" : "bg-[#fff] border-[#E5E5E5]"}`}>
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isDark ? "text-white/40" : "text-black/40"}`} />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`h-9 w-full min-w-0 pl-10 pr-4 rounded-lg text-xs lg:text-sm transition-all focus:outline-none focus:ring-1 ${isDark
                  ? "bg-[#18181b] text-white placeholder:text-white/40 focus:ring-[#E8D1AB]"
                  : "bg-[#F8F8F8] text-black placeholder:text-black/40 focus:ring-[#E8D1AB]"
                  }`}
              />
            </div>


            {/* Filter Group - Grouped to stay on the Right */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={`rounded-xl min-w-[170px] ${isDark ? "border-white/10 bg-[#1A1A1A] text-white data-[placeholder]:text-white/50 " : "bg-[#fff] border-[#E3E3E3] text-[#323232]"} `}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className={`${isDark ? "bg-[#1A1A1A] border-white/10 text-white " : "bg-[#F0F0F0] border-[#E3E3E3] text-[#323232]"}`}>
                  <SelectItem value="all" className={isDark ? "focus:bg-[#1E1E1E] focus:text-white" : "focus:bg-[#E8D1AB] focus:text-black"}>All Status</SelectItem>
                  <SelectItem value="confirmed" className={isDark ? "focus:bg-[#1E1E1E] focus:text-white" : "focus:bg-[#E8D1AB] focus:text-black"}>Confirmed</SelectItem>
                  {activeTab === "requests" ? (
                    <SelectItem value="pending" className={isDark ? "focus:bg-[#1E1E1E] focus:text-white" : "focus:bg-[#E8D1AB] focus:text-black"}>Pending</SelectItem>
                  ) : (
                    <SelectItem value="completed" className={isDark ? "focus:bg-[#1E1E1E] focus:text-white" : "focus:bg-[#E8D1AB] focus:text-black"}>Completed</SelectItem>
                  )}
                </SelectContent>
              </Select>

              {/* MOBILE VIEW: Dropdown Button */}
              <div className="md:hidden relative">
                <Button
                  onClick={toggleDropdown}
                  className={`flex items-center gap-2 ${isDark ? "border-[#FFFFFF33] bg-[#202020] text-white" : "border-[#E5E5E5] bg-white text-black"} border p-2 h-12 w-12 rounded-lg `}
                >
                  {view === 'grid' ? <Grid3X3 size={20} /> : <List size={20} />}
                </Button>

                {/* Dropdown Menu */}
                {isOpen && (
                  <div className={`absolute top-full right-0 mt-2 w-48 border border-white/10 rounded-xl shadow-2xl z-[50] overflow-hidden ${isDark ? "border-[#FFFFFF33] bg-[#171717] text-white" : "border-[#E5E5E5] bg-[#FFFCF6] text-black"}`}>
                    <button
                      onClick={() => handleViewChange('grid')}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${view === 'grid'
                        ? (isDark ? "bg-white/10 text-white" : "bg-black/5 font-medium text-black")
                        : (isDark ? "text-white/60 hover:bg-white/5" : "text-black/60 hover:bg-black/5")
                        }`}
                    >
                      <Grid3X3 size={18} />
                      Grid View
                    </button>
                    <button
                      onClick={() => handleViewChange('list')}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${view === 'list'
                        ? (isDark ? "bg-white/10 text-white" : "bg-black/5 font-medium text-black")
                        : (isDark ? "text-white/60 hover:bg-white/5" : "text-black/60 hover:bg-black/5")
                        }`}
                    >
                      <List size={18} />
                      List View
                    </button>
                  </div>
                )}
              </div>

              {/* DESKTOP VIEW: Original Toggle */}
              <div className={`hidden lg:flex ${isDark ? "border-[#FFFFFF33] bg-[#202020]" : "border-[#E5E5E5] bg-white"} p-1 rounded-xl border w-fit`}>
                <button
                  onClick={() => handleViewChange("grid")}
                  className={`relative z-10 inline-flex items-center justify-center rounded-lg  px-3.5 py-2.5 text-sm font-medium transition-colors duration-300 ${view === "grid"
                    ? isDark ? "bg-[#E5D5B8] text-black" : "bg-[#E8D1AB] text-black"
                    : isDark
                      ? "text-white/60 hover:text-white"
                      : "text-[#666666] hover:text-black"
                    }`}
                >
                  <Grid3X3 size={20} />
                </button>
                <button
                  onClick={() => handleViewChange("list")}
                  className={`relative z-10 inline-flex items-center justify-center rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors duration-300 ${view === "list"
                    ? isDark ? "bg-[#E5D5B8] text-black" : "bg-[#E8D1AB] text-black"
                    : isDark
                      ? "text-white/60 hover:text-white"
                      : "text-[#666666] hover:text-black"
                    }`}
                >
                  <List size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div>
          {filteredProjects.length > 0 ? (
            view === "grid" ? (
              /* --- DYNAMIC GRID VIEW --- */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredProjects.map((item) => (
                  <div
                    key={item.project_id}
                    className={`border rounded-lg lg:rounded-xl p-4 lg:p-6 transition-all group ${isDark
                      ? "bg-[#111] border-white/5 hover:border-[#E8D1AB]/40"
                      : "bg-white border-[#E5E5E5] hover:border-[#E8D1AB]/60 shadow-sm"
                      }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${item.status === "Completed"
                          ? "bg-emerald-400/10 text-emerald-400"
                          : item.status === "Confirmed"
                            ? "bg-green-400/10 text-green-400"
                            : "bg-blue-400/10 text-blue-400"
                          }`}
                      >
                        {item.status}
                      </span>
                      <span className={`text-xs italic ${isDark ? "text-white/20" : "text-black/30"}`}>
                        Recently updated
                      </span>
                    </div>

                    <h3 className={`text-xl font-bold mb-4 group-hover:text-[#E8D1AB] transition-colors capitalize ${isDark ? "text-white" : "text-black"}`}>
                      {item.project_name || item.title || "Untitled Project"}
                    </h3>

                    <div className="space-y-3 mb-4 lg:mb-6">
                      <div className={`flex items-center gap-3 text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
                        <CalendarIcon size={16} className="text-[#E8D1AB]" />
                        <span>{formatDate(item.event_date || item.shoot_date || "TBD")}</span>
                      </div>
                      <div className={`flex items-center gap-3 text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
                        <MapPin size={16} className="text-[#E8D1AB]" />
                        <span className="truncate">
                          {formatLocation(item.event_location || item.location)}
                        </span>
                      </div>
                    </div>

                    <div className={`flex items-center justify-between pt-4 border-t ${isDark ? "border-white/5" : "border-[#E5E5E5]"}`}>
                      <Button
                        onClick={() => handleOpenProjectDetails(item.project_id)}
                        className={`border hover:border-[#E8D1AB] hover:text-[#E8D1AB] px-6 ${isDark
                          ? "bg-transparent border-white/10 text-white"
                          : "bg-[#FFFCF6] border-black/15 text-black"
                          }`}
                      >
                        View Details
                      </Button>

                      {item.status === "Pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            onClick={() => setAcceptShootEvent(item)}
                            className="bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-colors"
                          >
                            <Check size={18} />
                          </Button>
                          <Button
                            size="icon"
                            onClick={() => setDeclineShootEvent(item)}
                            className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                          >
                            <X size={18} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* --- DYNAMIC LIST VIEW (Matches Screenshot Style) --- */
              <div className={`border rounded-xl overflow-hidden transition-all ${isDark ? "bg-[#111] border-white/5" : "bg-white border-[#E5E5E5] shadow-sm"}`}>
                {/* DESKTOP TABLE VIEW */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`text-xs uppercase tracking-wider transition-colors border-b ${isDark ? "bg-white/[0.03] text-white/40 border-white/5" : "bg-black/[0.05] text-black/40 border-[#E5E5E5]"}`}>
                        <th className="px-6 py-4 font-semibold">Shoot ID</th>
                        <th className="px-6 py-4 font-semibold">Name</th>
                        <th className="px-6 py-4 font-semibold">Location</th>
                        <th className="px-6 py-4 font-semibold">Email</th>
                        <th className="px-6 py-4 font-semibold">Category</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold text-right pr-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-[#E5E5E5]"}`}>
                      {filteredProjects.map((item) => {
                        // Status Logic Mapping
                        let statusBg = "bg-[#FEF9C3]"; // Light Yellow
                        let statusText = "text-[#854D0E]"; // Dark Yellow/Brown
                        let label = "Pending";

                        if (item.status === "Confirmed") {
                          statusBg = "bg-[#DCFCE7]"; // Light Green
                          statusText = "text-[#166534]"; // Dark Green
                          label = "Approved";
                        } else if (item.status === "Completed") {
                          statusBg = "bg-[#D1FAE5]"; // Light Emerald
                          statusText = "text-[#065F46]"; // Dark Emerald
                          label = "Completed";
                        } else if (item.status === "Rejected" || item.status === "Declined") {
                          statusBg = "bg-[#FEE2E2]"; // Light Red
                          statusText = "text-[#991B1B]"; // Dark Red
                          label = "Rejected";
                        }

                        return (
                          <tr
                            key={item.project_id}
                            className={`transition-colors group ${isDark ? "hover:bg-white/[0.01]" : "hover:bg-[#FFFCF6]/50"}`}
                          >
                            {/* Shoot ID Column */}
                            <td className={`px-6 py-5 text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
                              #{item.project_id?.toString().slice(-6) || "123456"}
                            </td>

                            {/* Name/Project Details Column */}
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                <div className="shrink-0 h-10 w-10 rounded-full bg-[#E8D1AB]/20 border border-[#E8D1AB]/10 overflow-hidden flex items-center justify-center text-[#E8D1AB] font-bold text-xs">
                                  {(item.project_name || "PR").split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                </div>
                                <div>
                                  <div className={`text-sm font-bold leading-tight ${isDark ? "text-white" : "text-black"}`}>
                                    {item.project_name || "Untitled"}
                                  </div>
                                  <div className={`text-xs mt-0.5 ${isDark ? "text-white/40" : "text-black/40"}`}>
                                    Production Shoot
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Location Column */}
                            <td className={`px-6 py-5 text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
                              <div className="max-w-[180px] truncate">
                                {formatLocation(item.event_location || item.location)}
                              </div>
                            </td>

                            {/* Email Column */}
                            <td className={`px-6 py-5 text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
                              <div className="max-w-[200px] truncate">
                                {item.guest_email || "N/A"}
                              </div>
                            </td>

                            <td className={`px-6 py-5 text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
                              Videographer
                            </td>

                            {/* Status Pill Column */}
                            <td className="px-6 py-5">
                              <span className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[12px] font-bold min-w-[100px] ${statusBg} ${statusText}`}>
                                {label}
                              </span>
                            </td>

                            {/* Action Column */}
                            <td className="px-6 py-5">
                              <div className="flex items-center justify-end gap-6">
                                {item.status === "Pending" ? (
                                  <div className="flex items-center gap-4">
                                    {/* Pill Shape Approve Button */}
                                    <button
                                      onClick={() => setAcceptShootEvent(item)}
                                      className="px-4 py-1 rounded-full bg-[#DCFCE7] text-[#166534] text-xs font-bold hover:bg-green-200 transition-colors"
                                    >
                                      Approve
                                    </button>
                                    {/* Red Underlined Decline Link */}
                                    <button
                                      onClick={() => setDeclineShootEvent(item)}
                                      className={`text-xs font-medium underline underline-offset-4 transition-colors ${isDark ? "text-[#F87171] hover:text-red-400" : "text-[#EF4444] hover:text-red-600"
                                        }`}
                                    >
                                      Decline
                                    </button>
                                  </div>
                                ) : item.status === "Confirmed" ? (
                                  <div className={`flex items-center gap-3 ${isDark ? "text-white/40" : "text-black/40"}`}>
                                    <button className={`transition-colors ${isDark ? "hover:text-white" : "hover:text-black"}`}>
                                      <Pencil size={18} />
                                    </button>
                                    <button className={`transition-colors ${isDark ? "hover:text-red-400" : "hover:text-red-600"}`}>
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className={isDark ? "text-white/20" : "text-black/20"}>
                                    <Info size={18} />
                                  </div>
                                )}

                                {/* Detail Chevron */}
                                <button
                                  onClick={() => handleOpenProjectDetails(item.project_id)}
                                  className={`transition-colors ${isDark ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"}`}
                                >
                                  <ChevronRight size={20} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE COLLAPSIBLE VIEW */}
                <div className={`lg:hidden flex flex-col divide-y ${isDark ? "divide-white/5" : "divide-[#E5E5E5]"}`}>
                  {filteredProjects.map((item) => (
                    <MobileRow
                      key={item.project_id}
                      item={item}
                      onApprove={() => setAcceptShootEvent(item)}
                      onDecline={() => setDeclineShootEvent(item)}
                      onViewDetails={() => handleOpenProjectDetails(item.project_id)}
                      isDark={isDark}
                    />
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className="col-span-full bg-[#111] border border-white/5 rounded-xl p-12 text-center text-white/40">
              No projects found matching your criteria.
            </div>
          )}
        </div>

        {/* Modals */}
        <Dialog open={!!acceptShootEvent} onOpenChange={() => setAcceptShootEvent(null)}>
          <DialogContent className="bg-[#111] border-white/10 text-white max-w-sm">
            <DialogHeader className="text-center">
              <DialogTitle className="text-xl font-bold">Accept Shoot?</DialogTitle>
            </DialogHeader>
            <div className="text-center p-4">
              <CheckCircle2 className="mx-auto h-12 w-12 text-[#E8D1AB] mb-4" />
              <p className="text-white/60 text-sm mb-6">Confirming will add this project to your active schedule.</p>
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setAcceptShootEvent(null)}>Cancel</Button>
                <Button className="flex-1 bg-[#E8D1AB] text-black hover:bg-[#d4be9a]" onClick={() => handleAcceptProject(acceptShootEvent.project_id, true)}>Confirm</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!declineShootEvent} onOpenChange={() => setDeclineShootEvent(null)}>
          <DialogContent className="bg-[#111] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="text-red-500" />
                Decline Request
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-white/60 mb-2 block">Reason for declining</Label>
                <Select value={declineReason} onValueChange={setDeclineReason}>
                  <SelectTrigger className="bg-[#1A1A1A] border-white/5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                    <SelectItem value="Schedule conflict">Schedule conflict</SelectItem>
                    <SelectItem value="Rate too low">Rate too low</SelectItem>
                    <SelectItem value="Location too far">Location too far</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/60 mb-2 block">Additional Comments (Optional)</Label>
                <Textarea
                  className="bg-[#1A1A1A] border-white/5 text-white"
                  placeholder="Let the team know why..."
                  value={declineComments}
                  onChange={(e) => setDeclineComments(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="ghost" className="flex-1" onClick={() => setDeclineShootEvent(null)}>Cancel</Button>
                <Button className="flex-1 bg-red-600 text-white hover:bg-red-700" onClick={() => handleAcceptProject(declineShootEvent.project_id, false)}>Decline Shoot</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
