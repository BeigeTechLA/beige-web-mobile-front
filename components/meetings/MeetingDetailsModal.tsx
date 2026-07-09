"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/Datepicker";
import { TimePicker } from "@/components/ui/Timepicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SearchAutocomplete from "@/components/chat/SearchAutocomplete";
import {
  meetingsApi,
  type MeetingItem,
  type MeetingParticipantRef,
} from "@/lib/meetingsApi";
import { externalChatApi, type ExternalChatUser } from "@/lib/externalChatApi";
import { cn } from "@/lib/utils";
import { getEffectiveMeetingStatus, getMinimumMeetingEndTime, getMinimumSelectableMeetingTime } from "@/lib/meetingStatus";

type RoleVariant = "admin" | "sales" | "client" | "cp" | "pm";
type AddRole = "cp" | "manager";
type MeetingType = "pre_production" | "post_production";

interface ProjectOption {
  id: string;
  label: string;
  description?: string;
}

interface ProjectSource {
  stream_project_booking_id?: string | number;
  booking_id?: string | number;
  project_id?: string | number;
  id?: string | number;
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
  };
}

interface MeetingDetailsModalProps {
  open: boolean;
  onClose: () => void;
  meeting: MeetingItem | null;
  role: RoleVariant;
  currentUserId?: string | number;
  currentUserEmail?: string;
  onUpdated?: () => void;
  isDark?: boolean;
}

const resolveId = (value: unknown) => {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    const source = value as { _id?: string | number; id?: string | number; user_id?: string | number };
    return String(source._id || source.id || source.user_id || "");
  }
  return "";
};

const combineDateAndTime = (date: Date | null, time: Date | null) => {
  if (!date || !time) return "";
  const combined = new Date(date);
  combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
  if (Number.isNaN(combined.getTime())) return "";
  return combined.toISOString();
};

const getProjectId = (project: ProjectSource | null | undefined) =>
  String(project?.stream_project_booking_id || project?.booking_id || project?.project_id || project?.id || "");

const getProjectName = (project: ProjectSource | null | undefined) => {
  const bookingId = getProjectId(project);
  const eventType = Array.isArray(project?.event_type)
    ? project.event_type[0]
    : String(project?.event_type || "").split(",").map((value) => value.trim()).find(Boolean);
  const candidates = [
    project?.project_name,
    project?.title,
    project?.description,
    eventType ? `${String(eventType).replace(/[_-]+/g, " ")} Shoot` : "",
    bookingId ? `Shoot #${bookingId}` : "",
  ];

  return candidates.map((value) => String(value || "").trim()).find(Boolean) || `Shoot #${bookingId || "New"}`;
};

const getProjectOptionLabel = (project: ProjectSource | null | undefined) => {
  const bookingId = getProjectId(project);
  const name = getProjectName(project);
  return bookingId ? `${name} (Booking #${bookingId})` : name;
};

const getMeetingTitleFromProjectLabel = (label?: string | null) => {
  const projectName = String(label || "")
    .replace(/\s*\(Booking\s*#.*?\)\s*$/i, "")
    .trim();

  return projectName ? `${projectName} Catch-up` : "";
};

const getProjectDescription = (project: ProjectSource | null | undefined) =>
  String(
    project?.client_name ||
    project?.guest_name ||
    project?.client?.client_name ||
    project?.client?.name ||
    project?.client?.full_name ||
    project?.client_email ||
    project?.guest_email ||
    project?.client?.email ||
    (getProjectId(project) ? `Booking #${getProjectId(project)}` : "Project")
  );

const normalizeParticipant = (
  member?: MeetingParticipantRef | null,
  fallbackRole?: string
) => {
  if (!member) return null;
  const id = resolveId(member.id);
  const name = String(member.name || "").trim();
  const email = String(member.email || "").trim();

  return {
    id,
    name: name || email || "Participant",
    email,
    role: String(member.role || fallbackRole || "").trim().toLowerCase() || "participant",
    profile_picture: member.profile_picture || null,
  };
};

const normalizeEmail = (value?: string | null) => String(value || "").trim().toLowerCase();

const formatInvitationResponse = (response: string) => {
  if (response === "declined") return "Rejected";
  if (response === "accepted") return "Accepted";
  return "Pending";
};

const getParticipantResponse = (
  meeting: MeetingItem | null,
  target: { id?: string | number; email?: string | null }
) => {
  if (!meeting) return "pending";

  const targetId = String(target?.id || "").trim();
  const targetEmail = normalizeEmail(target?.email || "");
  if (!targetId && !targetEmail) return "pending";

  const response = (meeting.participant_responses || []).find((item) => {
    const raw = item.user_id;
    const responseUserId =
      typeof raw === "object"
        ? String(raw?._id || raw?.id || "").trim()
        : String(raw || "").trim();
    const responseEmail = normalizeEmail(item.user_email || "");
    const participantIds = (item.participant_ids || []).map((value) => String(value || "").trim()).filter(Boolean);

    if (targetId && (responseUserId === targetId || participantIds.includes(targetId))) return true;
    if (targetEmail && responseEmail === targetEmail) return true;
    return false;
  });

  return response?.response || "pending";
};

const getAllParticipants = (meeting: MeetingItem | null) => {
  if (!meeting) return [];

  const participants = (meeting.participants || [])
    .map((item) => normalizeParticipant(item, "participant"))
    .filter(Boolean) as Array<ReturnType<typeof normalizeParticipant>>;

  return participants.filter((entry, index, array) => {
    const key = String(entry?.id || entry?.email || entry?.name || "");
    return key && array.findIndex((item) => String(item?.id || item?.email || item?.name || "") === key) === index;
  });
};

export default function MeetingDetailsModal({
  open,
  onClose,
  meeting,
  role,
  onUpdated,
  isDark = true
}: MeetingDetailsModalProps) {
  const [meetingData, setMeetingData] = useState<MeetingItem | null>(meeting);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directoryUsers, setDirectoryUsers] = useState<ExternalChatUser[]>([]);
  const [search, setSearch] = useState("");
  const [addRole, setAddRole] = useState<AddRole>("cp");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [editMeetingTitle, setEditMeetingTitle] = useState("");
  const [editMeetingType, setEditMeetingType] = useState<MeetingType>("post_production");
  const [editDescription, setEditDescription] = useState("");
  const [editMeetLink, setEditMeetLink] = useState("");
  const [editMeetingDate, setEditMeetingDate] = useState<Date | null>(null);
  const [editMeetingStartTime, setEditMeetingStartTime] = useState<Date | null>(null);
  const [editMeetingEndTime, setEditMeetingEndTime] = useState<Date | null>(null);
  const [showAddParticipants, setShowAddParticipants] = useState(false);

  const effectiveStatus = getEffectiveMeetingStatus(meetingData);
  const isCompleted = effectiveStatus === "completed";
  const isCancelled = String(effectiveStatus || "").toLowerCase() === "cancelled";
  const isAdmin = role === "admin";
  const canManageParticipants = isAdmin;
  const meetingStartMs = meetingData?.meeting_date_time ? new Date(meetingData.meeting_date_time).getTime() : NaN;
  const meetingStartValid = Number.isFinite(meetingStartMs);
  const editCutoffMs = meetingStartValid ? meetingStartMs - 60 * 60 * 1000 : NaN;
  const canAdminEditOrReschedule =
    !!meetingData?.id &&
    isAdmin &&
    !isCompleted &&
    !isCancelled &&
    meetingStartValid &&
    Date.now() < editCutoffMs;
  const minimumEditStartTime = getMinimumSelectableMeetingTime(1);

  const participants = useMemo(() => getAllParticipants(meetingData), [meetingData]);

  const availableUsers = useMemo(() => {
    const existingIds = new Set(participants.map((participant) => participant?.id).filter(Boolean));
    return directoryUsers.filter((user) => {
      const id = String(user.id || "");
      const matchesSearch =
        !search ||
        String(user.name || "").toLowerCase().includes(search.toLowerCase()) ||
        String(user.email || "").toLowerCase().includes(search.toLowerCase());

      return id && !existingIds.has(id) && matchesSearch;
    });
  }, [directoryUsers, participants, search]);

  useEffect(() => {
    setMeetingData(meeting);
  }, [meeting]);

  useEffect(() => {
    const start = meetingData?.meeting_date_time ? new Date(meetingData.meeting_date_time) : null;
    const end = meetingData?.meeting_end_time ? new Date(meetingData.meeting_end_time) : null;
    setSelectedOrderId(String(meetingData?.order?.id || ""));
    setEditMeetingTitle(String(meetingData?.meeting_title || ""));
    setEditMeetingType((meetingData?.meeting_type as MeetingType) || "post_production");
    setEditDescription(String(meetingData?.description || ""));
    setEditMeetLink(String(meetingData?.meetLink || ""));
    setEditMeetingDate(start && !Number.isNaN(start.getTime()) ? start : null);
    setEditMeetingStartTime(start && !Number.isNaN(start.getTime()) ? start : null);
    setEditMeetingEndTime(end && !Number.isNaN(end.getTime()) ? end : null);
  }, [meetingData]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const loadProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const projectsResponse = await adminApi.getProjects({ summary_only: true });
        if (cancelled) return;

        const rawProjectResults =
          projectsResponse?.data?.projects ||
          projectsResponse?.data?.results ||
          projectsResponse?.projects ||
          projectsResponse?.results ||
          [];

        const normalizedProjects = Array.from(
          new Map(
            (Array.isArray(rawProjectResults) ? rawProjectResults : [])
              .map((item) => ((item as { project?: ProjectSource } | ProjectSource)?.project || item) as ProjectSource)
              .filter((item) => getProjectId(item))
              .map((item) => [
                getProjectId(item),
                {
                  id: getProjectId(item),
                  label: getProjectOptionLabel(item),
                  description: getProjectDescription(item),
                },
              ] as const)
          ).values()
        );
        const currentOrderId = String(meetingData?.order?.id || "");
        if (currentOrderId && !normalizedProjects.some((project) => project.id === currentOrderId)) {
          normalizedProjects.unshift({
            id: currentOrderId,
            label: meetingData?.order?.name || `Booking #${currentOrderId}`,
            description: `Booking #${currentOrderId}`,
          });
        }

        setProjects(normalizedProjects);
      } catch (error) {
        if (!cancelled) {
          setProjects([]);
          toast.error(error instanceof Error ? error.message : "Failed to load projects");
        }
      } finally {
        if (!cancelled) setIsLoadingProjects(false);
      }
    };

    loadProjects();
    return () => {
      cancelled = true;
    };
  }, [open, meetingData?.order?.id, meetingData?.order?.name]);

  useEffect(() => {
    if (!editMeetingStartTime) return;
    const minimumEndTime = getMinimumMeetingEndTime(editMeetingStartTime, 1);
    if (!minimumEndTime) return;
    if (!editMeetingEndTime || editMeetingEndTime.getTime() < minimumEndTime.getTime()) {
      setEditMeetingEndTime(minimumEndTime);
    }
  }, [editMeetingStartTime, editMeetingEndTime]);

  const refreshMeeting = useCallback(async () => {
    if (!meeting?.id) return;
    const latest = await meetingsApi.getById(meeting.id);
    if (latest) {
      setMeetingData(latest);
    }
  }, [meeting?.id]);

  useEffect(() => {
    if (!open || !meeting?.id) return;
    refreshMeeting().catch(() => null);
  }, [open, meeting?.id, refreshMeeting]);

  useEffect(() => {
    if (!open || !canManageParticipants) return;

    let cancelled = false;

    const loadDirectory = async () => {
      setDirectoryLoading(true);
      try {
        const directory = await externalChatApi.getDirectory(search || undefined);
        if (cancelled) return;

        const source =
          addRole === "cp"
            ? directory.creativePartners || []
            : directory.staff || [];

        setDirectoryUsers(source);
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Failed to load users");
        }
      } finally {
        if (!cancelled) {
          setDirectoryLoading(false);
        }
      }
    };

    loadDirectory();
    return () => {
      cancelled = true;
    };
  }, [open, canManageParticipants, addRole, search]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedUsers([]);
      setAddRole("cp");
      setShowAddParticipants(false);
    }
  }, [open]);

  if (!open || !meetingData) return null;
  const isEditDateToday =
    !!editMeetingDate && new Date(editMeetingDate).toDateString() === new Date().toDateString();

  const handleAddParticipants = async () => {
    if (!meetingData.id || selectedUsers.length === 0) {
      toast.error("Select at least one participant");
      return;
    }

    setSubmitting(true);
    try {
      await meetingsApi.addParticipants(meetingData.id, {
        role: addRole,
        user_ids: selectedUsers,
      });
      toast.success("Participants added");
      setSelectedUsers([]);
      await refreshMeeting();
      await onUpdated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add participants");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveParticipant = async (userId: string, participantRole: string) => {
    if (!meetingData.id || !userId) return;

    const roleMap: Record<string, "cp" | "admin" | "participant" | "client"> = {
      cp: "cp",
      admin: "admin",
      manager: "participant",
      participant: "participant",
      client: "client",
    };

    setSubmitting(true);
    try {
      await meetingsApi.removeParticipant(meetingData.id, userId, roleMap[participantRole] || "participant");
      toast.success("Participant removed");
      await refreshMeeting();
      await onUpdated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove participant");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespond = async (response: "accepted" | "declined") => {
    if (!meetingData.id) return;

    setSubmitting(true);
    try {
      await meetingsApi.respondToInvitation(meetingData.id, { response });
      toast.success(`Invitation ${response}`);
      await refreshMeeting();
      await onUpdated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update response");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminSaveMeeting = async () => {
    if (!meetingData.id) return;
    const startIso = combineDateAndTime(editMeetingDate, editMeetingStartTime);
    const endIso = combineDateAndTime(editMeetingDate, editMeetingEndTime);

    if (!startIso || !endIso) {
      toast.error("Please select valid start and end date/time.");
      return;
    }

    if (new Date(endIso).getTime() < new Date(startIso).getTime() + 60 * 60 * 1000) {
      toast.error("Meeting end time must be at least 1 hour after the start time.");
      return;
    }

    setSubmitting(true);
    try {
      await meetingsApi.updateMeeting(meetingData.id, {
        order_id: selectedOrderId || meetingData.order?.id || undefined,
        meeting_title: editMeetingTitle.trim() || meetingData.meeting_title || "Meeting",
        meeting_type: editMeetingType,
        description: editDescription.trim() || undefined,
        meeting_date_time: startIso,
        meeting_end_time: endIso,
        meeting_status: "rescheduled",
      });
      toast.success("Meeting updated successfully");
      await refreshMeeting();
      await onUpdated?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update meeting");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminCancelMeeting = async () => {
    if (!meetingData.id) return;
    const confirmed = window.confirm("Are you sure you want to cancel this meeting?");
    if (!confirmed) return;

    setSubmitting(true);
    try {
      await meetingsApi.updateMeeting(meetingData.id, {
        meeting_status: "cancelled",
      });
      toast.success("Meeting cancelled successfully");
      await refreshMeeting();
      await onUpdated?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel meeting");
    } finally {
      setSubmitting(false);
    }
  };

  const figmaFieldClass = "rounded-[10px] border border-[#3A3A3A] bg-black text-white";
  const figmaLegendClass = "px-2 text-sm text-white/55";
  const figmaInputClass = "h-[62px] border-0 bg-transparent px-1 text-base text-white placeholder:text-white/25 focus-visible:ring-0 focus-visible:ring-offset-0";
  const figmaPickerColors = {
    inputBackground: "#000000",
    inputText: "#FFFFFF",
    inputBorder: "#3A3A3A",
    inputBorderHover: "#5A5A5A",
    inputBorderFocus: "#E8D1AB",
    labelText: "rgba(255,255,255,0.55)",
    iconColor: "#FFFFFF",
  };
  const getInitials = (value?: string | null) => {
    const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "M";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto px-3 py-5">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 mx-auto flex max-h-[calc(100vh-2.5rem)] w-full max-w-[760px] flex-col overflow-hidden rounded-lg border border-[#2E2E2E] bg-black text-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#3A3A3A] px-7 py-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-white">Edit & Reschedule</h2>
            <p className="mt-1 text-sm text-white/55">
              You can edit title, type, description, and schedule until 1 hour before start time
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#282323] text-white transition-colors hover:bg-[#332d2d]"
          >
            <X size={22} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-7 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <div className="grid gap-x-4 gap-y-6 md:grid-cols-2">
            <fieldset className={`md:col-span-2 px-3 pb-3 ${figmaFieldClass}`}>
              <legend className={figmaLegendClass}>Project / Shoots*</legend>
              <SearchAutocomplete
                placeholder={isLoadingProjects ? "Loading projects..." : "Search by project name or booking ID"}
                options={projects.map((project) => ({
                  id: project.id,
                  label: project.label,
                  description: project.description,
                }))}
                value={selectedOrderId}
                onChange={(value) => {
                  setSelectedOrderId(value);
                  const selectedProject = projects.find((project) => project.id === value);
                  const nextTitle = getMeetingTitleFromProjectLabel(selectedProject?.label);
                  if (nextTitle) {
                    setEditMeetingTitle(nextTitle);
                  }
                }}
                emptyMessage="No project matches your search"
                isDark={isDark}
                triggerClassName="h-[58px] rounded-none border-0 bg-transparent px-1 text-base shadow-none hover:bg-transparent"
              />
            </fieldset>

            <fieldset className={`md:col-span-2 px-3 pb-3 ${figmaFieldClass}`}>
              <legend className={figmaLegendClass}>Meeting Title*</legend>
              <Input
                value={editMeetingTitle}
                onChange={(event) => setEditMeetingTitle(event.target.value)}
                disabled={submitting}
                className="h-[62px] border-0 bg-transparent px-1 text-base text-white placeholder:text-white/25 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </fieldset>

            <fieldset className={`px-3 pb-3 ${figmaFieldClass}`}>
              <legend className={figmaLegendClass}>Meeting Type*</legend>
              <Select
                value={editMeetingType}
                onValueChange={(value) => setEditMeetingType(value as MeetingType)}
                disabled={submitting}
              >
                <SelectTrigger className="h-[58px] border-0 bg-transparent px-1 text-base text-white focus:ring-0 focus:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-white/10 bg-[#111111] text-white">
                  <SelectItem value="pre_production" className="focus:bg-[#1B1B1B] focus:text-white">Pre Production</SelectItem>
                  <SelectItem value="post_production" className="focus:bg-[#1B1B1B] focus:text-white">Post Production</SelectItem>
                </SelectContent>
              </Select>
            </fieldset>

            <div className="pt-[10px]">
              <DatePicker
                label="Meeting Date*"
                value={editMeetingDate}
                onChange={setEditMeetingDate}
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
                value={editMeetingStartTime}
                onChange={setEditMeetingStartTime}
                minTime={isEditDateToday ? minimumEditStartTime : null}
                colors={figmaPickerColors}
                floating
                isDark={isDark}
              />
            </div>

            <div className="pt-[10px]">
              <TimePicker
                label="End Time*"
                value={editMeetingEndTime}
                onChange={setEditMeetingEndTime}
                minTime={getMinimumMeetingEndTime(editMeetingStartTime) || (isEditDateToday ? minimumEditStartTime : null)}
                colors={figmaPickerColors}
                floating
                isDark={isDark}
              />
            </div>

            <fieldset className={`md:col-span-2 px-3 pb-3 ${figmaFieldClass}`}>
              <legend className={figmaLegendClass}>Description</legend>
              <Textarea
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                rows={4}
                disabled={submitting}
                className="min-h-[132px] resize-none border-0 bg-transparent px-1 text-base text-white placeholder:text-white/25 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </fieldset>
          </div>

          <div className="mt-7 border-t border-[#3A3A3A] pt-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-white">Participants ({participants.length})</h3>
              {canManageParticipants ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedUsers([]);
                    setShowAddParticipants(true);
                  }}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#E5D5B8]"
                >
                  <Plus size={18} />
                  <span className="border-b border-[#E5D5B8] leading-5">Add Participants</span>
                </button>
              ) : null}
            </div>

            <div className="space-y-2">
              {participants.map((participant) => {
                const response = getParticipantResponse(meetingData, {
                  id: participant?.id || "",
                  email: participant?.email || "",
                });
                const removable = canManageParticipants;
                const statusLabel = formatInvitationResponse(response);
                const statusClass =
                  response === "accepted"
                    ? "bg-[#C9F7D8] text-[#0C9A44]"
                    : response === "declined"
                      ? "bg-[#FFC3C3] text-[#BD1010]"
                      : "bg-[#FFF1C7] text-[#C66A00]";

                return (
                  <div
                    key={String(participant?.id || participant?.email || participant?.name)}
                    className="flex items-center gap-3 rounded-[8px] border border-[#2F2F2F] bg-black px-4 py-3"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2E2820] text-sm font-semibold text-[#E5D5B8]">
                      {getInitials(participant?.name || participant?.email)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-white">{participant?.name}</p>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-[#E5D5B8]/70">
                        {String(participant?.role || "participant").replace(/_/g, " ")} - {participant?.email || ""}
                      </p>
                    </div>
                    {removable ? (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() =>
                          handleRemoveParticipant(
                            String(participant?.id || ""),
                            String(participant?.role || "participant")
                          )
                        }
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-[#171717] text-[#FF3B3B] hover:bg-[#211111]"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>

          </div>

          <div className="mt-7 border-t border-[#3A3A3A] pt-6">
            <h3 className="mb-4 text-base font-medium text-white">Link & Notifications</h3>
            <fieldset className={`px-3 pb-3 ${figmaFieldClass}`}>
              <legend className={figmaLegendClass}>Google Meet Link*</legend>
              <div className="flex items-center gap-4">
                <Input
                  value={editMeetLink}
                  readOnly
                  disabled
                  className="h-[62px] flex-1 border-0 bg-transparent px-1 text-base text-white/50 placeholder:text-white/25 disabled:opacity-100 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                {meetingData.meetLink ? (
                  <a
                    href={meetingData.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#E8D1AB] text-black hover:bg-[#d9c5a0]"
                  >
                    <ExternalLink size={18} />
                  </a>
                ) : null}
              </div>
            </fieldset>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <Button
              type="button"
              onClick={handleAdminCancelMeeting}
              disabled={submitting}
              className="h-12 rounded-md bg-[#F74343] font-semibold text-white hover:bg-[#dd3333]"
            >
              Cancel Meeting
            </Button>
            <Button
              type="button"
              onClick={handleAdminSaveMeeting}
              disabled={submitting}
              className="h-12 rounded-md bg-[#E8D1AB] font-semibold text-black hover:bg-[#d9c5a0]"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {showAddParticipants && canManageParticipants ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-4">
          <div className="flex max-h-[calc(100vh-3rem)] w-full max-w-[620px] flex-col overflow-hidden rounded-lg border border-[#2A2A2A] bg-black shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <h3 className="text-xl font-semibold text-white">Invite more staff or creative partners</h3>
              <button
                type="button"
                onClick={() => setShowAddParticipants(false)}
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
                    setAddRole("manager");
                    setSearch("");
                    setSelectedUsers([]);
                  }}
                  className={cn(
                    "rounded px-4 py-2 text-sm transition-colors",
                    addRole === "manager" ? "bg-[#E5D5B8] text-black" : "text-white/55"
                  )}
                >
                  Staff
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddRole("cp");
                    setSearch("");
                    setSelectedUsers([]);
                  }}
                  className={cn(
                    "rounded px-4 py-2 text-sm transition-colors",
                    addRole === "cp" ? "bg-[#E5D5B8] text-black" : "text-white/55"
                  )}
                >
                  Creative Partners
                </button>
              </div>

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={addRole === "manager" ? "Search Staff Members..." : "Search Creative Partners..."}
                className="h-11 rounded-md border-[#2C2C2C] bg-[#171717] text-white placeholder:text-white/30"
              />

              <p className="text-sm font-semibold text-white">
                {addRole === "manager" ? "Staff Members" : "Creative Partners"} ({selectedUsers.length} Selected)
              </p>

              <div className="h-[410px] space-y-2 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                {directoryLoading ? (
                  <div className="flex h-full items-center justify-center gap-2 rounded-md bg-[#171717] px-4 py-5 text-sm text-white/45">
                    <Loader2 size={14} className="animate-spin" />
                    Loading users...
                  </div>
                ) : availableUsers.length === 0 ? (
                  <p className="flex h-full items-center justify-center rounded-md bg-[#171717] px-4 py-5 text-sm text-white/45">No available users found.</p>
                ) : (
                  availableUsers.map((user) => {
                    const userId = String(user.id || "");
                    const selected = selectedUsers.includes(userId);

                    return (
                      <button
                        key={userId}
                        type="button"
                        onClick={() =>
                          setSelectedUsers((current) =>
                            selected ? current.filter((value) => value !== userId) : [...current, userId]
                          )
                        }
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left transition-colors",
                          selected ? "border-[#E5D5B8]/45 bg-[#1D1B18]" : "border-transparent bg-[#171717] hover:bg-[#1f1f1f]"
                        )}
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2E2820] text-sm font-semibold text-[#E5D5B8]">
                          {getInitials(user.name || user.email)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-white">{user.name || user.email || "User"}</span>
                          <span className="block truncate text-xs text-white/50">{user.role || (addRole === "manager" ? "Admin" : "Creative Partner")}</span>
                          {user.email ? <span className="block truncate text-xs text-[#E5D5B8]/80">{user.email}</span> : null}
                        </span>
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded border",
                            selected ? "border-[#E5D5B8] bg-[#E5D5B8] text-black" : "border-white/20 text-transparent"
                          )}
                        >
                          <Check size={14} />
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
                onClick={() => setShowAddParticipants(false)}
                className="h-11 border-white/10 bg-[#1f1f1f] text-white hover:bg-[#282828]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  const hadSelection = selectedUsers.length > 0;
                  await handleAddParticipants();
                  if (hadSelection) setShowAddParticipants(false);
                }}
                disabled={submitting || selectedUsers.length === 0}
                className="h-11 bg-[#E5D5B8] text-black hover:bg-[#d9c5a0]"
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
                Add Selected Participants
              </Button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
