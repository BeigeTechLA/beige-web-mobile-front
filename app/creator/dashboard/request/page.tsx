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
  Video,
  Ban,
  AlertTriangle,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { useRouter } from "next/navigation";

// UI Components
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
import ProjectDetailsModal from "@/Crew/ProfileDetailsModal";
import { getProject } from "@/lib/api";

import { toast } from "sonner"; // Using sonner to match affiliate style toast

export default function RequestsShootsPage() {
  const router = useRouter();

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
    console.log("localstorage user can get:", userStr)
    if (userStr) {
      try {
        const revure_user = JSON.parse(userStr);
        if (revure_user?.crew_member_id) setCrewMemberId(revure_user.crew_member_id);
        console.log("revure_user", crewMemberId)
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
    console.log("user:::::", user)
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
      // 1. Fetch Stats
      const statsPayload = { creator_id: crew_member_id };
      const statsResponse = await getStatusCount(statsPayload);
      
      // FIX: Check for !statsResponse.error instead of .success
      if (statsResponse && statsResponse.error === false) {
        setDashboardStats(statsResponse.data);
      }

      // 2. Fetch Projects
      const commonPayload = { crew_member_id };
      const [pendingRes, upcomingRes] = await Promise.all([
        getPendingProjects(commonPayload),
        GetUpcomingShoots(commonPayload),
      ]);

      let allProjects: any[] = [];

      // FIX: Check for !pendingRes.error
      if (pendingRes && pendingRes.error === false && Array.isArray(pendingRes.data)) {
        allProjects.push(
          ...pendingRes.data.map((p: any) => ({
            ...p,
            status: "Pending",
            project_id: p.project_id || p.id,
          }))
        );
      }

      // FIX: Check for !upcomingRes.error
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

  // 1. Try to parse JSON if it's an object/stringified JSON
  try {
    const parsed = typeof locationInput === 'string' ? JSON.parse(locationInput) : locationInput;
    if (parsed && parsed.address) {
      addressStr = parsed.address;
    }
  } catch (e) {
    // Not JSON, addressStr remains the original string (e.g., "Avenel, NJ")
  }

  // 2. Extract City, State, Country from a full address string
  // Example input: "Scott Avenue, Los Angeles, California 90026, United States"
  const parts = addressStr.split(',').map(p => p.trim());

  if (parts.length >= 3) {
    const country = parts[parts.length - 1];
    const stateZip = parts[parts.length - 2];
    const city = parts[parts.length - 3];

    // Remove numbers (Zip Code) from the state part
    const state = stateZip.replace(/\d+/g, '').trim();

    return `${city}, ${state}, ${country}`;
  }

  // Fallback for short strings like "Chicago, IL"
  return addressStr;
};
  /* ---------------- ACTIONS ---------------- */
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

    // CHANGE: Check for error === false to match your other API logic
    if (response && response.error === false) {
      // 1. Show Success Message
      toast.success(
        accept ? "Shoot request accepted" : "Shoot request declined"
      );

      // 2. IMMEDIATELY Close Modals
      setAcceptShootEvent(null);
      setDeclineShootEvent(null);
      
      // 3. Reset form states (especially for decline)
      setDeclineReason("Schedule conflict");
      setDeclineComments("");

      // 4. Refresh Data
      // We await this to ensure the UI stays in a loading state if needed 
      // or simply to ensure completion before concluding the function
      await fetchData();
    } else {
      // Handle case where API returns error: true
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

    // API uses `error: false`, not `success`
    if (!res?.error && res?.data) {
      setProjectDetailsData(res.data); 
      // res.data = { project, assignedCrew, assignedEquipment }

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

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Requests & Shoots</h1>
          <p className="text-white/60">Manage your production schedule and requests</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input 
                    placeholder="Search projects..." 
                    className="pl-10 bg-[#1A1A1A] border-white/5 w-[250px]"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-[#1A1A1A] border-white/5 w-[140px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      {/* Stats Grid - Matching Affiliate Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pending Requests"
          value={dashboardStats?.pendingRequests || 0}
          icon={<Clock />}
          color="text-yellow-400"
        />
        <StatCard
          label="Confirmed Shoots"
          value={dashboardStats?.confirmedRequests || 0}
          icon={<Camera />}
          color="text-[#E8D1AB]"
        />
        <StatCard
          label="Completed"
          value={dashboardStats?.completedShoots || 0}
          icon={<CheckCircle2 />}
          color="text-green-400"
        />
        <StatCard
          label="Declined"
          value={dashboardStats?.declinedRequests || 0}
          icon={<Ban />}
          color="text-red-400"
        />
      </div>

      {/* Projects List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((item) => (
            <div
              key={item.project_id}
              className="bg-[#111] border border-white/5 rounded-xl p-6 hover:border-[#E8D1AB]/40 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    item.status === "Confirmed"
                      ? "bg-green-400/10 text-green-400"
                      : "bg-blue-400/10 text-blue-400"
                  }`}
                >
                  {item.status}
                </span>
                <span className="text-white/20 text-xs italic">10 min ago</span>
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
                          <div className="flex items-center gap-3 text-white/60 text-sm">
                              <MapPin size={16} className="text-[#E8D1AB]" />
                              <span className="truncate">
                                  {formatLocation(item.event_location || item.location)}
                              </span>
                          </div>
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
          ))
        ) : (
          <div className="col-span-full bg-[#111] border border-white/5 rounded-xl p-12 text-center text-white/40">
            No projects found.
          </div>
        )}
      </div>

      {/* Modals */}
      <ProjectDetailsModal
        open={projectDetailsOpen}
        onOpenChange={setProjectDetailsOpen}
        project={projectDetailsData}
      />

      {/* Accept Modal */}
      <Dialog open={!!acceptShootEvent} onOpenChange={() => setAcceptShootEvent(null)}>
        <DialogContent className="bg-[#111] border-white/10 text-white max-w-sm">
          <div className="text-center p-4">
            <CheckCircle2 className="mx-auto h-12 w-12 text-[#E8D1AB] mb-4" />
            <h2 className="text-xl font-bold mb-2">Accept Shoot?</h2>
            <p className="text-white/60 text-sm mb-6">Confirming will add this project to your active schedule.</p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setAcceptShootEvent(null)}>Cancel</Button>
              <Button 
                className="flex-1 bg-[#E8D1AB] text-black hover:bg-[#d4be9a]"
                onClick={() => handleAcceptProject(acceptShootEvent.project_id, true)}
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Decline Modal */}
      <Dialog open={!!declineShootEvent} onOpenChange={() => setDeclineShootEvent(null)}>
        <DialogContent className="bg-[#111] border-white/10 text-white">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="text-red-500" /> Decline Request
          </h2>
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
                <Button 
                    className="flex-1 bg-red-600 text-white hover:bg-red-700"
                    onClick={() => handleAcceptProject(declineShootEvent.project_id, false)}
                >
                    Decline Shoot
                </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- SHARED COMPONENT ---------------- */
/* ---------------- SHARED COMPONENT ---------------- */
function StatCard({
  label,
  value,
  icon,
  color = "text-white",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="relative bg-[#111] border border-white/5 rounded-xl p-5 group hover:border-[#E8D1AB]/20 transition-all overflow-hidden">
      {/* Icon - Positioned Top Right */}
      <div className={`absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-all duration-300 transform group-hover:scale-110 ${color}`}>
        {React.isValidElement(icon) 
          ? React.cloneElement(icon as React.ReactElement<any>, { size: 28, strokeWidth: 2.5 }) 
          : icon}
      </div>

      {/* Content */}
      <div className="relative z-10">
        <p className="text-white/40 text-[10px] mb-1 uppercase tracking-[0.15em] font-bold">
          {label}
        </p>
        <div className={`text-3xl font-bold tracking-tight ${color}`}>
          {value}
        </div>
      </div>
    </div>
  );
}