"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Clock3, ExternalLink, Loader2, Plus, SquarePen, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { externalChatApi, type ExternalChatUser } from "@/lib/externalChatApi";
import { cn } from "@/lib/utils";
import { meetingsApi, type MeetingItem, type MeetingParticipantRef } from "@/lib/meetingsApi";
import { formatMeetingStatusLabel, getEffectiveMeetingStatus } from "@/lib/meetingStatus";

interface MeetingViewDetailsDrawerProps {
  open: boolean;
  meeting: MeetingItem | null;
  onClose: () => void;
  onEdit: (meeting: MeetingItem) => void;
  onCancelMeeting: (meeting: MeetingItem) => void;
  onUpdated?: () => void;
  onParticipantRemoved?: (meetingId: string, participantKey: string) => void;
}

type AddRole = "cp" | "manager";

const formatLongDate = (value?: string) => {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
};

const formatTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getInitials = (participant: MeetingParticipantRef) => {
  const source = participant.name || participant.email || "Member";
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
};

const getParticipantId = (participant: MeetingParticipantRef) => {
  const source = participant as MeetingParticipantRef & {
    _id?: string | number;
    user_id?: string | number | { _id?: string | number; id?: string | number };
  };
  const rawUserId = source.user_id;
  const userId =
    typeof rawUserId === "object"
      ? rawUserId?._id || rawUserId?.id
      : rawUserId;

  return String(participant.id || source._id || userId || "").trim();
};

const getParticipantKey = (participant: MeetingParticipantRef) => {
  const id = getParticipantId(participant);
  const email = String(participant.email || "").trim().toLowerCase();
  return id || email || String(participant.name || "").trim().toLowerCase();
};

const getRemoveParticipantRole = (role?: string | null): "cp" | "admin" | "participant" | "client" => {
  const normalizedRole = String(role || "").toLowerCase().replace(/[_-]+/g, " ");
  if (normalizedRole.includes("client")) return "client";
  if (normalizedRole.includes("admin")) return "admin";
  if (normalizedRole === "cp" || normalizedRole.includes("creative")) return "cp";
  return "participant";
};

const getParticipantStatus = (meeting: MeetingItem, participant: MeetingParticipantRef) => {
  const participantId = getParticipantId(participant);
  const participantEmail = String(participant.email || "").toLowerCase();

  const response = (meeting.participant_responses || []).find((item) => {
    const responseUserId = item.user_id;
    const normalizedUserId =
      typeof responseUserId === "object"
        ? String(responseUserId?._id || responseUserId?.id || "")
        : String(responseUserId || "");
    const normalizedEmail = String(item.user_email || "").toLowerCase();
    return (participantId && normalizedUserId === participantId) || (participantEmail && normalizedEmail === participantEmail);
  });

  return response?.response || "pending";
};

const responseClasses = (response: string) => {
  if (response === "accepted") return "bg-[#C9F7D8] text-[#0C9A44]";
  if (response === "declined") return "bg-[#FFC3C3] text-[#BD1010]";
  return "bg-[#FFF1C7] text-[#C66A00]";
};

const statusClasses = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes("completed")) return "bg-[#C9F7D8] text-[#0C9A44]";
  if (normalized.includes("cancel")) return "bg-[#FFC3C3] text-[#BD1010]";
  return "bg-[#FFF1C7] text-[#C66A00]";
};

export default function MeetingViewDetailsDrawer({
  open,
  meeting,
  onClose,
  onEdit,
  onCancelMeeting,
  onUpdated,
  onParticipantRemoved,
}: MeetingViewDetailsDrawerProps) {
  const [meetingData, setMeetingData] = useState<MeetingItem | null>(meeting);
  const [showAddParticipants, setShowAddParticipants] = useState(false);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directoryUsers, setDirectoryUsers] = useState<ExternalChatUser[]>([]);
  const [search, setSearch] = useState("");
  const [addRole, setAddRole] = useState<AddRole>("cp");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [removingParticipantKey, setRemovingParticipantKey] = useState("");
  const [removedParticipantKeys, setRemovedParticipantKeys] = useState<string[]>([]);

  useEffect(() => {
    setMeetingData(meeting);
    setRemovedParticipantKeys([]);
    setRemovingParticipantKey("");
  }, [meeting]);

  const participants = useMemo(
    () => (meetingData?.participants || []).filter((participant) => !removedParticipantKeys.includes(getParticipantKey(participant))),
    [meetingData?.participants, removedParticipantKeys]
  );

  const availableUsers = useMemo(() => {
    const existingIds = new Set(participants.map((participant) => getParticipantId(participant)).filter(Boolean));
    const normalizedSearch = search.trim().toLowerCase();

    return directoryUsers.filter((user) => {
      const id = String(user.id || "");
      const matchesSearch =
        !normalizedSearch ||
        String(user.name || "").toLowerCase().includes(normalizedSearch) ||
        String(user.email || "").toLowerCase().includes(normalizedSearch);

      return id && !existingIds.has(id) && matchesSearch;
    });
  }, [directoryUsers, participants, search]);

  useEffect(() => {
    if (!open || !showAddParticipants) return;

    let cancelled = false;

    const loadDirectory = async () => {
      setDirectoryLoading(true);
      try {
        const directory = await externalChatApi.getDirectory(search || undefined);
        if (cancelled) return;
        setDirectoryUsers(addRole === "cp" ? directory.creativePartners || [] : directory.staff || []);
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Failed to load users");
      } finally {
        if (!cancelled) setDirectoryLoading(false);
      }
    };

    loadDirectory();
    return () => {
      cancelled = true;
    };
  }, [open, showAddParticipants, addRole, search]);

  useEffect(() => {
    if (!open) {
      setShowAddParticipants(false);
      setSearch("");
      setSelectedUsers([]);
      setAddRole("cp");
      setRemovingParticipantKey("");
      setRemovedParticipantKeys([]);
    }
  }, [open]);

  if (!open || !meetingData) return null;

  const status = getEffectiveMeetingStatus(meetingData);
  const startTime = formatTime(meetingData.meeting_date_time);
  const endTime = formatTime(meetingData.meeting_end_time);
  const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : startTime || "No time";
  const title = meetingData.meeting_title || meetingData.order?.name || "Meeting Details";

  const refreshMeeting = async () => {
    if (!meetingData.id) return;
    const latest = await meetingsApi.getById(meetingData.id);
    if (latest) setMeetingData(latest);
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
      setShowAddParticipants(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add participants");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveParticipant = async (participant: MeetingParticipantRef) => {
    const participantId = getParticipantId(participant);
    const participantKey = getParticipantKey(participant);
    if (!meetingData.id || !participantId || !participantKey) {
      toast.error("Unable to remove this participant");
      return;
    }

    setRemovingParticipantKey(participantKey);
    try {
      const updatedMeeting = await meetingsApi.removeParticipant(
        meetingData.id,
        participantId,
        getRemoveParticipantRole(participant.role)
      );
      setRemovedParticipantKeys((current) => (current.includes(participantKey) ? current : [...current, participantKey]));
      onParticipantRemoved?.(String(meetingData.id), participantKey);
      setMeetingData((current) => {
        const sourceMeeting = updatedMeeting || current;
        if (!sourceMeeting) return current;
        const removedId = String(participant.id || "");
        const resolvedRemovedId = participantId;
        const removedEmail = String(participant.email || "").toLowerCase();

        return {
          ...sourceMeeting,
          participants: (sourceMeeting.participants || []).filter((item) => {
            const itemId = getParticipantId(item);
            const itemEmail = String(item.email || "").toLowerCase();
            return !(
              (resolvedRemovedId && itemId === resolvedRemovedId) ||
              (removedId && itemId === removedId) ||
              (removedEmail && itemEmail === removedEmail)
            );
          }),
        };
      });
      toast.success("Participant removed");
      await refreshMeeting();
      await onUpdated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove participant");
    } finally {
      setRemovingParticipantKey("");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/60">
      <aside className="flex h-full w-full max-w-[604px] flex-col overflow-hidden border-l border-[#2D2D2D] bg-black text-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-[#343434] px-7 py-7">
          <div>
            <h2 className="text-2xl font-bold leading-tight tracking-normal">Meeting Details</h2>
            <p className="mt-1 max-w-[360px] text-sm leading-5 text-white/55">
              Review the meeting schedule, participants, and actions.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close meeting details"
            onClick={onClose}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2B2728] text-white transition hover:bg-[#393334]"
          >
            <X className="h-6 w-6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-7 py-6 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="min-w-0 flex-1 truncate text-lg font-bold">{title}</h3>
              <span className={`inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-medium ${statusClasses(status)}`}>
                {formatMeetingStatusLabel(status)}
              </span>
              <button
                type="button"
                onClick={() => onEdit(meetingData)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#1F1F1F] text-white transition hover:bg-[#2A2A2A]"
                aria-label="Edit meeting"
              >
                <SquarePen className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onCancelMeeting(meetingData)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#1F1F1F] text-[#FF2B2B] transition hover:bg-[#2A2A2A]"
                aria-label="Cancel meeting"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-hidden rounded-lg border border-[#2E2E2E] bg-black">
              <div className="grid grid-cols-2 border-b border-[#2E2E2E]">
                <div className="flex items-center gap-3 px-3 py-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#242424] text-[#A3A3A3]">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-tight">Date</p>
                    <p className="mt-1 truncate text-xs text-white/45">{formatLongDate(meetingData.meeting_date_time)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 border-l border-[#2E2E2E] px-3 py-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#242424] text-[#A3A3A3]">
                    <Clock3 className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-tight">Start & End Time</p>
                    <p className="mt-1 truncate text-xs text-white/45">{timeRange}</p>
                  </div>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-bold">Description</p>
                <div className="mt-3 rounded bg-[#242424] px-4 py-3 text-sm leading-6 text-white/55">
                  {meetingData.description || "No description added for this meeting."}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Participants ({participants.length})</h3>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedUsers([]);
                  setAddRole("cp");
                  setShowAddParticipants(true);
                }}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#E8D1AB] underline underline-offset-4"
              >
                <Plus className="h-5 w-5" />
                Add Participants
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {participants.map((participant, index) => {
                const response = getParticipantStatus(meetingData, participant);
                const responseLabel = response === "accepted" ? "Accepted" : response === "declined" ? "Rejected" : "Pending";

                return (
                  <div key={`${participant.id || participant.email || index}`} className="flex items-center gap-3 rounded-lg border border-[#2E2E2E] bg-black px-3 py-3">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#332D25] text-sm font-bold text-[#E8D1AB]">
                      {getInitials(participant)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-sm font-bold">{participant.name || participant.email || "Participant"}</p>
                        <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium ${responseClasses(response)}`}>{responseLabel}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs capitalize text-[#E8D1AB]">
                        {participant.role || "Member"} <span className="text-white/35">- {participant.email || "No email"}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!!removingParticipantKey || !getParticipantId(participant)}
                      onClick={() => handleRemoveParticipant(participant)}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#1F1F1F] text-[#FF2B2B] transition hover:bg-[#2A2A2A] disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Remove participant"
                    >
                      {removingParticipantKey === getParticipantKey(participant) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <footer className="grid grid-cols-2 gap-3 px-7 py-6">
          <button
            type="button"
            onClick={() => onCancelMeeting(meetingData)}
            className="h-11 rounded-md bg-[#F94242] text-sm font-bold text-white transition hover:bg-[#E73535]"
          >
            Cancel Meeting
          </button>
          <a
            href={meetingData.meetLink || "#"}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!meetingData.meetLink}
            onClick={(event) => {
              if (!meetingData.meetLink) event.preventDefault();
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#E8D1AB] text-sm font-bold text-black transition hover:bg-[#DFC395] aria-disabled:pointer-events-none aria-disabled:opacity-60"
          >
            Join Meeting <ExternalLink className="h-4 w-4" />
          </a>
        </footer>
      </aside>

      {showAddParticipants ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 px-4">
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
                          {(user.name || user.email || "User").slice(0, 2).toUpperCase()}
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
                onClick={handleAddParticipants}
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
