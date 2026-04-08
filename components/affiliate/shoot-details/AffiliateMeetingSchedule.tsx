"use client";

import MeetingsSchedulePanel from "@/components/meetings/MeetingsSchedulePanel";

interface AffiliateMeetingScheduleProps {
  orderId?: string | number | null;
  role?: "admin" | "sales" | "client" | "cp" | "pm";
}

export default function AffiliateMeetingSchedule({ orderId, role = "client" }: AffiliateMeetingScheduleProps) {
  return <MeetingsSchedulePanel orderId={orderId} role={role} />;
}
