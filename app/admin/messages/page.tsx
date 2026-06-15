"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Topbar from "@/components/admin/Topbar";
import ExternalChatView from "@/components/chat/ExternalChatView";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { PermissionGuard } from "@/components/common/PermissionGuard";

export default function MessagesPage() {
  const pathname = usePathname();
  const {isDark} = useResolvedTheme();

  return (
    <PermissionGuard module="messages" action="view">
      <>
      <Topbar pathname={pathname} />
      <div className="flex h-[calc(100vh-120px)] min-h-0 flex-col overflow-hidden p-4 lg:px-10 lg:py-9">
        <ExternalChatView
          role="admin"
          heading="Messages"
          description="Create and manage shoot conversations, direct client threads, and room participants from one place."
          isDark={isDark}
        />
      </div>
      </>
    </PermissionGuard>
  );
}
