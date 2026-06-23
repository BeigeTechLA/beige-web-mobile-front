"use client";

import React from "react";
import { usePathname } from "next/navigation";

import SalesAvailability from "@/components/sales/SalesAvailability";
import Topbar from "@/components/sales/Topbar";
import { useRequireModulePermission } from "@/lib/hooks/useRequireModulePermission";

export default function SalesAvailabilityPage() {
  const pathname = usePathname();
  const { allowed, isLoading } = useRequireModulePermission(
    "availability",
    "view",
    "/sales/dashboard",
  );

  if (isLoading || !allowed) {
    return null;
  }

  return (
    <>
      <Topbar pathname={pathname} />
      <SalesAvailability />
    </>
  );
}
