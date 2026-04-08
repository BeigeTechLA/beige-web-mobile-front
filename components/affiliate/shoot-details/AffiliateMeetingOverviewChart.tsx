"use client";

import MeetingsOverviewChart from "@/components/meetings/MeetingsOverviewChart";

interface AffiliateMeetingOverviewChartProps {
  orderId?: string | number | null;
}

export default function AffiliateMeetingOverviewChart({ orderId }: AffiliateMeetingOverviewChartProps) {
  return <MeetingsOverviewChart orderId={orderId} />;
}
