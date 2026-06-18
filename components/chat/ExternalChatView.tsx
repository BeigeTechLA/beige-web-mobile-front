"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  Archive,
  CalendarDays,
  Loader2,
  Lock,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Pencil,
  RefreshCw,
  Reply,
  Search,
  Send,
  Smile,
  Trash2,
  UserPlus,
  Users,
  X,
  ChevronLeft,
} from "lucide-react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  externalChatApi,
  type ExternalChatMessage,
  type ExternalChatParticipantItem,
  type ExternalChatRoom,
  type ExternalChatUser,
} from "@/lib/externalChatApi";
import ConversationComposerModal from "@/components/chat/ConversationComposerModal";
import ManageParticipantsModal from "@/components/chat/ManageParticipantsModal";
import EmptyChatState from "./EmptyChatState";

type RoleVariant = "admin" | "sales" | "client" | "cp" | "pm";
type RoomSortOrder = "latest" | "oldest";

interface ExternalChatViewProps {
  role: RoleVariant;
  bookingId?: string | number | null;
  heading?: string;
  description?: string;
  allowActivation?: boolean;
  isDark?: boolean;
  directRoomMode?: boolean;
  onRoomAvailabilityChange?: (hasRoom: boolean) => void;
}

const getRoomId = (room?: ExternalChatRoom | null) => String(room?.id || room?._id || "");

const extractEntityId = (value: any): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "string" || typeof value === "number") return String(value);

  const directId = value._id || value.id || value.userId || value.user_id;
  if (typeof directId === "string" || typeof directId === "number") {
    return String(directId);
  }

  if (directId && typeof directId === "object") {
    const nestedId = directId._id || directId.id;
    if (typeof nestedId === "string" || typeof nestedId === "number") {
      return String(nestedId);
    }
  }

  return undefined;
};

const getReadableName = (value: { id?: string | number; name?: string | null; email?: string | null } | null | undefined) => {
  const id = value?.id != null ? String(value.id).trim() : "";
  const name = String(value?.name || "").trim();
  const email = String(value?.email || "").trim();

  if (name && name.toLowerCase() !== "participant" && name !== id) return name;
  if (email) return email;
  return id || "Participant";
};

const isBogusParticipantValue = (value: unknown) => {
  const normalized = String(value || "").trim().toLowerCase();
  return !normalized || normalized === "[object object]" || normalized.startsWith("{") || normalized === "undefined" || normalized === "null";
};

const normalizeUser = (value: ExternalChatUser | string | number | null | undefined) => {
  if (!value) return null;
  if (typeof value === "string" || typeof value === "number") {
    if (isBogusParticipantValue(value)) return null;
    return { id: String(value), name: String(value) };
  }
  const normalizedId = extractEntityId(value);
  const normalizedName = getReadableName({
    id: normalizedId,
    name: (value as any).name,
    email: value.email,
  });
  const normalizedEmail = value.email;

  if (
    isBogusParticipantValue(normalizedId) &&
    isBogusParticipantValue(normalizedName) &&
    isBogusParticipantValue(normalizedEmail)
  ) {
    return null;
  }

  return {
    id: normalizedId,
    name: normalizedName,
    email: normalizedEmail,
    role: value.role,
    profileImage: value.profileImage,
  };
};

const normalizeParticipantItem = (
  value: ExternalChatParticipantItem | ExternalChatUser | string | number | null | undefined
) => {
  if (!value) return null;
  if (typeof value === "string" || typeof value === "number") return normalizeUser(value);
  if ("id" in value && typeof value.id !== "object") return normalizeUser(value as ExternalChatUser);
  return normalizeUser(value as ExternalChatUser);
};

const buildParticipantStateFromRoom = (room: ExternalChatRoom | null) => ({
  client: room?.client_snapshot || room?.client_id || null,
  cps: room?.cp_ids || [],
  pm: room?.pm_id || null,
  production: room?.production_ids || [],
  managers: room?.manager_ids || [],
});

const getMessageText = (message: ExternalChatMessage) => {
  if (message.is_deleted) return "This message was deleted";
  if (message.message_type === "system") {
    const actor = message.system_message?.actor_name || "System";
    const type = message.system_message?.type || "update";
    const targetName = message.system_message?.target_names?.find((item) => String(item || "").trim()) || "";

    if (type === "participant_added") {
      return targetName ? `${actor} added ${targetName}` : `${actor} added a participant`;
    }

    if (type === "participant_removed") {
      return targetName ? `${actor} removed ${targetName}` : `${actor} removed a participant`;
    }

    return `${actor} • ${type.replace(/_/g, " ")}`;
  }
  if (message.message) return message.message;
  if (message.file_name) return message.file_name;
  return "No content";
};

const sortMessagesAsc = (items: ExternalChatMessage[] = []) =>
  [...items].sort((a, b) => {
    const left = new Date(a.createdAt || a.updatedAt || 0).getTime();
    const right = new Date(b.createdAt || b.updatedAt || 0).getTime();
    return left - right;
  });

const formatTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const formatConversationMeta = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getRoomParticipantCount = (room?: ExternalChatRoom | null) => {
  if (!room) return 0;

  const rawParticipants = [
    room.client_snapshot || room.client_id,
    room.pm_id,
    ...(room.manager_ids || []),
    ...(room.cp_ids || []),
    ...(room.production_ids || []),
  ];

  const uniqueIds = new Set(
    rawParticipants
      .map((item) => normalizeParticipantItem(item)?.id)
      .filter(Boolean)
  );

  return uniqueIds.size;
};

const getParticipantSummary = (
  participantList: Array<{ id?: string; name?: string; email?: string; role?: string }>,
  currentUserId?: string | null
) => {
  const others = participantList.filter((participant) => String(participant.id || "") !== String(currentUserId || ""));
  if (!others.length) return "";
  if (others.length === 1) return getReadableName(others[0]);
  return `${getReadableName(others[0])} +${others.length - 1}`;
};

const getRoomParticipantSummary = (room?: ExternalChatRoom | null, currentUserId?: string | null) => {
  if (!room) return "";

  const roomParticipants = [
    normalizeParticipantItem(room.client_snapshot || room.client_id),
    normalizeParticipantItem(room.pm_id),
    ...(room.manager_ids || []).map((item) => normalizeParticipantItem(item)),
    ...(room.cp_ids || []).map((item) => normalizeParticipantItem(item)),
    ...(room.production_ids || []).map((item) => normalizeParticipantItem(item)),
  ].filter(Boolean) as Array<{ id?: string; name?: string; email?: string; role?: string }>;

  const dedupedParticipants = roomParticipants.filter(
    (participant, index, array) =>
      !(
        isBogusParticipantValue(participant.id) &&
        isBogusParticipantValue(participant.name) &&
        isBogusParticipantValue(participant.email)
      ) &&
      array.findIndex((entry) => String(entry.id || "") === String(participant.id || "")) === index
  );

  return getParticipantSummary(dedupedParticipants, currentUserId);
};

const getRoomPreviewText = (room?: ExternalChatRoom | null) => {
  const text = room?.last_message?.message?.trim();
  if (text) return text;
  return "No messages yet";
};

const getRoomPreviewSender = (room?: ExternalChatRoom | null, currentUserId?: string | null) => {
  const sender = normalizeUser(room?.last_message?.sent_by);
  if (!sender?.name) return "";
  if (currentUserId && sender.id && String(sender.id) === currentUserId) return "You";
  return sender.name;
};

const getRoomLastMessageSenderId = (room?: ExternalChatRoom | null) => {
  const sender = normalizeUser(room?.last_message?.sent_by);
  return sender?.id ? String(sender.id) : "";
};

const getRoomUnreadCount = (room?: ExternalChatRoom | null, userId?: string | null) => {
  const mappedUnreadCount = room?.unread_counts && userId ? Number(room.unread_counts[String(userId)] || 0) : 0;
  const directUnreadCount = Number(room?.unreadCount || room?.unread_count || 0);
  return Math.max(mappedUnreadCount, directUnreadCount, 0);
};

const getRoomActivityTimestamp = (room?: ExternalChatRoom | null) =>
  [
    String(room?.last_message?.id || ""),
    String(room?.last_message?.createdAt || ""),
    String(room?.last_message?.message || ""),
    String(room?.updatedAt || room?.createdAt || ""),
  ].join("|");

const formatDayLabel = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const today = new Date();
  const isToday = today.toDateString() === date.toDateString();
  return isToday ? "Today" : date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const getStatusIcon = (status?: string) => {
  if (status === "archived") return <Archive className="w-4 h-4" />;
  if (status === "read_only") return <Lock className="w-4 h-4" />;
  return <MessageCircle className="w-4 h-4" />;
};

const getInitials = (name?: string | null) =>
  String(name || "P")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const getRoleLabel = (role?: string | null) => {
  if (role === "client") return "Client";
  if (role === "cp") return "Creative Partner";
  if (role === "sales_rep") return "Sales Rep";
  if (role === "admin") return "Admin";
  if (role === "manager") return "Admin";
  if (role === "production") return "Production";
  if (role === "pm") return "Project Manager";
  return "Member";
};

const getMessageId = (message?: ExternalChatMessage | null) =>
  String(message?.id || message?._id || "");

const getMessageTimestamp = (message?: ExternalChatMessage | null) =>
  String(message?.createdAt || message?.updatedAt || "");

const getLatestSeenTimestamp = (items: ExternalChatMessage[] = []) => {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const timestamp = getMessageTimestamp(items[index]);
    if (timestamp) return timestamp;
  }
  return "";
};

const buildMessageFromSocketPayload = (payload: any): ExternalChatMessage | null => {
  const messageId = String(payload?.messageId || payload?.id || payload?._id || "").trim();
  if (!messageId) return null;

  return {
    id: messageId,
    _id: messageId,
    message: payload?.message || "",
    chat_room_id: payload?.roomId ? String(payload.roomId) : undefined,
    sent_by:
      payload?.sent_by ||
      (payload?.senderId || payload?.senderName
        ? { id: payload?.senderId != null ? String(payload.senderId) : undefined, name: payload?.senderName }
        : null),
    message_type: payload?.message_type || (payload?.fileUrl ? "file" : "text"),
    file_url: payload?.fileUrl || payload?.file_url,
    file_name: payload?.fileName || payload?.file_name,
    file_type: payload?.fileType || payload?.file_type,
    createdAt: payload?.createdAt || payload?.updatedAt || new Date().toISOString(),
    updatedAt: payload?.updatedAt || payload?.createdAt || new Date().toISOString(),
    reply_to: payload?.replyTo || payload?.reply_to || null,
  };
};

const getUnreadStorageKey = (userId?: string | null) => `external-chat-unread-state:${userId || "guest"}`;

const readUnreadStorage = (userId?: string | null) => {
  if (typeof window === "undefined") {
    return { localUnreadCounts: {}, roomLastSeenAt: {} } as {
      localUnreadCounts: Record<string, number>;
      roomLastSeenAt: Record<string, string>;
    };
  }

  try {
    const raw = window.localStorage.getItem(getUnreadStorageKey(userId));
    if (!raw) {
      return { localUnreadCounts: {}, roomLastSeenAt: {} };
    }

    const parsed = JSON.parse(raw);
    return {
      localUnreadCounts: parsed?.localUnreadCounts || {},
      roomLastSeenAt: parsed?.roomLastSeenAt || {},
    };
  } catch {
    return { localUnreadCounts: {}, roomLastSeenAt: {} };
  }
};

const writeUnreadStorage = (
  userId: string | null | undefined,
  payload: { localUnreadCounts: Record<string, number>; roomLastSeenAt: Record<string, string> }
) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(getUnreadStorageKey(userId), JSON.stringify(payload));
  } catch {
    return;
  }
};

const roomMatchesSalesUser = (room: ExternalChatRoom, appUser: any) => {
  return (room.manager_ids || []).some((participant) => participantMatchesAppUser(participant, appUser));
};

const getComparableUserValues = (appUser: any) => {
  const ids = new Set<string>();
  const emails = new Set<string>();
  const names = new Set<string>();

  [appUser?.id, appUser?.clientId, appUser?.client_id, appUser?.crew_member_id].forEach((value) => {
    if (value != null && String(value).trim()) {
      ids.add(String(value).trim());
    }
  });

  const email = String(appUser?.email || "").trim().toLowerCase();
  if (email) emails.add(email);

  const name = String(appUser?.name || "").trim().toLowerCase();
  if (name) names.add(name);

  return { ids, emails, names };
};

const participantMatchesAppUser = (
  participant: ExternalChatParticipantItem | ExternalChatUser | string | number | null | undefined,
  appUser: any
) => {
  const normalized = normalizeParticipantItem(participant);
  const comparableValues = getComparableUserValues(appUser);
  const participantId = String(normalized?.id || "").trim();
  const participantEmail = String(normalized?.email || "").trim().toLowerCase();
  const participantName = String(normalized?.name || "").trim().toLowerCase();

  return Boolean(
    (participantId && comparableValues.ids.has(participantId)) ||
    (participantEmail && comparableValues.emails.has(participantEmail)) ||
    (participantName && comparableValues.names.has(participantName))
  );
};

const roomMatchesRoleUser = (room: ExternalChatRoom, appUser: any, role: RoleVariant) => {
  if (role === "admin") return true;
  if (role === "sales") return roomMatchesSalesUser(room, appUser);
  if (role === "client") {
    return participantMatchesAppUser(room.client_snapshot || room.client_id, appUser);
  }
  if (role === "cp") {
    return (room.cp_ids || []).some((participant) => participantMatchesAppUser(participant, appUser));
  }
  if (role === "pm") {
    return (
      participantMatchesAppUser(room.pm_id, appUser) ||
      (room.production_ids || []).some((participant) => participantMatchesAppUser(participant, appUser))
    );
  }
  return false;
};

const resolveParticipantRole = ({
  sender,
  participantList,
  participantRoleMap,
}: {
  sender: { id?: string; name?: string; email?: string; role?: string } | null;
  participantList: Array<{ id?: string; name?: string; email?: string; role?: string }>;
  participantRoleMap: Map<string, string>;
}) => {
  if (!sender) return "member";

  const senderId = String(sender.id || "").trim();
  if (senderId) {
    const roleFromId = participantRoleMap.get(senderId);
    if (roleFromId) return roleFromId;
  }

  const senderEmail = String(sender.email || "").trim().toLowerCase();
  if (senderEmail) {
    const roleFromEmail = participantList.find(
      (participant) => participant.email && participant.email.trim().toLowerCase() === senderEmail
    )?.role;
    if (roleFromEmail) return roleFromEmail;
  }

  const senderName = String(sender.name || "").trim().toLowerCase();
  if (senderName) {
    const roleFromName = participantList.find(
      (participant) => participant.name && participant.name.trim().toLowerCase() === senderName
    )?.role;
    if (roleFromName) return roleFromName;
  }

  return sender.role || "member";
};

const isMessageFromCurrentUser = (message: ExternalChatMessage, userId?: string | null) => {
  const sender = normalizeUser(message.sent_by);
  return Boolean(sender?.id && userId && String(sender.id) === userId);
};

const isUnreadEligibleMessage = (message: ExternalChatMessage, userId?: string | null) =>
  message.message_type !== "system" && !isMessageFromCurrentUser(message, userId);

const getUnreadBoundaryMessageId = (
  items: ExternalChatMessage[] = [],
  unreadCount: number,
  userId?: string | null
) => {
  if (!unreadCount) return null;

  let remainingUnread = unreadCount;
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const message = items[index];
    if (!isUnreadEligibleMessage(message, userId)) continue;

    remainingUnread -= 1;
    if (remainingUnread === 0) {
      return getMessageId(message) || null;
    }
  }

  return null;
};

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

export default function ExternalChatView({
  role,
  bookingId,
  heading = "Messages",
  description = "Chat rooms linked to bookings confirmed through Beige.",
  allowActivation = false,
  isDark = true,
  directRoomMode = false,
  onRoomAvailabilityChange,
}: ExternalChatViewProps) {
  const { user } = useAuth();
  const storedUser = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem("revure_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);
  const [rooms, setRooms] = useState<ExternalChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ExternalChatRoom | null>(null);
  const [messages, setMessages] = useState<ExternalChatMessage[]>([]);
  const [participants, setParticipants] = useState<{
    client?: ExternalChatUser | null;
    cps?: ExternalChatParticipantItem[];
    pm?: ExternalChatUser | null;
    production?: ExternalChatParticipantItem[];
    managers?: ExternalChatParticipantItem[];
  }>({});
  const [search, setSearch] = useState("");
  const [roomSortOrder, setRoomSortOrder] = useState<RoomSortOrder>("latest");
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [loadingRoomData, setLoadingRoomData] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [manageDefaultTab, setManageDefaultTab] = useState<"add" | "current">("add");
  const [replyTarget, setReplyTarget] = useState<ExternalChatMessage | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [openMessageMenuId, setOpenMessageMenuId] = useState<string | null>(null);
  const [showReactionPickerId, setShowReactionPickerId] = useState<string | null>(null);
  const [openReactionDetails, setOpenReactionDetails] = useState<{ messageId: string; emoji: string } | null>(null);
  const [showComposerEmojis, setShowComposerEmojis] = useState(false);
  const [messagePendingDelete, setMessagePendingDelete] = useState<ExternalChatMessage | null>(null);
  const [threadSearch, setThreadSearch] = useState("");
  const [isThreadSearchOpen, setIsThreadSearchOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [localUnreadCounts, setLocalUnreadCounts] = useState<Record<string, number>>({});
  const [activeThreadUnreadCount, setActiveThreadUnreadCount] = useState(0);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [pendingInitialScroll, setPendingInitialScroll] = useState<"bottom" | "unread" | null>(null);
  const [accessRevokedNotice, setAccessRevokedNotice] = useState<string | null>(null);
  const [pickerHeight, setPickerHeight] = useState(340);
  const socketRef = useRef<Socket | null>(null);
  const socketRefreshTimerRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const unreadMarkerRef = useRef<HTMLDivElement | null>(null);
  const messageViewportRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const composerEmojiRef = useRef<HTMLDivElement | null>(null);
  const headerMenuRef = useRef<HTMLDivElement | null>(null);
  const roomActivityRef = useRef<Record<string, string>>({});
  const messagesRef = useRef<ExternalChatMessage[]>([]);
  const roomsRef = useRef<ExternalChatRoom[]>([]);
  const selectedRoomRef = useRef<ExternalChatRoom | null>(null);
  const roomLastSeenAtRef = useRef<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const effectiveUser = useMemo(() => ({ ...(storedUser || {}), ...(user || {}) }), [storedUser, user]);
  const userId = effectiveUser?.id != null ? String(effectiveUser.id) : null;
  const userName = String(effectiveUser?.name || effectiveUser?.email || "").trim();
  const safeUserName = userName || `User ${userId || "guest"}`;
  const isAdminView = role === "admin";
  const shouldUseDirectRoom = Boolean(directRoomMode && bookingId);
  const socketServerUrl = useMemo(() => {
    const explicitSocketUrl = String(process.env.NEXT_PUBLIC_CHAT_SOCKET_URL || "").trim();
    if (explicitSocketUrl) {
      return explicitSocketUrl.replace(/\/+$/, "");
    }

    if (typeof window !== "undefined" && /dev\.beige\.app$/i.test(window.location.hostname)) {
      return "https://api2.dev.beige.app";
    }

    const apiEndpoint = String(process.env.NEXT_PUBLIC_API_ENDPOINT || "").trim();
    if (apiEndpoint) {
      const normalized = apiEndpoint.replace(/\/v1\/?$/i, "").replace(/\/+$/, "");
      if (/localhost:5001/i.test(normalized)) {
        return normalized.replace(/localhost:5001/i, "localhost:5002");
      }
      return normalized;
    }

    return "http://localhost:5002";
  }, []);
  const currentSender = {
    id: effectiveUser?.id != null ? String(effectiveUser.id) : undefined,
    name: effectiveUser?.name || undefined,
    email: effectiveUser?.email || undefined,
  };

  const participantList = useMemo(() => {
    const managerUsers = (participants.managers || []).map((item) => normalizeParticipantItem(item)).filter(Boolean);
    const cpUsers = (participants.cps || []).map((item) => normalizeParticipantItem(item)).filter(Boolean);
    const productionUsers = (participants.production || []).map((item) => normalizeParticipantItem(item)).filter(Boolean);
    const pmUser = normalizeUser(participants.pm);
    const clientUser = normalizeUser(participants.client);

    return [clientUser, pmUser, ...managerUsers, ...cpUsers, ...productionUsers].filter(
      (item, index, array) =>
        item &&
        !(
          isBogusParticipantValue(item.id) &&
          isBogusParticipantValue(item.name) &&
          isBogusParticipantValue(item.email)
        ) &&
        array.findIndex((entry) => entry?.id === item.id) === index
    ) as Array<{ id?: string; name?: string; email?: string; role?: string }>;
  }, [participants]);

  const scopedRooms = useMemo(
    () =>
      (role === "cp" || role === "client") && !bookingId
        ? rooms
        : rooms.filter((room) => roomMatchesRoleUser(room, effectiveUser, role)),
    [rooms, role, effectiveUser, bookingId]
  );

  const filteredRooms = useMemo(() => {
    const sortedRooms = [...scopedRooms].sort((a, b) => {
      const left = new Date(a.updatedAt || a.last_message?.createdAt || a.createdAt || 0).getTime();
      const right = new Date(b.updatedAt || b.last_message?.createdAt || b.createdAt || 0).getTime();
      return roomSortOrder === "latest" ? right - left : left - right;
    });

    if (!search.trim()) return sortedRooms;
    const query = search.trim().toLowerCase();
    return sortedRooms.filter((room) =>
      [room.name, room.chat_id, room.last_message?.message]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [scopedRooms, search, roomSortOrder]);

  const visibleMessages = useMemo(() => {
    const query = threadSearch.trim().toLowerCase();
    if (!query) return messages;

    return messages.filter((message) => {
      const sender = normalizeUser(message.sent_by);
      return [getMessageText(message), sender?.name, sender?.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [messages, threadSearch]);

  const memberIds = participantList.map((participant) => String(participant.id || ""));
  const participantCount = participantList.length;
  const participantRoleMap = useMemo(() => {
    const map = new Map<string, string>();
    participantList.forEach((participant) => {
      if (participant.id) {
        map.set(String(participant.id), participant.role || "member");
      }
    });
    return map;
  }, [participantList]);

  const unreadBoundaryMessageId = useMemo(
    () => getUnreadBoundaryMessageId(messages, activeThreadUnreadCount, userId),
    [messages, activeThreadUnreadCount, userId]
  );
  const hasUnreadMarker = Boolean(unreadBoundaryMessageId && activeThreadUnreadCount > 0);

  const persistUnreadState = (
    nextLocalUnreadCounts: Record<string, number>,
    nextRoomLastSeenAt: Record<string, string> = roomLastSeenAtRef.current
  ) => {
    writeUnreadStorage(userId, {
      localUnreadCounts: nextLocalUnreadCounts,
      roomLastSeenAt: nextRoomLastSeenAt,
    });
  };

  const updateScrollIntent = () => {
    const viewport = messageViewportRef.current;
    if (!viewport) return;
    const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    const nextIsNearBottom = distanceFromBottom < 80;
    shouldStickToBottomRef.current = nextIsNearBottom;
    setIsNearBottom(nextIsNearBottom);

    if (nextIsNearBottom) {
      setActiveThreadUnreadCount(0);
    }
  };

  const clearSelectedConversation = (notice?: string) => {
    setSelectedRoom(null);
    selectedRoomRef.current = null;
    setMessages([]);
    setParticipants({});
    setDraftMessage("");
    setReplyTarget(null);
    setActiveThreadUnreadCount(0);
    setIsNearBottom(true);
    setAccessRevokedNotice(notice || null);
  };

  const syncRoomSnapshot = (room: ExternalChatRoom | null, messageData?: ExternalChatMessage[]) => {
    const roomId = getRoomId(room);
    if (!roomId) return;
    const activeSelectedRoomId = getRoomId(selectedRoomRef.current);

    const latestMessage =
      messageData && messageData.length > 0 ? messageData[messageData.length - 1] : undefined;

    setRooms((current) =>
      current.map((item) => {
        if (getRoomId(item) !== roomId) return item;
        return {
          ...item,
          ...room,
          unread_counts:
            getRoomId(item) === activeSelectedRoomId && userId
              ? { ...(item.unread_counts || {}), [String(userId)]: 0 }
              : room?.unread_counts || item.unread_counts,
          last_message: latestMessage
            ? {
              id: latestMessage.id || latestMessage._id,
              message: latestMessage.message || latestMessage.file_name || getMessageText(latestMessage),
              createdAt: latestMessage.createdAt || latestMessage.updatedAt,
              sent_by: latestMessage.sent_by,
            }
            : item.last_message || room?.last_message || null,
          updatedAt: latestMessage?.createdAt || latestMessage?.updatedAt || room?.updatedAt || item.updatedAt,
        };
      })
    );

    if (latestMessage?.createdAt || latestMessage?.updatedAt) {
      roomActivityRef.current[roomId] = String(latestMessage.createdAt || latestMessage.updatedAt);
    }
  };

  const refreshRoomListSnapshot = async () => {
    const activeSelectedRoom = selectedRoomRef.current;
    const activeSelectedRoomId = getRoomId(activeSelectedRoom);

    if (bookingId) {
      const room = await externalChatApi.getRoomByBooking(bookingId);
      const roomList = room ? await hydrateRoomPreviews([room]) : [];
      setRooms(
        roomList.map((item) =>
          getRoomId(item) === activeSelectedRoomId && userId
            ? { ...item, unread_counts: { ...(item.unread_counts || {}), [String(userId)]: 0 } }
            : item
        )
      );
      if (activeSelectedRoomId && !roomList.some((item) => getRoomId(item) === activeSelectedRoomId)) {
        clearSelectedConversation("You no longer have access to this conversation.");
      }
      return;
    }

    const roomList = await externalChatApi.listRooms({ page: 1, limit: 100, sortBy: "updatedAt:desc" });
    const roomMessagesMap: Record<string, ExternalChatMessage[]> = {};
    const hydratedRooms = await hydrateRoomPreviews(roomList, {
      forceLatestMessage: true,
      onMessages: (roomId, roomMessages) => {
        roomMessagesMap[roomId] = roomMessages;
      },
    });
    const mergedRooms = hydratedRooms.map((incoming) => {
      const existing = roomsRef.current.find((room) => getRoomId(room) === getRoomId(incoming));
      const mergedRoom =
        existing && !incoming.last_message?.message ? { ...existing, ...incoming, last_message: existing.last_message } : { ...existing, ...incoming };

      if (getRoomId(mergedRoom) === activeSelectedRoomId && userId) {
        return {
          ...mergedRoom,
          unread_counts: { ...(mergedRoom.unread_counts || {}), [String(userId)]: 0 },
        };
      }

      return mergedRoom;
    });

    setLocalUnreadCounts((current) => {
      const next = { ...current };
      mergedRooms.forEach((room) => {
        const roomId = getRoomId(room);
        if (!roomId) return;

        const currentActivity = getRoomActivityTimestamp(room);
        const previousActivity = roomActivityRef.current[roomId];
        const isCurrentRoom = roomId === activeSelectedRoomId;
        const serverUnreadCount = getRoomUnreadCount(room, userId);
        const isOwnLatestMessage = getRoomLastMessageSenderId(room) === userId;
        const roomMessages = roomMessagesMap[roomId] || [];
        const lastSeenAt = roomLastSeenAtRef.current[roomId];
        const countedUnreadFromMessages = lastSeenAt
          ? roomMessages.filter((message) => {
            const timestamp = getMessageTimestamp(message);
            return Boolean(
              timestamp &&
              new Date(timestamp).getTime() > new Date(lastSeenAt).getTime() &&
              isUnreadEligibleMessage(message, userId)
            );
          }).length
          : 0;

        if (isCurrentRoom) {
          delete next[roomId];
        } else if (countedUnreadFromMessages > 0 || serverUnreadCount > 0) {
          next[roomId] = Math.max(next[roomId] || 0, countedUnreadFromMessages, serverUnreadCount);
        } else if (previousActivity && currentActivity && previousActivity !== currentActivity && !isOwnLatestMessage) {
          next[roomId] = Math.max((next[roomId] || 0) + 1, 1);
        }

        roomActivityRef.current[roomId] = currentActivity;
      });
      persistUnreadState(next);
      return next;
    });
    setRooms(mergedRooms);
    if (activeSelectedRoomId && !mergedRooms.some((item) => getRoomId(item) === activeSelectedRoomId)) {
      clearSelectedConversation("You no longer have access to this conversation.");
    }
  };

  const scheduleSocketRefresh = (options?: { forceRoomRefresh?: boolean }) => {
    if (socketRefreshTimerRef.current) {
      window.clearTimeout(socketRefreshTimerRef.current);
      socketRefreshTimerRef.current = null;
    }

    socketRefreshTimerRef.current = window.setTimeout(() => {
      const activeRoom = selectedRoomRef.current;
      refreshRoomListSnapshot().catch(() => undefined);

      if (options?.forceRoomRefresh && getRoomId(activeRoom)) {
        loadRoomDetails(activeRoom, { silent: true }).catch(() => undefined);
      }
    }, 250);
  };

  const hydrateRoomPreviews = async (
    roomList: ExternalChatRoom[],
    options?: { forceLatestMessage?: boolean; onMessages?: (roomId: string, roomMessages: ExternalChatMessage[]) => void }
  ) => {
    const hydratedRooms = await Promise.all(
      roomList.map(async (room) => {
        const roomId = getRoomId(room);
        const shouldFetchLatest = Boolean(options?.forceLatestMessage || !room.last_message?.message?.trim());
        if (!roomId || !shouldFetchLatest) return room;

        try {
          const latestMessages = await externalChatApi.getMessages(roomId, {
            page: 1,
            limit: options?.forceLatestMessage ? 30 : 1,
            sortBy: "createdAt:desc",
          });
          options?.onMessages?.(roomId, latestMessages);
          const latestMessage = latestMessages[0];
          if (!latestMessage) return room;

          return {
            ...room,
            last_message: {
              id: latestMessage.id || latestMessage._id,
              message: latestMessage.message || latestMessage.file_name || getMessageText(latestMessage),
              createdAt: latestMessage.createdAt || latestMessage.updatedAt,
              sent_by: latestMessage.sent_by,
            },
            updatedAt: latestMessage.createdAt || latestMessage.updatedAt || room.updatedAt,
          };
        } catch {
          return room;
        }
      })
    );

    return hydratedRooms;
  };

  const loadRoomDetails = async (
    room: ExternalChatRoom | null,
    options?: { silent?: boolean; preserveRoomUnread?: boolean }
  ) => {
    const roomId = getRoomId(room);
    const previousSelectedRoomId = getRoomId(selectedRoom);
    const isSwitchingRooms = roomId !== previousSelectedRoomId;
    const unreadSnapshot = roomId ? Math.max(getRoomUnreadCount(room, userId), localUnreadCounts[roomId] || 0) : 0;
    const shouldPreserveRoomUnread = Boolean(options?.preserveRoomUnread);
    const roomWithClearedUnread =
      roomId && userId && !shouldPreserveRoomUnread
        ? {
          ...room,
          unread_counts: { ...(room?.unread_counts || {}), [String(userId)]: 0 },
        }
        : room;

    setSelectedRoom(roomWithClearedUnread);
    setAccessRevokedNotice(null);
    selectedRoomRef.current = roomWithClearedUnread;
    if (roomId && userId && !shouldPreserveRoomUnread) {
      setRooms((current) =>
        current.map((item) =>
          getRoomId(item) === roomId
            ? { ...item, unread_counts: { ...(item.unread_counts || {}), [String(userId)]: 0 } }
            : item
        )
      );
    }
    if (roomId && !shouldPreserveRoomUnread) {
      setLocalUnreadCounts((current) => {
        if (!current[roomId]) return current;
        const next = { ...current };
        delete next[roomId];
        persistUnreadState(next);
        return next;
      });
    }
    if (!roomId) {
      setMessages([]);
      setParticipants({});
      setActiveThreadUnreadCount(0);
      setIsNearBottom(true);
      return;
    }

    if (!options?.silent) {
      setActiveThreadUnreadCount(unreadSnapshot);
      const shouldStartAtBottom = unreadSnapshot <= 0;
      shouldStickToBottomRef.current = shouldStartAtBottom;
      setIsNearBottom(shouldStartAtBottom);
      setPendingInitialScroll(shouldStartAtBottom ? "bottom" : "unread");
    }

    if (!options?.silent) {
      setLoadingRoomData(true);
    }
    try {
      const [messageData, participantData] = await Promise.all([
        externalChatApi.getMessages(roomId, { page: 1, limit: 100, sortBy: "createdAt:asc" }),
        externalChatApi.getParticipants(roomId),
      ]);
      const sortedMessages = sortMessagesAsc(messageData);
      const existingMessages = isSwitchingRooms ? [] : messagesRef.current;
      const knownMessageIds = new Set(existingMessages.map((item) => getMessageId(item)).filter(Boolean));
      const incomingUnreadCount =
        options?.silent && existingMessages.length > 0
          ? sortedMessages.filter(
            (message) => !knownMessageIds.has(getMessageId(message)) && isUnreadEligibleMessage(message, userId)
          ).length
          : 0;

      setMessages(sortedMessages);
      syncRoomSnapshot(roomWithClearedUnread, sortedMessages);
      const latestSeenTimestamp = getLatestSeenTimestamp(sortedMessages);
      await externalChatApi.markRoomAsRead(roomId, currentSender).catch(() => undefined);
      if (latestSeenTimestamp) {
        const nextRoomLastSeenAt = {
          ...roomLastSeenAtRef.current,
          [roomId]: latestSeenTimestamp,
        };
        roomLastSeenAtRef.current = nextRoomLastSeenAt;
        setLocalUnreadCounts((current) => {
          const next = { ...current };
          delete next[roomId];
          persistUnreadState(next, nextRoomLastSeenAt);
          return next;
        });
      }
      if (!options?.preserveRoomUnread && (!options?.silent || shouldStickToBottomRef.current)) {
        if (latestSeenTimestamp) {
          const nextRoomLastSeenAt = {
            ...roomLastSeenAtRef.current,
            [roomId]: latestSeenTimestamp,
          };
          roomLastSeenAtRef.current = nextRoomLastSeenAt;
          persistUnreadState(localUnreadCounts, nextRoomLastSeenAt);
        }
      }
      if (incomingUnreadCount > 0 && !shouldStickToBottomRef.current) {
        setActiveThreadUnreadCount((current) => current + incomingUnreadCount);
      }
      setParticipants({
        ...buildParticipantStateFromRoom(room),
        ...participantData,
        client: participantData?.client || room?.client_snapshot || room?.client_id || null,
        cps: (participantData?.cps && participantData.cps.length ? participantData.cps : room?.cp_ids) || [],
        pm: participantData?.pm || room?.pm_id || null,
        production:
          (participantData?.production && participantData.production.length ? participantData.production : room?.production_ids) || [],
        managers:
          (participantData?.managers && participantData.managers.length ? participantData.managers : room?.manager_ids) || [],
      });
    } catch (err: any) {
      if (err?.status === 403 || err?.status === 404) {
        setRooms((current) => current.filter((item) => getRoomId(item) !== roomId));
        clearSelectedConversation("You were removed from this conversation. Access has been disabled.");
        return;
      }
      if (!options?.silent) {
        setMessages([]);
        setParticipants(buildParticipantStateFromRoom(room));
        toast.error(err?.message || "Failed to load chat room details");
      }
    } finally {
      if (!options?.silent) {
        setLoadingRoomData(false);
      }
    }
  };

  const loadRooms = async () => {
    setLoading(true);
    try {
      if (bookingId) {
        const room = await externalChatApi.getRoomByBooking(bookingId);
        const roomList = room ? await hydrateRoomPreviews([room]) : [];
        roomList.forEach((item) => {
          roomActivityRef.current[getRoomId(item)] = getRoomActivityTimestamp(item);
        });
        setRooms(roomList);
        onRoomAvailabilityChange?.(roomList.length > 0);
        if (shouldUseDirectRoom && roomList[0]) {
          await loadRoomDetails(roomList[0]);
        } else {
          clearSelectedConversation();
        }
      } else {
        const roomList = await externalChatApi.listRooms({ page: 1, limit: 100, sortBy: "updatedAt:desc" });
        const hydratedRooms = await hydrateRoomPreviews(roomList);
        hydratedRooms.forEach((item) => {
          roomActivityRef.current[getRoomId(item)] = getRoomActivityTimestamp(item);
        });
        setRooms(hydratedRooms);
        onRoomAvailabilityChange?.(hydratedRooms.length > 0);
        clearSelectedConversation();
      }
    } catch (err: any) {
      if (bookingId && (err?.status === 404 || err?.response?.status === 404)) {
        setRooms([]);
        onRoomAvailabilityChange?.(false);
        clearSelectedConversation();
        return;
      }
      toast.error(err?.message || "Failed to load chat rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      // If the window width is under 1024px (Tailwind's lg breakpoint), drop height to 200
      if (window.innerWidth < 1024) {
        setPickerHeight(280);
      } else {
        setPickerHeight(340);
      }
    };

    // Run on mount and on every resize action
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const storedState = readUnreadStorage(userId);
    roomLastSeenAtRef.current = storedState.roomLastSeenAt;
    setLocalUnreadCounts(storedState.localUnreadCounts);
  }, [userId]);

  useEffect(() => {
    loadRooms();
  }, [bookingId, shouldUseDirectRoom, role]);

  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  useEffect(() => {
    if (!userId) return undefined;

    const socket = io(socketServerUrl, {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    const joinActiveRoom = () => {
      const activeRoomId = getRoomId(selectedRoomRef.current);
      if (!activeRoomId) return;
      socket.emit("joinRoom", {
        roomId: activeRoomId,
        userId,
        userName: safeUserName,
      });
    };

    socket.on("connect", () => {
      socket.emit("joinNotificationRoom", { userId, userRole: role });
      joinActiveRoom();
      scheduleSocketRefresh({ forceRoomRefresh: true });
    });

    socket.on("message", (payload: any) => {
      if (payload?.success === false) {
        const errorText = String(payload?.error || "").trim();
        if (errorText) {
          toast.error(errorText);
        }
        return;
      }
      const activeRoomId = getRoomId(selectedRoomRef.current);
      const roomIdFromPayload = String(payload?.roomId || "").trim();
      const incomingMessage = buildMessageFromSocketPayload(payload);
      const incomingSenderId = String(payload?.senderId || normalizeUser(incomingMessage?.sent_by || null)?.id || "").trim();
      const incomingMessageTimestamp = String(
        incomingMessage?.createdAt || incomingMessage?.updatedAt || payload?.createdAt || new Date().toISOString()
      );

      if (incomingMessage && roomIdFromPayload) {
        setRooms((current) =>
          current.map((room) => {
            if (getRoomId(room) !== roomIdFromPayload) return room;
            return {
              ...room,
              last_message: {
                id: getMessageId(incomingMessage),
                message: incomingMessage.message || incomingMessage.file_name || "New message",
                createdAt: incomingMessage.createdAt || incomingMessage.updatedAt,
                sent_by: normalizeUser(incomingMessage.sent_by),
              },
              updatedAt: incomingMessage.createdAt || incomingMessage.updatedAt || room.updatedAt,
            };
          })
        );

        roomActivityRef.current[roomIdFromPayload] = [
          getMessageId(incomingMessage),
          incomingMessage.createdAt || "",
          incomingMessage.message || "",
          incomingMessage.updatedAt || "",
        ].join("|");
      }

      if (incomingMessage && activeRoomId && roomIdFromPayload === String(activeRoomId)) {
        setMessages((current) => {
          const exists = current.some((item) => getMessageId(item) === getMessageId(incomingMessage));
          if (exists) return current;
          return sortMessagesAsc([...current, incomingMessage]);
        });

        if (!shouldStickToBottomRef.current && incomingSenderId && incomingSenderId !== String(userId || "")) {
          setActiveThreadUnreadCount((current) => current + 1);
        }
        return;
      }

      if (roomIdFromPayload && incomingSenderId && incomingSenderId !== String(userId || "")) {
        setLocalUnreadCounts((current) => {
          const next = {
            ...current,
            [roomIdFromPayload]: (current[roomIdFromPayload] || 0) + 1,
          };
          persistUnreadState(next);
          return next;
        });
      }

      if (!incomingMessage) {
        scheduleSocketRefresh();
      }
    });

    socket.on("updateChatRoom", (payload: any) => {
      const roomIdFromPayload = String(payload?.roomId || "").trim();
      if (!roomIdFromPayload) {
        scheduleSocketRefresh();
        return;
      }

      setRooms((current) =>
        current.map((room) =>
          getRoomId(room) === roomIdFromPayload
            ? {
              ...room,
              last_message: {
                ...(room.last_message || {}),
                message: String(payload?.message || room.last_message?.message || "New update"),
              },
              updatedAt: new Date().toISOString(),
            }
            : room
        )
      );
    });
    socket.on("messageEdited", (payload: any) => {
      if (payload?.success === false) return;
      const messageId = String(payload?.messageId || "").trim();
      if (!messageId) return;

      setMessages((current) =>
        current.map((item) =>
          getMessageId(item) === messageId
            ? {
              ...item,
              message: String(payload?.content || item.message || ""),
              is_edited: true,
              updatedAt: payload?.updatedAt || item.updatedAt,
            }
            : item
        )
      );
    });
    socket.on("messageDeleted", (payload: any) => {
      if (payload?.success === false) return;
      const messageId = String(payload?.messageId || "").trim();
      if (!messageId) return;

      setMessages((current) =>
        current.map((item) =>
          getMessageId(item) === messageId
            ? {
              ...item,
              is_deleted: true,
              message: "This message was deleted",
              updatedAt: payload?.updatedAt || item.updatedAt,
            }
            : item
        )
      );
    });
    socket.on("reactionUpdated", (payload: any) => {
      if (payload?.success === false) return;
      const messageId = String(payload?.messageId || "").trim();
      if (!messageId) return;
      const nextReactions = Array.isArray(payload?.reactions) ? payload.reactions : [];

      setMessages((current) =>
        current.map((item) =>
          getMessageId(item) === messageId
            ? { ...item, reactions: nextReactions, updatedAt: payload?.updatedAt || item.updatedAt }
            : item
        )
      );
    });
    socket.on("participantAdded", () => scheduleSocketRefresh({ forceRoomRefresh: true }));
    socket.on("participantRemoved", () => scheduleSocketRefresh({ forceRoomRefresh: true }));
    socket.on("chatRoomStatusChanged", () => scheduleSocketRefresh({ forceRoomRefresh: true }));
    socket.on("notification:new", (payload: any) => {
      const roomIdFromPayload = String(payload?.roomId || payload?.id || "").trim();
      if (!roomIdFromPayload || payload?.senderId === userId) return;

      setLocalUnreadCounts((current) => {
        const next = {
          ...current,
          [roomIdFromPayload]: (current[roomIdFromPayload] || 0) + 1,
        };
        persistUnreadState(next);
        return next;
      });
    });

    return () => {
      if (socketRefreshTimerRef.current) {
        window.clearTimeout(socketRefreshTimerRef.current);
        socketRefreshTimerRef.current = null;
      }
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [socketServerUrl, userId, safeUserName, role]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !socket.connected || !userId) return;

    const activeRoomId = getRoomId(selectedRoom);
    if (!activeRoomId) return;

    socket.emit("joinRoom", {
      roomId: activeRoomId,
      userId,
      userName: safeUserName,
    });
  }, [selectedRoom, userId, safeUserName]);

  useEffect(() => {
    if (!shouldStickToBottomRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [messages, selectedRoom?.id, selectedRoom?._id]);

  useEffect(() => {
    if (!pendingInitialScroll || loadingRoomData) return;

    if (pendingInitialScroll === "unread" && unreadMarkerRef.current) {
      shouldStickToBottomRef.current = false;
      setIsNearBottom(false);
      unreadMarkerRef.current.scrollIntoView({ behavior: "auto", block: "start" });
      setPendingInitialScroll(null);
      return;
    }

    shouldStickToBottomRef.current = true;
    setIsNearBottom(true);
    messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    setPendingInitialScroll(null);
  }, [pendingInitialScroll, loadingRoomData, unreadBoundaryMessageId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    setThreadSearch("");
    setIsThreadSearchOpen(false);
    setIsHeaderMenuOpen(false);
  }, [selectedRoom?.id, selectedRoom?._id]);

  useEffect(() => {
    const currentSelectedRoomId = getRoomId(selectedRoom);
    if (!currentSelectedRoomId) return;
    const isStillAccessible = scopedRooms.some((room) => getRoomId(room) === currentSelectedRoomId);
    if (!isStillAccessible) {
      clearSelectedConversation("You no longer have access to this conversation.");
    }
  }, [scopedRooms, selectedRoom]);

  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      const targetElement = target as HTMLElement;

      if (composerEmojiRef.current && !composerEmojiRef.current.contains(target)) {
        setShowComposerEmojis(false);
      }

      if (headerMenuRef.current && !headerMenuRef.current.contains(target)) {
        setIsHeaderMenuOpen(false);
      }

      if (!targetElement.closest("[data-message-action-area='true']")) {
        setOpenMessageMenuId(null);
        setShowReactionPickerId(null);
      }

      if (!targetElement.closest("[data-reaction-details='true']")) {
        setOpenReactionDetails(null);
      }
    };

    document.addEventListener("mousedown", handleGlobalClick);
    return () => document.removeEventListener("mousedown", handleGlobalClick);
  }, []);

  const activateChat = async () => {
    if (!bookingId) return;
    setActivating(true);
    try {
      const room = await externalChatApi.createRoom(bookingId);
      if (!room) {
        toast.error("Chat room could not be created");
        return;
      }
      toast.success("Chat room is now active");
      setRooms([room]);
      await loadRoomDetails(room);
    } catch (err: any) {
      toast.error(err?.message || "Failed to activate chat room");
    } finally {
      setActivating(false);
    }
  };

  const sendMessage = async () => {
    const roomId = getRoomId(selectedRoom);
    const message = draftMessage.trim();
    if (!roomId || !message) return;

    setSending(true);
    try {
      const sent = await externalChatApi.sendMessage(roomId, message, {
        sender: currentSender,
        replyTo: getMessageId(replyTarget) || null,
      });
      setDraftMessage("");
      setReplyTarget(null);
      setShowComposerEmojis(false);
      shouldStickToBottomRef.current = true;
      if (sent) {
        setMessages((current) => {
          const sentId = getMessageId(sent);
          if (sentId && current.some((item) => getMessageId(item) === sentId)) return current;
          return sortMessagesAsc([...current, sent]);
        });
        syncRoomSnapshot(selectedRoom, sortMessagesAsc([...messagesRef.current, sent]));
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !selectedRoom) return;

    const roomId = getRoomId(selectedRoom);
    if (!roomId) return;

    setUploadingFile(true);
    try {
      const socket = socketRef.current;
      if (!socket) {
        toast.error("Not connected to chat");
        return;
      }

      for (const file of files) {
        const result = await externalChatApi.uploadFile(roomId, file, currentSender);
        if (!result?.fileUrl) {
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        socket.emit("message", {
          roomId,
          userId,
          message: "",
          fileUrl: result.fileUrl,
          fileName: result.fileName,
          fileType: result.fileType,
        });
      }

      shouldStickToBottomRef.current = true;
      toast.success(`${files.length} file${files.length > 1 ? "s" : ""} sent!`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload file");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleReaction = async (message: ExternalChatMessage, emoji: string) => {
    const messageId = getMessageId(message);
    const roomId = getRoomId(selectedRoom);
    if (!messageId) return;

    try {
      await externalChatApi.reactToMessage(messageId, emoji, currentSender, roomId || undefined);
      setShowReactionPickerId(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to react to message");
    }
  };

  const startEditingMessage = (message: ExternalChatMessage) => {
    setEditingMessageId(getMessageId(message));
    setEditingText(message.message || "");
    setOpenMessageMenuId(null);
  };

  const submitEditMessage = async () => {
    const roomId = getRoomId(selectedRoom);
    if (!editingMessageId || !editingText.trim()) return;

    try {
      await externalChatApi.editMessage(editingMessageId, editingText.trim(), currentSender, roomId || undefined);
      setEditingMessageId(null);
      setEditingText("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to edit message");
    }
  };

  const handleDeleteMessage = async (message: ExternalChatMessage) => {
    const messageId = getMessageId(message);
    const roomId = getRoomId(selectedRoom);
    if (!messageId) return;

    try {
      const updated = await externalChatApi.deleteMessage(messageId, currentSender, roomId || undefined);
      setOpenMessageMenuId(null);
      setShowReactionPickerId(null);
      setOpenReactionDetails(null);
      setMessagePendingDelete(null);
      if (updated) {
        setMessages((current) =>
          current.map((item) => (getMessageId(item) === messageId ? { ...item, ...updated } : item))
        );
        syncRoomSnapshot(selectedRoom, messages.map((item) => (getMessageId(item) === messageId ? { ...item, ...updated } : item)));
      } else {
        setMessages((current) =>
          current.map((item) =>
            getMessageId(item) === messageId
              ? { ...item, is_deleted: true, message: "This message was deleted" }
              : item
          )
        );
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete message");
    }
  };

  const appendEmojiToDraft = (emoji: string) => {
    setDraftMessage((current) => `${current}${emoji}`);
  };

  const handleComposerEmojiClick = (emojiData: EmojiClickData) => {
    appendEmojiToDraft(emojiData.emoji);
  };

  const selectedRoomTitle = selectedRoom?.name || "Messages";
  const latestDate = visibleMessages[visibleMessages.length - 1]?.createdAt || selectedRoom?.updatedAt || selectedRoom?.createdAt;
  const isDirectRoomLoading = shouldUseDirectRoom && loading;

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-scroll no-scrollbar lg:overflow-y-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <h2 className={`text-lg lg:text-2xl font-semibold transition-colors ${isDark ? "text-white" : "text-black"}`}>
              {heading}
            </h2>
            <p className={`mt-1 text-xs lg:text-sm transition-colors ${isDark ? "text-white/55" : "text-black/60"}`}>
              {description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Sort Order Action Toggle Button */}
            {!shouldUseDirectRoom ? (
              <button
                type="button"
                onClick={() => setRoomSortOrder((current) => (current === "latest" ? "oldest" : "latest"))}
                className={`inline-flex items-center gap-2 rounded-full border py-2 px-3 lg:px-4 lg:py-3 text-xs lg:text-sm transition-colors ${isDark
                  ? "border-white/10 bg-[#111111] text-white/70 hover:bg-white/5"
                  : "border-[#E5E5E5] bg-white text-black/70 hover:bg-zinc-50 shadow-sm"
                  }`}
              >
                <CalendarDays className="h-4 w-4" />
                {roomSortOrder === "latest" ? "Latest First" : "Oldest First"}
              </button>
            ) : null}

            {/* Admin Specific Action Trigger Button */}
            {isAdminView && !bookingId ? (
              <button
                type="button"
                onClick={() => setIsComposerOpen(true)}
                className={`rounded-lg lg:rounded-xl py-2 px-3 lg:px-4 lg:py-3 text-xs lg:text-sm font-semibold transition-colors ${isDark
                  ? "bg-[#E5D5B8] text-black hover:bg-[#d8c49e]"
                  : "bg-black text-white hover:bg-zinc-800"
                  }`}
              >
                Create Messages
              </button>
            ) : null}
          </div>
        </div>

        <div className={`flex min-h-100 lg:min-h-0 flex-1 overflow-hidden rounded-2xl lg:rounded-4xl border transition-colors ${isDark
          ? "border-white/10 bg-[radial-gradient(circle_at_top,#181818,transparent_35%),#0b0b0b] shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
          : "border-[#E5E5E5] bg-[radial-gradient(circle_at_top,#F9F9F9,transparent_35%),#FFFFFF] shadow-[0_20px_50px_rgba(0,0,0,0.06)]"
          }`}>
          <div className={`grid w-full min-w-0 min-h-0 flex-1 ${shouldUseDirectRoom ? "grid-cols-1" : "lg:grid-cols-[420px_minmax(0,1fr)]"}`}>

            {/* PART 1: SIDEBAR TRACK CONTAINER (Responsive: hidden on mobile if a room is selected) */}
            {!shouldUseDirectRoom ? (
              <div className={`w-full max-w-full min-w-0 min-h-0 flex-col border-b lg:border-b-0 lg:border-r transition-colors ${selectedRoom ? "hidden lg:flex" : "flex"} ${isDark ? "border-white/10 bg-[#171717]" : "border-[#E5E5E5] bg-[#FAFAFA]"}`}>

              {/* Sidebar Header & Search View */}
              <div className={`border-b p-4 lg:p-6 transition-colors ${isDark ? "border-white/5" : "border-[#E3E3E3]"}`}>
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-lg lg:text-2xl font-semibold transition-colors truncate ${isDark ? "text-white" : "text-black"}`}>
                      Messages
                    </h3>
                    <p className={`mt-1 text-xs lg:text-sm transition-colors ${isDark ? "text-white/35" : "text-black/50"}`}>
                      Browse all conversations in one place.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={loadRooms}
                    variant="outline"
                    className={`h-10 w-10 lg:h-11 lg:w-11 shrink-0 rounded-full p-0 transition-colors ${isDark
                      ? "border-white/10 bg-[#202020] text-white/70 hover:bg-[#262626]"
                      : "border-[#E5E5E5] bg-white text-black/70 hover:bg-zinc-100"
                      }`}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="relative flex-1 min-w-0">
                    <Search className={`absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors ${isDark ? "text-white/35" : "text-black/40"}`} />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search Conversation"
                      className={`h-10 lg:h-14 w-full rounded-full border-0 pl-12 pr-4 text-sm lg:text-base transition-colors ${isDark
                        ? "bg-[#202020] text-white placeholder:text-white/40"
                        : "bg-[#F0F0F0] text-black placeholder:text-black/40"
                        }`}
                    />
                  </div>
                  {isAdminView && !bookingId ? (
                    <button
                      type="button"
                      onClick={() => setIsComposerOpen(true)}
                      className={`flex h-10 w-10 lg:h-14 lg:w-14 shrink-0 items-center justify-center rounded-full transition-colors ${isDark ? "bg-[#E5D5B8] text-black hover:bg-[#d8c49e]" : "bg-black text-white hover:bg-zinc-800"}`}
                    >
                      <span className="text-xl lg:text-4xl font-light leading-none -mt-0.5 lg:-mt-1">+</span>
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Dynamic Conversational Rooms List view */}
              <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4 lg:px-4 lg:py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {loading ? (
                  <div className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-[#E3E3E3] bg-white"}`}>
                    <Loader2 className="animate-spin text-[#BFA780]" size={40} />
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <div className={`rounded-3xl border border-dashed p-3 lg:p-5 transition-colors ${isDark ? "border-white/10 bg-[#111111]" : "border-[#E5E5E5] bg-[#F9F9F9]"}`}>
                    <p className={`text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"}`}>No active conversation yet</p>
                    <p className={`mt-2 text-sm ${isDark ? "text-white/45" : "text-black/50"}`}>
                      {bookingId ? "This shoot does not have a chat room yet." : "No chat rooms were returned for this view."}
                    </p>
                    {allowActivation && bookingId ? (
                      <Button
                        type="button"
                        onClick={activateChat}
                        disabled={activating}
                        className={`mt-4 transition-colors ${isDark ? "bg-[#E5D5B8] text-black hover:bg-[#d4c3a3]" : "bg-black text-white hover:bg-zinc-800"}`}
                      >
                        {activating ? "Activating..." : "Activate Chat Room"}
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  filteredRooms.map((room) => {
                    const roomId = getRoomId(room);
                    const isSelected = roomId === getRoomId(selectedRoom);
                    const previewText = getRoomPreviewText(room);
                    const previewSender = getRoomPreviewSender(room, userId);
                    const metaDate = room.updatedAt || room.createdAt || room.last_message?.createdAt;
                    const roomParticipantCount = getRoomParticipantCount(room);
                    const roomUnreadCount = Math.max(getRoomUnreadCount(room, userId), localUnreadCounts[roomId] || 0);
                    return (
                      <button
                        type="button"
                        key={roomId || `${room.chat_id}-${room.name}`}
                        onClick={() => loadRoomDetails(room)}
                        className={`w-full rounded-2xl lg:rounded-[28px] px-3 py-4 text-left transition-all ${isSelected
                          ? isDark ? "bg-[#202020]" : "bg-zinc-200/70 shadow-sm"
                          : roomUnreadCount > 0
                            ? isDark ? "bg-[#171717] ring-1 ring-[#E5D5B8]/18 hover:bg-white/[0.03]" : "bg-white ring-1 ring-black/5 shadow-sm hover:bg-zinc-50"
                            : isDark ? "bg-transparent hover:bg-white/[0.03]" : "bg-transparent hover:bg-zinc-100/50"
                          }`}
                      >
                        <div className="flex items-start gap-2 lg:gap-4">
                          <div className="relative flex h-11 w-11 lg:h-16 lg:w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#edf6dc] to-[#bcd8f0] text-sm lg:text-lg font-semibold text-[#222]">
                            {getInitials(room.name)}
                            {roomUnreadCount > 0 ? (
                              <span className={`absolute bottom-0 right-0 flex h-7 min-w-7 items-center justify-center rounded-full border-2 px-1 text-xs font-semibold ${isDark ? "border-[#171717] bg-[#E5D5B8] text-black" : "border-white bg-black text-white"}`}>
                                {Math.min(roomUnreadCount, 99)}
                              </span>
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className={`break-words pr-2 text-sm lg:text-base font-semibold leading-5 transition-colors ${isDark ? "text-white" : "text-black"}`}>
                                  {room.name || `Chat ${room.chat_id || ""}`}
                                </p>
                                <p className={`mt-2 truncate text-sm lg:text-base transition-colors ${roomUnreadCount > 0
                                  ? isDark ? "font-medium text-white/82" : "font-semibold text-black"
                                  : isDark ? "text-white/42" : "text-black/55"
                                  }`}>
                                  {previewSender ? `${previewSender}: ` : ""}
                                  {previewText}
                                </p>
                                <p className={`mt-2 truncate text-xs transition-colors ${isDark ? "text-white/28" : "text-black/40"}`}>
                                  {`${roomParticipantCount || 1} ${(roomParticipantCount || 1) === 1 ? "participant" : "participants"}`}
                                </p>
                              </div>
                              <div className={`flex shrink-0 flex-col items-end gap-2 pt-0.5 text-xs transition-colors ${isDark ? "text-white/32" : "text-black/40"}`}>
                                <div className="flex items-center gap-1.5">
                                  <Users className="h-3.5 w-3.5" />
                                  <span>{roomParticipantCount || 1}</span>
                                  <span>/</span>
                                  <span className={roomUnreadCount > 0 ? isDark ? "font-medium text-[#E5D5B8]" : "font-semibold text-black" : ""}>
                                    {formatConversationMeta(metaDate)} {formatDayLabel(metaDate)}
                                  </span>
                                </div>
                                {roomUnreadCount > 0 ? (
                                  <span className={`inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${isDark ? "bg-[#E5D5B8] text-black" : "bg-black text-white"}`}>
                                    {roomUnreadCount > 9 ? "9+" : roomUnreadCount}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <div className={`mt-3 flex items-center justify-between text-xs transition-colors ${isDark ? "text-white/24" : "text-black/35"}`}>
                              <span>#{room.chat_id || "room"}</span>
                              <span className="inline-flex items-center gap-1">
                                {getStatusIcon(room.status)}
                                {room.status || "active"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
              </div>
            ) : null}

            {/* THREAD CONTAINER SIDE (Responsive: hidden on mobile if no conversation is open) */}
            <div className={`w-full min-w-0 overflow-visible min-h-0 flex-1 flex-col ${selectedRoom || shouldUseDirectRoom ? "flex" : "hidden lg:flex"}`}>
              {/* Top Conversation Header Panel */}
              <div className={`w-full min-w-0 overflow-visible border-b p-4 lg:px-8 transition-colors ${isDark ? "border-white/10 bg-[#111111]" : "border-[#E5E5E5] bg-[#F4F5F7]"}`}>
                <div className="flex flex-col gap-2 w-full min-w-0 sm:flex-row sm:items-center sm:justify-between lg:gap-4">

                  {/* Left Section: Back Button, Room Icon, Info Text */}
                  <div className="flex items-center gap-2 min-w-0 flex-1 lg:gap-3">
                    {/* Mobile Back Chevron Navigation Trigger Button */}
                    {selectedRoom && !shouldUseDirectRoom ? (
                      <button
                        type="button"
                        onClick={() => {
                          // Clears room to fall back to rooms sidebar layout tracking on small viewports
                          if (typeof setSelectedRoom === "function") {
                            setSelectedRoom(null);
                          }
                        }}
                        className={`lg:hidden p-2 rounded-full border shrink-0 transition-colors ${isDark
                          ? "border-white/10 bg-[#161616] text-white/70 hover:bg-[#1d1d1d]"
                          : "border-[#E5E5E5] bg-white text-black/70 hover:bg-zinc-50"
                          }`}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                    ) : null}

                    <div className={`flex h-10 w-10 lg:h-12 lg:w-12 shrink-0 items-center justify-center rounded-full transition-colors ${isDark ? "bg-[#E5D5B8]/15 text-[#E5D5B8]" : "bg-zinc-100 text-black"}`}>
                      <Users className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className={`text-base lg:text-xl font-semibold transition-colors truncate break-all ${isDark ? "text-white" : "text-black"}`}>
                        {selectedRoomTitle}
                      </h3>
                      {selectedRoom ? (
                        <button
                          type="button"
                          onClick={() => {
                            setManageDefaultTab("current");
                            setIsManageOpen(true);
                          }}
                          className={`mt-0.5 inline-flex items-center gap-1 lg:gap-2 text-xs transition-colors max-w-full ${isDark ? "text-white/45 hover:text-white/75" : "text-black/55 hover:text-black"}`}
                        >
                          <Users className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{`${participantCount} ${participantCount === 1 ? "Participant" : "Participants"}`}</span>
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Right Section: Action Buttons */}
                  {selectedRoom ? (
                    <div className="flex items-center justify-start gap-2 shrink-0 w-full sm:w-auto sm:justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsThreadSearchOpen((current) => !current);
                        setIsHeaderMenuOpen(false);
                        if (isThreadSearchOpen) {
                          setThreadSearch("");
                        }
                      }}
                      className={`rounded-full border p-3 shrink-0 transition-colors ${isThreadSearchOpen
                        ? isDark ? "bg-[#E5D5B8] text-black border-transparent" : "bg-black text-white border-transparent"
                        : isDark ? "border-white/10 bg-[#161616] text-white/60 hover:bg-[#1d1d1d]" : "border-[#E5E5E5] bg-white text-black/60 hover:bg-zinc-50"
                        }`}
                    >
                      <Search className="h-4 w-4" />
                    </button>

                    <div className="relative" ref={headerMenuRef}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsHeaderMenuOpen((current) => !current);
                          setShowReactionPickerId(null);
                          setOpenMessageMenuId(null);
                        }}
                        className={`rounded-full border p-3 shrink-0 transition-colors ${isHeaderMenuOpen
                          ? isDark ? "bg-[#E5D5B8] text-black border-transparent" : "bg-black text-white border-transparent"
                          : isDark ? "border-white/10 bg-[#161616] text-white/60 hover:bg-[#1d1d1d]" : "border-[#E5E5E5] bg-white text-black/60 hover:bg-zinc-50"
                          }`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {isHeaderMenuOpen ? (
                        <div className={`absolute left-0 top-[calc(100%+10px)] z-[50] min-w-[200px] md:min-w-[220px] rounded-2xl border p-2 shadow-2xl transition-colors ${isDark ? "border-white/10 bg-[#171717]" : "border-[#E5E5E5] bg-[#F4F5F7]"}`}>
                          <button
                            type="button"
                            onClick={async () => {
                              setIsHeaderMenuOpen(false);
                              if (selectedRoom) {
                                await loadRoomDetails(selectedRoom);
                              }
                              await refreshRoomListSnapshot();
                            }}
                            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${isDark ? "text-white/80 hover:bg-white/5" : "text-black/80 hover:bg-zinc-50"}`}
                          >
                            <RefreshCw className="h-4 w-4 shrink-0" />
                            <span className="truncate">Refresh conversation</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsHeaderMenuOpen(false);
                              setManageDefaultTab("current");
                              setIsManageOpen(true);
                            }}
                            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${isDark ? "text-white/80 hover:bg-white/5" : "text-black/80 hover:bg-zinc-50"}`}
                          >
                            <Users className="h-4 w-4 shrink-0" />
                            <span className="truncate">View participants</span>
                          </button>
                          {isAdminView ? (
                            <button
                              type="button"
                              onClick={() => {
                                setIsHeaderMenuOpen(false);
                                setManageDefaultTab("add");
                                setIsManageOpen(true);
                              }}
                              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors shrink-0 text-nowrap ${isDark ? "text-white/80 hover:bg-white/5" : "text-black/80 hover:bg-zinc-50"}`}>
                              <UserPlus className="h-4 w-4 shrink-0" />
                              <span className="truncate">Add participant</span>
                            </button>
                          ) : null}
                          {isThreadSearchOpen || threadSearch ? (
                            <button
                              type="button"
                              onClick={() => {
                                setIsHeaderMenuOpen(false);
                                setIsThreadSearchOpen(false);
                                setThreadSearch("");
                              }}
                              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${isDark ? "text-white/80 hover:bg-white/5" : "text-black/80 hover:bg-zinc-50"}`}
                            >
                              <X className="h-4 w-4 shrink-0" />
                              <span className="truncate">Clear search</span>
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    {isAdminView ? (
                      <button
                        type="button"
                        onClick={() => {
                          setManageDefaultTab("add");
                          setIsManageOpen(true);
                        }}
                        className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-xs lg:text-sm font-semibold transition-colors ${isDark ? "bg-[#E5D5B8] text-black hover:bg-[#d8c49e]" : "bg-black text-white hover:bg-zinc-800"}`}
                      >
                        <UserPlus className="h-4 w-4 shrink-0" />
                        <span>Add Participant</span>
                      </button>
                    ) : null}
                    </div>
                  ) : null}
                </div>

                {/* Thread Inline Filter Input Bar */}
                {selectedRoom && isThreadSearchOpen ? (
                  <div className={`mt-4 flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${isDark ? "border-white/10 bg-[#151515]" : "border-[#E5E5E5] bg-zinc-50"}`}>
                    <Search className={`h-4 w-4 ${isDark ? "text-white/45" : "text-black/40"}`} />
                    <input
                      value={threadSearch}
                      onChange={(event) => setThreadSearch(event.target.value)}
                      placeholder="Search in this conversation"
                      className={`w-full bg-transparent text-sm outline-none transition-colors ${isDark ? "text-white placeholder:text-white/35" : "text-black placeholder:text-black/40"}`}
                    />
                    {threadSearch ? (
                      <button
                        type="button"
                        onClick={() => setThreadSearch("")}
                        className={`rounded-full p-1 transition-colors ${isDark ? "text-white/45 hover:bg-white/5 hover:text-white" : "text-black/45 hover:bg-zinc-200 hover:text-black"}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {/* PART 2: MAIN VIEWPORT CHAT BODY AREA */}
              <div className="relative min-h-40 lg:min-h-0 flex-1">
                <div
                  ref={messageViewportRef}
                  onScroll={updateScrollIntent}
                  className={`min-h-0 h-full overflow-y-auto px-5 py-6 lg:px-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${isDark ? "bg-[#0f0f0f]" : "bg-zinc-50"}`}
                >
                  {isDirectRoomLoading ? (
                    <div className="flex h-full min-h-[260px] items-center justify-center">
                      <div className={`flex flex-col items-center gap-3 rounded-3xl border px-8 py-7 ${isDark ? "border-white/10 bg-[#151515]" : "border-zinc-200 bg-white"}`}>
                        <Loader2 className="h-8 w-8 animate-spin text-[#BFA780]" />
                        <p className={`text-sm font-medium ${isDark ? "text-white/60" : "text-zinc-500"}`}>
                          Loading project chat...
                        </p>
                      </div>
                    </div>
                  ) : loadingRoomData ? (
                    <div className="flex h-full min-h-[260px] items-center justify-center">
                      <div className={`flex flex-col items-center gap-3 rounded-3xl border px-8 py-7 ${isDark ? "border-white/10 bg-[#151515]" : "border-zinc-200 bg-white"}`}>
                        <Loader2 className="h-8 w-8 animate-spin text-[#BFA780]" />
                        <p className={`text-sm font-medium ${isDark ? "text-white/60" : "text-zinc-500"}`}>
                          Loading messages...
                        </p>
                      </div>
                    </div>
                  ) : !selectedRoom ? (
                    <div className="flex h-full items-center justify-center">
                      <div className={`mx-auto flex max-w-md flex-col items-center rounded-4xl border px-8 py-12 text-center shadow-[0_25px_60px_rgba(0,0,0,0.28)] ${isDark
                        ? "border-[#E5D5B8]/12 bg-[linear-gradient(180deg,rgba(27,24,21,0.92),rgba(16,15,13,0.96))]"
                        : "border-zinc-200 bg-white"
                        }`}>
                        <div className={`mb-6 flex h-20 w-20 items-center justify-center rounded-[26px] ${isDark
                          ? "bg-[linear-gradient(135deg,rgba(229,213,184,0.18),rgba(188,216,240,0.14))] text-[#E5D5B8]"
                          : "bg-zinc-100 text-zinc-900"
                          }`}>
                          <MessageCircle className="h-9 w-9" />
                        </div>
                        <h4 className={`text-lg lg:text-2xl font-semibold tracking-tight ${isDark ? "text-white" : "text-zinc-900"}`}>
                          {accessRevokedNotice
                            ? "Conversation unavailable"
                            : shouldUseDirectRoom
                              ? "No chat room yet"
                              : "Select a conversation"}
                        </h4>
                        <p className={`mt-3 text-xs lg:text-sm leading-6 ${isDark ? "text-white/52" : "text-zinc-500"}`}>
                          {accessRevokedNotice ||
                            (shouldUseDirectRoom
                              ? "Create the project chat room to start messaging for this shoot."
                              : "Choose a conversation from the left side to open the thread and continue the chat from here.")}
                        </p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <EmptyChatState isDark={isDark} />
                  ) : visibleMessages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <div className={`rounded-[30px] border px-8 py-10 text-center ${isDark ? "border-white/10 bg-[#171411]" : "border-zinc-200 bg-zinc-50"}`}>
                        <div className={`mx-auto mb-4 flex h-12 w-12 lg:h-16 lg:w-16 items-center justify-center rounded-2xl lg:rounded-[20px] ${isDark ? "bg-[#E5D5B8]/12 text-[#E5D5B8]" : "bg-zinc-200 text-zinc-700"}`}>
                          <Search className="h-5 w-5 lg:h-7 lg:w-7" />
                        </div>
                        <p className={`text-sm ${isDark ? "text-white/45" : "text-zinc-500"}`}>No messages matched your search.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 lg:space-y-5 w-full min-w-0 overflow-x-hidden">
                      <div className="flex items-center gap-3 w-full">
                        <div className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-zinc-200"}`} />
                        <span className={`rounded-xl px-3 py-1 text-xs font-medium shrink-0 ${isDark ? "bg-[#E5D5B8] text-black" : "bg-black text-white"}`}>
                          {formatDayLabel(latestDate)}
                        </span>
                        <div className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-zinc-200"}`} />
                      </div>

                      {visibleMessages.map((message) => {
                        const messageId = getMessageId(message);
                        const sender = normalizeUser(message.sent_by);
                        const senderRole = resolveParticipantRole({
                          sender,
                          participantList,
                          participantRoleMap,
                        });
                        const isSystem = message.message_type === "system";
                        const isOwn = sender?.id && userId ? String(sender.id) === userId : false;
                        const isEditing = editingMessageId === messageId;
                        const groupedReactions = Object.values(
                          (message.reactions || []).reduce(
                            (acc, reaction) => {
                              const emoji = reaction.emoji || "";
                              if (!emoji) return acc;
                              if (!acc[emoji]) {
                                acc[emoji] = { emoji, count: 0, users: [] as string[], reactedByCurrentUser: false };
                              }
                              acc[emoji].count += 1;
                              acc[emoji].users.push(reaction.user_name || "User");
                              if (userId && reaction.user_id != null && String(reaction.user_id) === userId) {
                                acc[emoji].reactedByCurrentUser = true;
                              }
                              return acc;
                            },
                            {} as Record<string, { emoji: string; count: number; users: string[]; reactedByCurrentUser: boolean }>
                          )
                        );

                        if (isSystem) {
                          return (
                            <React.Fragment key={message.id || message._id || `${message.createdAt}-${message.message}`}>
                              {unreadBoundaryMessageId === messageId ? (
                                <div ref={unreadMarkerRef} className="flex items-center gap-2 lg:gap-3 py-1 w-full">
                                  <div className={`h-px flex-1 ${isDark ? "bg-[#E5D5B8]/25" : "bg-zinc-300"}`} />
                                  <span className={`rounded-full border px-2 lg:px-3 py-1 text-xs font-semibold shrink-0 ${isDark
                                    ? "border-[#E5D5B8]/20 bg-[#E5D5B8]/12 text-[#E5D5B8]"
                                    : "border-zinc-300 bg-zinc-100 text-zinc-800"
                                    }`}>
                                    {activeThreadUnreadCount} unread {activeThreadUnreadCount === 1 ? "message" : "messages"}
                                  </span>
                                  <div className={`h-px flex-1 ${isDark ? "bg-[#E5D5B8]/25" : "bg-zinc-300"}`} />
                                </div>
                              ) : null}
                              <div className="flex justify-center w-full px-4">
                                <span className={`rounded-full border px-3 py-1.5 text-center text-xs italic max-w-full break-words ${isDark ? "border-white/10 bg-white/5 text-white/35" : "border-zinc-200 bg-zinc-100 text-zinc-500"}`}>
                                  {getMessageText(message)}
                                </span>
                              </div>
                            </React.Fragment>
                          );
                        }

                        return (
                          <React.Fragment key={messageId || `${message.createdAt}-${message.message}`}>
                            {unreadBoundaryMessageId === messageId ? (
                              <div ref={unreadMarkerRef} className="flex items-center gap-2 lg:gap-3 py-1 w-full">
                                <div className={`h-px flex-1 ${isDark ? "bg-[#E5D5B8]/25" : "bg-zinc-300"}`} />
                                <span className={`rounded-full border px-3 py-1 text-xs font-semibold shrink-0 ${isDark
                                  ? "border-[#E5D5B8]/20 bg-[#E5D5B8]/12 text-[#E5D5B8]"
                                  : "border-zinc-300 bg-zinc-100 text-zinc-800"
                                  }`}>
                                  {activeThreadUnreadCount} unread {activeThreadUnreadCount === 1 ? "message" : "messages"}
                                </span>
                                <div className={`h-px flex-1 ${isDark ? "bg-[#E5D5B8]/25" : "bg-zinc-300"}`} />
                              </div>
                            ) : null}

                            <div className={`group flex items-end gap-2 lg:gap-3 w-full min-w-0 ${isOwn ? "justify-end" : "justify-start"}`}>
                              {!isOwn ? (
                                <div className={`flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isDark ? "bg-[#E5D5B8]/20 text-[#E5D5B8]" : "bg-zinc-100 text-zinc-800"}`}>
                                  {getInitials(sender?.name)}
                                </div>
                              ) : null}

                              <div className={`max-w-[85%] lg:max-w-[78%] min-w-0 ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                                <div className="relative max-w-full flex flex-col">

                                  {/* Message Action Area - Fully Mobile Safeguarded */}
                                  <div
                                    data-message-action-area="true"
                                    className={`z-10 flex items-center gap-1.5 transition p-1 mb-1 lg:mb-0 relative opacity-100 justify-end w-full lg:absolute lg:top-1/2 lg:-translate-y-1/2 lg:w-auto lg:p-0 ${openMessageMenuId === messageId ? "lg:opacity-100" : "lg:opacity-0 lg:group-hover:opacity-100"} ${isOwn ? "lg:left-0 lg:-translate-x-[calc(100%+12px)]" : "lg:right-0 lg:translate-x-[calc(100%+12px)]"}`}
                                  >
                                    <div className="relative">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowReactionPickerId((current) => (current === messageId ? null : messageId));
                                          setOpenMessageMenuId(null);
                                        }}
                                        className={`rounded-full border p-2 transition ${isDark
                                          ? "border-white/10 bg-[#151515] text-white/65 hover:bg-[#202020] hover:text-white"
                                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                                          }`}
                                      >
                                        <Smile className="h-4 w-4" />
                                      </button>
                                      {showReactionPickerId === messageId ? (
                                        <div
                                          className={`absolute bottom-[calc(100%+6px)] z-20 flex items-center gap-1 rounded-full border px-2 py-1 shadow-2xl transition-colors max-w-[90vw] sm:max-w-none ${isDark ? "border-white/10 bg-[#151515]" : "border-zinc-200 bg-white"} left-1/2 -translate-x-1/2 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:left-auto lg:translate-x-0 ${isOwn ? "lg:right-[calc(100%+8px)]" : "lg:left-[calc(100%+8px)]"}`}
                                        >
                                          {QUICK_REACTIONS.map((emoji) => (
                                            <button
                                              key={`${messageId}-picker-${emoji}`}
                                              type="button"
                                              onClick={() => handleReaction(message, emoji)}
                                              className="rounded-full px-1.5 text-base lg:text-lg transition-transform active:scale-125 hover:lg:scale-110"
                                            >
                                              {emoji}
                                            </button>
                                          ))}
                                        </div>
                                      ) : null}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReplyTarget(message);
                                        setOpenMessageMenuId(null);
                                        setShowReactionPickerId(null);
                                      }}
                                      className={`rounded-full border p-1.5 lg:p-2 transition ${isDark
                                        ? "border-white/10 bg-[#151515] text-white/65 hover:bg-[#202020] hover:text-white"
                                        : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                                        }`}
                                    >
                                      <Reply className="h-4 w-4" />
                                    </button>
                                    {isOwn ? (
                                      <div className="relative">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenMessageMenuId((current) => (current === messageId ? null : messageId));
                                            setShowReactionPickerId(null);
                                          }}
                                          className={`rounded-full border p-1.5 lg:p-2 transition ${isDark
                                            ? "border-white/10 bg-[#151515] text-white/65 hover:bg-[#202020] hover:text-white"
                                            : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                                            }`}
                                        >
                                          <MoreVertical className="h-4 w-4" />
                                        </button>
                                        {openMessageMenuId === messageId ? (
                                          <div className={`absolute bottom-[calc(100%+6px)] lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 z-20 min-w-[130px] lg:min-w-[150px] rounded-2xl border p-1.5 lg:p-2 shadow-2xl right-0 lg:right-[calc(100%+8px)] ${isDark ? "border-white/10 bg-[#171717]" : "border-zinc-200 bg-white"}`}>
                                            <button
                                              type="button"
                                              onClick={() => startEditingMessage(message)}
                                              className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 lg:px-3 lg:py-2 text-xs lg:text-sm transition ${isDark ? "text-white/80 hover:bg-white/5" : "text-zinc-700 hover:bg-zinc-50"}`}
                                            >
                                              <Pencil className="h-4 w-4" />
                                              Edit
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setMessagePendingDelete(message);
                                                setOpenMessageMenuId(null);
                                              }}
                                              className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 lg:px-3 lg:py-2 text-xs lg:text-sm transition ${isDark ? "text-[#ff7d7d] hover:bg-white/5" : "text-red-600 hover:bg-red-50"}`}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                              Delete
                                            </button>
                                          </div>
                                        ) : null}
                                      </div>
                                    ) : null}
                                  </div>

                                  {/* Message Bubble Body */}
                                  <div className={`rounded-3xl px-3.5 py-2.5 lg:px-4 lg:py-3 w-full max-w-full min-w-0 ${isOwn
                                    ? `rounded-br-md ${isDark ? "bg-[#1D1D1D] text-white" : "bg-zinc-100 text-zinc-900"}`
                                    : `rounded-bl-md ${isDark ? "bg-[#191919] text-white" : "bg-white border border-zinc-200 text-zinc-900"}`
                                    }`}>
                                    <div className="mb-1 flex flex-wrap items-center gap-1.5 lg:gap-2">
                                      <p className={`text-[10px] uppercase tracking-[0.12em] font-medium truncate max-w-[120px] lg:max-w-none ${isDark ? "text-white/35" : "text-zinc-400"}`}>
                                        {sender?.name || "Participant"}
                                      </p>
                                      <span className={`rounded-full border px-2 py-0.5 text-[10px] ${isDark ? "border-white/10 bg-white/5 text-white/45" : "border-zinc-200 bg-zinc-50 text-zinc-600"}`}>
                                        {getRoleLabel(senderRole)}
                                      </span>
                                      {message.is_edited ? (
                                        <span className={`text-[10px] ${isDark ? "text-white/30" : "text-zinc-400"}`}>(edited)</span>
                                      ) : null}
                                    </div>

                                    {typeof message.reply_to === "object" && message.reply_to ? (
                                      <div className={`mb-3 rounded-2xl border px-3 py-2 text-xs ${isDark ? "border-white/10 bg-black/15 text-white/55" : "border-zinc-200 bg-zinc-50 text-zinc-600"}`}>
                                        <p className={`mb-1 truncate font-medium ${isDark ? "text-white/75" : "text-zinc-900"}`}>
                                          {normalizeUser(message.reply_to.sent_by)?.name || "Reply"}
                                        </p>
                                        <p className="truncate">{getMessageText(message.reply_to)}</p>
                                      </div>
                                    ) : null}

                                    {isEditing ? (
                                      <div className="space-y-2 w-full min-w-0">
                                        <textarea
                                          value={editingText}
                                          onChange={(e) => setEditingText(e.target.value)}
                                          rows={3}
                                          className={`w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none focus:ring-0 ${isDark
                                            ? "border-white/10 bg-black/10 text-white focus:border-[#E5D5B8]/40"
                                            : "border-zinc-200 bg-white text-zinc-900 focus:border-black"
                                            }`}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                              e.preventDefault();
                                              submitEditMessage();
                                            }
                                          }}
                                        />
                                        <div className="flex justify-end gap-2">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingMessageId(null);
                                              setEditingText("");
                                            }}
                                            className={`rounded-full border px-3 py-1 text-xs transition ${isDark ? "border-white/10 text-white/70" : "border-zinc-200 text-zinc-600"}`}
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            type="button"
                                            onClick={submitEditMessage}
                                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${isDark ? "bg-[#E5D5B8] text-black" : "bg-black text-white"}`}
                                          >
                                            Save
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className={`whitespace-pre-wrap text-sm leading-6 break-words max-w-full ${isDark ? "text-white/85" : "text-zinc-800"}`}>
                                        {getMessageText(message)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {groupedReactions.length > 0 ? (
                                  <div className="mt-2 flex flex-wrap gap-2 max-w-full">
                                    {groupedReactions.map((reaction) => (
                                      <div key={`${messageId}-${reaction.emoji}`} className="relative" data-reaction-details="true">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setOpenReactionDetails((current) =>
                                              current?.messageId === messageId && current?.emoji === reaction.emoji
                                                ? null
                                                : { messageId, emoji: reaction.emoji }
                                            )
                                          }
                                          className={`rounded-full border px-2.5 py-1 text-xs transition ${reaction.reactedByCurrentUser
                                            ? isDark
                                              ? "border-[#E5D5B8]/40 bg-[#E5D5B8]/12 text-[#E5D5B8]"
                                              : "border-black bg-zinc-100 text-black"
                                            : isDark
                                              ? "border-white/10 bg-[#171717] text-white/75"
                                              : "border-zinc-200 bg-white text-zinc-700"
                                            }`}
                                          title={reaction.users.join(", ")}
                                        >
                                          {reaction.emoji} {reaction.count}
                                        </button>
                                        {openReactionDetails?.messageId === messageId && openReactionDetails?.emoji === reaction.emoji ? (
                                          <div className={`absolute z-20 mt-2 min-w-[150px] sm:min-w-[180px] rounded-2xl border p-3 shadow-2xl ${isOwn ? "right-0" : "left-0"} ${isDark ? "border-white/10 bg-[#171717]" : "border-zinc-200 bg-white"}`}>
                                            <p className={`mb-2 text-xs font-semibold ${isDark ? "text-white/85" : "text-zinc-900"}`}>
                                              {reaction.emoji} Reactions
                                            </p>
                                            <div className="space-y-1 max-h-[100px] overflow-y-auto no-scrollbar">
                                              {reaction.users.map((name, index) => (
                                                <p key={`${reaction.emoji}-${name}-${index}`} className={`text-xs ${isDark ? "text-white/65" : "text-zinc-600"}`}>
                                                  {name}
                                                </p>
                                              ))}
                                            </div>
                                          </div>
                                        ) : null}
                                      </div>
                                    ))}
                                  </div>
                                ) : null}

                                <span className={`mt-1 text-[9px] tracking-wide shrink-0 ${isDark ? "text-white/30" : "text-zinc-400"}`}>
                                  {formatTime(message.createdAt)} {formatDate(message.createdAt)}
                                </span>
                              </div>

                              {isOwn ? (
                                <div className={`flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isDark ? "bg-[#E5D5B8]/20 text-[#E5D5B8]" : "bg-black text-white"}`}>
                                  {getInitials(sender?.name || effectiveUser?.name)}
                                </div>
                              ) : null}
                            </div>
                          </React.Fragment>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* PART 3: ACTION FLOATING TOASTS & DRAFT COMPOSER AREA */}
                {hasUnreadMarker && !isNearBottom ? (
                  <button
                    type="button"
                    onClick={() => {
                      shouldStickToBottomRef.current = true;
                      setIsNearBottom(true);
                      setActiveThreadUnreadCount(0);
                      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
                    }}
                    className={`absolute bottom-5 right-5 rounded-full px-4 py-2 text-xs font-semibold shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition border ${isDark
                      ? "border-[#E5D5B8]/20 bg-[#E5D5B8] text-black hover:bg-[#d8c49e]"
                      : "border-zinc-200 bg-black text-white hover:bg-zinc-800"
                      }`}
                  >
                    {activeThreadUnreadCount} new {activeThreadUnreadCount === 1 ? "message" : "messages"}
                  </button>
                ) : null}
              </div>

              {selectedRoom ? (
                <div className={`relative border-t p-4 lg:px-8 ${isDark ? "bg-[#111111] border-white/10" : "bg-white border-[#E5E5E5]"}`}>
                {replyTarget ? (
                  <div className={`mb-1 lg:mb-3 flex items-center justify-between rounded-xl lg:rounded-2xl border p-3 lg:px-4 lg:py-3 transition-colors ${isDark ? "border-white/10 bg-[#151515]" : "border-[#E5E5E5] bg-zinc-50"}`}>
                    <div className="min-w-0">
                      <p className={`text-[10px] lg:text-xs uppercase tracking-[0.14em] font-semibold ${isDark ? "text-[#E5D5B8]" : "text-zinc-600"}`}>
                        Replying To
                      </p>
                      <p className={`mt-0.5 lg:mt-1 truncate text-sm ${isDark ? "text-white/80" : "text-black/80"}`}>
                        {getMessageText(replyTarget)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyTarget(null)}
                      className={`text-sm transition-colors ${isDark ? "text-white/45 hover:text-white" : "text-black/55 hover:text-black"}`}
                    >
                      Clear
                    </button>
                  </div>
                ) : null}

                {showComposerEmojis ? (
                  <div
                    ref={composerEmojiRef}
                    className={`absolute bottom-[calc(100%+12px)] z-30 w-[320px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border shadow-2xl transition-colors left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-8 ${isDark ? "border-white/10 bg-[#111111]" : "border-[#E5E5E5] bg-white"}`}
                  >
                    <EmojiPicker
                      onEmojiClick={handleComposerEmojiClick}
                      theme={isDark ? Theme.DARK : Theme.LIGHT}
                      width="100%"
                      height={pickerHeight} // Dynamic responsive state injection
                      searchPlaceholder="Search emojis..."
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                ) : null}

                <div className={`flex items-center gap-2 lg:gap-3 rounded-2xl lg:rounded-[24px] border p-3 transition-colors ${isDark ? "border-white/10 bg-[#151515]" : "border-[#E5E5E5] bg-zinc-50"}`}>
                  {/* Attachment support is not ready yet, so hide the button for now */}
                  {/* File input hidden */}
<input
  ref={fileInputRef}
  type="file"
  className="hidden"
  onChange={handleFileUpload}
  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xlsx,.xls,.pptx,.zip,.rar"
  multiple
/>

{/* Paperclip button */}
<button
  type="button"
  onClick={() => {
    if (!selectedRoom) {
      toast.error("Please select a room first");
      return;
    }
    fileInputRef.current?.click();
  }}
  disabled={uploadingFile || !selectedRoom}
  className={`transition ${
    isDark
      ? "text-white/45 hover:text-white disabled:opacity-30"
      : "text-black/45 hover:text-black disabled:opacity-30"
  }`}
>
  {uploadingFile
    ? <Loader2 className="h-5 w-5 animate-spin" />
    : <Paperclip className="h-5 w-5" />
  }
</button>
                  <textarea
                    value={draftMessage}
                    onChange={(e) => setDraftMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={!selectedRoom || sending}
                    placeholder={selectedRoom ? "Message" : "Select a room to start messaging"}
                    rows={1}
                    className={`max-h-32 min-h-6 flex-1 resize-none border-0 bg-transparent py-1 outline-none transition-colors text-sm lg:text-base ${isDark ? "text-white placeholder:text-white/35" : "text-black placeholder:text-black/40"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowComposerEmojis((current) => !current)}
                    className={`transition-colors ${isDark ? "text-white/45 hover:text-white" : "text-black/45 hover:text-black"}`}
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!selectedRoom || !draftMessage.trim() || sending}
                    className={`flex h-9 w-9 lg:h-11 lg:w-11 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-50 ${isDark ? "bg-[#E5D5B8] text-black hover:bg-[#d8c49e]" : "bg-black text-white hover:bg-zinc-800"}`}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {isAdminView && !bookingId ? (
        <ConversationComposerModal
          isOpen={isComposerOpen}
          onClose={() => setIsComposerOpen(false)}
          onCreated={async (room) => {
            setIsComposerOpen(false);
            await loadRooms();
            if (room) {
              await loadRoomDetails(room);
            }
          }}
          isDark={isDark}
        />
      ) : null}

      {selectedRoom ? (
        <ManageParticipantsModal
          isOpen={isManageOpen}
          onClose={() => setIsManageOpen(false)}
          roomId={getRoomId(selectedRoom)}
          roomSnapshot={selectedRoom}
          existingParticipantIds={memberIds}
          defaultTab={manageDefaultTab}
          canManage={isAdminView}
          currentUserId={userId}
          onAdded={async () => {
            await loadRoomDetails(selectedRoom);
            await refreshRoomListSnapshot();
          }}
          isDark={isDark}
        />
      ) : null}

      {messagePendingDelete ? (
        <div className={`fixed inset-0 z-[80] flex items-center justify-center  px-4 backdrop-blur-sm ${isDark ? "bg-black/60" : "bg-white/80"}`}>
          <div
            className={`w-full max-w-sm rounded-[28px] border p-4 lg:p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)] transition-colors duration-200 ${isDark ? "border-white/10 bg-[#121212]" : "border-zinc-200 bg-white"}`}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#ff7d7d]/10 text-[#ff7d7d]">
              <Trash2 className="h-5 w-5" />
            </div>

            {/* Header Title */}
            <h3 className={`text-base lg:text-lg font-semibold transition-colors duration-200 ${isDark ? "text-white" : "text-zinc-900"}`}>
              Delete message?
            </h3>

            {/* Description Warning Message */}
            <p className={`mt-1.5 lg:mt-2 text-xs lg:text-sm leading-5 lg:leading-6 transition-colors duration-200 ${isDark ? "text-white/55" : "text-zinc-500"}`}>
              This will remove the message for everyone in this chat. You can&apos;t undo it later.
            </p>

            {/* Control Action Buttons */}
            <div className="mt-5 lg:mt-6 flex justify-end gap-2.5 lg:gap-3">
              <button
                type="button"
                onClick={() => setMessagePendingDelete(null)}
                className={`rounded-full border px-4 py-2 text-xs lg:text-sm font-medium transition-all duration-150 active:scale-95${isDark ? "border-white/10 text-white/70 hover:bg-white/5" : "border-zinc-200 text-black/80 hover:bg-zinc-50"}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMessage(messagePendingDelete)}
                className="rounded-full bg-[#ff7d7d] px-4 py-2 text-xs lg:text-sm font-semibold text-white transition-all duration-150 hover:bg-[#ff6a6a]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
