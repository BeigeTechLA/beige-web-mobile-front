"use client";

import { useParams } from "next/navigation";
import ShiftManagementPage from "@/components/admin/sales-representative/ShiftManagementPage";

export default function ShiftSalespersonDetailPage() {
  const params = useParams<{
    shiftId: string;
    salesRepId: string;
  }>();

  return (
    <ShiftManagementPage
      routeView="salesperson"
      routeShiftId={params.shiftId}
      routeSalesRepId={params.salesRepId}
    />
  );
}