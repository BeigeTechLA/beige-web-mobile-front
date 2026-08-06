"use client";
import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import {
  CheckCheck,
  Search,
  Archive,
  BellOff,
  MessageSquare,
  ReceiptText,
  FolderOpen,
  Camera,
} from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const notifications = [
  {
    id: 1,
    title: "Sarah Chen uploaded final deliverables for Summer Campaign 2026",
    message: "12 high-res images ready for client review",
    time: "5m ago",
    unread: true,
    icon: FolderOpen,
    accent: "border-l-[#FF5A5F]",
    category: "Files",
    priority: "Critical",
    action: "Review Files",
    avatar: "/images/avatar.png",
    featured: true,
  },
  {
    id: 2,
    title: "Marcus Johnson generated invoice for Project #2847",
    message: "Invoice #INV-2847 - $12,500.00 due June 15, 2026",
    time: "15m ago",
    unread: true,
    icon: ReceiptText,
    accent: "border-l-[#F5B83D]",
    category: "Payments",
    priority: "High",
    action: "View Invoice",
    avatar: "/images/avatar.png",
  },
  {
    id: 3,
    title: "Emily Rodriguez mentioned you in Brand Guidelines Discussion",
    message: '"@you Can we adjust the color palette for accessibility?"',
    time: "30m ago",
    unread: true,
    icon: MessageSquare,
    accent: "border-l-[#F5B83D]",
    category: "Messages",
    priority: "High",
    action: "View Message",
    avatar: "/images/avatar.png",
  },
  {
    id: 4,
    title: "David Kim scheduled a shoot for Product Photography Session",
    message: "May 20, 2026 at 10:00 AM - Studio B",
    time: "1h ago",
    unread: false,
    icon: Camera,
    accent: "border-l-[#2D7FF9]",
    category: "Shoots",
    priority: "Medium",
    action: "View Details",
    avatar: "/images/avatar.png",
  },
];

const tabs = [
  { label: "All", count: 10 },
  { label: "Unread", count: 2 },
  { label: "Mentions", count: 1 },
  { label: "Payments", count: 2 },
  { label: "Projects", count: 2 },
  { label: "Files", count: 2 },
] as const;

export default function NotificationsPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["label"]>("All");
  const [query, setQuery] = useState("");

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";
  const unreadCount = notifications.filter((item) => item.unread).length;
  
  const filteredNotifications = notifications
    .filter((item) => {
      // Tab Filtering
      if (activeTab === "Unread") return item.unread;
      if (activeTab === "Mentions") return item.category === "Messages";
      if (activeTab === "Projects") {
        return item.category === "Shoots" || item.category === "Projects" || item.title.toLowerCase().includes("project");
      }
      if (activeTab !== "All" && item.category !== activeTab) return false;
      return true;
    })
    .filter((item) =>
      // Search Filtering
      `${item.title} ${item.message} ${item.category}`.toLowerCase().includes(query.toLowerCase())
    );

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* 1. STICKY HEADER SECTION */}
      <div className="sticky top-0 z-50 flex flex-col w-full">
        <Topbar
          pathname="/admin/dashboard/notifications"
          breadcrumbOverrides={{
            notifications: "Notifications",
          }}
          actions={
            <Button 
              onClick={() => {}} 
              className="bg-[#E5D5B8] text-black h-9 px-4 font-semibold hover:bg-[#d4c3a3]"
            >
              <CheckCheck/> 
              Mark all as read
            </Button>
          }
        />

        {/* --- THE ATTACHED BANNER --- */}
        <div
        className={cn(
            "flex items-center justify-between gap-4 border-b px-4 py-3 sm:px-6 lg:px-8 transition-colors",
            isDark
            ? "border-[#4E4128] bg-[#2B2823] text-[#E6D8B6]"
            : "border-[#D7C295] bg-[#EFE1BE] text-[#2D2415]"
        )}
        >
        {/* Left Side: Notification Count */}
        <div className="flex items-center gap-3 min-w-0">
            <p className="min-w-0 truncate text-sm font-medium sm:text-base">
            {unreadCount} Unread Notifications
            </p>
        </div>

        {/* Right Side: Action Buttons (Moved out of the first div) */}
        <div className="hidden sm:flex items-center gap-4">
            <button
            type="button"
            className="flex items-center gap-2 text-xs font-medium opacity-70 hover:opacity-100 transition"
            >
            <Archive className="h-3.5 w-3.5" />
            Archive All
            </button>
            <div className="h-4 w-[1px] bg-current/20" /> {/* Replaced border-l with a vertical divider */}
            <button
            type="button"
            className="flex items-center gap-2 text-xs font-medium opacity-70 hover:opacity-100 transition"
            >
            <BellOff className="h-3.5 w-3.5" />
            Mute
            </button>
        </div>
        </div>
      </div>

      {/* 2. SCROLLABLE CONTENT AREA */}
      <div className={cn(
        "flex-1 w-full px-4 py-8 lg:px-6",
        isDark ? "bg-[#111111]" : "bg-[#F6F1E8]"
      )}>
        <div className="mx-auto max-w-[1120px] space-y-6">
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Notifications..."
              className={cn(
                "h-12 w-full rounded-xl border pl-11 pr-4 text-sm outline-none transition",
                isDark 
                  ? "border-[#343434] bg-[#1A1A1A] text-white placeholder:text-white/30 focus:border-[#E8D1AB]" 
                  : "border-[#E1D8C8] bg-white text-black focus:border-[#B38B4D]"
              )}
            />
          </div>

          {/* Tabs and Notification List */}
          <div className={cn(
            "rounded-2xl border overflow-hidden",
            isDark ? "border-[#2B2B2B] bg-[#181818]" : "border-[#E4DBCD] bg-white"
          )}>
            <div className="flex gap-2 overflow-x-auto px-4 pt-4 border-b border-white/5">
              {tabs.map((tab) => {
                const active = activeTab === tab.label;
                return (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => setActiveTab(tab.label)}
                    className={cn(
                      "relative flex shrink-0 items-center gap-2 px-4 pb-4 pt-1 text-sm transition",
                      active ? "text-[#E8D1AB]" : "text-white/55 hover:text-white"
                    )}
                  >
                    <span>{tab.label}</span>
                    <span className={cn(
                      "rounded-full px-1.5 py-0.5 text-[11px] leading-none",
                      active ? "bg-[#3A3327] text-[#E8D1AB]" : "bg-[#2B2B2B] text-white/60"
                    )}>
                      {String(tab.count).padStart(2, "0")}
                    </span>
                    {active && <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-[#E8D1AB]" />}
                  </button>
                );
              })}
            </div>

            <div className="divide-y divide-white/5">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className={cn(
                      "relative flex gap-4 border-l-4 px-4 py-6 lg:px-5 transition-colors",
                      item.accent,
                      isDark ? "bg-[#1F1F1F] hover:bg-[#252525]" : "bg-white hover:bg-gray-50"
                    )}>
                      <div className="flex w-full items-start gap-4">
                        <div className="relative shrink-0">
                          <div className="h-8 w-8 overflow-hidden rounded-full border border-white/10">
                            <Image src={item.avatar} alt={item.title} width={32} height={32} className="h-full w-full object-cover" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <h3 className={cn("text-[15px] font-semibold leading-5", isDark ? "text-white" : "text-black")}>
                                {item.title}
                              </h3>
                              <p className={cn("mt-1 text-sm", isDark ? "text-white/50" : "text-black/60")}>
                                {item.message}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2 text-xs text-white/55">
                              <span>{item.time}</span>
                              <span className={cn("h-2 w-2 rounded-full", item.unread ? "bg-[#E8D1AB]" : "bg-white/20")} />
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-white/5 px-3 py-1.5 text-xs text-white/80 border border-white/10">
                                <Icon className="h-3.5 w-3.5" />
                                {item.category}
                              </span>
                              <span className={cn(
                                "rounded-md px-3 py-1.5 text-xs font-medium",
                                item.priority === "Critical" ? "bg-red-500/10 text-red-500" : 
                                item.priority === "High" ? "bg-amber-500/10 text-amber-500" : 
                                "bg-blue-500/10 text-blue-500"
                              )}>
                                {item.priority}
                              </span>
                            </div>
                            <Button className="h-8 rounded-lg bg-[#E8D1AB] px-4 text-xs font-bold text-black hover:bg-[#d8bd91]">
                              {item.action}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center">
                  <p className="text-white/40 text-sm">No notifications match your criteria.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}