"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  MapPin,
  Search,
  CircleOff,
  CheckCircle,
  Camera,
  Ban,
  Grid3X3,
  List,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Video
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
import ProjectDetailsContainer from "@/Crew/ProjectDetailsContainer";
import { getProject } from "@/lib/api";

import { toast } from "sonner";
import { MobileRow } from "@/components/creator-profile/MobileRow";

export default function RequestsShootsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const view = (searchParams.get("view") as "grid" | "list") || "grid";
  const [isOpen, setIsOpen] = useState(false);
  const activeTab = (searchParams.get("tab") as "requests" | "shoots") || "requests";

  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [projectDetailsData, setProjectDetailsData] = useState(null);
  const [acceptShootEvent, setAcceptShootEvent] = useState<any>(null);
  const [declineShootEvent, setDeclineShootEvent] = useState<any>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [declineReason, setDeclineReason] = useState("Schedule conflict");
  const [declineComments, setDeclineComments] = useState("");

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

      let allProjects: any[] = [];
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
    const date = new Date(dateStr);
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E5D0A6]" />
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
    <div className="min-h-screen bg-[#0B0B0B]">
      {/* Main Container with Border */}
      {/* <div className="max-w-[1800px] mx-auto border border-[#2A2A2A] rounded-[32px] p-5 lg:p-7 space-y-5 bg-[#0B0B0B]"> */}
      <div className="relative rounded-[16px] border-[1px] border-[#847761] bg-[#141414] p-8 space-y-5 shadow-[0px_0px_24px_0px_#42392B]">
        {/* Header Section */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white">Requests & Shoots</h1>
          <p className="text-[#A1A1AA] text-sm">Manage your project requests and confirmed assignments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pending Shoots */}
          <div className="relative w-[224px] h-[98px] rounded-2xl border-[0.5px] border-[#3D3D3D] bg-[#101010] p-4 flex items-center justify-between overflow-hidden">
            <div className="absolute left-[-3px] top-[0.2px] w-[15px] h-[225px] bg-[#E8D0AA] blur-[18px] rotate-[43.87deg] -translate-x-1/2 -translate-y-1/2" />
            <div className="relative w-[140px] gap-2">
              <h3 className="font-['Instrument_Sans'] text-sm leading-5 text-white">
                Pending Requests
              </h3>
              <p className="font-['Instrument_Sans'] font-semibold text-3xl text-white leading-none mt-1">
                {computedStats?.pendingRequests ?? dashboardStats?.pendingRequests || 0}
              </p>
            </div>
            <div className="w-[40px] h-[40px] rounded-[8px] bg-[#F9F4EB] flex items-center justify-center">
              <CheckCircle className="w-[20px] h-[20px] text-[#A59479]" strokeWidth={2.5} />
            </div>
          </div>

          {/* Confirmed Shoots */}
          <div className="relative w-[224px] h-[98px] rounded-2xl border-[0.5px] border-[#3D3D3D] bg-[#101010] p-4 flex items-center justify-between overflow-hidden">
            <div className="absolute left-[-3px] top-[0.2px] w-[15px] h-[225px] bg-[#E8D0AA] blur-[18px] rotate-[43.87deg] -translate-x-1/2 -translate-y-1/2" />
            <div className="relative w-[140px] gap-2">
              <h3 className="font-['Instrument_Sans'] text-sm leading-5 text-white">
                Confirmed Shoots
              </h3>
              <p className="font-['Instrument_Sans'] font-semibold text-3xl text-white leading-none mt-1">
                {computedStats?.confirmedRequests ?? dashboardStats?.confirmedRequests || 0}
              </p>
            </div>
            <div className="w-[40px] h-[40px] rounded-[8px] bg-[#F9F4EB] flex items-center justify-center">
              <Camera className="w-[20px] h-[20px] text-[#A59479]" strokeWidth={2.5} />
            </div>
          </div>


          {/* Completed Shoots */}
          <div className="relative w-[224px] h-[98px] rounded-2xl border-[0.5px] border-[#3D3D3D] bg-[#101010] p-4 flex items-center justify-between overflow-hidden">
            <div className="absolute left-[-3px] top-[0.2px] w-[15px] h-[225px] bg-[#E8D0AA] blur-[18px] rotate-[43.87deg] -translate-x-1/2 -translate-y-1/2" />
            <div className="relative w-[140px] gap-2">
              <h3 className="font-['Instrument_Sans'] text-sm leading-5 text-white">
                Completed Shoots
              </h3>
              <p className="font-['Instrument_Sans'] font-semibold text-3xl text-white leading-none mt-1">
                {computedStats?.completedShoots ?? dashboardStats?.completedShoots || 0}
              </p>
            </div>
            <div className="w-[40px] h-[40px] rounded-[8px] bg-[#F9F4EB] flex items-center justify-center">
              <Video className="w-[20px] h-[20px] text-[#A59479]" strokeWidth={2.5} />
            </div>
          </div>


          {/* Declined */}
          <div className="relative w-[224px] h-[98px] rounded-2xl border-[0.5px] border-[#3D3D3D] bg-[#101010] p-4 flex items-center justify-between overflow-hidden">
            <div className="absolute left-[-3px] top-[0.2px] w-[15px] h-[225px] bg-[#E8D0AA] blur-[18px] rotate-[43.87deg] -translate-x-1/2 -translate-y-1/2" />
            <div className="relative w-[140px] gap-8">
              <h3 className="font-['Instrument_Sans'] text-sm leading-5 text-white">
                Declined
              </h3>
              <p className="font-['Instrument_Sans'] font-semibold text-3xl text-white leading-none mt-1">
                {computedStats?.declinedRequests ?? dashboardStats?.declinedRequests || 0}
              </p>
            </div>
            <div className="w-[40px] h-[40px] rounded-[8px] bg-[#F9F4EB] flex items-center justify-center">
              <CircleOff className="w-[20px] h-[20px] text-[#A59479]" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Search */}
          <div className="relative w-full lg:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717A]" />
            <Input
              placeholder="Search events or crew..."
              className="pl-12 h-12 bg-[#111111] border border-[#222222] rounded-full text-white placeholder:text-[#71717A] focus:border-[#E5D0A6] w-full lg:w-[300px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-12 bg-[#111111] border border-[#222222] rounded-full text-white w-full lg:w-[160px]">
                <SelectValue placeholder="Shoot Request" />
              </SelectTrigger>
              <SelectContent className="bg-[#111111] border border-[#222222] text-white">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                {activeTab === "requests" ? (
                  <SelectItem value="pending">Pending</SelectItem>
                ) : (
                  <SelectItem value="completed">Completed</SelectItem>
                )}
              </SelectContent>
            </Select>

            <Select value="today" onValueChange={() => { }}>
              <SelectTrigger className="h-12 bg-[#111111] border border-[#222222] rounded-full text-white w-full lg:w-[120px]">
                <SelectValue placeholder="Today" />
              </SelectTrigger>
              <SelectContent className="bg-[#111111] border border-[#222222] text-white">
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex bg-[#111111] border border-[#222222] rounded-full p-1">
              <button
                onClick={() => handleViewChange("grid")}
                className={`p-3 rounded-full transition-all ${view === "grid" ? "bg-[#E5D0A6] text-[#111111]" : "text-[#71717A] hover:text-white"
                  }`}
              >
                <Grid3X3 size={20} />
              </button>
              <button
                onClick={() => handleViewChange("list")}
                className={`p-3 rounded-full transition-all ${view === "list" ? "bg-[#E5D0A6] text-[#111111]" : "text-[#71717A] hover:text-white"
                  }`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content - Grid View */}
        {
          filteredProjects.length > 0 && view === "grid" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredProjects.map((item) => (
                <div
                  key={item.project_id}
                  className="bg-[#111111] border border-[#222222] rounded-[24px] p-6"
                >
                  {/* Status and Updated */}
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-[#00D084]/15 border border-[#00D084]/20 rounded-full text-[#00D084] text-xs font-semibold">
                      {item.status}
                    </span>
                    <span className="text-[#71717A] text-xs">Recently updated</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-white mb-3 capitalize">
                    {item.project_name || item.title || "Untitled Project"}
                  </h3>

                  {/* Date and Location */}
                  <div className="flex items-center gap-4 text-[#A1A1AA] text-sm mb-6">
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={16} className="text-[#E5D0A6]" />
                      <span>{formatDate(item.event_date || item.shoot_date || "TBD")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-[#E5D0A6]" />
                      <span className="truncate">
                        {formatLocation(item.event_location || item.location)}
                      </span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[#222222] my-4" />

                  {/* Tentative Earning */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[#A1A1AA] text-sm">Tentative Earning</span>
                    <span className="text-2xl font-bold text-[#E5D0A6]">
                      ${item.total_amount || item.price || "1,200"}
                    </span>
                  </div>

                  {/* Payment Boxes */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-[#00D084]/10 border border-[#00D084]/20 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[#00D084] text-sm">Advance Paid</span>
                        <span className="text-[#00D084] text-xl font-bold">
                          ${item.advance_paid || "300"}
                        </span>
                      </div>
                    </div>
                    <div className="bg-[#FF5A5F]/10 border border-[#FF5A5F]/20 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[#FF5A5F] text-sm">Remaining Balance</span>
                        <span className="text-[#FF5A5F] text-xl font-bold">
                          ${item.remaining_balance || "1,250"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => handleOpenProjectDetails(item.project_id)}
                      className="h-12 bg-[#1B1B1B] hover:bg-[#2A2A2A] text-white rounded-xl font-medium"
                    >
                      View Details
                    </Button>
                    <Button
                      className="h-12 bg-[#1B1B1B] hover:bg-[#2A2A2A] text-white rounded-xl font-medium flex items-center gap-2"
                    >
                      <Eye size={18} />
                      View Earnings
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )
        }

        {/* List View */}
        {
          filteredProjects.length > 0 && view === "list" && (
            <div className="bg-[#111111] border border-[#222222] rounded-[24px] overflow-hidden">
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#222222]">
                      <th className="text-left py-4 px-6 text-[#E5D0A6] font-semibold text-sm">Shoot ID</th>
                      <th className="text-left py-4 px-6 text-[#E5D0A6] font-semibold text-sm">Project Name</th>
                      <th className="text-left py-4 px-6 text-[#E5D0A6] font-semibold text-sm">Location</th>
                      <th className="text-left py-4 px-6 text-[#E5D0A6] font-semibold text-sm">Email</th>
                      <th className="text-left py-4 px-6 text-[#E5D0A6] font-semibold text-sm">Category</th>
                      <th className="text-left py-4 px-6 text-[#E5D0A6] font-semibold text-sm">Status</th>
                      <th className="text-left py-4 px-6 text-[#E5D0A6] font-semibold text-sm">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222222]">
                    {filteredProjects.map((item) => {
                      let statusBg = "bg-[#F59E0B]/15";
                      let statusText = "text-[#F59E0B]";
                      let label = "Pending";

                      if (item.status === "Confirmed") {
                        statusBg = "bg-[#00D084]/15";
                        statusText = "text-[#00D084]";
                        label = "Confirmed";
                      } else if (item.status === "Completed") {
                        statusBg = "bg-[#00D084]/15";
                        statusText = "text-[#00D084]";
                        label = "Completed";
                      }

                      return (
                        <tr key={item.project_id} className="hover:bg-[#1A1A1A] transition-colors">
                          <td className="py-4 px-6 text-white font-medium">
                            #{item.project_id?.toString().slice(-6) || "123456"}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-[#E5D0A6] rounded-xl flex items-center justify-center">
                                <span className="text-[#111111] font-bold text-lg">
                                  {(item.project_name || "PR").split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="text-white font-semibold">
                                  {item.project_name || "Untitled"}
                                </div>
                                <div className="text-[#71717A] text-xs">
                                  {formatDate(item.event_date || item.shoot_date)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-[#A1A1AA] text-sm">
                            {formatLocation(item.event_location || item.location)}
                          </td>
                          <td className="py-4 px-6 text-[#A1A1AA] text-sm">
                            {item.guest_email || "N/A"}
                          </td>
                          <td className="py-4 px-6 text-[#A1A1AA] text-sm">
                            Videographer
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusBg} ${statusText}`}>
                              {label}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <Button
                                onClick={() => handleOpenProjectDetails(item.project_id)}
                                className="h-10 bg-[#1B1B1B] hover:bg-[#2A2A2A] text-white rounded-xl text-sm"
                              >
                                View Details
                              </Button>
                              <Button className="h-10 bg-[#1B1B1B] hover:bg-[#2A2A2A] text-white rounded-xl text-sm flex items-center gap-2">
                                <Eye size={16} />
                                View Earnings
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="lg:hidden flex flex-col divide-y divide-[#222222]">
                {filteredProjects.map((item) => (
                  <MobileRow
                    key={item.project_id}
                    item={item}
                    onApprove={() => setAcceptShootEvent(item)}
                    onDecline={() => setDeclineShootEvent(item)}
                    onViewDetails={() => handleOpenProjectDetails(item.project_id)}
                  />
                ))}
              </div>
            </div>
          )
        }

        {/* Empty State */}
        {
          filteredProjects.length === 0 && (
            <div className="bg-[#111111] border border-[#222222] rounded-[24px] p-12 text-center text-[#71717A]">
              No projects found matching your criteria.
            </div>
          )
        }
      </div >

      {/* Accept Modal */}
      < Dialog open={!!acceptShootEvent
      } onOpenChange={() => setAcceptShootEvent(null)}>
        <DialogContent className="bg-[#111111] border border-[#222222] text-white max-w-sm">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold">Accept Shoot?</DialogTitle>
          </DialogHeader>
          <div className="text-center p-4">
            <CheckCircle2 className="mx-auto h-12 w-12 text-[#E5D0A6] mb-4" />
            <p className="text-[#A1A1AA] text-sm mb-6">
              Confirming will add this project to your active schedule.
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1 h-12 bg-[#1B1B1B] hover:bg-[#2A2A2A] text-white"
                onClick={() => setAcceptShootEvent(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-12 bg-[#E5D0A6] text-[#111111] hover:bg-[#D4C4A8] font-semibold"
                onClick={() => handleAcceptProject(acceptShootEvent?.project_id, true)}
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog >

      {/* Decline Modal */}
      < Dialog open={!!declineShootEvent} onOpenChange={() => setDeclineShootEvent(null)}>
        <DialogContent className="bg-[#111111] border border-[#222222] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="text-[#FF5A5F]" />
              Decline Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[#A1A1AA] mb-2 block">Reason for declining</Label>
              <Select value={declineReason} onValueChange={setDeclineReason}>
                <SelectTrigger className="bg-[#1B1B1B] border border-[#222222]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111111] border border-[#222222] text-white">
                  <SelectItem value="Schedule conflict">Schedule conflict</SelectItem>
                  <SelectItem value="Rate too low">Rate too low</SelectItem>
                  <SelectItem value="Location too far">Location too far</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#A1A1AA] mb-2 block">Additional Comments (Optional)</Label>
              <Textarea
                className="bg-[#1B1B1B] border border-[#222222] text-white placeholder:text-[#71717A]"
                placeholder="Let the team know why..."
                value={declineComments}
                onChange={(e) => setDeclineComments(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="ghost"
                className="flex-1 h-12 bg-[#1B1B1B] hover:bg-[#2A2A2A] text-white"
                onClick={() => setDeclineShootEvent(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-12 bg-[#FF5A5F] text-white hover:bg-[#E04E52]"
                onClick={() => handleAcceptProject(declineShootEvent?.project_id, false)}
              >
                Decline Shoot
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog >
    </div >
  );
}