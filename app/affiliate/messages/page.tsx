"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from 'next/navigation';

import Topbar from "@/components/admin/Topbar";
import AffiliateMessages from "@/components/affiliate/AffiliateMessages";

export default function AffiliateProfilePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Constant default to dark
  const isDark = !mounted || theme === "dark";

  return (
    <>
      <Topbar pathname={pathname} />

      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
        {/* Header */}
        <div className="flex justify-between items-start lg:items-end">
          <div>
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"}`}>
              Messages
            </h1>
            <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
              Communicate with clients and manage all your conversation in one place
            </p>
          </div>
        </div>

        <AffiliateMessages />
      </div>
    </>
  )
}
