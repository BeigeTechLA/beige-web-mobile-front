"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Topbar from "@/components/admin/Topbar";
import MeetingsWorkspaceView from "@/components/meetings/MeetingsWorkspaceView";
import { PermissionGuard } from "@/components/common/PermissionGuard";

export default function CreatorMeetingsPage() {
  const pathname = usePathname();

  return (
    <>
      <Topbar pathname={pathname} />
      <PermissionGuard module="meetings" action="view">
        <MeetingsWorkspaceView role="cp" />
      </PermissionGuard>
    </>
  )
}