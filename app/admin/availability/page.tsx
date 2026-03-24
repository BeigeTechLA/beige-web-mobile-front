"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from "next/navigation";
import { AvailabilityTable } from '@/components/admin/availability/AvailabilityTable';
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import Topbar from "@/components/admin/Topbar";
import { ArrowUpToLine } from "lucide-react";

export default function AvailabilityPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true) }, [])

  const isDark = !mounted || theme === "dark";

  return (
    <>
      <Topbar pathname={pathname}
        actions={
          // more filters and search components to be added here
          <Button className={`text-sm font-semibold h-12 px-4 lg:px-7 rounded-lg border hover:bg-white/10 transition-colors ${isDark ?"bg-[#202020] border-white/20 text-white":"bg-[#F0F0F0] border-[#E3E3E3] text-[#323232]"}`}>
            <ArrowUpToLine /> Export
          </Button>
        }
      />
      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-6">
        <AvailabilityTable isDark={isDark} />
      </div>
    </>
  );
}
