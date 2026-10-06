"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Archive, BellOff, Camera, DollarSign, File, MessageSquare, Search } from "lucide-react";
import { useTheme } from "next-themes";

import Topbar from "@/components/admin/Topbar";
import NotificationHeaderActions from "@/components/admin/notifications/NotificationHeaderActions";
import NotificationDetailsModal from "@/components/admin/notifications/NotificationDetailsModal";
import { type AdminNotification, type NotificationCategory } from "@/components/admin/notifications/notificationData";
import { readNotifications, writeNotifications } from "@/components/admin/notifications/notificationStore";

const tabs = ["All", "Unread", "Mentions", "Payments", "Projects", "Files"] as const;
type NotificationTab = (typeof tabs)[number];

const categoryIcon = (category: NotificationCategory) => {
  switch (category) {
    case "Files":
      return <File size={15} />;
    case "Payments":
      return <DollarSign size={15} />;
    case "Messages":
      return <MessageSquare size={15} />;
    case "Shoots":
      return <Camera size={15} />;
    default:
      return <File size={15} />;
  }
};

const priorityClass = (priority: AdminNotification["priority"]) => {
  if (priority === "Critical") return "bg-[#FFF0F0] text-[#F04444]";
  if (priority === "High") return "bg-[#FFF9E7] text-[#E39300]";
  if (priority === "Medium") return "bg-[#E9F1FF] text-[#3A72F4]";
  return "bg-[#ECECEC] text-[#6B6B6B]";
};

export default function AdminNotificationsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<NotificationTab>("All");
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const sync = () => setNotifications(readNotifications());
    sync();
    window.addEventListener("beige-admin-notifications-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("beige-admin-notifications-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isDark = !mounted || theme === "dark";
  const unreadCount = notifications.filter((item) => item.unread).length;

  const counts = useMemo(() => ({
    All: notifications.length,
    Unread: notifications.filter((item) => item.unread).length,
    Mentions: notifications.filter((item) => item.mention).length,
    Payments: notifications.filter((item) => item.category === "Payments").length,
    Projects: notifications.filter((item) => item.category === "Shoots" || item.category === "Proposals").length,
    Files: notifications.filter((item) => item.category === "Files").length,
  }), [notifications]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notifications.filter((item) => {
      if (activeTab === "Unread" && !item.unread) return false;
      if (activeTab === "Mentions" && !item.mention) return false;
      if (activeTab === "Payments" && item.category !== "Payments") return false;
      if (activeTab === "Projects" && item.category !== "Shoots" && item.category !== "Proposals") return false;
      if (activeTab === "Files" && item.category !== "Files") return false;
      if (q && !`${item.title} ${item.description} ${item.category}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [activeTab, notifications, search]);

  const markOneRead = (id: number) => {
    const next = notifications.map((item) => item.id === id ? { ...item, unread: false } : item);
    setNotifications(next);
    writeNotifications(next);
  };

  const handleAction = (item: AdminNotification) => {
    setSelectedNotification(null);
    markOneRead(item.id);
    if (item.category === "Files") router.push("/admin/file-manager");
    else if (item.category === "Messages") router.push("/admin/messages");
    else if (item.category === "Shoots") router.push("/admin/shoots");
    else if (item.category === "Payments") router.push("/admin/finances/transactions");
    else if (item.category === "Proposals") router.push("/admin/quotes");
  };


  const handleOpenDetails = (item: AdminNotification) => {
    setSelectedNotification(item);
    if (item.unread) markOneRead(item.id);
  };

  const handleMarkUnread = (item: AdminNotification) => {
    const next = notifications.map((notification) =>
      notification.id === item.id ? { ...notification, unread: true } : notification,
    );
    setNotifications(next);
    writeNotifications(next);
    setSelectedNotification(next.find((notification) => notification.id === item.id) || null);
  };

  const handleMuteSimilar = (item: AdminNotification) => {
    try {
      const key = "beige-admin-muted-notification-categories";
      const current = JSON.parse(window.localStorage.getItem(key) || "[]");
      const categories = Array.isArray(current) ? current : [];
      if (!categories.includes(item.category)) {
        window.localStorage.setItem(key, JSON.stringify([...categories, item.category]));
      }
    } catch (error) {
      console.error("Failed to save muted notification category:", error);
    }
    setSelectedNotification(null);
  };

  return (
    <>
      <Topbar
        pathname={pathname}
        title="Notifications"
        actions={<NotificationHeaderActions showMarkAll />}
      />

      <div className={`border-b px-6 py-4 lg:px-10 ${isDark ? "border-[#3A332A] bg-[#2A241D]" : "border-[#E8D1AB] bg-[#F7F0E4]"}`}>
        <div className="flex items-center justify-between gap-4">
          <p className={`text-sm ${isDark ? "text-[#E8D1AB]" : "text-[#7B5B2D]"}`}>{unreadCount} unread notifications</p>
          <div className="flex items-center gap-6 text-sm">
            <button type="button" className={`flex items-center gap-2 ${isDark ? "text-white/80" : "text-black/70"}`}>
              <Archive size={16} /> Archive
            </button>
            <button type="button" className={`flex items-center gap-2 ${isDark ? "text-white/80" : "text-black/70"}`}>
              <BellOff size={16} /> Mute
            </button>
          </div>
        </div>
      </div>

      <main className={`min-h-screen px-4 py-6 lg:px-9 lg:py-8 ${isDark ? "bg-transparent" : "bg-[#F4F5F7]" }`} style={{ fontFamily: "var(--font-instrument-sans)" }}>
        <div className={`relative flex h-12 items-center rounded-xl border ${isDark ? "border-[#3D3D3D] bg-[#202020]" : "border-[#E3E3E3] bg-white"}`}>
          <Search size={18} className={`absolute left-4 ${isDark ? "text-white/35" : "text-black/35"}`} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search Notifications..."
            className={`h-full w-full bg-transparent pl-11 pr-4 text-sm outline-none ${isDark ? "text-white placeholder:text-white/35" : "text-black placeholder:text-black/35"}`}
          />
        </div>

        <section className={`mt-5 overflow-hidden rounded-2xl border ${isDark ? "border-[#303030] bg-[#171717]" : "border-[#E4E4E4] bg-white"}`}>
          <div className={`grid grid-cols-3 border-b px-3 sm:grid-cols-6 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
            {tabs.map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`relative flex h-14 items-center justify-center gap-2 text-sm transition ${active ? (isDark ? "text-[#E8D1AB]" : "text-[#7B5B2D]") : (isDark ? "text-white/60" : "text-black/55")}`}
                >
                  {tab}
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${active ? (isDark ? "bg-[#2A241D] text-[#E8D1AB]" : "bg-[#F2E6CF] text-[#7B5B2D]") : (isDark ? "bg-[#2A2A2A] text-white/85" : "bg-[#EEEEEE] text-black/70")}`}>
                    {String(counts[tab]).padStart(tab === "All" ? 1 : 2, "0")}
                  </span>
                  {active ? <span className="absolute bottom-0 left-[12%] right-[12%] h-[3px] rounded-full bg-[#E8D1AB]" /> : null}
                </button>
              );
            })}
          </div>

          <div>
            {filtered.length ? filtered.map((item) => (
              <article
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => handleOpenDetails(item)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleOpenDetails(item);
                  }
                }}
                className={`relative flex flex-col gap-4 border-b px-4 py-6 last:border-b-0 sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-[#303030] bg-[#1C1C1C]" : "border-[#EEEEEE] bg-white"}`}
                style={{ borderLeft: `4px solid ${item.accent}` }}
              >
                <div className="flex min-w-0 gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${item.avatarClass}`}>{item.initials}</div>
                  <div className="min-w-0">
                    <h3 className={`text-sm font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>{item.title}</h3>
                    <p className={`mt-1 text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>{item.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs ${isDark ? "bg-[#343434] text-white/90" : "bg-[#EFEFEF] text-black/70"}`}>
                        {categoryIcon(item.category)} {item.category}
                      </span>
                      <span className={`rounded-md px-3 py-1.5 text-xs ${priorityClass(item.priority)}`}>{item.priority}</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-4 sm:block sm:text-right">
                  <div className={`mb-4 flex items-center justify-end gap-2 text-xs ${isDark ? "text-white/55" : "text-black/45"}`}>
                    {item.timeLabel}
                    <span className={`h-2 w-2 rounded-full ${item.unread ? "bg-[#E8D1AB]" : isDark ? "bg-white/35" : "bg-black/25"}`} />
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleAction(item);
                    }}
                    className="h-9 rounded-lg bg-[#E8D1AB] px-4 text-xs font-medium text-black transition hover:bg-[#D9C19A]"
                  >
                    {item.actionLabel}
                  </button>
                </div>
              </article>
            )) : (
              <div className={`px-6 py-16 text-center text-sm ${isDark ? "text-white/45" : "text-black/45"}`}>No notifications found.</div>
            )}
          </div>
        </section>
      </main>

      <NotificationDetailsModal
        open={Boolean(selectedNotification)}
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onPrimaryAction={handleAction}
        onMarkUnread={handleMarkUnread}
        onMuteSimilar={handleMuteSimilar}
      />
    </>
  );
}
