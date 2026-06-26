"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { X, Clock, Tag, ExternalLink, Mail, BellOff } from "lucide-react";

export default function NotificationDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);
    const isDark = !mounted || theme === "dark";

    // Mock data for ID "1" (Critical Files notification)
    const notification = {
        id: "1",
        priority: "CRITICAL PRIORITY",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80",
        sender: "Sarah Chen",
        role: "Creative Director",
        time: "29m ago",
        action: "Sarah Chen uploaded final deliverables for Summer Campaign 2026",
        details: "12 high-res images ready for client review",
        category: "Files",
        type: "Project",
        timelineDate: "14/05/2026, 15:46:42"
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
                onClick={() => router.back()}
            />

            {/* Modal Container */}
            <div className={`relative w-full max-w-[500px] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
                isDark ? "bg-[#0A0A0A] border border-[#222]" : "bg-white border border-gray-200"
            }`}>
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4 border-b border-[#222]">
                    <h2 className="text-xl font-bold text-white">Notification Details</h2>
                    <button 
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2A2A2A] transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    
                    {/* Priority Banner */}
                    <div className="w-full bg-red-900/20 border border-red-900/30 rounded-lg px-4 py-3 flex items-center gap-2">
                        <Tag size={16} className="text-red-500" />
                        <span className="text-red-500 text-xs font-bold tracking-wide uppercase">{notification.priority}</span>
                    </div>

                    {/* Sender Info */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img src={notification.avatar} alt={notification.sender} className="w-12 h-12 rounded-full object-cover border border-[#333]" />
                            <div>
                                <h3 className="text-white font-medium text-sm">{notification.sender} ({notification.role})</h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                            <Clock size={14} />
                            {notification.time}
                        </div>
                    </div>

                    {/* Action & Details */}
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Action</p>
                            <p className="text-sm text-gray-300 leading-relaxed">{notification.action}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Details</p>
                            <p className="text-sm text-gray-300 leading-relaxed">{notification.details}</p>
                        </div>
                    </div>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-[#222]">
                        <div>
                            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Category</p>
                            <p className="text-sm text-white font-medium">{notification.category}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Type</p>
                            <p className="text-sm text-white font-medium">{notification.type}</p>
                        </div>
                    </div>

                    {/* Primary Action Button */}
                    <button className="w-full h-12 bg-[#E8D1AB] text-black rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#dcb98a] transition-colors">
                        <ExternalLink size={16} />
                        Review Files
                    </button>

                    {/* Secondary Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <button className="h-11 border border-[#333] rounded-xl text-gray-300 text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#1A1A1A] hover:text-white transition-colors">
                            <Mail size={16} />
                            Mark Unread
                        </button>
                        <button className="h-11 border border-[#333] rounded-xl text-gray-300 text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#1A1A1A] hover:text-white transition-colors">
                            <BellOff size={16} />
                            Mute Similar
                        </button>
                    </div>

                    {/* Timeline */}
                    <div className="pt-2">
                        <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Timeline</p>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
                                <span className="text-gray-300">Notification created</span>
                            </div>
                            <span className="text-gray-500 text-xs">{notification.timelineDate}</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}