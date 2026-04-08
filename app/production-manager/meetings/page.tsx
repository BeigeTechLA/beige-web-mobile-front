"use client";

import React from "react";
import MeetingsWorkspaceView from "@/components/meetings/MeetingsWorkspaceView";
import Topbar from "@/components/production-manager/Topbar";
import { usePathname } from "next/navigation";

export default function ProductionManagerMeetingsPage() {
  const pathname = usePathname();
  
  return<>
  <Topbar pathname={pathname} />
  <MeetingsWorkspaceView role="pm" />;
  </> 
}
