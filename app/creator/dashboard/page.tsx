"use client";

import React, { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { toast } from "react-hot-toast";
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
import { Dialog, DialogContent } from "@/components/ui/dialog";

// ----------------------------
// LEGEND + MOCK DATA (UI ONLY)
// ----------------------------
const legendItems = [
  { label: "Active Events", count: 0, color: "bg-teal-500" },
  { label: "Upcoming Events", count: 0, color: "bg-blue-600" },
  { label: "Pending Request", count: 0, color: "bg-yellow-400" },
  { label: "Assigned Crew", count: 0, color: "bg-orange-400" },
  { label: "Equipment Request", count: 0, color: "bg-sky-400" },
];

const mockStats = {
  completedShoots: 0,
  upcomingShoots: 0,
  pendingRequests: 0,
  equipmentRequests: 0,
};

const mockUpcomingShoots = [
  {
    project_id: 101,
    project: {
      stream_project_booking_id: 101,
      project_name: "Wedding Highlight Shoot",
      event_date: "2026-01-25",
      start_time: "10:00 AM",
      end_time: "06:00 PM",
      event_location: "Austin, TX, USA",
    },
  },
];

const mockPendingRequests = [
  {
    project_id: 201,
    project_name: "Birthday Party Coverage",
    event_date: "2026-01-26",
    start_time: "05:00 PM",
    end_time: "09:00 PM",
    display_location: "San Antonio, TX",
  },
];

const mockRecentActivity = [
  {
    type: "FileText",
    title: "Project brief updated",
    description: "Wedding Highlight Shoot — client added extra deliverables.",
  },
  {
    type: "Users",
    title: "New crew assigned",
    description: "2 members assigned for Corporate Interview Setup.",
  },
  {
    type: "Activity",
    title: "Shoot marked completed",
    description: "Studio Portrait Session — files uploaded successfully.",
  },
  {
    type: "XCircle",
    title: "Request declined",
    description: "Gym Promo Reel — schedule conflict.",
  },
];

// Availability mock: key is YYYY-MM-DD
const buildMockAvailability = (year: number, monthIdx: number) => {
  const mm = String(monthIdx + 1).padStart(2, "0");
  const set = (d: number, obj: any, acc: any) => {
    const dd = String(d).padStart(2, "0");
    acc[`${year}-${mm}-${dd}`] = obj;
  };
  const out: Record<string, any> = {};
  set(3, { available: false }, out);
  set(7, { available: false }, out);
  set(10, { projectAssigned: true, available: true }, out);
  set(14, { projectAssigned: true, available: true }, out);
  set(18, { available: false }, out);
  return out;
};

const formatDisplayLocation = (location?: string) => {
  if (!location || location === "Location TBD") return "Location TBD";
  if (location.includes(",")) {
    const parts = location.split(",").map((p) => p.trim());
    if (parts.length >= 2) return `${parts[0]}, ${parts[1].replace(/[0-9]/g, "").trim()}`;
    return parts[0];
  }
  return location;
};

const getIcon = (iconType: string) => {
  switch (iconType) {
    case "FileText":
      return <FileText className="text-white/70" />;
    case "Users":
      return <Users className="text-white/70" />;
    case "Activity":
      return <Activity className="text-white/70" />;
    case "XCircle":
      return <XCircle className="text-white/70" />;
    default:
      return <Activity className="text-white/70" />;
  }
};

// ----------------------
// DONUT CHART (UI ONLY)
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

const shootStatusSlices: DonutSlice[] = [
  { label: "Completed Shoots", value: 0, colorHex: "#C9B79F", bulletClass: "bg-[#C9B79F]", subLabel: "0 Shoots (0%)" },
  { label: "Pending Shoots", value: 0, colorHex: "#E7DCCF", bulletClass: "bg-[#E7DCCF]", subLabel: "0 Shoots (0%)" },
  { label: "Rejected Shoots", value: 0, colorHex: "#F1E9E1", bulletClass: "bg-[#F1E9E1]", subLabel: "0 Shoots (0%)" },
  { label: "Shoot Requests", value: 0, colorHex: "#D8C8B4", bulletClass: "bg-[#D8C8B4]", subLabel: "0 Shoots (0%)" },
];

const shootCategorySlices: DonutSlice[] = [
  { label: "Completed Shoots", value: 0, colorHex: "#C9B79F", bulletClass: "bg-[#C9B79F]", subLabel: "0 Shoots (0%)" },
  { label: "Photography Shoots", value: 0, colorHex: "#E7DCCF", bulletClass: "bg-[#E7DCCF]", subLabel: "0 Shoots (0%)" },
  { label: "Rejected Shoots", value: 0, colorHex: "#F1E9E1", bulletClass: "bg-[#F1E9E1]", subLabel: "0 Shoots (0%)" },
  { label: "Shoot Requests", value: 0, colorHex: "#D8C8B4", bulletClass: "bg-[#D8C8B4]", subLabel: "0 Shoots (0%)" },
];

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

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-md">
      <div className="p-4 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-white">{title}</h3>
          {subtitle ? (
            <p className="text-[11px] text-white/50 mt-1 max-w-[340px]">
              {subtitle}
            </p>
          ) : null}
        </div>

        {rightFilter ? <div className="shrink-0">{rightFilter}</div> : null}
      </div>

      <div className="px-4 pb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="flex items-center justify-center">
            <div className="relative w-[160px] h-[160px] rounded-full" style={{ background: gradient }}>
              <div className="absolute inset-[18px] rounded-full bg-[#0B0F14]" />
              <div className="absolute inset-[58px] rounded-full bg-white/10" />
            </div>
          </div>

          <div className="space-y-3">
            {slices.map((s) => (
              <div key={s.label} className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <span className={`mt-1 w-2.5 h-2.5 rounded-full ${s.bulletClass}`} />
                  <div>
                    <p className="text-[12px] font-semibold text-white/80">{s.label}</p>
                    {s.subLabel ? <p className="text-[11px] text-white/45">{s.subLabel}</p> : null}
                  </div>
                </div>
                <span className="text-[12px] text-white/60 font-medium">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------
// PAGE
// ----------------------
export default function CreatorDashboardPage() {
  const { user } = useAuth();

  const [date, setDate] = useState(new Date());
  const [acceptShootEvent, setAcceptShootEvent] = useState<any>(null);
  const [declineEquipmentItem, setDeclineEquipmentItem] = useState<any>(null);

  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [projectDetailsData, setProjectDetailsData] = useState<any>(null);

  const [upcomingProjects, setUpcomingProjects] = useState<any[]>(mockUpcomingShoots);
  const [pendingProjects, setPendingProjects] = useState<any[]>(mockPendingRequests);
  const [availabilityData, setAvailabilityData] = useState<Record<string, any>>(() =>
    buildMockAvailability(new Date().getFullYear(), new Date().getMonth())
  );

  useEffect(() => {
    setAvailabilityData(buildMockAvailability(date.getFullYear(), date.getMonth()));
  }, [date]);

  const statsData = [
    { title: "Completed Shoots", value: String(mockStats.completedShoots), icon: Camera },
    { title: "Upcoming Shoots", value: String(mockStats.upcomingShoots), icon: CalendarIcon },
    { title: "Pending Requests", value: String(mockStats.pendingRequests), icon: Clock },
    { title: "Equipment Requests", value: String(mockStats.equipmentRequests), icon: Box },
  ];

  const handlePreviousMonth = () => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() - 1);
    setDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + 1);
    setDate(newDate);
  };

  const handleAcceptProject = (projectId: number, status: number) => {
    if (status === 1) {
      const req = pendingProjects.find((x) => x.project_id === projectId);
      if (req) {
        setPendingProjects((prev) => prev.filter((x) => x.project_id !== projectId));
        setUpcomingProjects((prev) => [
          ...prev,
          {
            project_id: req.project_id,
            project: {
              stream_project_booking_id: req.project_id,
              project_name: req.project_name,
              event_date: req.event_date,
              start_time: req.start_time,
              end_time: req.end_time,
              event_location: req.display_location,
            },
          },
        ]);
      }
      toast.success("Shoot request accepted (UI only)");
    } else {
      setPendingProjects((prev) => prev.filter((x) => x.project_id !== projectId));
      toast.error("Shoot request declined (UI only)");
    }
    setAcceptShootEvent(null);
  };

  const ProjectDetailsModalUI = ({
    open,
    onOpenChange,
    project,
  }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    project: any;
  }) => {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border border-white/10 bg-[#0B0F14] text-white">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-bold">Project Details</h3>
            <p className="text-sm text-white/60">UI only preview</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <p className="text-xs text-white/60 font-semibold">Project</p>
              <p className="font-bold text-white">
                {project?.project?.project_name || project?.project_name || "N/A"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/60 font-semibold">Date</p>
                <p className="text-white/80">{project?.project?.event_date || project?.event_date || "TBD"}</p>
              </div>
              <div>
                <p className="text-xs text-white/60 font-semibold">Time</p>
                <p className="text-white/80">
                  {(project?.project?.start_time && project?.project?.end_time)
                    ? `${project.project.start_time} - ${project.project.end_time}`
                    : (project?.start_time && project?.end_time)
                      ? `${project.start_time} - ${project.end_time}`
                      : "TBD"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-white/60 font-semibold">Location</p>
              <p className="text-white/80">
                {formatDisplayLocation(project?.project?.event_location || project?.display_location || project?.event_location)}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button
                className="bg-white text-black hover:bg-white/90"
                onClick={() => {
                  toast.success("Primary action (UI only)");
                  onOpenChange(false);
                }}
              >
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="p-4 md:p-8 min-h-screen font-sans bg-[#111] text-white">
      {/* Header */}
      <div className="mb-4 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold">
          Welcome back, {user?.name || "Partner"}
        </h1>
        <p className="text-sm md:text-base text-white/70 mt-1">
          Here's what's happening with your shoots and requests today.
        </p>
      </div>

      {/* Stats Cards (dark like screenshot) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 lg:mb-8">
        {statsData.map((stat, index) => (
          <div
            key={index}
            className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 md:p-6 shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div className="pr-10">
                <p className="text-white/70 text-sm font-medium leading-none h-7 flex items-center">
                  {stat.title}
                </p>
                <h3 className="text-4xl font-bold text-white mt-2">{stat.value}</h3>
              </div>

              <div className="hidden md:flex p-3 rounded-xl bg-white/10">
                <stat.icon className="h-6 w-6 text-white/80" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8 mb-4 lg:mb-8">
        {/* Map Section */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden relative min-h-[500px]">
          <div className="absolute top-4 left-4 z-10 flex h-10 w-48 items-center rounded-md border border-white/10 bg-[#111] px-3">
            <Search className="h-4 w-4 shrink-0 text-white/50" />
            <input
              type="text"
              placeholder="Search events..."
              className="ml-2 w-full bg-transparent text-sm outline-none text-white placeholder:text-white/40"
            />
          </div>

          <div className="absolute top-4 right-4 z-10">
            <Select defaultValue="active">
              <SelectTrigger className="h-10 w-[160px] rounded-md border border-white/10 bg-[#111] text-white shadow-sm">
                <SelectValue placeholder="Active events" />
              </SelectTrigger>
              <SelectContent className="bg-[#0B0F14] border border-white/10 text-white">
                <SelectItem value="active">Active events</SelectItem>
                <SelectItem value="all">All events</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fake map canvas */}
          <div className="w-full h-full bg-[#E6E6E6] relative">
            <div className="absolute inset-0 flex items-center justify-center text-black/40 text-sm">
              Map Token Missing or Invalid
            </div>
          </div>

          {/* Status Legend */}
          <div className="absolute bottom-4 left-4 bg-[#111] p-4 rounded-xl shadow-lg border border-white/10 z-10 w-64">
            <h4 className="font-bold text-white mb-3 text-base">Status Legend</h4>
            <div className="space-y-2">
              {legendItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-sm ${item.color}`} />
                    <span className="text-white/70">{item.label}</span>
                  </div>
                  <span className="font-medium text-white">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Availability Calendar */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="h-5 w-5 text-white/80" />
            <h3 className="text-lg font-bold text-white">Availability</h3>
          </div>

          <div className="flex-1 flex flex-col items-center">
            <div className="w-full">
              <div className="flex items-center justify-between mb-4">
                <button
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 border border-white/10 text-white hover:bg-white/15"
                  onClick={handlePreviousMonth}
                >
                  <span className="text-lg leading-none">‹</span>
                </button>

                <h4 className="text-base font-semibold text-white">
                  {date.toLocaleString("default", { month: "long", year: "numeric" })}
                </h4>

                <button
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 border border-white/10 text-white hover:bg-white/15"
                  onClick={handleNextMonth}
                >
                  <span className="text-lg leading-none">›</span>
                </button>
              </div>

              <div className="mb-4">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-medium text-white/60 py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {(() => {
                    const year = date.getFullYear();
                    const month = date.getMonth();
                    const firstDay = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const days: React.ReactNode[] = [];
                    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} />);

                    for (let day = 1; day <= daysInMonth; day++) {
                      const currentDate = new Date(year, month, day);
                      currentDate.setHours(0, 0, 0, 0);

                      const isPast = currentDate < today;
                      const isToday = currentDate.getTime() === today.getTime();

                      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const dayData = availabilityData?.[dateStr];

                      let borderClass = "border border-white/10";
                      let bgClass = "bg-white/10";
                      let textClass = "text-white";
                      let hoverClass = "hover:bg-white/15";

                      let cursorClass = "cursor-pointer";
                      let disabled = false;

                      if (isPast) {
                        bgClass = "bg-transparent";
                        textClass = "text-white/25";
                        borderClass = "border border-transparent";
                        hoverClass = "";
                        cursorClass = "cursor-default";
                        disabled = true;
                      }

                      if (dayData && dayData.available === false && !isPast) {
                        bgClass = "bg-white/10";
                        textClass = "text-white/70";
                        borderClass = "border border-rose-500/40";
                        hoverClass = "";
                        cursorClass = "cursor-not-allowed";
                        disabled = true;
                      }

                      if (dayData?.projectAssigned && !isPast) {
                        bgClass = "bg-emerald-500/10";
                        borderClass = "border border-emerald-500/30";
                        textClass = "text-emerald-200";
                      }

                      if (isToday) {
                        bgClass = "bg-white";
                        borderClass = "border border-white";
                        textClass = "text-black";
                      }

                      days.push(
                        <button
                          key={day}
                          disabled={disabled}
                          onClick={() => toast.success(`Clicked ${dateStr} (UI only)`)}
                          className={`
                            w-[34px] h-[34px]
                            rounded-xl flex items-center justify-center
                            text-sm font-semibold transition-all
                            ${bgClass} ${textClass} ${borderClass} ${hoverClass} ${cursorClass}
                          `}
                        >
                          {day}
                        </button>
                      );
                    }

                    return days;
                  })()}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-white/60 mt-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/50 border border-rose-500/40" />
                  <span>Unavailable</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-orange-500/50 border border-orange-500/40" />
                  <span>Shoot</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-500/50 border border-blue-500/40" />
                  <span>Equipment</span>
                </div>
              </div>
            </div>
          </div>

          <Button
            className="w-full mt-6 bg-white/10 text-white border border-white/10 hover:bg-white/15"
            onClick={() => toast.success("Navigate to Availability (UI only)")}
          >
            Go to Availability
          </Button>
        </div>
      </div>

      {/* TWO DONUT CHARTS (Dark) */}
      <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DonutChartCard
            title="Shoot Status"
            subtitle="This section showcases the performance of our best-selling products and their growth."
            rightFilter={
              <Select defaultValue="month">
                <SelectTrigger className="h-8 w-[95px] bg-white/10 border border-white/10 text-white shadow-sm">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="bg-[#0B0F14] border border-white/10 text-white">
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            }
            slices={shootStatusSlices}
          />

          <DonutChartCard
            title="Shoot Categories"
            subtitle="This section showcases the performance of our best-selling products and their growth."
            rightFilter={
              <div className="flex gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="h-8 w-[70px] bg-white/10 border border-white/10 text-white shadow-sm">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0B0F14] border border-white/10 text-white">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="photography">Photography</SelectItem>
                    <SelectItem value="videography">Videography</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  className="h-8 px-3 text-[12px] border-white/10 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => toast.success("UI only filter")}
                >
                  Photography
                </Button>

                <Button
                  variant="outline"
                  className="h-8 px-3 text-[12px] border-white/10 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => toast.success("UI only filter")}
                >
                  Videography
                </Button>
              </div>
            }
            slices={shootCategorySlices}
          />
        </div>
      </div>

      {/* Accept Shoot Modal */}
      <Dialog open={!!acceptShootEvent} onOpenChange={() => setAcceptShootEvent(null)}>
        <DialogContent className="fixed z-50 left-[50%] top-[50%] w-full max-w-xs md:max-w-md -translate-x-1/2 -translate-y-1/2 p-6 bg-[#0B0F14] text-white shadow-xl rounded-xl border border-white/10">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-emerald-300" />
            </div>

            <h2 className="text-xl font-bold mb-2">Accept this shoot request?</h2>
            <p className="text-white/70 text-sm mb-6">
              Project:{" "}
              <span className="font-semibold text-white">
                {acceptShootEvent?.project_name}
              </span>
              <br />
              UI only: This will move the request into “All Shoots”.
            </p>

            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={() => setAcceptShootEvent(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
                onClick={() => {
                  if (acceptShootEvent) handleAcceptProject(acceptShootEvent.project_id, 1);
                }}
              >
                <Check className="h-4 w-4" /> Confirm & Accept
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Decline Equipment Modal */}
      <Dialog open={!!declineEquipmentItem} onOpenChange={() => setDeclineEquipmentItem(null)}>
        <DialogContent className="fixed z-50 left-[50%] bottom-0 top-auto w-full max-w-lg -translate-x-1/2 translate-y-0 p-6 bg-[#0B0F14] text-white shadow-xl rounded-t-2xl sm:rounded-xl sm:bottom-auto sm:top-[50%] sm:-translate-y-1/2 border border-white/10">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Decline Equipment Request?</h2>
              </div>
            </div>
          </div>

          <p className="text-white/70 text-sm mb-6">UI only modal preview.</p>

          <div className="mb-6">
            <h3 className="font-bold mb-3 block">Reason for declining</h3>
            <div className="space-y-3">
              {["Schedule conflict", "Equipment unavailable", "Location too far", "Rate too low", "Other"].map((reason) => (
                <div key={reason} className="flex items-center space-x-2">
                  <input type="radio" name="decline-reason" id={reason} className="h-4 w-4" />
                  <Label htmlFor={reason} className="text-white/70 font-normal cursor-pointer">
                    {reason}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold mb-3 block">Additional comments (optional)</h3>
            <Textarea
              placeholder="Any additional details.."
              className="min-h-[80px] bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>

          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => setDeclineEquipmentItem(null)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-500 hover:bg-red-600 text-white gap-2"
              onClick={() => {
                toast.error("Declined (UI only)");
                setDeclineEquipmentItem(null);
              }}
            >
              <Check className="h-4 w-4" /> Decline Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Details Modal */}
      <ProjectDetailsModalUI
        open={projectDetailsOpen}
        onOpenChange={setProjectDetailsOpen}
        project={projectDetailsData}
      />
    </div>
  );
}
