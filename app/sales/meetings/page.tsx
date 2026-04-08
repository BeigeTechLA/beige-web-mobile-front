"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Topbar from "@/components/sales/Topbar";
import MeetingsWorkspaceView from "@/components/meetings/MeetingsWorkspaceView";

export default function SalesMeetingsPage() {
  const pathname = usePathname();

  return (
    <>
      <Topbar pathname={pathname} />
      <MeetingsWorkspaceView role="sales" />
    </>
  );
}
