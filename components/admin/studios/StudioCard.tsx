"use client";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Eye, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

type Studio = {
    id: string;
    name: string;
    price: number;
    overtimeRate: string;
    minimumBooking: string;
    bufferTiming: string;
    shootTypes: string[];
    status: "Active" | "Inactive";
    images: string[];
    raw?: unknown;
};

export default function StudioCard({ studio }: { studio: Studio }) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    useEffect(() => setMounted(true), []);
    const isDark = !mounted || theme === "dark";
    const detailHref = `/admin/studios/${studio.id}`;

    useEffect(() => {
        router.prefetch(detailHref);
    }, [detailHref, router]);

    const openStudio = () => {
        try {
            window.sessionStorage.setItem(
                `studio_detail_${studio.id}`,
                JSON.stringify(studio.raw ?? studio)
            );
        } catch (error) {
            console.warn("Unable to cache studio detail:", error);
        }

        router.push(detailHref);
    };

    return (
        <div 
         onClick={openStudio}
        className={`rounded-xl p-5 flex gap-6 ${isDark ? "bg-[#1a1a1a] border border-white/10" : "bg-white border border-[#E5E5E5]"}`}>

            {/* Images Section */}
            <div className="flex flex-col gap-2 w-[240px] shrink-0">
                <div className="w-full h-[170px] rounded-xl overflow-hidden relative bg-white/5 flex items-center justify-center">
                    {studio.images[0] && !studio.images[0].startsWith('blob:') ? (
                        <Image
                            src={studio.images[0]}
                            alt={studio.name}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <span className="text-white/20 text-xs">No Image</span>
                    )}
                </div>
                <div className="flex gap-2">
                    {studio.images.slice(1, 4).map((img, i) => (
                        <div key={i} className="w-1/3 h-[75px] rounded-xl overflow-hidden relative bg-white/5 flex items-center justify-center">
                            {img && !img.startsWith('blob:') ? (
                                <Image src={img} alt="" fill className="object-cover" />
                            ) : (
                                <span className="text-white/10 text-[10px]">—</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Info Section */}
            <div className="flex-1 flex flex-col py-1">
                <div className="flex-1">
                    {/* Status Badge */}
                    <span className="text-sm px-5 py-1.5 rounded-full font-medium mb-4 inline-block border bg-[#F0FFF4] text-[#22C55E] border-[#22C55E]/20">
                        {studio.status}
                    </span>

                    {/* Name + Price */}
                    <div className="flex justify-between items-center mb-4">
                        <h3 className={`text-xl font-semibold ${isDark ? "text-white" : "text-[#101010]"}`}>
                            {studio.name}
                        </h3>
                        <span className={`text-xl font-bold ${isDark ? "text-[#E5D5B8]" : "text-[#101010]"}`}>
                            ${studio.price}/Hour
                        </span>
                    </div>
                    <hr className={isDark ? "border-white/10" : "border-black/10"} />

                    {/* Stats Row — pipe separated */}
                    <div className="flex items-start gap-0 text-sm mb-5">
                        <div className="pr-6">
                            <p className={`text-xs mb-1 ${isDark ? "text-white/40" : "text-black/40"}`}>Overtime Rate:</p>
                            <p className={isDark ? "text-white/80" : "text-black/80"}>{studio.overtimeRate}</p>
                        </div>
                        <span className={`mx-2 mt-4 text-lg leading-none ${isDark ? "text-white/20" : "text-black/20"}`}>|</span>
                        <div className="px-6">
                            <p className={`text-xs mb-1 ${isDark ? "text-white/40" : "text-black/40"}`}>Minimum Booking:</p>
                            <p className={isDark ? "text-white/80" : "text-black/80"}>{studio.minimumBooking}</p>
                        </div>
                        <span className={`mx-2 mt-4 text-lg leading-none ${isDark ? "text-white/20" : "text-black/20"}`}>|</span>
                        <div className="pl-6">
                            <p className={`text-xs mb-1 ${isDark ? "text-white/40" : "text-black/40"}`}>Buffer Timing:</p>
                            <p className={isDark ? "text-white/80" : "text-black/80"}>{studio.bufferTiming}</p>
                        </div>
                        <hr className={isDark ? "border-white/10" : "border-black/10"} />
                    </div>
                   

                    {/* Shoot Types */}
                    <div className="mb-4">
                        <p className={`text-xs font-semibold mb-2 ${isDark ? "text-white/60" : "text-black/60"}`}>
                            Supported Shoot Types
                        </p>
                        <div className="flex gap-2 flex-wrap">
                            {studio.shootTypes.map((type) => (
                                <span
                                    key={type}
                                    className={`text-sm px-4 py-1.5 rounded-lg border ${isDark ? "border-white/10 text-white/70" : "border-black/10 text-black/70"}`}
                                >
                                    {type}
                                </span>
                            ))}
                        </div>
                    </div>

                    <hr className={isDark ? "border-white/10" : "border-black/10"} />
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center mt-4">
                    <button className={`text-sm flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${isDark ? "border-[#E5D5B8]/20 text-[#E5D5B8] hover:bg-[#E5D5B8]/5" : "border-black/10 text-black/70 hover:text-black"}`}>
                        Preview Studio <Eye size={15} />
                    </button>
                    <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); router.push(`/admin/studios/add?editId=${studio.id}`); }}
                        className="bg-[#E5D5B8] text-black text-xs font-medium flex items-center gap-1.5 hover:bg-[#d4c3a3]"
                    >
                        Edit <Pencil size={12} />
                    </Button>
                </div>
            </div>
        </div>
    );
}
