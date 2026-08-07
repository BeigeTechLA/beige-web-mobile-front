"use client";
import React, { useState } from "react";
import {
  ArrowLeft,
  Camera,
  DollarSign,
  MessageSquare,
  Calendar,
  FileText,
  Folder,
  Settings as SettingsIcon,
  Smartphone,
  Mail,
  Info,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  isDark: boolean;
}

function Toggle({ checked, onChange, isDark }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-[#E8D1AB]" : isDark ? "bg-zinc-700" : "bg-zinc-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

interface CategoryItem {
  key: string;
  icon: React.ElementType;
  title: string;
  description: string;
}

const CATEGORIES: CategoryItem[] = [
  { key: "shoots", icon: Camera, title: "Shoots", description: "Shoot schedules, assignments, and updates" },
  { key: "payments", icon: DollarSign, title: "Payments", description: "Invoices, payment receipts, and reminders" },
  { key: "messages", icon: MessageSquare, title: "Messages", description: "Direct messages and mentions" },
  { key: "meetings", icon: Calendar, title: "Meetings", description: "Meeting invites, reminders, and updates" },
  { key: "proposals", icon: FileText, title: "Proposals", description: "Proposal shares, approvals, and feedback" },
  { key: "files", icon: Folder, title: "Files", description: "File uploads, shares, and review requests" },
  { key: "system", icon: SettingsIcon, title: "System", description: "System alerts and account updates" },
];

interface NotificationPreferencesProps {
  /** Called when the user clicks Back. Defaults to router.back(). */
  onBack?: () => void;
}

export default function NotificationPreferences({ onBack }: NotificationPreferencesProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const isDark = theme === "dark";
  const handleBack = onBack ?? (() => router.back());

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [categories, setCategories] = useState<Record<string, boolean>>(
    Object.fromEntries(CATEGORIES.map((c) => [c.key, true]))
  );

  const toggleCategory = (key: string) =>
    setCategories((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
  <>
      <Topbar
        pathname="/admin/dashboard/NotificationPreferences"
        breadcrumbOverrides={{
          notifications: "Notifications Preferences",
        }}
      />
      <div className={`mx-auto max-w-full px-4 sm:px-6 py-4 ${isDark ? "text-white" : "text-[#101010]"}`}>
        {/* Back link */}
        <button
          onClick={handleBack}
          className={`mb-6 flex items-center gap-2 text-sm transition-colors ${
            isDark ? "text-white/70 hover:text-white" : "text-black/60 hover:text-black"
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div
            className={`rounded-2xl border p-6 sm:p-8 ${
              isDark ? "border-[#2A2A2A] bg-[#171717]" : "border-[#E5E5E5] bg-white"
            }`}
          >
            {/* Header */}
            <h1 className="text-xl font-semibold">Notification Channels</h1>
            <p className={`mt-1 text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>
              Choose how you want to receive notifications
            </p>

            {/* Push Notifications */}
            <div
              className={`mt-6 flex items-center justify-between rounded-xl border p-4 ${
                isDark ? "border-[#2A2A2A] bg-[#1B1B1B]" : "border-[#EEEEEE] bg-[#FAFAFA]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    isDark ? "bg-zinc-800" : "bg-zinc-100"
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Push Notifications</p>
                  <p className={`text-xs ${isDark ? "text-white/50" : "text-black/50"}`}>
                    Receive notifications on your mobile device
                  </p>
                </div>
              </div>
              <Toggle checked={pushEnabled} onChange={() => setPushEnabled((v) => !v)} isDark={isDark} />
            </div>

            {/* Select Categories */}
            <p
              className={`mb-3 mt-8 text-xs font-medium uppercase tracking-wide ${
                isDark ? "text-white/40" : "text-black/40"
              }`}
            >
              Select Categories
            </p>

            <div
              className={`divide-y rounded-xl border ${
                isDark ? "divide-[#2A2A2A] border-[#2A2A2A]" : "divide-[#EEEEEE] border-[#EEEEEE]"
              }`}
            >
              {CATEGORIES.map(({ key, icon: Icon, title, description }) => (
                <div key={key} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${
                        isDark ? "bg-zinc-800" : "bg-zinc-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className={`text-xs ${isDark ? "text-white/50" : "text-black/50"}`}>
                        {description}
                      </p>
                    </div>
                  </div>
                  <Toggle checked={categories[key]} onChange={() => toggleCategory(key)} isDark={isDark} />
                </div>
              ))}
            </div>

            {/* Email Notifications */}
            <div
              className={`mt-6 flex items-center justify-between rounded-xl border p-4 ${
                isDark ? "border-[#2A2A2A] bg-[#1B1B1B]" : "border-[#EEEEEE] bg-[#FAFAFA]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    isDark ? "bg-zinc-800" : "bg-zinc-100"
                  }`}
                >
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className={`text-xs ${isDark ? "text-white/50" : "text-black/50"}`}>
                    Receive notifications via email
                  </p>
                </div>
              </div>
              <Toggle checked={emailEnabled} onChange={() => setEmailEnabled((v) => !v)} isDark={isDark} />
            </div>

            {/* Smart Delivery note */}
            <div
              className={`mt-6 flex items-start gap-3 rounded-xl border p-4 ${
                isDark
                  ? "border-blue-500/20 bg-blue-500/10"
                  : "border-blue-200 bg-blue-50"
              }`}
            >
              <Info className={`mt-0.5 h-4 w-4 shrink-0 ${isDark ? "text-blue-300" : "text-blue-600"}`} />
              <div>
                <p className={`text-sm font-medium ${isDark ? "text-blue-200" : "text-blue-700"}`}>
                  Smart Delivery
                </p>
                <p className={`mt-0.5 text-xs ${isDark ? "text-blue-200/70" : "text-blue-600/80"}`}>
                  Critical notifications are always sent via push and email, regardless of your
                  preferences. We also suppress notifications when you&apos;re actively using the
                  app to reduce interruptions.
                </p>
              </div>
            </div>

            {/* Future Ready */}
            <div className={`mt-8 border-t pt-6 ${isDark ? "border-[#2A2A2A]" : "border-[#EEEEEE]"}`}>
              <div className="mb-4 flex items-center gap-2">
                <h2 className="text-sm font-semibold">Future Ready</h2>
                <span className="flex items-center gap-1 rounded-full bg-[#E8D1AB] px-2 py-0.5 text-[10px] font-medium text-black">
                  <Sparkles className="h-3 w-3" />
                  Coming Soon
                </span>
              </div>

              <div className="space-y-3">
                <div
                  className={`rounded-xl border p-4 opacity-60 ${
                    isDark ? "border-[#2A2A2A] bg-[#1B1B1B]" : "border-[#EEEEEE] bg-[#FAFAFA]"
                  }`}
                >
                  <p className="text-sm font-medium">AI Notification Summaries</p>
                  <p className={`mt-0.5 text-xs ${isDark ? "text-white/50" : "text-black/50"}`}>
                    Get smart digests like &quot;3 files uploaded and 2 approvals pending&quot;
                  </p>
                </div>

                <div
                  className={`rounded-xl border p-4 opacity-60 ${
                    isDark ? "border-[#2A2A2A] bg-[#1B1B1B]" : "border-[#EEEEEE] bg-[#FAFAFA]"
                  }`}
                >
                  <p className="text-sm font-medium">Workflow Automation</p>
                  <p className={`mt-0.5 text-xs ${isDark ? "text-white/50" : "text-black/50"}`}>
                    Build custom rules like &quot;If proposal approved → notify finance team&quot;
                  </p>
                </div>
              </div>
          </div>
        </div>
      </div>
  </>
  );
}