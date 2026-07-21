"use client";

import MeetingsSchedulePanel from "@/components/meetings/MeetingsSchedulePanel";

interface MeetingScheduleProps {
  orderId?: string | number | null;
  role?: "admin" | "sales" | "client" | "cp" | "pm";
  createPermissionModuleKey?: string;
}

export default function MeetingSchedule({ orderId, role = "admin", createPermissionModuleKey }: MeetingScheduleProps) {
  return <MeetingsSchedulePanel orderId={orderId} role={role} createPermissionModuleKey={createPermissionModuleKey} />;
}
