"use client";

import React from "react";
import ExternalChatView from "@/components/chat/ExternalChatView";
import { PermissionGuard } from "@/components/common/PermissionGuard";

export default function CreatorMessagesPage() {
  return (
    <PermissionGuard module="messages" action="view">
      <div className="flex h-[calc(100vh-120px)] min-h-0 flex-col overflow-hidden">
        <ExternalChatView
          role="cp"
          heading="Messages"
          description="Follow the shoot conversations where you are assigned and reply from your creative partner dashboard."
        />
      </div>
    </PermissionGuard>
  );
}
