"use client";

import React from "react";
import { Bell, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

export default function NotificationSettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme !== "light";

  if (!open) return null;

  const navigate = (path: string) => {
    onClose();
    router.push(path);
  };

  return (
    <div className={`fixed inset-0 z-[120] flex items-center justify-center px-4 backdrop-blur-[2px] ${isDark ? "bg-black/65" : "bg-black/30"}`}>
      <div className={`w-full max-w-[560px] overflow-hidden rounded-2xl border shadow-[0_24px_70px_rgba(0,0,0,0.28)] ${isDark ? "border-[#3A3A3A] bg-black" : "border-[#E2E2E2] bg-white"}`}>
        <div className={`flex items-center justify-between border-b px-6 py-5 ${isDark ? "border-[#333333]" : "border-[#E7E7E7]"}`}>
          <h2 className={`text-[24px] font-semibold leading-none tracking-[-0.02em] ${isDark ? "text-white" : "text-[#171717]"}`}>
            Settings
          </h2>

          <button
            type="button"
            onClick={onClose}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${isDark ? "bg-[#292526] text-white hover:bg-[#383233]" : "bg-[#F1F1F1] text-[#252525] hover:bg-[#E7E7E7]"}`}
            aria-label="Close settings"
          >
            <X size={24} strokeWidth={1.9} />
          </button>
        </div>

        <div className="space-y-2 px-6 py-5">
          <button
            type="button"
            onClick={() => navigate("/admin/settings")}
            className={`flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition-colors ${isDark ? "hover:bg-white/[0.05]" : "hover:bg-black/[0.04]"}`}
          >
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${isDark ? "bg-[#101010] text-[#E8D1AB]" : "bg-[#F7F0E4] text-[#8D6F3F]"}`}>
              <Users size={25} strokeWidth={1.8} />
            </span>

            <span className="min-w-0">
              <span className={`block text-[19px] font-semibold leading-6 ${isDark ? "text-white" : "text-[#171717]"}`}>
                General Settings
              </span>
              <span className={`mt-1 block text-[14px] leading-5 ${isDark ? "text-white/45" : "text-black/50"}`}>
                Manage Language, Time Zone and other Personal Preferences
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/notifications/preferences")}
            className={`flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition-colors ${isDark ? "hover:bg-white/[0.05]" : "hover:bg-black/[0.04]"}`}
          >
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${isDark ? "bg-[#101010] text-[#E8D1AB]" : "bg-[#F7F0E4] text-[#8D6F3F]"}`}>
              <Bell size={25} strokeWidth={1.8} />
            </span>

            <span className="min-w-0">
              <span className={`block text-[19px] font-semibold leading-6 ${isDark ? "text-white" : "text-[#171717]"}`}>
                Notification Preferences
              </span>
              <span className={`mt-1 block text-[14px] leading-5 ${isDark ? "text-white/45" : "text-black/50"}`}>
                Manage how and when you receive notifications
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
