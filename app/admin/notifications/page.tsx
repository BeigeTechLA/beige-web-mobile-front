"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Archive,
  Bell,
  CheckCheck,
  Clock3,
  DollarSign,
  EyeOff,
  FileText,
  FolderOpen,
  Hexagon,
  MailOpen,
  MessageSquare,
  RefreshCw,
  Search,
  Sun,
  Tag,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";

import { adminApi } from "@/lib/api";
import { DeleteConfirmationModal } from "@/components/admin/DeleteConfirmationModal";

type ApiNotification = {
  notification_id?: number | string;
  id?: number | string;
  user_id?: number | string;
  type?: string | null;
  title?: string | null;
  message?: string | null;
  data?: string | Record<string, unknown> | null;
  is_read?: number | boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type UiNotification = {
  id: string;
  title: string;
  description: string;
  actor: string;
  role: string;
  avatar: string;
  category: "Files" | "Payments" | "Messages" | "Shoots" | "Proposals" | "System";
  priority: "Critical" | "High" | "Medium";
  time: string;
  cta: string;
  accent: string;
  isRead: boolean;
  type: string;
  createdAt: string | null;
  meta: Record<string, unknown>;
};

type PendingConfirmAction =
  | { type: "delete"; id: string; title: string }
  | { type: "markAllRead" }
  | null;

const avatar = "/images/avatar.png";

const categoryIcon = {
  Files: FolderOpen,
  Payments: DollarSign,
  Messages: MessageSquare,
  Shoots: FileText,
  Proposals: FileText,
  System: Bell,
};

const categoryToTypes: Record<string, string[]> = {
  Payments: ["quote_approval", "quote_rejected", "payment", "invoice"],
  Projects: ["book_a_shoot", "cp_accepted", "cp_rejected", "cp_profile", "project", "booking"],
  Files: ["file", "files"],
  Messages: ["message", "mention"],
};

const parseData = (value: ApiNotification["data"]): Record<string, unknown> => {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const titleCase = (value: string) =>
  value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getRelativeTime = (dateValue?: string | null) => {
  if (!dateValue) return "Just now";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Just now";
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  return `${Math.floor(diff / day)}d ago`;
};

const formatDateTime = (dateValue?: string | null) => {
  if (!dateValue) return "Not available";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
};

const resolveCategory = (type: string): UiNotification["category"] => {
  if (["quote_approval", "quote_rejected", "payment", "invoice"].some((key) => type.includes(key))) return "Payments";
  if (["book_a_shoot", "cp_accepted", "cp_rejected", "cp_profile", "approved", "project", "booking"].some((key) => type.includes(key))) return "Shoots";
  if (type.includes("file")) return "Files";
  if (type.includes("message") || type.includes("mention")) return "Messages";
  if (type.includes("proposal") || type.includes("quote")) return "Proposals";
  return "System";
};

const resolvePriority = (type: string): UiNotification["priority"] => {
  if (type.includes("rejected") || type.includes("book_a_shoot")) return "Critical";
  if (type.includes("approval") || type.includes("accepted") || type.includes("approved") || type.includes("payment")) return "High";
  return "Medium";
};

const resolveCta = (type: string) => {
  if (type.includes("quote")) return "Open Quote";
  if (type.includes("cp_profile")) return "View CP";
  if (type.includes("payment") || type.includes("invoice")) return "View Invoice";
  if (type.includes("file")) return "Review Files";
  if (type.includes("message")) return "View Message";
  return "View Details";
};
const resolveDescription = (type: string, meta: Record<string, unknown>, fallback: string): string => {
  const clientName = String(meta.client_name || meta.crew_name || "Client");
  const quoteId = String(meta.quote_id || meta.booking_id || "");
  const before = meta.before_amount || meta.old_amount;
  const after = meta.after_amount || meta.new_amount;
  const increase = meta.increase || meta.difference;

  if (type.includes("quote_change_approved")) {
    return `Quote ${meta.quote_number || ''} for ${clientName} has been approved.`;
  }
  if (type.includes("quote_change_rejected")) {
    return `Quote ${meta.quote_number || ''} for ${clientName} change request has been rejected.`;
  }
  if (type.includes("quote_change_request")) {
    const quoteNum = String(meta.quote_number || meta.quote_id || '');
    const changeType = String(meta.change_type || '');
    const direction = changeType === 'increase' ? '⬆ Increase' : changeType === 'decrease' ? '⬇ Decrease' : '';
    const changeAmount = meta.change_amount;
    const beforeAmt = meta.before_amount;
    const afterAmt = meta.after_amount;
    const amountDetail = changeAmount ? ` — ${direction} of $${changeAmount} (Before: $${beforeAmt || 0} → After: $${afterAmt || 0})` : '';
    return `${clientName}'s quote ${quoteNum}${amountDetail}.`;
  }

  if (type.includes("quote")) {
    const idPart = quoteId ? ` ${quoteId}` : "";
    const incPart = increase ? ` — Increase of $${increase}` : "";
    const changePart = before && after ? ` (Before: $${before} → After: $${after})` : "";
    return `${clientName}'s quote${idPart} has been updated${incPart}${changePart}.`;
  }
  if (type.includes("payment") || type.includes("invoice")) return `A payment update is available for ${clientName}.`;
  if (type.includes("book_a_shoot") || type.includes("booking")) return `${clientName} has requested a new shoot booking.`;
  if (type.includes("cp_accepted") || type.includes("approved")) return `${clientName}'s proposal has been approved.`;
  if (type.includes("cp_rejected") || type.includes("rejected")) return `${clientName}'s proposal has been rejected.`;
  if (type.includes("message") || type.includes("mention")) return `${clientName} sent you a message.`;
  if (type.includes("file")) return `${clientName} uploaded new files for review.`;

  const hasHindi = /[\u0900-\u097F]/.test(fallback);
  return hasHindi ? `New notification from ${clientName}.` : fallback || `New notification from ${clientName}.`;
};

const getAccent = (priority: UiNotification["priority"]) => {
  if (priority === "Critical") return "bg-[#FF4B4B]";
  if (priority === "High") return "bg-[#FFB000]";
  return "bg-[#2E8BFF]";
};

const getMetaValue = (meta: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = meta[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
};

const resolveNotificationHref = (item: UiNotification) => {
  const quoteId = getMetaValue(item.meta, [
    "quote_id",
    "sales_quote_id",
    "quoteId",
    "salesQuoteId",
    "quote_number",
  ]);
  if (item.type.includes("quote") && quoteId) {
    return `/admin/quotes/${encodeURIComponent(quoteId)}`;
  }

  const cpId = getMetaValue(item.meta, [
    "crew_member_id",
    "crewMemberId",
    "creative_partner_id",
    "creativePartnerId",
    "cp_id",
    "cpId",
    "creator_id",
    "creatorId",
  ]);
  if ((item.type.includes("cp_") || item.type.includes("cp-") || item.type.includes("cp_profile")) && cpId) {
    return `/admin/users/creative-partners/${encodeURIComponent(cpId)}`;
  }

  const creditUserId = getMetaValue(item.meta, ["user_id", "userId", "client_id", "clientId"]);
  if ((item.type.includes("credit") || item.type.includes("points")) && creditUserId) {
    return `/admin/finances/creditPoints/${encodeURIComponent(creditUserId)}`;
  }

  const bookingId = getMetaValue(item.meta, [
    "booking_id",
    "bookingId",
    "project_id",
    "projectId",
    "stream_project_booking_id",
  ]);
  if (bookingId) {
    return `/admin/shoots/${encodeURIComponent(bookingId)}`;
  }

  return "";
};

const getConfirmDescription = (pendingAction: PendingConfirmAction) => {
  if (!pendingAction) return "";
  if (pendingAction.type === "markAllRead") {
    return "Are you sure you want to mark all notifications as read?";
  }
  return `Are you sure you want to delete "${pendingAction.title}"? This action cannot be undone.`;
};

const normalizeNotification = (item: ApiNotification): UiNotification => {
  const type = String(item.type || "system").toLowerCase();
  const meta = parseData(item.data);
  const category = resolveCategory(type);
  const priority = resolvePriority(type);
  const clientName = String(meta.client_name || meta.crew_name || "Beige");
  const fallbackId = `${type}-${item.created_at || Date.now()}-${Math.random().toString(36).slice(2)}`;

  return {
    id: String(item.notification_id ?? item.id ?? fallbackId),
    title: item.title || titleCase(type),
    description: resolveDescription(type, meta, item.message || ""),
    actor: clientName,
    role: category === "Payments" ? "Sales" : category === "Shoots" ? "Production" : "Team",
    avatar,
    category,
    priority,
    time: getRelativeTime(item.created_at),
    cta: resolveCta(type),
    accent: getAccent(priority),
    isRead: Number(item.is_read) === 1 || item.is_read === true,
    type,
    createdAt: item.created_at || null,
    meta,
  };
};

function AppHeader({
  title,
  unreadCount,
  onSettings,
  onMarkAllRead,
}: {
  title: string;
  unreadCount: number;
  onSettings: () => void;
  onMarkAllRead: () => void;
}) {
  return (
    <div className="flex min-h-[76px] w-full max-w-full flex-wrap items-center justify-between gap-4 overflow-hidden border-b border-white/10 bg-[#151515] px-4 py-4 sm:px-5 lg:h-[84px] lg:px-8 lg:py-0">
      <div className="flex min-w-0 items-center gap-4 sm:gap-6">
        <Image
          src="https://d2jhn32fsulyac.cloudfront.net/assets/logos/beige_logo_vb.png"
          alt="BEIGE"
          width={106}
          height={22}
          className="shrink-0 object-contain"
        />
        <h1 className="truncate text-sm font-semibold text-white">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button className="relative grid h-10 w-10 place-items-center rounded-full bg-[#E5D5B8] text-black sm:h-11 sm:w-11">
          <Bell size={18} />
          {unreadCount > 0 ? <span className="absolute -left-1 -top-1 text-[10px] font-semibold">{unreadCount}</span> : null}
        </button>
        <button className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-[#101010] text-white sm:h-11 sm:w-11">
          <Sun size={18} />
        </button>
        <button
          onClick={onSettings}
          className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-[#101010] text-white sm:h-11 sm:w-11"
          aria-label="Settings"
        >
          <span className="relative grid h-7 w-7 place-items-center">
            <Hexagon size={24} strokeWidth={2.1} />
            <span className="absolute h-1.5 w-1.5 rounded-full bg-white" />
          </span>
        </button>
        <Image src={avatar} alt="User" width={44} height={44} className="hidden rounded-full sm:block" />
        <button
          onClick={onMarkAllRead}
          className="ml-1 h-10 rounded-md bg-[#E5D5B8] px-4 text-xs font-semibold text-black shadow-[0_14px_36px_rgba(229,213,184,0.25)] sm:h-11 sm:px-5 xl:px-7"
        >
          <CheckCheck className="mr-2 inline h-4 w-4" />
          <span className="hidden sm:inline">Mark all as read</span>
          <span className="sm:hidden">Read all</span>
        </button>
      </div>
    </div>
  );
}

function SettingsModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  return (
    <div className="fixed inset-0 z-[130] flex items-start justify-center bg-black/70 px-4 pt-[72px] backdrop-blur-[2px]">
      <div className="w-full max-w-[720px] overflow-hidden rounded-[14px] border border-white/20 bg-black text-white shadow-[0_28px_90px_rgba(0,0,0,0.75)]">
        <div className="flex items-center justify-between border-b border-white/25 px-5 py-5 sm:px-6 sm:py-6">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25">
            <X size={22} />
          </button>
        </div>
        <div className="p-5 sm:p-6">
          <button className="flex w-full items-center gap-4 rounded-xl p-2 text-left transition-colors hover:bg-white/[0.04] sm:gap-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#111] text-[#E5D5B8] sm:h-14 sm:w-14">
              <UsersRound size={26} />
            </span>
            <span>
              <span className="block text-lg font-semibold leading-6 sm:text-xl">General Settings</span>
              <span className="mt-1 block text-sm text-white/45 sm:text-base">Manage Language, Time Zone and other Personal Preferences</span>
            </span>
          </button>
          <button
            onClick={() => {
              onClose();
              router.push("/admin/notifications/preferences");
            }}
            className="mt-4 flex w-full items-center gap-4 rounded-xl p-2 text-left transition-colors hover:bg-white/[0.04] sm:gap-5"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#111] text-[#E5D5B8] sm:h-14 sm:w-14">
              <Bell size={24} />
            </span>
            <span>
              <span className="block text-lg font-semibold leading-6 sm:text-xl">Notification Preferences</span>
              <span className="mt-1 block text-sm text-white/45 sm:text-base">Manage how and when you receive notifications</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationDetails({
  item,
  onClose,
  onDelete,
  onMarkRead,
  onOpenDetails,
}: {
  item: UiNotification;
  onClose: () => void;
  onDelete: (id: string) => void;
  onMarkRead: (id: string) => void;
  onOpenDetails: (item: UiNotification) => void;
}) {
  const Icon = categoryIcon[item.category];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="max-h-[calc(100vh-40px)] w-full max-w-[520px] overflow-y-auto rounded-[12px] border border-white/20 bg-black text-white shadow-[0_30px_90px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-between border-b border-white/20 px-5 py-5 sm:px-6">
          <h2 className="text-xl font-semibold leading-none sm:text-2xl">Notification Details</h2>
          <button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25">
            <X size={24} />
          </button>
        </div>
        <div className="px-5 py-5 sm:px-6">
          <div className={`mb-5 flex h-9 items-center gap-2 rounded-md px-4 text-xs font-medium uppercase ${item.priority === "Critical" ? "bg-[#3A0808] text-[#FF5757]" : "bg-white/10 text-[#E5D5B8]"}`}>
            <Tag size={14} /> {item.priority} Priority
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Image src={item.avatar} alt={item.actor} width={48} height={48} className="rounded-full" />
              <div>
                <h3 className="font-semibold">{item.actor} ({item.role})</h3>
              </div>
            </div>
            <span className="flex items-center gap-1 text-xs text-white/45"><Clock3 size={14} /> {item.time}</span>
          </div>
          <div className="mt-6 space-y-4 text-sm">
            <div>
              <p className="text-white/45">Action</p>
              <p className="mt-2">{item.title}</p>
            </div>
            <div>
              <p className="text-white/45">Details</p>
              <p className="mt-2">{item.description}</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 border-t border-white/10 pt-5 text-sm">
            <div>
              <p className="text-white/45">Category</p>
              <p className="mt-2">{item.category}</p>
            </div>
            <div>
              <p className="text-white/45">Type</p>
              <p className="mt-2">{titleCase(item.type)}</p>
            </div>
          </div>
          <button
            onClick={() => onOpenDetails(item)}
            className="mt-6 h-12 w-full rounded-[8px] bg-[#E5D5B8] text-sm font-semibold text-black transition-colors hover:bg-[#D8C8AA]"
          >
            <Icon className="mr-2 inline h-4 w-4" />
            {item.cta}
          </button>
          <div className="mt-4 grid gap-3 border-b border-white/10 pb-5 sm:grid-cols-2">
            <button onClick={() => onMarkRead(item.id)} className="h-11 rounded-[8px] border border-white/20 text-sm font-medium transition-colors hover:bg-white/5">
              <MailOpen className="mr-2 inline h-4 w-4" />{item.isRead ? "Already Read" : "Mark Read"}
            </button>
            <button onClick={() => onDelete(item.id)} className="h-11 rounded-[8px] border border-white/20 text-sm font-medium transition-colors hover:bg-white/5">
              <Trash2 className="mr-2 inline h-4 w-4" />Delete
            </button>
          </div>
          <div className="mt-6">
            <p className="mb-4 text-sm font-medium text-[#E5D5B8]">Timeline</p>
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-[#E5D5B8]" />Notification created</span>
              <span className="text-right text-white/55">{formatDateTime(item.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("All");
  const [selected, setSelected] = useState<UiNotification | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [items, setItems] = useState<UiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmAction>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const loadNotifications = useCallback(async (showToast = false) => {
    setLoading(true);
    const [listResponse, countResponse] = await Promise.all([
      adminApi.getNotifications({ page: 1, limit: 100 }),
      adminApi.getUnreadNotificationCount(),
    ]);

    if (listResponse?.error) {
      toast.error(listResponse.message || "Failed to load notifications");
      setItems([]);
    } else {
      const apiItems = (Array.isArray(listResponse?.data) ? listResponse.data : []).map(normalizeNotification);
      setItems(apiItems.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
      if (showToast) toast.success("Notifications refreshed");
    }

    if (!countResponse?.error) {
      setUnreadCount(Number(countResponse.unread_count || 0));
    } else {
      setUnreadCount(0);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNotifications();
    const intervalId = window.setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [loadNotifications]);

  const tabs = useMemo(() => {
    const countBy = (tab: string) => {
      if (tab === "All") return items.length;
      if (tab === "Unread") return items.filter((item) => !item.isRead).length;
      if (tab === "Mentions") return items.filter((item) => item.type.includes("mention")).length;
      const types = categoryToTypes[tab] || [];
      return items.filter((item) => types.some((type) => item.type.includes(type))).length;
    };
    return ["All", "Unread", "Mentions", "Payments", "Projects", "Files"].map((tab) => [tab, String(countBy(tab)).padStart(2, "0")]);
  }, [items]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch = !query || [item.title, item.description, item.actor, item.category, item.type].some((value) => value.toLowerCase().includes(query));
      if (!matchesSearch) return false;
      if (activeTab === "All") return true;
      if (activeTab === "Unread") return !item.isRead;
      if (activeTab === "Mentions") return item.type.includes("mention");
      const types = categoryToTypes[activeTab] || [];
      return types.some((type) => item.type.includes(type));
    });
  }, [activeTab, items, search]);

  const markRead = async (id: string) => {
    const wasUnread = items.some((item) => item.id === id && !item.isRead);
    const response = await adminApi.markNotificationRead(id);
    if (response?.error) {
      toast.error(response.message || "Failed to update notification");
      return;
    }
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, isRead: true } : item));
    setUnreadCount((prev) => wasUnread ? Math.max(prev - 1, 0) : prev);
    setSelected((current) => current?.id === id ? { ...current, isRead: true } : current);
    toast.success(response.message || "Notification marked as read");
  };

  const deleteItem = async (id: string) => {
    const response = await adminApi.deleteNotification(id);
    if (response?.error) {
      toast.error(response.message || "Failed to delete notification");
      return;
    }
    const wasUnread = items.some((item) => item.id === id && !item.isRead);
    setItems((prev) => prev.filter((item) => item.id !== id));
    setUnreadCount((prev) => wasUnread ? Math.max(prev - 1, 0) : prev);
    setSelected(null);
    toast.success(response.message || "Notification deleted");
  };

  const markAllRead = async () => {
    if (!items.some((item) => !item.isRead)) {
      toast.info("No unread notifications");
      return;
    }
    const response = await adminApi.markAllNotificationsRead();
    if (response?.error) {
      toast.error(response.message || "Failed to mark notifications as read");
      return;
    }
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    toast.success(response.message || "All notifications marked as read");
  };

  const openNotificationTarget = async (item: UiNotification) => {
    const href = resolveNotificationHref(item);
    if (!href) {
      toast.error("Details link is not available for this notification");
      return;
    }
    if (!item.isRead) {
      void markRead(item.id);
    }
    setSelected(null);
    router.push(href);
  };

  const handleConfirmAction = async () => {
    if (!pendingConfirm) return;
    setConfirmLoading(true);
    try {
      if (pendingConfirm.type === "delete") {
        await deleteItem(pendingConfirm.id);
      } else {
        await markAllRead();
      }
      setPendingConfirm(null);
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-[#121212] text-white">
      <AppHeader title="Notifications" unreadCount={unreadCount} onSettings={() => setSettingsOpen(true)} onMarkAllRead={() => setPendingConfirm({ type: "markAllRead" })} />
      <div className="border-b border-white/10 bg-[#191815] px-4 py-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#E5D5B8]">
          <span>{unreadCount} unread notification{unreadCount === 1 ? "" : "s"}</span>
          <div className="flex items-center gap-4 text-white/80 sm:gap-8">
            <button onClick={() => toast.info("Archive is not available from the backend yet")} className="flex items-center gap-2"><Archive size={14} /> Archive</button>
            <button onClick={() => toast.info("Mute preferences are saved on the preferences page")} className="flex items-center gap-2"><EyeOff size={14} /> Mute</button>
            <button onClick={() => loadNotifications(true)} className="flex items-center gap-2"><RefreshCw size={14} /> Refresh</button>
          </div>
        </div>
      </div>
      <main className="px-4 py-6 sm:px-8 sm:py-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search Notifications..."
            className="h-12 w-full rounded-[10px] border border-white/10 bg-[#222] pl-12 pr-4 text-sm outline-none placeholder:text-white/35"
          />
        </div>
        <section className="mt-5 overflow-hidden rounded-[12px] border border-white/10 bg-[#171717]">
          <div className="grid grid-cols-2 border-b border-white/10 sm:grid-cols-3 xl:grid-cols-6">
            {tabs.map(([tab, count]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`h-14 text-sm ${activeTab === tab ? "border-b-2 border-[#E5D5B8] text-[#E5D5B8]" : "text-white/65"}`}
              >
                {tab} <span className="ml-1 rounded-full bg-white/10 px-1.5 text-[10px]">{count}</span>
              </button>
            ))}
          </div>
          {loading ? (
            <div className="grid min-h-[260px] place-items-center text-sm text-white/55">Loading notifications...</div>
          ) : visible.length === 0 ? (
            <div className="grid min-h-[260px] place-items-center px-6 text-center text-sm text-white/55">No notifications found.</div>
          ) : (
            visible.map((item) => {
              const Icon = categoryIcon[item.category];
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelected(item);
                    if (!item.isRead) void markRead(item.id);
                  }}
                  className={`grid w-full grid-cols-[4px_1fr] border-b border-white/10 text-left transition-colors last:border-b-0 hover:bg-white/[0.03] lg:grid-cols-[4px_1fr_auto] ${item.isRead ? "opacity-65" : ""}`}
                >
                  <span className={item.accent} />
                  <span className="flex gap-4 px-4 py-5 sm:px-5 sm:py-6">
                    <Image src={item.avatar} alt={item.actor} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                    <span className="min-w-0">
                      <span className="block font-semibold">{item.title}</span>
                      <span className="mt-1 block text-sm text-white/50">{item.description}</span>
                      <span className="mt-4 flex flex-wrap items-center gap-3">
                        <span className="inline-flex h-8 items-center gap-2 rounded-md bg-white/10 px-3 text-xs text-white"><Icon size={14} />{item.category}</span>
                        <span className={`inline-flex h-8 items-center rounded-md px-3 text-xs ${item.priority === "Critical" ? "bg-white text-[#E03131]" : item.priority === "High" ? "bg-[#FFF7EA] text-[#C78500]" : "bg-[#EAF2FF] text-[#2E72D2]"}`}>
                          {item.priority}
                        </span>
                      </span>
                    </span>
                  </span>
                  <span className="flex flex-row items-center justify-between gap-3 px-4 pb-5 pl-8 sm:px-5 lg:flex-col lg:items-end lg:py-6 lg:pl-5">
                    <span className="flex items-center gap-3 text-xs text-white/50">{item.time}{!item.isRead ? <span className="h-2 w-2 rounded-full bg-[#E5D5B8]" /> : null}</span>
                    <span className="rounded-md bg-[#E5D5B8] px-4 py-2 text-xs font-semibold text-black">{item.cta}</span>
                  </span>
                </button>
              );
            })
          )}
        </section>
      </main>
      {selected ? (
        <NotificationDetails
          item={selected}
          onClose={() => setSelected(null)}
          onDelete={(id) => setPendingConfirm({ type: "delete", id, title: selected.title })}
          onMarkRead={markRead}
          onOpenDetails={openNotificationTarget}
        />
      ) : null}
      {settingsOpen ? <SettingsModal onClose={() => setSettingsOpen(false)} /> : null}
      <DeleteConfirmationModal
        isOpen={Boolean(pendingConfirm)}
        onClose={() => setPendingConfirm(null)}
        onConfirm={handleConfirmAction}
        title={pendingConfirm?.type === "markAllRead" ? "Mark All as Read" : "Delete Notification"}
        description={getConfirmDescription(pendingConfirm)}
        isLoading={confirmLoading}
        cancelLabel="No"
        confirmLabel="Yes"
        loadingLabel={pendingConfirm?.type === "markAllRead" ? "Updating..." : "Deleting..."}
      />
    </div>
  );
}
