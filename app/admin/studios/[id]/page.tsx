"use client";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useParams, usePathname, useRouter } from "next/navigation";
import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, ArrowLeft } from "lucide-react";
import StudioDetailHeader from "@/components/admin/studios/StudioDetailHeader";
import StudioDetailTabs from "@/components/admin/studios/StudioDetailTabs";
import StudioOverviewTab from "@/components/admin/studios/StudioOverviewTab";
import AvailabilityTab from "@/components/admin/studios/AvailabilityTab";
import GalleryTab from "@/components/admin/studios/GalleryTab";
import { studioApi } from "@/lib/api";
import { getStudioRecord, type StudioRecord } from "@/components/admin/studios/studioDetailUtils";

const getCachedStudio = (studioId?: string) => {
    if (!studioId || typeof window === "undefined") return null;

    try {
        const cached = window.sessionStorage.getItem(`studio_detail_${studioId}`);
        return cached ? getStudioRecord(JSON.parse(cached), studioId) : null;
    } catch (error) {
        console.warn("Unable to read cached studio detail:", error);
        return null;
    }
};

const cacheStudio = (studioId: string | undefined, studio: StudioRecord) => {
    if (!studioId || typeof window === "undefined") return;

    try {
        window.sessionStorage.setItem(`studio_detail_${studioId}`, JSON.stringify(studio));
    } catch (error) {
        console.warn("Unable to cache studio detail:", error);
    }
};

export default function StudioDetailPage() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const isDark = !mounted || theme === "dark";
    const pathname = usePathname();
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const studioId = params?.id;
    const [activeTab, setActiveTab] = useState("Overview");
    const [studio, setStudio] = useState<StudioRecord | null>(() => getCachedStudio(studioId));
    const [loadingStudio, setLoadingStudio] = useState(() => !getCachedStudio(studioId));
    const [studioError, setStudioError] = useState("");

    useEffect(() => {
        if (!studioId) return;
        const cachedStudio = getCachedStudio(studioId);
        if (cachedStudio) {
            setStudio(cachedStudio);
        }

        const fetchStudio = async () => {
            setLoadingStudio(!cachedStudio);
            setStudioError("");
            if (!cachedStudio) setStudio(null);

            try {
                const res = await studioApi.getStudioById(Number(studioId));
                const studioRecord = getStudioRecord(res, studioId);
                if (!studioRecord) {
                    setStudioError("Studio not found.");
                    return;
                }
                setStudio(studioRecord);
                cacheStudio(studioId, studioRecord);
            } catch (err) {
                console.error("Failed to fetch studio:", err);
                if (!cachedStudio) setStudioError("Failed to load studio details.");
            } finally {
                setLoadingStudio(false);
            }
        };

        void fetchStudio();
    }, [studioId]);

    return (
        <>
            <Topbar
                pathname={pathname}
                actions={
                    <div className="flex items-center gap-2">
                        <button className={`text-sm flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${isDark ? "border-[#E5D5B8]/20 text-[#E5D5B8] hover:bg-[#E5D5B8]/5" : "border-black/10 text-black/70"}`}>
                            Preview Studio <Eye size={15} />
                        </button>
                        <Button
                            onClick={() => router.push(`/admin/studios/add?editId=${studioId}`)}
                            className="bg-[#E5D5B8] text-black text-sm font-medium flex items-center gap-1.5 hover:bg-[#d4c3a3]"
                        >
                            Edit Studio <Pencil size={14} />
                        </Button>
                    </div>
                }
            />

            <div className={`p-4 lg:p-6 lg:px-10 lg:py-9 overflow-hidden pb-30 ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {/* Back Button */}
               <button
                             onClick={() => router.back()}
                             className={`flex items-center gap-2 transition-colors mb-6 text-sm ${isDark ? "text-white/60 hover:text-white" : "text-black hover:text-black/60 "}`}
                           >
                             <ArrowLeft size={16} />
                             Back
                           </button>

                {loadingStudio && (
                    <div className={`rounded-xl p-6 mb-4 animate-pulse ${isDark ? "bg-[#1a1a1a] border border-white/10" : "bg-white border border-[#E5E5E5]"}`}>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-5">
                                <div className={`h-[120px] w-[120px] rounded-xl ${isDark ? "bg-white/10" : "bg-black/10"}`} />
                                <div>
                                    <div className={`mb-3 h-7 w-64 rounded ${isDark ? "bg-white/10" : "bg-black/10"}`} />
                                    <div className={`mb-3 h-4 w-44 rounded ${isDark ? "bg-white/10" : "bg-black/10"}`} />
                                    <div className={`mb-6 h-4 w-56 rounded ${isDark ? "bg-white/10" : "bg-black/10"}`} />
                                    <div className="flex gap-2">
                                        <div className={`h-9 w-28 rounded-lg ${isDark ? "bg-white/10" : "bg-black/10"}`} />
                                        <div className={`h-9 w-28 rounded-lg ${isDark ? "bg-white/10" : "bg-black/10"}`} />
                                        <div className={`h-9 w-24 rounded-lg ${isDark ? "bg-white/10" : "bg-black/10"}`} />
                                    </div>
                                </div>
                            </div>
                            <div className={`h-12 w-28 rounded-full ${isDark ? "bg-white/10" : "bg-black/10"}`} />
                        </div>
                        <div className={`mt-8 h-px w-full ${isDark ? "bg-white/10" : "bg-black/10"}`} />
                    </div>
                )}

                {!loadingStudio && studioError && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                        {studioError}
                    </div>
                )}

                {!loadingStudio && !studioError && studio && (
                    <>
                        {/* Header Card */}
                        <StudioDetailHeader isDark={isDark} studio={studio} />

                        {/* Tabs */}
                        <StudioDetailTabs activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} />

                        {/* Tab Content */}
                        {activeTab === "Overview" && <StudioOverviewTab isDark={isDark} studio={studio} />}
                        {activeTab === "Availability" && <AvailabilityTab isDark={isDark} />}
                        {activeTab === "Gallery" && <GalleryTab isDark={isDark} studio={studio} />}
                    </>
                )}
            </div>
        </>
    );
}
