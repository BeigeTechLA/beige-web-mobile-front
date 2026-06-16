"use client";

import React from "react";
import { usePathname } from "next/navigation";

import Topbar from "@/components/admin/Topbar";
import AffiliateMessages from "@/components/affiliate/AffiliateMessages";
import { PermissionGuard } from "@/components/common/PermissionGuard";

export default function AffiliateMessagesPage() {
  const pathname = usePathname();

  return (
    <PermissionGuard module="messages" action="view">
      <>
      <Topbar pathname={pathname} />
      <div className="flex h-[calc(100vh-120px)] min-h-0 flex-col overflow-hidden p-4 lg:px-10 lg:py-9" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
        <AffiliateMessages />
      </div>
      </>
    </PermissionGuard>
  );
}
