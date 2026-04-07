"use client";

import MeetingsOverviewChart from "@/components/meetings/MeetingsOverviewChart";

interface MeetingOverviewChartProps {
  orderId?: string | number | null;
}

export default function ProductionMeetingOverviewChart({ orderId }: MeetingOverviewChartProps) {
  return <MeetingsOverviewChart orderId={orderId} />;
}
