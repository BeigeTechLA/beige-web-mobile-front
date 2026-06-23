"use client";

import React from "react";
import MeetingsWorkspaceView from "@/components/meetings/MeetingsWorkspaceView";
import Topbar from "@/components/production-manager/Topbar";
import { usePathname } from "next/navigation";
import { PermissionGuard } from "@/components/common/PermissionGuard";

export default function ProductionManagerMeetingsPage() {
  const pathname = usePathname();

  return (
    <PermissionGuard module="meetings" action="view">
      <>
        <Topbar pathname={pathname} />
        <MeetingsWorkspaceView role="pm" />
      </>
    </PermissionGuard>
  );
}
