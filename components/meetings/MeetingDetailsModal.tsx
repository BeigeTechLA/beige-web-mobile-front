"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker, datePickerColours } from "@/components/ui/Datepicker";
import { TimePicker } from "@/components/ui/Timepicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DeleteMeetingConfirmModal from "@/components/meetings/DeleteMeetingConfirmModal";
import {
  meetingsApi,
  type MeetingItem,
  type MeetingParticipantRef,
} from "@/lib/meetingsApi";
import { externalChatApi, type ExternalChatUser } from "@/lib/externalChatApi";
import { cn } from "@/lib/utils";
import { formatMeetingStatusLabel, getEffectiveMeetingStatus } from "@/lib/meetingStatus";

type RoleVariant = "admin" | "sales" | "client" | "cp" | "pm";
type AddRole = "cp" | "manager";
type MeetingType = "pre_production" | "post_production";

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

const formatDate = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

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

  const participants = [
    normalizeParticipant(meeting.client || undefined, "client"),
    normalizeParticipant(meeting.admin || undefined, "admin"),
    ...(meeting.cps || []).map((item) => normalizeParticipant(item, "cp")),
    ...(meeting.participants || []).map((item) => normalizeParticipant(item, "participant")),
  ].filter(Boolean) as Array<ReturnType<typeof normalizeParticipant>>;

  return participants.filter((entry, index, array) => {
    const key = String(entry?.id || entry?.email || entry?.name || "");
    return key && array.findIndex((item) => String(item?.id || item?.email || item?.name || "") === key) === index;
  });
};

const STATUS_CLASS: Record<string, string> = {
  accepted: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
  declined: "border-rose-400/20 bg-rose-500/10 text-rose-300",
  pending: "border-amber-400/20 bg-amber-500/10 text-amber-300",
};

export default function MeetingDetailsModal({
  open,
  onClose,
  meeting,
  role,
  currentUserId,
  currentUserEmail,
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
  const [refreshing, setRefreshing] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editMeetingTitle, setEditMeetingTitle] = useState("");
  const [editMeetingType, setEditMeetingType] = useState<MeetingType>("post_production");
  const [editDescription, setEditDescription] = useState("");
  const [editMeetLink, setEditMeetLink] = useState("");
  const [editMeetingDate, setEditMeetingDate] = useState<Date | null>(null);
  const [editMeetingStartTime, setEditMeetingStartTime] = useState<Date | null>(null);
  const [editMeetingEndTime, setEditMeetingEndTime] = useState<Date | null>(null);

  const effectiveStatus = getEffectiveMeetingStatus(meetingData);
  const isCompleted = effectiveStatus === "completed";
  const isCancelled = String(effectiveStatus || "").toLowerCase() === "cancelled";
  const canManageParticipants = role === "admin";
  const createdById = resolveId(meetingData?.created_by?.id);
  const isClientCreatedBySelf =
    role === "client" &&
    !!currentUserId &&
    !!createdById &&
    String(createdById) === String(currentUserId);
  const canDeleteMeeting = (role === "admin" || role === "client") && !!meetingData?.id && !isClientCreatedBySelf;
  const canRespond =
    !!meetingData?.id &&
    !!currentUserId &&
    role !== "admin" &&
    !isClientCreatedBySelf &&
    !["completed", "cancelled"].includes(String(effectiveStatus || "").toLowerCase());
  const currentResponse = getParticipantResponse(meetingData, {
    id: currentUserId,
    email: currentUserEmail || "",
  });
  const meetingStartMs = meetingData?.meeting_date_time ? new Date(meetingData.meeting_date_time).getTime() : NaN;
  const meetingStartValid = Number.isFinite(meetingStartMs);
  const editCutoffMs = meetingStartValid ? meetingStartMs - 60 * 60 * 1000 : NaN;
  const canAdminEditOrReschedule =
    role === "admin" &&
    !!meetingData?.id &&
    !isCompleted &&
    !isCancelled &&
    meetingStartValid &&
    Date.now() < editCutoffMs;
  const isPastEditCutoff = role === "admin" && meetingStartValid && Date.now() >= editCutoffMs;

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
    setEditMeetingTitle(String(meetingData?.meeting_title || ""));
    setEditMeetingType((meetingData?.meeting_type as MeetingType) || "post_production");
    setEditDescription(String(meetingData?.description || ""));
    setEditMeetLink(String(meetingData?.meetLink || ""));
    setEditMeetingDate(start && !Number.isNaN(start.getTime()) ? start : null);
    setEditMeetingStartTime(start && !Number.isNaN(start.getTime()) ? start : null);
    setEditMeetingEndTime(end && !Number.isNaN(end.getTime()) ? end : null);
  }, [meetingData]);

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
    }
  }, [open]);

  if (!open || !meetingData) return null;
  const isEditDateToday =
    !!editMeetingDate && new Date(editMeetingDate).toDateString() === new Date().toDateString();

  const handleRefresh = async () => {
    if (!meetingData.id) return;
    setRefreshing(true);
    try {
      await refreshMeeting();
      await onUpdated?.();
    } finally {
      setRefreshing(false);
    }
  };

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

  const handleDeleteMeeting = async () => {
    if (!meetingData.id) return;

    setSubmitting(true);
    try {
      await meetingsApi.deleteMeeting(meetingData.id);
      toast.success("Meeting deleted");
      onClose();
      await onUpdated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete meeting");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminSaveMeeting = async () => {
    if (!meetingData.id || !canAdminEditOrReschedule) return;
    const startIso = combineDateAndTime(editMeetingDate, editMeetingStartTime);
    const endIso = combineDateAndTime(editMeetingDate, editMeetingEndTime);

    if (!startIso || !endIso) {
      toast.error("Please select valid start and end date/time.");
      return;
    }

    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      toast.error("Meeting end time must be after the start time.");
      return;
    }

    setSubmitting(true);
    try {
      await meetingsApi.updateMeeting(meetingData.id, {
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
    if (!meetingData.id || !canAdminEditOrReschedule) return;
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

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 md:p-4">
      {/* Background Overlay */}
      <div className={`absolute inset-0 backdrop-blur-sm ${isDark ? "bg-black/75" : "bg-black/30"}`} onClick={onClose} />

      {/* Modal Container */}
      <div className={`relative z-10 flex h-full max-h-[92vh] lg:max-h-[88vh] w-full max-w-[860px] flex-col overflow-hidden rounded-xl lg:rounded-3xl border shadow-lg lg:shadow-2xl transition-all ${isDark ? "bg-[#090909] text-white border-white/10" : "bg-[#FBFBFB] text-black border-[#e3e3e3]"}`}>

        {/* Header */}
        <div className={`flex items-start lg:items-center justify-between border-b px-4 py-4 lg:px-6 lg:py-5 ${isDark ? "border-white/10" : "border-[#e3e3e3]"}`}>
          <div className="min-w-0 pr-2">
            <h2 className={`whitespace-break-spaces text-lg lg:text-2xl font-semibold tracking-tight ${isDark ? "text-white" : "text-black"}`}>
              {meetingData.meeting_title || meetingData.order?.name || "Meeting Details"}
            </h2>
            <p className={`mt-0.5 lg:mt-1 whitespace-break-spaces text-xs lg:text-sm ${isDark ? "text-white/45" : "text-[#171717B2]"}`}>
              Review the meeting schedule, participants, and actions.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`flex h-9 w-9 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${isDark ? "border-white/10 bg-[#141414] text-white/80 hover:bg-[#1b1b1b] hover:text-white" : "border-[#e3e3e3] bg-[#F0F0F0] text-[#323232] hover:bg-[#E8E8E8]"}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Responsive Grid Split-Panel Body */}
        <div className="flex flex-col lg:grid lg:grid-cols-[1.3fr_0.7fr] min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
          {/* LEFT COLUMN: Details & Admin Controls */}
          <div className={`p-4 lg:px-6 lg:py-5 lg:overflow-y-auto border-b lg:border-b-0 lg:border-r [&::-webkit-scrollbar]:hidden [scrollbar-width:none] ${isDark ? "border-white/10" : "border-[#e3e3e3]"}`}>
            <div className="space-y-4">

              {/* Metadata Display Card */}
              <div className={`rounded-xl lg:rounded-2xl border p-3 lg:p-4 shadow-sm space-y-3 lg:space-y-4 ${isDark ? "border-white/10 bg-black" : "border-[#e3e3e3] bg-white"}`}>
                <div>
                  <p className={`text-[10px] lg:text-xs uppercase tracking-[0.18em] ${isDark ? "text-white/35" : "text-[#766A6A]"}`}>Shoot</p>
                  <p className={`mt-1 text-xs lg:text-sm font-medium ${isDark ? "text-white" : "text-[#737373]"}`}>{meetingData.order?.name || "N/A"}</p>
                </div>
                <div className="grid gap-3 lg:gap-4 lg:grid-cols-2">
                  <div>
                    <p className={`text-[10px] lg:text-xs uppercase tracking-[0.18em] ${isDark ? "text-white/35" : "text-[#766A6A]"}`}>Status</p>
                    <p className={`mt-1 text-xs lg:text-sm font-medium capitalize ${isDark ? "text-white" : "text-[#737373]"}`}>
                      {formatMeetingStatusLabel(effectiveStatus)}
                    </p>
                  </div>
                  <div>
                    <p className={`text-[10px] lg:text-xs uppercase tracking-[0.18em] ${isDark ? "text-white/35" : "text-[#766A6A]"}`}>Date</p>
                    <p className={`mt-1 text-xs lg:text-sm font-medium ${isDark ? "text-white" : "text-[#737373]"}`}>{formatDate(meetingData.meeting_date_time)}</p>
                  </div>
                  <div>
                    <p className={`text-[10px] lg:text-xs uppercase tracking-[0.18em] ${isDark ? "text-white/35" : "text-[#766A6A]"}`}>Time</p>
                    <p className={`mt-1 text-xs lg:text-sm font-medium ${isDark ? "text-white" : "text-[#737373]"}`}>
                      {formatTime(meetingData.meeting_date_time)} to {formatTime(meetingData.meeting_end_time)}
                    </p>
                  </div>
                </div>
                {meetingData.description ? (
                  <div className={`mt-4 border-t pt-4 ${isDark ? "border-white/10" : "border-[#e3e3e3]"}`}>
                    <p className={`text-[10px] lg:text-xs uppercase tracking-[0.18em] ${isDark ? "text-white/35" : "text-[#766A6A]"}`}>Description</p>
                    <p className={`mt-2 text-xs lg:text-sm leading-relaxed lg:leading-6 ${isDark ? "text-white/70" : "text-[#766A6A]"}`}>{meetingData.description}</p>
                  </div>
                ) : null}
              </div>

              {/* Core Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                {meetingData.meetLink ? (
                  <a
                    href={meetingData.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-disabled={isCompleted || isCancelled}
                    onClick={(event) => {
                      if (isCompleted || isCancelled) event.preventDefault();
                    }}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg lg:rounded-xl px-4 py-2 text-xs lg:text-sm font-semibold transition-colors w-full lg:w-auto justify-center",
                      isCompleted || isCancelled
                        ? (isDark ? "cursor-not-allowed border border-white/10 bg-black text-white/30" : "cursor-not-allowed border border-[#e3e3e3] bg-[#F0F0F0] text-[#766A6A]")
                        : "bg-[#E5D5B8] text-black hover:bg-[#d9c5a0]"
                    )}
                  >
                    Join Meeting
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <div className={`rounded-lg lg:rounded-xl border border-dashed px-4 py-2 text-xs lg:text-sm text-center w-full lg:w-auto ${isDark ? "border-white/10 text-white/40" : "border-[#D7D7D7] text-[#171717B2]"}`}>
                    Meeting link not available yet
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`text-xs lg:text-sm h-9 lg:h-10 flex-1 lg:flex-none justify-center gap-1.5 ${isDark ? "border-white/10 bg-[#141414] text-white hover:bg-[#1c1c1c]" : "border-[#D7D7D7] bg-white text-[#323232] hover:bg-[#F4F5F7]"}`}
                >
                  {refreshing ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
                  Refresh
                </Button>

                {canDeleteMeeting ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    disabled={submitting}
                    className="border-[#FFFFFF33] bg-[#FFC3C3] text-[#BD1010] hover:bg-rose-500/20 text-xs lg:text-sm h-9 lg:h-10 flex-1 lg:flex-none justify-center gap-1.5"
                  >
                    <Trash2 size={16} />
                    Delete
                  </Button>
                ) : null}
              </div>

              {/* Admin Configuration Board */}
              {role === "admin" ? (
                <div className={`rounded-xl lg:rounded-[26px] border p-3 lg:p-5 ${isDark ? "border-white/10 bg-[#101010]" : "border-[#e3e3e3] bg-[#F4F5F7]"}`}>
                  <div className="mb-3 lg:mb-5">
                    <p className={`text-xs font-medium uppercase tracking-[0.24em] ${isDark ? "text-white/35" : "text-[#766A6A]"}`}>Meeting Basics</p>
                    <h3 className={`mt-2 text-base lg:text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>Schedule & context</h3>
                    <p className={`mt-1 text-xs lg:text-sm ${isDark ? "text-white/45" : "text-[#171717B2]"}`}>
                      You can edit title, type, description, and schedule until 1 hour before start time.
                    </p>
                    {isPastEditCutoff ? (
                      <p className="mt-2 text-xs font-medium text-[#BA6605]">
                        Editing is locked because this meeting is within 1 hour of its start time.
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-3 lg:gap-4 grid-cols-1 lg:grid-cols-2">
                    <div className="space-y-1 lg:space-y-2">
                      <label className={`text-xs lg:text-sm font-medium ${isDark ? "text-white/70" : "text-[#323232]"}`}>Meeting Title</label>
                      <Input
                        value={editMeetingTitle}
                        onChange={(event) => setEditMeetingTitle(event.target.value)}
                        placeholder="Project catch-up"
                        disabled={!canAdminEditOrReschedule || submitting}
                        className={`h-11 lg:h-12 text-xs lg:text-sm rounded-lg lg:rounded-xl ${isDark ? "border-[#2C2C2C] bg-[#151515] text-white placeholder:text-white/30" : "border-[#D7D7D7] bg-white text-black placeholder:text-[#766A6A]"}`}
                      />
                    </div>

                    <div className="space-y-1 lg:space-y-2">
                      <label className={`text-xs lg:text-sm font-medium ${isDark ? "text-white/70" : "text-[#323232]"}`}>Meeting Type</label>
                      <Select
                        value={editMeetingType}
                        onValueChange={(value) => setEditMeetingType(value as MeetingType)}
                        disabled={!canAdminEditOrReschedule || submitting}
                      >
                        <SelectTrigger className={`h-11 lg:h-12 text-xs lg:text-sm rounded-lg lg:rounded-xl ${isDark ? "border-[#2C2C2C] bg-[#151515] text-white" : "border-[#D7D7D7] bg-white text-black"}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={`rounded-lg lg:rounded-xl ${isDark ? "border-white/10 bg-black text-white" : "border-[#e3e3e3] bg-white text-black"}`}>
                          <SelectItem value="pre_production" className={isDark ? "focus:bg-[#1B1B1B] focus:text-white" : "focus:bg-[#F0F0F0]"}>
                            Pre Production
                          </SelectItem>
                          <SelectItem value="post_production" className={isDark ? "focus:bg-[#1B1B1B] focus:text-white" : "focus:bg-[#F0F0F0]"}>
                            Post Production
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-3 lg:gap-4 grid-cols-1 md:col-span-2 lg:grid-cols-3">
                      <div className="space-y-1 lg:space-y-2">
                        <DatePicker
                          label="Meeting Date"
                          value={editMeetingDate}
                          onChange={setEditMeetingDate}
                          minDate={new Date()}
                          // colors={datePickerColours}
                          isDark={isDark}
                        />
                      </div>
                      <div className="space-y-1 lg:space-y-2">
                        <TimePicker
                          label="Start Time"
                          value={editMeetingStartTime}
                          onChange={setEditMeetingStartTime}
                          minTime={isEditDateToday ? new Date() : null}
                          isDark={isDark}
                        />
                      </div>
                      <div className="space-y-1 lg:space-y-2">
                        <TimePicker
                          label="End Time"
                          value={editMeetingEndTime}
                          onChange={setEditMeetingEndTime}
                          minTime={editMeetingStartTime || (isEditDateToday ? new Date() : null)}
                          isDark={isDark}
                        />
                      </div>
                    </div>

                    <div className="space-y-1 lg:space-y-2 md:col-span-2">
                      <label className={`text-xs lg:text-sm font-medium ${isDark ? "text-white/70" : "text-[#323232]"}`}>Google Meet Link</label>
                      <Input
                        value={editMeetLink}
                        readOnly
                        disabled
                        className={`h-11 lg:h-12 text-xs lg:text-sm rounded-lg lg:rounded-xl ${isDark ? "border-[#2C2C2C] bg-[#121212] text-white/70" : "border-[#e3e3e3] bg-[#F0F0F0] text-[#171717B2]"}`}
                      />
                    </div>

                    <div className="space-y-1 lg:space-y-2 md:col-span-2">
                      <label className={`text-xs lg:text-sm font-medium ${isDark ? "text-white/70" : "text-[#323232]"}`}>Description</label>
                      <Textarea
                        value={editDescription}
                        onChange={(event) => setEditDescription(event.target.value)}
                        rows={4}
                        placeholder="Agenda, discussion points, or notes for the team."
                        disabled={!canAdminEditOrReschedule || submitting}
                        className={`min-h-[100px] text-xs lg:text-sm rounded-xl lg:rounded-2xl ${isDark ? "border-[#2C2C2C] bg-[#151515] text-white placeholder:text-white/30" : "border-[#D7D7D7] bg-white text-black placeholder:text-[#766A6A]"}`}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button
                      type="button"
                      onClick={handleAdminSaveMeeting}
                      disabled={!canAdminEditOrReschedule || submitting}
                      className="bg-[#E5D5B8] text-black hover:bg-[#d9c5a0] text-xs lg:text-sm h-10 flex-1 justify-center"
                    >
                      {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAdminCancelMeeting}
                      disabled={!canAdminEditOrReschedule || submitting}
                      className="border-rose-400/30 bg-[#FFC3C3] text-[#BD1010] hover:bg-rose-500/20 text-xs lg:text-sm h-10 flex-1 justify-center"
                    >
                      Cancel Meeting
                    </Button>
                  </div>
                </div>
              ) : null}

              {/* Invitation Response Panel */}
              {canRespond ? (
                <div className={`rounded-xl lg:rounded-2xl border p-3 lg:p-4 ${isDark ? "border-white/10 bg-black" : "border-[#e3e3e3] bg-white"}`}>
                  <p className={`text-xs lg:text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>Invitation Response</p>
                  <p className={`mt-1 text-xs lg:text-sm ${isDark ? "text-white/45" : "text-[#171717B2]"}`}>
                    Your current response is{" "}
                    <span className="capitalize text-[#E5D5B8]">
                      {formatInvitationResponse(currentResponse)}
                    </span>
                    .
                  </p>
                  <div className="mt-4 flex gap-3">
                    {currentResponse !== "accepted" ? (
                      <Button
                        type="button"
                        onClick={() => handleRespond("accepted")}
                        disabled={submitting}
                        className="bg-emerald-500 text-white hover:bg-emerald-600 text-xs lg:text-sm h-10 flex-1 justify-center"
                      >
                        Accept
                      </Button>
                    ) : null}
                    {currentResponse !== "declined" ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleRespond("declined")}
                        disabled={submitting}
                        className="border-[#FFFFFF33] bg-[#FFC3C3] text-[#BD1010] hover:bg-rose-500/20 text-xs lg:text-sm h-10 flex-1 justify-center"
                      >
                        Reject
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* RIGHT COLUMN: Participant Directory Management */}
          <div className="p-4 lg:px-6 lg:py-5 lg:overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            <div>
              <p className={`text-base lg:text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>Participants</p>
              <p className={`text-xs lg:text-sm ${isDark ? "text-white/45" : "text-[#171717B2]"}`}>{participants.length} invited to this meeting</p>
            </div>

            <div className="mt-2 lg:mt-4 space-y-2 lg:space-y-3">
              {participants.map((participant) => {
                const response = getParticipantResponse(meetingData, {
                  id: participant?.id || "",
                  email: participant?.email || "",
                });
                const statusClass = STATUS_CLASS[response] || STATUS_CLASS.pending;
                const removable = canManageParticipants && !isCompleted && !["client", "admin"].includes(String(participant?.role || ""));
                const isCurrentUserParticipant =
                  !!currentUserId && String(participant?.id || "") === String(currentUserId);

                return (
                  <div
                    key={String(participant?.id || participant?.email || participant?.name)}
                    className={`flex items-center justify-between gap-3 rounded-xl lg:rounded-2xl border p-3 ${isDark ? "border-white/10 bg-black" : "border-[#e3e3e3] bg-white"}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`truncate text-xs lg:text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>{participant?.name}</p>
                        {isCurrentUserParticipant ? (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] border ${isDark ? "border-[#E5D5B8]/25 bg-[#1B1812] text-[#E5D5B8]" : "border-[#E5D5B8]/40 bg-[#FFFDF9] text-[#8A7656]"}`}>
                            You
                          </span>
                        ) : null}
                      </div>
                      {participant?.email ? (
                        <p className={`mt-1 truncate text-xs ${isDark ? "text-white/45" : "text-[#171717B2]"}`}>{participant.email}</p>
                      ) : null}
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className={`text-xs uppercase tracking-[0.14em] ${isDark ? "text-white/35" : "text-[#766A6A]"}`}>
                          {String(participant?.role || "participant").replace(/_/g, " ")}
                        </span>
                        <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium capitalize", statusClass)}>
                          {response}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
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
                          className="rounded-lg lg:rounded-xl border border-[#FFFFFF33] bg-[#FFC3C3] p-2 text-[#BD1010] transition-colors hover:bg-rose-500/20 flex items-center justify-center"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Directory Search Section */}
            {canManageParticipants ? (
              <div className={`mt-3 lg:mt-6 rounded-xl lg:rounded-2xl border p-3 lg:p-4 ${isDark ? "border-white/10 bg-black" : "border-[#e3e3e3] bg-white"}`}>
                <p className={`text-xs lg:text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>Add Participants</p>
                <div className="mt-2 lg:mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAddRole("cp")}
                    className={`rounded-lg lg:rounded-xl border px-3 py-2 text-xs lg:text-sm transition-colors flex-1 text-center ${addRole === "cp" ? (isDark ? "border-[#E5D5B8] bg-[#1B1812] text-white" : "border-[#BCA374] bg-[#E8D1AB]/30 text-black") : (isDark ? "border-white/10 bg-[#0f0f0f] text-white/60" : "border-[#e3e3e3] bg-white text-[#171717B2] hover:bg-[#F4F5F7]")}`}
                  >
                    Creative Partners
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddRole("manager")}
                    className={`rounded-lg lg:rounded-xl border px-3 py-2 text-xs lg:text-sm transition-colors flex-1 text-center ${addRole === "manager" ? (isDark ? "border-[#E5D5B8] bg-[#1B1812] text-white" : "border-[#BCA374] bg-[#E8D1AB]/30 text-black") : (isDark ? "border-white/10 bg-[#0f0f0f] text-white/60" : "border-[#e3e3e3] bg-white text-[#171717B2] hover:bg-[#F4F5F7]")}`}
                  >
                    Staff
                  </button>
                </div>

                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search users..."
                  className={`mt-2 lg:mt-4 h-10 text-xs lg:text-sm rounded-lg lg:rounded-xl ${isDark ? "border-white/10 bg-[#0f0f0f] text-white placeholder:text-white/30" : "border-[#D7D7D7] bg-white text-black placeholder:text-[#766A6A]"}`}
                />

                <div className="mt-2 lg:mt-4 max-h-48 lg:max-h-56 space-y-2 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {directoryLoading ? (
                    <div className={`flex items-center gap-2 text-xs lg:text-sm py-2 ${isDark ? "text-white/45" : "text-[#171717B2]"}`}>
                      <Loader2 size={14} className="animate-spin" />
                      Loading users...
                    </div>
                  ) : availableUsers.length === 0 ? (
                    <p className={`text-xs lg:text-sm py-2 ${isDark ? "text-white/40" : "text-[#766A6A]"}`}>No available users found.</p>
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
                              selected
                                ? current.filter((value) => value !== userId)
                                : [...current, userId]
                            )
                          }
                          className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors ${selected ? (isDark ? "border-[#E5D5B8] bg-[#1B1812]" : "border-[#BCA374] bg-[#FFFDF9]") : (isDark ? "border-white/10 bg-[#0f0f0f] hover:bg-[#151515]" : "border-[#e3e3e3] bg-white hover:bg-[#F4F5F7]")}`}
                        >
                          <div className="min-w-0">
                            <p className={`truncate text-xs lg:text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>{user.name || user.email || "User"}</p>
                            <p className={`truncate text-[11px] ${isDark ? "text-white/40" : "text-[#171717B2]"}`}>{user.email || user.role || ""}</p>
                          </div>
                          <div className="shrink-0">
                            {selected ? <Check size={16} className="text-[#E5D5B8]" /> : <Plus size={14} className="opacity-40" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <Button
                  type="button"
                  onClick={handleAddParticipants}
                  disabled={submitting || selectedUsers.length === 0}
                  className="mt-4 w-full bg-[#E5D5B8] text-black hover:bg-[#d9c5a0] text-xs lg:text-sm h-10 flex justify-center gap-1.5"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Add Selected Participants
                </Button>
              </div>
            ) : null}
          </div>

        </div>
      </div>

      <DeleteMeetingConfirmModal
        open={isDeleteConfirmOpen}
        onClose={() => {
          if (!submitting) {
            setIsDeleteConfirmOpen(false);
          }
        }}
        onConfirm={async () => {
          await handleDeleteMeeting();
          setIsDeleteConfirmOpen(false);
        }}
        meetingTitle={meetingData.meeting_title || meetingData.order?.name || "Meeting"}
        isDeleting={submitting}
        isDark={isDark}
      />
    </div>
  );
}
