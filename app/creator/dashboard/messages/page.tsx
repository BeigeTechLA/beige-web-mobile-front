"use client";

import React from "react";
import ExternalChatView from "@/components/chat/ExternalChatView";

export default function CreatorMessagesPage() {
  return (
        <div className="flex h-[calc(100vh-120px)] min-h-0 flex-col overflow-hidden">

      <ExternalChatView
        role="cp"
        heading="Messages"
        description="Follow the shoot conversations where you are assigned and reply from your creative partner dashboard."
      />
    </div>
  );
}
