"use client";

import React from "react";
import ExternalChatView from "@/components/chat/ExternalChatView";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

export default function AffiliateMessages() {
  const { isDark } = useResolvedTheme()

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-0 flex-col overflow-hidden">
      <ExternalChatView
        role="client"
        heading="Messages"
        description="Follow your booking conversations, message your assigned team, and stay updated from the client dashboard."
        isDark={isDark}
      />
    </div>
  );
}
