"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, ExternalLink, Eye, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import CreateMeetingModal from "@/components/meetings/CreateMeetingModal";
import DeleteMeetingConfirmModal from "@/components/meetings/DeleteMeetingConfirmModal";
import MeetingDetailsModal from "@/components/meetings/MeetingDetailsModal";
import { useAuth } from "@/lib/hooks/useAuth";
import { meetingsApi, type MeetingItem } from "@/lib/meetingsApi";
import { formatMeetingStatusLabel, getEffectiveMeetingStatus, getMeetingStatusClasses } from "@/lib/meetingStatus";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import EmptyMeetingState from "./EmptyMeetingState";

type RoleVariant = "admin" | "sales" | "client" | "cp" | "pm";

interface MeetingsWorkspaceViewProps {
  role: RoleVariant;
}

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

const getIdentityId = (value: unknown) => {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    const source = value as { _id?: string | number; id?: string | number; user_id?: string | number };
    return String(source._id || source.id || source.user_id || "");
  }
  return "";
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

const getShootLink = (role: RoleVariant, meeting: MeetingItem) => {
  const orderId = meeting.order?.id;
  if (!orderId) return null;
  if (role === "admin") return `/admin/shoots/${orderId}`;
  if (role === "sales") return `/sales/shoots/${orderId}`;
  if (role === "pm") return `/production-manager/shoots/${orderId}`;
  return null;
};

export default function MeetingsWorkspaceView({ role }: MeetingsWorkspaceViewProps) {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingItem | null>(null);
  const [meetingPendingDelete, setMeetingPendingDelete] = useState<MeetingItem | null>(null);
  const [isDeletingMeeting, setIsDeletingMeeting] = useState(false);
  const [search, setSearch] = useState("");
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
    setLoading(true);
    setError("");
    try {
      const response =
        role === "admin"
          ? await meetingsApi.listAll({ limit: 100, page: 1, sortBy: "meeting_date_time:desc" })
          : currentUserId
            ? await meetingsApi.listByUser(currentUserId, { limit: 100, page: 1, sortBy: "meeting_date_time:desc" })
            : { results: [] };

      setMeetings(response?.results || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load meetings");
    } finally {
      setLoading(false);
    }
  }, [currentUserId, role]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const filteredMeetings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return meetings;

    return meetings.filter((meeting) =>
      [
        meeting.meeting_title,
        meeting.order?.name,
        meeting.description,
        meeting.admin?.name,
        ...(meeting.cps || []).map((participant) => participant.name || participant.email),
        ...(meeting.participants || []).map((participant) => participant.name || participant.email),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))
    );
  }, [meetings, search]);

  const handleRespond = useCallback(
    async (meetingId: string | number, response: "accepted" | "declined") => {
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
    },
    [loadMeetings]
  );

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-0 flex-col overflow-hidden p-4 lg:px-10 lg:py-9">
      <div className="mb-6 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Meetings</h1>
          <p className="mt-1 text-sm text-white/45">
            {role === "admin"
              ? "Browse scheduled meetings across shoots and open each shoot for full management."
              : "Browse your scheduled meetings and jump into the related shoot when needed."}
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search meetings, shoots, or members"
              className="border-white/10 bg-[#141414] pl-10 text-white placeholder:text-white/30"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                await loadMeetings();
                toast.success("Meetings refreshed");
              }}
              className="border-white/10 bg-[#1A1A1A] text-white hover:bg-[#222222]"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
            <Button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              disabled={!canCreateMeeting}
              className="bg-[#E5D5B8] text-black hover:bg-[#d9c5a0]"
            >
              Create Meeting
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[#222222] bg-[#111111] p-5">
        {loading ? (
          <div className="py-16 text-center text-sm text-white/45">Loading meetings...</div>
        ) : error ? (
          <div className="py-16 text-center text-sm text-[#ff8e8e]">{error}</div>
        ) : filteredMeetings.length === 0 ? (
          <div className="py-16 text-center text-sm text-white/45">
            {search.trim()
              ? "No meetings match your search."
              : <EmptyMeetingState />}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMeetings.map((meeting) => {
              const shootLink = getShootLink(role, meeting);
              const effectiveStatus = getEffectiveMeetingStatus(meeting);
              const isCompleted = effectiveStatus === "completed";
              const currentResponse = getParticipantResponse(meeting, currentUserId);
              const createdById = getIdentityId(meeting.created_by?.id);
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
              const isResponding = respondingMeetingId === String(meeting.id || "");

              return (
                <div
                  key={String(meeting.id || Math.random())}
                  className="rounded-2xl border border-white/10 bg-[#151515] p-5 transition-colors hover:border-white/20"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="truncate text-lg font-semibold text-white">
                          {meeting.meeting_title || meeting.order?.name || "Meeting"}
                        </h2>
                        <span className={cn("rounded-full border px-3 py-1 text-xs font-medium", getMeetingStatusClasses(effectiveStatus))}>
                          {formatMeetingStatusLabel(effectiveStatus)}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/55">
                        <span className="inline-flex items-center gap-2">
                          <CalendarClock size={14} />
                          {formatDateTime(meeting.meeting_date_time)}
                        </span>
                        {meeting.order?.name ? <span>Order: {meeting.order.name}</span> : null}
                        {canRespond ? (
                          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-medium capitalize text-amber-300">
                            Your response: {currentResponse}
                          </span>
                        ) : null}
                      </div>
                      {meeting.description ? <p className="mt-3 line-clamp-2 text-sm text-white/65">{meeting.description}</p> : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {canRespond && currentResponse !== "accepted" ? (
                        <Button
                          type="button"
                          onClick={() => handleRespond(meeting.id as string | number, "accepted")}
                          disabled={isResponding}
                          className="bg-emerald-500 text-white hover:bg-emerald-600"
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
                          className="border-rose-400/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
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
                            "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium",
                            isCompleted
                              ? "cursor-not-allowed border-white/10 bg-[#111111] text-white/30"
                              : "border-white/10 bg-[#1A1A1A] text-white hover:bg-[#222222]"
                          )}
                        >
                          Join Meeting
                          <ExternalLink size={14} />
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setSelectedMeeting(meeting)}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#222222]"
                      >
                        <Eye size={14} />
                        View Details
                      </button>
                      {canDeleteThisMeeting ? (
                        <button
                          type="button"
                          onClick={() => setMeetingPendingDelete(meeting)}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200 hover:bg-rose-500/20"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      ) : null}
                      {shootLink ? (
                        <Link
                          href={shootLink}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#E5D5B8] px-4 py-2 text-sm font-semibold text-black hover:bg-[#d9c5a0]"
                        >
                          Open Shoot
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateMeetingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
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
    </div>
  );
}
