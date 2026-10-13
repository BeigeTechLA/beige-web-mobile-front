"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Bell, CheckCheck, Hexagon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ModeToggle } from "@/components/generic/ModeToggle";
import { useAuth } from "@/lib/hooks/useAuth";
import NotificationSettingsModal from "./NotificationSettingsModal";
import { notificationCenterApi, notificationPortalPaths, notifyNotificationsChanged, NOTIFICATIONS_UPDATED_EVENT, type NotificationPortal } from "@/lib/notificationCenterApi";
import { toast } from "sonner";

export default function NotificationHeaderActions({
  showMarkAll = true,
  portal = "admin",
}: {
  showMarkAll?: boolean;
  portal?: NotificationPortal;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileImageError, setProfileImageError] = useState(false);

  const syncUnread = () => {
    void notificationCenterApi.counts()
      .then((response) => setUnreadCount(response.data.unread))
      .catch(() => setUnreadCount(0));
  };

  useEffect(() => setMounted(true), []);
  const isDark = !mounted || theme === "dark";

  useEffect(() => {
    syncUnread();
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, syncUnread);
    window.addEventListener("focus", syncUnread);
    const timer = window.setInterval(syncUnread, 30000);
    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, syncUnread);
      window.removeEventListener("focus", syncUnread);
      window.clearInterval(timer);
    };
  }, []);

  const markAllRead = async () => {
    try {
      await notificationCenterApi.markAllRead();
      setUnreadCount(0);
      notifyNotificationsChanged();
    } catch {
      toast.error("Could not mark notifications as read.");
    }
  };

  const profileImageSrc = !profileImageError && user?.profile_image ? user.profile_image : "/images/avatar.png";

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(notificationPortalPaths[portal])}
          className={`relative flex h-12 w-12 cursor-pointer items-center justify-center overflow-visible rounded-full border text-black transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] ${isDark ? "border-[#303030] bg-[#E8D1AB] hover:bg-[#DCC39A]" : "border-[#D7C29E] bg-[#E8D1AB] hover:bg-[#D9C19A]"}`}
          aria-label="Notifications"
        >
          <Bell size={20} strokeWidth={1.8} />
          {unreadCount > 0 ? (
            <span
              className={`pointer-events-none absolute right-[1px] top-[1px] z-[10] flex items-center justify-center rounded-full border-2 text-[10px] font-bold leading-none ${
                unreadCount > 9
                  ? "h-5 min-w-[24px] px-1"
                  : "h-5 w-5"
              } ${
                isDark
                  ? "border-[#171717] bg-white text-black"
                  : "border-white bg-[#171717] text-white"
              }`}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>

        <div className="hidden sm:block">
          <ModeToggle />
        </div>

        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] bg-[var(--toggle-bg)] border border-[var(--toggle-border)] ${isDark ? "hover:bg-[#1A1A1A]" : "hover:bg-[#F4F4F4]"}`}
          aria-label="Notification settings"
        >
          <span className="relative flex h-6 w-6 items-center justify-center">
            <Hexagon
              size={23}
              strokeWidth={1.6}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            />

            <Hexagon
              size={10}
              strokeWidth={1.8}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            />
          </span>
        </button>

        <button
          type="button"
          onClick={() => router.push(portal === "creator" ? "/creator/dashboard/profile" : portal === "client" ? "/affiliate/profile" : "/admin/profile")}
          className={`h-12 w-12 overflow-hidden rounded-full border ${isDark ? "border-[#303030] bg-[#101010]" : "border-[#DEDEDE] bg-white"}`}
          aria-label="Profile"
        >
          <Image
            src={profileImageSrc}
            alt={user?.name || "User"}
            width={48}
            height={48}
            className="h-full w-full object-cover"
            unoptimized
            onError={() => setProfileImageError(true)}
          />
        </button>

        {showMarkAll ? (
          <button
            type="button"
            onClick={() => { void markAllRead(); }}
            className="hidden h-12 items-center gap-2 rounded-lg bg-[#E8D1AB] px-5 text-sm font-medium text-black transition hover:bg-[#D9C19A] md:flex"
          >
            <CheckCheck size={17} />
            Mark all as read
          </button>
        ) : null}
      </div>

      <NotificationSettingsModal portal={portal} open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
