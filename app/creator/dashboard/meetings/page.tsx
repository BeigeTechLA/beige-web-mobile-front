"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Topbar from "@/components/admin/Topbar";
import MeetingsWorkspaceView from "@/components/meetings/MeetingsWorkspaceView";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

export default function CreatorMeetingsPage() {
  const pathname = usePathname();
  const { isDark } = useResolvedTheme();

  return (
    <>
      <Topbar pathname={pathname} />
      <PermissionGuard module="meetings" action="view">
        <div 
          className={`mx-4 lg:mx-8 mt-6 mb-10 rounded-2xl transition-all duration-700 overflow-hidden
            ${isDark 
              ? `bg-[#0A0A0A] 
                 border border-[#E8D1AB]/30 
                 shadow-[inset_0_0_12px_rgba(232,209,171,0.1),0_0_2px_rgba(232,209,171,0.8),0_0_15px_rgba(232,209,171,0.3),0_0_40px_rgba(232,209,171,0.15)]` 
              : "bg-white border-zinc-200 shadow-sm"
            }`}
        >
        <MeetingsWorkspaceView role="cp" />
      </div>
      </PermissionGuard>
    </>
  )
}