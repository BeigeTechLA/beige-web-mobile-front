"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Topbar from "@/components/admin/Topbar";
import MeetingsWorkspaceView from "@/components/meetings/MeetingsWorkspaceView";
import { PermissionGuard } from "@/components/common/PermissionGuard";

export default function AdminMeetingsPage() {
  const pathname = usePathname();

  return (
    <PermissionGuard module="meetings" action="view">
      <>
        <Topbar pathname={pathname} />
        <MeetingsWorkspaceView role="admin" />
      </>
    </PermissionGuard>
  );
}