"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCheck,
  CreditCard,
  FileCheck,
  FolderOpen,
  Hexagon,
  Mail,
  MessageSquare,
  MonitorCog,
  RotateCcw,
  ShieldCheck,
  Sun,
  Video,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { adminApi } from "@/lib/api";

const STORAGE_KEY = "beige-admin-notification-preferences";

const categories = [
  { key: "shoots", label: "Shoots", note: "Shoot schedules, assignments, and updates", icon: Video },
  { key: "payments", label: "Payments", note: "Invoices, payment receipts, and reminders", icon: CreditCard },
  { key: "messages", label: "Messages", note: "Direct messages and mentions", icon: MessageSquare },
  { key: "meetings", label: "Meetings", note: "Meeting invites, reminders, and updates", icon: CalendarDays },
  { key: "proposals", label: "Proposals", note: "Proposal shares, approvals, and feedback", icon: FileCheck },
  { key: "files", label: "Files", note: "File uploads, shares, and review requests", icon: FolderOpen },
  { key: "system", label: "System", note: "System alerts and account updates", icon: MonitorCog },
] as const;

type CategoryKey = typeof categories[number]["key"];

type Preferences = {
  push: boolean;
  email: boolean;
  categories: Record<CategoryKey, boolean>;
};

const defaultPreferences: Preferences = {
  push: true,
  email: false,
  categories: {
    shoots: true,
    payments: true,
    messages: true,
    meetings: true,
    proposals: true,
    files: true,
    system: true,
  },
};

function readPreferences(): Preferences {
  if (typeof window === "undefined") return defaultPreferences;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPreferences;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      push: parsed.push ?? defaultPreferences.push,
      email: parsed.email ?? defaultPreferences.email,
      categories: {
        ...defaultPreferences.categories,
        ...(parsed.categories || {}),
      },
    };
  } catch {
    return defaultPreferences;
  }
}

function AppHeader({
  title,
  unreadCount,
  onMarkAllRead,
}: {
  title: string;
  unreadCount: number;
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
        <button className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-[#101010] text-white sm:h-11 sm:w-11">
          <span className="relative grid h-7 w-7 place-items-center">
            <Hexagon size={24} strokeWidth={2.1} />
            <span className="absolute h-1.5 w-1.5 rounded-full bg-white" />
          </span>
        </button>
        <Image src="/images/avatar.png" alt="User" width={44} height={44} className="hidden rounded-full sm:block" />
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

function BeigeSwitch({
  checked,
  onCheckedChange,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Switch
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
      className="h-6 w-10 border border-white/10 bg-white/20 data-[state=checked]:bg-[#E5D5B8] data-[state=unchecked]:bg-white/20 [&>span]:h-4 [&>span]:w-4 [&>span]:bg-white [&>span]:data-[state=checked]:translate-x-4"
    />
  );
}

export default function NotificationPreferencesPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [unreadCount, setUnreadCount] = useState(0);
  const enabledCategories = useMemo(
    () => categories.filter((category) => preferences.categories[category.key]).length,
    [preferences.categories],
  );

  useEffect(() => {
    setPreferences(readPreferences());
    adminApi.getUnreadNotificationCount().then((response) => {
      if (!response?.error) setUnreadCount(Number(response.unread_count || 0));
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const updatePreference = (updater: (current: Preferences) => Preferences, message: string) => {
    setPreferences((current) => updater(current));
    toast.success(message);
  };

  const markAllRead = async () => {
    const response = await adminApi.markAllNotificationsRead();
    if (response?.error) {
      toast.error(response.message || "Failed to mark notifications as read");
      return;
    }
    setUnreadCount(0);
    toast.success(response.message || "All notifications marked as read");
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    toast.success("Notification preferences reset");
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#121212] text-white">
      <AppHeader title="Notifications Preferences" unreadCount={unreadCount} onMarkAllRead={markAllRead} />
      <main className="w-full px-4 py-5 sm:px-6 sm:py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <button
            type="button"
            onClick={resetPreferences}
            className="flex h-10 items-center gap-2 rounded-md border border-white/10 px-3 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>

        <section className="w-full rounded-[12px] border border-white/10 bg-[#171717] p-4 sm:p-5 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Notification Channels</h2>
              <p className="mt-1 text-sm text-white/55">Choose how you want to receive notifications</p>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#E5D5B8]">
              {enabledCategories}/{categories.length} categories on
            </span>
          </div>

          <div className="mt-6 overflow-hidden rounded-[10px] border border-white/10 bg-[#101010]">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 p-4">
              <div className="flex min-w-0 items-center gap-4">
                <span className="grid h-9 w-9 place-items-center rounded-md bg-[#EAF2FF] text-[#2E72D2]">
                  <Bell size={18} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">Push Notifications</h3>
                  <p className="mt-1 text-xs text-white/45">Receive notifications on your mobile device</p>
                </div>
              </div>
              <span className="shrink-0">
                <BeigeSwitch
                  checked={preferences.push}
                  onCheckedChange={(checked) =>
                    updatePreference((current) => ({ ...current, push: checked }), checked ? "Push notifications enabled" : "Push notifications disabled")
                  }
                />
              </span>
            </div>

            <div className="px-4 pb-3 pt-3">
              <p className="mb-2 text-xs font-semibold text-white/70">Select Categories</p>
              <div className="divide-y divide-white/10">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <div key={category.key} className="flex items-center justify-between gap-4 py-3">
                      <div className="flex min-w-0 items-center gap-4">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white/[0.04] text-white/65">
                          <Icon size={17} />
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold">{category.label}</h4>
                          <p className="mt-1 break-words text-xs text-white/45">{category.note}</p>
                        </div>
                      </div>
                      <span className="shrink-0">
                        <BeigeSwitch
                          checked={preferences.categories[category.key]}
                          disabled={!preferences.push}
                          onCheckedChange={(checked) =>
                            updatePreference(
                              (current) => ({
                                ...current,
                                categories: {
                                  ...current.categories,
                                  [category.key]: checked,
                                },
                              }),
                              `${category.label} notifications ${checked ? "enabled" : "disabled"}`,
                            )
                          }
                        />
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4 rounded-[10px] border border-white/10 bg-[#101010] p-4">
            <div className="flex min-w-0 items-center gap-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#F2E6FF] text-[#8F43E8]">
                <Mail size={18} />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">Email Notifications</h3>
                <p className="mt-1 text-xs text-white/45">Receive notifications via email</p>
              </div>
            </div>
            <span className="shrink-0">
              <BeigeSwitch
                checked={preferences.email}
                onCheckedChange={(checked) =>
                  updatePreference((current) => ({ ...current, email: checked }), checked ? "Email notifications enabled" : "Email notifications disabled")
                }
              />
            </span>
          </div>

          <div className="mt-4 flex gap-3 rounded-[8px] border border-[#9BC7FF] bg-[#EAF4FF] p-4 text-[#2E72D2]">
            <ShieldCheck size={18} className="mt-0.5 shrink-0" />
            <p className="text-xs leading-5">
              <span className="block font-semibold">Smart Delivery</span>
              Critical notifications are always sent via push and email, regardless of your preferences. We also suppress notifications when you are actively using the app to reduce interruptions.
            </p>
          </div>

          <div className="my-8 border-t border-dashed border-white/20" />

          <div>
            <div className="mb-4 flex items-center gap-3">
              <h3 className="font-semibold">Future Ready</h3>
              <span className="rounded-full bg-[#F2E6FF] px-3 py-1 text-xs font-semibold text-[#8F43E8]">Coming Soon</span>
            </div>
            <div className="space-y-3">
              <div className="rounded-[8px] border border-white/10 bg-[#101010] p-4">
                <h4 className="text-sm font-semibold">AI Notification Summaries</h4>
                <p className="mt-2 text-xs text-white/45">Get smart digests like 3 files uploaded and 2 approvals pending</p>
              </div>
              <div className="rounded-[8px] border border-white/10 bg-[#101010] p-4">
                <h4 className="text-sm font-semibold">Workflow Automation</h4>
                <p className="mt-2 text-xs text-white/45">Build custom rules like If proposal approved, notify finance team</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
