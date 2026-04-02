"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from 'next/navigation';

import Topbar from "@/components/admin/Topbar";
import { AffiliateProfileSettings } from "@/components/affiliate/AffiliateProfileSettings";

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
        <div>
          <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"}`}>
            Profile Settings
          </h1>
          <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
            Manage your personal information and account security.
          </p>
        </div>

        <AffiliateProfileSettings isDark={isDark} />
      </div>
    </>
  )
}
