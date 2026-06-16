"use client";

import React from "react";
import MeetingsWorkspaceView from "@/components/meetings/MeetingsWorkspaceView";
import { PermissionGuard } from "@/components/common/PermissionGuard";

export default function CreatorMeetingsPage() {
  return (
    <PermissionGuard module="meetings" action="view">
      <MeetingsWorkspaceView role="cp" />
    </PermissionGuard>
  );
}
