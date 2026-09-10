"use client";

import { usePathname, useRouter } from "next/navigation";

import Topbar from "@/components/admin/Topbar";
import AssignmentHistoryView from "@/components/admin/sales-representative/AssignmentHistoryView";

const SHIFT_MANAGEMENT_BASE_PATH =
  "/admin/sales-representative/shift-management";

export default function ShiftAssignmentHistoryPage() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{
          "sales-representative": "Sales Representative",
          "shift-management": "Shift Management",
          "view-history": "View History",
        }}
      />

      <AssignmentHistoryView
        onBack={() => {
          router.push(SHIFT_MANAGEMENT_BASE_PATH);
        }}
      />
    </>
  );
}