"use client";

import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { CalendarClock, ChevronLeft, ChevronRight, ExternalLink, Eye, Loader2, RefreshCw, Search, SquarePen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import CreateMeetingModal from "@/components/meetings/CreateMeetingModal";
import DeleteMeetingConfirmModal from "@/components/meetings/DeleteMeetingConfirmModal";
import MeetingDetailsModal from "@/components/meetings/MeetingDetailsModal";
import EditMeetingModal from "@/components/meetings/EditMeetingModal";
import { useAuth } from "@/lib/hooks/useAuth";
import { meetingsApi, type MeetingItem } from "@/lib/meetingsApi";
import { formatMeetingStatusLabel, getEffectiveMeetingStatus, getMeetingStatusClasses } from "@/lib/meetingStatus";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/lib/redux/hooks";
import { hasModulePermission } from "@/lib/permissions";
import { getBrowserTimeZoneLabel } from "@/lib/timezone";
import EmptyMeetingState from "./EmptyMeetingState";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/landing/ui/tooltip"
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { usePermissions } from "@/lib/hooks/usePermissions";
import ParticipantAvatarStack from "./AvatarStack";
import MeetingsStructure from "./MeetingsTable";
import { SortDateButton } from "../admin/SortDateButton";

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
  const dateTime = date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `${dateTime} (${getBrowserTimeZoneLabel(date)})`;
};

const getShootLink = (role: RoleVariant, meeting: MeetingItem) => {
  const orderId = meeting.order?.id;
  if (!orderId) return null;
  if (role === "admin") return `/admin/shoots/${orderId}`;
  if (role === "sales") return `/sales/shoots/${orderId}`;
  if (role === "pm") return `/production-manager/shoots/${orderId}`;
  return null;
};

const MEETINGS_PAGE_SIZE = 10;

type PaginationItem = number | "...";

const buildPaginationItems = (currentPage: number, totalPages: number): PaginationItem[] => {
  if (totalPages <= 1) return [1];

  const items: PaginationItem[] = [];
  const delta = 1;
  const left = Math.max(2, currentPage - delta);
  const right = Math.min(totalPages - 1, currentPage + delta);

  items.push(1);

  if (left > 2) {
    items.push("...");
  }

  for (let page = left; page <= right; page += 1) {
    items.push(page);
  }

  if (right < totalPages - 1) {
    items.push("...");
  }

  if (totalPages > 1) {
    items.push(totalPages);
  }

  return items;
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: MEETINGS_PAGE_SIZE,
    totalPages: 0,
    totalResults: 0,
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const selectedDateQuery = useMemo(() => {
    if (!selectedDate) return "";

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, [selectedDate]);

  const handleSearchChange = (value: string) => {
    setCurrentPage(1);
    setSearch(value);
  };

  const handleDateSort = (date: Date | null) => {
    setCurrentPage(1);
    setSelectedDate(date);
  };

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
  const permissions = useAppSelector((state) => state.auth.permissions);
  const isSalesAdminView = role === "sales";
  const isAdminView = role === "admin" || isSalesAdminView;
  const effectiveRoleForActions: RoleVariant = isAdminView ? "admin" : role;
  const canCreateMeeting = hasModulePermission(permissions, ["meetings"], "create");

  const loadMeetings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params: Record<string, unknown> = {
        limit: MEETINGS_PAGE_SIZE,
        page: currentPage,
        sortBy: "meeting_date_time:desc",
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      if (selectedDateQuery) {
        params.meetingDate = selectedDateQuery;
      }

      const response = isAdminView
        ? await meetingsApi.listAll(params)
        : currentUserId
          ? await meetingsApi.listByUser(currentUserId, params)
          : { results: [] };

      const nextTotalPages = Number(response?.totalPages || 0);
      if (nextTotalPages > 0 && currentPage > nextTotalPages) {
        setCurrentPage(nextTotalPages);
        return;
      }

      setMeetings(response?.results || []);
      setPagination({
        page: Number(response?.page || currentPage),
        limit: Number(response?.limit || MEETINGS_PAGE_SIZE),
        totalPages: nextTotalPages,
        totalResults: Number(response?.totalResults || 0),
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load meetings");
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentUserId, debouncedSearch, isAdminView, selectedDateQuery]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const filteredMeetings = useMemo(() => meetings, [meetings]);

  const totalPages = Math.max(1, Number(pagination.totalPages || 0));
  const safeCurrentPage = Math.min(Math.max(Number(pagination.page || currentPage), 1), totalPages);
  const paginationItems = useMemo(() => buildPaginationItems(safeCurrentPage, totalPages), [safeCurrentPage, totalPages]);
  const showingFrom = pagination.totalResults > 0 ? ((safeCurrentPage - 1) * pagination.limit) + 1 : 0;
  const showingTo = Math.min(safeCurrentPage * pagination.limit, pagination.totalResults);

  const handlePageChange = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    if (nextPage !== currentPage) {
      setCurrentPage(nextPage);
    }
  };

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
    <div className="overflow-hidden p-4 pb-30 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8" style={{ fontFamily: 'var(--font-instrument-sans)' }}>

      {/* Top Actions Panel */}
      <div className="mb-3 lg:mb-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
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
          <div className="flex-shrink-0">
            <SortDateButton
              selectedDate={selectedDate}
              onDateChange={handleDateSort}
            />
          </div>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input Box Container */}
          <div className="relative w-full lg:max-w-sm">
            <Search size={16} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-white/35" : "text-[#171717B2]"}`} />
            <Input
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
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
      {loading ? (
        <div className={`flex items-center justify-center py-20 border rounded-2xl transition-colors ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-zinc-200 bg-white"}`}>
          <Loader2 className="animate-spin text-[#BFA780]" size={40} />
        </div>
      ) : error ? (
        <div className={`min-h-0 flex-1 overflow-y-auto rounded-2xl border p-4 lg:p-5 transition-colors ${isDark ? "border-[#222222] bg-black" : "border-zinc-200 bg-white"}`}>
          <div className="py-16 text-center text-xs lg:text-sm font-medium text-[#ff8e8e]">{error}</div>
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className={`min-h-0 flex-1 overflow-y-auto rounded-2xl border p-4 lg:p-5 transition-colors ${isDark ? "border-[#222222] bg-black" : "border-zinc-200 bg-white"}`}>
          <div className={`py-16 text-center text-xs lg:text-sm ${isDark ? "text-white/45" : "text-[#171717B2]"}`}>
            {search.trim() || selectedDate ? "No meetings match your filters." : <EmptyMeetingState />}
          </div>
        </div>
      ) : (
        <>
          <MeetingsStructure
            filteredMeetings={filteredMeetings}
            getShootLink={getShootLink}
            getEffectiveMeetingStatus={getEffectiveMeetingStatus}
            getParticipantResponse={getParticipantResponse}
            getIdentityId={getIdentityId}
            currentUserId={currentUserId}
            role={role}
            isAdminView={isAdminView}
            respondingMeetingId={respondingMeetingId}
            handleRespond={handleRespond}
            setSelectedMeeting={setSelectedMeeting}
            setMeetingPendingDelete={setMeetingPendingDelete}
            formatMeetingStatusLabel={formatMeetingStatusLabel}
            getMeetingStatusClasses={getMeetingStatusClasses}
            formatDateTime={formatDateTime}
            formatInvitationResponse={formatInvitationResponse}
            isDark={isDark}
          />

          {pagination.totalResults > 0 ? (
            <div className={`flex flex-col gap-3 rounded-2xl border px-4 py-4 transition-colors lg:flex-row lg:items-center lg:justify-between ${isDark ? "border-[#3D3D3D] bg-[#111111]" : "border-[#E5E5E5] bg-white"}`}>
              <div className={`text-xs lg:text-sm ${isDark ? "text-white/60" : "text-[#171717B2]"}`}>
                Showing {showingFrom} to {showingTo} of {pagination.totalResults} meetings
              </div>

              {totalPages > 1 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handlePageChange(safeCurrentPage - 1)}
                    disabled={safeCurrentPage === 1}
                    className={`gap-1 border ${isDark
                      ? "border-white/10 bg-[#1A1A1A] text-white hover:bg-[#222222]"
                      : "border-[#E3E3E3] bg-[#F0F0F0] text-[#323232] hover:bg-[#E8E8E8]"
                    }`}
                  >
                    <ChevronLeft size={16} />
                    Prev
                  </Button>

                  <div className="flex flex-wrap items-center gap-2">
                    {paginationItems.map((item, index) =>
                      item === "..." ? (
                        <span key={`ellipsis-${index}`} className={`px-2 text-sm ${isDark ? "text-white/40" : "text-[#171717B2]"}`}>
                          ...
                        </span>
                      ) : (
                        <Button
                          key={item}
                          type="button"
                          variant="outline"
                          onClick={() => handlePageChange(item)}
                          className={`h-9 min-w-9 px-3 ${safeCurrentPage === item
                            ? "border-[#E8D1AB] bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]"
                            : isDark
                              ? "border-white/10 bg-[#1A1A1A] text-white hover:bg-[#222222]"
                              : "border-[#E3E3E3] bg-white text-[#323232] hover:bg-[#F3F3F3]"
                          }`}
                        >
                          {item}
                        </Button>
                      )
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handlePageChange(safeCurrentPage + 1)}
                    disabled={safeCurrentPage === totalPages}
                    className={`gap-1 border ${isDark
                      ? "border-white/10 bg-[#1A1A1A] text-white hover:bg-[#222222]"
                      : "border-[#E3E3E3] bg-[#F0F0F0] text-[#323232] hover:bg-[#E8E8E8]"
                    }`}
                  >
                    Next
                    <ChevronRight size={16} />
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}
      {/* </div> */}

      <CreateMeetingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        role={effectiveRoleForActions}
        onCreated={loadMeetings}
        isDark={isDark}
      />

      {isAdminView ?
        <EditMeetingModal
          open={!!selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
          meeting={selectedMeeting}
          role={effectiveRoleForActions}
          currentUserId={currentUserId}
          currentUserEmail={currentUserEmail}
          onUpdated={loadMeetings}
          isDark={isDark}
        />
        :
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
      }

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
