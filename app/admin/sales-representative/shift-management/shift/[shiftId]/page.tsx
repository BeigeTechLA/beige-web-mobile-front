"use client";

import { useParams } from "next/navigation";
import ShiftManagementPage from "@/components/admin/sales-representative/ShiftManagementPage";

export default function ShiftDetailPage() {
  const params = useParams<{
    shiftId: string;
  }>();

  return (
    <ShiftManagementPage
      routeView="shift"
      routeShiftId={params.shiftId}
    />
  );
}