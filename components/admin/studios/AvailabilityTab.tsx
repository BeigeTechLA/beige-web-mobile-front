"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

// Static data
const STATIC_AVAILABILITY: Record<string, { shoot?: string; conflict?: boolean }> = {
    "2026-01-17": { shoot: "12:00 PM" },
    "2026-01-20": { shoot: "06:00 AM" },
    "2026-01-26": { conflict: true },
    "2026-01-29": { shoot: "04:00 PM" },
    "2026-01-30": { shoot: "10:00 AM" },
};

function Legend({ color, label, desc, isDark }: { color: string; label: string; desc: string; isDark: boolean }) {
    return (
        <div className="flex items-start gap-3">
            <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
            <div>
                <p className={`text-sm font-medium mb-1 ${isDark ? "text-[#E0E0E0]" : "text-[#3A3A3A]"}`}>{label}</p>
                <p className={`text-xs ${isDark ? "text-[#666]" : "text-[#929292]"}`}>{desc}</p>
            </div>
        </div>
    );
}

export default function AvailabilityTab({ isDark }: { isDark: boolean }) {
    const [currentMonth, setCurrentMonth] = useState(1);   // January
    const [currentYear, setCurrentYear] = useState(2026);

    const handleMonthChange = (dir: "prev" | "next") => {
        if (dir === "prev") {
            if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(y => y - 1); }
            else setCurrentMonth(m => m - 1);
        } else {
            if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(y => y + 1); }
            else setCurrentMonth(m => m + 1);
        }
    };

    const monthLabel = new Date(currentYear, currentMonth - 1).toLocaleString("default", { month: "long", year: "numeric" });
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const cells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    return (
        <div className="grid grid-cols-12 gap-6 py-4">

            {/* ── Calendar ── */}
            <div className="col-span-12 lg:col-span-9">
                <div className={`border rounded-2xl overflow-hidden ${isDark ? "bg-[#101010] border-[#333]" : "bg-white border-gray-200"}`}>

                    {/* Controls */}
                    <div className={`p-4 lg:p-6 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${isDark ? "border-white/5" : "border-gray-100"}`}>
                        <div className="flex items-center gap-4">
                            <button onClick={() => handleMonthChange("prev")}
                                className={`h-8 w-8 flex items-center justify-center rounded-md border transition-colors ${isDark ? "bg-black border-white/10 text-white/60 hover:bg-white/5" : "bg-[#F0F0F0] border-[#E3E3E3] text-black"}`}>
                                <ChevronLeft size={18} />
                            </button>
                            <span className={`text-base lg:text-lg font-bold tracking-tight min-w-[160px] text-center ${isDark ? "text-white" : "text-black"}`}>
                                {monthLabel}
                            </span>
                            <button onClick={() => handleMonthChange("next")}
                                className={`h-8 w-8 flex items-center justify-center rounded-md border transition-colors ${isDark ? "bg-black border-white/10 text-white/60 hover:bg-white/5" : "bg-[#F0F0F0] border-[#E3E3E3] text-black"}`}>
                                <ChevronRight size={18} />
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm"
                                className={`px-4 py-2 border rounded-lg text-sm ${isDark ? "bg-transparent border-white/10 text-white/60 hover:text-white" : "bg-[#F0F0F0] border-[#E3E3E3] text-gray-600"}`}
                                onClick={() => { setCurrentMonth(new Date().getMonth() + 1); setCurrentYear(new Date().getFullYear()); }}>
                                Today
                            </Button>
                            <Button variant="outline" size="sm"
                                className={`px-4 py-2 border rounded-lg text-sm ${isDark ? "bg-transparent border-white/10 text-white/60 hover:text-white" : "bg-[#F0F0F0] border-[#E3E3E3] text-gray-600"}`}>
                                Sort by <ChevronLeft className="rotate-[-90deg] ml-2" size={14} />
                            </Button>
                        </div>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                            <div key={d} className={`py-3 text-center text-[10px] font-bold uppercase tracking-widest border-b border-r last:border-r-0 ${isDark ? "text-white/30 bg-black/40 border-[#333]" : "text-[#7C7777] bg-[#EDEBEB] border-gray-100"}`}>
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Date cells */}
                    <div className="grid grid-cols-7">
                        {cells.map((date, i) => {
                            if (!date) return (
                                <div key={`e-${i}`} className={`h-28 border ${isDark ? "bg-[#0D0D0D]/50 border-white/5" : "bg-[#F4F4F4] border-[#E5E5E5]"}`} />
                            );

                            const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
                            const data = STATIC_AVAILABILITY[dateStr];
                            const isToday = dateStr === todayStr;

                            return (
                                <div key={date} className={`h-28 p-3 border text-xs transition-all ${isDark ? "bg-[#111] border-white/5 hover:bg-[#1A1A1A]" : "bg-white border-[#E5E5E5] hover:bg-gray-50"}`}>
                                    {/* Date number */}
                                    <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold mb-2 ${isToday ? "bg-[#E8D1AB] text-black" : isDark ? "text-white/70" : "text-black/70"}`}>
                                        {date}
                                    </div>
                                    {/* Event chips */}
                                    {data?.shoot && (
                                        <div className="flex items-center gap-1 mt-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                            <span className={`text-[11px] truncate ${isDark ? "text-blue-300" : "text-blue-600"}`}>{data.shoot}</span>
                                        </div>
                                    )}
                                    {data?.conflict && (
                                        <div className="flex items-center gap-1 mt-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                            <span className={`text-[11px] truncate ${isDark ? "text-red-300" : "text-red-600"}`}>Conflict</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Sidebar ── */}
            <div className="col-span-12 lg:col-span-3 space-y-4">

                {/* Color Legend */}
                <div className={`border rounded-2xl p-4 lg:p-6 ${isDark ? "bg-[#101010] border-[#333]" : "bg-white border-gray-200"}`}>
                    <h3 className={`font-medium mb-4 ${isDark ? "text-white" : "text-black"}`}>Color Legend</h3>
                    <div className="space-y-4">
                        <Legend color={isDark ? "bg-[#444]" : "bg-[#ECE7E2]"} label="Disabled" desc="Time off or blocked" isDark={isDark} />
                        <Legend color="bg-[#A8A29E]" label="Today's" desc="Time off or blocked" isDark={isDark} />
                        <Legend color="bg-blue-500" label="Shoots" desc="Confirmed shoots" isDark={isDark} />
                        <Legend color="bg-[#EF4444]" label="Conflicts" desc="Scheduling conflicts" isDark={isDark} />
                    </div>
                </div>

                {/* This Month */}
                <div className={`border rounded-2xl p-4 lg:p-6 ${isDark ? "bg-[#101010] border-[#333]" : "bg-white border-gray-200"}`}>
                    <h3 className={`font-medium mb-4 ${isDark ? "text-white" : "text-black"}`}>This Month</h3>
                    <div className="space-y-2">
                        {[
                            { label: "Available Days", value: "18" },
                            { label: "Booked Shoots", value: "7" },
                            { label: "Time Off", value: "3 days" },
                        ].map(row => (
                            <div key={row.label} className={`flex items-center justify-between p-3 rounded-lg ${isDark ? "bg-[#1A1A1A]" : "bg-[#F0F0F0]"}`}>
                                <span className="text-[#999] text-sm">{row.label}</span>
                                <span className={`text-sm font-medium ${isDark ? "text-white" : "text-[#303030]"}`}>{row.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Share Availability */}
                <div className={`border rounded-2xl p-4 lg:p-6 ${isDark ? "bg-[#101010] border-[#333]" : "bg-white border-gray-200"}`}>
                    <h3 className={`font-medium mb-2 ${isDark ? "text-white" : "text-black"}`}>Share Availability</h3>
                    <p className={`text-sm mb-4 ${isDark ? "text-[#888]" : "text-gray-500"}`}>Share your availability link with production teams</p>
                    <Button className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${isDark ? "bg-[#E5D5B8] text-black hover:bg-[#d4c3a3]" : "bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/80"}`}>
                        <Copy size={16} />
                        Copy Link
                    </Button>
                </div>
            </div>
        </div>
    );
}