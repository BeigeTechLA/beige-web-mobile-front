"use client";

import React from "react";
import { usePathname } from 'next/navigation';

import Topbar from "@/components/admin/Topbar";
import AffiliateFileManager from "@/components/affiliate/AffiliateFileManager";
import { PermissionGuard } from "@/components/common/PermissionGuard";

export default function AffiliateProfilePage() {
  const pathname = usePathname();

  return (
    <PermissionGuard module="file_manager" action="view">
      <>
        <Topbar pathname={pathname} />

        <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
          <AffiliateFileManager />
        </div>
      </>
    </PermissionGuard>
  )
}
