"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Info,
  Loader2,
  Search,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/Datepicker";
import { TimePicker } from "@/components/ui/Timepicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/hooks/useAuth";
import { meetingsApi } from "@/lib/meetingsApi";
import { getMinimumMeetingEndTime, getMinimumSelectableMeetingTime } from "@/lib/meetingStatus";
import { externalChatApi, type ExternalChatUser } from "@/lib/externalChatApi";
import { getBrowserTimeZone } from "@/lib/timezone";
import { cn } from "@/lib/utils";
import SearchAutocomplete from "@/components/chat/SearchAutocomplete";
type MeetingType = "pre_production" | "post_production";
type RoleVariant = "admin" | "sales" | "client" | "cp" | "pm";

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string | number | null;
  role?: RoleVariant;
  onCreated?: () => void;
  isDark?: boolean;
}

interface ParticipantOption {
  id: string;
  name: string;
  email?: string;
  role: "cp" | "manager";
}

interface ProjectOption {
  id: string;
  label: string;
  description?: string;
}

type MemberTab = "cp" | "staff";

interface ProjectSource {
  stream_project_booking_id?: string | number;
  booking_id?: string | number;
  project_id?: string | number;
  id?: string | number;
  user_id?: string | number;
  client_user_id?: string | number;
  client_id?: string | number;
  event_type?: string | string[];
  project_name?: string;
  title?: string;
  client_name?: string;
  client_email?: string;
  guest_name?: string;
  guest_email?: string;
  description?: string;
  client?: {
    client_name?: string;
    name?: string;
    full_name?: string;
    email?: string;
    client_email?: string;
    guest_email?: string;
  };
  assignedCrew?: CrewSource[];
  assigned_crews?: CrewSource[];
  lead_details?: {
    assigned_sales_rep?: {
      id?: string | number;
      name?: string;
      email?: string;
      role?: string;
    } | null;
  } | null;
}

interface CrewSource {
  id?: string | number;
  user_id?: string | number;
  crew_member_id?: string | number;
  email?: string;
  first_name?: string;
  last_name?: string;
  crew_member?: {
    user_id?: string | number;
    crew_member_id?: string | number;
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null;
}

const combineDateAndTime = (date: Date | null, time: Date | null) => {
  if (!date || !time) return undefined;
  const combined = new Date(date);
  combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
  if (Number.isNaN(combined.getTime())) return undefined;
  return combined.toISOString();
};

const getCurrentUserId = (user: unknown) => {
  if (!user || typeof user !== "object") return undefined;
  const candidate = (user as { id?: string | number }).id;
  return candidate != null ? candidate : undefined;
};

const getCurrentUserName = (user: unknown) => {
  if (!user || typeof user !== "object") return "Host";
  return String((user as { name?: string }).name || "Host");
};

const getProjectId = (project: ProjectSource | null | undefined) =>
  String(project?.stream_project_booking_id || project?.booking_id || project?.project_id || project?.id || "");

const getProjectOwnerUserId = (project: ProjectSource | null | undefined) =>
  String(project?.user_id || project?.client_user_id || project?.client_id || "");

const getProjectName = (project: ProjectSource | null | undefined) => {
  const bookingId = getProjectId(project);
  const eventType = Array.isArray(project?.event_type)
    ? project.event_type[0]
    : String(project?.event_type || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)[0];

  const candidates = [
    project?.project_name,
    project?.title,
    project?.client_name,
    project?.guest_name,
    project?.description,
    eventType ? `${String(eventType).replace(/[_-]+/g, " ")} Shoot` : "",
    bookingId ? `Shoot #${bookingId}` : "",
  ];

  return (
    candidates
      .map((value) => String(value || "").trim())
      .find((value) => value && value.toLowerCase() !== "shoot #") || `Shoot #${bookingId || "New"}`
  );
};

const getProjectOptionLabel = (project: ProjectSource | null | undefined) => {
  const bookingId = getProjectId(project);
  const name = getProjectName(project);
  return bookingId ? `${name} (Booking #${bookingId})` : name;
};

const formatRoleLabel = (value?: string) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getCrewId = (member: CrewSource | null | undefined) =>
  String(member?.user_id || member?.crew_member?.user_id || member?.crew_member_id || member?.crew_member?.crew_member_id || member?.id || "");

const getCrewName = (member: CrewSource | null | undefined) =>
  `${member?.crew_member?.first_name || member?.first_name || ""} ${member?.crew_member?.last_name || member?.last_name || ""}`.trim() ||
  member?.crew_member?.email ||
  member?.email ||
  "Creative Partner";

const resolveClientName = (project: ProjectSource | null | undefined) => {
  const candidates = [
    project?.client_name,
    project?.guest_name,
    project?.client?.client_name,
    project?.client?.full_name,
    project?.client?.name,
  ];
  return String(candidates.find((value) => value && String(value).trim()) || "").trim();
};

const resolveClientEmail = (project: ProjectSource | null | undefined) => {
  const candidates = [
    project?.client_email,
    project?.guest_email,
    project?.client?.email,
    project?.client?.client_email,
    project?.client?.guest_email,
  ];
  return String(candidates.find((value) => value && String(value).trim()) || "").trim();
};

const resolveUser = (value: unknown) => {
  if (!value) return null;
  if (typeof value === "string" || typeof value === "number") {
    return { id: String(value), name: `User ${value}` };
  }

  if (typeof value !== "object") return null;

  const user = value as { id?: string | number; _id?: string | number; name?: string; email?: string; role?: string };

  const id = String(user.id || user._id || "");
  if (!id) return null;

  return {
    id,
    name: user.name || user.email || `User ${id}`,
    email: user.email || undefined,
    role: user.role || undefined,
  };
};

export default function CreateMeetingModal({
  isOpen,
  onClose,
  orderId,
  role = "admin",
  onCreated,
  isDark = true,
}: CreateMeetingModalProps) {
  const { user } = useAuth();
  const currentUserId = getCurrentUserId(user);
  const currentUserName = getCurrentUserName(user);

  const getNextValidTime = () => {
    return getMinimumSelectableMeetingTime(1);
  };

  const getMinimumStartTime = () => getMinimumSelectableMeetingTime(1);

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState(orderId ? String(orderId) : "");
  const [selectedOrder, setSelectedOrder] = useState<ProjectSource | null>(null);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingType, setMeetingType] = useState<MeetingType>("post_production");
  const initialTime = getNextValidTime();

  const [meetingDate, setMeetingDate] = useState<Date | null>(initialTime);
  const [meetingStartTime, setMeetingStartTime] = useState<Date | null>(initialTime);
  const [meetingEndTime, setMeetingEndTime] = useState<Date | null>(
    new Date(initialTime.getTime() + 60 * 60 * 1000)
  );
  const [description, setDescription] = useState("");
  const [meetLink, setMeetLink] = useState("");
  const [sendNotification, setSendNotification] = useState(true);
  const [projectParticipants, setProjectParticipants] = useState<ParticipantOption[]>([]);
  const [selectedManagerIds, setSelectedManagerIds] = useState<string[]>([]);
  const [selectedCpIds, setSelectedCpIds] = useState<string[]>([]);
  const [directory, setDirectory] = useState<{
    staff?: ExternalChatUser[];
    creativePartners?: ExternalChatUser[];
  }>({});
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [selectedExtraCpIds, setSelectedExtraCpIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberTab, setMemberTab] = useState<MemberTab>("staff");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false);
  const projectsRequestIdRef = useRef(0);

  const fixedOrder = !!orderId;

  const filteredDirectoryMembers = useMemo(() => {
    const normalizedSearch = memberSearch.trim().toLowerCase();
    const excluded = new Set([
      ...selectedManagerIds,
      ...selectedCpIds,
      ...selectedStaffIds,
      ...selectedExtraCpIds,
      String(currentUserId || ""),
    ]);

    const pool = memberTab === "cp" ? directory.creativePartners || [] : directory.staff || [];

    return pool.filter((member) => {
      const id = String(member.id || "");
      if (!id || excluded.has(id)) return false;
      if (!normalizedSearch) return true;
      return [member.name, member.email, member.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });
  }, [
    currentUserId,
    directory.creativePartners,
    directory.staff,
    memberSearch,
    memberTab,
    selectedCpIds,
    selectedExtraCpIds,
    selectedManagerIds,
    selectedStaffIds,
  ]);

  const selectedAdditionalMembers = useMemo(() => {
    const pool = [...(directory.staff || []), ...(directory.creativePartners || [])];
    const uniqueMembers = new Map<string, ExternalChatUser>();

    pool.forEach((member) => {
      const id = String(member.id || "");
      if (id) {
        uniqueMembers.set(id, member);
      }
    });

    return {
      staff: selectedStaffIds
        .map((id) => uniqueMembers.get(id))
        .filter((member): member is ExternalChatUser => Boolean(member)),
      cp: selectedExtraCpIds
        .map((id) => uniqueMembers.get(id))
        .filter((member): member is ExternalChatUser => Boolean(member)),
    };
  }, [directory.creativePartners, directory.staff, selectedExtraCpIds, selectedStaffIds]);

  useEffect(() => {
    if (!isOpen) return;

    setMeetingTitle("");
    setMeetingType("post_production");
    const next = getNextValidTime();
    setMeetingDate(next);
    setMeetingStartTime(next);
    setMeetingEndTime(new Date(next.getTime() + 60 * 60 * 1000));
    setDescription("");
    setMeetLink("");
    setSendNotification(true);
    setSelectedOrderId(orderId ? String(orderId) : "");
    setSelectedOrder(null);
    setProjectParticipants([]);
    setSelectedManagerIds([]);
    setSelectedCpIds([]);
    setSelectedStaffIds([]);
    setSelectedExtraCpIds([]);
    setMemberSearch("");
    setMemberTab("staff");
    setIsSubmitting(false);
    setIsGeneratingLink(false);
  }, [isOpen, orderId]);

  useEffect(() => {
    if (!isOpen) {
      projectsRequestIdRef.current += 1;
      setIsLoadingProjects(false);
      return;
    }

    const requestId = projectsRequestIdRef.current + 1;
    projectsRequestIdRef.current = requestId;

    const loadProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const projectsResponse = await adminApi.getProjects({ summary_only: true });

        if (projectsRequestIdRef.current !== requestId) return;
        const rawProjectResults =
          projectsResponse?.data?.projects ||
          projectsResponse?.data?.results ||
          projectsResponse?.data ||
          projectsResponse?.results ||
          [];

        const normalizedProjectSources = (Array.isArray(rawProjectResults) ? rawProjectResults : [])
          .map((item) => ((item as { project?: ProjectSource } | ProjectSource)?.project || item) as ProjectSource)
          .filter((item) => {
            if (role !== "client") return true;
            const ownerUserId = getProjectOwnerUserId(item);
            return ownerUserId && String(currentUserId || "") === ownerUserId;
          });

        const normalizedProjects = Array.from(
          new Map(normalizedProjectSources
            .filter((item) => getProjectId(item))
            .map((item) => [getProjectId(item), {
            id: getProjectId(item),
            label: getProjectOptionLabel(item),
            description:
              resolveClientName(item) ||
              resolveClientEmail(item) ||
              (getProjectId(item) ? `Booking #${getProjectId(item)}` : "Project"),
            }] as const)
          ).values()
        );

        setProjects(normalizedProjects);
      } catch (error) {
        if (projectsRequestIdRef.current === requestId) {
          setProjects([]);
          toast.error(error instanceof Error ? error.message : "Failed to load meeting data");
        }
      } finally {
        if (projectsRequestIdRef.current === requestId) {
          setIsLoadingProjects(false);
        }
      }
    };

    loadProjects();
    return () => {
      if (projectsRequestIdRef.current === requestId) {
        projectsRequestIdRef.current += 1;
      }
    };
  }, [currentUserId, isOpen, role]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    externalChatApi.getDirectory()
      .then((directory) => {
        if (cancelled) return;
        setDirectory({
          staff: directory.staff || [],
          creativePartners: directory.creativePartners || [],
        });
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to load meeting participant directory", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !selectedOrderId) return;

    let cancelled = false;

    const loadOrderDetails = async () => {
      setIsLoadingOrderDetails(true);
      try {
        const response = await adminApi.getProjectDetails(selectedOrderId);
        if (cancelled) return;

        const data = response?.data?.project || response?.data || response;
        const assignedCrew = response?.data?.assignedCrew || data?.assignedCrew || data?.assigned_crews || [];
        const leadDetails = response?.data?.lead_details || data?.lead_details || null;
        const normalizedProject: ProjectSource = {
          ...data,
          assignedCrew,
          lead_details: leadDetails,
        };

        setSelectedOrder(normalizedProject);

        const participants: ParticipantOption[] = [];
        const salesRep = normalizedProject?.lead_details?.assigned_sales_rep || null;
        const normalizedSalesRep = resolveUser(salesRep);
        if (normalizedSalesRep) {
          participants.push({
            id: normalizedSalesRep.id,
            name: normalizedSalesRep.name,
            email: normalizedSalesRep.email,
            role: "manager",
          });
        }

        const cps = (assignedCrew || [])
          .map((cp) => ({
            id: getCrewId(cp),
            name: getCrewName(cp),
            email: cp?.crew_member?.email || cp?.email || undefined,
            role: "cp" as const,
          }))
          .filter((cp) => cp.id);

        participants.push(...cps);
        setProjectParticipants(participants);
        setSelectedManagerIds(normalizedSalesRep ? [normalizedSalesRep.id] : []);
        setSelectedCpIds(cps.map((cp) => cp.id));
        setSelectedStaffIds([]);
        setSelectedExtraCpIds([]);

        if (!meetingTitle.trim()) {
          setMeetingTitle(`${getProjectName(normalizedProject)} Catch-up`);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Failed to load project details");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingOrderDetails(false);
        }
      }
    };

    loadOrderDetails();
    return () => {
      cancelled = true;
    };
  }, [isOpen, meetingTitle, selectedOrderId]);

  useEffect(() => {
    if (meetingStartTime) {
      const newEnd = new Date(meetingStartTime.getTime() + 60 * 60 * 1000);
      setMeetingEndTime(newEnd);
    }
  }, [meetingStartTime]);

  if (!isOpen) return null;

  const activeOrderId = selectedOrderId || (orderId ? String(orderId) : "");
  const clientName = resolveClientName(selectedOrder);
  const clientEmail = resolveClientEmail(selectedOrder);

  const generateMeetLink = async () => {
    if (!activeOrderId) {
      toast.error("Please select a project for this meeting.");
      return "";
    }

    const startIso = combineDateAndTime(meetingDate, meetingStartTime);
    const endIso = combineDateAndTime(meetingDate, meetingEndTime);

    if (!startIso || !endIso) {
      toast.error("Please provide a valid meeting start and end time.");
      return "";
    }

    setIsGeneratingLink(true);
    try {
      const response = await meetingsApi.createEvent({
        userId: currentUserId,
        summary: meetingTitle.trim() || `Meeting for ${getProjectName(selectedOrder)}`,
        location: "Online",
        description: description.trim(),
        startDateTime: startIso,
        endDateTime: endIso,
        timeZone: getBrowserTimeZone(),
        orderId: activeOrderId,
      });

      if (response?.meetLink) {
        setMeetLink(response.meetLink);
        toast.success("Google Meet link generated.");
        return response.meetLink;
      }

      if (response?.authUrl) {
        const authWindow = window.open("", "_blank");
        if (authWindow) {
          const authUrl = String(response.authUrl).replace(/"/g, "&quot;");
          authWindow.document.write(`
            <html>
              <head>
                <title>Redirecting to Google</title>
                <style>body{margin:0;background:#090909;color:#fff;font-family:Inter,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;} .card{max-width:520px;padding:32px;border-radius:24px;background:rgba(17,17,17,.95);box-shadow:0 20px 80px rgba(0,0,0,.35); text-align:center;} .button{display:inline-flex;align-items:center;justify-content:center;margin-top:24px;padding:12px 22px;border-radius:999px;background:#E5D5B8;color:#000;text-decoration:none;font-weight:700;}</style>
              </head>
              <body>
                <div class="card">
                  <h1 style="margin:0;font-size:1.8rem;">Redirecting to Google authorization</h1>
                  <p style="margin:16px 0 0;color:#ccc;line-height:1.6;">Please wait while we open the Google authorization page. If it does not load automatically, click the button below.</p>
                  <a class="button" id="redirectLink" href="${authUrl}" target="_self">Continue to Google</a>
                </div>
                <script>setTimeout(function(){window.location.href = "${authUrl}";}, 2000);</script>
              </body>
            </html>
          `);
          authWindow.document.close();
          toast.info("Authorization will open in the new tab in 2 seconds...");
        } else {
          window.open(response.authUrl, "_blank", "noopener,noreferrer");
          toast.info(
            "Google authorization opened in a new tab. Complete the sign-in flow there, then retry creating the meeting."
          );
        }
      } else {
        toast.error("Unable to generate a meet link right now.");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to generate meeting link";
      toast.error(message);
    } finally {
      setIsGeneratingLink(false);
    }

    return "";
  };

  const handleSubmit = async () => {
    if (!activeOrderId) {
      toast.error("Please select a project first.");
      return;
    }

    const startIso = combineDateAndTime(meetingDate, meetingStartTime);
    const endIso = combineDateAndTime(meetingDate, meetingEndTime);

    if (startIso && new Date(startIso) < new Date()) {
      toast.error("Start time cannot be in the past.");
      return;
    }

    if (!startIso || !endIso) {
      toast.error("Please provide a valid meeting start and end time.");
      return;
    }

    if (new Date(endIso).getTime() < new Date(startIso).getTime() + 60 * 60 * 1000) {
      toast.error("Meeting end time must be at least 1 hour after the start time.");
      return;
    }

    if (selectedManagerIds.length === 0 && selectedCpIds.length === 0 && selectedStaffIds.length === 0 && selectedExtraCpIds.length === 0) {
      toast.error("Select at least one member for this meeting.");
      return;
    }

    const cpParticipantIds = Array.from(new Set([...selectedCpIds, ...selectedExtraCpIds].filter(Boolean)));
    const managerParticipantIds = Array.from(new Set([...selectedManagerIds, ...selectedStaffIds].filter(Boolean)));

    setIsSubmitting(true);
    try {
      let resolvedLink = meetLink.trim();

      if (!resolvedLink) {
        resolvedLink = await generateMeetLink();
      }

      if (!resolvedLink) {
        toast.error("Google Meet link could not be generated, so the meeting was not created.");
        return;
      }

      await meetingsApi.createMeeting({
        order_id: activeOrderId,
        meeting_date_time: startIso,
        meeting_end_time: endIso,
        meeting_status: "pending",
        meeting_type: meetingType,
        meeting_title: meetingTitle.trim() || `${getProjectName(selectedOrder)} Meeting`,
        description: description.trim() || undefined,
        meetLink: resolvedLink || undefined,
        cp_ids: cpParticipantIds,
        admin_id: currentUserId,
        created_by_id: currentUserId,
        participants: managerParticipantIds,
        send_notification: sendNotification,
      });

      toast.success("Meeting created successfully");
      onCreated?.();
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create meeting";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const managerOption = projectParticipants.find((participant) => participant.role === "manager") || null;
  const cpOptions = projectParticipants.filter((participant) => participant.role === "cp");

  const isToday = meetingDate
    ? new Date(meetingDate).toDateString() === new Date().toDateString()
    : false;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto px-4 py-8">
      <div className={`absolute inset-0 backdrop-blur-sm ${isDark ? "bg-black/80" : "bg-black/10"}`} />

      <div className={`relative mx-auto flex max-h-[calc(100vh-4rem)] w-full max-w-[860px] flex-col rounded-2xl lg:rounded-4xl border shadow-2xl ${isDark ? "shadow-black/40 border-[#262626] bg-[#090909]" : "shadow-[#64646f33] bg-[#FFFFFF] border-[#FFFFFF66]"}`}>
        <div className={`flex items-start justify-between border-b p-4 lg:px-6 lg:py-5 ${isDark ? "border-white/10" : "border-[#CACACA]"}`}>
          <div>
            <div className={`mb-2 inline-flex items-center gap-2 rounded-full border px-2 lg:px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] ${isDark ? "border-[#E5D5B8]/20 bg-[#17130d] text-[#E5D5B8]" : "border-[#CACACA] bg-[#F0F0F0] text-[#000]"}`}>
              <Video size={12} />
              Google Meet Only
            </div>
            <h2 className={`text-xl lg:text-3xl font-semibold tracking-[-0.02em] ${isDark ? "text-white" : "text-black"}`}>Create Meeting</h2>
            <p className={`mt-1 max-w-[560px] text-xs lg:text-sm lg:leading-6 ${isDark ? "text-white/45" : " text-black/75"}`}>
              Schedule a project meeting, choose the right members, and generate a Google Meet link they can join after accepting.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${isDark ? "border-white/10 bg-[#1A1A1A] text-white hover:bg-[#222222]" : "border-[#F0F0F0] bg-[#F0F0F0] text-black hover:bg-black/20"}`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 lg:p-6 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
            <div className={`rounded-xl lg:rounded-3xl border  p-3 lg:p-5 ${isDark ? "border-white/10 bg-[#101010]" : "border-black/20 bg-white"}`}>
              <div className="mb-3 lg:mb-5">
                <p className={`text-xs font-medium uppercase tracking-[0.24em] ${isDark ? "text-white/35" : " text-black/60"}`}>Meeting Basics</p>
                <h3 className={`mt-1 lg:mt-2 lg:text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>Schedule & context</h3>
              </div>

              <div className="grid gap-3 lg:gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className={`text-xs lg:text-smfont-medium ${isDark ? "text-white/70" : "text-black/70"}`}>Project / Shoot</label>
                  {fixedOrder ? (
                    <div className={`h-12 rounded-lg rounded-xl border px-4 text-xs lg:text-sm flex items-center ${isDark ? "text-white border-[#2C2C2C] bg-[#151515]" : "text-black border-black/20 bg-[#fff]"}`}>
                      {projects.find((project) => project.id === activeOrderId)?.label || `Booking #${activeOrderId}`}
                    </div>
                  ) : (
                    <SearchAutocomplete
                      placeholder={isLoadingProjects ? "Loading projects..." : "Search by project name or booking ID"}
                      options={projects.map((project) => ({
                        id: project.id,
                        label: project.label,
                        description: project.description,
                      }))}
                      value={activeOrderId}
                      onChange={setSelectedOrderId}
                      emptyMessage="No project matches your search"
                      isDark={isDark}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className={`text-xs lg:text-sm font-medium ${isDark ? "text-white/70" : "text-black/70"}`}>Meeting Title</label>
                  <Input
                    value={meetingTitle}
                    onChange={(event) => setMeetingTitle(event.target.value)}
                    placeholder="Project catch-up"
                    className={`h-12 rounded-lg lg:rounded-xl ${isDark ? "placeholder:text-white/30 text-white border-[#2C2C2C] bg-[#151515]" : "text-black border-black/20 bg-[#fff] placeholder:text-black/60"}`}
                  />
                </div>

                <div className="space-y-2">
                  <label className={`text-sm font-medium ${isDark ? "text-white/70" : "text-black/70"}`}>Meeting Type</label>
                  <Select value={meetingType} onValueChange={(value) => setMeetingType(value as MeetingType)}>
                    <SelectTrigger className={`h-12 rounded-lg lg:rounded-xl ${isDark ? "text-white border-[#2C2C2C] bg-[#151515]" : "text-black border-black/20 bg-[#fff]"}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={`rounded-xl ${isDark ? "border-white/10 bg-[#111111] text-white" : "text-black border-black/20 bg-[#fff]"}`}>
                      <SelectItem value="pre_production" className={`${isDark ? "focus:bg-[#1B1B1B] focus:text-white " : "focus:bg-[#E8D1AB] focus:text-black"}`}>Pre Production</SelectItem>
                      <SelectItem value="post_production" className={`${isDark ? "focus:bg-[#1B1B1B] focus:text-white" : "focus:bg-[#E8D1AB] focus:text-black"}`}>Post Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:col-span-2 md:grid-cols-3">
                  <div className="space-y-2">
                    <DatePicker
                      label="Meeting Date"
                      value={meetingDate}
                      onChange={setMeetingDate}
                      minDate={new Date()}
                      // colors={datePickerColours}
                      isDark={isDark}
                    />
                  </div>

                  <div className="space-y-2">
                    <TimePicker
                      label="Start Time"
                      value={meetingStartTime}
                      onChange={setMeetingStartTime}
                      minTime={isToday ? getMinimumStartTime() : null}
                      isDark={isDark}
                    />
                  </div>

                  <div className="space-y-2">
                    <TimePicker
                      label="End Time"
                      value={meetingEndTime}
                      onChange={setMeetingEndTime}
                      minTime={getMinimumMeetingEndTime(meetingStartTime) || (isToday ? getNextValidTime() : null)}
                      isDark={isDark}
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className={`text-xs lg:text-sm font-medium ${isDark ? "text-white/70" : "text-black/70"}`}>Description</label>
                  <Textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={4}
                    placeholder="Agenda, discussion points, or notes for the team."
                    className={`min-h-[120px] rounded-lg lg:rounded-2xl text-sm lg:text-base ${isDark ? "border-[#2C2C2C] bg-[#151515] text-white placeholder:text-white/30" : "text-black border-black/20 bg-[#fff] placeholder:text-black/60"}`}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className={`rounded-xl lg:rounded-3xl borderp-3 lg:p-5 ${isDark ? "border-white/10 bg-[#101010]" : "border-black/20 bg-[#fff]"}`}>
                <p className={`text-xs font-medium uppercase tracking-[0.24em] ${isDark ? "text-white/35" : "text-black/75"}`}>Host</p>
                <div className={`mt-4 rounded-lg lg:rounded-2xl border p-3 lg:p-4 ${isDark ? "border-[#2C2C2C] bg-[#151515]" : "border-black/20 bg-[#f5f5f5]"}`}>
                  <p className={`text-sm lg:text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>{currentUserName}</p>
                  <p className={`mt-1 text-xs uppercase tracking-[0.2em] ${isDark ? "text-[#E5D5B8]" : "text-[#000]/80"}`}>{formatRoleLabel(role)}</p>
                </div>
              </div>

              <div className={`rounded-xl lg:rounded-3xl borderp-3 lg:p-5 ${isDark ? "border-[#E5D5B8]/10 bg-[linear-gradient(180deg,#15120d_0%,#101010_100%)]" : "border-black/20 bg-[#fff]"}`}>
                <div className="flex items-start gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${isDark ? "border-[#E5D5B8]/30 bg-[#1A1A1A] text-[#E5D5B8]" : "border-[#E8D1AB] bg-[#E8D1AB] text-black"}`}>
                    <Video size={18} />
                  </div>
                  <div>
                    <p className={`text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>Google Meet</p>
                    <p className={`mt-1 text-xs lg:text-sm leading-6 ${isDark ? "text-white/45 " : "text-black/55 "}`}>
                      The meeting will take place via Google Meet.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`rounded-xl lg:rounded-3xl borderp-3 lg:p-5 ${isDark ? "border-white/10 bg-[#101010]" : " border-black/20 bg-[#fff]"}`}>
                <div className="flex items-start gap-3">
                  <Info className={`mt-0.5 shrink-0 ${isDark ? "text-white/60" : "text-black/80"}`} size={16} />
                  <p className={`text-xs lg:text-sm leading-6 ${isDark ? "text-white/45" : "text-black/55"} `}>
                    Invited members can approve or reject the invite, and once accepted they can join directly from the saved meeting card.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-xl lg:rounded-3xl border p-3 lg:p-5 ${isDark ? "border-white/10 bg-[#101010]" : "border-black/20 bg-[#fff]"}`}>
            <div className="mb-3 lg:mb-5 flex items-center justify-between gap-3">
              <div>
                <p className={`text-xs font-medium uppercase tracking-[0.24em] ${isDark ? "text-white/35" : "text-black/75"}`}>Project Team</p>
                <h3 className={`mt-2 lg:text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>Default invited members</h3>
              </div>
              {isLoadingOrderDetails ? (
                <span className={`inline-flex items-center gap-2 text-xs ${isDark ? "text-white/40" : "text-black/60"}`}>
                  <Loader2 size={12} className="animate-spin" />
                  Loading members
                </span>
              ) : null}
            </div>

            {/* Added w-full and overflow-hidden to the immediate container block */}
            <div className={`rounded-lg lg:rounded-2xl border p-3 lg:p-4 w-full overflow-hidden ${isDark ? "border-white/10 bg-[#111111]" : "border-black/20 bg-[#f5f5f5]"}`}>
              {!activeOrderId ? (
                <p className={`text-xs lg:text-sm ${isDark ? "text-white/40" : "text-black/60"}`}>Choose a project first to load sales rep and assigned creative partners.</p>
              ) : (
                /* Added min-w-0 and w-full directly to the grid component layer */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-3 w-full min-w-0">

                  {/* --- CLIENT CARD --- */}
                  {(clientName || clientEmail) ? (
                    <div className={`rounded-lg lg:rounded-2xl border p-3 lg:p-4 text-left min-w-0 w-full ${isDark ? "border-[#E5D5B8]/40 bg-[#1B1812]" : "border-[#E3E3E3] bg-[#F0F0F0]"}`}>
                      <div className="flex items-start justify-between gap-3 min-w-0 w-full">
                        <div className="min-w-0 w-full">
                          <p className={`truncate text-xs lg:text-sm font-medium ${isDark ? "text-white " : "text-black "}`}>{clientName || clientEmail || "Client"}</p>
                          <p className={`mt-1 text-xs uppercase tracking-[0.16em] ${isDark ? "text-white/35" : "text-black/75"}`}>Client</p>
                          {clientEmail ? (
                            <p className={`mt-2 truncate text-xs ${isDark ? "text-white/60" : "text-black/60"}`}>{clientEmail}</p>
                          ) : null}
                        </div>
                        <span className={`rounded-full bg-[#E8D1AB] px-2.5 py-1 text-xs font-medium text-black shrink-0`}>
                          Client
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {/* --- MANAGER / SALES REP CARD --- */}
                  {managerOption ? (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedManagerIds((current) =>
                          current.includes(managerOption.id) ? [] : [managerOption.id]
                        )
                      }
                      className={cn(
                        "rounded-lg lg:rounded-2xl border p-3 lg:p-4 text-left transition-colors min-w-0 w-full",
                        selectedManagerIds.includes(managerOption.id)
                          ? (isDark ? "border-[#E5D5B8]/40 bg-[#1B1812]" : "border-[#E3E3E3] bg-[#F0F0F0]")
                          : (isDark ? "border-white/10 bg-[#0f0f0f] hover:bg-[#151515]" : "border-[#E3E3E3] bg-[#F4F5F7] hover:bg-[#f0f0f0]")
                      )}
                    >
                      <div className="flex items-start justify-between gap-3 min-w-0 w-full">
                        <div className="min-w-0 w-full">
                          <p className={`truncate text-xs lg:text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>{managerOption.name}</p>
                          <p className={`mt-1 text-xs uppercase tracking-[0.16em] ${isDark ? "text-white/35" : "text-black/75"}`}>Sales Rep</p>
                        </div>
                        <span className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium shrink-0",
                          selectedManagerIds.includes(managerOption.id)
                            ? "bg-[#E5D5B8] text-black"
                            : (isDark ? "bg-white/5 text-white/45" : "bg-black/15 text-black/60")
                        )}>
                          {selectedManagerIds.includes(managerOption.id) ? "Selected" : "Optional"}
                        </span>
                      </div>
                    </button>
                  ) : null}

                  {/* --- CREATIVE PARTNER CARDS --- */}
                  {cpOptions.map((cp) => {
                    const selected = selectedCpIds.includes(cp.id);
                    return (
                      <button
                        key={cp.id}
                        type="button"
                        onClick={() =>
                          setSelectedCpIds((current) =>
                            selected
                              ? current.filter((value) => value !== cp.id)
                              : [...current, cp.id]
                          )
                        }
                        className={cn(
                          "rounded-lg lg:rounded-2xl border p-3 lg:p-4 text-left transition-colors min-w-0 w-full",
                          selected
                            ? (isDark ? "border-[#E5D5B8]/40 bg-[#1B1812]" : "border-[#E3E3E3] bg-[#F0F0F0]")
                            : (isDark ? "border-white/10 bg-[#0f0f0f] hover:bg-[#151515]" : "border-[#E3E3E3] bg-[#F4F5F7] hover:bg-[#f0f0f0]")
                        )}
                      >
                        <div className="flex items-start justify-between gap-3 min-w-0 w-full">
                          <div className="min-w-0 w-full">
                            <p className={`truncate text-xs lg:text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>{cp.name}</p>
                            <p className={`mt-1 text-xs uppercase tracking-[0.16em] ${isDark ? "text-white/35" : "text-black/75"}`}>Creative Partner</p>
                          </div>
                          <span className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium shrink-0",
                            selected ? "bg-[#E5D5B8] text-black"
                              : (isDark ? "bg-white/5 text-white/45" : "bg-black/15 text-black/60")
                          )}>
                            {selected ? "Selected" : "Optional"}
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {managerOption === null && cpOptions.length === 0 ? (
                    <p className={`text-xs lg:text-sm md:col-span-2 ${isDark ? "text-white/40" : "text-black/60"}`}>No default project members were found.</p>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div className={`rounded-xl lg:rounded-3xl border ${isDark ? "border-white/10 bg-[#101010]" : " border-black/20 bg-[#fff]"} p-3 lg:p-5`}>
            <div className="mb-5">
              <p className={`text-xs font-medium uppercase tracking-[0.24em] ${isDark ? "text-white/35" : "text-black/75"}`}>Additional Members</p>
              <h3 className={`mt-2 lg:text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>Invite more staff or creative partners</h3>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMemberTab("staff")}
                  className={cn(
                    "rounded-lg lg:rounded-2xl border px-4 py-2.5 text-sm transition-colors",
                    memberTab === "staff"
                      ? (isDark ? "border-[#E5D5B8] bg-[#1B1812] text-white" : "border-[#E3E3E3] bg-[#F0F0F0] text-black")
                      : (isDark ? "border-white/10 bg-[#111111] text-white/60" : "border-[#E3E3E3] bg-[#F0F0F0] text-black/60")
                  )}
                >
                  Staff
                </button>
                <button
                  type="button"
                  onClick={() => setMemberTab("cp")}
                  className={cn(
                    "rounded-lg lg:rounded-2xl border px-4 py-2.5 text-xs lg:text-sm transition-colors",
                    memberTab === "cp"
                      ? (isDark ? "border-[#E5D5B8] bg-[#1B1812] text-white" : "border-[#E3E3E3] bg-[#F0F0F0] text-black")
                      : (isDark ? "border-white/10 bg-[#111111] text-white/60" : "border-[#E3E3E3] bg-[#F0F0F0] text-black/60")
                  )}
                >
                  CPs
                </button>
              </div>

              <div className="relative">
                <Search size={15} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-white/30" : "text-black/60"}`} />
                <Input
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                  placeholder={memberTab === "cp" ? "Search creative partners" : "Search staff members"}
                  className={`h-12 pl-10 rounded-xl ${isDark ? "border-[#2C2C2C] bg-[#151515] text-white placeholder:text-white/30" : "text-black border-black/20 bg-[#fff] placeholder:text-black/60"}`}
                />
              </div>

              {selectedAdditionalMembers.staff.length > 0 || selectedAdditionalMembers.cp.length > 0 ? (
                <div className={`rounded-lg lg:rounded-2xl border p-4 ${isDark ? "border-[#E5D5B8]/15 bg-[#14110d]" : "border-black/20 bg-[#f5f5f5]"}`}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className={`text-xs lg:text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>Added to this meeting</p>
                      <p className={`text-xs ${isDark ? "text-white/45" : "text-black/60"}`}>
                        {selectedAdditionalMembers.staff.length + selectedAdditionalMembers.cp.length} additional member(s) selected
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedAdditionalMembers.staff.map((member) => {
                      const memberId = String(member.id || "");

                      return (
                        <button
                          key={`staff-${memberId}`}
                          type="button"
                          onClick={() =>
                            setSelectedStaffIds((current) => current.filter((value) => value !== memberId))
                          }
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-left text-xs lg:text-sm transition-colors ${isDark ? "text-white border-[#E5D5B8]/30 bg-[#1B1812] hover:bg-[#241d14]" : "text-black border-black/20 bg-[#F0F0F0] hover:bg-[#fff]"}`}
                        >
                          <span className="max-w-[220px] truncate">{member.name || member.email || "Staff Member"}</span>
                          <span className="rounded-full bg-[#E8D1AB] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-black">
                            Staff
                          </span>
                          <span className={isDark ? "text-white/55" : "text-black/55"}><X size={12} /></span>
                        </button>
                      );
                    })}

                    {selectedAdditionalMembers.cp.map((member) => {
                      const memberId = String(member.id || "");

                      return (
                        <button
                          key={`cp-${memberId}`}
                          type="button"
                          onClick={() =>
                            setSelectedExtraCpIds((current) => current.filter((value) => value !== memberId))
                          }
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-left text-xs lg:text-sm transition-colors ${isDark ? "text-white border-[#E5D5B8]/30 bg-[#1B1812] hover:bg-[#241d14]" : "text-black border-black/20 bg-[#F0F0F0] hover:bg-[#fff]"}`}
                        >
                          <span className="max-w-[220px] truncate">{member.name || member.email || "Creative Partner"}</span>
                          <span className="rounded-full bg-[#E5D5B8] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-black">
                            CP
                          </span>
                          <span className={isDark ? "text-white/55" : "text-black/55"}><X size={12} /></span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className={`max-h-56 space-y-2 overflow-y-auto rounded-lg lg:rounded-2xl border p-3 ${isDark ? "border-white/10 bg-[#111111]" : "border-[#E3E3E3] bg-[#F0F0F0]"}`}>
                {filteredDirectoryMembers.length === 0 ? (
                  <p className={`px-2 py-3 text-sm ${isDark ? "text-white/40" : "text-black/60"}`}>
                    {memberTab === "cp" ? "No additional CPs found for this search." : "No additional staff found for this search."}
                  </p>
                ) : (
                  filteredDirectoryMembers.map((member) => {
                    const memberId = String(member.id || "");
                    const selected =
                      memberTab === "cp"
                        ? selectedExtraCpIds.includes(memberId)
                        : selectedStaffIds.includes(memberId);

                    return (
                      <button
                        key={memberId}
                        type="button"
                        onClick={() =>
                          memberTab === "cp"
                            ? setSelectedExtraCpIds((current) =>
                              selected
                                ? current.filter((value) => value !== memberId)
                                : [...current, memberId]
                            )
                            : setSelectedStaffIds((current) =>
                              selected
                                ? current.filter((value) => value !== memberId)
                                : [...current, memberId]
                            )
                        }
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg lg:rounded-2xl border px-4 py-4 text-left transition-colors",
                          selected
                            ? (isDark ? "border-[#E5D5B8] bg-[#1B1812]" : "border-[#E3E3E3] bg-[#F0F0F0]")
                            : (isDark ? "border-white/10 bg-[#0f0f0f] hover:bg-[#151515]" : "border-[#E3E3E3] bg-[#F4F5F7] hover:bg-[#f0f0f0]")
                        )}
                      >
                        <div className="min-w-0">
                          <p className={`truncate text-xs lg:text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>{member.name || member.email || "Staff Member"}</p>
                          {member.email ? (
                            <p className={`truncate text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>{member.email}</p>
                          ) : null}
                          <p className={`truncate text-xs uppercase tracking-[0.16em] ${isDark ? "text-white/35" : "text-black/35"}`}>
                            {memberTab === "cp" ? "Creative Partner" : formatRoleLabel(member.role || "Manager")}
                          </p>
                        </div>
                        <span className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium",
                          selected ? "bg-[#E5D5B8] text-black" : (isDark ? "bg-white/5 text-white/45" : "bg-black/15 text-black/60")
                        )}>
                          {selected ? "Selected" : "Add"}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className={`rounded-xl lg:rounded-3xl border ${isDark ? "border-white/10 bg-[#101010]" : " border-black/20 bg-[#fff]"} p-3 lg:p-5`}>
            <div className="mb-5">
              <p className={`text-xs font-medium uppercase tracking-[0.24em] ${isDark ? "text-white/35" : "text-black/75"}`}>Link & Notifications</p>
              <h3 className={`mt-2 lg:text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>Generate the meeting room</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className={`text-xs lg:text-sm font-medium ${isDark ? "text-white/70" : "text-black/70"}`}>Google Meet Link</label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    value={meetLink}
                    onChange={(event) => setMeetLink(event.target.value)}
                    placeholder="Auto-generated Google Meet link"
                    className={`h-12 rounded-xl ${isDark ? "placeholder:text-white/30 text-white border-[#2C2C2C] bg-[#151515]" : "text-black border-black/20 bg-[#fff] placeholder:text-black/60"}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateMeetLink}
                    disabled={isGeneratingLink || !activeOrderId}
                    className="h-12 rounded-xl border-white/10 bg-[#141414] text-[#E8D1AB] hover:bg-[#1c1c1c]"
                  >
                    {isGeneratingLink ? <Loader2 size={15} className="animate-spin" /> : <Video size={15} />}
                    Generate
                  </Button>
                </div>
              </div>

              <label className={`flex items-start gap-3 rounded-lg lg:rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#111111]" : "border-[#E3E3E3] bg-[#F0F0F0]"}`}>
                <input
                  type="checkbox"
                  checked={sendNotification}
                  onChange={(event) => setSendNotification(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#E5D5B8]"
                />
                <div>
                  <p className={`text-xs lg:text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>Send meeting invitation notifications</p>
                  <p className={`mt-1 text-xs lg:text-sm ${isDark ? "text-white/45" : "text-black/60"}`}>
                    Selected members will get the meeting invite and can approve or reject it from their side.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-white/10 bg-[#141414] text-white hover:bg-[#1c1c1c]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isGeneratingLink}
              className="bg-[#E5D5B8] text-black hover:bg-[#d9c5a0]"
            >
              {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : null}
              Create Meeting
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
