"use client";

import React from "react";
import ExternalChatView from "@/components/chat/ExternalChatView";
import { usePathname } from "next/navigation";
import Topbar from "@/components/admin/Topbar";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

export default function CreatorMessagesPage() {
  const pathname = usePathname();
  const { isDark } = useResolvedTheme();

  return (
    <>
      <Topbar pathname={pathname} />
      <div className="flex h-[calc(100vh-120px)] min-h-0 flex-col overflow-hidden p-4 lg:px-10 lg:py-9">
        <ExternalChatView
          role="cp"
          heading="Messages"
          description="Follow the shoot conversations where you are assigned and reply from your creative partner dashboard."
          isDark={isDark}
        />
      </div>
    </>
  );
}
