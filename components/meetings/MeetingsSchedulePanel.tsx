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
import { usePermissions } from "@/lib/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { canRespondToMeeting, formatMeetingStatusLabel, getEffectiveMeetingStatus, getMeetingStatusClasses } from "@/lib/meetingStatus";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ParticipantAvatarStack from "./AvatarStack";

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
  const values = (meeting.participants || [])
    .map((item) => normalizeParticipant(item))
    .filter(Boolean) as Array<ReturnType<typeof normalizeParticipant>>;

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

const formatInvitationResponse = (response: string) => {
  if (response === "declined") return "Rejected";
  if (response === "accepted") return "Accepted";
  return "Pending";
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

const StatusBadge = ({ status, isDark = true }: { status?: string; isDark?: boolean }) => {
  const normalized = String(status || "pending").toLowerCase();
  return (
    <span className={cn("rounded-full border px-4 py-1.5 text-sm font-medium", getMeetingStatusClasses(normalized, isDark))}>
      {formatMeetingStatusLabel(normalized)}
    </span>
  );
};

const MemberStack = ({ meeting, isDark = true }: { meeting: MeetingItem; isDark: boolean }) => {
  const participants = getMeetingParticipants(meeting);
  const visible = participants.slice(0, 3);

  return (
    <div className="flex -space-x-2">
      {visible.map((member, index) => (
        <div
          key={`${member?.id || member?.email || member?.name}-${index}`}
          className={`relative h-8 w-8 overflow-hidden rounded-full border-2  ${isDark ? "border-[#111111] bg-[#202020]" : "border-[#E8D1AB] bg-[#E8D1AB]"}`}
          title={member?.name || "Participant"}
        >
          {member?.profile_picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={member.profile_picture} alt={member.name || "Participant"} className="h-full w-full object-cover" />
          ) : (
            <div className={`flex h-full w-full items-center justify-center text-[10px] font-semibold ${isDark ? "text-white" : "text-black"}`}>
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
        <div className={`z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-[10px] font-bold  ${isDark ? "border-[#111111] bg-[#202020] text-white" : "border-[#E8D1AB] bg-[#E8D1AB] text-black"}`}>
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
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
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

  useEffect(() => {
    setMounted(true);
  }, []);
  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  const currentUserId = useMemo(() => {
    if (!user || typeof user !== "object") return undefined;
    const value = (user as { id?: string | number }).id;
    return value != null ? value : undefined;
  }, [user]);
  const currentUserEmail = useMemo(() => {
    if (!user || typeof user !== "object") return "";
    return String((user as { email?: string }).email || "");
  }, [user]);
  const { canCreate: canCreateByPermission, canDelete: canDeleteByPermission } = usePermissions("meetings");
  const canCreateMeeting = canCreateByPermission;
  const canDeleteMeeting = canDeleteByPermission;

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
      <div className={`${isDark ? "bg-[#111111]" : "bg-[#FFFFFF]"}`}>
        <div className={`p-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between`}>
          <div>
            <h3 className={`lg:text-lg font-bold ${isDark ? "text-white" : "text-black"}`}>Meeting Schedule</h3>
            <p className={`mt-1 text-sm ${isDark ? "text-white/45" : "text-[#323232]"}`}>
              {role === "client"
                ? "Track project meetings, create them when needed, and open the join link when available."
                : role === "cp"
                  ? "View project meetings and open the join link when available."
                  : "View and create meetings for this project using the live meetings API."}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className={`flex gap-3`}>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={`min-w-[170px] ${isDark ? "border-white/10 bg-[#1A1A1A] text-white data-[placeholder]:text-white/50 " : "bg-[#F0F0F0] border-[#E3E3E3] text-[#323232]"} `}>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className={`${isDark ? "bg-[#1A1A1A] border-white/10 text-white " : "bg-[#F0F0F0] border-[#E3E3E3] text-[#323232]"}`}>
                  {availableStatuses.map((status) => (
                    <SelectItem key={status} value={status} className={isDark ? "focus:bg-[#1E1E1E] focus:text-white" : "focus:bg-[#E8D1AB] focus:text-black"}>
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
                className={`h-12 ${isDark ? "border-white/10 bg-[#1A1A1A] text-white hover:bg-[#242424]" : "bg-[#F0F0F0] border-[#E3E3E3] text-[#323232] hover:bg-zinc-50"}`}
              >
                <RefreshCw size={16} className={cn(loading && "animate-spin")} />
                <span>Refresh</span>
              </Button>
            </div>


            <Button
              onClick={() => {
                if (!canCreateMeeting) return;
                setIsModalOpen(true);
              }}
              disabled={!canCreateMeeting}
              title={canCreateMeeting ? "Create New Meeting" : "Create permission not allowed"}
              className={`h-13 lg:h-12 ${isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black hover:bg-black/80 text-[#E8D1AB]"} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              Create New Meeting
            </Button>
          </div>
        </div>

        <div className={`overflow-x-auto `}  >
          <div className={`hidden grid-cols-[3fr_1fr_1fr_2fr] p-5 text-sm font-medium lg:grid border-y ${isDark ? "border-[#3D3D3D] text-[#E8D1AB] bg-[#202020]" : "bg-[#F4F5F7] text-black border-[#E5E5E5]"}`}>
            <span>Date & Time</span>
            <span>Members</span>
            <span>Status</span>
            <span className="text-right">Action</span>
          </div>
          <div className={`flex justify-between p-5 text-sm font-medium lg:hidden border-y ${isDark ? "border-[#3D3D3D] text-[#E8D1AB] bg-[#202020]" : "bg-[#F4F5F7] text-black border-[#E5E5E5]"}`}>
            <span>Members</span>
            <span>Status</span>
          </div>

          {loading ?
            <div className={`flex items-center justify-center py-20 border transition-colors duration-300 ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-[#E5E5E5] bg-[#fff]"} `}>
              <Loader2 className={`animate-spin text-[#BFA780]`} size={40} />
            </div> : error ? (
              <div className="px-2 py-10 text-center text-sm text-[#ff8e8e]">{error}</div>
            ) : filteredMeetings.length === 0 ? (
              <div className={`px-2 py-10 text-center text-sm ${isDark ? "text-white/45" : "text-black/75"}`}>No meetings found for this project yet.</div>
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
                  const isWithinResponseWindow = canRespondToMeeting(meeting);
                  const canRespond =
                    !!meeting.id &&
                    !!currentUserId &&
                    role !== "admin" &&
                    !isClientCreatedBySelf &&
                    isWithinResponseWindow &&
                    !["completed", "cancelled"].includes(String(effectiveStatus || "").toLowerCase());
                  const canDeleteThisMeeting = role === "admin";
                  const isResponding = respondingMeetingId === meetingId;

                  return (
                    <React.Fragment key={meetingId}>
                      <div className={`hidden grid-cols-[3fr_1fr_1fr_2fr] items-center border-b px-5 py-4 transition-colors lg:grid ${isDark ? "border-[#222222] hover:bg-white/[0.02]" : "border-white hover:bg-[#F4F5F7]"}`}>
                        <div>
                          <div className={`text-base font-medium ${isDark ? "text-[#E0E0E0]" : "text-black"}`}>{formatDateTime(meeting.meeting_date_time)}</div>
                          {meeting.meeting_title ? <div className={`mt-1 text-sm ${isDark ? "text-white/45" : "text-black/75"}`}>{meeting.meeting_title}</div> : null}
                        </div>
                        {/* <MemberStack meeting={meeting} isDark={isDark} /> */}
                        <div>
                          <ParticipantAvatarStack meeting={meeting} isDark={isDark} />
                        </div>
                        <div>
                          <StatusBadge status={effectiveStatus} isDark={isDark} />
                          {canRespond ? (
                            <p className={`mt-2 text-xs capitalize ${isDark ? "text-white/45" : "text-black/75"}`}>Your response: {formatInvitationResponse(currentResponse)}</p>
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
                              className={`h-9 px-3 ${isDark ? "text-rose-200 border-rose-400/20 bg-rose-500/10 hover:bg-rose-500/20" : "text-red-500 border-rose-400/20 bg-rose-500/10 hover:bg-rose-500/20"}`}
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
                            className={`transition-colors ${isDark ? "text-[#888888] hover:text-white" : "text-[#000] hover:text-[#323232]"}`}
                          >
                            <MoreVertical size={20} />
                          </button>
                          {canDeleteThisMeeting ? (
                            <button
                              type="button"
                              onClick={() => setMeetingPendingDelete(meeting)}
                              className={`inline-flex items-center gap-1 text-sm font-medium ${isDark ? "text-rose-300 hover:text-rose-200" : "text-red-500 hover:text-red-400"}`}
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-col lg:hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : meetingId)}
                          className="flex items-center justify-between p-5 text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn("transition-transform duration-200 rounded-full border p-1", isExpanded ? "rotate-180 text-[#E8D1AB]" : "text-[#888888]", isDark ? "border-[#4B4B4B]" : "border-[#D9D9D9]")}>
                              <ChevronDown size={16} />
                            </div>
                            <MemberStack meeting={meeting} isDark={isDark} />
                          </div>
                          <StatusBadge status={effectiveStatus} isDark={isDark} />
                        </button>

                        {isExpanded ? (
                          <div className={`grid grid-cols-2 gap-y-4 px-5 pb-6 text-sm animate-in fade-in slide-in-from-top-2 duration-200 border-b ${isDark ? "border-[#3D3D3D]" : "border-[#E5E5E5]"}`}>
                            <div>
                              <p className={`mb-1 text-xs font-medium uppercase tracking-wider ${isDark ? "text-[#888888]" : "text-black"}`}>Date & Time</p>
                              <p className={isDark ? "text-white" : "text-[#A1A1A1]"}>{formatDateTime(meeting.meeting_date_time)}</p>
                            </div>
                            <div className="text-right">
                              <p className={`mb-1 text-xs font-medium uppercase tracking-wider ${isDark ? "text-[#888888]" : "text-black"}`}>Members</p>
                              <p className={isDark ? "text-white" : "text-[#A1A1A1]"}>{participants.length || 0}</p>
                            </div>
                            {meeting.meeting_title ? (
                              <div className="col-span-2">
                                <p className={`mb-1 text-xs font-medium uppercase tracking-wider ${isDark ? "text-[#888888]" : "text-black"}`}>Title</p>
                                <p className={isDark ? "text-white" : "text-[#A1A1A1]"}>{meeting.meeting_title}</p>
                              </div>
                            ) : null}
                            {meeting.description ? (
                              <div className="col-span-2">
                                <p className={`mb-1 text-xs font-medium uppercase tracking-wider ${isDark ? "text-[#888888]" : "text-black"}`}>Description</p>
                                <p className={isDark ? "text-white/75" : "text-[#A1A1A1]"}>{meeting.description}</p>
                              </div>
                            ) : null}
                            {canRespond ? (
                              <div className="col-span-2">
                                <p className={`mb-1 text-xs font-medium uppercase tracking-wider ${isDark ? "text-[#888888]" : "text-black"}`}>Your Response</p>
                                <p className={`capitalize ${isDark ? "text-white" : "text-[#A1A1A1]"}`}>{formatInvitationResponse(currentResponse)}</p>
                              </div>
                            ) : null}
                            <div className="col-span-2 flex items-center justify-between">
                              <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? "text-[#888888]" : "text-black"}`}>Action</p>
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
        isDark={isDark}
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
