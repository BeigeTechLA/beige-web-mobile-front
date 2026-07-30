"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Info,
  Loader2,
  Search,
  Video,
  X,
  User,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/Datepicker";
import { DatePickerFloating } from "../admin/DatePickerFloating";
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
import { getBrowserTimeZone, getBrowserTimeZoneLabel } from "@/lib/timezone";
import { cn, getInitials } from "@/lib/utils";
import SearchAutocomplete from "@/components/chat/SearchAutocomplete";
import { TabsSwitcher } from "../admin/TabsSwitcher";
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
    project?.lead_details?.client_name,
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

  // Committed/Confirmed array states to reflect verified user selection on main layout forms
  const [confirmedStaffIds, setConfirmedStaffIds] = useState<string[]>([]);
  const [confirmedExtraCpIds, setConfirmedExtraCpIds] = useState<string[]>([]);

  const [memberSearch, setMemberSearch] = useState("");
  const [memberTab, setMemberTab] = useState<MemberTab>("staff");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false);

  const [showAdditionalMembersView, setShowAdditionalMembersView] = useState(false);

  const projectsRequestIdRef = useRef(0);

  const fixedOrder = !!orderId;

  const filteredDirectoryMembers = useMemo(() => {
    const normalizedSearch = memberSearch.trim().toLowerCase();
    const excluded = new Set([
      ...selectedManagerIds,
      ...selectedCpIds,
      // ...selectedStaffIds,
      // ...selectedExtraCpIds,
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
    // selectedExtraCpIds,
    selectedManagerIds,
    // selectedStaffIds,
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

  const handleCommitParticipants = () => {
    setConfirmedStaffIds([...selectedStaffIds]);
    setConfirmedExtraCpIds([...selectedExtraCpIds]);
    setShowAdditionalMembersView(false);
  };

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
    setConfirmedStaffIds([]);
    setConfirmedExtraCpIds([]);
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
        setConfirmedStaffIds([]);
        setConfirmedExtraCpIds([]);

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
                <style>body{margin:0;background:#090909;color:#fff;font-family:Inter,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;} .card{max-width:520px;padding:32px;border-radius:24px;background:rgba(17,17,17,.95);box-shadow:0 20px 80px rgba(0,0,0,.35); text-align:center;} .button{display:inline-flex;align-items:center;justify-content:center;margin-top:24px;padding:12px 22px;border-radius:999px;background:#E8D1AB;color:#000;text-decoration:none;font-weight:700;}</style>
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

    if (selectedManagerIds.length === 0 && selectedCpIds.length === 0 && confirmedStaffIds.length === 0 && confirmedExtraCpIds.length === 0) {
      toast.error("Select at least one member for this meeting.");
      return;
    }

    const cpParticipantIds = Array.from(new Set([...selectedCpIds, ...confirmedExtraCpIds].filter(Boolean)));
    const managerParticipantIds = Array.from(new Set([...selectedManagerIds, ...confirmedStaffIds].filter(Boolean)));

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
  const browserTimeZone = getBrowserTimeZone();
  const browserTimeZoneLabel = getBrowserTimeZoneLabel(meetingDate || new Date());

  const tabs: { label: string; value: "staff" | "cp" }[] = [
    { label: "Staff", value: "staff" },
    { label: "Creative Partners", value: "cp" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:px-4 lg:py-8">
      <div
        onClick={onClose}
        className={`absolute inset-0 backdrop-blur-sm ${isDark ? "bg-[#101010]/80" : "bg-black/10"}`}
      />

      <div className={`relative mx-auto flex max-h-[calc(100vh-2rem)] w-full max-w-[860px] flex-col rounded-lg lg:rounded-2xl border shadow-2xl ${isDark ? "shadow-black/40 border-white/40 bg-black" : "shadow-[#64646f33] bg-[#FFFFFF] border-[#FFFFFF66]"}`}>
        {
          !showAdditionalMembersView ?
            <>
              <div className={`flex items-start justify-between border-b p-4 lg:p-7 ${isDark ? "border-white/10" : "border-[#CACACA]"}`}>
                <div>
                  <div className="flex items-end gap-1">
                    <h2 className={`text-xl lg:text-3xl font-semibold tracking-[-0.02em] ${isDark ? "text-white" : "text-black"}`}>Create Meeting</h2>
                    <p className={`text-xs lg:text-xl font-medium capitalize ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>
                      (Google Meet Only)
                    </p>
                  </div>
                  <p className={`mt-1 max-w-[560px] text-xs lg:text-sm lg:leading-6 ${isDark ? "text-white/70" : " text-black/75"}`}>
                    Schedule a project meeting, choose the right members, and generate a Google Meet link they can join after accepting.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className={`rounded-full p-2 lg:p-3.5 shrink-0 transition-colors ${isDark ? "bg-[#2B2626] text-white/60 hover:bg-[#2B2626]/75" : "bg-[#F0F0F0] text-zinc-400 hover:bg-[#F0F0F0]/70"}`}
                >
                  <X className="h-4 w-4 lg:h-7 lg:w-7" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto py-4 lg:py-7 no-scrollbar">
                <div className="px-4 lg:px-7 space-y-4 lg:space-y-7">
                  <div className={`flex gap-4 items-center rounded-lg border p-3 lg:p-5 ${isDark ? "border-[#E8D1AB] bg-[#E8D1AB]/10" : "border-[#E8D1AB] bg-[#E8D1AB]/10"}`}>
                    <User className="text-[#E8D1AB] w-5 h-5 lg:h-9 lg:w-9" />
                    <div>
                      <p className={`text-base font-medium ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>Hosted by {currentUserName}</p>
                      <p className={`mt-1 text-xs lg:text-sm ${isDark ? "text-white/70" : "text-black/80"}`}>The meeting will take place via Google Meet.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {fixedOrder ? (
                      <div className={`h-16 lg:h-20 rounded-lg rounded-xl border px-4 text-xs lg:text-sm flex items-center ${isDark ? "text-white border-white/50 bg-[#151515]" : "text-black border-black/20 bg-[#fff]"}`}>
                        {projects.find((project) => project.id === activeOrderId)?.label || `Booking #${activeOrderId}`}
                      </div>
                    ) : (
                      <SearchAutocomplete
                        label="Project / Shoot"
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

                  {/* Meeting Title Field */}
                  <div className="relative">
                    <label className={`absolute -top-3 left-4 z-10 px-2 text-sm lg:text-base font-medium transition-colors ${isDark ? "bg-black text-white/50" : "bg-white text-black/60"}`}>
                      Meeting Title*
                    </label>
                    <Input
                      value={meetingTitle}
                      onChange={(event) => setMeetingTitle(event.target.value)}
                      placeholder="Project catch-up"
                      className={`h-16 lg:h-[82px] rounded-lg lg:rounded-xl pt-1 ${isDark ? "placeholder:text-white/30 text-white border-white/50 bg-black focus:border-[#E8D1AB]/50" : "text-black border-black/20 bg-[#fff] placeholder:text-black/60 focus:border-[#E8D1AB]"}`}
                    />
                  </div>

                  {/* Meeting Pickers Container */}
                  <div className="grid gap-4 lg:grid-cols-2">
                    {/* Meeting Type Field */}
                    <div className="relative">
                      <label className={`absolute -top-3 left-4 z-10 px-2 text-sm lg:text-base font-medium transition-colors ${isDark ? "bg-black text-white/50" : "bg-white text-black/60"}`}>
                        Meeting Type*
                      </label>
                      <Select value={meetingType} onValueChange={(value) => setMeetingType(value as MeetingType)}>
                        <SelectTrigger className={`h-16 lg:h-[82px] rounded-lg lg:rounded-xl text-left ${isDark ? "text-white border-white/50 bg-black" : "text-black border-black/20 bg-[#fff]"}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={`rounded-xl ${isDark ? "border-white/10 bg-[#111111] text-white" : "text-black border-black/20 bg-[#fff]"}`}>
                          <SelectItem value="pre_production" className={`${isDark ? "focus:bg-[#1B1B1B] focus:text-white " : "focus:bg-[#E8D1AB] focus:text-black"}`}>Pre Production</SelectItem>
                          <SelectItem value="post_production" className={`${isDark ? "focus:bg-[#1B1B1B] focus:text-white" : "focus:bg-[#E8D1AB] focus:text-black"}`}>Post Production</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="relative">
                      <DatePickerFloating
                        selectedDate={meetingDate}
                        onDateChange={setMeetingDate}
                        width="w-full"
                        classnames={`rounded-xl h-14 lg:h-[82px] w-full resize-none px-0 text-sm lg:text-base outline-none lg:text-base ${isDark ? "text-white " : "text-black "}`}
                        labelClasses={`${isDark ? "bg-black text-white/60" : "bg-white text-[#727272]"} text-sm lg:text-base z-10 px-1`}
                        label="Meeting Date"
                      />
                    </div>

                    <div className="relative">
                      <TimePicker
                        label="Start Time"
                        value={meetingStartTime}
                        onChange={setMeetingStartTime}
                        minTime={isToday ? getMinimumStartTime() : null}
                        isDark={isDark}
                        height={{ xs: "60px", lg: "82px" }}
                        fontSize={"text-sm lg:text-base"}
                        labelFontSize={"text-sm lg:text-base"}
                      />
                    </div>

                    <div className="relative">
                      <TimePicker
                        label="End Time"
                        value={meetingEndTime}
                        onChange={setMeetingEndTime}
                        minTime={getMinimumMeetingEndTime(meetingStartTime) || (isToday ? getNextValidTime() : null)}
                        isDark={isDark}
                        height={{ xs: "60px", lg: "82px" }}
                        fontSize={"text-sm lg:text-base"}
                        labelFontSize={"text-sm lg:text-base"}
                      />
                    </div>

                    <div className={`lg:col-span-2 rounded-lg border px-4 py-3 text-xs lg:text-sm ${isDark ? "border-[#E8D1AB]/40 bg-[#E8D1AB]/10 text-white/75" : "border-[#E8D1AB]/70 bg-[#E8D1AB]/15 text-black/70"}`}>
                      Meeting will be created in your timezone: <span className={`font-semibold ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>{browserTimeZone} ({browserTimeZoneLabel})</span>
                    </div>
                  </div>

                  {/* Description Field */}
                  <div className="relative">
                    <label className={`absolute -top-3 left-4 z-10 px-2 text-sm lg:text-base font-medium transition-colors ${isDark ? "bg-black text-white/50" : "bg-white text-black/60"}`}>
                      Description
                    </label>
                    <Textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      rows={4}
                      placeholder="Agenda, discussion points, or notes for the team."
                      className={`min-h-[120px] rounded-lg lg:rounded-xl text-sm lg:text-base p-3 lg:p-5 ${isDark ? "border-white/50 bg-black text-white placeholder:text-white/30" : "text-black border-black/20 bg-[#fff] placeholder:text-black/60"}`}
                    />
                  </div>
                </div>

                <hr className={`border-t my-4 lg:my-7 ${isDark ? "border-[#CACACA]" : "border-[#E3E3E3]"}`} />

                <div className="px-4 lg:px-7">
                  <div className="mb-3 lg:mb-4 flex items-center justify-between gap-3">
                    <h3 className={`text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"}`}>Default invited members</h3>
                    {isLoadingOrderDetails ? (
                      <span className={`inline-flex items-center gap-2 text-xs ${isDark ? "text-white/40" : "text-black/60"}`}>
                        <Loader2 size={12} className="animate-spin" />
                        Loading members
                      </span>
                    ) : null}
                  </div>

                  <>
                    {!activeOrderId ? (
                      <p className={`text-xs lg:text-sm ${isDark ? "text-white/40" : "text-black/60"}`}>Choose a project first to load sales rep and assigned creative partners.</p>
                    ) : (
                      <div className="space-y-4 lg:space-y-5">
                        {/* /* Added min-w-0 and w-full directly to the grid component layer */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-3 w-full min-w-0">

                          {/* --- CLIENT CARD --- */}
                          {(clientName || clientEmail) ? (
                            <div className={`rounded-lg lg:rounded-xl border p-4 lg:py-5 text-left min-w-0 w-full border-[#E8D1AB] bg-[#E8D1AB]`}>
                              <div className="flex items-start justify-between gap-3 min-w-0 w-full">
                                <div className="min-w-0 w-full">
                                  <p className={`truncate text-xs text-black`}>{clientName || clientEmail || "Client"}</p>
                                  <p className={`lg:mt-1 text-base uppercase tracking-[0.16em] text-black/50`}>Client</p>
                                  {/* {clientEmail ? (
                                    <p className={`mt-2 truncate text-xs ${isDark ? "text-white/60" : "text-black/60"}`}>{clientEmail}</p>
                                  ) : null} */}
                                </div>
                                <span className={`rounded-full bg-[#1D1D1B] px-2.5 py-1 text-xs text-[#E8D1AB] shrink-0`}>
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
                              className={`rounded-lg lg:rounded-xl border p-4 lg:py-5 text-left transition-colors min-w-0 w-full ${selectedManagerIds.includes(managerOption.id)
                                  ? "border-[#E8D1AB] bg-[#E8D1AB]"
                                  : isDark ? "border-white/30 bg-white/5 hover:bg-[#151515]" : "border-[#E3E3E3] bg-[#F4F5F7] hover:bg-[#f0f0f0]"
                                }`}
                            >
                              <div className="flex items-start justify-between gap-3 min-w-0 w-full">
                                <div className="min-w-0 w-full">
                                  <p className={`truncate text-xs ${selectedManagerIds.includes(managerOption.id)
                                    ? "text-black"
                                    : isDark ? "text-white" : "text-black"}`}
                                  >{managerOption.name}</p>
                                  <p
                                    className={`lg:mt-1 text-base uppercase tracking-[0.16em] ${selectedManagerIds.includes(managerOption.id)
                                      ? "text-black/50"
                                      : isDark ? "text-white/50" : "text-black/75"}`}>Sales Rep</p>
                                </div>
                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium shrink-0 ${selectedManagerIds.includes(managerOption.id)
                                    ? "bg-[#1D1D1B] text-[#E8D1AB]"
                                    : isDark ? "bg-[#2C2C2C] text-[#E2DFDF]" : "bg-black/15 text-black/60"
                                  }`}>
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
                                className={`rounded-lg lg:rounded-xl border px-4 py-5 text-left transition-colors min-w-0 w-full ${selected
                                    ? "border-[#E8D1AB] bg-[#E8D1AB]"
                                    : isDark ? "border-white/30 bg-white/5 hover:bg-[#151515]" : "border-[#E3E3E3] bg-[#F4F5F7] hover:bg-[#f0f0f0]"
                                  }`}
                              >
                                <div className="flex items-start justify-between gap-3 min-w-0 w-full">
                                  <div className="min-w-0 w-full">
                                    <p className={`truncate text-xs ${selected
                                      ? "text-black"
                                      : isDark ? "text-white" : "text-black"}`}>{cp.name}</p>
                                    <p className={`mt-1 text-base uppercase tracking-[0.16em] ${selected
                                      ? "text-black/50"
                                      : isDark ? "text-white/50" : "text-black/75"}`}>Creative Partner</p>
                                  </div>
                                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium shrink-0 ${selected ? "bg-[#1D1D1B] text-[#E8D1AB]"
                                      : isDark ? "bg-[#2C2C2C] text-[#E2DFDF]" : "bg-black/15 text-black/60"
                                    }`}>
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

                        <button
                          type="button"
                          onClick={() => setShowAdditionalMembersView(true)}
                          className="text-[#E8D1AB] flex gap-2 items-center"
                        >
                          <Plus size={24} />
                          <span className="underline underline-offset-2 text-sm font-semibold">Invite Additional Members </span>
                        </button>
                      </div>
                    )}
                  </>

                  {(selectedAdditionalMembers.staff.length > 0 || selectedAdditionalMembers.cp.length > 0) && (
                    <div className="mt-4 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {selectedAdditionalMembers.staff.map((member) => {
                          const memberId = String(member.id || "");
                          return (
                            <div
                              key={`main-staff-${memberId}`}
                              className={`inline-flex items-center gap-2 rounded-sm px-3 py-1 text-left text-sm transition-colors ${isDark ? "text-white bg-[#e8d1ab]/10" : "text-black  bg-[#F0F0F0]"}`}
                            >
                              <span className="max-w-[180px] truncate">{member.name || member.email || "Staff Member"}</span>
                              <span className="text-[#E8D1AB]">
                                (Staff)
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmedStaffIds((current) => current.filter((id) => id !== memberId));
                                  setSelectedStaffIds((current) => current.filter((id) => id !== memberId));
                                }}
                                className={`rounded-full p-0.5 hover:bg-black/10 transition-colors ${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/60"}`}
                              >
                                <X size={22} />
                              </button>
                            </div>
                          );
                        })}

                        {selectedAdditionalMembers.cp.map((member) => {
                          const memberId = String(member.id || "");
                          return (
                            <div
                              key={`main-cp-${memberId}`}
                              className={`inline-flex items-center gap-2 rounded-sm px-3 py-1 text-left text-sm transition-colors ${isDark ? "text-white bg-[#e8d1ab]/10" : "text-black  bg-[#F0F0F0]"}`}
                            >
                              <span className="max-w-[180px] truncate">{member.name || member.email || "Creative Partner"}</span>
                              <span className="text-[#E8D1AB]">
                                (CP)
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmedExtraCpIds((current) => current.filter((id) => id !== memberId));
                                  setSelectedExtraCpIds((current) => current.filter((id) => id !== memberId));
                                }}
                                className={`rounded-full p-0.5 hover:bg-black/10 transition-colors ${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/60"}`}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <hr className={`border-t my-4 lg:my-7 ${isDark ? "border-[#CACACA]" : "border-[#E3E3E3]"}`} />

                <div className="px-4 lg:px-7 space-y-4 lg:space-y-5">
                  <h3 className={`text-sm lg:text-base font-medium  ${isDark ? "text-white" : "text-black"}`}>Link & Notifications</h3>

                  <div className="space-y-4">
                    <div className="relative w-full">
                      {/* Floating Label with clean cutout effect */}
                      <label className={`absolute -top-2 lg:-top-3 left-4 z-10 px-2 text-sm lg:text-base font-medium transition-colors ${isDark ? "bg-black text-white/50" : "bg-white text-black/60"}`}>
                        Google Meet Link*
                      </label>

                      {/* Outer Border Wrapper containing Input and Button together */}
                      <div
                        className={`flex items-center justify-between gap-3 px-4 rounded-xl border w-full h-16 lg:h-20 ${isDark
                          ? "border-white/50 bg-black"
                          : "border-black/45 bg-white"
                          }`}
                      >
                        {/* Borderless Input field */}
                        <Input
                          type="text"
                          value={meetLink}
                          onChange={(event) => {
                            setMeetLink(event.target.value);
                            setGeneratedMeetEvent(null);
                          }}
                          placeholder="Auto-generated google meet link.."
                          className={`w-full h-full bg-transparent border-none outline-none text-xs lg:text-base focus:ring-0 p-0 ${isDark
                            ? "text-white placeholder:text-white/30"
                            : "text-black placeholder:text-black/35"
                            }`}
                        />

                        {/* Styled Action Button */}
                        <Button
                          type="button"
                          onClick={generateMeetLink}
                          disabled={isGeneratingLink || !activeOrderId}
                          className={`shrink-0 rounded-md px-3 lg:px-6 h-7 lg:h-11 text-xs lg:text-lg transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 ${isDark
                            ? "bg-[#E8D1AB] text-black hover:bg-[#d4c2a1]"
                            : "bg-[#E8D1AB] text-black hover:bg-[#d4c2a1]"
                            }`}
                        >
                          {isGeneratingLink ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            "Generate"
                          )}
                        </Button>
                      </div>
                    </div>

                    <label className={`flex items-start gap-3`}>
                      <input
                        type="checkbox"
                        checked={sendNotification}
                        onChange={(event) => setSendNotification(event.target.checked)}
                        className="mt-0.5 h-6 w-6 accent-[#E8D1AB]"
                      />
                      <div>
                        <p className={`text-sm lg:text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>Send meeting invitation notifications</p>
                        <p className={`mt-1 text-xs lg:text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
                          Selected members will get the meeting invite and can approve or reject it from their side.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex w-full gap-3 p-4 lg:p-7">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className={`flex-1 border ${isDark ? "border-[#262626] bg-[#1F1F1F] text-white hover:bg-[#1c1c1c]" : "border-[#f0f0f0] bg-[#f0f0f0] text-zinc-700 hover:bg-zinc-100"}`}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || isGeneratingLink}
                  className="flex-1 bg-[#E8D1AB] text-black hover:bg-[#d9c5a0]"
                >
                  {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : null}
                  Create Meeting
                </Button>
              </div>
            </>
            :
            <>
              {/* Header */}
              <div className={`flex items-center justify-between border-b p-4 lg:p-7 ${isDark ? "border-white/10" : "border-[#CACACA]"}`}>
                <h2 className={`text-xl lg:text-3xl font-semibold tracking-[-0.02em] ${isDark ? "text-white" : "text-black"}`}>Invite more staff or creative partners</h2>
                <button
                  onClick={onClose}
                  className={`rounded-full p-2 lg:p-3.5 shrink-0 transition-colors ${isDark ? "bg-[#2B2626] text-white/60 hover:bg-[#2B2626]/75" : "bg-[#F0F0F0] text-zinc-400 hover:bg-[#F0F0F0]/70"}`}
                >
                  <X className="h-4 w-4 lg:h-7 lg:w-7" />
                </button>
              </div>

              {/* Body */}
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-7 lg:px-7 space-y-3 lg:space-y-5 no-scrollbar">
                <TabsSwitcher
                  tabs={tabs}
                  activeTab={memberTab}
                  onChange={(tab) => setMemberTab(tab)}
                  className="w-full"
                />

                <div className="relative">
                  <Search size={15} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-white/30" : "text-black/60"}`} />
                  <Input
                    value={memberSearch}
                    onChange={(event) => setMemberSearch(event.target.value)}
                    placeholder={memberTab === "cp" ? "Search creative partners" : "Search staff members"}
                    className={`h-12 pl-10 rounded-xl ${isDark ? "border-white/50 bg-[#151515] text-white placeholder:text-white/30" : "text-black border-black/20 bg-[#fff] placeholder:text-black/60"}`}
                  />
                </div>

                <p className={`font-medium capitalize ${isDark ? "text-[#E8D1AB]" : "text-black/70"}`}>
                  <span className={isDark ? "text-white" : "text-black"}>{memberTab === "cp" ? "Creative Partners" : "Staff Members"}{" "}</span>
                  ({(memberTab === "cp" ? selectedExtraCpIds : selectedStaffIds).length.toString().padStart(2, '0')} Selected)
                </p>

                <div className={`max-h-115 space-y-2.5 overflow-y-auto no-scrollbar`}>
                  {filteredDirectoryMembers.length === 0 ? (
                    <p className={`px-2 py-3 text-sm text-center ${isDark ? "text-white/40" : "text-black/60"}`}>
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
                          className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all ${isDark ? "bg-[#171717] hover:bg-[#151515]" : "bg-white hover:bg-[#F4F5F7]"} ${selected ? "border-[#E8D1AB]/50 " : (isDark ? "border-[#171717]" : "border-[#E3E3E3]")}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-15 h-15 rounded-full flex items-center justify-center font-medium text-lg shrink-0 uppercase ${isDark ? "bg-[#332E28] text-[#E8D1AB]" : "bg-zinc-200 text-black"}`}>
                              {getInitials(member.name || member.email)}
                            </div>
                            <div className="min-w-0">
                              <p className={`truncate text-sm font-semibold ${isDark ? "text-[#CECECE]" : "text-black"}`}>{member.name || member.email || "Staff Member"}</p>
                              <p className={`truncate text-xs ${isDark ? "text-[#737373]" : "text-black/45"}`}>{formatRoleLabel(member.role || "Staff")}</p>
                              {member.email ? (
                                <p className={`truncate text-xs mt-0.5 ${isDark ? "text-[#E8D1AB]" : "text-black/35"}`}>{member.email}</p>
                              ) : null}
                            </div>
                          </div>

                          {/* Custom visual checkbox mapping box indicator structure */}
                          <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${selected
                              ? "bg-[#E8D1AB] border-[#E8D1AB] text-black"
                              : isDark ? "border-white/20 bg-transparent" : "border-black/20 bg-transparent"
                            }`}>
                            {selected && (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex w-full gap-3 p-4 lg:p-7 lg:pt-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Revert temporary staging vectors to last confirmed values to cancel clean
                    setSelectedStaffIds([...confirmedStaffIds]);
                    setSelectedExtraCpIds([...confirmedExtraCpIds]);
                    setShowAdditionalMembersView(false);
                  }}
                  className={`flex-1 border ${isDark ? "border-[#262626] bg-[#1F1F1F] text-white hover:bg-[#1c1c1c]" : "border-[#f0f0f0] bg-[#f0f0f0] text-zinc-700 hover:bg-zinc-100"}`}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleCommitParticipants}
                  className="flex-1 bg-[#E8D1AB] text-black hover:bg-[#d9c5a0]"
                >
                  Add Participants
                </Button>
              </div>
            </>
        }
      </div>
    </div>
  );
}
