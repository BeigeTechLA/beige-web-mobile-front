"use client";

import React from "react";
import ExternalChatView from "@/components/chat/ExternalChatView";
import { usePathname } from "next/navigation";
import Topbar from "@/components/admin/Topbar";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { PermissionGuard } from "@/components/common/PermissionGuard";

export default function CreatorMessagesPage() {
  const pathname = usePathname();
  const { isDark } = useResolvedTheme();

  return (
    <>
      <Topbar pathname={pathname} />
      <PermissionGuard module="messages" action="view">
          <div 
            className={`mx-4 lg:mx-8 mt-6 mb-10 rounded-2xl transition-all duration-700 overflow-hidden
              ${isDark 
                ? `bg-[#0A0A0A] border border-[#E8D1AB]/30 
                  shadow-[inset_0_0_12px_rgba(232,209,171,0.1),0_0_2px_rgba(232,209,171,0.8),0_0_15px_rgba(232,209,171,0.3),0_0_40px_rgba(232,209,171,0.15)]` 
                : "bg-white border-zinc-200 shadow-sm"
              }`}
          >
         <div className="flex h-[calc(100vh-160px)] min-h-0 flex-col p-4 lg:px-10 lg:py-9">
          <ExternalChatView
            role="cp"
            heading="Messages"
            description="Follow the shoot conversations where you are assigned and reply from your creative partner dashboard."
            isDark={isDark}
          />
        </div>
       </div>
      </PermissionGuard>
    </>
  );
}
