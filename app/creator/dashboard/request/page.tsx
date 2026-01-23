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
  LayoutGrid,
  List,
  MoreVertical,
  ChevronRight,
  Pencil,
  Trash2,
  Info
} from "lucide-react";
import { useRouter } from "next/navigation";

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
import { getStatusCount, getPendingProjects, GetUpcomingShoots, acceptOrDeclineProject } from "@/lib/api";
// import ProjectDetailsModal from "@/Crew/ProfileDetailsModal";
import ProjectDetailsContainer from "@/Crew/ProjectDetailsContainer";
import { getProject } from "@/lib/api";

import { toast } from "sonner";

export default function RequestsShootsPage() {
  const router = useRouter();

  /* ---------------- VIEW TOGGLE STATE ---------------- */
  const [view, setView] = useState<"grid" | "list">("grid");

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
  const [isLoading, setIsLoading] = useState(false);

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
      const statsPayload = { creator_id: crew_member_id };
      const statsResponse = await getStatusCount(statsPayload);
      if (statsResponse && statsResponse.error === false) {
        setDashboardStats(statsResponse.data);
      }

      const commonPayload = { crew_member_id };
      const [pendingRes, upcomingRes] = await Promise.all([
        getPendingProjects(commonPayload),
        GetUpcomingShoots(commonPayload),
      ]);

      let allProjects: any[] = [];
      if (pendingRes && pendingRes.error === false && Array.isArray(pendingRes.data)) {
        allProjects.push(
          ...pendingRes.data.map((p: any) => ({
            ...p,
            status: "Pending",
            project_id: p.project_id || p.id,
          }))
        );
      }
      if (upcomingRes && upcomingRes.error === false && Array.isArray(upcomingRes.data)) {
        allProjects.push(
          ...upcomingRes.data.map((p: any) => ({
            ...p,
            status: "Confirmed",
            project_id: p.project_id || p.id,
          }))
        );
      }
      setProjects(allProjects);
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

  /* ---------------- FILTERING ---------------- */
  const filteredProjects = projects.filter((p) => {
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
      onBack={() => {
        setProjectDetailsOpen(false);
        setProjectDetailsData(null);
      }}
    />
  );
}

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 text-white">
      {/* Header */}
      <div className="space-y-8">
        {/* 1. Simple Header: Title & Description */}
        <div>
          <h1 className="text-3xl font-bold">Requests & Shoots</h1>
          <p className="text-white/60">Manage your production schedule and requests</p>
        </div>

        {/* 2. Stats Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Pending Requests"
            value={dashboardStats?.pendingRequests || 0}
            icon={<Clock />}
            iconColor="text-yellow-500"
            valueColor="text-yellow-500"
            hoverBorder="hover:border-yellow-500/30"
          />
          <StatCard
            label="Confirmed Shoots"
            value={dashboardStats?.confirmedRequests || 0}
            icon={<Camera />}
            iconColor="text-[#E8D1AB]"
            hoverBorder="hover:border-[#E8D1AB]/30"
          />
          <StatCard
            label="Completed"
            value={dashboardStats?.completedShoots || 0}
            icon={<CheckCircle2 />}
            iconColor="text-green-400"
            valueColor="text-green-400"
            hoverBorder="hover:border-green-400/30"
          />
          <StatCard
            label="Declined"
            value={dashboardStats?.declinedRequests || 0}
            icon={<Ban />}
            iconColor="text-red-400"
            valueColor="text-red-400"
            hoverBorder="hover:border-red-400/30"
          />
        </div>

        {/* 3. Filter Bar: Search, Select, and View Toggle */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Search Box - Now Left Aligned */}
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search projects..."
              className="pl-10 bg-[#1A1A1A] border-white/5 w-full md:w-[250px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter Group - Grouped to stay on the Right */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-[#1A1A1A] border-white/5 w-full md:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex bg-[#1A1A1A] p-1 rounded-xl border border-white/5 w-fit">
              <button
                onClick={() => setView("grid")}
                className={`p-2 rounded-lg transition-all ${view === "grid" ? "bg-[#E8D1AB] text-black" : "text-white/40 hover:text-white"
                  }`}
              >
                <LayoutGrid size={20} />
              </button>
              <button
                onClick={() => setView("list")}
                className={`p-2 rounded-lg transition-all ${view === "list" ? "bg-[#E8D1AB] text-black" : "text-white/40 hover:text-white"
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
                  className="bg-[#111] border border-white/5 rounded-xl p-6 hover:border-[#E8D1AB]/40 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${item.status === "Confirmed"
                        ? "bg-green-400/10 text-green-400"
                        : "bg-blue-400/10 text-blue-400"
                        }`}
                    >
                      {item.status}
                    </span>
                    <span className="text-white/20 text-xs italic">Recently updated</span>
                  </div>

                  <h3 className="text-xl font-bold mb-4 group-hover:text-[#E8D1AB] transition-colors">
                    {item.project_name || item.title || "Untitled Project"}
                  </h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-white/60 text-sm">
                      <CalendarIcon size={16} className="text-[#E8D1AB]" />
                      <span>{item.event_date || item.shoot_date || "TBD"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/60 text-sm">
                      <MapPin size={16} className="text-[#E8D1AB]" />
                      <span className="truncate">
                        {formatLocation(item.event_location || item.location)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <Button
                      onClick={() => handleOpenProjectDetails(item.project_id)}
                      className="bg-transparent border border-white/10 hover:border-[#E8D1AB] hover:text-[#E8D1AB] text-white px-6"
                    >
                      View Details
                    </Button>

                    {item.status === "Pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          onClick={() => setAcceptShootEvent(item)}
                          className="bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white"
                        >
                          <Check size={18} />
                        </Button>
                        <Button
                          size="icon"
                          onClick={() => setDeclineShootEvent(item)}
                          className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
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
            <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.03] text-white/40 text-[11px] uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold">Shoot ID</th>
                      <th className="px-6 py-4 font-semibold">Name</th>
                      <th className="px-6 py-4 font-semibold">Location</th>
                      <th className="px-6 py-4 font-semibold">Email</th>
                          <th className="px-6 py-4 font-semibold">Category</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right pr-12">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredProjects.map((item) => {
                      // Status Logic Mapping
                      let statusBg = "bg-[#FEF9C3]"; // Light Yellow
                      let statusText = "text-[#854D0E]"; // Dark Yellow/Brown
                      let label = "Pending";

                      if (item.status === "Confirmed") {
                        statusBg = "bg-[#DCFCE7]"; // Light Green
                        statusText = "text-[#166534]"; // Dark Green
                        label = "Approved";
                      } else if (item.status === "Rejected" || item.status === "Declined") {
                        statusBg = "bg-[#FEE2E2]"; // Light Red
                        statusText = "text-[#991B1B]"; // Dark Red
                        label = "Rejected";
                      }

                      return (
                        <tr
                          key={item.project_id}
                          className="hover:bg-white/[0.01] transition-colors group"
                        >
                          {/* Shoot ID Column */}
                          <td className="px-6 py-5 text-sm text-white/60">
                            #{item.project_id?.toString().slice(-6) || "123456"}
                          </td>

                          {/* Name/Project Details Column */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-[#E8D1AB]/20 border border-[#E8D1AB]/10 overflow-hidden flex items-center justify-center text-[#E8D1AB] font-bold text-xs">
                                {(item.project_name || "PR").split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white leading-tight">
                                  {item.project_name || "Untitled"}
                                </div>
                                <div className="text-[11px] text-white/40 mt-0.5">
                                  Production Shoot
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Location Column */}
                          <td className="px-6 py-5 text-sm text-white/60">
                            <div className="max-w-[180px] truncate">
                              {formatLocation(item.event_location || item.location)}
                            </div>
                          </td>

                          {/* Email Column */}
                          <td className="px-6 py-5 text-sm text-white/60">
                            <div className="max-w-[200px] truncate">
                              {item.guest_email || "N/A"}
                            </div>
                          </td>

                           <td className="px-6 py-5 text-sm text-white/60">
                          Videographer
                        </td>

                          {/* Status Pill Column (Matched to Screenshot) */}
                          <td className="px-6 py-5">
                            <span className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[12px] font-bold min-w-[100px] ${statusBg} ${statusText}`}>
                              {label}
                            </span>
                          </td>

                          {/* Action Column (Matched to Screenshot) */}
                          <td className="px-6 py-5">
                            <div className="flex items-center justify-end gap-6">
                              {item.status === "Pending" ? (
                                <div className="flex items-center gap-4">
                                  {/* Pill Shape Approve Button */}
                                  <button
                                    onClick={() => setAcceptShootEvent(item)}
                                    className="px-4 py-1 rounded-full bg-[#DCFCE7] text-[#166534] text-[12px] font-bold hover:bg-green-200 transition-colors"
                                  >
                                    Approve
                                  </button>
                                  {/* Red Underlined Decline Link */}
                                  <button
                                    onClick={() => setDeclineShootEvent(item)}
                                    className="text-[#F87171] text-[12px] font-medium underline underline-offset-4 hover:text-red-400"
                                  >
                                    Decline
                                  </button>
                                </div>
                              ) : item.status === "Confirmed" ? (
                                <div className="flex items-center gap-3 text-white/40">
                                  <button className="hover:text-white transition-colors">
                                    <Pencil size={18} />
                                  </button>
                                  <button className="hover:text-red-400 transition-colors">
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              ) : (
                                <div className="text-white/20">
                                  <Info size={18} />
                                </div>
                              )}

                              {/* Detail Chevron */}
                              <button
                                onClick={() => handleOpenProjectDetails(item.project_id)}
                                className="text-white/40 hover:text-white transition-colors"
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
  );
}

/* ---------------- SHARED STAT CARD ---------------- */
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactElement;
  iconColor: string;
  hoverBorder: string;
  valueColor?: string;
}

function StatCard({ label, value, icon, iconColor, hoverBorder, valueColor = "text-white" }: StatCardProps) {
  return (
    <div className={`bg-[#111] rounded-xl p-6 border border-white/5 relative overflow-hidden group ${hoverBorder} transition-all duration-300 min-h-[10px] flex flex-col justify-center`}>
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-300">
        {React.cloneElement(icon, { size: 44, className: iconColor })}
      </div>
      <div className="relative z-10">
        <p className="text-white/40 text-sm font-medium mb-3 uppercase tracking-wider">{label}</p>
        <p className={`text-4xl font-bold ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
}