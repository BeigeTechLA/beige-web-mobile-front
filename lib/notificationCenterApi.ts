import apiClient from "@/lib/apiClient";
import type { AdminNotification, NotificationCategory, NotificationPriority } from "@/components/admin/notifications/notificationData";

export const NOTIFICATIONS_UPDATED_EVENT = "beige-web-notifications-updated";
export type NotificationPortal = "admin" | "creator" | "client";
export const notificationPortalPaths: Record<NotificationPortal, string> = {
  admin: "/admin/notifications",
  creator: "/creator/dashboard/notifications",
  client: "/affiliate/notifications",
};

type ApiResponse<T> = { data: T };

export type NotificationRow = {
  notification_id: number;
  title: string;
  message: string;
  category: string;
  type: string;
  priority: string | null;
  action_label: string | null;
  reference_id: string | null;
  reference_type: string | null;
  payload: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
  sender: { id: number; name: string | null; email: string | null } | null;
};

export type NotificationCounts = {
  all: number;
  unread: number;
  mentions: number;
  payments: number;
  projects: number;
  files: number;
  messages: number;
  meetings: number;
  archived: number;
};

export type NotificationList = {
  items: NotificationRow[];
  pagination: { total: number; page: number; limit: number; total_pages: number };
};

export type NotificationPreferences = {
  push_enabled: boolean;
  email_enabled: boolean;
  topics: Record<string, boolean>;
  email_topics: Record<string, boolean>;
  muted_categories: string[];
};

export const notifyNotificationsChanged = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
};

export const notificationCenterApi = {
  list: (params: { status?: string; category?: string; search?: string; page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<NotificationList>>("app-notifications", params),
  counts: () => apiClient.get<ApiResponse<NotificationCounts>>("app-notifications/counts"),
  get: (id: number) => apiClient.get<ApiResponse<NotificationRow>>(`app-notifications/${id}`),
  markRead: (id: number) => apiClient.patch(`app-notifications/${id}/read`),
  markUnread: (id: number) => apiClient.patch(`app-notifications/${id}/unread`),
  markAllRead: (category?: string) => apiClient.patch("app-notifications/read-all", category ? { category } : {}),
  markReadByReference: (reference_type: string, reference_id: string) =>
    apiClient.patch("app-notifications/read-by-reference", { reference_type, reference_id }),
  archive: (id: number) => apiClient.delete(`app-notifications/${id}`),
  restore: (id: number) => apiClient.patch(`app-notifications/${id}/restore`),
  preferences: () => apiClient.get<ApiResponse<NotificationPreferences>>("notification-preferences"),
  muteCategories: (muted_categories: string[]) =>
    apiClient.patch<ApiResponse<{ muted_categories: string[] }>>("notification-preferences/inbox", { muted_categories }),
};

const categoryLabels: Record<string, NotificationCategory> = {
  files: "Files", payments: "Payments", messages: "Messages", shoots: "Shoots",
  meetings: "Meetings", proposals: "Proposals", projects: "Projects", project: "Projects",
};

const priorityLabels: Record<string, NotificationPriority> = {
  critical: "Critical", urgent: "Critical", high: "High", medium: "Medium", normal: "Medium", low: "Low",
};

export const formatNotification = (row: NotificationRow): AdminNotification => {
  const category = categoryLabels[String(row.category || "").toLowerCase()] || "System";
  const priority = priorityLabels[String(row.priority || "").toLowerCase()] || "Medium";
  const senderName = row.sender?.name || row.sender?.email || "Beige";
  const initials = senderName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "B";
  const date = new Date(row.created_at);
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  const timeLabel = !Number.isFinite(minutes) ? "" : minutes < 1 ? "Just now" : minutes < 60 ? `${minutes}m ago` : minutes < 1440 ? `${Math.floor(minutes / 60)}h ago` : `${Math.floor(minutes / 1440)}d ago`;

  return {
    id: row.notification_id,
    title: row.title,
    description: row.message,
    category,
    priority,
    timeLabel,
    unread: !row.is_read,
    actionLabel: row.action_label || "View details",
    accent: priority === "Critical" ? "#FF5A5F" : priority === "High" ? "#FFB11B" : priority === "Low" ? "#7B7B7B" : "#4776FF",
    initials,
    avatarClass: "bg-[#E8D1AB] text-[#473925]",
    mention: row.type === "mention",
    senderName,
    type: row.type,
    createdAt: Number.isNaN(date.getTime()) ? undefined : date.toLocaleString(),
    referenceId: row.reference_id,
    referenceType: row.reference_type,
    payload: row.payload,
  };
};

const payloadValue = (payload: Record<string, unknown> | null | undefined, ...keys: string[]) => {
  for (const key of keys) {
    const value = payload?.[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return "";
};

export const getNotificationDestination = (item: AdminNotification, portal: NotificationPortal) => {
  const payload = item.payload;
  const roomId = payloadValue(payload, "room_id", "chat_room_id", "roomId", "chatRoomId") || (item.referenceType === "chat_room" ? item.referenceId : "");
  const basePath = portal === "creator" ? "/creator/dashboard" : portal === "client" ? "/affiliate" : "/admin";
  if (item.category === "Messages") return `${basePath}/messages${roomId ? `?roomId=${encodeURIComponent(roomId)}` : ""}`;

  const meetingId = payloadValue(payload, "meeting_id", "meetingId") || (item.referenceType === "meeting" ? item.referenceId : "");
  if (item.category === "Meetings") return `${basePath}/meetings${meetingId ? `?meetingId=${encodeURIComponent(meetingId)}` : ""}`;

  const bookingId = payloadValue(payload, "booking_id", "bookingId") || (item.referenceType === "booking" ? item.referenceId : "");
  if (item.category === "Shoots" || item.category === "Projects") {
    if (portal === "creator") return `${basePath}/request`;
    return bookingId ? `${basePath}/shoots/${encodeURIComponent(bookingId)}` : `${basePath}/shoots`;
  }
  if (item.category === "Files") {
    if (portal === "client") return `${basePath}/file-manager`;
    return bookingId ? `${basePath}/file-manager/${encodeURIComponent(bookingId)}` : `${basePath}/file-manager`;
  }
  if (item.category === "Payments") return portal === "creator" ? `${basePath}/finances/earnings` : `${basePath}/finances/transactions`;
  if (item.category === "Proposals") return portal === "creator" ? `${basePath}/request` : `${basePath}/quotes`;
  return null;
};
