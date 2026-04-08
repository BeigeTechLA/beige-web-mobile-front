"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Topbar from "@/components/admin/Topbar";
import ExternalChatView from "@/components/chat/ExternalChatView";

export default function MessagesPage() {
  const pathname = usePathname();

  return (
    <>
      <Topbar pathname={pathname} />
      <div className="flex h-[calc(100vh-120px)] min-h-0 flex-col overflow-hidden p-4 lg:px-10 lg:py-9">
        <ExternalChatView
          role="admin"
          heading="Messages"
          description="Create and manage shoot conversations, direct client threads, and room participants from one place."
        />
      </div>
    </>
  );
}
