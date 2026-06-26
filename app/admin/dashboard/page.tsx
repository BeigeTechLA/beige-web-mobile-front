"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";

import { OverallShootsTable } from "@/components/admin/OverallShootsTable";
import { LeadsShootsTable } from "@/components/admin/LeadsShootsTable";
import { TopCreatives } from "@/components/admin/TopCreatives";
import { Button } from "@/components/ui/button";
import { SortDateButton } from "@/components/admin/SortDateButton";

import OverviewChart from "@/components/admin/OverviewChart";
import RecentActivity from "@/components/admin/RecentActivity";
import ShootByCategory from "@/components/admin/ShootByCategory";
import ShootStatusChart from "@/components/admin/ShootStatusChart";
import StackedDashboard from "@/components/admin/StatsModule";
import Topbar from "@/components/admin/Topbar";
import { Bell, Settings, Users, X } from "lucide-react";

// Settings Dropdown Component
function SettingsDropdown({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-end pt-20 pr-8">
        <div
          ref={dropdownRef}
          className="w-[420px] bg-black rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Settings</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {/* General Settings */}
            <button className="w-full flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors text-left group">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                <Users size={20} className="text-[#E8D1AB]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-white mb-1">General Settings</h3>
                <p className="text-sm text-gray-400">Manage Language, Time Zone and other Personal Preferences</p>
              </div>
            </button>

            {/* Notification Preferences */}
            <button
              onClick={() => router.push("/admin/notifications/preferences")}
              className="w-full flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors text-left group">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                <Bell size={20} className="text-[#E8D1AB]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-white mb-1">Notification Preferences</h3>
                <p className="text-sm text-gray-400">Manage how and when you receive notifications</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}



export default function AdminDashboardPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const pathname = usePathname();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleDateSort = (date: Date | null) => {
    setSelectedDate(date);
  };

  // Constant default to dark
  const isDark = !mounted || theme === "dark";

  const unreadCount = 3; // Replace with your actual notification count

  return (
    <>
      <Topbar pathname={pathname}
        actions={
          <div className="flex gap-2">
            <Button onClick={() => router.push("/book-a-shoot")} className="bg-[#E5D5B8] text-black">
              Book a Shoot
            </Button>

            <Button
              onClick={() => router.push("/admin/notifications")}
              className={`
      relative flex items-center justify-center w-10 h-10 rounded-full border transition-all
      ${isDark
                  ? "bg-[#171717] border-[#2B2B2B] text-[#E8D1AB] hover:bg-[#222]"
                  : "bg-white border-gray-200 text-[#C4A47C] hover:bg-gray-50"
                }
    `}
              aria-label="Notifications"
            >
              <Bell size={18} strokeWidth={2} />
              {/* Notification Badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#E8D1AB] text-[10px] font-bold text-black border-2 border-[#171717]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>


            <Button
              onClick={() => setSettingsOpen(true)}
              className={`
                  flex items-center justify-center w-10 h-10 rounded-full border transition-all
                  ${isDark
                  ? "bg-[#171717] border-[#2B2B2B] text-white hover:bg-[#222]"
                  : "bg-white border-gray-200 text-[#101010] hover:bg-gray-50"
                }
                `}
              aria-label="Settings"
            >
              <Settings size={24} strokeWidth={2} />
            </Button>
          </div>
        }
      />

      <div className="overflow-hidden pb-30 p-4 lg:p-6 lg:px-10 lg:py-9" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex justify-between items-center">
          <div className="text-white">
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"
              }`}>Welcome back, Admin !</h1>
            <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>Monitor revenue, shoots, Users, and performance metrics in one centralized dashboard.</p>
          </div>
          <SortDateButton
            selectedDate={selectedDate}
            onDateChange={handleDateSort}
          />
        </div>

        <OverviewChart externalSelectedDate={selectedDate} />

        <div className="flex flex-col lg:flex-row gap-4 mt-5">
          <div className="lg:w-3/4 flex flex-col gap-4">
            <StackedDashboard />
            <TopCreatives />
          </div>
          <div className="lg:w-1/4">
            <ShootByCategory />
          </div>
        </div>
        <OverallShootsTable />

        <div className="flex flex-col lg:flex-row gap-4 mt-5 lg:pb-0">
          <div className="lg:w-3/4">
            <ShootStatusChart />
          </div>
          <div className="lg:w-1/4">
            <RecentActivity />
          </div>
        </div>

        <LeadsShootsTable />

        {/* --- FLOATING MOBILE BUTTON --- */}
        <div className={`lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"}`}>
          <Button
            onClick={() => router.push("/book-a-shoot")}
            className="w-full bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
          >
            Book a Shoot
          </Button>
        </div>
      </div>
      {/* Settings Dropdown Modal */}
      <SettingsDropdown
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  )
}