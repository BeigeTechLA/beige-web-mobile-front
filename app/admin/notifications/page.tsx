"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Bell, Settings, CheckCheck, Archive, BellOff, Search, FolderOpen, DollarSign, MessageSquare, Camera, FileText, X, Users } from "lucide-react";

import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
// import NotificationPreferencesModel from "@/components/notifications/NotificationPreferencesModel";

const notifications = [
    {
        id: "1",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80",
        title: "Sarah Chen uploaded final deliverables for Summer Campaign 2026",
        subtitle: "12 high-res images ready for client review",
        time: "5m ago",
        read: false,
        category: "Files",
        priority: "Critical",
        actionLabel: "Review Files",
        accentColor: "bg-red-500"
    },
    {
        id: "2",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80",
        title: "Marcus Johnson generated invoice for Project #2847",
        subtitle: "Invoice #INV-2847 - $12,500.00 due June 15, 2026",
        time: "15m ago",
        read: false,
        category: "Payments",
        priority: "High",
        actionLabel: "View Invoice",
        accentColor: "bg-yellow-500"
    },
    {
        id: "3",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&q=80",
        title: "Emily Rodriguez mentioned you in Brand Guidelines Discussion",
        subtitle: "\"@you Can we adjust the color palette for accessibility?\"",
        time: "30m ago",
        read: false,
        category: "Messages",
        priority: "High",
        actionLabel: "View Message",
        accentColor: "bg-yellow-500"
    },
    {
        id: "4",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
        title: "David Kim scheduled a shoot for Product Photography Session",
        subtitle: "May 20, 2026 at 10:00 AM - Studio B",
        time: "1h ago",
        read: true,
        category: "Shoots",
        priority: "Medium",
        actionLabel: "View Details",
        accentColor: "bg-blue-400"
    },
    {
        id: "5",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80",
        title: "Lisa Anderson approved the proposal for Q3 Marketing Strategy",
        subtitle: "Budget approved: $85,000",
        time: "3h ago",
        read: true,
        category: "Proposals",
        priority: "Medium",
        actionLabel: "Open Proposal",
        accentColor: "bg-blue-400"
    }
];

// Settings Dropdown Component
function SettingsDropdown({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [preferencesOpen, setPreferencesOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-start justify-end pt-20 pr-8">
                <div
                    ref={dropdownRef}
                    className="w-[420px] bg-black rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                        <h2 className="text-lg font-semibold text-white">Settings</h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                        {/* General Settings */}
                        <button className="w-full flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors text-left group">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                                <Users size={20} className="text-[#E8D1AB]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-white mb-1">General Settings</h3>
                                <p className="text-sm text-gray-400">Manage Language, Time Zone and other Personal Preferences</p>
                            </div>
                        </button>

                        {/* Notification Preferences */}
                        <button
                            onClick={() => router.push("/admin/notifications/preferences")}
                            className="w-full flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors text-left group">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                                <Bell size={20} className="text-[#E8D1AB]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-white mb-1">Notification Preferences</h3>
                                <p className="text-sm text-gray-400">Manage how and when you receive notifications</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default function NotificationsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("All");

    useEffect(() => setMounted(true), []);
    const isDark = !mounted || theme === "dark";

    // Helper to get icon for category
    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'Files': return <FolderOpen size={14} className="mr-1.5" />;
            case 'Payments': return <DollarSign size={14} className="mr-1.5" />;
            case 'Messages': return <MessageSquare size={14} className="mr-1.5" />;
            case 'Shoots': return <Camera size={14} className="mr-1.5" />;
            case 'Proposals': return <FileText size={14} className="mr-1.5" />;
            default: return <Bell size={14} className="mr-1.5" />;
        }
    };

    // Helper for priority badge styling
    const getPriorityStyle = (p: string) => {
        if (p === 'Critical') return "text-red-500 bg-red-500/10 border-red-500/20";
        if (p === 'High') return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
        if (p === 'Medium') return "text-blue-400 bg-blue-400/10 border-blue-400/20";
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    };

    const unreadNotificationCount = notifications.filter(
        (notification) => !notification.read
    ).length;

    return (
        <div className={`min-h-screen ${isDark ? "bg-[#0f0f0f]" : "bg-white"}`}>
            <Topbar
                pathname={pathname}
                actions={
                    <div className="flex items-center gap-3">
                        {/* Settings Button */}
                        <button
                            onClick={() => setSettingsOpen(true)}
                            className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all ${isDark ? "bg-[#171717] border-[#2B2B2B] text-white hover:bg-[#222]" : "bg-white border-gray-200 text-black hover:bg-gray-50"
                                }`}
                        >
                            <Settings size={18} strokeWidth={2} />
                        </button>

                        {/* Mark All Read Button */}
                        <Button
                            onClick={() => { }}
                            className="bg-[#E8D1AB] text-black hover:bg-[#dcb98a] h-10 px-4 rounded-lg font-medium text-sm flex items-center gap-2"
                        >
                            <CheckCheck size={16} />
                            Mark all as read
                        </Button>
                    </div>
                }
            />

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-8 py-4 bg-[#E8D1AB1A] border-b border-[#E8D1AB] gap-4">
                <h1 className="text-xl font-semibold text-[#E5D5B8]">{unreadNotificationCount} unread notifications</h1>
                <div className="flex items-center gap-6">
                    <button className="flex items-center gap-2 text-sm text-white hover:text-[#E5D5B8] transition-colors">
                        <Archive size={16} /> Archive
                    </button>
                    <button className="flex items-center gap-2 text-sm text-white hover:text-[#E5D5B8] transition-colors">
                        <BellOff size={16} /> Mute
                    </button>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto p-6 lg:p-8 pt-4">

                {/* Search Bar */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search Notifications..."
                        className={`w-full h-12 pl-11 pr-4 rounded-xl border outline-none focus:ring-1 focus:ring-[#E8D1AB]/50 transition-all ${isDark ? "bg-[#202020] border-[#FFFFFF]/20 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-black"
                            }`}
                    />
                </div>

                {/* Tabs */}
                <div className={`border rounded-xl overflow-hidden mb-6 ${isDark ? "border-[#2B2B2B] bg-[#171717]" : "border-gray-200 bg-white"}`}>
                    <div className="flex overflow-x-auto no-scrollbar border-b border-[#2B2B2B]">
                        {["All", "Unread", "Mentions", "Payments", "Projects", "Files"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors relative ${activeTab === tab
                                    ? "text-[#E8D1AB]"
                                    : "text-gray-400 hover:text-white"
                                    }`}
                            >
                                {tab}
                                {/* Badges */}
                                <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab ? "bg-[#E8D1AB]/20 text-[#E8D1AB]" : "bg-[#2B2B2B] text-gray-400"
                                    }`}>
                                    {tab === 'All' && '10'}
                                    {tab === 'Unread' && '02'}
                                    {tab === 'Mentions' && '01'}
                                    {tab === 'Payments' && '02'}
                                    {tab === 'Projects' && '02'}
                                    {tab === 'Files' && '02'}
                                </span>
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E8D1AB]" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Notification List */}
                    <div className="divide-y divide-[#2B2B2B]">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                onClick={() => router.push(`notifications/${n.id}`)}
                                className={`group relative flex items-start gap-4 p-5 cursor-pointer transition-colors hover:bg-[#1A1A1A] ${!n.read ? "bg-[#202020]" : "bg-transparent"}`}
                            >
                                {/* Left Accent Border for Unread */}
                                {/* {!n.read && ( */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${n.accentColor}`} />
                                {/* )} */}

                                {/* Avatar */}
                                <img src={n.avatar} alt={n.title} className="w-10 h-10 rounded-full object-cover shrink-0 mt-1" />

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-4 mb-1">
                                        <h3 className={`text-sm leading-snug ${!n.read ? "text-white font-medium" : "text-gray-300 font-normal"}`}>
                                            {n.title}
                                        </h3>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-xs text-gray-500">{n.time}</span>
                                            {!n.read && <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-500 mb-3 truncate">{n.subtitle}</p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {/* Category Pill */}
                                            <span className={`flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${isDark ? "bg-[#222] border-[#333] text-gray-300" : "bg-gray-100 border-gray-200 text-gray-700"
                                                }`}>
                                                {getCategoryIcon(n.category)}
                                                {n.category}
                                            </span>

                                            {/* Priority Pill */}
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getPriorityStyle(n.priority)}`}>
                                                {n.priority}
                                            </span>
                                        </div>

                                        {/* Action Button */}
                                        <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#E8D1AB] text-black hover:bg-[#dcb98a] transition-colors">
                                            {n.actionLabel}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Settings Dropdown Modal */}
            <SettingsDropdown
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
            />
        </div>
    );
}
