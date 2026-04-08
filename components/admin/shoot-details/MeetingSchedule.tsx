"use client";

import MeetingsSchedulePanel from "@/components/meetings/MeetingsSchedulePanel";

interface MeetingScheduleProps {
  orderId?: string | number | null;
  role?: "admin" | "sales" | "client" | "cp" | "pm";
}

export default function MeetingSchedule({ orderId, role = "admin" }: MeetingScheduleProps) {
  return <MeetingsSchedulePanel orderId={orderId} role={role} />;
}
