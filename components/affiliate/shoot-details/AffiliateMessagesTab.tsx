"use client";

import React from "react";
import ExternalChatView from "@/components/chat/ExternalChatView";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

interface AffiliateMessagesTabProps {
  bookingId?: string | number | null;
}

export default function AffiliateMessagesTab({ bookingId }: AffiliateMessagesTabProps) {
  const { isDark } = useResolvedTheme();
  return (
    <ExternalChatView
      role="client"
      bookingId={bookingId}
      heading="Project Chat"
      description="View and reply to the conversation for this project from your client workspace."
      isDark={isDark}
    />
  );
}
