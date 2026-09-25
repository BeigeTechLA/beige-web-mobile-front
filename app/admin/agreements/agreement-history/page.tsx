"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, ChevronDown, User, Clock, AlertCircle } from "lucide-react";
import { useTheme } from "next-themes";
import Topbar from "@/components/admin/Topbar";

interface VersionItem {
  id: string;
  versionNumber: number;
  versionTag: string; // e.g. "V1"
  isCurrent?: boolean;
  author: string;
  date: string;
  reason: string;
  description: string;
  avatars?: { initials: string; bg: string }[];
}

// Dummy Data for Version History
const VERSION_HISTORY_DATA: VersionItem[] = [
  {
    id: "v2",
    versionNumber: 2,
    versionTag: "V1",
    isCurrent: false,
    author: "John Smith",
    date: "March 10, 2026",
    reason: "Initial agreement creation",
    description: "Original Agreement created",
  },
  {
    id: "v1",
    versionNumber: 1,
    versionTag: "V1",
    isCurrent: true,
    author: "John Smith",
    date: "March 10, 2026",
    reason: "Initial agreement creation",
    description: "Original Agreement created",
  },
];

export default function AdminVersionHistoryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Status");
  const [selectedMonth, setSelectedMonth] = useState("Month");
  const [selectedFilter, setSelectedFilter] = useState("All");

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  if (!mounted) return null;

  const filteredVersions = VERSION_HISTORY_DATA.filter((item) =>
    `Version ${item.versionNumber}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Topbar pathname={pathname} />

      <div
        className={`min-h-screen p-4 lg:p-6 lg:px-10 lg:py-9 font-sans pb-28 transition-colors space-y-4 lg:space-y-9 ${isDark ? "bg-[#0A0A0A] text-white" : "bg-[#F3F4F6] text-black"
          }`}
      >
        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          className={`transition-colors flex items-center gap-2 mb-5 p-0 ${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"}`}
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        <div className="flex flex-col justify-between items-start w-full">
          <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors ${isDark ? "text-white" : "text-black"}`}>
            Agreement History - ABC Corporate Shoot
          </h1>
          <p className={`text-xs lg:text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
            Client: Acme Corporation • Quote #Q1
          </p>
        </div>

        {/* Version History Container */}
        <div className={`border rounded-2xl ${isDark ? "bg-[#111111] border-[#3D3D3D]" : "bg-white border-[#E2E8F0]"}`}>
          <div className={`p-5 border-b rounded-2xl space-y-5 ${isDark ? "bg-[#101010] border-[#3D3D3D]" : "bg-white border-[#E2E8F0]"}`}>
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-[3px] h-5 bg-[#E5D5B8] rounded-full" />
                <h2 className={`text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>
                  Version History
                </h2>
              </div>

              {/* Filter Dropdowns */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <div className="relative">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className={`appearance-none text-[10px] px-3 py-1.5 pr-7 rounded-full border cursor-pointer focus:outline-none ${isDark
                      ? "bg-[#171717] border-[#807E7E] text-[#C4C4C4]"
                      : "bg-[#F8F8F8] border-[#E5E5E5] text-black/80"
                      }`}
                  >
                    <option value="Status">Status</option>
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                </div>

                <div className="relative">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className={`appearance-none text-[10px] px-3 py-1.5 pr-7 rounded-full border cursor-pointer focus:outline-none ${isDark
                      ? "bg-[#171717] border-[#807E7E] text-[#C4C4C4]"
                      : "bg-[#F8F8F8] border-[#E5E5E5] text-black/80"
                      }`}
                  >
                    <option value="Month">Month</option>
                    <option value="Jan">January</option>
                    <option value="Feb">February</option>
                    <option value="Mar">March</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                </div>

                <div className="relative">
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className={`appearance-none text-[10px] px-3 py-1.5 pr-7 rounded-full border cursor-pointer focus:outline-none ${isDark
                      ? "bg-[#171717] border-[#807E7E] text-[#C4C4C4]"
                      : "bg-[#F8F8F8] border-[#E5E5E5] text-black/80"
                      }`}
                  >
                    <option value="All">All</option>
                    <option value="Major">Major Versions</option>
                    <option value="Minor">Minor Versions</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full">
              <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-white/40" : "text-black/40"}`} />
              <input
                type="text"
                placeholder="Search by Agreement Version.."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full text-sm pl-10 pr-4 py-3 rounded-lg border focus:outline-none transition-colors ${isDark
                  ? "bg-[#202020] border-white/20 text-white placeholder-white/30 focus:border-white/30"
                  : "bg-[#F9FAFB] border-[#E5E5E5] text-black placeholder-black/30 focus:border-black/30"
                  }`}
              />
            </div>
          </div>


          {/* Version Cards List */}
          <div className="space-y-4  p-5">
            {filteredVersions.map((item) => (
              <div
                key={item.id}
                className={`border rounded-lg p-4 lg:p-6 space-y-4 transition-colors ${isDark ? "bg-[#101010] border-white/30" : "bg-white border-[#E5E5E5]"}`}
              >
                {/* Card Top Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {/* Circle Version Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-semibold text-base ${isDark ? "bg-[#27272A] text-[#9F9FA9]" : "bg-[#EFEFEF] text-black/70"}`}>
                      {item.versionTag}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-base lg:text-lg font-medium ${isDark ? "text-white" : "text-black"}`}>
                          Version {item.versionNumber}
                        </h3>
                        {item.isCurrent && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#2E2108] text-[#E8B049] border border-[#523C13]">
                            Current
                          </span>
                        )}
                      </div>

                      <div className={`flex items-center gap-3 text-sm ${isDark ? "text-[#9F9FA9]" : "text-black/50"}`}>
                        <span className="flex items-center gap-1">
                          <User size={16} />
                          {item.author}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={16} />
                          {item.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Avatars & Action Buttons */}
                  <div className="flex items-center gap-3 self-end lg:self-center">
                    {item.avatars && (
                      <div className="flex items-center -space-x-2 bg-[#1DA152] p-1.5 rounded-full pr-2">
                        {item.avatars.map((av, idx) => (
                          <div
                            key={idx}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#1DA152] ${av.bg}`}
                          >
                            {av.initials}
                          </div>
                        ))}
                      </div>
                    )}

                    <Button
                      onClick={() => console.log("Preview", item.versionNumber)}
                      className={`h-10 px-5 rounded-lg text-sm font-semibold transition-all ${isDark
                        ? "bg-[#202020] border border-white/10 text-white hover:bg-[#303030]"
                        : "bg-[#F3F4F6] border border-[#E5E5E5] text-black hover:bg-[#E5E7EB]"
                        }`}
                    >
                      Preview Agreement
                    </Button>

                    <Button
                      onClick={() => console.log("Revert", item.versionNumber)}
                      className="h-10 px-5 rounded-lg text-sm font-semibold bg-[#E8D1AB] text-black hover:bg-[#D5C5A8] transition-all"
                    >
                      Revert to Version {item.versionNumber}
                    </Button>
                  </div>
                </div>

                {/* Reason Callout Box */}
                <div
                  className={`border rounded-sm p-3 flex items-center gap-2.5 text-sm ${isDark
                    ? "bg-[#27272A]/50 border-[#3F3F47] text-[#D4D4D8]"
                    : "bg-[#F9FAFB] border-[#E5E5E5] text-black/80"
                    }`}
                >
                  <AlertCircle size={16} className="shrink-0" strokeWidth={1.5} />
                  <span>
                    <strong>Reason:</strong> {item.reason}
                  </span>
                </div>

                {/* Description Footer */}
                <p className={`text-sm italic ${isDark ? "text-[#71717B]" : "text-black/40"}`}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}