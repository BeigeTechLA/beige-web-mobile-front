"use client";

import {
  ADMIN_NOTIFICATION_PREFS_STORAGE_KEY,
  ADMIN_NOTIFICATIONS_STORAGE_KEY,
  defaultAdminNotifications,
  type AdminNotification,
} from "./notificationData";

export type NotificationPreferences = {
  pushEnabled: boolean;
  emailEnabled: boolean;
  categories: Record<string, boolean>;
};

export const defaultNotificationPreferences: NotificationPreferences = {
  pushEnabled: true,
  emailEnabled: false,
  categories: {
    Shoots: true,
    Payments: true,
    Messages: true,
    Meetings: true,
    Proposals: true,
    Files: true,
    System: true,
  },
};

export const readNotifications = (): AdminNotification[] => {
  if (typeof window === "undefined") return defaultAdminNotifications;
  try {
    const raw = window.localStorage.getItem(ADMIN_NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return defaultAdminNotifications;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultAdminNotifications;
  } catch {
    return defaultAdminNotifications;
  }
};

export const writeNotifications = (items: AdminNotification[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("beige-admin-notifications-updated"));
};

export const readNotificationPreferences = (): NotificationPreferences => {
  if (typeof window === "undefined") return defaultNotificationPreferences;
  try {
    const raw = window.localStorage.getItem(ADMIN_NOTIFICATION_PREFS_STORAGE_KEY);
    if (!raw) return defaultNotificationPreferences;
    return { ...defaultNotificationPreferences, ...JSON.parse(raw) };
  } catch {
    return defaultNotificationPreferences;
  }
};

export const writeNotificationPreferences = (prefs: NotificationPreferences) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_NOTIFICATION_PREFS_STORAGE_KEY, JSON.stringify(prefs));
};
