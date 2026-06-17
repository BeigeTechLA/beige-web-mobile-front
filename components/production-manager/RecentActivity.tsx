"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/api";
import { useTheme } from "next-themes";

type Activity = {
    id: number;
    color: string;
    title: string;
    description: string;
    time: string;
};

const COLORS = [
    "bg-[#A989EF]",
    "bg-emerald-400",
    "bg-yellow-400",
    "bg-pink-400",
    "bg-blue-400",
];

export default function RecentActivity() {
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setMounted(true);
        const fetchActivities = async () => {
            try {
                const response = await adminApi.getRecentActivity(10);
                if (!response.error && response.data) {
                    const data = Array.isArray(response.data) ? response.data : (response.data.items || []);
                    const mappedActivities = data.map((item: any, index: number) => ({
                        id: index,
                        color: COLORS[index % COLORS.length],
                        title: item.title || "Activity Update",
                        description: item.description || item.text || item.activity_text,
                        time: item.timestamp || item.created_at ? formatTime(item.timestamp || item.created_at) : "Just now",
                    }));
                    setActivities(mappedActivities);
                }
            } catch (error) {
                console.error("Failed to fetch activities:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, []);

    const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

    const formatTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

            if (diffInSeconds < 0) return "Just now";
            if (diffInSeconds < 60) return "Just now";
            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
            if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hrs ago`;
            if (diffInSeconds < 172800) return "Yesterday";

            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        } catch (e) {
            return "Recently";
        }
    };

    if (!mounted) return null;

    return (
        <div className={`w-full rounded-2xl md:h-[392px] flex flex-col overflow-hidden border transition-all duration-300 ${isDark ? "bg-[#171717] text-white border-[#3D3D3D]" : "bg-white text-[#000000] border-[#E5E5E5]"
            }`}>
            {/* Header (fixed) */}
            <div className={`flex justify-between items-center p-5 shrink-0 border-b transition-colors duration-300 ${isDark ? "bg-[#101010] border-[#3D3D3D]" : "bg-[#FFFCF6] border-[#E5E5E5]"
                }`}>
                <div className="flex items-center gap-2">
                    <div className="w-[3px] h-6 bg-[#E5D5B8]" />
                    <h2 className={`${isDark ? "text-white" : "text-[#000000]"}`}>Recent Activity</h2>
                </div>

                {/* <button className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs transition-colors border ${isDark
                        ? "bg-[#1A1A1A] border-white/10 text-white/70 hover:bg-white/5"
                        : "bg-white border-[#E5E5E5] text-[#333] hover:bg-[#FAFAFA]"
                    }`}>
                    View All
                    <ChevronDown size={14} />
                </button> */}
            </div>

            {/* Timeline (scrollable) */}
            <div className="relative flex-1 overflow-y-auto px-5 py-4 space-y-6 no-scrollbar">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className={`animate-spin ${isDark ? "text-[#E5D5B8]" : "text-[#BFA780]"}`} size={24} />
                    </div>
                ) : activities.length > 0 ? (
                    activities.map((activity, index) => (
                        <div key={activity.id} className="relative flex gap-4">
                            {/* Timeline line */}
                            {index !== activities.length - 1 && (
                                <span className={`absolute left-[7px] top-6 h-full w-px ${isDark ? "bg-white/15" : "bg-black/10"}`} />
                            )}

                            {/* Dot */}
                            <span
                                className={`mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ${activity.color} shadow-[0_0_0_4px_rgba(255,255,255,0.05)]`}
                            />

                            {/* Content */}
                            <div className="flex-1 max-w-3/5">
                                <p className={`text-xs font-semibold mb-0.5 ${isDark ? "text-[#E5D5B8]" : "text-[#B18A00]"}`}>
                                    {activity.title}
                                </p>
                                <p className={`text-[11px] leading-relaxed line-clamp-2 ${isDark ? "text-white/60" : "text-[#666]"}`}>
                                    {activity.description}
                                </p>
                            </div>

                            {/* Time */}
                            <span className={`whitespace-nowrap text-[10px] mt-0.5 ${isDark ? "text-white/40" : "text-[#999]"}`}>
                                {activity.time}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className={`flex justify-center items-center h-full text-sm ${isDark ? "text-white/40" : "text-[#999]"}`}>
                        No recent activity
                    </div>
                )}
            </div>
        </div>
    );
}