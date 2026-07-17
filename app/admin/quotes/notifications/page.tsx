"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
    Bell,
    ChevronLeft,
    CalendarDays,
    AlertCircle,
    CheckCircle2,
    DollarSign,
    TrendingDown,
    Calendar,
    MoreVertical,
} from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import Topbar from "@/components/admin/Topbar";
import { SortDateButton } from "@/components/admin/SortDateButton";

type NotificationType = "all" | "unread";

interface Notification {
    id: string;
    type: string;
    title: string;
    description: string;
    date: string;
    quoteRef: string;
    isRead: boolean;
    iconType: "alert" | "check" | "dollar" | "refund" | "calendar";
}

const mockNotifications: Notification[] = [
    {
        id: "1",
        type: "approval",
        title: "Approval Required",
        description: "Quote #Q1 edit requires admin approval - event in 3 days",
        date: "March 15, 2026",
        quoteRef: "Quote #Q1",
        isRead: false,
        iconType: "alert",
    },
    {
        id: "2",
        type: "update",
        title: "Quote Updated",
        description: "Quote #Q1 has been updated with new pricing",
        date: "March 15, 2026",
        quoteRef: "Quote #Q1",
        isRead: false,
        iconType: "check",
    },
    {
        id: "3",
        type: "payment",
        title: "Additional Payment Required",
        description: "Quote #Q1 - Additional payment of $8,000 required",
        date: "March 15, 2026",
        quoteRef: "Quote #Q1",
        isRead: false,
        iconType: "dollar",
    },
    {
        id: "4",
        type: "refund",
        title: "Refund Processing",
        description: "Refund of $1,200 approved for Quote #Q3 - will be issued as Beige credits",
        date: "March 20, 2026",
        quoteRef: "Quote #Q3",
        isRead: true,
        iconType: "refund",
    },
    {
        id: "5",
        type: "event",
        title: "Event Date Changed",
        description: "Quote #Q2 event date updated - ops team and customer notified",
        date: "March 18, 2026",
        quoteRef: "Quote #Q2",
        isRead: true,
        iconType: "calendar",
    },
];

const getIconForType = (iconType: string, isDark: boolean) => {
    switch (iconType) {
        case "alert":
            return {
                Icon: AlertCircle,
                bgClass: isDark ? "bg-[#2D2725]" : "bg-[#F5E2AF]",
                iconClass: isDark ? "text-[#E8D1AB]" : "text-[#C87913]",
            };
        case "check":
            return {
                Icon: CheckCircle2,
                bgClass: isDark ? "bg-[#1B2840]" : "bg-[#C5D9F7]",
                iconClass: isDark ? "text-[#58A6FF]" : "text-[#16a34a]",
            };
        case "dollar":
            return {
                Icon: DollarSign,
                bgClass: isDark ? "bg-[#2D2725]" : "bg-[#F5E2AF]",
                iconClass: isDark ? "text-[#E8D1AB]" : "text-[#C87913]",
            };
        case "refund":
            return {
                Icon: TrendingDown,
                bgClass: isDark ? "bg-[#17331E]" : "bg-[#D4FFE4]",
                iconClass: isDark ? "text-[#1ED760]" : "text-[#1F9D4A]",
            };
        case "calendar":
            return {
                Icon: Calendar,
                bgClass: isDark ? "bg-[#2A1F3D]" : "bg-[#EBC9F5]",
                iconClass: isDark ? "text-[#A78BFA]" : "text-[#7C3AED]",
            };
        default:
            return {
                Icon: Bell,
                bgClass: isDark ? "bg-[#2D2725]" : "bg-gray-100",
                iconClass: isDark ? "text-white" : "text-gray-600",
            };
    }
};

export default function NotificationsPage() {
    const pathname = usePathname();
    const router = useRouter();
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [filter, setFilter] = useState<NotificationType>("all");
    const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const isDark = !mounted || theme === "dark";

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const handleDateSort = (date: Date | null) => {
        setSelectedDate(date);
    };

    const filteredNotifications =
        filter === "unread"
            ? notifications.filter((n) => !n.isRead)
            : notifications;

    const handleMarkAllRead = () => {
        setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    };

    const handleClearAll = () => {
        setNotifications([]);
    };

    return (
        <div className="relative overflow-hidden">
            <Topbar
                pathname={"Notifications"}
                actions={
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleMarkAllRead}
                            className={`h-12 flex items-center gap-2 rounded-lg px-6 py-4 text-sm font-medium transition-colors ${isDark
                                ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                                : "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                                }`}
                        >
                            <CheckCircle2 size={16} />
                            Mark All Read
                        </Button>
                    </div>
                }
            />
            <div
                className={`min-h-screen px-4 pb-12 pt-6 lg:px-10 lg:pt-10 lg:pb-16 lg:pt-8 ${isDark ? "bg-[#101010] text-white" : "bg-[#F4F5F7] text-[#101010]"}`}
            >
                < button
                    onClick={() => router.back()}
                    className={`mb-6 flex items-center gap-2 text-sm transition-colors ${isDark ? "text-white/60 hover:text-white" : "text-[#101010]/60 hover:text-[#101010]"
                        }`}
                >
                    <ChevronLeft size={16} />
                    Back
                </button >
                <div className="w-full">
                    <div className="flex justify-between">
                        <div className="mb-6">
                            <h1 className={`lg:text-[22px] font-semibold ${isDark ? "text-white" : "text-[#101010]"}`}>
                                Notifications
                            </h1>
                            <p className={`mt-1 text-xs lg:text-sm ${isDark ? "text-white/70" : "text-[#101010]/70"}`}>
                                Stay updated with quote changes, approvals, payments, and important activity.
                            </p>
                        </div>
                        <SortDateButton
                            selectedDate={selectedDate}
                            onDateChange={handleDateSort}
                        />
                    </div>
                    <div className="mb-6">
                        <div
                            className={`inline-flex h-14 w-[335px] rounded-lg border p-1.5 ${isDark
                                ? "border-[#3D3D3D] bg-[#171717]"
                                : "border-[#D6D6D6] bg-[#F3F3F3]"
                                }`}
                        >
                            <button
                                onClick={() => setFilter("all")}
                                className={`flex-1 rounded text-base font-normal transition-colors ${filter === "all"
                                    ? "bg-[#E8D1AB] text-[#101010]"
                                    : isDark
                                        ? "text-white/60 hover:text-white"
                                        : "text-[#101010]/60 hover:text-[#101010]"
                                    }`}
                            >
                                All
                            </button>

                            <button
                                onClick={() => setFilter("unread")}
                                className={`flex-1 rounded text-base font-normal transition-colors ${filter === "unread"
                                    ? "bg-[#E8D1AB] text-[#101010]"
                                    : isDark
                                        ? "text-white/60 hover:text-white"
                                        : "text-[#101010]/60 hover:text-[#101010]"
                                    }`}
                            >
                                Unread
                            </button>
                        </div>
                    </div>
                    {/* <div className="mb-4 flex flex-col gap-2 lg:flex-row">
                        <div className={`h-16 w-mini-[140px] my-6 flex border-[0.5px] rounded-lg p-2 ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "bg-[#E5E5E5]"}`}>
                            <button
                                onClick={() => setFilter("all")}
                                className={`flex-1 rounded px-4 py-3 text-base font-medium transition-all ${filter === "all"
                                    ? "bg-[#E8D1AB] text-black"
                                    : isDark
                                        ? "text-white/60 hover:text-white"
                                        : "text-[#101010]/60 hover:text-[#101010]"
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilter("unread")}
                                className={`flex-1 rounded px-4 py-3 text-base font-medium transition-all ${filter === "unread"
                                    ? "bg-[#E8D1AB] text-black"
                                    : isDark
                                        ? "text-white/60 hover:text-white"
                                        : "text-[#101010]/60 hover:text-[#101010]"
                                    }`}
                            >
                                Unread
                            </button>
                        </div>
                    </div> */}

                    {/* Notifications List */}
                    < div className="space-y-3" >
                        {
                            filteredNotifications.length === 0 ? (
                                <div className={`flex flex-col items-center justify-center rounded-2xl border py-20 ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-[#E5E5E5] bg-white"
                                    }`}>
                                    <Bell size={48} className={isDark ? "text-white/20" : "text-[#101010]/20"} />
                                    <p className={`mt-4 text-sm ${isDark ? "text-white/40" : "text-[#101010]/40"}`}>
                                        No notifications
                                    </p>
                                </div>
                            ) : (
                                filteredNotifications.map((notification) => {
                                    const iconMeta = getIconForType(notification.iconType, isDark);
                                    const IconComponent = iconMeta.Icon;

                                    return (
                                        <div
                                            key={notification.id}
                                            onClick={() => router.push(`${pathname}/${notification.id}`)}
                                            className={`
                                                group flex items-start gap-4 rounded-2xl border p-4 transition-all duration-300 cursor-pointer
                                                ${isDark
                                                    ? notification.isRead
                                                        ? "bg-[#171717] border-[#3D3D3D] opacity-40"
                                                        : "bg-[#171717] border-[#3D3D3D] hover:bg-[#1B1B1B]"
                                                    : notification.isRead
                                                        ? "bg-white border-[#E5E5E5] opacity-40"
                                                        : "bg-white border-[#E5E5E5] hover:bg-[#FAFAFA]"
                                                }
                                            `}
                                        >
                                            {/* Icon */}
                                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${iconMeta.bgClass}`}
                                            >
                                                <IconComponent size={20} className={iconMeta.iconClass} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <h3 className={`text-base font-semibold ${isDark ? "text-white" : "text-[#101010]"
                                                            }`}
                                                        >
                                                            {notification.title}
                                                        </h3>

                                                        <p className={`mt-1 text-sm ${isDark
                                                            ? "text-white/60"
                                                            : "text-[#101010]/60"
                                                            }`}
                                                        >
                                                            {notification.description}
                                                        </p>
                                                    </div>

                                                    {!notification.isRead && (
                                                        <div className={`h-2 w-2 shrink-0 rounded-full ${isDark
                                                            ? "bg-[#E8D1AB]"
                                                            : "bg-[#C87913]"
                                                            }`}
                                                        />
                                                    )}
                                                </div>

                                                <div className="mt-2 flex items-center gap-3">
                                                    <span className={`text-xs ${isDark
                                                        ? "text-white/40"
                                                        : "text-[#101010]/40"
                                                        }`}
                                                    >
                                                        {notification.date}
                                                    </span>

                                                    <span className={`rounded px-2 py-0.5 text-xs ${isDark
                                                        ? "bg-white/5 text-white/60"
                                                        : "bg-black/5 text-[#101010]/60"
                                                        }`}
                                                    >
                                                        {notification.quoteRef}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )
                        }
                    </div >

                    {/* Bottom Actions */}
                    < div className="mt-8 flex gap-4" >
                        <Button
                            onClick={() => router.back()}
                            variant="outline"
                            className={`h-12 min-w-[140px] rounded-lg border-[0.5px] text-xl font-normal transition-colors ${isDark
                                ? "border-[#3D3D3D] bg-[#101010] text-white hover:bg-white/5"
                                : "border-[#000000]/10 bg-white text-[#101010] hover:bg-black/5"
                                }`}
                        >
                            Back
                        </Button>
                        <Button
                            onClick={handleClearAll}
                            className={`h-12 min-w-[140px] rounded-lg px-6 text-xl font-normal transition-colors ${isDark
                                ? "bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/90"
                                : "bg-[#E5D5B8] text-black hover:bg-[#E8D1AB]/90"
                                }`}
                        >
                            Clear All
                        </Button>
                    </div >
                </div >
            </div >
        </div>
    );
}