"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Archive, BellOff, CalendarDays, Camera, DollarSign, File, MessageSquare, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import Topbar from "@/components/admin/Topbar";
import NotificationHeaderActions from "@/components/admin/notifications/NotificationHeaderActions";
import NotificationDetailsModal from "@/components/admin/notifications/NotificationDetailsModal";
import { type AdminNotification, type NotificationCategory } from "@/components/admin/notifications/notificationData";
import { formatNotification, getNotificationDestination, notificationCenterApi, notificationPortalPaths, notifyNotificationsChanged, NOTIFICATIONS_UPDATED_EVENT, type NotificationCounts, type NotificationPortal } from "@/lib/notificationCenterApi";

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
    case "Meetings":
      return <CalendarDays size={15} />;
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

export default function NotificationCenterPage({ portal }: { portal: NotificationPortal }) {
  const pathname = usePathname();
  const router = useRouter();
  const notificationsPath = notificationPortalPaths[portal];
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [counts, setCounts] = useState<NotificationCounts>({ all: 0, unread: 0, mentions: 0, payments: 0, projects: 0, files: 0, messages: 0, meetings: 0, archived: 0 });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState<NotificationTab>("All");
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);
  const requestSequence = useRef(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const refresh = useCallback(async () => {
    const requestId = ++requestSequence.current;
    setLoading(true);
    try {
      const status = showArchived ? "archived" : activeTab === "Unread" ? "unread" : "all";
      const category = ["Mentions", "Payments", "Projects", "Files"].includes(activeTab) ? activeTab.toLowerCase() : undefined;
      const [listResponse, countsResponse] = await Promise.all([
        notificationCenterApi.list({ status, category, search: debouncedSearch || undefined, page: 1, limit: 50 }),
        notificationCenterApi.counts(),
      ]);
      if (requestId !== requestSequence.current) return;
      setNotifications(listResponse.data.items.map(formatNotification));
      setCounts(countsResponse.data);
      setPage(1);
      setHasMore(listResponse.data.pagination.total_pages > 1);
      setError("");
    } catch (cause) {
      if (requestId === requestSequence.current) setError(cause instanceof Error ? cause.message : "Could not load notifications.");
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }, [activeTab, debouncedSearch, showArchived]);

  useEffect(() => {
    void refresh();
    const onUpdate = () => { void refresh(); };
    const onFocus = () => { void refresh(); };
    const timer = window.setInterval(onUpdate, 30000);
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdate);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdate);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const notificationId = Number(params.get("notificationId"));
    if (!Number.isInteger(notificationId) || notificationId < 1) return;
    window.history.replaceState({}, "", window.location.pathname);
    void (async () => {
      try {
        const response = await notificationCenterApi.get(notificationId);
        await notificationCenterApi.markRead(notificationId);
        notifyNotificationsChanged();
        const item = formatNotification(response.data);
        const destination = getNotificationDestination(item, portal);
        if (destination) router.push(destination);
        else setSelectedNotification({ ...item, unread: false });
      } catch {
        toast.error("Could not open this notification.");
      }
    })();
  }, [router, portal]);

  const isDark = !mounted || theme === "dark";
  const tabCounts: Record<NotificationTab, number> = {
    All: counts.all, Unread: counts.unread, Mentions: counts.mentions,
    Payments: counts.payments, Projects: counts.projects, Files: counts.files,
  };

  const markOneRead = async (id: number) => {
    await notificationCenterApi.markRead(id);
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, unread: false } : item));
    setCounts((current) => ({ ...current, unread: Math.max(0, current.unread - 1) }));
    notifyNotificationsChanged();
  };

  const handleAction = async (item: AdminNotification) => {
    try {
      if (item.unread) await markOneRead(item.id);
      const destination = getNotificationDestination(item, portal);
      if (destination) {
        setSelectedNotification(null);
        router.push(destination);
      } else {
        setSelectedNotification({ ...item, unread: false });
      }
    } catch {
      toast.error("Could not mark notification as read.");
    }
  };


  const handleOpenDetails = async (item: AdminNotification) => {
    setSelectedNotification(item);
    if (item.unread && !showArchived) {
      try {
        await markOneRead(item.id);
        setSelectedNotification({ ...item, unread: false });
      } catch { toast.error("Could not mark notification as read."); }
    }
  };

  const handleMarkUnread = async (item: AdminNotification) => {
    try {
      await notificationCenterApi.markUnread(item.id);
      setNotifications((current) => current.map((notification) => notification.id === item.id ? { ...notification, unread: true } : notification));
      setSelectedNotification({ ...item, unread: true });
      notifyNotificationsChanged();
    } catch { toast.error("Could not mark notification as unread."); }
  };

  const handleMuteSimilar = async (item: AdminNotification) => {
    try {
      const current = (await notificationCenterApi.preferences()).data.muted_categories || [];
      const category = item.category.toLowerCase();
      await notificationCenterApi.muteCategories([...new Set([...current, category])]);
      toast.success(`Future ${item.category.toLowerCase()} notifications muted.`);
      setSelectedNotification(null);
    } catch {
      toast.error("Could not mute this category.");
    }
  };

  const loadMore = async () => {
    try {
      const nextPage = page + 1;
      const status = showArchived ? "archived" : activeTab === "Unread" ? "unread" : "all";
      const category = ["Mentions", "Payments", "Projects", "Files"].includes(activeTab) ? activeTab.toLowerCase() : undefined;
      const response = await notificationCenterApi.list({ status, category, search: debouncedSearch || undefined, page: nextPage, limit: 50 });
      setNotifications((current) => [...current, ...response.data.items.map(formatNotification)]);
      setPage(nextPage);
      setHasMore(nextPage < response.data.pagination.total_pages);
    } catch { toast.error("Could not load more notifications."); }
  };

  const handleArchive = async (item: AdminNotification) => {
    try {
      if (showArchived) await notificationCenterApi.restore(item.id);
      else await notificationCenterApi.archive(item.id);
      setSelectedNotification(null);
      notifyNotificationsChanged();
    } catch { toast.error(showArchived ? "Could not restore notification." : "Could not archive notification."); }
  };

  return (
    <>
      <Topbar
        pathname={pathname}
        title="Notifications"
        actions={<NotificationHeaderActions portal={portal} showMarkAll={!showArchived} />}
      />

      <div className={`border-b px-6 py-4 lg:px-10 ${isDark ? "border-[#3A332A] bg-[#2A241D]" : "border-[#E8D1AB] bg-[#F7F0E4]"}`}>
        <div className="flex items-center justify-between gap-4">
          <p className={`text-sm ${isDark ? "text-[#E8D1AB]" : "text-[#7B5B2D]"}`}>{counts.unread} unread notifications</p>
          <div className="flex items-center gap-6 text-sm">
            <button type="button" onClick={() => { setActiveTab("All"); setShowArchived((current) => !current); }} className={`flex items-center gap-2 ${isDark ? "text-white/80" : "text-black/70"}`}>
              <Archive size={16} /> {showArchived ? "Inbox" : `Archive${counts.archived ? ` (${counts.archived})` : ""}`}
            </button>
            <button type="button" onClick={() => router.push(`${notificationsPath}/preferences`)} className={`flex items-center gap-2 ${isDark ? "text-white/80" : "text-black/70"}`}>
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
          {error ? <div role="alert" className="px-5 py-3 text-sm text-red-500">{error} <button type="button" onClick={() => void refresh()} className="underline">Retry</button></div> : null}
          {showArchived ? <div className="border-b px-5 py-3 text-sm text-[#E8D1AB]">Archived notifications</div> : null}
          {!showArchived ? <div className={`grid grid-cols-3 border-b px-3 sm:grid-cols-6 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
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
                    {String(tabCounts[tab]).padStart(tab === "All" ? 1 : 2, "0")}
                  </span>
                  {active ? <span className="absolute bottom-0 left-[12%] right-[12%] h-[3px] rounded-full bg-[#E8D1AB]" /> : null}
                </button>
              );
            })}
          </div> : null}

          <div>
            {notifications.length ? notifications.map((item) => (
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
                  <div className="flex items-center justify-end gap-2">
                    <button type="button" onClick={(event) => { event.stopPropagation(); void handleArchive(item); }} className={`h-9 rounded-lg border px-3 text-xs ${isDark ? "border-white/20 text-white" : "border-black/20 text-black"}`}>
                      {showArchived ? "Restore" : "Archive"}
                    </button>
                    {!showArchived ? <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleAction(item);
                      }}
                      className="h-9 rounded-lg bg-[#E8D1AB] px-4 text-xs font-medium text-black transition hover:bg-[#D9C19A]"
                    >
                      {getNotificationDestination(item, portal) ? item.actionLabel : "View details"}
                    </button> : null}
                  </div>
                </div>
              </article>
            )) : (
              <div className={`px-6 py-16 text-center text-sm ${isDark ? "text-white/45" : "text-black/45"}`}>{loading ? "Loading notifications…" : "No notifications found."}</div>
            )}
          </div>
          {hasMore ? <div className="border-t p-4 text-center"><button type="button" onClick={() => void loadMore()} className="rounded-lg bg-[#E8D1AB] px-4 py-2 text-xs text-black">Load more</button></div> : null}
        </section>
      </main>

      <NotificationDetailsModal
        open={Boolean(selectedNotification)}
        notification={selectedNotification}
        archived={showArchived}
        onClose={() => setSelectedNotification(null)}
        onPrimaryAction={(item) => { void handleAction(item); }}
        onMarkUnread={(item) => { void handleMarkUnread(item); }}
        onMuteSimilar={(item) => { void handleMuteSimilar(item); }}
        hasDestination={selectedNotification ? Boolean(getNotificationDestination(selectedNotification, portal)) : false}
      />
    </>
  );
}
