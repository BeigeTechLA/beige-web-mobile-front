"use client";

import React, { useState, useRef } from "react";
import { usePathname } from "next/navigation";
import Topbar from "@/components/admin/Topbar";
import ExternalChatView, { type ExternalChatViewRef } from "@/components/chat/ExternalChatView";

import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import { Button } from "@/components/ui/button";

export default function MessagesPage() {
  const pathname = usePathname();
  const { isDark } = useResolvedTheme();

  //Create a typed reference pointer
  const chatViewRef = useRef<ExternalChatViewRef>(null);

  // Placeholder rule matching the conditional availability requirements
  const canCreateMessageRoom = true;

  return (
    <PermissionGuard module="messages" action="view">
      <>
        <Topbar
          pathname={pathname}
          actions={
            <div className="flex flex-col lg:flex-row gap-2 lg:gap-3">
              <Button
                onClick={() => chatViewRef.current?.triggerComposerOpen()}
                disabled={!canCreateMessageRoom}
                title={canCreateMessageRoom ? "Create Messages" : "Create permission not allowed"}
                className="bg-[#E8D1AB] text-black h-12 px-4 lg:px-7"
              >
                Create Messages
              </Button>
            </div>
          } />
        <div className="flex h-[calc(100vh-120px)] min-h-0 flex-col overflow-hidden p-4 pb-30 lg:px-10 lg:py-9">
          <ExternalChatView
            role="admin"
            heading="Messages"
            description="Create and manage shoot conversations, direct client threads, and room participants from one place."
            isDark={isDark}
            ref={chatViewRef}
          />
        </div>
      </>
    </PermissionGuard>
  );
}
