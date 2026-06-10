"use client";

import React from "react";
import { usePathname } from 'next/navigation';

import Topbar from "@/components/admin/Topbar";
import AffiliateMessages from "@/components/affiliate/AffiliateMessages";

export default function AffiliateProfilePage() {
  const pathname = usePathname();

  return (
    <>
      <Topbar pathname={pathname} />
      <div className="flex h-[calc(100vh-120px)] min-h-0 flex-col overflow-hidden p-4 lg:px-10 lg:py-9" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
        <AffiliateMessages />
      </div>
    </>
  )
}
