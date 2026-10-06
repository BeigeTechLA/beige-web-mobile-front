"use client";

import React from "react";
import {
  BellOff,
  Clock3,
  ExternalLink,
  Mail,
  Tag,
  X,
} from "lucide-react";

import { type AdminNotification } from "@/components/admin/notifications/notificationData";
import { useTheme } from "next-themes";

type ExtendedNotification = AdminNotification & {
  senderName?: string;
  senderRole?: string;
  type?: string;
  createdAt?: string;
};

type NotificationDetailsModalProps = {
  open: boolean;
  notification: AdminNotification | null;
  onClose: () => void;
  onPrimaryAction: (notification: AdminNotification) => void;
  onMarkUnread: (notification: AdminNotification) => void;
  onMuteSimilar: (notification: AdminNotification) => void;
};

const getSenderName = (notification: ExtendedNotification) => {
  if (notification.senderName) return notification.senderName;

  const title = notification.title || "";
  const separators = [
    " uploaded ",
    " generated ",
    " mentioned ",
    " scheduled ",
    " approved ",
    " created ",
    " sent ",
    " shared ",
  ];

  for (const separator of separators) {
    if (title.includes(separator)) return title.split(separator)[0].trim();
  }

  return "Notification";
};

const getType = (notification: ExtendedNotification) => {
  if (notification.type) return notification.type;
  if (notification.category === "Files") return "Project";
  if (notification.category === "Payments") return "Payment";
  if (notification.category === "Messages") return "Message";
  if (notification.category === "Shoots") return "Shoot";
  if (notification.category === "Proposals") return "Proposal";
  return "Notification";
};

export default function NotificationDetailsModal({
  open,
  notification,
  onClose,
  onPrimaryAction,
  onMarkUnread,
  onMuteSimilar,
}: NotificationDetailsModalProps) {
  const { theme } = useTheme();
  const isDark = theme !== "light";

  if (!open || !notification) return null;

  const item = notification as ExtendedNotification;
  const senderName = getSenderName(item);
  const senderRole = item.senderRole || "Creative Partner";
  const notificationType = getType(item);
  const isCritical = notification.priority === "Critical";

  return (
    <div className={`fixed inset-0 z-[140] flex items-center justify-center px-4 py-6 backdrop-blur-[2px] ${isDark ? "bg-black/65" : "bg-black/30"}`}>
      <div className={`max-h-[calc(100vh-48px)] w-full max-w-[620px] overflow-y-auto custom-scrollbar rounded-2xl border shadow-[0_28px_90px_rgba(0,0,0,0.35)] ${isDark ? "border-[#3A3A3A] bg-black" : "border-[#E1E1E1] bg-white"}`}>
        <div className={`sticky top-0 z-10 flex items-center justify-between border-b px-6 py-5 ${isDark ? "border-[#333333] bg-black" : "border-[#E7E7E7] bg-white"}`}>
          <h2 className={`text-[24px] font-semibold tracking-[-0.02em] ${isDark ? "text-white" : "text-[#171717]"}`}>
            Notification Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${isDark ? "bg-[#292526] text-white hover:bg-[#383233]" : "bg-[#F1F1F1] text-[#252525] hover:bg-[#E7E7E7]"}`}
            aria-label="Close notification details"
          >
            <X size={24} strokeWidth={1.9} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div
            className={`flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-medium ${
              isCritical
                ? (isDark ? "bg-[#3A0E0E] text-[#FF5656]" : "bg-[#FFF0F0] text-[#D92D20]")
                : (isDark ? "bg-[#2A241D] text-[#E8D1AB]" : "bg-[#F7F0E4] text-[#7B5B2D]")
            }`}
          >
            <Tag size={16} />
            {notification.priority.toUpperCase()} PRIORITY
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${notification.avatarClass}`}
              >
                {notification.initials}
              </div>
              <div className="min-w-0">
                <p className={`truncate text-[17px] font-semibold ${isDark ? "text-white" : "text-[#171717]"}`}>
                  {senderName}
                  <span className={`font-normal ${isDark ? "text-white/70" : "text-black/55"}`}> ({senderRole})</span>
                </p>
              </div>
            </div>

            <div className={`flex shrink-0 items-center gap-1.5 text-xs ${isDark ? "text-white/50" : "text-black/45"}`}>
              <Clock3 size={14} />
              {notification.timeLabel}
            </div>
          </div>

          <div>
            <p className={`text-sm ${isDark ? "text-white/50" : "text-black/45"}`}>Action</p>
            <p className={`mt-1.5 text-sm leading-6 ${isDark ? "text-white" : "text-[#171717]"}`}>{notification.title}</p>
          </div>

          <div>
            <p className={`text-sm ${isDark ? "text-white/50" : "text-black/45"}`}>Details</p>
            <p className={`mt-1.5 text-sm leading-6 ${isDark ? "text-white/90" : "text-black/75"}`}>{notification.description}</p>
          </div>

          <div className={`grid grid-cols-2 gap-4 border-y py-4 ${isDark ? "border-[#2D2D2D]" : "border-[#E7E7E7]"}`}>
            <div>
              <p className={`text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>Category</p>
              <p className={`mt-1 text-sm ${isDark ? "text-white" : "text-[#171717]"}`}>{notification.category}</p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>Type</p>
              <p className={`mt-1 text-sm ${isDark ? "text-white" : "text-[#171717]"}`}>{notificationType}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onPrimaryAction(notification)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#E8D1AB] text-sm font-medium text-black transition-colors hover:bg-[#D9C19A]"
          >
            <ExternalLink size={16} />
            {notification.actionLabel}
          </button>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onMarkUnread(notification)}
              className={`flex h-11 items-center justify-center gap-2 rounded-lg border text-sm transition-colors ${isDark ? "border-[#4A4A4A] bg-[#111111] text-white hover:bg-[#1B1B1B]" : "border-[#DADADA] bg-white text-[#252525] hover:bg-[#F7F7F7]"}`}
            >
              <Mail size={16} />
              Mark Unread
            </button>
            <button
              type="button"
              onClick={() => onMuteSimilar(notification)}
              className={`flex h-11 items-center justify-center gap-2 rounded-lg border text-sm transition-colors ${isDark ? "border-[#4A4A4A] bg-[#111111] text-white hover:bg-[#1B1B1B]" : "border-[#DADADA] bg-white text-[#252525] hover:bg-[#F7F7F7]"}`}
            >
              <BellOff size={16} />
              Mute Similar
            </button>
          </div>

          <div className={`border-t pt-4 ${isDark ? "border-[#2D2D2D]" : "border-[#E7E7E7]"}`}>
            <p className={`text-sm ${isDark ? "text-[#E8D1AB]" : "text-[#7B5B2D]"}`}>Timeline</p>
            <div className={`mt-4 flex items-center justify-between gap-4 text-xs ${isDark ? "text-white/70" : "text-black/60"}`}>
              <span className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#E8D1AB]" />
                Notification created
              </span>
              <span>{item.createdAt || notification.timeLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
