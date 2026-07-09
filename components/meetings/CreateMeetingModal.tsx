"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
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
type GeneratedMeetEvent = {
  eventId: string;
  calendarId?: string;
  meetLink: string;
  startDateTime: string;
  endDateTime: string;
};

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

const getMemberInitials = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "M";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
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
  const [generatedMeetEvent, setGeneratedMeetEvent] = useState<GeneratedMeetEvent | null>(null);
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
  const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false);
  const projectsRequestIdRef = useRef(0);

  const fixedOrder = !!orderId;

  const memberPickerMembers = useMemo(() => {
    const normalizedSearch = memberSearch.trim().toLowerCase();
    const excluded = new Set([
      ...selectedManagerIds,
      ...selectedCpIds,
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
    selectedManagerIds,
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
    setIsMemberPickerOpen(false);
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
        setGeneratedMeetEvent(response.eventId ? {
          eventId: response.eventId,
          calendarId: response.calendarId || "primary",
          meetLink: response.meetLink,
          startDateTime: startIso,
          endDateTime: endIso,
        } : null);
        toast.success("Google Meet link generated.");
        return response;
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

    return null;
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
      let resolvedGoogleEvent = generatedMeetEvent;

      if (!resolvedLink) {
        const generated = await generateMeetLink();
        resolvedLink = generated?.meetLink?.trim() || "";
        resolvedGoogleEvent = generated?.eventId ? {
          eventId: generated.eventId,
          calendarId: generated.calendarId || "primary",
          meetLink: resolvedLink,
          startDateTime: startIso,
          endDateTime: endIso,
        } : null;
      }

      if (!resolvedLink) {
        toast.error("Google Meet link could not be generated, so the meeting was not created.");
        return;
      }

      if (resolvedGoogleEvent?.eventId) {
        const updatedEvent = await meetingsApi.updateEvent({
          eventId: resolvedGoogleEvent.eventId,
          calendarId: resolvedGoogleEvent.calendarId || "primary",
          summary: meetingTitle.trim() || `Meeting for ${getProjectName(selectedOrder)}`,
          location: "Online",
          description: description.trim(),
          startDateTime: startIso,
          endDateTime: endIso,
          timeZone: getBrowserTimeZone(),
        });

        if (updatedEvent?.authUrl) {
          window.open(updatedEvent.authUrl, "_blank", "noopener,noreferrer");
          toast.info("Google authorization opened. Complete it, then try creating the meeting again.");
          return;
        }

        resolvedLink = updatedEvent?.meetLink || resolvedLink;
        resolvedGoogleEvent = {
          eventId: updatedEvent?.eventId || resolvedGoogleEvent.eventId,
          calendarId: updatedEvent?.calendarId || resolvedGoogleEvent.calendarId || "primary",
          meetLink: resolvedLink,
          startDateTime: startIso,
          endDateTime: endIso,
        };
        setMeetLink(resolvedLink);
        setGeneratedMeetEvent(resolvedGoogleEvent);
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
        googleCalendarEventId: resolvedGoogleEvent?.eventId,
        googleCalendarId: resolvedGoogleEvent?.calendarId || "primary",
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
  const figmaFieldClass = isDark
    ? "rounded-[10px] border border-[#3A3A3A] bg-black text-white"
    : "rounded-[10px] border border-black/25 bg-white text-black";
  const figmaLegendClass = isDark ? "px-2 text-sm text-white/55" : "px-2 text-sm text-black/55";
  const figmaInputClass = "h-[62px] border-0 bg-transparent px-4 text-base text-white placeholder:text-white/25 focus-visible:ring-0 focus-visible:ring-offset-0";
  const figmaPickerColors = {
    inputBackground: isDark ? "#000000" : "#FFFFFF",
    inputText: isDark ? "#FFFFFF" : "#101010",
    inputBorder: isDark ? "#3A3A3A" : "rgba(0,0,0,0.25)",
    inputBorderHover: isDark ? "#5A5A5A" : "rgba(0,0,0,0.45)",
    inputBorderFocus: "#E8D1AB",
    labelText: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)",
    iconColor: isDark ? "#FFFFFF" : "#101010",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto px-3 py-4">
      <div className={`absolute inset-0 backdrop-blur-sm ${isDark ? "bg-black/80" : "bg-black/10"}`} />

      <div className={`relative mx-auto flex max-h-[calc(100vh-2rem)] w-full max-w-[720px] flex-col overflow-hidden rounded-lg border shadow-2xl ${isDark ? "shadow-black/40 border-[#262626] bg-black" : "shadow-[#64646f33] bg-[#FFFFFF] border-[#FFFFFF66]"}`}>
        <div className={`flex items-start justify-between border-b px-5 py-5 ${isDark ? "border-white/10" : "border-[#CACACA]"}`}>
          <div>
            <h2 className={`text-xl font-semibold tracking-[-0.02em] ${isDark ? "text-white" : "text-black"}`}>
              Create Meeting <span className="text-sm font-normal text-[#E5D5B8]">(Google Meet Only)</span>
            </h2>
            <p className={`mt-1 max-w-[520px] text-xs leading-4 ${isDark ? "text-white/55" : " text-black/75"}`}>
              Schedule a project meeting, choose the right members, and generate a Google Meet link they can join after accepting.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`shrink-0 flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${isDark ? "border-white/10 bg-[#282323] text-white hover:bg-[#332d2d]" : "border-[#F0F0F0] bg-[#F0F0F0] text-black hover:bg-black/20"}`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <div className={`flex items-center gap-3 rounded-md border px-4 py-3 ${isDark ? "border-[#E5D5B8]/35 bg-[#18140e]" : "border-[#E5D5B8] bg-[#FFF7E7]"}`}>
            <Video size={18} className={isDark ? "text-[#E5D5B8]" : "text-black"} />
            <div>
              <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>Host By {formatRoleLabel(role)}</p>
              <p className={`text-[11px] ${isDark ? "text-white/55" : "text-black/60"}`}>The meeting will take place via Google Meet.</p>
            </div>
          </div>

          <div>
            <div>

              <div className="grid gap-x-4 gap-y-6 md:grid-cols-2">
                <fieldset className={`md:col-span-2 px-3 pb-3 ${figmaFieldClass}`}>
                  <legend className={figmaLegendClass}>Project / Shoots*</legend>
                  {fixedOrder ? (
                    <div className="flex h-[58px] items-center px-1 text-base text-white">
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
                      triggerClassName="h-[58px] rounded-none border-0 bg-transparent px-1 text-base shadow-none hover:bg-transparent"
                    />
                  )}
                </fieldset>

                <fieldset className={`md:col-span-2 px-3 pb-3 ${figmaFieldClass}`}>
                  <legend className={figmaLegendClass}>Meeting Title*</legend>
                  <Input
                    value={meetingTitle}
                    onChange={(event) => setMeetingTitle(event.target.value)}
                    placeholder=""
                    className={figmaInputClass}
                  />
                </fieldset>

                <fieldset className={`px-3 pb-3 ${figmaFieldClass}`}>
                  <legend className={figmaLegendClass}>Meeting Type*</legend>
                  <Select value={meetingType} onValueChange={(value) => setMeetingType(value as MeetingType)}>
                    <SelectTrigger className="h-[58px] border-0 bg-transparent px-1 text-base text-white focus:ring-0 focus:ring-offset-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={`rounded-xl ${isDark ? "border-white/10 bg-[#111111] text-white" : "text-black border-black/20 bg-[#fff]"}`}>
                      <SelectItem value="pre_production" className={`${isDark ? "focus:bg-[#1B1B1B] focus:text-white " : "focus:bg-[#E8D1AB] focus:text-black"}`}>Pre Production</SelectItem>
                      <SelectItem value="post_production" className={`${isDark ? "focus:bg-[#1B1B1B] focus:text-white" : "focus:bg-[#E8D1AB] focus:text-black"}`}>Post Production</SelectItem>
                    </SelectContent>
                  </Select>
                </fieldset>

                <div className="pt-[10px]">
                  <DatePicker
                    label="Meeting Date*"
                    value={meetingDate}
                    onChange={setMeetingDate}
                    minDate={new Date()}
                    colors={figmaPickerColors}
                    floating
                    sx={{ height: "82px", borderRadius: "10px" }}
                    isDark={isDark}
                  />
                </div>

                <div className="pt-[10px]">
                  <TimePicker
                    label="Start Time*"
                    value={meetingStartTime}
                    onChange={setMeetingStartTime}
                    minTime={isToday ? getMinimumStartTime() : null}
                    colors={figmaPickerColors}
                    floating
                    isDark={isDark}
                  />
                </div>

                <div className="pt-[10px]">
                  <TimePicker
                    label="End Time*"
                    value={meetingEndTime}
                    onChange={setMeetingEndTime}
                    minTime={getMinimumMeetingEndTime(meetingStartTime) || (isToday ? getNextValidTime() : null)}
                    colors={figmaPickerColors}
                    floating
                    isDark={isDark}
                  />
                </div>

                <fieldset className={`md:col-span-2 px-3 pb-3 ${figmaFieldClass}`}>
                  <legend className={figmaLegendClass}>Description</legend>
                  <Textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={4}
                    placeholder=""
                    className="min-h-[132px] resize-none border-0 bg-transparent px-1 text-base text-white placeholder:text-white/25 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </fieldset>
              </div>
            </div>
          </div>

          <div className="border-t border-[#3A3A3A] pt-7">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-medium text-white">Default Invited Members</h3>
              {isLoadingOrderDetails ? (
                <span className={`inline-flex items-center gap-2 text-xs ${isDark ? "text-white/40" : "text-black/60"}`}>
                  <Loader2 size={12} className="animate-spin" />
                  Loading members
                </span>
              ) : null}
            </div>

            <div className="w-full overflow-hidden">
              {!activeOrderId ? (
                <p className="rounded-[10px] border border-[#303030] px-5 py-5 text-base text-white/35">
                  Choose a project first to load sales rep and assigned creative partners.
                </p>
              ) : (
                <div className="grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-2">

                  {/* --- CLIENT CARD --- */}
                  {(clientName || clientEmail) ? (
                    <div className="min-w-0 w-full rounded-[10px] bg-[#E8D1AB] px-5 py-4 text-left">
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0 w-full">
                          <p className="truncate text-sm font-medium text-black">{clientEmail || clientName || "Client"}</p>
                          <p className="mt-2 text-lg uppercase tracking-[0.12em] text-black/45">Client</p>
                          {clientEmail ? (
                            <p className="sr-only">{clientEmail}</p>
                          ) : null}
                        </div>
                        <span className="shrink-0 rounded-full bg-[#1E1E1E] px-3 py-1 text-xs font-medium text-[#E8D1AB]">
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
                        "min-w-0 w-full rounded-[10px] border px-5 py-4 text-left transition-colors",
                        selectedManagerIds.includes(managerOption.id)
                          ? "border-[#E5D5B8]/60 bg-[#19150F]"
                          : "border-[#303030] bg-[#111111] hover:bg-[#151515]"
                      )}
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0 w-full">
                          <p className="truncate text-sm font-medium text-white">{managerOption.name}</p>
                          <p className="mt-2 text-lg uppercase tracking-[0.12em] text-white/35">Sales Rep</p>
                        </div>
                        <span className={cn(
                          "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                          selectedManagerIds.includes(managerOption.id)
                            ? "bg-[#E5D5B8] text-black"
                            : "bg-white/10 text-white/65"
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
                          "min-w-0 w-full rounded-[10px] border px-5 py-4 text-left transition-colors",
                          selected
                            ? "border-[#E5D5B8]/60 bg-[#19150F]"
                            : "border-[#303030] bg-[#111111] hover:bg-[#151515]"
                        )}
                      >
                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <div className="min-w-0 w-full">
                            <p className="truncate text-sm font-medium text-white">{cp.name}</p>
                            <p className="mt-2 text-lg uppercase tracking-[0.12em] text-white/35">Creative Partner</p>
                          </div>
                          <span className={cn(
                            "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                            selected ? "bg-[#E5D5B8] text-black"
                              : "bg-white/10 text-white/65"
                          )}>
                            {selected ? "Selected" : "Optional"}
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {managerOption === null && cpOptions.length === 0 ? (
                    <p className="text-sm text-white/40 md:col-span-2">No default project members were found.</p>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setIsMemberPickerOpen(true)}
              className="group inline-flex items-center gap-3 text-base font-semibold text-[#E5D5B8]"
            >
              <span className="text-3xl font-light leading-none no-underline">+</span>
              <span className="border-b border-[#E5D5B8] leading-5">Invite Additional Members</span>
            </button>

            {selectedAdditionalMembers.staff.length > 0 || selectedAdditionalMembers.cp.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedAdditionalMembers.staff.map((member) => {
                  const memberId = String(member.id || "");

                  return (
                    <button
                      key={`staff-chip-${memberId}`}
                      type="button"
                      onClick={() => setSelectedStaffIds((current) => current.filter((value) => value !== memberId))}
                      className="inline-flex items-center gap-3 rounded bg-[#1E1A15] px-4 py-2.5 text-base text-white"
                    >
                      <span>{member.name || member.email || "Staff Member"} <span className="text-[#E5D5B8]">(Staff)</span></span>
                      <X size={16} />
                    </button>
                  );
                })}

                {selectedAdditionalMembers.cp.map((member) => {
                  const memberId = String(member.id || "");

                  return (
                    <button
                      key={`cp-chip-${memberId}`}
                      type="button"
                      onClick={() => setSelectedExtraCpIds((current) => current.filter((value) => value !== memberId))}
                      className="inline-flex items-center gap-3 rounded bg-[#1E1A15] px-4 py-2.5 text-base text-white"
                    >
                      <span>{member.name || member.email || "Creative Partner"} <span className="text-[#E5D5B8]">(CP)</span></span>
                      <X size={16} />
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="space-y-5 border-t border-[#3A3A3A] pt-5">
            <h3 className="text-lg font-medium text-white">Link & Notifications</h3>

            <fieldset className={`px-3 pb-3 ${figmaFieldClass}`}>
              <legend className={figmaLegendClass}>Google Meet Link*</legend>
              <div className="flex items-center gap-4">
                  <Input
                    value={meetLink}
                    onChange={(event) => {
                      setMeetLink(event.target.value);
                      setGeneratedMeetEvent(null);
                    }}
                  placeholder="Auto-generated google meet link.."
                  className="h-[62px] flex-1 border-0 bg-transparent px-1 text-base text-white placeholder:text-white/25 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Button
                    type="button"
                    onClick={generateMeetLink}
                    disabled={isGeneratingLink || !activeOrderId}
                  className="h-12 min-w-[148px] rounded-md bg-[#E8D1AB] text-lg font-medium text-black hover:bg-[#d9c5a0]"
                  >
                  {isGeneratingLink ? <Loader2 size={16} className="animate-spin" /> : null}
                    Generate
                  </Button>
              </div>
            </fieldset>

            <label className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={sendNotification}
                  onChange={(event) => setSendNotification(event.target.checked)}
                className="mt-1 h-6 w-6 rounded accent-[#E8D1AB]"
                />
                <div>
                <p className="text-lg font-semibold text-white">Send meeting invitation notifications</p>
                <p className="mt-1 text-sm text-white/55">
                    Selected members will get the meeting invite and can approve or reject it from their side.
                  </p>
                </div>
              </label>

            <div className="grid grid-cols-2 gap-5 pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
                className="h-[58px] rounded-md border-0 bg-[#202020] text-white hover:bg-[#2A2A2A]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isGeneratingLink}
                className="h-[58px] rounded-md bg-[#E8D1AB] font-semibold text-black hover:bg-[#d9c5a0]"
            >
              {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : null}
              Create Meeting
            </Button>
            </div>
          </div>
        </div>
      </div>

      {isMemberPickerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 px-4">
          <div className="flex max-h-[calc(100vh-3rem)] w-full max-w-[620px] flex-col overflow-hidden rounded-lg border border-[#2A2A2A] bg-black shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <h3 className="text-xl font-semibold text-white">Invite more staff or creative partners</h3>
              <button
                type="button"
                onClick={() => setIsMemberPickerOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#282323] text-white hover:bg-[#332d2d]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              <div className="grid grid-cols-2 rounded-md bg-[#1A1A1A] p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMemberTab("staff");
                    setMemberSearch("");
                  }}
                  className={cn(
                    "rounded px-4 py-2 text-sm transition-colors",
                    memberTab === "staff" ? "bg-[#E5D5B8] text-black" : "text-white/55"
                  )}
                >
                  Staff
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMemberTab("cp");
                    setMemberSearch("");
                  }}
                  className={cn(
                    "rounded px-4 py-2 text-sm transition-colors",
                    memberTab === "cp" ? "bg-[#E5D5B8] text-black" : "text-white/55"
                  )}
                >
                  Creative Partners
                </button>
              </div>

              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
                <Input
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                  placeholder={memberTab === "cp" ? "Search Creative Partners..." : "Search Staff Members..."}
                  className="h-11 rounded-md border-[#2C2C2C] bg-[#171717] pl-10 text-white placeholder:text-white/30"
                />
              </div>

              <p className="text-sm font-semibold text-white">
                {memberTab === "cp" ? "Creative Partners" : "Staff Members"} (
                {memberTab === "cp" ? selectedExtraCpIds.length : selectedStaffIds.length} Selected)
              </p>

              <div className="space-y-2">
                {memberPickerMembers.length === 0 ? (
                  <p className="rounded-md bg-[#171717] px-4 py-5 text-sm text-white/45">
                    {memberTab === "cp" ? "No creative partners found." : "No staff members found."}
                  </p>
                ) : (
                  memberPickerMembers.map((member) => {
                    const memberId = String(member.id || "");
                    const selected =
                      memberTab === "cp"
                        ? selectedExtraCpIds.includes(memberId)
                        : selectedStaffIds.includes(memberId);
                    const initials = getMemberInitials(member.name || member.email || "Member");

                    return (
                      <button
                        key={`${memberTab}-${memberId}`}
                        type="button"
                        onClick={() =>
                          memberTab === "cp"
                            ? setSelectedExtraCpIds((current) =>
                              selected ? current.filter((value) => value !== memberId) : [...current, memberId]
                            )
                            : setSelectedStaffIds((current) =>
                              selected ? current.filter((value) => value !== memberId) : [...current, memberId]
                            )
                        }
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left transition-colors",
                          selected ? "border-[#E5D5B8]/45 bg-[#1D1B18]" : "border-transparent bg-[#171717] hover:bg-[#1f1f1f]"
                        )}
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2E2820] text-sm font-semibold text-[#E5D5B8]">
                          {initials}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-white">
                            {member.name || member.email || "Member"}
                          </span>
                          <span className="block truncate text-xs text-white/50">
                            {formatRoleLabel(member.role || (memberTab === "cp" ? "Creative Partner" : "Admin"))}
                          </span>
                          {member.email ? <span className="block truncate text-xs text-[#E5D5B8]/80">{member.email}</span> : null}
                        </span>
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded border",
                            selected ? "border-[#E5D5B8] bg-[#E5D5B8] text-black" : "border-white/20 text-transparent"
                          )}
                        >
                          ✓
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-white/10 p-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMemberPickerOpen(false)}
                className="h-11 border-white/10 bg-[#1f1f1f] text-white hover:bg-[#282828]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => setIsMemberPickerOpen(false)}
                className="h-11 bg-[#E5D5B8] text-black hover:bg-[#d9c5a0]"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
