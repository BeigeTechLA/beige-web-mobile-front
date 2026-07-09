"use client";

import React from "react";
import { CalendarDays, Clock3, ExternalLink, Plus, SquarePen, Trash2, X } from "lucide-react";
import { type MeetingItem, type MeetingParticipantRef } from "@/lib/meetingsApi";
import { formatMeetingStatusLabel, getEffectiveMeetingStatus } from "@/lib/meetingStatus";

interface MeetingViewDetailsDrawerProps {
  open: boolean;
  meeting: MeetingItem | null;
  onClose: () => void;
  onEdit: (meeting: MeetingItem) => void;
  onCancelMeeting: (meeting: MeetingItem) => void;
}

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

const getParticipantStatus = (meeting: MeetingItem, participant: MeetingParticipantRef) => {
  const participantId = String(participant.id || "");
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
}: MeetingViewDetailsDrawerProps) {
  if (!open || !meeting) return null;

  const status = getEffectiveMeetingStatus(meeting);
  const participants = meeting.participants || [];
  const startTime = formatTime(meeting.meeting_date_time);
  const endTime = formatTime(meeting.meeting_end_time);
  const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : startTime || "No time";
  const title = meeting.meeting_title || meeting.order?.name || "Meeting Details";

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/65 backdrop-blur-[2px]">
      <aside className="flex h-full w-full max-w-[486px] flex-col overflow-hidden border-l border-[#2D2D2D] bg-black text-white shadow-2xl">
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

        <div className="flex-1 overflow-y-auto px-7 py-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="min-w-0 flex-1 truncate text-lg font-bold">{title}</h3>
              <span className={`inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-medium ${statusClasses(status)}`}>
                {formatMeetingStatusLabel(status)}
              </span>
              <button
                type="button"
                onClick={() => onEdit(meeting)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#1F1F1F] text-white transition hover:bg-[#2A2A2A]"
                aria-label="Edit meeting"
              >
                <SquarePen className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onCancelMeeting(meeting)}
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
                    <p className="mt-1 truncate text-xs text-white/45">{formatLongDate(meeting.meeting_date_time)}</p>
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
                  {meeting.description || "No description added for this meeting."}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Participants ({participants.length})</h3>
              <button
                type="button"
                onClick={() => onEdit(meeting)}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#E8D1AB] underline underline-offset-4"
              >
                <Plus className="h-5 w-5" />
                Add Participants
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {participants.map((participant, index) => {
                const response = getParticipantStatus(meeting, participant);
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
                      onClick={() => onEdit(meeting)}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#1F1F1F] text-[#FF2B2B] transition hover:bg-[#2A2A2A]"
                      aria-label="Edit participant"
                    >
                      <Trash2 className="h-4 w-4" />
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
            onClick={() => onCancelMeeting(meeting)}
            className="h-11 rounded-md bg-[#F94242] text-sm font-bold text-white transition hover:bg-[#E73535]"
          >
            Cancel Meeting
          </button>
          <a
            href={meeting.meetLink || "#"}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!meeting.meetLink}
            onClick={(event) => {
              if (!meeting.meetLink) event.preventDefault();
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#E8D1AB] text-sm font-bold text-black transition hover:bg-[#DFC395] aria-disabled:pointer-events-none aria-disabled:opacity-60"
          >
            Join Meeting <ExternalLink className="h-4 w-4" />
          </a>
        </footer>
      </aside>
    </div>
  );
}
