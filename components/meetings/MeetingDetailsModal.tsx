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

interface MeetingDetailsModalProps {
  open: boolean;
  onClose: () => void;
  meeting: MeetingItem | null;
  role: RoleVariant;
  currentUserId?: string | number;
  currentUserEmail?: string;
  onUpdated?: () => void;
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

  const effectiveStatus = getEffectiveMeetingStatus(meetingData);
  const isCompleted = effectiveStatus === "completed";
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

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#090909] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              {meetingData.meeting_title || meetingData.order?.name || "Meeting Details"}
            </h2>
            <p className="mt-1 text-sm text-white/45">Review the meeting schedule, participants, and actions.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#141414] text-white/80 transition-colors hover:bg-[#1b1b1b] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[1.1fr_0.9fr]">
          <div className="min-h-0 overflow-y-auto border-b border-white/10 px-6 py-5 lg:border-b-0 lg:border-r">
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#111111] p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/35">Shoot</p>
                      <p className="mt-1 text-sm text-white">{meetingData.order?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/35">Status</p>
                    <p className="mt-1 text-sm capitalize text-white">
                      {formatMeetingStatusLabel(effectiveStatus)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/35">Date</p>
                    <p className="mt-1 text-sm text-white">{formatDate(meetingData.meeting_date_time)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/35">Time</p>
                    <p className="mt-1 text-sm text-white">
                      {formatTime(meetingData.meeting_date_time)} to {formatTime(meetingData.meeting_end_time)}
                    </p>
                  </div>
                </div>
                {meetingData.description ? (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/35">Description</p>
                    <p className="mt-2 text-sm leading-6 text-white/70">{meetingData.description}</p>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                {meetingData.meetLink ? (
                  <a
                    href={meetingData.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-disabled={isCompleted}
                    onClick={(event) => {
                      if (isCompleted) {
                        event.preventDefault();
                      }
                    }}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold",
                      isCompleted
                        ? "cursor-not-allowed border border-white/10 bg-[#111111] text-white/30"
                        : "bg-[#E5D5B8] text-black hover:bg-[#d9c5a0]"
                    )}
                  >
                    Join Meeting
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 px-4 py-2 text-sm text-white/40">
                    Meeting link not available yet
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="border-white/10 bg-[#141414] text-white hover:bg-[#1c1c1c]"
                >
                  {refreshing ? <Loader2 size={15} className="animate-spin" /> : <Users size={15} />}
                  Refresh
                </Button>

                {canDeleteMeeting ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    disabled={submitting}
                    className="border-rose-400/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
                  >
                    <Trash2 size={15} />
                    Delete
                  </Button>
                ) : null}
              </div>

              {canRespond ? (
                <div className="rounded-2xl border border-white/10 bg-[#111111] p-4">
                  <p className="text-sm font-medium text-white">Invitation Response</p>
                  <p className="mt-1 text-sm text-white/45">
                    Your current response is{" "}
                    <span className="capitalize text-[#E5D5B8]">
                      {currentResponse}
                    </span>
                    .
                  </p>
                  <div className="mt-4 flex gap-3">
                    <Button
                      type="button"
                      onClick={() => handleRespond("accepted")}
                      disabled={submitting}
                      className="bg-emerald-500 text-white hover:bg-emerald-600"
                    >
                      Accept
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRespond("declined")}
                      disabled={submitting}
                      className="border-rose-400/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-white">Participants</p>
                <p className="text-sm text-white/45">{participants.length} invited to this meeting</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {participants.map((participant) => {
                const response = getParticipantResponse(meetingData, {
                  id: participant?.id || "",
                  email: participant?.email || "",
                });
                const statusClass = STATUS_CLASS[response] || STATUS_CLASS.pending;
                const removable = canManageParticipants && !isCompleted && !["client", "admin"].includes(String(participant?.role || ""));
                const isCurrentUserParticipant =
                  !!currentUserId && String(participant?.id || "") === String(currentUserId);
                const showInlineResponseActions =
                  canRespond && isCurrentUserParticipant;

                return (
                  <div
                    key={String(participant?.id || participant?.email || participant?.name)}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#111111] p-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-white">{participant?.name}</p>
                        {isCurrentUserParticipant ? (
                          <span className="rounded-full border border-[#E5D5B8]/25 bg-[#1B1812] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#E5D5B8]">
                            You
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-xs uppercase tracking-[0.16em] text-white/35">
                          {String(participant?.role || "participant").replace(/_/g, " ")}
                        </span>
                        <span className={cn("rounded-full border px-2 py-0.5 text-[11px] capitalize", statusClass)}>
                          {response}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {showInlineResponseActions ? (
                        <>
                          {response !== "accepted" ? (
                            <Button
                              type="button"
                              onClick={() => handleRespond("accepted")}
                              disabled={submitting}
                              className="h-9 bg-emerald-500 px-3 text-white hover:bg-emerald-600"
                            >
                              {submitting && currentResponse !== "accepted" ? <Loader2 size={14} className="animate-spin" /> : null}
                              Accept
                            </Button>
                          ) : null}
                          {response !== "declined" ? (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleRespond("declined")}
                              disabled={submitting}
                              className="h-9 border-rose-400/20 bg-rose-500/10 px-3 text-rose-200 hover:bg-rose-500/20"
                            >
                              Reject
                            </Button>
                          ) : null}
                        </>
                      ) : null}

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
                          className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-2 text-rose-200 transition-colors hover:bg-rose-500/20"
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {canManageParticipants ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-[#111111] p-4">
                <p className="text-sm font-semibold text-white">Add Participants</p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAddRole("cp")}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm transition-colors",
                      addRole === "cp"
                        ? "border-[#E5D5B8] bg-[#1B1812] text-white"
                        : "border-white/10 bg-[#0f0f0f] text-white/60"
                    )}
                  >
                    Creative Partners
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddRole("manager")}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm transition-colors",
                      addRole === "manager"
                        ? "border-[#E5D5B8] bg-[#1B1812] text-white"
                        : "border-white/10 bg-[#0f0f0f] text-white/60"
                    )}
                  >
                    Staff
                  </button>
                </div>

                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search users"
                  className="mt-4 border-white/10 bg-[#0f0f0f] text-white placeholder:text-white/30"
                />

                <div className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1">
                  {directoryLoading ? (
                    <div className="flex items-center gap-2 text-sm text-white/45">
                      <Loader2 size={14} className="animate-spin" />
                      Loading users...
                    </div>
                  ) : availableUsers.length === 0 ? (
                    <p className="text-sm text-white/40">No available users found.</p>
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
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition-colors",
                            selected
                              ? "border-[#E5D5B8] bg-[#1B1812]"
                              : "border-white/10 bg-[#0f0f0f] hover:bg-[#151515]"
                          )}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">{user.name || user.email || "User"}</p>
                            <p className="truncate text-xs text-white/40">{user.email || user.role || ""}</p>
                          </div>
                          {selected ? <Check size={15} className="text-[#E5D5B8]" /> : <Plus size={15} className="text-white/40" />}
                        </button>
                      );
                    })
                  )}
                </div>

                <Button
                  type="button"
                  onClick={handleAddParticipants}
                  disabled={submitting || selectedUsers.length === 0}
                  className="mt-4 w-full bg-[#E5D5B8] text-black hover:bg-[#d9c5a0]"
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
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
      />
    </div>
  );
}
