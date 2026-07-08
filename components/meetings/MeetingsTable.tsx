import React, { useState, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ExternalLink,
  SquarePen,
  Trash2,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { Button } from "../ui/button";
import { ParticipantAvatarStack } from "./AvatarStack";
import { type MeetingItem } from "@/lib/meetingsApi";
import { canRespondToMeeting } from "@/lib/meetingStatus";
import { useAppSelector } from "@/lib/redux/hooks";
import { hasModulePermission } from "@/lib/permissions";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/landing/ui/tooltip";

type RoleVariant = "admin" | "sales" | "client" | "cp" | "pm";

export interface MeetingsStructureProps {
  filteredMeetings: MeetingItem[];
  getShootLink: (role: RoleVariant, meeting: MeetingItem) => string | null;
  getEffectiveMeetingStatus: (meeting: MeetingItem) => string;
  getParticipantResponse: (meeting: MeetingItem, userId?: string | number) => string | null | undefined;
  getIdentityId: (id: string | number | undefined) => string;
  currentUserId: string | number | null | undefined;
  role: RoleVariant;
  isAdminView: boolean;
  respondingMeetingId: string | null;
  handleRespond: (meetingId: string | number, response: "accepted" | "declined") => void | Promise<void>;
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
  respondingMeetingId,
  handleRespond,
  setSelectedMeeting,
  setMeetingPendingDelete,
  formatMeetingStatusLabel,
  getMeetingStatusClasses,
  formatDateTime,
  formatInvitationResponse,
  isDark
}: MeetingsStructureProps) {
  const permissions = useAppSelector((state) => state.auth.permissions);
  const canDeleteMeeting = hasModulePermission(permissions, ["meetings"], "delete");

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
          <table className="w-full text-left border-separate border-spacing-0 table-fixed min-w-[900px]">
            <thead>
              <tr className={`text-base font-medium border-b leading-none tracking-normal transition-colors duration-300 ${isDark
                ? "text-[#E8D1AB] border-[#3D3D3D] bg-[#101010]"
                : "text-[#000000] border-[#E5E5E5] bg-[#FFFCF6]"
                }`}>
                {/* Defined exact explicit widths on the table headers */}
                <th className="p-5 font-medium w-[30%]">Meeting</th>
                <th className="p-5 font-medium w-[22%]">Date & Time</th>
                <th className="p-5 font-medium text-center w-[15%]">Participants</th>
                <th className="p-5 font-medium text-center w-[12%]">Status</th>
                <th className="p-5 font-medium text-right w-[21%]">Actions</th>
              </tr>
            </thead>
            <tbody >
              {filteredMeetings.map((meeting, idx) => {
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

                const canOpenDetails = !!meeting.id;
                const canDeleteThisMeeting = isAdminView && canDeleteMeeting;
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
                    </td>

                    {/* COLUMN 2: Date & Time */}
                    <td className={`p-5 text-base border-t ${borderClass}`}>
                      <div className="flex flex-col gap-1 min-w-0">
                        <TruncatedDateTime value={formatDateTime(meeting.meeting_date_time)} isDark={isDark} />
                        {canRespond && (
                          <span className="mt-1 inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-1 text-xs font-semibold leading-none text-amber-300">
                            Your response: {formatInvitationResponse(currentResponse ?? "")}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* COLUMN 3: Participants */}
                    <td className={`p-5 border-t text-center ${borderClass}`}>
                      <div className="flex justify-center">
                        <ParticipantAvatarStack meeting={meeting} isDark={isDark} />
                      </div>
                    </td>

                    {/* COLUMN 4: Status */}
                    <td className={`p-5 border-t ${borderClass}`}>
                      <span className={`inline-block rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap truncate ${getMeetingStatusClasses(effectiveStatus, isDark)}`}>
                        {formatMeetingStatusLabel(effectiveStatus)}
                      </span>
                    </td>

                    {/* COLUMN 5: Actions */}
                    <td className={`p-5 border-t text-right ${borderClass}`}>
                      <div className="grid grid-cols-2 items-center justify-end gap-2">
                        {canRespond && currentResponse !== "accepted" && (
                          <Button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRespond(meeting.id, "accepted"); }}
                            disabled={isResponding}
                            className="bg-emerald-500 text-white hover:bg-emerald-600 text-center px-3 py-2 h-auto text-xs"
                          >
                            {isResponding && <RefreshCw size={12} className="animate-spin mr-1" />}
                            Accept
                          </Button>
                        )}
                        {canRespond && currentResponse !== "declined" && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); handleRespond(meeting.id, "declined"); }}
                            disabled={isResponding}
                            className="border-rose-400/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 text-center px-3 py-2 h-auto text-xs whitespace-nowrap truncate"
                          >
                            Reject
                          </Button>
                        )}
                        {meeting.meetLink && (
                          <Link
                            href={meeting.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-disabled={isCompleted || isCancelled}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (isCompleted || isCancelled) event.preventDefault();
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium justify-center transition-colors whitespace-nowrap truncate ${isCompleted || isCancelled
                              ? isDark
                                ? "cursor-not-allowed border-white/10 bg-[#111111] text-white/70"
                                : "cursor-not-allowed border-bg-black/50 bg-black/50 text-white/50"
                              : isDark
                                ? "border-white/20 bg-[#202020] text-white hover:bg-[#282828]"
                                : "border-black bg-black text-[#E8D1AB] hover:bg-black/80"
                              }`}
                          >
                            <span>Join</span>
                            <ExternalLink className="shrink-0 w-3.5 h-3.5" />
                          </Link>
                        )}
                        <button
                          type="button"
                          disabled={!canOpenDetails}
                          onClick={(e) => {
                            if (!canOpenDetails) return;
                            e.stopPropagation();
                            setSelectedMeeting(meeting);
                          }}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium justify-center transition-colors whitespace-nowrap truncate ${
                            canOpenDetails
                              ? isDark
                                ? "border-white/20 bg-[#202020] text-white hover:bg-[#282828]"
                                : "border-gray-200 bg-[#E5E5E5] text-gray-700 hover:bg-gray-200"
                              : isDark
                                ? "cursor-not-allowed border-white/10 bg-[#111111] text-white/35"
                                : "cursor-not-allowed border-gray-200 bg-[#F2F2F2] text-gray-400"
                          }`}
                        >
                          <SquarePen className="shrink-0 w-3.5 h-3.5" />
                          <span>{isAdminView ? "Edit/Reschedule" : "Details"}</span>
                        </button>
                        {shootLink && (
                          <Link
                            href={shootLink}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#E5D5B8] px-3 py-2 text-xs font-semibold text-black hover:bg-[#d9c5a0] justify-center truncate whitespace-nowrap"
                          >
                            Open Shoot
                          </Link>
                        )}
                        {isAdminView ? (
                          <button
                            type="button"
                            disabled={!canDeleteThisMeeting}
                            onClick={(e) => {
                              if (!canDeleteThisMeeting) return;
                              e.stopPropagation();
                              setMeetingPendingDelete(meeting);
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium justify-center transition-colors whitespace-nowrap truncate ${
                              canDeleteThisMeeting
                                ? "border-[#FFC3C3] bg-[#FFC3C3] text-[#BD1010] hover:bg-[#FFB0B0]"
                                : isDark
                                  ? "cursor-not-allowed border-white/10 bg-[#111111] text-white/35"
                                  : "cursor-not-allowed border-gray-200 bg-[#F2F2F2] text-gray-400"
                            }`}
                          >
                            <Trash2 className="shrink-0 w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        ) : null}
                      </div>
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

// --- SUB-COMPONENT FOR CLEAN INDEPENDENT MOBILE ROWS ---
function MobileMeetingRow({
  meeting,
  isDark,
  role,
  currentUserId,
  isAdminView,
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

  const permissions = useAppSelector((state) => state.auth.permissions);
  const canDeleteMeeting = hasModulePermission(permissions, ["meetings"], "delete");
  const canOpenDetails = !!meeting.id;
  const canDeleteThisMeeting = isAdminView && canDeleteMeeting;
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
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300 shrink-0 ${isExpanded
            ? (isDark ? 'rotate-180 border-[#E8D1AB] text-[#E8D1AB]' : 'rotate-180 border-[#000000] text-[#000000]')
            : (isDark ? 'border-white/10 text-white/60' : 'border-[#E5E5E5] text-[#999]')
            }`}>
            <ChevronDown size={16} />
          </div>
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
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${getMeetingStatusClasses(effectiveStatus, isDark)}`}>
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
                      <span className="inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold leading-none text-amber-300">
                        Response: {formatInvitationResponse(currentResponse ?? "")}
                      </span>
                    )}
                  </div>
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
                  disabled={!canOpenDetails}
                  onClick={() => {
                    if (!canOpenDetails) return;
                    setSelectedMeeting(meeting);
                  }}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium justify-center transition-colors w-full ${
                    canOpenDetails
                      ? isDark
                        ? "border-white/20 bg-[#202020] text-white"
                        : "border-gray-200 bg-[#E5E5E5] text-gray-700"
                      : isDark
                        ? "cursor-not-allowed border-white/10 bg-[#111111] text-white/35"
                        : "cursor-not-allowed border-gray-200 bg-[#F2F2F2] text-gray-400"
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
                {isAdminView ? (
                  <button
                    type="button"
                    disabled={!canDeleteThisMeeting}
                    onClick={() => {
                      if (!canDeleteThisMeeting) return;
                      setMeetingPendingDelete(meeting);
                    }}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium justify-center transition-colors w-full ${
                      canDeleteThisMeeting
                        ? "border-[#FFC3C3] bg-[#FFC3C3] text-[#BD1010] hover:bg-[#FFC3C3]/80"
                        : isDark
                          ? "cursor-not-allowed border-white/10 bg-[#111111] text-white/35"
                          : "cursor-not-allowed border-gray-200 bg-[#F2F2F2] text-gray-400"
                    }`}
                  >
                    <Trash2 className="shrink-0 w-4 h-4" />
                    <span>Delete</span>
                  </button>
                ) : null}
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
