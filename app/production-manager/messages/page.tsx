"use client";

import React from "react";
import ExternalChatView from "@/components/chat/ExternalChatView";
import Topbar from "@/components/production-manager/Topbar";
import { usePathname } from "next/navigation";

export default function MessagesPage() {
const pathname = usePathname();
  
  return (
    <>
      <Topbar pathname={pathname} />
        <div className="flex h-[calc(100vh-120px)] min-h-0 flex-col overflow-hidden p-4 lg:px-10 lg:py-9">
        <ExternalChatView
          role="pm"
          heading="Messages"
          description="Follow the project conversations that are assigned to you for post production."
        />
      </div>
    </>
  );
}



