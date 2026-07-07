"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Topbar from "@/components/admin/Topbar";
import MeetingsWorkspaceView from "@/components/meetings/MeetingsWorkspaceView";

export default function CreatorMeetingsPage() {
  const pathname = usePathname();

  return (
    <>
      <Topbar pathname={pathname} />
      <MeetingsWorkspaceView role="cp" />;
    </>
  )
}
