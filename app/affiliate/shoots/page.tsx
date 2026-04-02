"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from 'next/navigation';

import Topbar from "@/components/admin/Topbar";

import { AffiliateProfileSettings } from "@/components/affiliate/AffiliateProfileSettings";
import { AffiliateShoots } from "@/components/affiliate/AffiliateShoots";
import { SortDateButton } from "@/components/admin/SortDateButton";

export default function AffiliateProfilePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isShootFormOpen, setIsShootFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);


  useEffect(() => setMounted(true), []);

  const handleDateSort = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      console.log(date);
    } else {
      console.log("unfiltered");
    }
  };

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
              Shoots Management
            </h1>
            <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
              Track and manage your photography and videography project
            </p>
          </div>
          <SortDateButton
            selectedDate={selectedDate}
            onDateChange={handleDateSort}
          />
        </div>

        <AffiliateShoots
          onShootClick={(id) => setSelectedBooking(id)}
          onFillDetailsClick={() => setIsShootFormOpen(true)}
          pendingCount={pendingCount}
          selectedDate = {selectedDate}
        />
      </div>
    </>
  )
}
