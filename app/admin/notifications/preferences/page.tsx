"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Camera, DollarSign, File, Folder, Info, Mail, MessageSquare, Settings, Smartphone } from "lucide-react";
import { useTheme } from "next-themes";

import Topbar from "@/components/admin/Topbar";
import NotificationHeaderActions from "@/components/admin/notifications/NotificationHeaderActions";
import { readNotificationPreferences, writeNotificationPreferences, type NotificationPreferences } from "@/components/admin/notifications/notificationStore";

const categories = [
  { key: "Shoots", description: "Shoot schedules, assignments, and updates", icon: Camera },
  { key: "Payments", description: "Invoices, payment receipts, and reminders", icon: DollarSign },
  { key: "Messages", description: "Direct messages and mentions", icon: MessageSquare },
  { key: "Meetings", description: "Meeting invites, reminders, and updates", icon: CalendarDays },
  { key: "Proposals", description: "Proposal shares, approvals, and feedback", icon: File },
  { key: "Files", description: "File uploads, shares, and review requests", icon: Folder },
  { key: "System", description: "System alerts and account updates", icon: Settings },
];

function GoldSwitch({
  checked,
  onChange,
  isDark,
  disabled = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  isDark: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-10 rounded-full transition ${
        checked ? "bg-[#E8D1AB]" : isDark ? "bg-[#4B4B4B]" : "bg-[#D1D1D1]"
      } ${
        disabled
          ? "cursor-not-allowed opacity-45"
          : "cursor-pointer"
      }`}
    >
      <span
        className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-[5px] bg-white shadow transition-all ${
          checked ? "left-5" : "left-1"
        }`}
      />
    </button>
  );
}

export default function NotificationPreferencesPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences>(() => readNotificationPreferences());

  useEffect(() => setMounted(true), []);
  useEffect(() => setPrefs(readNotificationPreferences()), []);

  const isDark = !mounted || theme === "dark";

  const updatePrefs = (next: NotificationPreferences) => {
    setPrefs(next);
    writeNotificationPreferences(next);
  };

  const setCategory = (key: string, value: boolean) => {
    updatePrefs({ ...prefs, categories: { ...prefs.categories, [key]: value } });
  };

  return (
    <>
      <Topbar pathname={pathname} title="Notifications Preferences" actions={<NotificationHeaderActions showMarkAll={false} />} />

      <main className={`min-h-screen px-4 py-6 lg:px-9 lg:py-8 ${isDark ? "bg-transparent" : "bg-[#F4F5F7]"}`} style={{ fontFamily: "var(--font-instrument-sans)" }}>
        <button
          type="button"
          onClick={() => router.push("/admin/notifications")}
          className={`mb-7 flex items-center gap-2 text-sm ${isDark ? "text-white/85" : "text-black/75"}`}
        >
          <ArrowLeft size={18} /> Back
        </button>

        <section className={`rounded-2xl border p-4 sm:p-7 ${isDark ? "border-[#303030] bg-[#171717]" : "border-[#E3E3E3] bg-white"}`}>
          <div className="mb-5">
            <h1 className={`text-xl font-semibold ${isDark ? "text-white" : "text-black"}`}>Notification Channels</h1>
            <p className={`mt-1 text-sm ${isDark ? "text-white/45" : "text-black/45"}`}>Choose how you want to receive notifications</p>
          </div>

          <div className={`overflow-hidden rounded-xl border ${isDark ? "border-[#333333] bg-[#101010]" : "border-[#E5E5E5] bg-white"}`}>
            <div className={`flex items-center justify-between gap-4 border-b px-4 py-4 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#DDE9FF] text-[#2F68FF]"><Smartphone size={18} /></span>
                <div>
                  <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>Push Notifications</p>
                  <p className={`mt-0.5 text-xs ${isDark ? "text-white/40" : "text-black/45"}`}>Receive notifications on your mobile device</p>
                </div>
              </div>
              <GoldSwitch checked={prefs.pushEnabled} onChange={(value) => updatePrefs({ ...prefs, pushEnabled: value })} isDark={isDark} />
            </div>

            <div className="px-4 py-3">
              <p className={`mb-2 text-xs font-medium ${isDark ? "text-white/80" : "text-black/70"}`}>Select Categories</p>
              <div className="space-y-1">
                {categories.map(({ key, description, icon: Icon }) => (
                  <div
                    key={key}
                    className={`flex items-center justify-between gap-4 py-2 transition-opacity ${
                      prefs.pushEnabled ? "opacity-100" : "opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          isDark ? "bg-[#1C1C1C] text-white/55" : "bg-[#F2F2F2] text-black/55"
                        }`}
                      >
                        <Icon size={17} />
                      </span>
                      <div>
                        <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>{key}</p>
                        <p className={`mt-0.5 text-xs ${isDark ? "text-white/40" : "text-black/45"}`}>{description}</p>
                      </div>
                    </div>

                    <GoldSwitch
                      checked={prefs.categories[key] ?? true}
                      onChange={(value) => setCategory(key, value)}
                      isDark={isDark}
                      disabled={!prefs.pushEnabled}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`mt-3 flex items-center justify-between gap-4 rounded-xl border px-4 py-4 ${isDark ? "border-[#333333] bg-[#101010]" : "border-[#E5E5E5] bg-white"}`}>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F2DDFE] text-[#B126FF]"><Mail size={18} /></span>
              <div>
                <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>Email Notifications</p>
                <p className={`mt-0.5 text-xs ${isDark ? "text-white/40" : "text-black/45"}`}>Receive notifications via email</p>
              </div>
            </div>
            <GoldSwitch checked={prefs.emailEnabled} onChange={(value) => updatePrefs({ ...prefs, emailEnabled: value })} isDark={isDark} />
          </div>

          <div className={`mt-3 flex gap-3 rounded-xl border px-4 py-4 ${isDark ? "border-[#24436F] bg-[#13243D] text-[#A9C9FF]" : "border-[#C9DAF4] bg-[#E6F0FF] text-[#214A9A]"}`}>
            <Info size={18} className="mt-0.5 shrink-0" />
            <div className="text-xs leading-5">
              <p className="font-medium">Smart Delivery</p>
              <p>Critical notifications are always sent via push and email, regardless of your preferences. We also suppress notifications when you&apos;re actively using the app to reduce interruptions.</p>
            </div>
          </div>

          <div className={`my-7 border-t border-dashed ${isDark ? "border-white/15" : "border-black/10"}`} />

          <div className="flex items-center gap-3">
            <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>Future Ready</h2>
            <span className="rounded-full bg-[#F2DDFE] px-3 py-1 text-xs font-medium text-[#A02DD6]">Coming Soon</span>
          </div>

          <div className="mt-4 space-y-3">
            <div className={`rounded-xl border px-4 py-4 ${isDark ? "border-[#333333] bg-[#101010]" : "border-[#E5E5E5] bg-white"}`}>
              <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>AI Notification Summaries</p>
              <p className={`mt-1 text-xs ${isDark ? "text-white/40" : "text-black/45"}`}>Get smart digests like &quot;3 files uploaded and 2 approvals pending&quot;</p>
            </div>
            <div className={`rounded-xl border px-4 py-4 ${isDark ? "border-[#333333] bg-[#101010]" : "border-[#E5E5E5] bg-white"}`}>
              <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>Workflow Automation</p>
              <p className={`mt-1 text-xs ${isDark ? "text-white/40" : "text-black/45"}`}>Build custom rules like &quot;If proposal approved → notify finance team&quot;</p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
