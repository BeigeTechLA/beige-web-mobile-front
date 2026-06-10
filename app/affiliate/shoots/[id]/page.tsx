"use client";

import React, { useState, useEffect, use } from "react";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from 'next/navigation';

import Topbar from "@/components/admin/Topbar";

import AffiliateShootDetails from "@/components/affiliate/AffiliateShootDetails";

export default function AffiliateProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { theme } = useTheme();
  const pathname = usePathname();
  const { id } = use(params);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true)
    console.log(id);
  }, []);

  // Constant default to dark
  const isDark = !mounted || theme === "dark";

  return (
    <>
      <Topbar pathname={pathname} />
      {/* <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8" style={{ fontFamily: 'var(--font-instrument-sans)' }}> */}
        <AffiliateShootDetails
          shootId={id}
        />
      {/* </div> */}
    </>
  )
}
