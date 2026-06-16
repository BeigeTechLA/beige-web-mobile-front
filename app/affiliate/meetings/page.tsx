"use client";

import React from "react";
import { usePathname } from "next/navigation";

import Topbar from "@/components/admin/Topbar";
import AffiliateMeetings from "@/components/affiliate/AffiliateMeetings";
import { PermissionGuard } from "@/components/common/PermissionGuard";

export default function AffiliateMeetingsPage() {
  const pathname = usePathname();

  return (
    <PermissionGuard module="meetings" action="view">
      <>
        <Topbar pathname={pathname} />
        <AffiliateMeetings />
      </>
    </PermissionGuard>
  );
}
