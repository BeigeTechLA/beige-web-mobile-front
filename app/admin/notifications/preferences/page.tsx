"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Smartphone,
    Camera,
    DollarSign,
    MessageSquare,
    Calendar,
    FileText,
    FolderOpen,
    Settings,
    Mail,
    Info,
    Sparkles,
    Workflow
} from "lucide-react";
import Topbar from "@/components/admin/Topbar";

// Switch Component
function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) {
    return (
        <button
            type="button"
            onClick={() => onCheckedChange(!checked)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? "bg-[#E8D1AB]" : "bg-white/20"
                }`}
        >
            <span
                className={`pointer-events-none block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? "translate-x-5" : "translate-x-0"
                    }`}
            />
        </button>
    );
}

// Category Row Component
function CategoryRow({
    icon: Icon,
    title,
    description,
    checked,
    onCheckedChange
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between py-3 px-4 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                    <Icon size={16} className="text-white/50" />
                </div>
                <div>
                    <h4 className="text-sm font-medium text-white">{title}</h4>
                    <p className="text-xs text-white/50">{description}</p>
                </div>
            </div>
            <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </div>
    );
}

export default function NotificationPreferencesPage() {
    const router = useRouter();
    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [categories, setCategories] = useState({
        shoots: true,
        payments: true,
        messages: true,
        meetings: true,
        proposals: true,
        files: true,
        system: true
    });

    const handleCategoryChange = (key: keyof typeof categories) => {
        setCategories(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="min-h-screen bg-[#111111]">
            <Topbar
                pathname="/notifications/preferences"
                actions={null}
            />

            <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-8">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors mb-6"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                {/* Main Card */}
                <div className="rounded-2xl border border-white/10 bg-[#171717] p-6 lg:p-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-xl font-semibold text-white mb-1">Notification Channels</h1>
                        <p className="text-sm text-white/50">Choose how you want to receive notifications</p>
                    </div>

                    {/* Push Notifications Card */}
                    <div className="rounded-xl border border-white/10 bg-[#111111] p-4 mb-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[#E8D1AB]/10 flex items-center justify-center">
                                    <Smartphone size={18} className="text-[#E8D1AB]" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-white">Push Notifications</h3>
                                    <p className="text-xs text-white/50">Receive notifications on your mobile device</p>
                                </div>
                            </div>
                            <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
                        </div>
                    </div>

                    {/* Select Categories Section */}
                    <div className="mb-2">
                        <h3 className="text-xs font-medium text-white/60 mb-3 px-1">Select Categories</h3>
                        <div className="rounded-xl border border-white/10 bg-[#111111] divide-y divide-white/5">
                            <CategoryRow
                                icon={Camera}
                                title="Shoots"
                                description="Shoot schedules, assignments, and updates"
                                checked={categories.shoots}
                                onCheckedChange={() => handleCategoryChange("shoots")}
                            />
                            <CategoryRow
                                icon={DollarSign}
                                title="Payments"
                                description="Invoices, payment receipts, and reminders"
                                checked={categories.payments}
                                onCheckedChange={() => handleCategoryChange("payments")}
                            />
                            <CategoryRow
                                icon={MessageSquare}
                                title="Messages"
                                description="Direct messages and mentions"
                                checked={categories.messages}
                                onCheckedChange={() => handleCategoryChange("messages")}
                            />
                            <CategoryRow
                                icon={Calendar}
                                title="Meetings"
                                description="Meeting invites, reminders, and updates"
                                checked={categories.meetings}
                                onCheckedChange={() => handleCategoryChange("meetings")}
                            />
                            <CategoryRow
                                icon={FileText}
                                title="Proposals"
                                description="Proposal shares, approvals, and feedback"
                                checked={categories.proposals}
                                onCheckedChange={() => handleCategoryChange("proposals")}
                            />
                            <CategoryRow
                                icon={FolderOpen}
                                title="Files"
                                description="File uploads, shares, and review requests"
                                checked={categories.files}
                                onCheckedChange={() => handleCategoryChange("files")}
                            />
                            <CategoryRow
                                icon={Settings}
                                title="System"
                                description="System alerts and account updates"
                                checked={categories.system}
                                onCheckedChange={() => handleCategoryChange("system")}
                            />
                        </div>
                    </div>

                    {/* Email Notifications Card */}
                    <div className="rounded-xl border border-white/10 bg-[#111111] p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                    <Mail size={18} className="text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-white">Email Notifications</h3>
                                    <p className="text-xs text-white/50">Receive notifications via email</p>
                                </div>
                            </div>
                            <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
                        </div>
                    </div>
                </div>

                {/* Smart Delivery Banner */}
                <div className="mt-4 rounded-xl bg-[#EAF2FF] border border-blue-200/10 p-4">
                    <div className="flex gap-3">
                        <div className="shrink-0">
                            <Info size={18} className="text-blue-500 mt-0.5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-blue-600 mb-1">Smart Delivery</h3>
                            <p className="text-sm text-blue-600/80 leading-relaxed">
                                Critical notifications are always sent via push and email, regardless of your preferences.
                                We also suppress notifications when you're actively using the app to reduce interruptions.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Dashed Divider */}
                <div className="my-8 border-t border-dashed border-white/10" />

                {/* Future Ready Section */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-lg font-semibold text-white">Future Ready</h2>
                        <span className="px-3 py-1 rounded-full bg-[#D9B8FF]/20 text-[#D9B8FF] text-xs font-medium border border-[#D9B8FF]/30">
                            Coming Soon
                        </span>
                    </div>

                    {/* AI Notification Summaries Card */}
                    <div className="rounded-xl border border-white/10 bg-[#171717] p-4 mb-3 opacity-60">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                <Sparkles size={18} className="text-white/50" />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-white mb-1">AI Notification Summaries</h3>
                                <p className="text-xs text-white/50">Get smart digests like "3 files uploaded and 2 approvals pending"</p>
                            </div>
                        </div>
                    </div>

                    {/* Workflow Automation Card */}
                    <div className="rounded-xl border border-white/10 bg-[#171717] p-4 opacity-60">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                <Workflow size={18} className="text-white/50" />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-white mb-1">Workflow Automation</h3>
                                <p className="text-xs text-white/50">Build custom rules like "If proposal approved → notify finance team"</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}