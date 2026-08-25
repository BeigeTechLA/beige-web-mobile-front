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
  Calendar,
  Clock,
  Edit2,
  CircleCheckBig,
  CircleX,
  SquarePen
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import DeleteMeetingConfirmModal from "@/components/meetings/DeleteMeetingConfirmModal";
import {
  meetingsApi,
  type MeetingItem,
  type MeetingParticipantRef,
} from "@/lib/meetingsApi";
import { externalChatApi, type ExternalChatUser } from "@/lib/externalChatApi";
import { cn } from "@/lib/utils";
import { formatMeetingStatusLabel, getEffectiveMeetingStatus, getMinimumMeetingEndTime, getMinimumSelectableMeetingTime } from "@/lib/meetingStatus";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { getBrowserTimeZoneLabel } from "@/lib/timezone";

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
  onEdit?: () => void;
}

const getInitials = (name?: string) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return parts[0].charAt(0).toUpperCase();
};

const formatDate = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatTimeRange = (start?: string, end?: string) => {
  if (!start) return "N/A";
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return "N/A";

  const startTimeStr = startDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!end) return `${startTimeStr} (${getBrowserTimeZoneLabel(startDate)})`;
  const endDate = new Date(end);
  if (Number.isNaN(endDate.getTime())) return `${startTimeStr} (${getBrowserTimeZoneLabel(startDate)})`;

  const endTimeStr = endDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${startTimeStr} - ${endTimeStr} (${getBrowserTimeZoneLabel(startDate)})`;
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

export default function MeetingDetailsModal({
  open,
  onClose,
  meeting,
  role,
  currentUserId,
  currentUserEmail,
  onUpdated,
  isDark = true,
  onEdit
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

  // Custom states to handle sections
  const [showAddDirectory, setShowAddDirectory] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

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
  const canAdminEditOrReschedule =
    canManageMeeting &&
    canEditByPermission &&
    !!meetingData?.id &&
    !isCompleted &&
    !isCancelled &&
    meetingStartValid &&
    Date.now() < editCutoffMs;

  const participants = useMemo(() => getAllParticipants(meetingData), [meetingData]);

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
    if (!open || !canManageParticipants || !showAddDirectory) return;

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
  }, [open, canManageParticipants, addRole, search, showAddDirectory]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedUsers([]);
      setAddRole("cp");
      setShowAddDirectory(false);
      setShowEditForm(false);
    }
  }, [open]);

  if (!open || !meetingData) return null;


  const handleRemoveParticipant = async (userId: string, participantRole: string) => {
    if (!canManageParticipants) return;
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

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0">
      <div
        onClick={onClose}
        className={`absolute inset-0 backdrop-blur-sm ${isDark ? "bg-[#101010]/80" : "bg-black/10"}`}
      />

      {/* Modal Card Layout */}
      <div className={`relative mx-auto mr-0 flex max-h-[calc(100vh-2rem)] md:max-h-none h-full w-full max-w-2xl flex-col rounded-lg lg:rounded-l-2xl lg:rounded-r-none border shadow-2xl ${isDark ? "shadow-black/40 border-white/40 bg-black" : "shadow-[#64646f33] bg-[#FFFFFF] border-[#FFFFFF66]"}`}>

        {/* Header */}
        <div className={`flex items-start justify-between border-b p-4 lg:p-7 ${isDark ? "border-white/10" : "border-[#CACACA]"}`}>
          <div className="min-w-0 pr-2">
            <h2 className={`text-xl lg:text-3xl font-semibold tracking-[-0.02em] ${isDark ? "text-white" : "text-black"}`}>Meeting Details</h2>
            <p className={`mt-1 max-w-[560px] text-xs lg:text-sm lg:leading-6 ${isDark ? "text-white/70" : " text-black/75"}`}>
              Review the meeting schedule, participants, and actions.
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

        {/* Scrollable Container Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-7 space-y-4 lg:space-y-5 no-scrollbar">
          <span className={`w-fit block lg:hidden rounded-full px-3 py-1 capitalize ${STATUS_CLASS[effectiveStatus] || STATUS_CLASS.pending}`}>
            {formatMeetingStatusLabel(effectiveStatus)}
          </span>
          {/* Title row with badge and inline Action icons */}
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg lg:text-xl font-semibold lg:font-bold whitespace-break-spaces">
              {meetingData.meeting_title || meetingData.order?.name || "Meeting Details"}
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`hidden lg:block rounded-full px-3 py-1 capitalize ${STATUS_CLASS[effectiveStatus] || STATUS_CLASS.pending}`}>
                {formatMeetingStatusLabel(effectiveStatus)}
              </span>

              {canAdminEditOrReschedule && (
                <button
                  type="button"
                  onClick={onEdit}
                  className={`p-2 rounded-sm border transition-colors ${isDark ? "border-white/10 bg-[#141414] text-white/80 hover:bg-[#1b1b1b]" : "border-[#e3e3e3] bg-[#F0F0F0] text-[#323232] hover:bg-[#E8E8E8]"}`}
                >
                  <SquarePen size={18} />
                </button>
              )}

              {canDeleteMeeting && (
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  disabled={submitting}
                  className={`rounded-sm border p-2 text-[#DC2626] transition-colors hover:bg-[#DC2626]/80 disabled:opacity-40 ${isDark ? "border-[#F5EBDA]/20 bg-[#171717]" : " border-[#e5e5e5] bg-[#F0f0f0]/20"}`}
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>

          <div className={`border rounded-xl ${isDark ? "bg-[#000000] border-[#505050]" : "border-[#e3e3e3] bg-zinc-100"}`}>
            {/* Date & Time display block */}
            <div className={`grid lg:grid-cols-2 gap-4 overflow-hidden p-4`}>
              <div className={`flex items-start gap-3`}>
                <div className={`p-3 rounded-md shrink-0 ${isDark ? "bg-[#1F1F1F] text-[#737373]" : "bg-zinc-100 text-zinc-600"}`}>
                  <Calendar size={20} />
                </div>
                <div>
                  <p className={`text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>Date</p>
                  <p className={`text-sm ${isDark ? "text-[#737373]" : "text-black/60"}`}>{formatDate(meetingData.meeting_date_time)}</p>
                </div>
              </div>
              <div className={`flex items-start gap-3`}>
                <div className={`p-3 rounded-md shrink-0 ${isDark ? "bg-[#1F1F1F] text-[#737373]" : "bg-zinc-100 text-zinc-600"}`}>
                  <Clock size={20} />
                </div>
                <div>
                  <p className={`text-base font-semibold  ${isDark ? "text-white" : "text-black"}`}>Start & End Time</p>
                  <p className={`text-sm ${isDark ? "text-[#737373]" : "text-black/60"}`}>
                    {formatTimeRange(meetingData.meeting_date_time, meetingData.meeting_end_time)}
                  </p>
                </div>
              </div>
            </div>
            <hr className={`border-t my-0 ${isDark ? "border-[#505050]" : "border-[#E3E3E3]"}`} />
            {/* Description section */}
            <div className=" p-4">
              <p className="text-lg font-semibold mb-2">Description</p>
              <div className={`rounded-md p-4 ${isDark ? "bg-[#1F1F1F]" : "bg-[#fdfdfd]"}`}>
                <p className={`text-xs lg:text-base leading-relaxed ${isDark ? "text-[#A9A9A9]" : "text-zinc-600"}`}>
                  {meetingData.description || "No description provided for this meeting."}
                </p>
              </div>
            </div>
          </div>

          {/* Participants list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm lg:text-lg font-medium lg:font-semibold ">Participants ({participants.length})</p>
            </div>

            {/* List of active participants */}
            <div className="space-y-2">
              {participants.map((participant) => {
                const response = getParticipantResponse(meetingData, {
                  id: participant?.id || "",
                  email: participant?.email || "",
                });
                const statusClass = STATUS_CLASS[response] || STATUS_CLASS.pending;
                const removable = canManageParticipants && !isCompleted;

                return (
                  <div
                    key={String(participant?.id || participant?.email || participant?.name)}
                    className={`flex items-center justify-between gap-4 rounded-lg border p-4 ${isDark ? "border-[#505050] bg-[#000000]" : "border-[#e3e3e3] bg-white"}`}
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-3.5">
                      {/* Initials Avatar */}
                      <div className="w-11 h-11 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 uppercase bg-[#332E28] text-[#E8D1AB]">
                        {getInitials(participant?.name || participant?.email || "U")}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`truncate text-sm lg:text-base font-semibold ${isDark ? "text-[#CECECE]" : ""}`}>{participant?.name}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] capitalize ${statusClass}`}>
                            {response}
                          </span>
                        </div>
                        <p className={`truncate text-xs lg:text-sm ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                          <span className="capitalize text-[#E8D1AB]">{String(participant?.role || "participant").replace(/_/g, " ")}</span>
                          <span className={isDark ? "text-[#737373]" : "text-black/60"}>{participant?.email ? ` - ${participant.email}` : ""}</span>
                        </p>
                      </div>
                    </div>

                    {removable && (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleRemoveParticipant(String(participant?.id || ""), String(participant?.role || "participant"))}
                        className={`rounded-sm border p-2 text-[#DC2626] transition-colors hover:bg-[#DC2626]/80 disabled:opacity-40 ${isDark ? "border-[#F5EBDA]/20 bg-[#171717]" : " border-[#e5e5e5] bg-[#F0f0f0]/20"}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Invitation response box */}
          {canRespond && (
            <div className="space-y-3">
              <p className="text-sm lg:text-lg font-medium lg:font-semibold">Invitation Response</p>
              <div className={`rounded-lg border p-4 ${isDark ? "border-[#505050] bg-black" : "border-[#e3e3e3] bg-white"}`}>
                <p className={`text-sm lg:text-base font-medium ${isDark ? "text-white/50" : "text-zinc-500"}`}>
                  Your Current Response is <span className={`capitalize ${isDark ? "text-white" : "text-black"}`}>{currentResponse}</span>
                </p>
                <div className="mt-4 flex gap-3">

                  <Button
                    type="button"
                    onClick={() => handleRespond("accepted")}
                    disabled={submitting || (currentResponse == "accepted")}
                    className="lg:w-1/2 bg-[#10B981] hover:bg-[#059669] text-white font-semibold rounded-lg text-sm h-12 flex-1 justify-center gap-1.5"
                  >
                    <CircleCheckBig size={16} strokeWidth={2} />
                    Accept
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleRespond("declined")}
                    disabled={submitting || currentResponse == "declined"}
                    className="lg:w-1/2 bg-[#EF4444] hover:bg-[#dc2626] text-white font-semibold rounded-lg text-sm h-12 flex-1 justify-center gap-1.5"
                  >
                    <CircleX size={16} strokeWidth={3} />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex w-full gap-3 p-4 lg:p-7">
          <Button
            type="button"
            onClick={handleAdminCancelMeeting}
            disabled={!canAdminEditOrReschedule || submitting}
            className={`rounded-lg text-sm h-12 flex-1 font-semibold transition-colors justify-center bg-[#EF4444] text-white hover:bg-[#059669] disabled:opacity-80`}
          >
            Cancel Meeting
          </Button>

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
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors flex-1 justify-center h-12",
                isCompleted || isCancelled
                  ? ("cursor-not-allowed bg-[#E8D1AB]/80 text-black")
                  : ("bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/80")
              )}
            >
              Join Meeting
              <ExternalLink size={15} />
            </a>
          ) : (
            <div className={`rounded-lg border flex items-center justify-center flex-1 text-sm px-4 h-12 ${isDark ? "border-white/10 text-zinc-500" : "border-zinc-300 text-zinc-500"}`}>
              Meeting Link Pending
            </div>
          )}
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
