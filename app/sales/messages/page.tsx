"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Topbar from "@/components/sales/Topbar";
import ExternalChatView from "@/components/chat/ExternalChatView";

export default function SalesMessagesPage() {
  const pathname = usePathname();

  return (
    <>
      <Topbar pathname={pathname} />
      <div className="flex h-[calc(100vh-120px)] min-h-0 flex-col overflow-hidden p-4 lg:px-10 lg:py-9">
        <ExternalChatView
          role="sales"
          heading="Messages"
          description="Follow booking conversations where you are included and reply from the sales workspace."
        />
      </div>
    </>
  );
}
