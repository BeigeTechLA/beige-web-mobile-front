"use client";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import StudioCard from "./StudioCard";
import { studioApi } from "@/lib/api";

export default function StudioListing() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [studios, setStudios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => setMounted(true), []);
    const isDark = !mounted || theme === "dark";

    useEffect(() => {
        const fetchStudios = async () => {
            try {
                const userCookie = Cookies.get("revure_user");
                const user = userCookie ? JSON.parse(userCookie) : null;
                const userId = user?.id || user?.user_id;

                if (!userId) return;

                const res = await studioApi.getStudiosByUser(userId);
                if (res.success && res.data) {
                    setStudios(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch studios:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStudios();
    }, []);

    const formatStudio = (studio: any) => ({
        id: studio.id?.toString(),
        name: studio.info?.space_title || studio.info?.brand_name ||
            `Studio - ${studio.address?.city || studio.id}`,
        price: studio.budget?.hourly_rate || 0,
        overtimeRate: studio.budget?.overtime_rate ? `$${studio.budget.overtime_rate}/hour` : "N/A",
        minimumBooking: studio.budget?.minimum_booking ? `${studio.budget.minimum_booking} Hours` : "N/A",
        bufferTiming: studio.budget?.buffer_time ? `${studio.budget.buffer_time} Minutes` : "N/A",
        shootTypes: studio.budget?.categories?.map((c: any) => c.name) || [],
        status: studio.status === "published" ? "Active" as const : "Inactive" as const,
        images: studio.media?.map((m: any) => m.url) || [],
        city: studio.address?.city || "",
        country: studio.address?.country || "",
        raw: studio,
    });
    return (
        <div className={`rounded-xl border p-5 ${isDark ? "border-white/10 bg-[#111]" : "border-[#E5E5E5] bg-white"}`}>
            {/* Header Row */}
            <div className="flex justify-between items-center mb-5">
                <div className={`flex items-center gap-2 ${isDark ? "text-white" : "text-[#101010]"}`}>
                    <span className="h-5 w-[3px] rounded-full bg-[#E5D5B8]" />
                    <span className="text-sm font-medium lg:text-base">
                    Studio Listing
                    </span>
                </div>
                <div className="flex gap-2">
                    {["All", "Month", "Status"].map((filter) => (
                        <button
                            key={filter}
                            className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1 ${isDark ? "border-white/10 text-white/60 bg-transparent hover:text-white" : "border-black/10 text-black/60 hover:text-black"}`}
                        >
                            {filter} <span className="text-[10px]">▾</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Cards */}
            {loading ? (
                <div className={`text-center py-10 text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>
                    Loading studios...
                </div>
            ) : studios.length === 0 ? (
                <div className={`text-center py-10 text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>
                    No studios found.
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {studios.map((studio) => (
                        <StudioCard key={studio.id} studio={formatStudio(studio)} />
                    ))}
                </div>
            )}
        </div>
    );
}
