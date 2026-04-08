"use client";

import React from "react";
import ExternalChatView from "@/components/chat/ExternalChatView";

interface MessagesTabProps {
  bookingId?: string | number | null;
}

export default function MessagesTab({ bookingId }: MessagesTabProps) {
  return (
    <ExternalChatView
      role="pm"
      bookingId={bookingId}
      heading="Project Chat"
      description="Reply to project conversations when this booking is assigned to you for post production."
    />
  );
}
