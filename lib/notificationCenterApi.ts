import apiClient from "@/lib/apiClient";
import { format } from "date-fns";
import { formatChatRoomDisplayName } from "@/lib/chatRoomDisplayName";
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
  leads: "Leads", agreements: "Agreements", disputes: "Disputes", payouts: "Payouts",
  reviews: "Reviews",
};

const priorityLabels: Record<string, NotificationPriority> = {
  critical: "Critical", urgent: "Critical", high: "High", medium: "Medium", normal: "Medium", low: "Low",
};

const capitalizeName = (value: string) => value.replace(/(^|[\s-])\p{L}/gu, (part) => part.toUpperCase());

const formatPaymentMessage = (message: string, category: NotificationCategory) => {
  if (category !== "Payments") return message;
  // Older notifications are stored with a bare amount in parentheses.
  return message.replace(/Payment (succeeded|failed|partial) for booking (\d+) \((\d+(?:\.\d+)?)\)\./i,
    (_match, status: string, bookingId: string, amount: string) => {
      const formattedAmount = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(amount));
      if (status.toLowerCase() === "failed") return `Payment of ${formattedAmount} failed for booking #${bookingId}.`;
      return `${status.toLowerCase() === "partial" ? "Partial payment" : "Payment"} of ${formattedAmount} received for booking #${bookingId}.`;
    });
};

export const formatNotification = (row: NotificationRow): AdminNotification => {
  const category = categoryLabels[String(row.category || "").toLowerCase()] || "System";
  const priority = priorityLabels[String(row.priority || "").toLowerCase()] || "Medium";
  const senderName = capitalizeName(String(row.payload?.sender_name || row.sender?.name || row.sender?.email || "Beige"));
  const isChatMessage = category === "Messages" && ["direct_message", "mention"].includes(row.type);
  const isMention = category === "Messages" && row.type === "mention";
  const messagePreview = String(row.payload?.message_preview || "").trim();
  const chatName = String(row.payload?.chat_name || row.payload?.chat_room_name || row.payload?.room_name || "").trim();
  const chatLocation = chatName ? formatChatRoomDisplayName(chatName) : "your conversation";
  const initials = senderName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "B";
  const date = new Date(row.created_at);
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  const timeLabel = !Number.isFinite(minutes) ? "" : minutes < 1 ? "Just now" : minutes < 60 ? `${minutes}m ago` : minutes < 1440 ? `${Math.floor(minutes / 60)}h ago` : `${Math.floor(minutes / 1440)}d ago`;

  return {
    id: row.notification_id,
    title: isMention ? `${senderName} mentioned you` : isChatMessage ? (messagePreview ? `${senderName}: ${messagePreview}` : row.message) : row.title,
    description: isMention ? (messagePreview ? `${messagePreview} · ${chatLocation}` : `In ${chatLocation}`) : isChatMessage ? `New message in ${chatLocation}` : formatPaymentMessage(row.message, category),
    category,
    priority,
    timeLabel,
    unread: !row.is_read,
    actionLabel: row.action_label || "View details",
    // Keep the card accent neutral while priority indicators are hidden.
    accent: "#E8D1AB",
    initials,
    avatarClass: "bg-[#E8D1AB] text-[#473925]",
    mention: isMention,
    senderName,
    type: row.type,
    createdAt: Number.isNaN(date.getTime()) ? undefined : format(date, "d MMM, yyyy h:mm a"),
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
  const leadId = payloadValue(payload, "lead_id") || (item.referenceType === "sales_lead" ? item.referenceId || "" : "");
  if (item.category === "Leads" && portal === "admin") return leadId ? `/sales/leads/${encodeURIComponent(leadId)}` : "/sales/leads";
  const disputeId = payloadValue(payload, "dispute_id") || (item.referenceType === "finance_dispute" ? item.referenceId || "" : "");
  if (item.category === "Disputes") {
    const path = portal === "admin" ? "/admin/finances/disputes" : portal === "creator" ? "/creator/dashboard/finances/disputes" : "/affiliate/finances/transactions";
    return `${path}${disputeId ? `?dispute_id=${encodeURIComponent(disputeId)}` : ""}`;
  }
  const agreementId = payloadValue(payload, "agreement_document_id") || (item.referenceType === "agreement_document" ? item.referenceId || "" : "");
  if (item.category === "Agreements" && portal === "creator") {
    if (payloadValue(payload, "agreement_type") === "general") return `/creator/dashboard/agreements/general-agreement${agreementId ? `?agreement_id=${encodeURIComponent(agreementId)}` : ""}`;
    return `/creator/dashboard/request/review-agreement${agreementId ? `?agreement_id=${encodeURIComponent(agreementId)}` : ""}`;
  }
  if (item.category === "Agreements" && portal === "admin") {
    const agreementBookingId = payloadValue(payload, "booking_id");
    return agreementBookingId ? `/admin/shoots/${encodeURIComponent(agreementBookingId)}/shoot-agreement` : "/admin/shoots";
  }
  const roomId = payloadValue(payload, "room_id", "chat_room_id", "roomId", "chatRoomId") || (item.referenceType === "chat_room" ? item.referenceId : "");
  const basePath = portal === "creator" ? "/creator/dashboard" : portal === "client" ? "/affiliate" : "/admin";
  if (item.category === "Messages") return `${basePath}/messages${roomId ? `?roomId=${encodeURIComponent(roomId)}` : ""}`;

  const meetingId = payloadValue(payload, "meeting_id", "meetingId") || (item.referenceType === "meeting" ? item.referenceId : "");
  // Deleted meetings cannot be opened by ID; keep the saved notification
  // details available and send the action to the meeting list instead.
  if (item.category === "Meetings") {
    if (item.type === "meeting_cancelled" || item.type === "meeting_deleted") return `${basePath}/meetings`;
    return `${basePath}/meetings${meetingId ? `?meetingId=${encodeURIComponent(meetingId)}` : ""}`;
  }

  const bookingId = payloadValue(payload, "booking_id", "bookingId") || (item.referenceType === "booking" ? item.referenceId : "");
  if (item.type === "shoot_details_submitted" && portal === "admin" && bookingId) return `/admin/shoots/${encodeURIComponent(bookingId)}/form-details`;
  if (item.category === "Shoots" || item.category === "Projects") {
    if (portal === "creator") return `${basePath}/request${bookingId ? `?bookingId=${encodeURIComponent(bookingId)}` : ""}`;
    return bookingId ? `${basePath}/shoots/${encodeURIComponent(bookingId)}` : `${basePath}/shoots`;
  }
  if (item.category === "Files") {
    if (portal === "client") return `${basePath}/file-manager${bookingId ? `?bookingId=${encodeURIComponent(bookingId)}` : ""}`;
    return bookingId ? `${basePath}/file-manager/${encodeURIComponent(bookingId)}` : `${basePath}/file-manager`;
  }
  if (item.category === "Payments") {
    const paymentPath = portal === "creator" ? `${basePath}/finances/earnings` : `${basePath}/finances/transactions`;
    return bookingId ? `${paymentPath}?booking_id=${encodeURIComponent(bookingId)}` : paymentPath;
  }
  if (item.category === "Proposals") {
    const quoteId = payloadValue(payload, "sales_quote_id") || (item.referenceType === "sales_quote" ? item.referenceId : "");
    return portal === "creator" ? `${basePath}/request` : quoteId ? `${basePath}/quotes/${encodeURIComponent(quoteId)}` : `${basePath}/quotes`;
  }
  // The admin payouts page is currently mock data, so do not deep-link a real
  // payout request into a page that cannot display it yet.
  if (item.category === "Payouts") {
    if (portal !== "creator") return null;
    const earningId = payloadValue(payload, "creator_earning_id") || (item.referenceType === "creator_earning" ? item.referenceId || "" : "");
    return `/creator/dashboard/finances/earnings${earningId ? `?earning_id=${encodeURIComponent(earningId)}` : ""}`;
  }
  if (item.category === "Reviews" && portal === "creator") {
    const creatorId = payloadValue(payload, "creator_id");
    const reviewId = payloadValue(payload, "review_id") || item.referenceId || "";
    return creatorId ? `/creator/dashboard/reviews?creator_id=${encodeURIComponent(creatorId)}${reviewId ? `&review_id=${encodeURIComponent(reviewId)}` : ""}` : null;
  }
  return null;
};

export const getNotificationReferenceLinks = (item: AdminNotification, portal: NotificationPortal) => {
  const payload = item.payload;
  const basePath = portal === "creator" ? "/creator/dashboard" : portal === "client" ? "/affiliate" : "/admin";
  const roomId = payloadValue(payload, "room_id", "chat_room_id", "roomId", "chatRoomId") || (item.referenceType === "chat_room" ? item.referenceId || "" : "");
  if (item.category === "Messages") {
    if (!roomId) return [];
    const chatName = payloadValue(payload, "chat_name", "chat_room_name", "room_name");
    return [{
      label: chatName ? formatChatRoomDisplayName(chatName) : item.senderName ? `Chat with ${item.senderName}` : "View conversation",
      href: `${basePath}/messages?roomId=${encodeURIComponent(roomId)}`,
    }];
  }

  const quoteId = payloadValue(payload, "sales_quote_id") || (item.referenceType === "sales_quote" ? item.referenceId || "" : "");
  if (item.category === "Proposals") {
    if (!quoteId || portal === "creator") return [];
    const quoteNumber = payloadValue(payload, "quote_number") || item.description.match(/\bBEIGE-\d+\b/i)?.[0] || quoteId;
    return [{ label: `Quote ${quoteNumber}`, href: `${basePath}/quotes/${encodeURIComponent(quoteId)}` }];
  }

  const agreementId = payloadValue(payload, "agreement_document_id") || (item.referenceType === "agreement_document" ? item.referenceId || "" : "");
  if (item.category === "Agreements") {
    if (!agreementId) return [];
    const href = getNotificationDestination(item, portal);
    return href ? [{ label: `Agreement #${agreementId}`, href }] : [];
  }
  const bookingId = payloadValue(payload, "booking_id", "bookingId") || (item.referenceType === "booking" ? item.referenceId || "" : "");
  if ((item.category === "Shoots" || item.category === "Projects") && bookingId) {
    const href = getNotificationDestination(item, portal);
    return href ? [{ label: `Shoot #${bookingId}`, href }] : [];
  }
  const leadId = payloadValue(payload, "lead_id") || (item.referenceType === "sales_lead" ? item.referenceId || "" : "");
  if (leadId && item.category === "Leads" && portal === "admin") return [{ label: `Lead #${leadId}`, href: `/sales/leads/${encodeURIComponent(leadId)}` }];
  const disputeId = payloadValue(payload, "dispute_id") || (item.referenceType === "finance_dispute" ? item.referenceId || "" : "");
  if (disputeId && item.category === "Disputes") {
    const href = getNotificationDestination(item, portal);
    return href ? [{ label: `Dispute #${disputeId}`, href }] : [];
  }
  return [];
};
