"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ExternalLink,
  Loader2,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/Datepicker";
import { TimePicker } from "@/components/ui/Timepicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DeleteMeetingConfirmModal from "@/components/meetings/DeleteMeetingConfirmModal";
import {
  meetingsApi,
  type MeetingItem,
  type MeetingParticipantRef,
} from "@/lib/meetingsApi";
import { externalChatApi, type ExternalChatUser } from "@/lib/externalChatApi";
import { cn, getInitials } from "@/lib/utils";
import { formatMeetingStatusLabel, getEffectiveMeetingStatus, getMinimumMeetingEndTime, getMinimumSelectableMeetingTime } from "@/lib/meetingStatus";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { DatePickerFloating } from "../admin/DatePickerFloating";
import { TabsSwitcher } from "../admin/TabsSwitcher";

type RoleVariant = "admin" | "sales" | "client" | "cp" | "pm";
type AddRole = "cp" | "manager";
type MeetingType = "pre_production" | "post_production";

interface EditMeetingModalProps {
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

  const participants = (meeting.participants || [])
    .map((item) => normalizeParticipant(item, "participant"))
    .filter(Boolean) as Array<ReturnType<typeof normalizeParticipant>>;

  return participants.filter((entry, index, array) => {
    const key = String(entry?.id || entry?.email || entry?.name || "");
    return key && array.findIndex((item) => String(item?.id || item?.email || item?.name || "") === key) === index;
  });
};

const STATUS_CLASS: Record<string, string> = {
  accepted: "border-[#D4FFE4] bg-[#D4FFE4] text-[#16A34A]",
  declined: "border-rose-300 bg-rose-300 text-rose-700",
  pending: "border-[#FFF4C9] bg-[#FFF4C9] text-[#BA6605]",
};

export default function EditMeetingModal({
  open,
  onClose,
  meeting,
  role,
  currentUserId,
  currentUserEmail,
  onUpdated,
  isDark = true
}: EditMeetingModalProps) {
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
  const [showAdditionalMembersView, setShowAdditionalMembersView] = useState(false);

  const effectiveStatus = getEffectiveMeetingStatus(meetingData);
  const isCompleted = effectiveStatus === "completed";
  const isCancelled = String(effectiveStatus || "").toLowerCase() === "cancelled";
  const { canEdit: canEditByPermission, canDelete: canDeleteByPermission } = usePermissions("meetings");
  const canManageMeeting = role === "admin";
  const canManageParticipants = canManageMeeting && canEditByPermission;
  const createdById = resolveId(meetingData?.created_by?.id);
  const isClientCreatedBySelf =
    role === "client" &&
    !!currentUserId &&
    !!createdById &&
    String(createdById) === String(currentUserId);
  const canDeleteMeeting = canManageMeeting && canDeleteByPermission && !!meetingData?.id;
  const meetingStartMs = meetingData?.meeting_date_time ? new Date(meetingData.meeting_date_time).getTime() : NaN;
  const meetingStartValid = Number.isFinite(meetingStartMs);
  const editCutoffMs = meetingStartValid ? meetingStartMs - 60 * 60 * 1000 : NaN;
  const canRespond =
    !!meetingData?.id &&
    !!currentUserId &&
    role !== "admin" &&
    !isClientCreatedBySelf &&
    meetingStartValid &&
    Date.now() < editCutoffMs &&
    !["completed", "cancelled"].includes(String(effectiveStatus || "").toLowerCase());
  const currentResponse = getParticipantResponse(meetingData, {
    id: currentUserId,
    email: currentUserEmail || "",
  });
  const minimumEditStartTime = getMinimumSelectableMeetingTime(1);
  const canAdminEditOrReschedule =
    canManageMeeting &&
    canEditByPermission &&
    !!meetingData?.id &&
    !isCompleted &&
    !isCancelled &&
    meetingStartValid &&
    Date.now() < editCutoffMs;
  const isPastEditCutoff = canEditByPermission && meetingStartValid && Date.now() >= editCutoffMs;

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
        const directory = await externalChatApi.getDirectory({
          search: search || undefined,
          limit: 50,
        });
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
      setShowAdditionalMembersView(false); 
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
    if (!canManageParticipants || isCompleted || isCancelled) return;
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
      setShowAdditionalMembersView(false);
      await refreshMeeting();
      await onUpdated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add participants");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveParticipant = async (userId: string, participantRole: string) => {
    if (!canManageParticipants|| isCompleted || isCancelled) return;
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
    if (!meetingData.id || !canDeleteMeeting) return;

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

    if (new Date(endIso).getTime() < new Date(startIso).getTime() + 60 * 60 * 1000) {
      toast.error("Meeting end time must be at least 1 hour after the start time.");
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

  const tabs: { label: string; value: AddRole }[] = [
    { label: "Staff", value: "manager" },
    { label: "Creative Partners", value: "cp" },
  ];

  const formatRoleLabel = (value?: string) =>
    String(value || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:px-4 lg:py-8">
      <div
        onClick={onClose}
        className={`absolute inset-0 backdrop-blur-sm ${isDark ? "bg-[#101010]/80" : "bg-black/10"}`}
      />

      {/* Modal Container */}
      <div className={`relative mx-auto flex max-h-[calc(100vh-2rem)] w-full max-w-[860px] flex-col rounded-lg lg:rounded-2xl border shadow-2xl ${isDark ? "shadow-black/40 border-white/40 bg-black" : "shadow-[#64646f33] bg-[#FFFFFF] border-[#FFFFFF66]"}`}>
        {
          !showAdditionalMembersView ?
            <>
              {/* Header */}
              <div className={`flex items-start justify-between border-b p-4 lg:p-7 ${isDark ? "border-white/10" : "border-[#CACACA]"}`}>
                <div className="min-w-0 pr-2">
                  <h2 className={`text-xl lg:text-3xl font-semibold tracking-[-0.02em] ${isDark ? "text-white" : "text-black"}`}>
                    {role === "admin" ? "Edit & Reschedule" : meetingData.meeting_title || meetingData.order?.name || "Meeting Details"}
                  </h2>
                  <p className={`mt-1 max-w-[560px] text-xs lg:text-sm lg:leading-6 ${isDark ? "text-white/70" : " text-black/75"}`}>
                    {role === "admin" ? "You can edit title, type, description, and schedule until 1 hour before start time" : "Review the meeting schedule, participants, and actions."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className={`rounded-full p-2 lg:p-3.5 shrink-0 transition-colors ${isDark ? "bg-[#2B2626] text-white/60 hover:bg-[#2B2626]/75" : "bg-[#F0F0F0] text-zinc-400 hover:bg-[#F0F0F0]/70"}`}
                >
                  <X className="h-4 w-4 lg:h-7 lg:w-7" />
                </button>
              </div>

              {/* Responsive Grid Split-Panel Body */}
              <div className="min-h-0 flex-1 overflow-y-auto py-4 lg:py-7 no-scrollbar">

                <div className="space-y-4">
                  {/* Admin Configuration Board */}
                  {role === "admin" ? (
                    <div className={`px-4 lg:px-7 space-y-4 lg:space-y-7`}>
                      <div className="relative">
                        <label className={`absolute -top-3 left-4 z-10 px-2 text-sm lg:text-base font-medium transition-colors ${isDark ? "bg-black text-white/50" : "bg-white text-black/60"}`}>
                          Project/Shoot*
                        </label>
                        <Input
                          value={meetingData.order?.name || "N/A"}
                          placeholder="Project Name"
                          disabled={true}
                          className={`h-16 lg:h-[82px] rounded-lg lg:rounded-xl pt-1 ${isDark ? "placeholder:text-white/30 text-white border-white/50 bg-black focus:border-[#E8D1AB]/50" : "text-black border-black/20 bg-[#fff] placeholder:text-black/60 focus:border-[#E8D1AB]"}`}
                        />
                      </div>

                      <div className="relative">
                        <label className={`absolute -top-3 left-4 z-10 px-2 text-sm lg:text-base font-medium transition-colors ${isDark ? "bg-black text-white/50" : "bg-white text-black/60"}`}>
                          Meeting Title*
                        </label>
                        <Input
                          value={editMeetingTitle}
                          onChange={(event) => setEditMeetingTitle(event.target.value)}
                          disabled={!canAdminEditOrReschedule || submitting}
                          placeholder="Project catch-up"
                          className={`h-16 lg:h-[82px] rounded-lg lg:rounded-xl pt-1 ${isDark ? "placeholder:text-white/30 text-white border-white/50 bg-black focus:border-[#E8D1AB]/50" : "text-black border-black/20 bg-[#fff] placeholder:text-black/60 focus:border-[#E8D1AB]"}`}
                        />
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="relative">
                          <label className={`absolute -top-3 left-4 z-10 px-2 text-sm lg:text-base font-medium transition-colors ${isDark ? "bg-black text-white/50" : "bg-white text-black/60"}`}>
                            Meeting Type*
                          </label>
                          <Select
                            value={editMeetingType}
                            onValueChange={(value) => setEditMeetingType(value as MeetingType)}
                            disabled={!canAdminEditOrReschedule || submitting}
                          >
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
                            selectedDate={editMeetingDate}
                            onDateChange={setEditMeetingDate}
                            width="w-full"
                            classnames={`rounded-xl h-14 lg:h-[82px] w-full resize-none px-0 text-sm lg:text-base outline-none lg:text-base ${isDark ? "text-white " : "text-black "}`}
                            labelClasses={`${isDark ? "bg-black text-white/60" : "bg-white text-[#727272]"} text-sm lg:text-base z-10 px-1`}
                            label="Meeting Date"
                          />
                        </div>
                        <div className="relative">
                          <TimePicker
                            label="Start Time"
                            value={editMeetingStartTime}
                            onChange={setEditMeetingStartTime}
                            minTime={isEditDateToday ? minimumEditStartTime : null}
                            isDark={isDark}
                            height={{ xs: "60px", lg: "82px" }}
                            fontSize={"text-sm lg:text-base"}
                            labelFontSize={"text-sm lg:text-base"}
                          />
                        </div>
                        <div className="relative">
                          <TimePicker
                            label="End Time"
                            value={editMeetingEndTime}
                            onChange={setEditMeetingEndTime}
                            minTime={getMinimumMeetingEndTime(editMeetingStartTime) || (isEditDateToday ? minimumEditStartTime : null)}
                            iisDark={isDark}
                            height={{ xs: "60px", lg: "82px" }}
                            fontSize={"text-sm lg:text-base"}
                            labelFontSize={"text-sm lg:text-base"}
                          />
                        </div>
                      </div>

                      <div className="relative">
                        <label className={`absolute -top-3 left-4 z-10 px-2 text-sm lg:text-base font-medium transition-colors ${isDark ? "bg-black text-white/50" : "bg-white text-black/60"}`}>
                          Description
                        </label>
                        <Textarea
                          value={editDescription}
                          onChange={(event) => setEditDescription(event.target.value)}
                          rows={4}
                          placeholder="Agenda, discussion points, or notes for the team."
                          disabled={!canAdminEditOrReschedule || submitting}
                          className={`min-h-[120px] rounded-lg lg:rounded-xl text-sm lg:text-base p-3 lg:p-5 ${isDark ? "border-white/50 bg-black text-white placeholder:text-white/30" : "text-black border-black/20 bg-[#fff] placeholder:text-black/60"}`}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
                <hr className={`border-t my-4 lg:my-7 ${isDark ? "border-[#CACACA]" : "border-[#E3E3E3]"}`} />

                <div className={`px-4 lg:px-7 space-y-4`}>
                  <div className="flex justify-between">
                    <p className={`text-sm lg:text-base font-medium  ${isDark ? "text-white" : "text-black"}`}>Participants ({participants.length.toString().padStart(2, '0')})</p>
                    <button
                      type="button"
                      disabled={isCompleted || isCancelled} 
                      onClick={() => setShowAdditionalMembersView(true)}
                     className={cn(
                      "text-[#E8D1AB] flex gap-2 items-center transition-opacity",
                      (isCompleted || isCancelled) && "opacity-50 cursor-not-allowed"
                    )}
                    >
                      <Plus size={24} />
                      <span className="underline underline-offset-2 text-sm font-semibold">Add Participants </span>
                    </button>
                  </div>

                  <div className="space-y-2 lg:space-y-3">
                    {participants.map((participant) => {
                      const response = getParticipantResponse(meetingData, {
                        id: participant?.id || "",
                        email: participant?.email || "",
                      });
                      const statusClass = STATUS_CLASS[response] || STATUS_CLASS.pending;
                      const removable = canManageParticipants && !isCompleted && !isCancelled;
                      const isCurrentUserParticipant =
                        !!currentUserId && String(participant?.id || "") === String(currentUserId);

                      return (
                        <div
                          key={String(participant?.id || participant?.email || participant?.name)}
                          className={`flex items-center justify-between gap-3 rounded-lg lg:rounded-xl border p-4 ${isDark ? "border-[#505050] bg-black" : "border-[#e3e3e3] bg-white"}`}
                        >
                          <div className="flex gap-4">
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center font-medium text-lg shrink-0 uppercase ${isDark ? "bg-[#332E28] text-[#E8D1AB]" : "bg-zinc-200 text-black"}`}>
                              {getInitials(participant?.name || participant?.email || "Member")}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className={`truncate text-sm lg:text-base font-semibold ${isDark ? "text-[#CECECE]" : "text-black"}`}>{participant?.name}</p>
                                {isCurrentUserParticipant ? (
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] border ${isDark ? "border-[#E8D1AB]/25 bg-[#1B1812] text-[#E8D1AB]" : "border-[#E8D1AB]/40 bg-[#FFFDF9] text-[#8A7656]"}`}>
                                    You
                                  </span>
                                ) : null}
                                <span className={cn("rounded-full border px-2 py-0.5 text-[10px] capitalize", statusClass)}>
                                  {response}
                                </span>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-1 text-xs lg:text-sm">
                                <span className={`capitalize ${isDark ? "text-[#E8D1AB]" : "text-[#766A6A]"}`}>
                                  {String(participant?.role || "participant").replace(/_/g, " ")}
                                </span>
                                {participant?.email ? (
                                  <p className={`truncate ${isDark ? "text-[#737373]" : "text-[#171717B2]"}`}>- {participant.email}</p>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              disabled={!removable || submitting}
                              onClick={() => {
                                if (!removable || submitting) return;
                                handleRemoveParticipant(
                                  String(participant?.id || ""),
                                  String(participant?.role || "participant")
                                );
                              }}
                              className={`rounded-md border p-2 text-[#BD1010] transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40 flex items-center justify-center ${isDark ? "border-[#F5EBDA]/20 bg-[#171717]" : "border-[#F0F0F0] bg-[#F0F0F0]"}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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

                      <div className={`flex items-center justify-between gap-3 px-4 rounded-xl border w-full h-16 lg:h-20 ${isDark ? "border-white/50 bg-black" : "border-black/45 bg-white"}`}>
                        <Input
                          type="text"
                          value={editMeetLink}
                          disabled
                          placeholder="Auto-generated google meet link.."
                          className={`w-full h-full bg-transparent border-none outline-none text-xs lg:text-base focus:ring-0 p-0 ${isDark
                            ? "text-white placeholder:text-white/30"
                            : "text-black placeholder:text-black/35"
                            }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex w-full gap-3 p-4 lg:p-7 lg:pt-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAdminCancelMeeting}
                  disabled={!canAdminEditOrReschedule || submitting}
                  className={`flex-1 border border-[#EF4444] bg-[#EF4444] text-white hover:bg-[#EF4444]/80`}
                >
                  Cancel Meeting
                </Button>

                <Button
                  type="button"
                  onClick={handleAdminSaveMeeting}
                  disabled={!canAdminEditOrReschedule || submitting}
                  className="flex-1 bg-[#E8D1AB] text-black hover:bg-[#d9c5a0]"
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
                  Save Changes
                </Button>
              </div>
            </>
            : <>
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
                  activeTab={addRole}
                  onChange={(tab) => setAddRole(tab)}
                  className="w-full"
                />

                <div className="relative">
                  <Search size={15} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-white/30" : "text-black/60"}`} />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    disabled={!canManageParticipants}
                    placeholder={addRole === "cp" ? "Search creative partners" : "Search staff members"}
                    className={`h-12 pl-10 rounded-xl ${isDark ? "border-white/50 bg-[#151515] text-white placeholder:text-white/30" : "text-black border-black/20 bg-[#fff] placeholder:text-black/60"}`}
                  />
                </div>

                <p className={`font-medium capitalize ${isDark ? "text-[#E8D1AB]" : "text-black/70"}`}>
                  <span className={isDark ? "text-white" : "text-black"}>{addRole === "cp" ? "Creative Partners" : "Staff Members"}{" "}</span>
                  ({(selectedUsers).length.toString().padStart(2, '0')} Selected)
                </p>

                {/* Directory Search Section */}
                <div className="max-h-115 space-y-2.5 overflow-y-auto no-scrollbar">
                  {!canManageParticipants ? (
                    <p className={`text-xs lg:text-sm py-2 text-center ${isDark ? "text-white/40" : "text-[#766A6A]"}`}>
                      Participant management is disabled for this role.
                    </p>
                  ) : directoryLoading ? (
                    <div className={`flex items-center justify-center gap-2 text-xs lg:text-sm py-4 ${isDark ? "text-white/45" : "text-[#171717B2]"}`}>
                      <Loader2 size={16} className="animate-spin" />
                      Loading users...
                    </div>
                  ) : availableUsers.length === 0 ? (
                    <p className={`text-xs lg:text-sm py-2 text-center ${isDark ? "text-white/40" : "text-[#766A6A]"}`}>
                      No available users found.
                    </p>
                  ) : (
                    availableUsers.map((user) => {
                      const userId = String(user.id || "");
                      const selected = selectedUsers.includes(userId);

                      // Clean, unified toggle state handler
                      const handleToggle = () => {
                        if (!canManageParticipants) return;
                        setSelectedUsers((current) =>
                          selected ? current.filter((value) => value !== userId) : [...current, userId]
                        );
                      };

                      return (
                        <button
                          key={userId}
                          type="button"
                          onClick={handleToggle}
                          disabled={!canManageParticipants}
                          className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-40 ${selected ? "border-[#E8D1AB]/50" : isDark ? "border-[#171717]" : "border-[#e3e3e3]"} ${isDark ? "bg-[#171717] hover:bg-[#171717]/80" : "bg-white hover:bg-[#F4F5F7]"}`}
                        >
                          {/* Left Block: User Profile Info with Initials */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-15 h-15 rounded-full flex items-center justify-center font-medium text-xl shrink-0 uppercase ${isDark ? "bg-[#332E28] text-[#E8D1AB]" : "bg-zinc-200 text-black"}`}>
                              {getInitials(user?.name || user?.email || "Member")}
                            </div>

                            <div className="min-w-0">
                              <p className={`truncate text-sm font-semibold ${isDark ? "text-[#CECECE]" : "text-black"}`}>
                                {user.name || user.email || "User"}
                              </p>
                              <p className={`truncate text-xs ${isDark ? "text-[#737373]" : "text-[#171717B2]"}`}>
                                {formatRoleLabel(user.role || "Participant")}
                              </p>
                              {user.name && user.email ? (
                                <p className={`truncate text-xs ${isDark ? "text-[#E8D1AB]" : "text-black/35"}`}>
                                  {user.email}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          {/* Right Block: Structured Checkbox UI Element */}
                          <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 ${selected
                            ? "bg-[#E8D1AB] border-[#E8D1AB] text-black"
                            : isDark ? "border-white/20 bg-transparent" : "border-black/20 bg-transparent"
                            }`}>
                            {selected && (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5">
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
                    setSelectedUsers([]);
                    setShowAdditionalMembersView(false);
                  }}
                  className={`flex-1 border ${isDark ? "border-[#262626] bg-[#1F1F1F] text-white hover:bg-[#1c1c1c]" : "border-[#f0f0f0] bg-[#f0f0f0] text-zinc-700 hover:bg-zinc-100"}`}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAddParticipants}
                  disabled={!canManageParticipants || submitting || selectedUsers.length === 0 || isCompleted || isCancelled}
                  className="flex-1 bg-[#E8D1AB] text-black hover:bg-[#d9c5a0]"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : "Add Participants"}
                </Button>
              </div>
            </>
        }
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
