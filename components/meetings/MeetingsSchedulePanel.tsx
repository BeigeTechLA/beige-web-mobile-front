"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ExternalLink, Loader2, MoreVertical, RefreshCw, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import CreateMeetingModal from "@/components/meetings/CreateMeetingModal";
import DeleteMeetingConfirmModal from "@/components/meetings/DeleteMeetingConfirmModal";
import MeetingDetailsModal from "@/components/meetings/MeetingDetailsModal";
import { meetingsApi, type MeetingItem, type MeetingParticipantRef } from "@/lib/meetingsApi";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";
import { formatMeetingStatusLabel, getEffectiveMeetingStatus, getMeetingStatusClasses } from "@/lib/meetingStatus";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RoleVariant = "admin" | "sales" | "client" | "cp" | "pm";

interface MeetingsSchedulePanelProps {
  role?: RoleVariant;
  orderId?: string | number | null;
}

const resolveId = (value: unknown) => {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    const source = value as { _id?: string | number; id?: string | number; user_id?: string | number };
    const nested = source._id || source.id || source.user_id;
    if (typeof nested === "string" || typeof nested === "number") return String(nested);
  }
  return "";
};

const normalizeParticipant = (member?: MeetingParticipantRef | null) => {
  if (!member) return null;
  const id = resolveId(member.id);
  const name = String(member.name || "").trim();
  const email = String(member.email || "").trim();
  return {
    id,
    name: name || email || "Participant",
    email,
    profile_picture: member.profile_picture || null,
    role: member.role || null,
  };
};

const getMeetingParticipants = (meeting: MeetingItem) => {
  const values = [
    normalizeParticipant(meeting.client || undefined),
    normalizeParticipant(meeting.admin || undefined),
    ...(meeting.cps || []).map((item) => normalizeParticipant(item)).filter(Boolean),
    ...(meeting.participants || []).map((item) => normalizeParticipant(item)).filter(Boolean),
  ].filter(Boolean) as Array<ReturnType<typeof normalizeParticipant>>;

  return values.filter((item, index, array) => {
    const key = String(item?.id || item?.email || item?.name || "");
    return key && array.findIndex((entry) => String(entry?.id || entry?.email || entry?.name || "") === key) === index;
  });
};

const getParticipantResponse = (meeting: MeetingItem, userId?: string | number) => {
  const normalizedUserId = String(userId || "");
  if (!normalizedUserId) return "pending";

  const response = (meeting.participant_responses || []).find((item) => {
    const raw = item.user_id;
    if (!raw) return false;
    if (typeof raw === "string" || typeof raw === "number") return String(raw) === normalizedUserId;
    return String(raw._id || raw.id || "") === normalizedUserId;
  });

  return response?.response || "pending";
};

const formatDateTime = (value?: string) => {
  if (!value) return "No schedule";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No schedule";
  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const StatusBadge = ({ status }: { status?: string }) => {
  const normalized = String(status || "pending").toLowerCase();
  return (
    <span className={cn("rounded-full border px-4 py-1.5 text-sm font-medium", getMeetingStatusClasses(normalized))}>
      {formatMeetingStatusLabel(normalized)}
    </span>
  );
};

const MemberStack = ({ meeting }: { meeting: MeetingItem }) => {
  const participants = getMeetingParticipants(meeting);
  const visible = participants.slice(0, 3);

  return (
    <div className="flex -space-x-2">
      {visible.map((member, index) => (
        <div
          key={`${member?.id || member?.email || member?.name}-${index}`}
          className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-[#111111] bg-[#202020]"
          title={member?.name || "Participant"}
        >
          {member?.profile_picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={member.profile_picture} alt={member.name || "Participant"} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-white">
              {String(member?.name || "P")
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase() || "")
                .join("") || "P"}
            </div>
          )}
        </div>
      ))}

      {participants.length > 3 ? (
        <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#111111] bg-[#E5D5B8] text-[10px] font-bold text-black">
          +{participants.length - 3}
        </div>
      ) : null}
    </div>
  );
};

export default function MeetingsSchedulePanel({ orderId, role = "admin" }: MeetingsSchedulePanelProps) {
  const { user } = useAuth();
  const params = useParams<Record<string, string | string[] | undefined>>();
  const paramOrderId =
    params?.id ||
    params?.orderId ||
    params?.bookingId ||
    params?.projectId ||
    params?.shootId;
  const normalizedParamOrderId = Array.isArray(paramOrderId) ? paramOrderId[0] : paramOrderId;
  const resolvedOrderId = orderId ?? normalizedParamOrderId ?? null;
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingItem | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [meetingPendingDelete, setMeetingPendingDelete] = useState<MeetingItem | null>(null);
  const [isDeletingMeeting, setIsDeletingMeeting] = useState(false);
  const [respondingMeetingId, setRespondingMeetingId] = useState<string | null>(null);

  const currentUserId = useMemo(() => {
    if (!user || typeof user !== "object") return undefined;
    const value = (user as { id?: string | number }).id;
    return value != null ? value : undefined;
  }, [user]);
  const currentUserEmail = useMemo(() => {
    if (!user || typeof user !== "object") return "";
    return String((user as { email?: string }).email || "");
  }, [user]);
  const canCreateMeeting = role === "admin" || role === "client";
  const canDeleteMeeting = role === "admin" || role === "client";

  const loadMeetings = useCallback(async () => {
    if (!resolvedOrderId) {
      setMeetings([]);
      setLoading(false);
      setError("Order ID is unavailable for meetings.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await meetingsApi.getByOrderId(resolvedOrderId, {
        sortBy: "meeting_date_time:desc",
        limit: 100,
        page: 1,
      });
      setMeetings(response?.results || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load meetings");
    } finally {
      setLoading(false);
    }
  }, [resolvedOrderId]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const availableStatuses = useMemo(() => {
    const values = Array.from(
      new Set(meetings.map((meeting) => String(getEffectiveMeetingStatus(meeting) || "pending").toLowerCase()))
    );
    return ["all", ...values];
  }, [meetings]);

  const filteredMeetings = useMemo(() => {
    if (statusFilter === "all") return meetings;
    return meetings.filter((meeting) => String(getEffectiveMeetingStatus(meeting) || "").toLowerCase() === statusFilter);
  }, [meetings, statusFilter]);

  const handleRefresh = async () => {
    await loadMeetings();
    toast.success("Meetings refreshed");
  };

  const handleRespond = async (meetingId: string | number, response: "accepted" | "declined") => {
    setRespondingMeetingId(String(meetingId));
    try {
      await meetingsApi.respondToInvitation(meetingId, { response });
      toast.success(`Invitation ${response === "accepted" ? "accepted" : "rejected"}`);
      await loadMeetings();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update invitation");
    } finally {
      setRespondingMeetingId(null);
    }
  };

  return (
    <>
      <div className="mt-6 rounded-2xl border border-[#222222] bg-[#111111] p-6">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Meeting Schedule</h3>
            <p className="mt-1 text-sm text-white/45">
              {role === "client"
                ? "Track project meetings, create them when needed, and open the join link when available."
                : "View and create meetings for this project using the live meetings API."}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="min-w-[170px] border-white/10 bg-[#1A1A1A] text-white data-[placeholder]:text-white/50">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#111111] text-white">
                {availableStatuses.map((status) => (
                  <SelectItem key={status} value={status} className="focus:bg-[#1E1E1E] focus:text-white">
                    {status === "all" ? "All Status" : formatMeetingStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="border-white/10 bg-[#1A1A1A] text-white hover:bg-[#242424]"
            >
              <RefreshCw size={16} className={cn(loading && "animate-spin")} />
              Refresh
            </Button>

            {canCreateMeeting ? (
              <Button onClick={() => setIsModalOpen(true)} className="bg-white text-black hover:bg-zinc-200">
                Create New Meeting
              </Button>
            ) : null}
          </div>
        </div>

        <div className="w-full">
          <div className="hidden grid-cols-[2fr_1fr_1fr_auto] border-b border-[#222222] px-2 pb-4 text-base font-medium text-[#888888] lg:grid">
            <span>Date & Time</span>
            <span>Members</span>
            <span>Status</span>
            <span className="text-right">Action</span>
          </div>
          <div className="flex justify-between border-b border-[#222222] px-2 pb-4 text-sm font-medium text-[#E8D1AB] lg:hidden">
            <span>Members</span>
            <span>Status</span>
          </div>

          {loading ? 
          <div className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 border-[#3D3D3D] bg-[#171717]" 
        }`}>
        <Loader2 className={`animate-spin text-[#BFA780]`} size={40} />
      </div>: error ? (
            <div className="px-2 py-10 text-center text-sm text-[#ff8e8e]">{error}</div>
          ) : filteredMeetings.length === 0 ? (
            <div className="px-2 py-10 text-center text-sm text-white/45">No meetings found for this project yet.</div>
          ) : (
            <div className="flex flex-col">
              {filteredMeetings.map((meeting) => {
                const meetingId = String(meeting.id || "");
                const participants = getMeetingParticipants(meeting);
                const isExpanded = expandedId === meetingId;
                const effectiveStatus = getEffectiveMeetingStatus(meeting);
                const isCompleted = effectiveStatus === "completed";
                const currentResponse = getParticipantResponse(meeting, currentUserId);
                const createdById = resolveId(meeting.created_by?.id);
                const isClientCreatedBySelf =
                  role === "client" &&
                  !!currentUserId &&
                  !!createdById &&
                  String(currentUserId) === createdById;
                const canRespond =
                  !!meeting.id &&
                  !!currentUserId &&
                  role !== "admin" &&
                  !isClientCreatedBySelf &&
                  !["completed", "cancelled"].includes(String(effectiveStatus || "").toLowerCase());
                const canDeleteThisMeeting = canDeleteMeeting && !isClientCreatedBySelf;
                const isResponding = respondingMeetingId === meetingId;

                return (
                  <React.Fragment key={meetingId}>
                    <div className="hidden grid-cols-[2fr_1fr_1fr_auto] items-center border-b border-[#222222] px-2 py-4 transition-colors hover:bg-white/[0.02] lg:grid">
                      <div>
                        <div className="text-base font-medium text-[#E0E0E0]">{formatDateTime(meeting.meeting_date_time)}</div>
                        {meeting.meeting_title ? <div className="mt-1 text-sm text-white/45">{meeting.meeting_title}</div> : null}
                      </div>
                      <MemberStack meeting={meeting} />
                      <div>
                        <StatusBadge status={effectiveStatus} />
                        {canRespond ? (
                          <p className="mt-2 text-xs capitalize text-white/45">Your response: {currentResponse}</p>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        {canRespond && currentResponse !== "accepted" ? (
                          <Button
                            type="button"
                            onClick={() => handleRespond(meeting.id as string | number, "accepted")}
                            disabled={isResponding}
                            className="h-9 bg-emerald-500 px-3 text-white hover:bg-emerald-600"
                          >
                            {isResponding ? <RefreshCw size={14} className="animate-spin" /> : null}
                            Accept
                          </Button>
                        ) : null}
                        {canRespond && currentResponse !== "declined" ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleRespond(meeting.id as string | number, "declined")}
                            disabled={isResponding}
                            className="h-9 border-rose-400/20 bg-rose-500/10 px-3 text-rose-200 hover:bg-rose-500/20"
                          >
                            Reject
                          </Button>
                        ) : null}
                        {meeting.meetLink ? (
                          <a
                            href={meeting.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-disabled={isCompleted}
                            onClick={(event) => {
                              if (isCompleted) {
                                event.preventDefault();
                              }
                            }}
                            className={cn(
                              "inline-flex items-center gap-1 text-sm font-medium",
                              isCompleted ? "cursor-not-allowed text-white/30" : "text-[#E5D5B8] hover:underline"
                            )}
                          >
                            Join <ExternalLink size={14} />
                          </a>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setSelectedMeeting(meeting)}
                          className="text-[#888888] transition-colors hover:text-white"
                        >
                          <MoreVertical size={20} />
                        </button>
                        {canDeleteThisMeeting ? (
                          <button
                            type="button"
                            onClick={() => setMeetingPendingDelete(meeting)}
                            className="inline-flex items-center gap-1 text-sm font-medium text-rose-300 hover:text-rose-200"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-col border-b border-[#222222] lg:hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : meetingId)}
                        className="flex items-center justify-between py-4 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("transition-transform duration-200", isExpanded ? "rotate-180 text-[#E8D1AB]" : "text-[#888888]")}>
                            <ChevronDown size={20} />
                          </div>
                          <MemberStack meeting={meeting} />
                        </div>
                        <StatusBadge status={effectiveStatus} />
                      </button>

                      {isExpanded ? (
                        <div className="grid grid-cols-2 gap-y-4 pb-6 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
                          <div>
                            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#888888]">Date & Time</p>
                            <p className="text-white">{formatDateTime(meeting.meeting_date_time)}</p>
                          </div>
                          <div className="text-right">
                            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#888888]">Members</p>
                            <p className="text-white">{participants.length || 0}</p>
                          </div>
                          {meeting.meeting_title ? (
                            <div className="col-span-2">
                              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#888888]">Title</p>
                              <p className="text-white">{meeting.meeting_title}</p>
                            </div>
                          ) : null}
                          {meeting.description ? (
                            <div className="col-span-2">
                              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#888888]">Description</p>
                              <p className="text-white/75">{meeting.description}</p>
                            </div>
                          ) : null}
                          {canRespond ? (
                            <div className="col-span-2">
                              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#888888]">Your Response</p>
                              <p className="capitalize text-white">{currentResponse}</p>
                            </div>
                          ) : null}
                          <div className="col-span-2 flex items-center justify-between">
                            <p className="text-xs font-medium uppercase tracking-wider text-[#888888]">Action</p>
                            <div className="flex flex-wrap items-center gap-4">
                              {canRespond && currentResponse !== "accepted" ? (
                                <button
                                  type="button"
                                  onClick={() => handleRespond(meeting.id as string | number, "accepted")}
                                  disabled={isResponding}
                                  className="text-sm font-semibold text-emerald-300 hover:underline disabled:opacity-50"
                                >
                                  Accept
                                </button>
                              ) : null}
                              {canRespond && currentResponse !== "declined" ? (
                                <button
                                  type="button"
                                  onClick={() => handleRespond(meeting.id as string | number, "declined")}
                                  disabled={isResponding}
                                  className="text-sm font-semibold text-rose-300 hover:underline disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => setSelectedMeeting(meeting)}
                                className="text-sm font-semibold text-[#E5D5B8] hover:underline"
                              >
                                View Details
                              </button>
                              {canDeleteThisMeeting ? (
                                <button
                                  type="button"
                                  onClick={() => setMeetingPendingDelete(meeting)}
                                  className="text-sm font-semibold text-rose-300 hover:underline"
                                >
                                  Delete
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <CreateMeetingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        orderId={resolvedOrderId}
        role={role}
        onCreated={loadMeetings}
      />

      <MeetingDetailsModal
        open={!!selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
        meeting={selectedMeeting}
        role={role}
        currentUserId={currentUserId}
        currentUserEmail={currentUserEmail}
        onUpdated={loadMeetings}
      />

      <DeleteMeetingConfirmModal
        open={!!meetingPendingDelete}
        onClose={() => {
          if (!isDeletingMeeting) {
            setMeetingPendingDelete(null);
          }
        }}
        meetingTitle={meetingPendingDelete?.meeting_title || meetingPendingDelete?.order?.name || "Meeting"}
        isDeleting={isDeletingMeeting}
        onConfirm={async () => {
          if (!meetingPendingDelete?.id) return;
          setIsDeletingMeeting(true);
          try {
            await meetingsApi.deleteMeeting(meetingPendingDelete.id);
            toast.success("Meeting deleted");
            if (selectedMeeting?.id === meetingPendingDelete.id) {
              setSelectedMeeting(null);
            }
            setMeetingPendingDelete(null);
            await loadMeetings();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete meeting");
          } finally {
            setIsDeletingMeeting(false);
          }
        }}
      />
    </>
  );
}
