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
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import NotificationDetailsModal from "@/components/admin/NotificationDetailsModal";
import { useRouter } from "next/navigation";

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
  {
    id: 5,
    title: "Sarah Wilson approved your quote for Corporate Event Coverage",
    message: "Quote #QT-3921 has been approved and is ready to proceed.",
    time: "2h ago",
    unread: false,
    icon: ReceiptText,
    accent: "border-l-[#4CAF50]",
    category: "Quotes",
    priority: "Medium",
    action: "View Quote",
    avatar: "/images/avatar.png",
  },
  {
    id: 6,
    title: "Payment of $8,750 received from TechVision Inc.",
    message: "The payment has been successfully credited to your account.",
    time: "3h ago",
    unread: true,
    icon: ReceiptText,
    accent: "border-l-[#4CAF50]",
    category: "Payments",
    priority: "High",
    action: "View Payment",
    avatar: "/images/avatar.png",
  },
  {
    id: 7,
    title: "Alex Carter uploaded final project files",
    message: "All deliverables for Fashion Campaign are now available.",
    time: "4h ago",
    unread: false,
    icon: Camera,
    accent: "border-l-[#2D7FF9]",
    category: "Files",
    priority: "Medium",
    action: "View Files",
    avatar: "/images/avatar.png",
  },
  {
    id: 8,
    title: "Reminder: Client meeting starts in 30 minutes",
    message: "Creative strategy discussion with Bright Media.",
    time: "5h ago",
    unread: true,
    icon: MessageSquare,
    accent: "border-l-[#F5B83D]",
    category: "Meetings",
    priority: "High",
    action: "Join Meeting",
    avatar: "/images/avatar.png",
  },
  {
    id: 9,
    title: "Jessica Lee replied to your message",
    message: '"Please include an additional lifestyle shoot option."',
    time: "6h ago",
    unread: false,
    icon: MessageSquare,
    accent: "border-l-[#2D7FF9]",
    category: "Messages",
    priority: "Low",
    action: "Reply",
    avatar: "/images/avatar.png",
  },
  {
    id: 10,
    title: "Invoice #INV-3158 requires your attention",
    message: "The client requested clarification regarding the invoice.",
    time: "8h ago",
    unread: true,
    icon: ReceiptText,
    accent: "border-l-[#EF4444]",
    category: "Payments",
    priority: "High",
    action: "Review",
    avatar: "/images/avatar.png",
  },
  {
    id: 11,
    title: "Michael Brown invited you to collaborate",
    message: "Invitation to join the Summer Campaign 2026 project.",
    time: "10h ago",
    unread: false,
    icon: MessageSquare,
    accent: "border-l-[#2D7FF9]",
    category: "Projects",
    priority: "Medium",
    action: "Accept Invite",
    avatar: "/images/avatar.png",
  },
  {
    id: 12,
    title: "Product Photography Session updated",
    message: "Shoot timing has been changed to 2:00 PM.",
    time: "12h ago",
    unread: false,
    icon: Camera,
    accent: "border-l-[#4CAF50]",
    category: "Shoots",
    priority: "Low",
    action: "View Details",
    avatar: "/images/avatar.png",
  },
  {
    id: 13,
    title: "Client shared new reference images",
    message: "12 new inspiration images have been added to the project.",
    time: "14h ago",
    unread: true,
    icon: Camera,
    accent: "border-l-[#F5B83D]",
    category: "Files",
    priority: "Medium",
    action: "View Images",
    avatar: "/images/avatar.png",
  },
  {
    id: 14,
    title: "Weekly activity report is available",
    message: "Check your latest project and payment summary.",
    time: "1d ago",
    unread: false,
    icon: ReceiptText,
    accent: "border-l-[#2D7FF9]",
    category: "Reports",
    priority: "Low",
    action: "View Report",
    avatar: "/images/avatar.png",
  },
  {
    id: 15,
    title: "System maintenance scheduled",
    message: "Scheduled maintenance will take place on May 28 from 1:00 AM to 3:00 AM.",
    time: "2d ago",
    unread: false,
    icon: MessageSquare,
    accent: "border-l-[#9CA3AF]",
    category: "System",
    priority: "Low",
    action: "Learn More",
    avatar: "/images/avatar.png",
  },

];

const tabs = [
  { label: "All", count: notifications.length },
  { label: "Unread", count: notifications.filter(n => n.unread).length },
  { label: "Mentions", count: notifications.filter(n => n.category === "Messages").length },
  { label: "Payments", count: notifications.filter(n => n.category === "Payments").length },
  { label: "Projects", count: notifications.filter(n => n.category === "Projects" || n.category === "Shoots").length },
  { label: "Files", count: notifications.filter(n => n.category === "Files").length },
];

  interface NotificationsPageProps {
    onBack?: () => void;
  }
export default function NotificationsPage({ onBack }: NotificationsPageProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["label"]>("All");
  const [query, setQuery] = useState("");
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [openModal, setOpenModal] = useState(false);
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, query]);

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

    const totalPages = Math.max(
        1,
        Math.ceil(filteredNotifications.length / itemsPerPage)
      );

      const safePage = Math.min(currentPage, totalPages);
      const router = useRouter();
      
      const handleBack = onBack ?? (() => router.back());


      const startIndex = (safePage - 1) * itemsPerPage;

      const paginatedNotifications  = filteredNotifications.slice(
        startIndex,
        startIndex + itemsPerPage
      );

      const displayStart =
        filteredNotifications.length === 0 ? 0 : startIndex + 1;

      const displayEnd = Math.min(
        startIndex + itemsPerPage,
        filteredNotifications.length
      );

      const getPaginationRange = (current: number, total: number) => {
      const range: (number | string)[] = [];
      const delta = 1;

      for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
          range.push(i);
        } else if (range[range.length - 1] !== "...") {
          range.push("...");
        }
      }
      return range;
    };

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* 1.  HEADER SECTION */}
      <div className="top-0 z-50 flex flex-col w-full">
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

        {/* Right Side: Action Buttons*/}
          <div className="hidden sm:flex items-center gap-6">
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-100",
                    isDark ? "text-white opacity-90" : "text-[#2D2415] opacity-80"
                  )}
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </button>

                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-100",
                    isDark ? "text-white opacity-90" : "text-[#2D2415] opacity-80"
                  )}
                >
                <BellOff className="h-4 w-4" />
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
          <button
            onClick={handleBack}
            className={`mb-6 flex items-center gap-2 text-sm transition-colors ${
              isDark ? "text-white/70 hover:text-white" : "text-black/60 hover:text-black"
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          
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
              {paginatedNotifications.length > 0 ? (
                paginatedNotifications.map((item,index) => {
                  const Icon = item.icon;
                  return (
                    <div key={`${item.id}-${index}`} 
                    onClick={() => {
                      setSelectedNotification(item);
                      setOpenModal(true);
                    }}
                    className={cn(
                      "relative flex gap-4 border-l-4 px-4 py-6 lg:px-5 transition-colors",
                      item.accent,
                        isDark 
                        ? (item.unread ? "bg-[#1C1C1C]" : "bg-transparent") 
                        : (item.unread ? "bg-[#F9F6F0]" : "bg-white"),     
                       isDark ? "hover:bg-[#222222]" : "hover:bg-gray-50"    
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
                            <span className={cn(
                                "h-2 w-2 rounded-full", 
                                item.unread ? "bg-[#E8D1AB]" : "bg-[#444444]" 
                              )} />         
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
          <div
            className={cn(
              "flex items-center justify-between border-t px-6 py-4",
              isDark ? "border-white/10" : "border-gray-200"
            )}
          >
            <p className="text-sm text-white/60">
              Showing {displayStart} to {displayEnd} of {filteredNotifications.length}
            </p>

         <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={isDark ? "border-white/10 text-white hover:bg-white/5" : ""}
            disabled={safePage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Previous
          </Button>

          {getPaginationRange(safePage, totalPages).map((page, index) => {
            if (page === "...") {
              return <span key={index} className="px-2 text-white/40">...</span>;
            }

            return (
              <Button
                key={index} 
                size="sm"
                variant={safePage === page ? "default" : "outline"}
                className={cn(
                  "w-9 h-9 p-0", // Makes the button square like your image
                  safePage === page 
                    ? "bg-[#E8D1AB] text-black hover:bg-[#d8bd91]" 
                    : isDark ? "border-white/10 text-white hover:bg-white/5" : ""
                )}
                onClick={() => setCurrentPage(Number(page))}
              >
                {page}
              </Button>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            className={isDark ? "border-white/10 text-white hover:bg-white/5" : ""}
            disabled={safePage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  </div>
  <NotificationDetailsModal
    open={openModal}
    notification={selectedNotification}
    onClose={() => {
      setOpenModal(false);
      setSelectedNotification(null);
    }}
    isDark={isDark}
  />
    </div>
  );
}