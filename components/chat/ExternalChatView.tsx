"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const pollRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messageViewportRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const composerEmojiRef = useRef<HTMLDivElement | null>(null);
  const headerMenuRef = useRef<HTMLDivElement | null>(null);
  const roomActivityRef = useRef<Record<string, string>>({});
  const messagesRef = useRef<ExternalChatMessage[]>([]);
  const roomsRef = useRef<ExternalChatRoom[]>([]);
  const selectedRoomRef = useRef<ExternalChatRoom | null>(null);
  const roomLastSeenAtRef = useRef<Record<string, string>>({});

  const effectiveUser = useMemo(() => ({ ...(storedUser || {}), ...(user || {}) }), [storedUser, user]);
  const userId = effectiveUser?.id != null ? String(effectiveUser.id) : null;
  const isAdminView = role === "admin";
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

  const filteredRooms = useMemo(() => {
    const scopedRooms = rooms.filter((room) => roomMatchesRoleUser(room, effectiveUser, role));

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
  }, [rooms, role, search, roomSortOrder, effectiveUser]);

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
      setIsNearBottom(true);
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
      if (!options?.preserveRoomUnread && (!options?.silent || shouldStickToBottomRef.current)) {
        const latestSeenTimestamp = getLatestSeenTimestamp(sortedMessages);
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
        setSelectedRoom(null);
        selectedRoomRef.current = null;
        setMessages([]);
        setParticipants({});
        setActiveThreadUnreadCount(0);
        setIsNearBottom(true);
      } else {
        const roomList = await externalChatApi.listRooms({ page: 1, limit: 100, sortBy: "updatedAt:desc" });
        const hydratedRooms = await hydrateRoomPreviews(roomList);
        hydratedRooms.forEach((item) => {
          roomActivityRef.current[getRoomId(item)] = getRoomActivityTimestamp(item);
        });
        setRooms(hydratedRooms);
        setSelectedRoom(null);
        selectedRoomRef.current = null;
        setMessages([]);
        setParticipants({});
        setActiveThreadUnreadCount(0);
        setIsNearBottom(true);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load chat rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedState = readUnreadStorage(userId);
    roomLastSeenAtRef.current = storedState.roomLastSeenAt;
    setLocalUnreadCounts(storedState.localUnreadCounts);
  }, [userId]);

  useEffect(() => {
    loadRooms();
  }, [bookingId]);

  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  useEffect(() => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (isManageOpen || isComposerOpen) {
      return undefined;
    }

    pollRef.current = window.setInterval(() => {
      const activeRoom = selectedRoomRef.current;
      refreshRoomListSnapshot().catch(() => undefined);
      if (getRoomId(activeRoom)) {
        loadRoomDetails(activeRoom, { silent: true });
      }
    }, 4000);

    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [selectedRoom, bookingId, userId, isManageOpen, isComposerOpen]);

  useEffect(() => {
    if (!shouldStickToBottomRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [messages, selectedRoom?.id, selectedRoom?._id]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    setThreadSearch("");
    setIsThreadSearchOpen(false);
    setIsHeaderMenuOpen(false);
  }, [selectedRoom?.id, selectedRoom?._id]);

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
        setMessages((current) => sortMessagesAsc([...current, sent]));
      }
      await loadRoomDetails(selectedRoom, { silent: true });
    } catch (err: any) {
      toast.error(err?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleReaction = async (message: ExternalChatMessage, emoji: string) => {
    const messageId = getMessageId(message);
    if (!messageId) return;

    try {
      await externalChatApi.reactToMessage(messageId, emoji, currentSender);
      setShowReactionPickerId(null);
      await loadRoomDetails(selectedRoom, { silent: true });
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
    if (!editingMessageId || !editingText.trim()) return;

    try {
      await externalChatApi.editMessage(editingMessageId, editingText.trim(), currentSender);
      setEditingMessageId(null);
      setEditingText("");
      await loadRoomDetails(selectedRoom, { silent: true });
    } catch (err: any) {
      toast.error(err?.message || "Failed to edit message");
    }
  };

  const handleDeleteMessage = async (message: ExternalChatMessage) => {
    const messageId = getMessageId(message);
    if (!messageId) return;

    try {
      const updated = await externalChatApi.deleteMessage(messageId, currentSender);
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
      await loadRoomDetails(selectedRoom, { silent: true });
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

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <h2 className="text-2xl font-semibold text-white">{heading}</h2>
            <p className="mt-1 text-sm text-white/55">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setRoomSortOrder((current) => (current === "latest" ? "oldest" : "latest"))}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#111] px-4 py-3 text-sm text-white/70 transition hover:bg-white/5"
            >
              <CalendarDays className="h-4 w-4" />
              {roomSortOrder === "latest" ? "Latest First" : "Oldest First"}
            </button>
            {isAdminView && !bookingId ? (
              <button
                type="button"
                onClick={() => setIsComposerOpen(true)}
                className="rounded-2xl bg-[#E5D5B8] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#d8c49e]"
              >
                Create Messages
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,#181818,transparent_35%),#0b0b0b] shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
          <div className="grid min-h-0 flex-1 lg:grid-cols-[420px_minmax(0,1fr)]">
            <div className="flex min-h-0 flex-col border-b border-white/10 bg-[#171717] lg:border-b-0 lg:border-r">
              <div className="border-b border-white/5 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold text-white">Messages</h3>
                    <p className="mt-1 text-xs text-white/35">Browse all conversations in one place.</p>
                  </div>
                  <Button
                    type="button"
                    onClick={loadRooms}
                    variant="outline"
                    className="h-11 w-11 rounded-full border-white/10 bg-[#202020] p-0 text-white/70 hover:bg-[#262626]"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search Conversation"
                      className="h-14 rounded-full border-0 bg-[#202020] pl-12 pr-4 text-[15px] text-white placeholder:text-white/40"
                    />
                  </div>
                  {isAdminView && !bookingId ? (
                    <button
                      type="button"
                      onClick={() => setIsComposerOpen(true)}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E5D5B8] text-black transition hover:bg-[#d8c49e]"
                    >
                      <span className="text-[34px] font-light leading-none">+</span>
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {loading ? (
                  <div className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 border-[#3D3D3D] bg-[#171717]" 
                      }`}>
                    <Loader2 className={`animate-spin text-[#BFA780]`} size={40} />
                  </div>             
                   ) : filteredRooms.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-[#111] p-5">
                  <p className="text-base font-medium text-white">No active conversation yet</p>
                  <p className="mt-2 text-sm text-white/45">
                    {bookingId ? "This shoot does not have a chat room yet." : "No chat rooms were returned for this view."}
                  </p>
                  {allowActivation && bookingId ? (
                    <Button
                      type="button"
                      onClick={activateChat}
                      disabled={activating}
                      className="mt-4 bg-[#E5D5B8] text-black hover:bg-[#d4c3a3]"
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
                      className={`w-full rounded-[28px] px-3 py-4 text-left transition ${
                        isSelected
                          ? "bg-[#202020]"
                          : roomUnreadCount > 0
                            ? "bg-[#171717] ring-1 ring-[#E5D5B8]/18 hover:bg-white/[0.03]"
                            : "bg-transparent hover:bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#edf6dc] to-[#bcd8f0] text-lg font-semibold text-[#222]">
                          {getInitials(room.name)}
                          {roomUnreadCount > 0 ? (
                            <span className="absolute bottom-0 right-0 flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-[#171717] bg-[#E5D5B8] px-1 text-xs font-semibold text-black">
                              {Math.min(roomUnreadCount, 99)}
                            </span>
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="break-words pr-2 text-[15px] font-semibold leading-5 text-white">
                                {room.name || `Chat ${room.chat_id || ""}`}
                              </p>
                              <p className={`mt-2 truncate text-[15px] ${roomUnreadCount > 0 ? "font-medium text-white/82" : "text-white/42"}`}>
                                {previewSender ? `${previewSender}: ` : ""}
                                {previewText}
                              </p>
                              <p className="mt-2 truncate text-[12px] text-white/28">
                                {`${roomParticipantCount || 1} ${(roomParticipantCount || 1) === 1 ? "participant" : "participants"}`}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5 text-[12px] text-white/32">
                              <div className="flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5" />
                                <span>{roomParticipantCount || 1}</span>
                                <span>/</span>
                                <span className={roomUnreadCount > 0 ? "font-medium text-[#E5D5B8]" : ""}>
                                  {formatConversationMeta(metaDate)}
                                </span>
                              </div>
                              {roomUnreadCount > 0 ? (
                                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[#E5D5B8] px-2 py-0.5 text-[11px] font-semibold text-black">
                                  {roomUnreadCount > 9 ? "9+" : roomUnreadCount}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-[11px] text-white/24">
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

            <div className="flex min-h-0 flex-col">
              <div className="border-b border-white/10 bg-[#111] px-5 py-4 lg:px-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E5D5B8]/15 text-[#E5D5B8]">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{selectedRoomTitle}</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setManageDefaultTab("current");
                        setIsManageOpen(true);
                      }}
                      className="mt-1 inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-white/75"
                    >
                      <Users className="h-3.5 w-3.5" />
                      {`${participantCount} ${participantCount === 1 ? "Participant" : "Participants"}`}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsThreadSearchOpen((current) => !current);
                      setIsHeaderMenuOpen(false);
                      if (isThreadSearchOpen) {
                        setThreadSearch("");
                      }
                    }}
                    className={`rounded-full border border-white/10 p-3 transition ${
                      isThreadSearchOpen ? "bg-[#E5D5B8] text-black" : "bg-[#161616] text-white/60 hover:bg-[#1d1d1d]"
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
                      className={`rounded-full border border-white/10 p-3 transition ${
                        isHeaderMenuOpen ? "bg-[#E5D5B8] text-black" : "bg-[#161616] text-white/60 hover:bg-[#1d1d1d]"
                      }`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {isHeaderMenuOpen ? (
                      <div className="absolute right-0 top-[calc(100%+10px)] z-20 min-w-[220px] rounded-2xl border border-white/10 bg-[#171717] p-2 shadow-2xl">
                        <button
                          type="button"
                          onClick={async () => {
                            setIsHeaderMenuOpen(false);
                            if (selectedRoom) {
                              await loadRoomDetails(selectedRoom);
                            }
                            await refreshRoomListSnapshot();
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-white/80 transition hover:bg-white/5"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Refresh conversation
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsHeaderMenuOpen(false);
                            setManageDefaultTab("current");
                            setIsManageOpen(true);
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-white/80 transition hover:bg-white/5"
                        >
                          <Users className="h-4 w-4" />
                          View participants
                        </button>
                        {isAdminView ? (
                          <button
                            type="button"
                            onClick={() => {
                              setIsHeaderMenuOpen(false);
                              setManageDefaultTab("add");
                              setIsManageOpen(true);
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-white/80 transition hover:bg-white/5"
                          >
                            <UserPlus className="h-4 w-4" />
                            Add participant
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
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-white/80 transition hover:bg-white/5"
                          >
                            <X className="h-4 w-4" />
                            Clear search
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  {isAdminView && selectedRoom ? (
                    <button
                      type="button"
                      onClick={() => {
                        setManageDefaultTab("add");
                        setIsManageOpen(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#E5D5B8] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#d8c49e]"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add Participant
                    </button>
                  ) : null}
                </div>
              </div>
              {isThreadSearchOpen ? (
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#151515] px-4 py-3">
                  <Search className="h-4 w-4 text-white/45" />
                  <input
                    value={threadSearch}
                    onChange={(event) => setThreadSearch(event.target.value)}
                    placeholder="Search in this conversation"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                  />
                  {threadSearch ? (
                    <button
                      type="button"
                      onClick={() => setThreadSearch("")}
                      className="rounded-full p-1 text-white/45 transition hover:bg-white/5 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              ) : null}
              </div>

              <div className="relative min-h-0 flex-1">
                <div
                  ref={messageViewportRef}
                  onScroll={updateScrollIntent}
                  className="min-h-0 h-full overflow-y-auto bg-[#0f0f0f] px-5 py-6 lg:px-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
              {loadingRoomData ? (
                <div className="text-sm text-white/45">Loading messages...</div>
              ) : !selectedRoom ? (
                <div className="flex h-full items-center justify-center">
                  <div className="mx-auto flex max-w-md flex-col items-center rounded-[32px] border border-[#E5D5B8]/12 bg-[linear-gradient(180deg,rgba(27,24,21,0.92),rgba(16,15,13,0.96))] px-8 py-12 text-center shadow-[0_25px_60px_rgba(0,0,0,0.28)]">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[26px] bg-[linear-gradient(135deg,rgba(229,213,184,0.18),rgba(188,216,240,0.14))] text-[#E5D5B8]">
                      <MessageCircle className="h-9 w-9" />
                    </div>
                    <h4 className="text-2xl font-semibold tracking-tight text-white">Select a conversation</h4>
                    <p className="mt-3 text-sm leading-6 text-white/52">
                      Choose a conversation from the left side to open the thread and continue the chat from here.
                    </p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <EmptyChatState/>
              ) : visibleMessages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="rounded-[30px] border border-white/10 bg-[#171411] px-8 py-10 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#E5D5B8]/12 text-[#E5D5B8]">
                      <Search className="h-7 w-7" />
                    </div>
                    <p className="text-sm text-white/45">No messages matched your search.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="rounded-xl bg-[#E5D5B8] px-3 py-1 text-xs font-medium text-black">
                      {formatDayLabel(latestDate)}
                    </span>
                    <div className="h-px flex-1 bg-white/10" />
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
                            <div className="flex items-center gap-3 py-1">
                              <div className="h-px flex-1 bg-[#E5D5B8]/25" />
                              <span className="rounded-full border border-[#E5D5B8]/20 bg-[#E5D5B8]/12 px-3 py-1 text-[11px] font-semibold text-[#E5D5B8]">
                                {activeThreadUnreadCount} unread {activeThreadUnreadCount === 1 ? "message" : "messages"}
                              </span>
                              <div className="h-px flex-1 bg-[#E5D5B8]/25" />
                            </div>
                          ) : null}
                          <div className="flex justify-center">
                            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] italic text-white/35">
                              {getMessageText(message)}
                            </span>
                          </div>
                        </React.Fragment>
                      );
                    }

                    return (
                      <React.Fragment key={messageId || `${message.createdAt}-${message.message}`}>
                        {unreadBoundaryMessageId === messageId ? (
                          <div className="flex items-center gap-3 py-1">
                            <div className="h-px flex-1 bg-[#E5D5B8]/25" />
                            <span className="rounded-full border border-[#E5D5B8]/20 bg-[#E5D5B8]/12 px-3 py-1 text-[11px] font-semibold text-[#E5D5B8]">
                              {activeThreadUnreadCount} unread {activeThreadUnreadCount === 1 ? "message" : "messages"}
                            </span>
                            <div className="h-px flex-1 bg-[#E5D5B8]/25" />
                          </div>
                        ) : null}
                        <div
                          className={`group flex items-end gap-3 ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          {!isOwn ? (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E5D5B8]/20 text-xs font-semibold text-[#E5D5B8]">
                              {getInitials(sender?.name)}
                            </div>
                          ) : null}
                          <div className={`max-w-[78%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                            <div className="relative">
                              <div
                                data-message-action-area="true"
                                className={`absolute top-1/2 z-10 flex -translate-y-1/2 items-center gap-2 transition ${
                                  openMessageMenuId === messageId ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                } ${isOwn ? "left-0 -translate-x-[calc(100%+12px)]" : "right-0 translate-x-[calc(100%+12px)]"}`}
                              >
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowReactionPickerId((current) => (current === messageId ? null : messageId));
                                      setOpenMessageMenuId(null);
                                    }}
                                    className="rounded-full border border-white/10 bg-[#151515] p-2 text-white/65 transition hover:bg-[#202020] hover:text-white"
                                  >
                                    <Smile className="h-4 w-4" />
                                  </button>
                                  {showReactionPickerId === messageId ? (
                                    <div className={`absolute top-1/2 z-20 flex -translate-y-1/2 items-center gap-1 rounded-full border border-white/10 bg-[#151515] px-2 py-1 shadow-2xl ${isOwn ? "right-[calc(100%+8px)]" : "left-[calc(100%+8px)]"}`}>
                                      {QUICK_REACTIONS.map((emoji) => (
                                        <button
                                          key={`${messageId}-picker-${emoji}`}
                                          type="button"
                                          onClick={() => handleReaction(message, emoji)}
                                          className="rounded-full px-1.5 text-lg transition hover:scale-110"
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
                                  className="rounded-full border border-white/10 bg-[#151515] p-2 text-white/65 transition hover:bg-[#202020] hover:text-white"
                                >
                                  <Reply className="h-4 w-4" />
                                </button>
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMessageMenuId((current) => (current === messageId ? null : messageId));
                                      setShowReactionPickerId(null);
                                    }}
                                    className="rounded-full border border-white/10 bg-[#151515] p-2 text-white/65 transition hover:bg-[#202020] hover:text-white"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                  {openMessageMenuId === messageId ? (
                                    <div className={`absolute top-1/2 z-20 min-w-[150px] -translate-y-1/2 rounded-2xl border border-white/10 bg-[#171717] p-2 shadow-2xl ${isOwn ? "right-[calc(100%+8px)]" : "left-[calc(100%+8px)]"}`}>
                                      {isOwn ? (
                                        <button
                                          type="button"
                                          onClick={() => startEditingMessage(message)}
                                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/5"
                                        >
                                          <Pencil className="h-4 w-4" />
                                          Edit
                                        </button>
                                      ) : null}
                                      {isOwn ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setMessagePendingDelete(message);
                                            setOpenMessageMenuId(null);
                                          }}
                                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#ff7d7d] transition hover:bg-white/5"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                          Delete
                                        </button>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>
                              </div>

                              <div
                                className={`rounded-[24px] px-4 py-3 ${
                                  isOwn ? "rounded-br-md bg-[#1D1D1D] text-white" : "rounded-bl-md bg-[#191919] text-white"
                                }`}
                              >
                              <div className="mb-1 flex items-center gap-2">
                                <p className="text-[11px] uppercase tracking-[0.14em] text-white/35">
                                  {sender?.name || "Participant"}
                                </p>
                                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/45">
                                  {getRoleLabel(senderRole)}
                                </span>
                                {message.is_edited ? (
                                  <span className="text-[10px] text-white/30">(edited)</span>
                                ) : null}
                              </div>
                              {typeof message.reply_to === "object" && message.reply_to ? (
                                <div className="mb-3 rounded-2xl border border-white/10 bg-black/15 px-3 py-2 text-xs text-white/55">
                                  <p className="mb-1 truncate font-medium text-white/75">
                                    {normalizeUser(message.reply_to.sent_by)?.name || "Reply"}
                                  </p>
                                  <p className="truncate">{getMessageText(message.reply_to)}</p>
                                </div>
                              ) : null}
                              {isEditing ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    rows={3}
                                    className="w-full resize-none rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm text-white outline-none focus:border-[#E5D5B8]/40"
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
                                      className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={submitEditMessage}
                                      className="rounded-full bg-[#E5D5B8] px-3 py-1 text-xs font-semibold text-black"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="whitespace-pre-wrap text-sm leading-6 text-white/85">{getMessageText(message)}</p>
                              )}
                              </div>
                            </div>
                            {groupedReactions.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-2">
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
                                      className={`rounded-full border px-2.5 py-1 text-xs ${
                                        reaction.reactedByCurrentUser
                                          ? "border-[#E5D5B8]/40 bg-[#E5D5B8]/12 text-[#E5D5B8]"
                                          : "border-white/10 bg-[#171717] text-white/75"
                                      }`}
                                      title={reaction.users.join(", ")}
                                    >
                                      {reaction.emoji} {reaction.count}
                                    </button>
                                    {openReactionDetails?.messageId === messageId && openReactionDetails?.emoji === reaction.emoji ? (
                                      <div className={`absolute z-20 mt-2 min-w-[180px] rounded-2xl border border-white/10 bg-[#171717] p-3 shadow-2xl ${isOwn ? "right-0" : "left-0"}`}>
                                        <p className="mb-2 text-xs font-semibold text-white/85">
                                          {reaction.emoji} Reactions
                                        </p>
                                        <div className="space-y-1">
                                          {reaction.users.map((name, index) => (
                                            <p key={`${reaction.emoji}-${name}-${index}`} className="text-xs text-white/65">
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
                            <span className="mt-1 text-[10px] text-white/30">
                              {formatTime(message.createdAt)} {formatDate(message.createdAt)}
                            </span>
                          </div>
                          {isOwn ? (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E5D5B8]/20 text-xs font-semibold text-[#E5D5B8]">
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
                {hasUnreadMarker && !isNearBottom ? (
                  <button
                    type="button"
                    onClick={() => {
                      shouldStickToBottomRef.current = true;
                      setIsNearBottom(true);
                      setActiveThreadUnreadCount(0);
                      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
                    }}
                    className="absolute bottom-5 right-5 rounded-full border border-[#E5D5B8]/20 bg-[#E5D5B8] px-4 py-2 text-xs font-semibold text-black shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition hover:bg-[#d8c49e]"
                  >
                    {activeThreadUnreadCount} new {activeThreadUnreadCount === 1 ? "message" : "messages"}
                  </button>
                ) : null}
              </div>

              <div className="relative border-t border-white/10 bg-[#111] p-4 lg:px-8">
                {replyTarget ? (
                  <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/10 bg-[#151515] px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.14em] text-[#E5D5B8]">Replying To</p>
                      <p className="mt-1 truncate text-sm text-white/80">{getMessageText(replyTarget)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyTarget(null)}
                      className="text-sm text-white/45 transition hover:text-white"
                    >
                      Clear
                    </button>
                  </div>
                ) : null}
                {showComposerEmojis ? (
                  <div
                    ref={composerEmojiRef}
                    className="absolute bottom-[calc(100%+12px)] right-4 z-30 w-[320px] max-w-[calc(100%-2rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#111] shadow-2xl lg:right-8"
                  >
                    <EmojiPicker
                      onEmojiClick={handleComposerEmojiClick}
                      theme={Theme.DARK}
                      width="100%"
                      height={340}
                      searchPlaceholder="Search emojis..."
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                ) : null}
                <div className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-[#151515] p-3">
                  <button
                    type="button"
                    onClick={() => toast.info("File attachments are not connected to external chat yet")}
                    className="text-white/45 transition hover:text-white"
                  >
                    <Paperclip className="h-5 w-5" />
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
                    className="max-h-32 min-h-[24px] flex-1 resize-none border-0 bg-transparent py-1 text-white outline-none placeholder:text-white/35"
                  />
                  <button
                    type="button"
                    onClick={() => setShowComposerEmojis((current) => !current)}
                    className="text-white/45 transition hover:text-white"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!selectedRoom || !draftMessage.trim() || sending}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E5D5B8] text-black transition hover:bg-[#d8c49e] disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
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
        />
      ) : null}

      {messagePendingDelete ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#121212] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#ff7d7d]/10 text-[#ff7d7d]">
              <Trash2 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Delete message?</h3>
            <p className="mt-2 text-sm leading-6 text-white/55">
              This will remove the message for everyone in this chat. You can&apos;t undo it later.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMessagePendingDelete(null)}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMessage(messagePendingDelete)}
                className="rounded-full bg-[#ff7d7d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#ff6a6a]"
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
