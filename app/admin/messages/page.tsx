"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Topbar from "@/components/admin/Topbar";
import ExternalChatView from "@/components/chat/ExternalChatView";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { Button } from "@/components/ui/button";

export default function MessagesPage() {
  const pathname = usePathname();
  const { isDark } = useResolvedTheme();
  const [createMessage, setCreateMessage] = useState(false);
  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setCreateMessage(true)}
              className={`rounded-lg lg:rounded-xl py-2 px-3 lg:px-4 lg:py-3 text-xs lg:text-sm font-semibold transition-colors ${isDark
                ? "bg-[#E8D1AB] text-black hover:bg-[#d8c49e] shadow-[0 8.838px 35.353px 0 #e8d1ab33]"
                : "bg-black text-white hover:bg-zinc-800"
                }`}
            >
              Create Message
            </Button>
          </div>
        }
      />
      <div className="flex h-screen min-h-0 flex-col overflow-hidden px-6 lg:px-10 py-6 lg:py-9">
        <ExternalChatView
          role="admin"
          heading="Messages"
          description="Communicate with clients and manage all your conversation in one place."
          isDark={isDark}
          createMessage={createMessage}
          onCreateMessageClose={() => setCreateMessage(false)}
        />
      </div>
    </>
  );
}