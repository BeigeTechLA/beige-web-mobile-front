import React, { useState, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ClipboardList,
  Copy,
  ExternalLink,
  SquarePen,
  Trash2,
  RefreshCw,
  ChevronDown,
  MoreVertical,
  Video,
} from "lucide-react";
import { Button } from "../ui/button";
import { ParticipantAvatarStack } from "./AvatarStack";
import { type MeetingItem } from "@/lib/meetingsApi";
import { canRespondToMeeting } from "@/lib/meetingStatus";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/landing/ui/tooltip";

type RoleVariant = "admin" | "sales" | "client" | "cp" | "pm";

const getMeetingPlatformLabel = (meeting: MeetingItem) => {
  const link = String(meeting.meetLink || "").toLowerCase();
  if (link.includes("zoom.")) return "Zoom";
  if (link.includes("meet.google") || meeting.googleCalendarEventId) return "Google Meet";
  return meeting.meetLink ? "Meeting Link" : "Google Meet";
};

const MeetingIconBadge = ({ isDark }: { isDark: boolean }) => (
  <span
    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
      isDark ? "bg-[#2A2A2A] text-[#E8D1AB]" : "bg-[#F3E8D4] text-[#8B6F43]"
    }`}
  >
    <Video className="h-4 w-4" />
  </span>
);

const getFigmaStatusPillClasses = (status: string) => {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus.includes("completed")) {
    return "bg-[#C9F7D8] text-[#0C9A44]";
  }

  if (normalizedStatus.includes("revision")) {
    return "bg-[#C8D4FF] text-[#0646E8]";
  }

  if (normalizedStatus.includes("pre")) {
    return "bg-[#FFF4FF] text-[#D719EA]";
  }

  if (normalizedStatus.includes("cancel")) {
    return "bg-[#FFC3C3] text-[#BD1010]";
  }

  return "bg-[#FFF1C7] text-[#C66A00]";
};

export interface MeetingsStructureProps {
  filteredMeetings: MeetingItem[];
  getShootLink: (role: RoleVariant, meeting: MeetingItem) => string | null;
  getEffectiveMeetingStatus: (meeting: MeetingItem) => string;
  getParticipantResponse: (meeting: MeetingItem, userId?: string | number) => string | null | undefined;
  getIdentityId: (id: string | number | undefined) => string;
  currentUserId: string | number | null | undefined;
  role: RoleVariant;
  isAdminView: boolean;
  canDeleteMeeting: boolean;
  respondingMeetingId: string | null;
  handleRespond: (meetingId: string | number, response: "accepted" | "declined") => void | Promise<void>;
  setViewMeeting: (meeting: MeetingItem) => void;
  setSelectedMeeting: (meeting: MeetingItem) => void;
  setMeetingPendingDelete: (meeting: MeetingItem) => void;
  formatMeetingStatusLabel: (status: string) => string;
  getMeetingStatusClasses: (status: string, isDark?: boolean) => string;
  formatDateTime: (value?: string) => string;
  formatInvitationResponse: (response: string) => string;
  isDark: boolean;
}

export interface MeetingRowProps {
  meeting: MeetingItem;
  isDark: boolean;
  role: RoleVariant;
  currentUserId: string | number | null | undefined;
  isAdminView: boolean;
  canDeleteMeeting: boolean;
  respondingMeetingId: string | null;
  getShootLink: (role: RoleVariant, meeting: MeetingItem) => string | null;
  getEffectiveMeetingStatus: (meeting: MeetingItem) => string;
  getParticipantResponse: (meeting: MeetingItem, userId?: string | number) => string | null | undefined;
  getIdentityId: (id: string | number | undefined) => string;
  handleRespond: (meetingId: string | number, response: "accepted" | "declined") => void | Promise<void>;
  setSelectedMeeting: (meeting: MeetingItem) => void;
  setMeetingPendingDelete: (meeting: MeetingItem) => void;
  formatMeetingStatusLabel: (status: string) => string;
  getMeetingStatusClasses: (status: string, isDark?: boolean) => string;
  formatDateTime: (value?: string) => string;
  formatInvitationResponse: (response: string) => string;
}

// --- MAIN WRAPPER CONTAINER ---
export default function MeetingsStructure({
  filteredMeetings,
  getShootLink,
  getEffectiveMeetingStatus,
  getParticipantResponse,
  getIdentityId,
  currentUserId,
  role,
  isAdminView,
  canDeleteMeeting,
  respondingMeetingId,
  handleRespond,
  setViewMeeting,
  setSelectedMeeting,
  setMeetingPendingDelete,
  formatMeetingStatusLabel,
  getMeetingStatusClasses,
  formatDateTime,
  formatInvitationResponse,
  isDark
}: MeetingsStructureProps) {
  return (
    <>
      {/* MOBILE ONLY VIEW */}
      <div className={`lg:hidden transition-colors duration-300 rounded-xl overflow-hidden border ${isDark ? "bg-[#111111] border-[#3D3D3D]" : "bg-white border-[#E5E5E5]"}`}>
        <div className={`flex justify-between px-5 py-3 text-sm font-medium border-b ${isDark
          ? "border-b-[#3D3D3D] text-[#E8D1AB] bg-[#101010]"
          : "bg-[#FFFCF6] text-[#000000] border-b-[#E5E5E5]"
          }`}>
          <span>Meeting</span>
          <span>Status</span>
        </div>

        <div className="flex flex-col">
          {filteredMeetings.map((meeting, idx) => (
            <MobileMeetingRow
              key={String(meeting.id || idx)}
              meeting={meeting}
              isDark={isDark}
              role={role}
              currentUserId={currentUserId}
              isAdminView={isAdminView}
              canDeleteMeeting={canDeleteMeeting}
              respondingMeetingId={respondingMeetingId}
              getShootLink={getShootLink}
              getEffectiveMeetingStatus={getEffectiveMeetingStatus}
              getParticipantResponse={getParticipantResponse}
              getIdentityId={getIdentityId}
              handleRespond={handleRespond}
              setSelectedMeeting={setSelectedMeeting}
              setMeetingPendingDelete={setMeetingPendingDelete}
              formatMeetingStatusLabel={formatMeetingStatusLabel}
              getMeetingStatusClasses={getMeetingStatusClasses}
              formatDateTime={formatDateTime}
              formatInvitationResponse={formatInvitationResponse}
            />
          ))}
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className={`hidden lg:block w-full rounded-xl overflow-hidden border ${isDark ? "border-[#3D3D3D]" : "border-[#E5E5E5]"}`}>
        <div className="w-full overflow-x-auto">
          {/* CHANGED: Switched table-auto to table-fixed to enforce column widths */}
          <table className="w-full text-left border-separate border-spacing-0 table-fixed min-w-[1120px]">
            <thead>
              <tr className={`text-base font-medium border-b leading-none tracking-normal transition-colors duration-300 ${isDark
                ? "text-[#E8D1AB] border-[#3D3D3D] bg-[#101010]"
                : "text-[#000000] border-[#E5E5E5] bg-[#FFFCF6]"
                }`}>
                {/* Defined exact explicit widths on the table headers */}
                <th className="p-5 font-medium w-[27%]">Meeting</th>
                <th className="p-5 font-medium w-[15%]">Date & Time</th>
                <th className="p-5 font-medium w-[12%]">Platform</th>
                <th className="p-5 font-medium text-center w-[18%]">Participants</th>
                <th className="p-5 font-medium text-center w-[12%]">Status</th>
                <th className="p-5 font-medium text-right w-[12%]">Actions</th>
              </tr>
            </thead>
            <tbody >
              {filteredMeetings.map((meeting, idx) => {
                const shootLink = getShootLink(role, meeting);
                const effectiveStatus = getEffectiveMeetingStatus(meeting);
                const currentResponse = getParticipantResponse(meeting, currentUserId);
                const createdById = getIdentityId(meeting.created_by?.id);

                const isClientCreatedBySelf =
                  role === "client" &&
                  !!currentUserId &&
                  !!createdById &&
                  String(currentUserId) === createdById;
                const isWithinResponseWindow = canRespondToMeeting(meeting);

                const canRespond =
                  !!meeting.id &&
                  !!currentUserId &&
                  !isAdminView &&
                  !isClientCreatedBySelf &&
                  isWithinResponseWindow &&
                  !["completed", "cancelled"].includes(String(effectiveStatus || "").toLowerCase());

                const canDeleteThisMeeting = canDeleteMeeting && !isClientCreatedBySelf;
                const isResponding = respondingMeetingId === String(meeting.id || "");

                const borderClass = isDark ? "border-[#3D3D3D]" : "border-[#E5E5E5]";
                const rowBgClass = isDark ? "bg-[#171717] hover:bg-[#000]" : "bg-white hover:bg-zinc-50";

                return (
                  <tr
                    key={String(meeting.id || idx)}
                    className={`group transition-colors relative ${rowBgClass}`}
                  >
                    {/* COLUMN 1: Meeting */}
                    <td className={`p-5 text-base border-t ${borderClass}`}>
                      <div className="flex items-start gap-3 min-w-0">
                        <MeetingIconBadge isDark={isDark} />
                        <div className="flex flex-col min-w-0">
                          {(meeting.meeting_title || meeting.order?.name || "Meeting")
                            .split(" - ")
                            .reverse()
                            .map((part, i) => (
                              <div 
                                key={i} 
                                className={i === 1 ? "scale-95 origin-left" : ""}
                              >
                                <TruncatedMeetingTitle
                                  title={part.trim()}
                                  isDark={isDark}
                                />
                              </div>
                            ))}
                          {meeting.meeting_type && (
                            <p className={`text-sm capitalize font-semibold mt-1 ${isDark ? "text-white/45" : "text-gray-500"}`}>
                              Stage: {meeting.meeting_type.split("_").join(" ")}
                            </p>
                          )}
                          {/* {meeting.description && (
                            <p className={`text-sm line-clamp-1 mt-0.5 ${isDark ? "text-white/60" : "text-gray-600"}`}>
                              {meeting.description}
                          </p>
                          )} */}
                        </div>
                      </div>
                    </td>

                    {/* COLUMN 2: Date & Time */}
                    <td className={`p-5 text-base border-t ${borderClass}`}>
                      <div className="flex flex-col gap-1 min-w-0">
                        <TruncatedDateTime value={formatDateTime(meeting.meeting_date_time)} isDark={isDark} />
                        {canRespond && (
                          <span className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-xs font-medium capitalize text-amber-300 truncate">
                            Your response: {formatInvitationResponse(currentResponse ?? "")}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* COLUMN 3: Platform */}
                    <td className={`p-5 text-base border-t ${borderClass}`}>
                      <span className={`block min-w-0 truncate font-medium ${isDark ? "text-white" : "text-[#333]"}`}>
                        {getMeetingPlatformLabel(meeting)}
                      </span>
                    </td>

                    {/* COLUMN 4: Participants */}
                    <td className={`p-5 border-t text-center ${borderClass}`}>
                      <div className="flex justify-center">
                        <ParticipantAvatarStack meeting={meeting} isDark={isDark} />
                      </div>
                    </td>

                    {/* COLUMN 5: Status */}
                    <td className={`p-5 border-t text-center ${borderClass}`}>
                      <span className={`inline-flex min-w-[116px] items-center justify-center rounded-full px-4 py-2 text-sm font-medium leading-none whitespace-nowrap ${getFigmaStatusPillClasses(effectiveStatus)}`}>
                        {formatMeetingStatusLabel(effectiveStatus)}
                      </span>
                    </td>

                    {/* COLUMN 6: Actions */}
                    <td className={`relative p-5 border-t text-right ${borderClass}`}>
                      <DesktopMeetingActionMenu
                        meeting={meeting}
                        canDeleteThisMeeting={canDeleteThisMeeting}
                        isDark={isDark}
                        setViewMeeting={setViewMeeting}
                        setSelectedMeeting={setSelectedMeeting}
                        setMeetingPendingDelete={setMeetingPendingDelete}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

interface DesktopMeetingActionMenuProps {
  meeting: MeetingItem;
  canDeleteThisMeeting: boolean;
  isDark: boolean;
  setViewMeeting: (meeting: MeetingItem) => void;
  setSelectedMeeting: (meeting: MeetingItem) => void;
  setMeetingPendingDelete: (meeting: MeetingItem) => void;
}

function DesktopMeetingActionMenu({
  meeting,
  canDeleteThisMeeting,
  isDark,
  setViewMeeting,
  setSelectedMeeting,
  setMeetingPendingDelete,
}: DesktopMeetingActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuClass = isDark
    ? "border-[#3A3A3A] bg-[#141414] text-white shadow-2xl"
    : "border-[#DADADA] bg-white text-black shadow-xl";
  const itemClass = isDark ? "text-white hover:bg-white/8" : "text-black hover:bg-black/5";

  const copyMeetingLink = async () => {
    if (!meeting.meetLink) return;
    try {
      await navigator.clipboard.writeText(meeting.meetLink);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = meeting.meetLink;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  };

  return (
    <div className="relative inline-flex justify-end">
      <button
        type="button"
        aria-label="Meeting actions"
        aria-expanded={isOpen}
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((current) => !current);
        }}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
          isDark ? "text-white hover:bg-white/10" : "text-black hover:bg-black/5"
        }`}
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 top-10 z-40 w-[260px] overflow-hidden rounded-[18px] border py-2 text-left ${menuClass}`}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              setViewMeeting(meeting);
              setIsOpen(false);
            }}
            className={`flex w-full items-center gap-4 px-5 py-3 text-xl font-medium ${itemClass}`}
          >
            <ClipboardList className="h-5 w-5 shrink-0" />
            <span>View Details</span>
          </button>

          <button
            type="button"
            onClick={() => {
              copyMeetingLink();
              setIsOpen(false);
            }}
            disabled={!meeting.meetLink}
            className={`flex w-full items-center gap-4 px-5 py-3 text-xl font-medium ${itemClass} disabled:cursor-not-allowed disabled:opacity-45`}
          >
            <Copy className="h-5 w-5 shrink-0" />
            <span>Copy Link</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedMeeting(meeting);
              setIsOpen(false);
            }}
            className={`flex w-full items-center gap-4 px-5 py-3 text-xl font-medium ${itemClass}`}
          >
            <SquarePen className="h-5 w-5 shrink-0" />
            <span>Edit & Reschedule</span>
          </button>

          <div className="my-1 border-t border-white/10" />

          {canDeleteThisMeeting && (
            <button
              type="button"
              onClick={() => {
                setMeetingPendingDelete(meeting);
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-4 px-5 py-3 text-xl font-medium text-[#FF2B2B] hover:bg-[#FF2B2B]/10"
            >
              <Trash2 className="h-5 w-5 shrink-0" />
              <span>Cancel Meeting</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENT FOR CLEAN INDEPENDENT MOBILE ROWS ---
function MobileMeetingRow({
  meeting,
  isDark,
  role,
  currentUserId,
  isAdminView,
  canDeleteMeeting,
  respondingMeetingId,
  getShootLink,
  getEffectiveMeetingStatus,
  getParticipantResponse,
  getIdentityId,
  handleRespond,
  setSelectedMeeting,
  setMeetingPendingDelete,
  formatMeetingStatusLabel,
  getMeetingStatusClasses,
  formatDateTime,
  formatInvitationResponse
}: MeetingRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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
  const isWithinResponseWindow = canRespondToMeeting(meeting);

  const canRespond =
    !!meeting.id &&
    !!currentUserId &&
    !isAdminView &&
    !isClientCreatedBySelf &&
    isWithinResponseWindow &&
    !["completed", "cancelled"].includes(String(effectiveStatus || "").toLowerCase());

  const canDeleteThisMeeting = canDeleteMeeting && !isClientCreatedBySelf;
  const isResponding = respondingMeetingId === String(meeting.id || "");

  return (
    <div className={`transition-all duration-200 
    ${isDark ? (isExpanded ? "border-[#222222] bg-[#202020]" : "border-[#F5F5F5] bg-[#171717]") : (isExpanded ? "border-[#222222] bg-[#F9F9F9]" : "border-[#F5F5F5] bg-white")}
  `}>
      {/* UNEXPANDED ROW VIEW */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300 shrink-0 ${isExpanded
            ? (isDark ? 'rotate-180 border-[#E8D1AB] text-[#E8D1AB]' : 'rotate-180 border-[#000000] text-[#000000]')
            : (isDark ? 'border-white/10 text-white/60' : 'border-[#E5E5E5] text-[#999]')
            }`}>
            <ChevronDown size={16} />
          </div>
          <MeetingIconBadge isDark={isDark} />
          <div className="flex flex-col min-w-0">
            {(meeting.meeting_title || meeting.order?.name || "Meeting")
              .split(" - ")
              .reverse()
              .map((part, i) => (
                <div 
                  key={i} 
                  className={i === 1 ? "scale-95 origin-left" : ""}
                >
                  <TruncatedMeetingTitle
                    title={part.trim()}
                    isDark={isDark}
                  />
                </div>
              ))}
          </div>
        </div>
        <span className={`inline-flex min-w-[104px] shrink-0 items-center justify-center rounded-full px-4 py-1.5 text-xs font-medium leading-none ${getFigmaStatusPillClasses(effectiveStatus)}`}>
          {formatMeetingStatusLabel(effectiveStatus)}
        </span>
      </div>

      {/* EXPANDED PANEL VIEW */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`transition-colors duration-300 ${isDark ? "bg-[#141414]" : "bg-[#F9F9F9]"}`}
          >
            <div className="pt-0 px-4 pb-7 space-y-4">

              <div className="grid grid-cols-2 gap-y-3">
                {/* Meeting Type & Description */}
                {meeting.meeting_type && (
                  <div>
                    <p className={`text-xs uppercase font-semibold tracking-wider ${isDark ? "text-white/45" : "text-gray-400"}`}>
                      Meeting Stage
                    </p>
                    <p className={`text-sm mt-0.5 capitalize font-medium ${isDark ? "text-white/80" : "text-gray-700"}`}>
                      {meeting.meeting_type.split("_").join(" ")}
                    </p>
                  </div>
                )}
                {/* {meeting.description && (
                  <div>
                    <p className={`text-xs uppercase font-semibold tracking-wider ${isDark ? "text-white/45" : "text-gray-400"}`}>
                      Description
                    </p>
                    <p className={`text-sm mt-0.5 ${isDark ? "text-white/70" : "text-gray-600"}`}>
                      {meeting.description}
                    </p>
                  </div>
                )} */}

                {/* Date & Time */}
                <div>
                  <p className={`text-xs uppercase font-semibold tracking-wider ${isDark ? "text-white/45" : "text-gray-400"}`}>
                    Date & Time
                  </p>
                  <div className="text-sm mt-1 flex flex-col gap-1">
                    <TruncatedDateTime value={formatDateTime(meeting.meeting_date_time)} isDark={isDark} />
                    {canRespond && (
                      <span className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-xs font-medium capitalize text-amber-300 truncate">
                        Your response: {formatInvitationResponse(currentResponse ?? "")}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <p className={`text-xs uppercase font-semibold tracking-wider ${isDark ? "text-white/45" : "text-gray-400"}`}>
                    Platform
                  </p>
                  <p className={`text-sm mt-0.5 font-medium ${isDark ? "text-white/80" : "text-gray-700"}`}>
                    {getMeetingPlatformLabel(meeting)}
                  </p>
                </div>

                {/* Participants Component */}
                <div>
                  <p className={`text-xs uppercase font-semibold tracking-wider mb-2 ${isDark ? "text-white/45" : "text-gray-400"}`}>
                    Participants
                  </p>
                  <div className="flex">
                    <ParticipantAvatarStack meeting={meeting} isDark={isDark} />
                  </div>
                </div>
              </div>

              {/* Actions Grid Block */}
              <div className="pt-2 grid grid-cols-2 gap-2">
                {canRespond && currentResponse !== "accepted" && (
                  <Button
                    type="button"
                    onClick={() => handleRespond(meeting.id, "accepted")}
                    disabled={isResponding}
                    className="w-full bg-emerald-500 text-white hover:bg-emerald-600 text-center py-2 text-xs justify-center"
                  >
                    {isResponding && <RefreshCw size={14} className="animate-spin mr-2" />}
                    Accept
                  </Button>
                )}
                {canRespond && currentResponse !== "declined" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleRespond(meeting.id, "declined")}
                    disabled={isResponding}
                    className="w-full border-rose-400/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 text-center py-2 text-xs justify-center"
                  >
                    Reject
                  </Button>
                )}
                {meeting.meetLink && (
                  <a
                    href={meeting.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-disabled={isCompleted || isCancelled}
                    onClick={(event) => {
                      if (isCompleted || isCancelled) event.preventDefault();
                    }}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium justify-center transition-colors w-full ${isCompleted || isCancelled
                      ? isDark
                        ? "cursor-not-allowed border-white/10 bg-[#111111] text-white/70"
                        : "cursor-not-allowed border-bg-black/50 bg-black/50 text-white/50"
                      : isDark
                        ? "border-white/20 bg-[#202020] text-white"
                        : "border-black bg-black text-[#E8D1AB]"
                      }`}
                  >
                    <span>Join Meeting</span>
                    <ExternalLink className="shrink-0 w-4 h-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedMeeting(meeting)}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium justify-center transition-colors w-full ${isDark
                    ? "border-white/20 bg-[#202020] text-white"
                    : "border-gray-200 bg-[#E5E5E5] text-gray-700"
                    }`}
                >
                  <SquarePen className="shrink-0 w-4 h-4" />
                  <span>{isAdminView ? "Edit / Reschedule" : "View Details"}</span>
                </button>
                {shootLink && (
                  <Link
                    href={shootLink}
                    className="flex items-center gap-2 rounded-lg bg-[#E5D5B8] px-4 py-2 text-xs font-semibold text-black hover:bg-[#d9c5a0] justify-center w-full"
                  >
                    Open Shoot
                  </Link>
                )}
                {canDeleteThisMeeting && (
                  <button
                    type="button"
                    onClick={() => setMeetingPendingDelete(meeting)}
                    className="flex items-center gap-2 rounded-lg border border-[#FFC3C3] bg-[#FFC3C3] px-4 py-2 text-xs font-medium text-[#BD1010] hover:bg-[#FFC3C3]/80 justify-center w-full"
                  >
                    <Trash2 className="shrink-0 w-4 h-4" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const TruncatedMeetingTitle = ({ title, isDark = true }: { title: string; isDark?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const handleMouseEnter = () => {
    const element = titleRef.current;
    if (element) {
      const isActuallyTruncated = element.scrollWidth > element.offsetWidth;
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
            className={`min-w-0 truncate text-sm lg:text-base font-semibold cursor-default ${isDark ? "text-white" : "text-black"}`}
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

const TruncatedDateTime = ({ value, isDark = true }: { value: string; isDark?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = () => {
    const element = textRef.current;
    if (element) {
      const isActuallyTruncated = element.scrollWidth > element.offsetWidth;
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
          <span
            ref={textRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`block w-full min-w-0 truncate text-sm cursor-default ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}
          >
            {value}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs break-words">
          <p>{value}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
