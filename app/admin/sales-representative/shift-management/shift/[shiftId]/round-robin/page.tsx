"use client";

import { useParams } from "next/navigation";
import ShiftManagementPage from "@/components/admin/sales-representative/ShiftManagementPage";

export default function ShiftRoundRobinConfigurationPage() {
  const params = useParams<{
    shiftId: string;
  }>();

  return (
    <ShiftManagementPage
      routeView="round-robin"
      routeShiftId={params.shiftId}
    />
  );
}