"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { affiliateApi, adminApi } from "@/lib/api";
import Cookies from "js-cookie";

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

export default function AffiliateRecentActivity() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            const token = Cookies.get("revure_token");
            if (!token) return;

            try {
                const response = await affiliateApi.getRecentActivity(token, 10);
                if (!response.error) {
                    // Handle various data structures from API
                    const apiData = response.data || response;
                    const dataArray = Array.isArray(apiData) ? apiData : (apiData.items || apiData.data || []);

                    const mappedActivities = dataArray.map((item: any, index: number) => ({
                        id: item.id || `activity-${index}`,
                        color: COLORS[index % COLORS.length],
                        title: item.title || item.action || "Activity Update",
                        description: item.description || item.text || item.activity_text || "No description provided",
                        time: item.timestamp || item.created_at || item.updated_at ? formatTime(item.timestamp || item.created_at || item.updated_at) : "Just now",
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

    return (
        <div className="w-full bg-[#171717] rounded-2xl text-white border border-[#3D3D3D] md:h-[392px] flex flex-col overflow-hidden">
            {/* Header (fixed) */}
            <div className="bg-[#101010] flex justify-between items-center border-b border-[#3D3D3D] p-5 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-[3px] h-6 bg-[#E5D5B8]" />
                    <h2 className="">Recent Activity</h2>
                </div>

                <button className="flex items-center gap-2 bg-[#1A1A1A] border border-white/10 px-4 py-2 rounded-full text-xs text-white/70 hover:bg-white/5 transition-colors">
                    View All
                    <ChevronDown size={14} />
                </button>
            </div>

            {/* Timeline (scrollable) */}
            <div className="relative flex-1 overflow-y-auto px-5 py-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="animate-spin text-[#E5D5B8]" size={24} />
                    </div>
                ) : activities.length > 0 ? (
                    activities.map((activity, index) => (
                        <div key={activity.id} className="relative flex gap-4">
                            {/* Timeline line */}
                            {index !== activities.length - 1 && (
                                <span className="absolute left-[7px] top-6 h-full w-px bg-white/15" />
                            )}

                            {/* Dot */}
                            <span
                                className={`mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ${activity.color} shadow-[0_0_0_4px_rgba(255,255,255,0.05)]`}
                            />

                            {/* Content */}
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-[#E5D5B8] mb-0.5">
                                    {activity.title}
                                </p>
                                <p className="text-[11px] text-white/60 leading-relaxed line-clamp-2">
                                    {activity.description}
                                </p>
                            </div>

                            {/* Time */}
                            <span className="whitespace-nowrap text-[10px] text-white/40 mt-0.5">
                                {activity.time}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="flex justify-center items-center h-full text-white/40 text-sm">
                        No recent activity
                    </div>
                )}
            </div>
        </div>
    );
}
