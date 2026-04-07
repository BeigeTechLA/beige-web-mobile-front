"use client";

import React from "react";
import ExternalChatView from "@/components/chat/ExternalChatView";

export default function MessagesPage() {
  return (
    <div className="flex h-[calc(100vh-120px)] min-h-0 flex-col overflow-hidden">
      <ExternalChatView
        role="pm"
        heading="Messages"
        description="Follow the project conversations that are assigned to you for post production."
      />
    </div>
  );
}
