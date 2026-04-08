import type { MeetingItem } from "@/lib/meetingsApi";

const normalizeStatus = (value?: string) => String(value || "pending").toLowerCase();

const STATUS_STYLES: Record<string, string> = {
  pending: "border-[#B18A00]/25 bg-[#2A2110] text-[#F3D27A]",
  confirmed: "border-[#0E9F6E]/25 bg-[#10261E] text-[#67E8B5]",
  in_progress: "border-[#3B82F6]/25 bg-[#111E33] text-[#93C5FD]",
  ongoing: "border-[#38BDF8]/25 bg-[#0E2230] text-[#7DD3FC]",
  change_request: "border-[#C065F0]/25 bg-[#241228] text-[#E9B8FF]",
  completed: "border-[#34D399]/25 bg-[#0F241D] text-[#9AE6B4]",
  cancelled: "border-[#FB7185]/25 bg-[#2A1419] text-[#FDA4AF]",
  rescheduled: "border-[#818CF8]/25 bg-[#171B33] text-[#C7D2FE]",
};

export const getEffectiveMeetingStatus = (meeting?: Pick<MeetingItem, "meeting_status" | "meeting_date_time" | "meeting_end_time"> | null) => {
  if (!meeting) return "pending";

  const storedStatus = normalizeStatus(meeting.meeting_status);
  if (["cancelled", "change_request", "rescheduled"].includes(storedStatus)) {
    return storedStatus;
  }

  const now = Date.now();
  const start = meeting.meeting_date_time ? new Date(meeting.meeting_date_time).getTime() : NaN;
  const end = meeting.meeting_end_time ? new Date(meeting.meeting_end_time).getTime() : NaN;

  if (!Number.isNaN(end) && end <= now) {
    return "completed";
  }

  if (!Number.isNaN(start) && !Number.isNaN(end) && start <= now && end > now) {
    return "ongoing";
  }

  if (storedStatus === "in_progress") {
    return "ongoing";
  }

  if (storedStatus === "confirmed") {
    return "pending";
  }

  return storedStatus;
};

export const formatMeetingStatusLabel = (value?: string) =>
  String(value || "pending")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const getMeetingStatusClasses = (value?: string) =>
  STATUS_STYLES[normalizeStatus(value)] || STATUS_STYLES.pending;
