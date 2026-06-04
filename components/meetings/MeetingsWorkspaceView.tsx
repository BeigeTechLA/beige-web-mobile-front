"use client";

import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { CalendarClock, ExternalLink, Eye, Loader2, RefreshCw, Search, SquarePen, Trash2 } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/landing/ui/tooltip"
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import ParticipantAvatarStack from "./AvatarStack";

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

  const { isDark } = useResolvedTheme();

  const currentUserId = useMemo(() => {
    if (!user || typeof user !== "object") return undefined;
    const value = (user as { id?: string | number }).id;
    return value != null ? value : undefined;
  }, [user]);
  const currentUserEmail = useMemo(() => {
    if (!user || typeof user !== "object") return "";
    return String((user as { email?: string }).email || "");
  }, [user]);
  const normalizedUserRole = String((user as { role?: string; userRole?: string } | null)?.role || (user as { role?: string; userRole?: string } | null)?.userRole || "").trim().toLowerCase();
  const isSalesAdminView = role === "sales" && normalizedUserRole === "sales_admin";
  const isAdminView = role === "admin" || isSalesAdminView;
  const effectiveRoleForActions: RoleVariant = isAdminView ? "admin" : role;
  const canCreateMeeting = effectiveRoleForActions === "admin" || effectiveRoleForActions === "client";
  const canDeleteMeeting = effectiveRoleForActions === "admin" || effectiveRoleForActions === "client";

  const loadMeetings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response =
        isAdminView
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
  }, [currentUserId, isAdminView]);

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
    <div className={`flex h-[calc(100vh-120px)] min-h-0 flex-col overflow-hidden p-4 lg:px-10 lg:py-9 transition-colors duration-200`}>

      {/* Top Actions Panel */}
      <div className="mb-3 lg:mb-6 flex flex-col gap-4">
        <div>
          <h1 className={`text-xl lg:text-2xl font-bold transition-colors ${isDark ? "text-white" : "text-black"}`}>
            Meetings
          </h1>
          <p className={`mt-1 text-xs lg:text-sm transition-colors ${isDark ? "text-white/45" : "text-[#171717B2]"}`}>
            {role === "admin"
              ? "Browse scheduled meetings across shoots and open each shoot for full management."
              : "Browse your scheduled meetings and jump into the related shoot when needed."}
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input Box Container */}
          <div className="relative w-full lg:max-w-sm">
            <Search size={16} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-white/35" : "text-[#171717B2]"}`} />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search meetings, shoots, or members"
              className={`pl-10 text-xs lg:text-sm transition-colors ${isDark
                ? "border-white/10 bg-[#141414] text-white placeholder:text-white/30 focus:border-white/20"
                : "border-zinc-200 bg-white text-black placeholder:text-zinc-400 focus:border-zinc-400"
                }`}
            />
          </div>

          {/* Primary Header Controls Group */}
          <div className="flex items-center gap-2 lg:gap-3 w-full lg:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                await loadMeetings();
                toast.success("Meetings refreshed");
              }}
              className={`border ${isDark
                ? "border-white/10 bg-[#1A1A1A] text-white hover:bg-[#222222]"
                : "border-[#E3E3E3] bg-[#F0F0F0] text-[#323232] hover:bg-[#323232]/50"
                }`}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
            {canCreateMeeting ? (
              <Button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className={`text-black ${isDark ? "bg-[#E5D5B8] hover:bg-[#d9c5a0]" : "bg-[#E8D1AB] hover:bg-[#E8D1AB]/80"}`}
              >
                Create Meeting
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Meetings Stream Container */}
      <div className={`min-h-0 flex-1 overflow-y-auto rounded-2xl border p-4 lg:p-5 transition-colors ${isDark ? "border-[#222222] bg-black" : "border-zinc-200 bg-white"}`}>
        {loading ? (
          <div className={`flex items-center justify-center py-20 border rounded-2xl transition-colors ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-zinc-200 bg-white"}`}>
            <Loader2 className="animate-spin text-[#BFA780]" size={40} />
          </div>
        ) : error ? (
          <div className="py-16 text-center text-xs lg:text-sm font-medium text-[#ff8e8e]">{error}</div>
        ) : filteredMeetings.length === 0 ? (
          <div className={`py-16 text-center text-xs lg:text-sm ${isDark ? "text-white/45" : "text-[#171717B2]"}`}>
            {search.trim() ? "No meetings match your search." : <EmptyMeetingState />}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMeetings.map((meeting) => {
              const shootLink = getShootLink(role, meeting);
              const effectiveStatus = getEffectiveMeetingStatus(meeting);
              const isCompleted = effectiveStatus === "completed";
              const isCancelled = String(effectiveStatus || "").toLowerCase() === "cancelled";
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
                !isAdminView &&
                !isClientCreatedBySelf &&
                !["completed", "cancelled"].includes(String(effectiveStatus || "").toLowerCase());
              const canDeleteThisMeeting = canDeleteMeeting && !isClientCreatedBySelf;
              const isResponding = respondingMeetingId === String(meeting.id || "");

              return (
                <div
                  key={String(meeting.id || Math.random())}
                  className={`roundex-lg lg:rounded-2xl border p-3 lg:p-5 transition-colors ${isDark? "border-[#3D3D3D] bg-[#171717] hover:border-white/20": "border-gray-200 bg-[#F4F5F7] shadow-sm hover:border-gray-300"}`}
                >
                  <div className="grid grid-cols-1 gap-3 lg:gap-5 lg:grid-cols-12 lg:items-center">

                    <div className="min-w-0 col-span-6">
                      <div className="flex flex-nowrap items-center gap-3">
                        <TruncatedMeetingTitle
                          title={meeting.meeting_title || meeting.order?.name || "Meeting"}
                          isDark={isDark}
                        />
                        <span className={cn("shrink-0 rounded-full border px-3 py-1 text-xs font-medium", getMeetingStatusClasses(effectiveStatus))}>
                          {formatMeetingStatusLabel(effectiveStatus)}
                        </span>
                      </div>

                      <div className={`mt-2 flex flex-wrap items-center gap-4 text-sm ${isDark ? "text-white/55" : "text-gray-500"}`}>
                        <span className="inline-flex items-center gap-2">
                          <CalendarClock size={14} />
                          {formatDateTime(meeting.meeting_date_time)}
                        </span>
                        {/* {meeting.order?.name ? <span>Order: {meeting.order.name}</span> : null} */}
                        {canRespond ? (
                          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-medium capitalize text-amber-300">
                            Your response: {formatInvitationResponse(currentResponse)}
                          </span>
                        ) : null}
                      </div>
                      {meeting.description ? (
                        <p className={`mt-3 line-clamp-2 text-sm ${isDark ? "text-white/65" : "text-gray-600"}`}>
                          {meeting.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="min-w-0 w-full lg:col-span-2 lg:flex lg:justify-center">
                      <ParticipantAvatarStack meeting={meeting} isDark={isDark} />
                    </div>

                    <div className="flex flex-wrap lg:grid lg:grid-cols-2 gap-3 lg:col-span-4">
                      {canRespond && currentResponse !== "accepted" ? (
                        <Button
                          type="button"
                          onClick={() => handleRespond(meeting.id as string | number, "accepted")}
                          disabled={isResponding}
                          className="bg-emerald-500 text-white hover:bg-emerald-600 text-center"
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
                          className="border-rose-400/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 text-center"
                        >
                          Reject
                        </Button>
                      ) : null}
                      {meeting.meetLink ? (
                        <a
                          href={meeting.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-disabled={isCompleted || isCancelled}
                          onClick={(event) => {
                            if (isCompleted || isCancelled) {
                              event.preventDefault();
                            }
                          }}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium justify-center",
                            isCompleted || isCancelled
                              ? "cursor-not-allowed border-white/10 bg-[#111111] text-white/30"
                              : "border-white/20 bg-[#202020] text-white hover:bg-[#222222]"
                          )}
                        >
                          <span className="hidden lg:block">Join Meeting</span>
                          <ExternalLink className="shrink-0 w-5 h-5 lg:w-4 lg:h-4" />
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setSelectedMeeting(meeting)}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-[#202020] px-4 py-2 text-sm font-medium text-white hover:bg-[#222222] justify-center"
                      >
                        <SquarePen className="shrink-0 w-5 h-5 lg:w-4 lg:h-4" />
                        <span className="hidden lg:block">{isAdminView ? "Edit/Reschedule" : "View Details"}</span>
                      </button>
                      {shootLink ? (
                        <Link
                          href={shootLink}
                          className="inline-flex items-center gap-2 rounded-lg bg-[#E5D5B8] px-4 py-2 text-sm font-semibold text-black hover:bg-[#d9c5a0] justify-center"
                        >
                          Open Shoot
                        </Link>
                      ) : null}
                      {canDeleteThisMeeting ? (
                        <button
                          type="button"
                          onClick={() => setMeetingPendingDelete(meeting)}
                          className="inline-flex items-center gap-2 rounded-lg border border-[#FFC3C3] bg-[#FFC3C3] px-4 py-2 text-sm font-medium text-[#BD1010] hover:bg-[#FFC3C3]/80 justify-center"
                        >
                          <Trash2 className="shrink-0 w-5 h-5 lg:w-4 lg:h-4" />
                          <span className="hidden lg:block">Delete</span>
                        </button>
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
        role={effectiveRoleForActions}
        onCreated={loadMeetings}
        isDark={isDark}
      />

      <MeetingDetailsModal
        open={!!selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
        meeting={selectedMeeting}
        role={effectiveRoleForActions}
        currentUserId={currentUserId}
        currentUserEmail={currentUserEmail}
        onUpdated={loadMeetings}
        isDark={isDark}
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
        isDark={isDark}
      />
    </div>
  );
}

const TruncatedMeetingTitle = ({ title, isDark = true }: { title: string; isDark?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);

  // 1. Explicitly type the ref as HTMLHeadingElement
  const titleRef = useRef<HTMLHeadingElement>(null);

  const handleMouseEnter = () => {
    const element = titleRef.current;
    console.log(element);

    if (element) {
      // 2. Now TypeScript knows 'element' has scrollWidth and offsetWidth
      const isActuallyTruncated = element.scrollWidth > element.offsetWidth;

      console.log(isActuallyTruncated);
      console.log(element.scrollWidth, element.offsetWidth);

      setIsOpen(isActuallyTruncated);
    }
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  return (
    <TooltipProvider>
      <Tooltip open={isOpen}>
        <TooltipTrigger asChild>
          <h2
            ref={titleRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`min-w-0 truncate lg:text-lg font-semibold cursor-default ${isDark ? "text-white" : "text-black"}`}
          >
            {title}
          </h2>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs break-words">
          <p>{title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};