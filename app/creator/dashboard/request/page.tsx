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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { getStatusCount, getPendingProjects, GetUpcomingShoots, acceptOrDeclineProject } from "@/lib/api";
// import ProjectDetailsModal from "@/Crew/ProfileDetailsModal";
import ProjectDetailsContainer from "@/Crew/ProjectDetailsContainer";
import { getProject } from "@/lib/api";

import { toast } from "sonner";
import { MobileRow } from "@/components/creator-profile/MobileRow";
import { StatCard } from "@/components/admin/StatCard";
import Topbar from "@/components/admin/Topbar";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

type ProjectItem = {
  id?: number | string;
  project_id?: number | string;
  project_name?: string;
  title?: string;
  event_date?: string;
  shoot_date?: string;
  start_time?: string;
  end_time?: string;
  event_location?: string;
  location?: string;
  guest_email?: string;
  budget?: number | string;
  is_completed?: boolean | number | string;
  status?: "Pending" | "Confirmed" | "Completed" | "Rejected" | "Declined";
  project?: {
    is_completed?: boolean | number | string;
    event_date?: string;
    shoot_date?: string;
  };
};

type DashboardStats = {
  pendingRequests: number;
  confirmedRequests: number;
  completedShoots: number;
  declinedRequests: number;
};

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
  const [acceptShootEvent, setAcceptShootEvent] = useState<ProjectItem | null>(null);
  const [declineShootEvent, setDeclineShootEvent] = useState<ProjectItem | null>(null);

  // Filter States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [declineReason, setDeclineReason] = useState("Schedule conflict");
  const [declineComments, setDeclineComments] = useState("");

  // Business Logic States
  const [crewMemberId, setCrewMemberId] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [shoots, setShoots] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [computedStats, setComputedStats] = useState<DashboardStats | null>(null);

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
      const statsData =
        statsResponse && statsResponse.error === false ? statsResponse.data : null;
      if (statsResponse && statsResponse.error === false) {
        setDashboardStats(statsResponse.data);
      }

      const commonPayload = { crew_member_id };
      const [pendingRes, upcomingRes] = await Promise.all([
        getPendingProjects(commonPayload),
        GetUpcomingShoots(commonPayload),
      ]);

      const pendingRequests: ProjectItem[] =
        pendingRes && pendingRes.error === false && Array.isArray(pendingRes.data)
          ? pendingRes.data.filter((p: ProjectItem) => isUpcomingShoot(p))
          : [];
      setProjects(
        pendingRequests.map((p) => ({
          ...p,
          status: "Pending",
          project_id: p.project_id || p.id,
        }))
      );

      const acceptedSource =
        upcomingRes && upcomingRes.error === false && Array.isArray(upcomingRes.data)
          ? upcomingRes.data as ProjectItem[]
          : [];
      const upcomingAccepted = acceptedSource;

      if (upcomingAccepted.length > 0) {
        const acceptedProjects: ProjectItem[] = upcomingAccepted.map((p): ProjectItem => ({
          ...p,
          status: isCompletedFlag(p) ? "Completed" : "Confirmed",
          project_id: p.project_id || p.id,
        }));
        setShoots(acceptedProjects);
        const completedCount = acceptedProjects.filter((p) => isCompletedFlag(p)).length;
        const confirmedCount = acceptedProjects.length;
        setComputedStats({
          pendingRequests: pendingRequests.length,
          confirmedRequests: confirmedCount,
          completedShoots: completedCount,
          declinedRequests: statsData?.declinedRequests || 0,
        });
      } else {
        setShoots([]);
        setComputedStats({
          pendingRequests: pendingRequests.length,
          confirmedRequests: 0,
          completedShoots: 0,
          declinedRequests: statsData?.declinedRequests || 0,
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
    } catch { }

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


  const isCompletedFlag = (item: ProjectItem) => {
    const flag = item?.is_completed ?? item?.project?.is_completed;
    if (flag === true || flag === 1 || flag === "1") return true;

    const dateStr = item?.event_date || item?.shoot_date || item?.project?.event_date || item?.project?.shoot_date;
    if (!dateStr) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOnlyMatch = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
    const shootDate = dateOnlyMatch
      ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
      : new Date(dateStr);

    if (Number.isNaN(shootDate.getTime())) return false;
    shootDate.setHours(0, 0, 0, 0);
    return shootDate.getTime() < today.getTime();
  };

  const isUpcomingShoot = (item: ProjectItem) => {
    const dateStr = item?.event_date || item?.shoot_date || item?.project?.event_date || item?.project?.shoot_date;
    if (!dateStr) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOnlyMatch = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
    const shootDate = dateOnlyMatch
      ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
      : new Date(dateStr);

    if (Number.isNaN(shootDate.getTime())) return true;
    shootDate.setHours(0, 0, 0, 0);
    return shootDate.getTime() >= today.getTime();
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
        const acceptedItem = acceptShootEvent;
        setAcceptShootEvent(null);
        setDeclineShootEvent(null);
        setDeclineReason("Schedule conflict");
        setDeclineComments("");
        if (accept && acceptedItem) {
          setProjects((current) => current.filter((item) => item.project_id !== projectId));
          setShoots((current) => {
            const nextShoot = {
              ...acceptedItem,
              status: isCompletedFlag(acceptedItem) ? "Completed" : "Confirmed",
              project_id: acceptedItem.project_id || acceptedItem.id,
            };
            const withoutDuplicate = current.filter((item) => item.project_id !== projectId);
            return [nextShoot, ...withoutDuplicate];
          });
          handleTabChange("shoots");
        }
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
    } catch {
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
      <div 
        className={`mx-4 mb-20 mt-6 overflow-hidden rounded-2xl border transition-all duration-700 lg:mx-8 ${isDark
          ? `bg-[#0A0A0A] text-white border-[#E8D1AB]/30
             shadow-[inset_0_0_12px_rgba(232,209,171,0.1),0_0_2px_rgba(232,209,171,0.8),0_0_15px_rgba(232,209,171,0.3),0_0_40px_rgba(232,209,171,0.15)]`
          : "bg-white text-[#171717] border-zinc-200 shadow-sm"
        }`}
      >
        <div className="p-8 lg:p-12 space-y-6 lg:space-y-10">
            {/* 1. Simple Header: Title & Description */}
          <div>
            <h1 className={`text-2xl font-bold transition-colors lg:text-3xl ${isDark ? "text-white" : "text-[#171717]"}`}>
              Requests & Shoots
            </h1>
            <p className={`mt-1 text-xs lg:text-sm transition-colors ${isDark ? "text-white/45" : "text-[#171717B2]"}`}>Manage your production schedule and requests</p>
          </div>

          {/* 2. Tabs */}
          <div
            className={`flex w-fit items-center gap-1 rounded-xl border p-1 transition-all duration-300 ${isDark
              ? "border-[#333] bg-[#111]"
              : "border-[#E5E5E5] bg-white"
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
              iconColor={isDark ? "text-yellow-400" : "text-yellow-600"}
              valueColor={isDark ? "text-yellow-400" : "text-yellow-600"}
              hoverBorder="hover:border-yellow-500/30"
              isDark={isDark}
            />
            <StatCard
              label="Confirmed Shoots"
              value={(computedStats?.confirmedRequests ?? dashboardStats?.confirmedRequests) || 0}
              icon={Camera}
              iconColor={isDark ? "text-[#E8D1AB]" : "text-[#9A7542]"}
              hoverBorder="hover:border-[#E8D1AB]/30"
              isDark={isDark}
            />
            <StatCard
              label="Completed"
              value={(computedStats?.completedShoots ?? dashboardStats?.completedShoots) || 0}
              icon={CheckCircle2}
              iconColor={isDark ? "text-green-400" : "text-green-600"}
              valueColor={isDark ? "text-green-400" : "text-green-600"}
              hoverBorder="hover:border-green-400/30"
              isDark={isDark}
            />
            <StatCard
              label="Declined"
              value={(computedStats?.declinedRequests ?? dashboardStats?.declinedRequests) || 0}
              icon={Ban}
              iconColor={isDark ? "text-red-400" : "text-red-600"}
              valueColor={isDark ? "text-red-400" : "text-red-600"}
              hoverBorder="hover:border-red-400/30"
              isDark={isDark}
            />
          </div>

          {/* 3. Filter Bar: Search, Select, and View Toggle */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className={`relative flex w-full items-center gap-1 rounded-xl border p-1 transition-all duration-300 lg:max-w-xl ${isDark ? "border-[#333] bg-[#111]" : "border-[#E5E5E5] bg-white"}`}>
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
                <SelectTrigger
                  className={`min-w-[170px] rounded-xl transition-colors ${isDark
                    ? "border-white/10 bg-[#1A1A1A] text-white data-[placeholder]:text-white/50"
                    : "border-[#E3E3E3] bg-white text-[#323232] data-[placeholder]:text-[#667085]"
                  }`}
                >
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent
                  className={`border transition-colors ${isDark
                    ? "border-white/10 bg-[#1A1A1A] text-white"
                    : "border-[#E3E3E3] bg-white text-[#323232] shadow-lg"
                  }`}
                >
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
                  <div className={`absolute right-0 top-full z-[50] mt-2 w-48 overflow-hidden rounded-xl border shadow-2xl transition-colors ${isDark
                    ? "border-[#FFFFFF33] bg-[#171717] text-white"
                    : "border-[#E5E5E5] bg-white text-[#171717]"
                  }`}>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 m-2">
                  {filteredProjects.map((item) => (
                  <div
                    key={item.project_id}
                    className={`group rounded-2xl border p-4 transition-all duration-300 lg:p-6 ${isDark
                      ? "bg-[#111] border-white/5 hover:border-[#E8D1AB]/40"
                      : "bg-white border-[#E5E5E5] hover:border-[#E8D1AB]/60 shadow-sm"
                      }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${item.status === "Completed"
                          ? isDark
                            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : item.status === "Confirmed"
                            ? isDark
                              ? "border-green-400/20 bg-green-400/10 text-green-300"
                              : "border-green-200 bg-green-50 text-green-700"
                            : isDark
                              ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className={`text-xs italic ${isDark ? "text-white/20" : "text-black/30"}`}>
                        {/* Recently updated */}
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
                          ? "border-white/10 bg-transparent text-white hover:bg-white/5"
                          : "border-black/15 bg-white text-black hover:bg-[#FFFCF6]"
                          }`}
                      >
                        View Details
                      </Button>

                      {item.status === "Pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            onClick={() => setAcceptShootEvent(item)}
                            className={`transition-colors ${isDark
                              ? "bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white"
                              : "bg-green-50 text-green-600 hover:bg-green-600 hover:text-white"
                            }`}
                          >
                            <Check size={18} />
                          </Button>
                          <Button
                            size="icon"
                            onClick={() => setDeclineShootEvent(item)}
                            className={`transition-colors ${isDark
                              ? "bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white"
                              : "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                            }`}
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
              <div className={`overflow-hidden rounded-xl border transition-all duration-300 ${isDark ? "border-white/5 bg-[#111]" : "border-[#E5E5E5] bg-white shadow-sm"}`}>
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
                        let statusClass = isDark
                          ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
                          : "border-amber-200 bg-[#FEF9C3] text-[#854D0E]";
                        let label = "Pending";

                        if (item.status === "Confirmed") {
                          statusClass = isDark
                            ? "border-green-400/20 bg-green-400/10 text-green-300"
                            : "border-green-200 bg-[#DCFCE7] text-[#166534]";
                          label = "Approved";
                        } else if (item.status === "Completed") {
                          statusClass = isDark
                            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                            : "border-emerald-200 bg-[#D1FAE5] text-[#065F46]";
                          label = "Completed";
                        } else if (item.status === "Rejected" || item.status === "Declined") {
                          statusClass = isDark
                            ? "border-red-400/20 bg-red-400/10 text-red-300"
                            : "border-red-200 bg-[#FEE2E2] text-[#991B1B]";
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
                              <span className={`inline-flex min-w-[100px] items-center justify-center rounded-full border px-4 py-1.5 text-[12px] font-bold transition-colors ${statusClass}`}>
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
                                      className={`rounded-full px-4 py-1 text-xs font-bold transition-colors ${isDark
                                        ? "border border-green-400/20 bg-green-400/10 text-green-300 hover:bg-green-400/20"
                                        : "bg-[#DCFCE7] text-[#166534] hover:bg-green-200"
                                      }`}
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
            <div
              className={`col-span-full rounded-xl border p-12 text-center text-sm transition-colors ${isDark
                ? "border-white/5 bg-[#111] text-white/40"
                : "border-[#E5E5E5] bg-[#FAFAFA] text-[#667085]"
              }`}
            >
              No projects found matching your criteria.
            </div>
          )}
        </div>

        {/* Modals */}
        <Dialog open={!!acceptShootEvent} onOpenChange={() => setAcceptShootEvent(null)}>
          <DialogContent className={`max-w-xs lg:max-w-sm transition-all duration-300 border ${isDark
            ? "bg-[#111] border-white/10 text-white"
            : "bg-[#FFFDF9] border-[#E5E5E5] text-black shadow-xl"
            }`}>
            <DialogHeader className="text-center">
              <DialogTitle className={`lg:text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>
                Accept Shoot?
              </DialogTitle>
            </DialogHeader>

            <div className="text-center p-4">
              {/* Dynamic Status Icon */}
              <CheckCircle2 className={`mx-auto h-12 w-12 mb-4 transition-colors text-[#E8D1AB]`} />

              {/* Description Text */}
              <p className={`text-xs lg:text-sm mb-6 transition-colors ${isDark ? "text-white/60" : "text-black/60"
                }`}>
                Confirming will add this project to your active schedule.
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  // variant="ghost" 
                  className={`flex-1 transition-colors ${isDark
                    ? "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                    : "bg-black/5 text-black/60 hover:text-black hover:bg-black/10"
                    }`}
                  onClick={() => setAcceptShootEvent(null)}
                >
                  Cancel
                </Button>

                <Button
                  className={`flex-1 font-semibold transition-all bg-[#E8D1AB] text-black hover:bg-[#d4be9a]`}
                  onClick={() => handleAcceptProject(acceptShootEvent.project_id, true)}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!declineShootEvent} onOpenChange={() => setDeclineShootEvent(null)}>
          <DialogContent className={`transition-all duration-300 border ${isDark
            ? "bg-[#111] border-white/10 text-white"
            : "bg-[#FFFDF9] border-[#E5E5E5] text-black shadow-xl"
            }`}>
            <DialogHeader>
              <DialogTitle className={`text-xl font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-black"}`}>
                <AlertTriangle className="text-red-500 shrink-0" />
                Decline Request
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* 1. DROP-DOWN SELECT ELEMENT */}
              <div>
                <Label className={`mb-2 block font-medium text-xs uppercase tracking-wider ${isDark ? "text-white/60" : "text-black/60"
                  }`}>
                  Reason for declining
                </Label>
                <Select value={declineReason} onValueChange={setDeclineReason}>
                  <SelectTrigger className={`transition-colors ${isDark
                    ? "border-white/5 bg-[#1A1A1A] text-white focus:ring-[#E8D1AB]/40"
                    : "border-[#E5E5E5] bg-white text-black focus:ring-[#E8D1AB]/50"
                    }`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={`border ${isDark
                    ? "bg-[#1A1A1A] border-white/10 text-white"
                    : "bg-[#FFFCF6] border-[#E5E5E5] text-black shadow-lg"
                    }`}>
                    <SelectItem
                      value="Schedule conflict"
                      className={isDark ? "focus:bg-white/10 focus:text-white" : "focus:bg-[#F4EBDD] focus:text-black"}
                    >
                      Schedule conflict
                    </SelectItem>
                    <SelectItem
                      value="Rate too low"
                      className={isDark ? "focus:bg-white/10 focus:text-white" : "focus:bg-[#F4EBDD] focus:text-black"}
                    >
                      Rate too low
                    </SelectItem>
                    <SelectItem
                      value="Location too far"
                      className={isDark ? "focus:bg-white/10 focus:text-white" : "focus:bg-[#F4EBDD] focus:text-black"}
                    >
                      Location too far
                    </SelectItem>
                    <SelectItem
                      value="Other"
                      className={isDark ? "focus:bg-white/10 focus:text-white" : "focus:bg-[#F4EBDD] focus:text-black"}
                    >
                      Other
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 2. COMMENTS TEXTAREA FIELD */}
              <div>
                <Label className={`mb-2 block font-medium text-xs uppercase tracking-wider ${isDark ? "text-white/60" : "text-black/60"
                  }`}>
                  Additional Comments (Optional)
                </Label>
                <Textarea
                  className={`transition-colors ${isDark
                    ? "border-white/5 bg-[#1A1A1A] text-white placeholder:text-white/30 focus-visible:ring-[#E8D1AB]/40"
                    : "border-[#E5E5E5] bg-white text-black placeholder:text-black/35 focus-visible:ring-[#E8D1AB]/50"
                    }`}
                  placeholder="Let the team know why..."
                  value={declineComments}
                  onChange={(e) => setDeclineComments(e.target.value)}
                />
              </div>

              {/* 3. MODAL ACTION ACTIONS */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="ghost"
                  className={`flex-1 transition-colors ${isDark
                    ? "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                    : "bg-black/5 text-black/60 hover:text-black hover:bg-black/10"
                    }`}
                  onClick={() => setDeclineShootEvent(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600 text-white hover:bg-red-700 font-semibold transition-colors shadow-sm"
                  onClick={() => handleAcceptProject(declineShootEvent.project_id, false)}
                >
                  Decline Shoot
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
